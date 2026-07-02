"""EmbeddingService: yerel veya OpenAI embedding'ler.

Default: sentence-transformers/all-MiniLM-L6-v2 (yerel, ucretsiz, ~90MB).
Fallback / opsiyonel: OpenAI text-embedding-3-small.

Lazy load: ilk embed cagrisinda model indirilir.
"""
from __future__ import annotations

import asyncio
import logging
from typing import List, Optional

from app.config import get_settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    def __init__(self) -> None:
        settings = get_settings()
        self.provider = (settings.embedding_provider or "local").lower()
        self.local_model_name = settings.embedding_model_local
        self.openai_model_name = settings.embedding_model_openai
        self._local_model = None
        self._openai_client = None
        self._lock = asyncio.Lock()
        self._dim: Optional[int] = None

    @property
    def dimension(self) -> int:
        """Embedding vektor boyutu (lazy)."""
        if self._dim:
            return self._dim
        # Tipik degerler
        if self.provider == "openai":
            return 1536
        return 384  # MiniLM-L6-v2

    async def _ensure_local(self) -> None:
        if self._local_model is not None:
            return
        async with self._lock:
            if self._local_model is not None:
                return
            try:
                from sentence_transformers import SentenceTransformer  # type: ignore  # pyright: ignore[reportMissingImports]
            except ImportError as exc:
                raise RuntimeError(
                    "sentence-transformers kurulu degil. "
                    "Yuklemek icin: pip install sentence-transformers"
                ) from exc

            logger.info("sentence-transformers modeli yukleniyor: %s", self.local_model_name)
            loop = asyncio.get_event_loop()
            self._local_model = await loop.run_in_executor(
                None, lambda: SentenceTransformer(self.local_model_name)
            )
            try:
                self._dim = int(self._local_model.get_sentence_embedding_dimension())
            except Exception:
                self._dim = 384
            logger.info("sentence-transformers hazir (dim=%s)", self._dim)

    async def _ensure_openai(self) -> None:
        if self._openai_client is not None:
            return
        try:
            from openai import AsyncOpenAI
        except ImportError as exc:
            raise RuntimeError("openai paketi kurulu degil") from exc
        settings = get_settings()
        if not settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY ayarlanmamis - openai embedding kullanilamaz")
        self._openai_client = AsyncOpenAI(api_key=settings.openai_api_key)

    async def embed(self, texts: List[str]) -> List[List[float]]:
        """Verilen metinleri embedding vektorlerine cevir."""
        if not texts:
            return []

        if self.provider == "openai":
            try:
                await self._ensure_openai()
                response = await self._openai_client.embeddings.create(  # type: ignore
                    model=self.openai_model_name,
                    input=texts,
                )
                return [list(d.embedding) for d in response.data]
            except Exception as exc:
                logger.warning("OpenAI embedding basarisiz, local'e dusuyor: %s", exc)
                self.provider = "local"

        # Local
        await self._ensure_local()
        loop = asyncio.get_event_loop()
        vectors = await loop.run_in_executor(
            None, lambda: self._local_model.encode(texts, convert_to_numpy=True).tolist()  # type: ignore
        )
        return vectors

    async def embed_one(self, text: str) -> List[float]:
        out = await self.embed([text])
        return out[0] if out else []


# Singleton
embedding_service = EmbeddingService()