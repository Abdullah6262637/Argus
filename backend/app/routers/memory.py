"""/api/memory router - vector store + knowledge graph + ingest UI'i besler."""
from __future__ import annotations

import logging
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.services.memory.embedding import embedding_service
from app.services.memory.graph_store import knowledge_graph
from app.services.memory.ingest import ingest_document, ingest_text
from app.services.memory.vector_store import vector_store

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/memory", tags=["memory"])


# ============================================================
# Status / stats
# ============================================================

@router.get("/status")
async def memory_status() -> Dict[str, Any]:
    """Memory subsystem sağlık ve istatistikleri."""
    return {
        "vector_store_available": vector_store.available,
        "embedding_provider": embedding_service.provider,
        "embedding_dim": embedding_service.dimension,
        "knowledge_graph_nodes": knowledge_graph.node_count() if hasattr(knowledge_graph, "node_count") else 0,
        "knowledge_graph_edges": knowledge_graph.edge_count() if hasattr(knowledge_graph, "edge_count") else 0}


@router.get("/stats")
async def vector_stats(agent_id: Optional[str] = None, collection: Optional[str] = None) -> Dict[str, Any]:
    if not vector_store.available:
        return {"available": False}
    return vector_store.stats(agent_id=agent_id, collection=collection)


# ============================================================
# Search
# ============================================================

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    k: int = Field(5, ge=1, le=50)
    agent_id: Optional[str] = None
    collection: Optional[str] = None
    where: Optional[Dict[str, Any]] = None


@router.post("/search")
async def search(payload: SearchRequest) -> Dict[str, Any]:
    if not vector_store.available:
        raise HTTPException(503, "Vector store kurulu degil (chromadb gerekli)")
    try:
        vec = await embedding_service.embed_one(payload.query)
        if not vec:
            return {"results": []}
        results = vector_store.query(
            embedding=vec,
            k=payload.k,
            agent_id=payload.agent_id,
            collection=payload.collection,
            where=payload.where,
        )
        return {"results": results, "count": len(results)}
    except Exception as exc:
        logger.exception("memory search hata")
        raise HTTPException(500, f"Arama hatasi: {exc}")


# ============================================================
# Ingest (Sprint 2.5)
# ============================================================

class IngestTextRequest(BaseModel):
    text: str = Field(..., min_length=1)
    source: str = "manual"
    agent_id: Optional[str] = None
    collection: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    chunk_size: int = Field(800, ge=100, le=4000)
    overlap: int = Field(120, ge=0, le=500)


@router.post("/ingest/text")
async def ingest_text_endpoint(payload: IngestTextRequest) -> Dict[str, Any]:
    """Düz metni chunk + embed + store."""
    try:
        result = await ingest_text(
            payload.text,
            source=payload.source,
            agent_id=payload.agent_id,
            collection=payload.collection,
            metadata=payload.metadata,
            chunk_size=payload.chunk_size,
            overlap=payload.overlap,
        )
        return {"ok": True, **result}
    except Exception as exc:
        logger.exception("ingest text hata")
        raise HTTPException(500, f"Ingest hatasi: {exc}")


@router.post("/ingest/file")
async def ingest_file_endpoint(
    file: UploadFile = File(...),
    agent_id: Optional[str] = Form(None),
    collection: Optional[str] = Form(None),
    chunk_size: int = Form(800),
    overlap: int = Form(120),
) -> Dict[str, Any]:
    """Yüklenen dosyayı (PDF/DOCX/XLSX/CSV/HTML/TXT/MD) ingest et."""
    if not file.filename:
        raise HTTPException(400, "Dosya adi yok")

    # Geçici dosyaya yaz
    suffix = Path(file.filename).suffix or ".bin"
    tmp_path = None
    try:
        content = await file.read()
        if not content:
            raise HTTPException(400, "Bos dosya")
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            tmp_path = tmp.name
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(500, f"Dosya yazma hatasi: {exc}")

    try:
        result = await ingest_document(
            tmp_path,
            agent_id=agent_id,
            collection=collection,
            chunk_size=chunk_size,
            overlap=overlap,
        )
        # Backend orijinal dosya adı bilgisini ekle
        result["filename"] = file.filename
        if not result.get("ok"):
            raise HTTPException(400, result.get("error", "Ingest basarisiz"))
        return result
    finally:
        try:
            if tmp_path:
                Path(tmp_path).unlink(missing_ok=True)  # type: ignore[arg-type]
        except Exception:
            pass


# ============================================================
# Knowledge Graph (Sprint 2.6)
# ============================================================

@router.get("/graph")
async def graph_data(
    agent_id: Optional[str] = None,
    limit: int = 200,
) -> Dict[str, Any]:
    """KG'yi cytoscape/vis-network uyumlu node + edge listesi olarak döner."""
    try:
        # graph_store API'sını esnek tutup tutmadığını bilmediğimden defansif
        nodes_raw: List[Dict[str, Any]] = []
        edges_raw: List[Dict[str, Any]] = []

        if hasattr(knowledge_graph, "all_nodes"):
            nodes_raw = list(knowledge_graph.all_nodes(limit=limit))[:limit]  # type: ignore[arg-type]
        elif hasattr(knowledge_graph, "graph"):
            try:
                g = knowledge_graph.graph  # type: ignore[attr-defined]
                # networkx gibi davran
                for n, attrs in list(g.nodes(data=True))[:limit]:
                    nodes_raw.append({"id": str(n), **(attrs or {})})
                for u, v, attrs in list(g.edges(data=True))[:limit * 3]:
                    edges_raw.append({
                        "source": str(u),
                        "target": str(v),
                        **(attrs or {})})
            except Exception:
                pass

        # Cytoscape format
        cyto_nodes = [{"data": {"id": n.get("id", str(i)), "label": n.get("label") or n.get("name") or n.get("id"), **n}} for i, n in enumerate(nodes_raw)]
        cyto_edges = [{"data": {"id": f"e{i}", "source": e.get("source"), "target": e.get("target"), **e}} for i, e in enumerate(edges_raw)]

        return {
            "nodes": cyto_nodes,
            "edges": cyto_edges,
            "stats": {"node_count": len(cyto_nodes), "edge_count": len(cyto_edges)}}
    except Exception as exc:
        logger.exception("graph fetch hata")
        raise HTTPException(500, f"Graph hatasi: {exc}")