"""ChromaDB vector store wrapper (FAZ 3.1)."""
from __future__ import annotations

import logging
import uuid
from typing import Any, Dict, List, Optional

from app.config import get_settings

logger = logging.getLogger(__name__)


class VectorStore:
    """ChromaDB persistent client wrapper.
    
    Her ajan icin ayri collection (`agent_<id>`) ya da paylasimli `global`.
    """

    def __init__(self) -> None:
        self._client: Any = None
        self._available: Optional[bool] = None

    @property
    def available(self) -> bool:
        if self._available is None:
            try:
                import chromadb  # type: ignore  # pyright: ignore[reportMissingImports]  # noqa: F401
                self._available = True
            except ImportError:
                self._available = False
        return self._available

    def _ensure_client(self) -> Any:
        if self._client is not None:
            return self._client
        if not self.available:
            raise RuntimeError(
                "chromadb kurulu degil. Yuklemek icin: pip install chromadb"
            )
        import chromadb  # type: ignore  # pyright: ignore[reportMissingImports]
        from chromadb.config import Settings as ChromaSettings  # type: ignore  # pyright: ignore[reportMissingImports]

        settings = get_settings()
        path = settings.chroma_path
        from pathlib import Path
        Path(path).mkdir(parents=True, exist_ok=True)

        self._client = chromadb.PersistentClient(
            path=path,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        logger.info("ChromaDB persistent client olusturuldu: %s", path)
        return self._client

    def _collection_name(self, agent_id: Optional[str], collection: Optional[str]) -> str:
        if collection:
            return collection
        if agent_id:
            return f"agent_{agent_id}"
        return "global"

    def get_collection(self, name: str) -> Any:
        client = self._ensure_client()
        return client.get_or_create_collection(name=name)

    def upsert(
        self,
        texts: List[str],
        embeddings: List[List[float]],
        metadatas: Optional[List[Dict[str, Any]]] = None,
        ids: Optional[List[str]] = None,
        *,
        collection: Optional[str] = None,
        agent_id: Optional[str] = None,
    ) -> List[str]:
        if not texts:
            return []
        coll_name = self._collection_name(agent_id, collection)
        coll = self.get_collection(coll_name)
        if ids is None:
            ids = [str(uuid.uuid4()) for _ in texts]
        if metadatas is None:
            metadatas = [{} for _ in texts]
        coll.upsert(
            ids=ids,
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas,
        )
        return ids

    def query(
        self,
        embedding: List[float],
        *,
        k: int = 5,
        collection: Optional[str] = None,
        agent_id: Optional[str] = None,
        where: Optional[Dict[str, Any]] = None,
        apply_recency_decay: bool = False,
    ) -> List[Dict[str, Any]]:
        coll_name = self._collection_name(agent_id, collection)
        coll = self.get_collection(coll_name)
        result = coll.query(
            query_embeddings=[embedding],
            n_results=k,
            where=where,
        )
        # Sonuclari standardize et
        out: List[Dict[str, Any]] = []
        ids = (result.get("ids") or [[]])[0]
        docs = (result.get("documents") or [[]])[0]
        metas = (result.get("metadatas") or [[]])[0]
        dists = (result.get("distances") or [[]])[0]
        
        import time
        current_time = time.time()
        
        for i, doc in enumerate(docs):
            dist = dists[i] if i < len(dists) else 0.0
            meta = metas[i] if i < len(metas) else {}
            
            # Recency Decay (Zaman/Önem Ağırlıklandırması)
            if apply_recency_decay and 'timestamp' in meta:
                age_seconds = current_time - float(meta['timestamp'])
                # Formül: Daha eski verilerin distance (mesafe) değerini hafifçe artırarak arkaya at
                # (Chroma'da distance küçük = daha yakın/iyi)
                penalty = (age_seconds / (86400 * 30)) * 0.1 # Her 30 gün için +0.1 ceza
                dist += penalty
                
            out.append({
                "id": ids[i] if i < len(ids) else None,
                "text": doc,
                "metadata": meta,
                "distance": dist
            })
            
        if apply_recency_decay:
            # Yeni distance değerlerine göre tekrar sırala
            out.sort(key=lambda x: x["distance"])
            
        return out

    async def async_upsert(self, *args, **kwargs) -> List[str]:
        """Büyük verileri ana thread'i bloklamadan arkaplanda vektör veritabanına yazar."""
        import asyncio
        return await asyncio.to_thread(self.upsert, *args, **kwargs)

    def semantic_cache_search(
        self,
        embedding: List[float],
        threshold: float = 0.15,
        collection: str = "semantic_cache"
    ) -> Optional[str]:
        """Önceden sorulmuş benzer bir sorunun cevabını döndürür (LLM by-pass)."""
        results = self.query(embedding, k=1, collection=collection)
        if results and results[0]["distance"] < threshold:
            # Soru çok benzerse direkt metadata'daki cevabı dön
            return results[0]["metadata"].get("answer")
        return None

    def delete(
        self,
        ids: List[str],
        *,
        collection: Optional[str] = None,
        agent_id: Optional[str] = None,
    ) -> None:
        if not ids:
            return
        coll_name = self._collection_name(agent_id, collection)
        coll = self.get_collection(coll_name)
        coll.delete(ids=ids)

    def stats(
        self,
        *,
        collection: Optional[str] = None,
        agent_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        coll_name = self._collection_name(agent_id, collection)
        try:
            coll = self.get_collection(coll_name)
            return {"collection": coll_name, "count": coll.count()}
        except Exception as exc:
            return {"collection": coll_name, "error": str(exc)}


# Singleton
vector_store = VectorStore()