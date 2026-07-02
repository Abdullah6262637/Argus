"""Pytest fixtures - common test utilities."""
from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path
from typing import AsyncIterator, Iterator

import pytest
import pytest_asyncio

# Backend root'u sys.path'e ekle (testler her yerden calisabilsin)
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Test izole DB: workspace dizininden bagimsiz, tempdir altina yaz
_TEST_DB_DIR = Path(tempfile.gettempdir()) / "umtalagent-test-data"
_TEST_DB_DIR.mkdir(parents=True, exist_ok=True)
_TEST_DB_PATH = _TEST_DB_DIR / "test.db"
os.environ.setdefault(
    "DATABASE_URL",
    f"sqlite+aiosqlite:///{_TEST_DB_PATH.as_posix()}",
)


@pytest_asyncio.fixture(autouse=True)
async def init_test_db() -> None:
    from app.database import init_db
    await init_db()


@pytest.fixture(scope="session")
def temp_data_dir() -> Iterator[Path]:
    """Test sirasinda kullanilacak izole veri klasoru."""
    with tempfile.TemporaryDirectory(prefix="umtalagent-test-") as td:
        path = Path(td)
        os.environ["UMTAL_TEST_DATA_DIR"] = str(path)
        yield path


@pytest_asyncio.fixture
async def app_client() -> AsyncIterator["AsyncClient"]:  # type: ignore[name-defined]
    """FastAPI app icin httpx AsyncClient."""
    from httpx import ASGITransport, AsyncClient
    from asgi_lifespan import LifespanManager

    from app.main import app

    async with LifespanManager(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            yield client