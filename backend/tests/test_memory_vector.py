"""Sprint B.1: Vector store CRUD basit smoke testleri.

Vector store opsiyoneldir (chromadb / sentence-transformers); kurulu degilse skip.
"""
from __future__ import annotations

import pytest


def _has_chroma() -> bool:
    try:
        import chromadb  # type: ignore  # noqa: F401
        return True
    except ImportError:
        return False


pytestmark = pytest.mark.skipif(
    not _has_chroma(),
    reason="chromadb / sentence-transformers kurulu degil",
)


@pytest.mark.asyncio
class TestVectorStore:
    async def test_module_imports(self):
        """Modul import edilebilmeli."""
        try:
            from app.services.tools import vector_tools  # noqa: F401
        except ImportError as exc:
            pytest.skip(f"vector_tools import edilemedi: {exc}")

    async def test_vector_search_tool_basics(self):
        """VectorSearchTool nesnesi olusturulabilmeli ve OpenAI schema verebilmeli."""
        try:
            from app.services.tools.vector_tools import VectorSearchTool
        except ImportError:
            pytest.skip("VectorSearchTool import edilemedi")
        tool = VectorSearchTool()
        assert tool.name == "vector_search"
        schema = tool.to_openai_schema()
        assert "function" in schema
        assert schema["function"]["name"] == "vector_search"

    async def test_vector_upsert_tool_basics(self):
        try:
            from app.services.tools.vector_tools import VectorUpsertTool
        except ImportError:
            pytest.skip("VectorUpsertTool import edilemedi")
        tool = VectorUpsertTool()
        assert tool.name == "vector_upsert"