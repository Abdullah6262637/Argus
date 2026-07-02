"""Smoke testleri - sunucu acilabilir mi, /api/health calisir mi."""
from __future__ import annotations

import pytest


@pytest.mark.asyncio
async def test_health_endpoint(app_client) -> None:
    response = await app_client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "agents_loaded" in data


@pytest.mark.asyncio
async def test_root_endpoint(app_client) -> None:
    response = await app_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["docs"] == "/docs"


@pytest.mark.asyncio
async def test_trace_id_header(app_client) -> None:
    response = await app_client.get("/api/health")
    assert "x-trace-id" in response.headers
    tid = response.headers["x-trace-id"]
    assert len(tid) >= 8


@pytest.mark.asyncio
async def test_trace_id_passthrough(app_client) -> None:
    """Client'in gonderdigi x-trace-id korunmali."""
    response = await app_client.get("/api/health", headers={"x-trace-id": "test-123"})
    assert response.headers.get("x-trace-id") == "test-123"