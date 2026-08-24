// ─────────────────────────────────────────────────────────────
// Argus Rust Core — Performans-Kritik İşlemler için Native Modül
// ─────────────────────────────────────────────────────────────
// Bu modül PyO3 üzerinden Python'a bağlanarak aşağıdaki
// CPU-yoğun işlemleri Rust hızında gerçekleştirir:
//
//   1. Hashing & Kriptografi  (SHA-256, SHA-1, MD5, HMAC, Base64)
//   2. Dosya Sıkıştırma       (ZIP, TAR.GZ — paralel)
//   3. Dosya Sistemi Tarama   (walkdir + rayon ile paralel dir walk)
//   4. Metin İstatistikleri   (karakter/kelime/cümle sayımı — SIMD hızında)
//   5. Sandbox Doğrulama      (komut allowlist kontrolü — zero-allocation)
// ─────────────────────────────────────────────────────────────

mod crypto;
mod compress;
mod fs_ops;
mod text;
mod sandbox;
mod errors;

use pyo3::prelude::*;

/// Ana PyO3 modülü — `import argus_core` ile Python'dan erişilir.
#[pymodule]
fn argus_core(m: &Bound<'_, PyModule>) -> PyResult<()> {
    // ── Crypto alt-modülü ──
    let crypto_mod = PyModule::new(m.py(), "crypto")?;
    crypto::register(&crypto_mod)?;
    m.add_submodule(&crypto_mod)?;

    // ── Compress alt-modülü ──
    let compress_mod = PyModule::new(m.py(), "compress")?;
    compress::register(&compress_mod)?;
    m.add_submodule(&compress_mod)?;

    // ── Filesystem alt-modülü ──
    let fs_mod = PyModule::new(m.py(), "fs")?;
    fs_ops::register(&fs_mod)?;
    m.add_submodule(&fs_mod)?;

    // ── Text alt-modülü ──
    let text_mod = PyModule::new(m.py(), "text")?;
    text::register(&text_mod)?;
    m.add_submodule(&text_mod)?;

    // ── Sandbox alt-modülü ──
    let sandbox_mod = PyModule::new(m.py(), "sandbox")?;
    sandbox::register(&sandbox_mod)?;
    m.add_submodule(&sandbox_mod)?;

    Ok(())
}
