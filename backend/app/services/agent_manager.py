"""AgentManager: agents.yaml'dan ajan tanimlarini yukler ve yonetir."""
from __future__ import annotations

import logging
import re
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml

from app.config import get_settings
from app.schemas.agent import AgentPermissions
from app.services.security import secrets as secret_store

logger = logging.getLogger(__name__)


@dataclass
class MediaCapability:
    """Bir medya yetenegi icin (gorsel/video/ses) opsiyonel yapilandirma."""

    enabled: bool = False
    provider: Optional[str] = None
    model: Optional[str] = None
    base_url: Optional[str] = None
    api_key: Optional[str] = None

    @classmethod
    def from_dict(cls, d: Optional[Dict[str, Any]]) -> "MediaCapability":
        if not d or not isinstance(d, dict):
            return cls()
        return cls(
            enabled=bool(d.get("enabled", False)),
            provider=d.get("provider") or None,
            model=d.get("model") or None,
            base_url=d.get("base_url") or None,
            api_key=d.get("api_key") or None,
        )

    def to_yaml(self) -> Optional[Dict[str, Any]]:
        """Yaml'a yazilabilecek sozluk uret; bos ise None doner.
        api_key sifrelenmis olarak yazilir."""
        if not self.enabled and not any([self.provider, self.model, self.base_url, self.api_key]):
            return None
        data: Dict[str, Any] = {"enabled": self.enabled}
        if self.provider:
            data["provider"] = self.provider
        if self.model:
            data["model"] = self.model
        if self.base_url:
            data["base_url"] = self.base_url
        if self.api_key:
            data["api_key"] = secret_store.encrypt(self.api_key)
        return data


@dataclass
class AgentDefinition:
    """Bir ajanin tam tanimi (yaml + SOUL birlestirmis)."""

    id: str
    name: str
    role: str
    provider: str
    model: str
    system_prompt: str = ""
    soul_file: Optional[str] = None  # souls/ altinda dosya (opsiyonel)
    description: str = ""
    base_url: Optional[str] = None  # Ozel OpenAI-uyumlu endpoint (opsiyonel)
    api_key: Optional[str] = None  # Ajan-ozel API anahtari (yoksa .env)
    temperature: float = 0.7
    max_tokens: int = 1024
    tags: List[str] = field(default_factory=list)
    is_active: bool = True
    # Opsiyonel medya yapilandirmalari
    image: MediaCapability = field(default_factory=MediaCapability)
    video: MediaCapability = field(default_factory=MediaCapability)
    audio: MediaCapability = field(default_factory=MediaCapability)
    permissions: AgentPermissions = field(default_factory=AgentPermissions)

    def to_yaml_dict(self) -> Dict[str, Any]:
        data: Dict[str, Any] = {
            "id": self.id,
            "name": self.name,
            "role": self.role,
            "description": self.description,
            "provider": self.provider,
            "model": self.model,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "tags": list(self.tags),
            "is_active": self.is_active,
            "permissions": self.permissions.model_dump(),
        }
        if self.base_url:
            data["base_url"] = self.base_url
        if self.api_key:
            # Plaintext geldiyse sifrele; zaten sifreliyse oldugu gibi yaz
            data["api_key"] = secret_store.encrypt(self.api_key)
        if self.soul_file:
            data["soul"] = self.soul_file
        elif self.system_prompt:
            data["system_prompt"] = self.system_prompt
        for key, cap in (("image", self.image), ("video", self.video), ("audio", self.audio)):
            y = cap.to_yaml()
            if y:
                data[key] = y
        return data


def _slugify(text: str) -> str:
    """Turkce karakterler dahil guvenli kisa id uretir."""
    tr_map = str.maketrans(
        {"ç": "c", "Ç": "c", "ğ": "g", "Ğ": "g", "ı": "i", "İ": "i",
         "ö": "o", "Ö": "o", "ş": "s", "Ş": "s", "ü": "u", "Ü": "u"}
    )
    text = text.translate(tr_map).lower()
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text or "agent"


