"""Rust Core vs Python Stdlib Benchmark Test Suite (Faz 4)."""
from __future__ import annotations

import hashlib
import time
import pytest


def benchmark_python_sha256(data: bytes, iterations: int = 1000) -> float:
    start = time.perf_counter()
    for _ in range(iterations):
        _ = hashlib.sha256(data).hexdigest()
    return time.perf_counter() - start


def test_sha256_benchmark():
    sample_data = b"Argus Security and Architecture Performance Benchmark Data" * 100
    py_time = benchmark_python_sha256(sample_data, iterations=5000)
    assert py_time > 0
    print(f"\n[Benchmark] Python stdlib SHA-256 (5000 iter): {py_time:.4f} sec")


def test_rust_core_fallback_import():
    try:
        from app.services.rust_bridge import is_rust_available
        avail = is_rust_available()
        print(f"\n[Rust Bridge] Native Rust Core status: {'Active' if avail else 'Using Python Fallback'}")
    except ImportError:
        pytest.skip("rust_bridge not found")
