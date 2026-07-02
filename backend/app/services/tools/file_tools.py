"""Dosya sistemi tool'lari: read_file, write_file, list_dir, append_file."""
from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any, Dict, List

from app.services.security import expand_path
from app.services.tools.base import BaseTool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


def _safe_path(p: str) -> Path:
    """Path uret — env variable + ~ genislemesiyle birlikte mutlak Path."""
    return expand_path(p)


class ReadFileTool(BaseTool):
    name = "read_file"
    description = (
        "Diskten bir text dosyasinin icerigini okur. "
        "Kullanici 'X dosyasini oku', 'Y'nin icindekini goster' gibi istediginde kullan. "
        "Cok buyuk dosyalar icin offset/limit kullan."
    )
    permission = "file_system"
    parameters = {
        "type": "object",
        "properties": {
            "path": {"type": "string", "description": "Okunacak dosya yolu (mutlak veya goreceli)."},
            "max_chars": {
                "type": "integer",
                "description": "En fazla kac karakter okunsun (varsayilan 8000).",
                "default": 8000}},
        "required": ["path"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        raw = (args.get("path") or "").strip()
        if not raw:
            return ToolResult(ok=False, error="Dosya yolu bos olamaz")
        max_chars = int(args.get("max_chars") or 8000)
        max_chars = max(100, min(max_chars, 200_000))

        try:
            path = _safe_path(raw)
            if not path.exists():
                return ToolResult(ok=False, error=f"Dosya bulunamadi: {path}")
            if not path.is_file():
                return ToolResult(ok=False, error=f"Bu bir dosya degil: {path}")
            content = path.read_text(encoding="utf-8", errors="replace")
            truncated = False
            if len(content) > max_chars:
                content = content[:max_chars]
                truncated = True
            output = f"# {path}\n\n{content}"
            if truncated:
                output += f"\n\n... [{max_chars} karakterde kesildi]"
            return ToolResult(
                ok=True,
                output=output,
                data={"path": str(path), "size": path.stat().st_size, "truncated": truncated},
            )
        except Exception as exc:
            logger.exception("read_file hatasi")
            return ToolResult(ok=False, error=f"Dosya okunamadi: {exc}")


class WriteFileTool(BaseTool):
    name = "write_file"
    description = (
        "Bir dosyaya icerik yazar (uzerine yazar veya yeni olusturur). "
        "Eksik dizinler otomatik olusturulur. Kullanici 'X dosyasi olustur', "
        "'Y'ye su icerigi yaz' dediginde kullan."
    )
    permission = "file_system"
    requires_confirmation = False
    parameters = {
        "type": "object",
        "properties": {
            "path": {"type": "string", "description": "Yazilacak dosya yolu."},
            "content": {"type": "string", "description": "Dosyaya yazilacak metin icerik."}},
        "required": ["path", "content"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        raw = (args.get("path") or "").strip()
        content = args.get("content")
        if not raw:
            return ToolResult(ok=False, error="Dosya yolu bos olamaz")
        if content is None:
            return ToolResult(ok=False, error="Icerik verilmedi")

        try:
            path = _safe_path(raw)
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(str(content), encoding="utf-8")
            return ToolResult(
                ok=True,
                output=f"'{path}' dosyasina {len(str(content))} karakter yazildi.",
                data={"path": str(path), "bytes": path.stat().st_size},
            )
        except Exception as exc:
            logger.exception("write_file hatasi")
            return ToolResult(ok=False, error=f"Dosya yazilamadi: {exc}")


class AppendFileTool(BaseTool):
    name = "append_file"
    description = "Bir dosyanin sonuna icerik ekler (overwrite etmez)."
    permission = "file_system"
    parameters = {
        "type": "object",
        "properties": {
            "path": {"type": "string"},
            "content": {"type": "string"}},
        "required": ["path", "content"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        raw = (args.get("path") or "").strip()
        content = args.get("content")
        if not raw:
            return ToolResult(ok=False, error="Dosya yolu bos olamaz")
        if content is None:
            return ToolResult(ok=False, error="Icerik verilmedi")

        try:
            path = _safe_path(raw)
            path.parent.mkdir(parents=True, exist_ok=True)
            with path.open("a", encoding="utf-8") as f:
                f.write(str(content))
            return ToolResult(
                ok=True,
                output=f"'{path}' dosyasina ekleme yapildi.",
                data={"path": str(path)},
            )
        except Exception as exc:
            return ToolResult(ok=False, error=f"Ekleme yapilamadi: {exc}")


class ListDirTool(BaseTool):
    name = "list_dir"
    description = (
        "Bir dizindeki dosya ve alt-klasorleri listeler. "
        "Kullanici 'X dizininde ne var', 'masaustumde neler var' dediginde kullan."
    )
    permission = "file_system"
    parameters = {
        "type": "object",
        "properties": {
            "path": {
                "type": "string",
                "description": "Listelenecek dizin yolu. Bos ise calisma dizini kullanilir."}
        },
        "required": []}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        raw = (args.get("path") or "").strip() or os.getcwd()
        try:
            path = _safe_path(raw)
            if not path.exists():
                return ToolResult(ok=False, error=f"Dizin bulunamadi: {path}")
            if not path.is_dir():
                return ToolResult(ok=False, error=f"Bu bir dizin degil: {path}")

            entries: List[Dict[str, Any]] = []
            for child in sorted(path.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower())):
                try:
                    is_dir = child.is_dir()
                    size = child.stat().st_size if not is_dir else 0
                    entries.append(
                        {"name": child.name, "is_dir": is_dir, "size": size}
                    )
                except OSError:
                    continue

            lines = [f"Dizin: {path}", f"Toplam {len(entries)} ogê:"]
            for e in entries[:200]:
                tag = "[DIR]" if e["is_dir"] else "    "
                size = "" if e["is_dir"] else f"  ({e['size']} bayt)"
                lines.append(f"  {tag} {e['name']}{size}")
            if len(entries) > 200:
                lines.append(f"  ... ve {len(entries) - 200} oge daha")

            return ToolResult(
                ok=True,
                output="\n".join(lines),
                data={"path": str(path), "entries": entries},
            )
        except Exception as exc:
            logger.exception("list_dir hatasi")
            return ToolResult(ok=False, error=f"Dizin listelenemedi: {exc}")