class AgentManager:
    """YAML'dan ajan tanimlarini yukleyen, sunan ve yazan merkezi yonetici."""

    def __init__(
        self,
        config_path: Optional[str] = None,
        souls_dir: Optional[str] = None,
    ) -> None:
        settings = get_settings()
        self.config_path = Path(config_path or settings.agents_config_path)
        self.souls_dir = Path(souls_dir or settings.souls_dir)
        self._agents: Dict[str, AgentDefinition] = {}

    # ---------- Okuma / Yukleme ----------

    def load(self) -> None:
        """agents.yaml'i oku ve tum ajanlari bellege al."""
        if not self.config_path.exists():
            logger.warning("Ajan config dosyasi bulunamadi: %s", self.config_path)
            self._agents = {}
            return

        with self.config_path.open("r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}

        raw_agents = data.get("agents", []) or []
        new_map: Dict[str, AgentDefinition] = {}

        for item in raw_agents:
            agent_id = item.get("id")
            if not agent_id:
                logger.warning("id'si olmayan ajan atlandi: %s", item)
                continue

            # system_prompt ya inline ya da soul dosyasindan gelir
            system_prompt = (item.get("system_prompt") or "").strip()
            soul_name = item.get("soul")
            if not system_prompt and soul_name:
                soul_path = self.souls_dir / soul_name
                if soul_path.exists():
                    system_prompt = soul_path.read_text(encoding="utf-8").strip()
                else:
                    logger.warning("SOUL dosyasi bulunamadi: %s", soul_path)

            # api_key sifreliyse decrypt et; degilse oldugu gibi al
            raw_api_key = item.get("api_key") or None
            api_key = secret_store.decrypt(raw_api_key) if raw_api_key else None

            # Media capability'lerin api_key'lerini de cozmek icin from_dict sonrasi
            image_cap = MediaCapability.from_dict(item.get("image"))
            video_cap = MediaCapability.from_dict(item.get("video"))
            audio_cap = MediaCapability.from_dict(item.get("audio"))
            for cap in (image_cap, video_cap, audio_cap):
                if cap.api_key:
                    cap.api_key = secret_store.decrypt(cap.api_key)

            definition = AgentDefinition(
                id=agent_id,
                name=item.get("name", agent_id),
                role=item.get("role", ""),
                description=item.get("description", ""),
                provider=item.get("provider", "openai"),
                model=item.get("model", "gpt-4o-mini"),
                soul_file=soul_name,
                system_prompt=system_prompt,
                base_url=item.get("base_url") or None,
                api_key=api_key,
                temperature=float(item.get("temperature", 0.7)),
                max_tokens=int(item.get("max_tokens", 1024)),
                tags=list(item.get("tags", []) or []),
                is_active=bool(item.get("is_active", True)),
                image=image_cap,
                video=video_cap,
                audio=audio_cap,
                permissions=AgentPermissions(**(item.get("permissions") or {})),
            )
            new_map[agent_id] = definition

        self._agents = new_map
        logger.info("AgentManager: %d ajan yuklendi", len(self._agents))

        # Plain-text api_key'leri otomatik olarak sifrelenmis hale yaz
        # (kullanici elle yaml'a duz key girdiginde guvene almak icin)
        try:
            needs_resave = False
            with self.config_path.open("r", encoding="utf-8") as f:
                raw_data = yaml.safe_load(f) or {}
            for item in raw_data.get("agents", []) or []:
                k = item.get("api_key")
                if k and not secret_store.is_encrypted(k):
                    needs_resave = True
                    break
                for media_key in ("image", "video", "audio"):
                    sub = item.get(media_key) or {}
                    if isinstance(sub, dict):
                        sk = sub.get("api_key")
                        if sk and not secret_store.is_encrypted(sk):
                            needs_resave = True
                            break
                if needs_resave:
                    break
            if needs_resave:
                self._save_yaml()
                logger.info("agents.yaml icindeki plaintext api_key'ler sifrelenerek yeniden yazildi")
        except Exception as exc:
            logger.warning("API key auto-encrypt yeniden yazma sirasinda hata: %s", exc)

    def reload(self) -> None:
        self.load()

    # ---------- Sorgu ----------

    def list_agents(self, include_inactive: bool = False) -> List[AgentDefinition]:
        values = list(self._agents.values())
        if not include_inactive:
            values = [a for a in values if a.is_active]
        return values

    def get(self, agent_id: str) -> Optional[AgentDefinition]:
        return self._agents.get(agent_id)

    def require(self, agent_id: str) -> AgentDefinition:
        agent = self.get(agent_id)
        if not agent:
            raise KeyError(f"Ajan bulunamadi: {agent_id}")
        return agent

    # ---------- Yazma / CRUD ----------

    def _save_yaml(self) -> None:
        """Mevcut ajanlari agents.yaml'a yazar."""
        self.config_path.parent.mkdir(parents=True, exist_ok=True)
        data = {"agents": [a.to_yaml_dict() for a in self._agents.values()]}
        with self.config_path.open("w", encoding="utf-8") as f:
            yaml.safe_dump(data, f, allow_unicode=True, sort_keys=False)

    def _unique_id(self, base: str) -> str:
        base = _slugify(base)
        if base not in self._agents:
            return base
        i = 2
        while f"{base}-{i}" in self._agents:
            i += 1
        return f"{base}-{i}"

    def create_agent(
        self,
        *,
        name: str,
        role: str = "",
        description: str = "",
        provider: str = "openai",
        model: str = "gpt-4o-mini",
        system_prompt: str = "",
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        tags: Optional[List[str]] = None,
        is_active: bool = True,
        agent_id: Optional[str] = None,
        image: Optional[Dict[str, Any]] = None,
        video: Optional[Dict[str, Any]] = None,
        audio: Optional[Dict[str, Any]] = None,
        permissions: Optional[Dict[str, Any]] = None,
    ) -> AgentDefinition:
        """Yeni bir ajan olusturur ve yaml'a kaydeder."""
        new_id = agent_id if agent_id else self._unique_id(name)
        if new_id in self._agents:
            raise ValueError(f"Bu id zaten kullanimda: {new_id}")

        definition = AgentDefinition(
            id=new_id,
            name=name,
            role=role,
            description=description,
            provider=provider.lower(),
            model=model,
            system_prompt=system_prompt or "",
            soul_file=None,
            base_url=base_url or None,
            api_key=api_key or None,
            temperature=float(temperature),
            max_tokens=int(max_tokens),
            tags=list(tags or []),
            is_active=bool(is_active),
            image=MediaCapability.from_dict(image),
            video=MediaCapability.from_dict(video),
            audio=MediaCapability.from_dict(audio),
            permissions=AgentPermissions(**(permissions or {})),
        )
        self._agents[new_id] = definition
        self._save_yaml()
        logger.info("Ajan olusturuldu: %s", new_id)
        return definition

    def update_agent(self, agent_id: str, **changes: Any) -> AgentDefinition:
        """Mevcut ajani gunceller."""
        agent = self.require(agent_id)
        # Izin verilen alanlar
        allowed = {
            "name", "role", "description", "provider", "model",
            "system_prompt", "soul_file", "base_url", "api_key",
            "temperature", "max_tokens", "tags", "is_active",
            "image", "video", "audio", "permissions",
        }
        
        if changes.pop("clear_api_key", False):
            agent.api_key = None
            
        for key, value in changes.items():
            if key not in allowed:
                continue
            if value is None and key not in ("base_url", "api_key", "system_prompt", "description"):
                continue
            if key == "provider" and isinstance(value, str):
                value = value.lower()
            if key == "tags":
                value = list(value or [])
            if key in ("image", "video", "audio"):
                # dict geldi, MediaCapability'e cevir
                value = MediaCapability.from_dict(value if isinstance(value, dict) else None)
            if key == "permissions":
                value = AgentPermissions(**(value if isinstance(value, dict) else {}))
            setattr(agent, key, value)

        # Inline prompt guncellendiyse soul_file'i sifirla.
        # NOT: Bos string ("") veya None gondermek soul_file'i silmemeli;
        # ancak gercek bir metin geldiyse soul_file ile cakismasin diye
        # temizliyoruz.
        new_prompt = changes.get("system_prompt")
        if "system_prompt" in changes and isinstance(new_prompt, str) and new_prompt.strip():
            agent.soul_file = None

        self._save_yaml()
        logger.info("Ajan guncellendi: %s", agent_id)
        return agent

    def delete_agent(self, agent_id: str) -> None:
        if agent_id not in self._agents:
            raise KeyError(f"Ajan bulunamadi: {agent_id}")
        del self._agents[agent_id]
        self._save_yaml()
        logger.info("Ajan silindi: %s", agent_id)

    def duplicate_agent(self, agent_id: str) -> AgentDefinition:
        """Ajani kopyalar ve yeni id ile kaydeder."""
        src = self.require(agent_id)
        new_id = self._unique_id(f"{src.id}-kopya")
        copy = AgentDefinition(
            id=new_id,
            name=f"{src.name} (Kopya)",
            role=src.role,
            description=src.description,
            provider=src.provider,
            model=src.model,
            system_prompt=src.system_prompt,
            soul_file=None,  # kopyada inline prompt tutalim
            base_url=src.base_url,
            api_key=src.api_key,
            temperature=src.temperature,
            max_tokens=src.max_tokens,
            tags=list(src.tags),
            is_active=src.is_active,
            image=MediaCapability(**asdict(src.image)),
            video=MediaCapability(**asdict(src.video)),
            audio=MediaCapability(**asdict(src.audio)),
            permissions=AgentPermissions(**src.permissions.model_dump()),
        )
        self._agents[new_id] = copy
        self._save_yaml()
        logger.info("Ajan kopyalandi: %s -> %s", agent_id, new_id)
        return copy

    def export_agent(self, agent_id: str, include_secrets: bool = False) -> Dict[str, Any]:
        """Ajani JSON'a serializable bir dict olarak doner.
        include_secrets=False ise api_key'ler cikarilir."""
        src = self.require(agent_id)
        data = src.to_yaml_dict()
        if not include_secrets:
            data.pop("api_key", None)
            for key in ("image", "video", "audio"):
                if key in data and isinstance(data[key], dict):
                    data[key].pop("api_key", None)
        return {"version": 1, "agent": data}


# Singleton ornek - lifespan icinde load edilir
agent_manager = AgentManager()


def get_agent_manager() -> AgentManager:
    return agent_manager