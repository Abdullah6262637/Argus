import pytest
from typing import AsyncGenerator
from unittest.mock import AsyncMock

from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.database import Base

@pytest.fixture
async def test_db() -> AsyncGenerator[AsyncSession, None]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    SessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    async with SessionLocal() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()

from httpx import AsyncClient, ASGITransport

@pytest.fixture
async def app_client() -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://localhost:8000"
    ) as client:
        yield client

@pytest.fixture
def mock_llm_provider():
    mock = AsyncMock()
    mock.generate_response.return_value = "Mocked LLM Response"
    return mock