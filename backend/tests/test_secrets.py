"""Sprint B.1: secret_store encrypt/decrypt testleri."""
from __future__ import annotations

import pytest

from app.services.security import secrets as secret_store


class TestSecretStore:
    def test_encrypt_returns_none_for_none(self):
        assert secret_store.encrypt(None) is None

    def test_encrypt_returns_empty_for_empty(self):
        assert secret_store.encrypt("") == ""

    def test_decrypt_returns_none_for_none(self):
        assert secret_store.decrypt(None) is None

    def test_encrypt_then_decrypt_roundtrip(self):
        plain = "sk-test-1234567890"
        cipher = secret_store.encrypt(plain)
        assert cipher is not None
        # Eger cryptography kuruluysa "enc::" prefix olmali
        if cipher != plain:
            assert cipher.startswith("enc::")
        # Decrypt edince geri gelmeli
        decrypted = secret_store.decrypt(cipher)
        assert decrypted == plain

    def test_encrypt_idempotent_on_already_encrypted(self):
        """Sifrelenmis bir degeri bir kez daha encrypt etmek aynisi olmali."""
        plain = "my-secret-key"
        first = secret_store.encrypt(plain)
        second = secret_store.encrypt(first)
        assert first == second

    def test_decrypt_passes_through_plaintext(self):
        """enc:: prefix'i olmayan deger oldugu gibi geri donmeli."""
        plain = "regular-string"
        assert secret_store.decrypt(plain) == plain

    def test_is_encrypted_detects_prefix(self):
        assert secret_store.is_encrypted("enc::abc123")
        assert not secret_store.is_encrypted("sk-abc123")
        assert not secret_store.is_encrypted("")
        assert not secret_store.is_encrypted(None)  # type: ignore[arg-type]

    def test_mask_short_value(self):
        assert secret_store.mask("ab") == "**"
        assert secret_store.mask("abcd") == "****"

    def test_mask_long_value(self):
        masked = secret_store.mask("sk-1234567890abcdef")
        assert masked is not None
        assert masked.startswith("sk-1")
        assert masked.endswith("cdef")
        assert "…" in masked

    def test_mask_none_returns_none(self):
        assert secret_store.mask(None) is None
        assert secret_store.mask("") is None

    def test_mask_decrypts_first(self):
        """Mask sifrelenmis deger geldiginde once decrypt edip oyle masklar."""
        plain = "sk-1234567890abcdef"
        cipher = secret_store.encrypt(plain)
        masked = secret_store.mask(cipher)
        # Maskelenmis deger plaintext'in ilk/son karakterleriyle olusur
        assert masked is not None
        assert "sk-1" in masked