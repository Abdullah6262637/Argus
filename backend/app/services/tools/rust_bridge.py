"""Argus Rust Core — Python Bridge Module.

Bu modül, Rust ile derlenen argus_core native kütüphanesini
Python'a köprüler. Rust modülü bulunamazsa otomatik olarak
Python fallback implementasyonlarına geri düşer.

Kullanım:
    from app.services.tools.rust_bridge import rust_engine

    # Crypto
    h = rust_engine.crypto.hash_text("hello", "sha256")
    h = rust_engine.crypto.hash_file("data.bin", "sha256")
    sig = rust_engine.crypto.hmac_sha256(key, data)

    # Compress
    rust_engine.compress.zip_compress("/src", "/out.zip")
    rust_engine.compress.tar_gz_compress("/src", "/out.tar.gz")

    # Filesystem
    stats = rust_engine.fs.dir_stats("/path")      # (files, dirs, bytes)
    size  = rust_engine.fs.dir_size_human("/path")  # "2.34 GB"
    files = rust_engine.fs.find_files_by_ext("/path", [".py"])

    # Text
    stats = rust_engine.text.text_stats("metin")
    freq  = rust_engine.text.word_frequency("metin", 20)

    # Sandbox
    ok, msg = rust_engine.sandbox.check_command_full("git status", "git,npm")
"""
from __future__ import annotations

import logging
import sys
import os
from pathlib import Path

logger = logging.getLogger(__name__)

# ── Rust modülünü bul ve yükle ───────────────────────────────

_RUST_AVAILABLE = False
_rust_module = None


def _try_load_rust():
    """argus_core.pyd / .so dosyasını bul ve import et."""
    global _RUST_AVAILABLE, _rust_module

    # .pyd dosyasının olabileceği yerler
    search_dirs = [
        Path(__file__).parent,                                   # tools/ dizini
        Path(__file__).parent.parent.parent.parent / "rust_core" / "target" / "release",
    ]

    for d in search_dirs:
        d = d.resolve()
        if d.exists() and str(d) not in sys.path:
            sys.path.insert(0, str(d))

    try:
        import argus_core as _mod  # type: ignore
        _rust_module = _mod
        _RUST_AVAILABLE = True
        logger.info("🦀 Argus Rust Core basariyla yuklendi (native hiz aktif)")
    except ImportError:
        _RUST_AVAILABLE = False
        logger.warning(
            "⚠️  Argus Rust Core bulunamadi — Python fallback kullanilacak. "
            "Performans icin: cd backend/rust_core && cargo build --release"
        )


_try_load_rust()


# ── Public API ───────────────────────────────────────────────

class RustEngine:
    """Rust modülüne erişim katmanı.

    rust_engine.available → True ise Rust native, False ise fallback.
    Alt modüllere doğrudan erişim:
        rust_engine.crypto.hash_text(...)
        rust_engine.compress.zip_compress(...)
        rust_engine.fs.dir_stats(...)
        rust_engine.text.text_stats(...)
        rust_engine.sandbox.check_command_full(...)
    """

    @property
    def available(self) -> bool:
        return _RUST_AVAILABLE

    @property
    def crypto(self):
        if _rust_module:
            return _rust_module.crypto
        raise RuntimeError("Rust core yuklu degil — crypto modulu kullanilamaz")

    @property
    def compress(self):
        if _rust_module:
            return _rust_module.compress
        raise RuntimeError("Rust core yuklu degil — compress modulu kullanilamaz")

    @property
    def fs(self):
        if _rust_module:
            return _rust_module.fs
        raise RuntimeError("Rust core yuklu degil — fs modulu kullanilamaz")

    @property
    def text(self):
        if _rust_module:
            return _rust_module.text
        raise RuntimeError("Rust core yuklu degil — text modulu kullanilamaz")

    @property
    def sandbox(self):
        if _rust_module:
            return _rust_module.sandbox
        raise RuntimeError("Rust core yuklu degil — sandbox modulu kullanilamaz")

    def __repr__(self):
        status = "ACTIVE 🦀" if self.available else "FALLBACK 🐍"
        return f"<RustEngine status={status}>"


# Singleton
rust_engine = RustEngine()
