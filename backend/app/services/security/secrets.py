"""API key sifreleme (Sprint 6.1).

Master key uretme + Fernet (cryptography) ile cift yonlu sifreleme.
Master key OS keyring'de saklanir; keyring kullanilamiyorsa filesystem
fallback'i kullanilir (data/.master_key, 0600 izinler).

Bu modul OPSIYONELDIR; cryptography kurulu degilse cipher_text=plaintext
olarak davranir (geriye uyumluluk).
"""
from __future__ import annotations

import base64
import logging
import os
import secrets as pysecrets
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


_KEYRING_SERVICE = "umtalagent"
_KEYRING_USER = "master_key"
_FALLBACK_FILENAME = ".master_key"
_CIPHER_PREFIX = "enc::"  # ciphertext'i isaretlemek icin


def _data_dir() -> Path:
    from app.config import get_settings
    return get_settings().data_dir


def _read_master_key() -> Optional[bytes]:
    """OS keyring'den; yoksa filesystem'den master key okur."""
    # 1) keyring
    try:
        import keyring  # type: ignore  # pyright: ignore[reportMissingImports]
        val = keyring.get_password(_KEYRING_SERVICE, _KEYRING_USER)
        if val:
            return val.encode("utf-8")
    except Exception as exc:
        logger.debug("keyring okuma basarisiz: %s", exc)

    # 2) Filesystem fallback
    p = _data_dir() / _FALLBACK_FILENAME
    if p.exists():
        try:
            return p.read_bytes().strip()
        except Exception as exc:
            logger.warning("Master key dosyasi okunamadi: %s", exc)
    return None


def _write_master_key(key: bytes) -> bool:
    """Once keyring, sonra filesystem fallback."""
    try:
        import keyring  # type: ignore  # pyright: ignore[reportMissingImports]
        keyring.set_password(_KEYRING_SERVICE, _KEYRING_USER, key.decode("utf-8"))
        return True
    except Exception as exc:
        logger.debug("keyring yazma basarisiz, fallback'e dusuyor: %s", exc)

    try:
        p = _data_dir() / _FALLBACK_FILENAME
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(key)
        try:
            os.chmod(p, 0o600)
        except Exception:
            pass
        return True
    except Exception as exc:
        logger.error("Master key dosyasi yazilamadi: %s", exc)
        return False


def _ensure_master_key() -> Optional[bytes]:
    existing = _read_master_key()
    if existing:
        return existing
    # Yeni 32-byte key uret -> Fernet base64 url-safe
    raw = pysecrets.token_bytes(32)
    fernet_key = base64.urlsafe_b64encode(raw)
    if _write_master_key(fernet_key):
        return fernet_key
    return None


def _get_fernet():
    """cryptography kuruluysa Fernet instance'i; yoksa None."""
    try:
        from cryptography.fernet import Fernet  # type: ignore
    except ImportError:
        return None
    key = _ensure_master_key()
    if not key:
        return None
    try:
        return Fernet(key)
    except Exception as exc:
        logger.warning("Fernet init hata: %s", exc)
        return None


# ============================================================
# Public API
# ============================================================

def is_encrypted(value: str) -> bool:
    """Bir string sifrelenmis mi (CIPHER_PREFIX ile basliyor mu)?"""
    return isinstance(value, str) and value.startswith(_CIPHER_PREFIX)


def encrypt(plaintext: Optional[str]) -> Optional[str]:
    """Plaintext'i sifreli stringe cevir.

    cryptography yoksa veya zaten sifrelenmis ise oldugu gibi doner.
    None / bos ise None doner.
    """
    if plaintext is None or plaintext == "":
        return plaintext
    if is_encrypted(plaintext):
        return plaintext
    fernet = _get_fernet()
    if fernet is None:
        # cryptography yok - pass-through
        return plaintext
    try:
        token = fernet.encrypt(plaintext.encode("utf-8")).decode("ascii")
        return _CIPHER_PREFIX + token
    except Exception as exc:
        logger.warning("encrypt hata, plaintext doneriliyor: %s", exc)
        return plaintext


def decrypt(ciphertext: Optional[str]) -> Optional[str]:
    """Sifreli stringi plaintext'e cevir.

    Eger CIPHER_PREFIX yoksa girdiyi oldugu gibi doner (geriye uyumluluk).
    cryptography yoksa veya hata olursa girdiyi doner.
    """
    if ciphertext is None or ciphertext == "":
        return ciphertext
    if not is_encrypted(ciphertext):
        return ciphertext
    fernet = _get_fernet()
    if fernet is None:
        logger.warning("Sifreli deger var ama cryptography kurulu degil; plaintext olarak donuyor")
        return ciphertext
    try:
        token = ciphertext[len(_CIPHER_PREFIX):]
        return fernet.decrypt(token.encode("ascii")).decode("utf-8")
    except Exception as exc:
        logger.warning("decrypt hata: %s", exc)
        return ciphertext


def mask(value: Optional[str], visible: int = 4) -> Optional[str]:
    """API key'i UI'da gostermek icin maskele: sk-***...AB12"""
    if not value:
        return None
    plain = decrypt(value) if is_encrypted(value) else value
    if not plain:
        return None
    if len(plain) <= visible * 2:
        return "*" * len(plain)
    return f"{plain[:visible]}…{plain[-visible:]}"