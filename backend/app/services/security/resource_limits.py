"""Per-agent resource monitoring (FAZ 7.2 + Sprint 6.2): CPU/RAM/Disk takibi.

Sprint 6.2: hard kill artik destekleniyor:
  - Bir agent icin spawn'lanmis child process'leri kayit altina al (track_pid)
  - Threshold asilirsa kill_agent_processes() bunlari sonlandirir
  - Ana FastAPI process'i ASLA olmedirilmez
"""
from __future__ import annotations

import logging
import os
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set

logger = logging.getLogger(__name__)


@dataclass
class ResourceSnapshot:
    cpu_percent: float = 0.0
    rss_mb: float = 0.0
    disk_mb: float = 0.0
    timestamp: float = 0.0


@dataclass
class AgentLimits:
    cpu_pct_warn: float = 80.0  # %
    rss_mb_warn: float = 1024.0  # 1GB
    disk_mb_warn: float = 1024.0
    # Sprint 6.2: hard kill esikleri (warn'dan yuksek olmali)
    cpu_pct_kill: float = 95.0
    rss_mb_kill: float = 4096.0  # 4GB
    samples: list[ResourceSnapshot] = field(default_factory=list)
    # Bu agent tarafindan tetiklenmis subprocess PID'leri
    tracked_pids: Set[int] = field(default_factory=set)


class ResourceMonitor:
    def __init__(self) -> None:
        self._agents: Dict[str, AgentLimits] = {}

    @property
    def available(self) -> bool:
        try:
            import psutil  # noqa: F401
            return True
        except ImportError:
            return False

    def _get_process(self):
        try:
            import psutil
            return psutil.Process(os.getpid())
        except Exception:
            return None

    def snapshot(self) -> ResourceSnapshot:
        proc = self._get_process()
        if not proc:
            return ResourceSnapshot(timestamp=time.time())
        try:
            cpu = proc.cpu_percent(interval=None)
            mem = proc.memory_info()
            return ResourceSnapshot(
                cpu_percent=cpu,
                rss_mb=mem.rss / (1024 * 1024),
                timestamp=time.time(),
            )
        except Exception:
            return ResourceSnapshot(timestamp=time.time())

    def check_agent(self, agent_id: str, *, limits: Optional[AgentLimits] = None) -> Optional[str]:
        """Bir snapshot al, limitleri gec ise warning mesaj doner."""
        if not self.available:
            return None
        snap = self.snapshot()
        a = self._agents.setdefault(agent_id, limits or AgentLimits())
        a.samples.append(snap)
        if len(a.samples) > 50:
            a.samples = a.samples[-50:]

        warnings: list[str] = []
        if snap.cpu_percent > a.cpu_pct_warn:
            warnings.append(f"CPU yuksek: {snap.cpu_percent:.1f}%")
        if snap.rss_mb > a.rss_mb_warn:
            warnings.append(f"RAM yuksek: {snap.rss_mb:.0f}MB")

        if warnings:
            msg = " | ".join(warnings)
            logger.warning("Agent %s kaynak uyari: %s", agent_id, msg)
            return msg
        return None

    def stats(self, agent_id: str) -> Dict[str, float]:
        a = self._agents.get(agent_id)
        if not a or not a.samples:
            return {}
        last = a.samples[-1]
        avg_cpu = sum(s.cpu_percent for s in a.samples) / len(a.samples)
        avg_rss = sum(s.rss_mb for s in a.samples) / len(a.samples)
        return {
            "cpu_percent_last": last.cpu_percent,
            "cpu_percent_avg": avg_cpu,
            "rss_mb_last": last.rss_mb,
            "rss_mb_avg": avg_rss,
            "samples": len(a.samples),
            "tracked_processes": float(len(a.tracked_pids))}

    # ============================================================
    # Sprint 6.2: Hard kill desteği
    # ============================================================

    def track_pid(self, agent_id: str, pid: int) -> None:
        """Bir agent'in spawnladığı subprocess PID'sini izlemeye al."""
        a = self._agents.setdefault(agent_id, AgentLimits())
        a.tracked_pids.add(pid)

    def untrack_pid(self, agent_id: str, pid: int) -> None:
        a = self._agents.get(agent_id)
        if a and pid in a.tracked_pids:
            a.tracked_pids.discard(pid)

    def kill_agent_processes(self, agent_id: str, *, reason: str = "limit_exceeded") -> List[int]:
        """Bir agent'a baglı tüm tracked process'leri sonlandır.
        Ana FastAPI process'i ASLA hedef alinmaz.
        """
        if not self.available:
            return []
        try:
            import psutil  # type: ignore
        except ImportError:
            return []

        a = self._agents.get(agent_id)
        if not a:
            return []
        my_pid = os.getpid()
        killed: List[int] = []
        for pid in list(a.tracked_pids):
            if pid == my_pid:
                # Asla ana process'i oldurme
                a.tracked_pids.discard(pid)
                continue
            try:
                p = psutil.Process(pid)
                p.terminate()
                try:
                    p.wait(timeout=3)
                except psutil.TimeoutExpired:
                    p.kill()
                killed.append(pid)
                logger.warning("Agent %s tracked PID %s sonlandirildi (%s)", agent_id, pid, reason)
            except psutil.NoSuchProcess:
                pass  # zaten yok
            except Exception as exc:
                logger.warning("PID %s sonlandirma hata: %s", pid, exc)
            finally:
                a.tracked_pids.discard(pid)
        return killed

    def enforce_limits(self, agent_id: str, *, limits: Optional[AgentLimits] = None) -> Optional[str]:
        """check_agent + hard kill esiği kontrolü.

        Eger CPU veya RAM kill esigini astiysa tracked process'leri sonlandirir
        ve asla ana FastAPI process'ini oldurmez.
        """
        warn = self.check_agent(agent_id, limits=limits)
        a = self._agents.get(agent_id)
        if not a or not a.samples:
            return warn
        last = a.samples[-1]
        kill_now = (
            last.cpu_percent > a.cpu_pct_kill or last.rss_mb > a.rss_mb_kill
        )
        if kill_now and a.tracked_pids:
            killed = self.kill_agent_processes(agent_id, reason="hard_limit_exceeded")
            return f"{warn or ''} [HARD KILL: {len(killed)} process sonlandirildi]".strip()
        return warn


# Singleton
resource_monitor = ResourceMonitor()