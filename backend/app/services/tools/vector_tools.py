"""Vector store + ingest + knowledge graph tool'lari (FAZ 3.3, 3.4, 3.5)."""
from __future__ import annotations

import logging
from typing import Any, Dict

from app.services.memory.embedding import embedding_service
from app.services.memory.graph_store import knowledge_graph
from app.services.memory.ingest import ingest_document, ingest_text
from app.services.memory.vector_store import vector_store
from app.services.tools.base import BaseTool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


def _check_vector_available() -> ToolResult | None:
    if not vector_store.available:
        return ToolResult(
            ok=False,
            error="chromadb kurulu degil. pip install chromadb sentence-transformers",
        )
    return None


class VectorSearchTool(BaseTool):
    name = "vector_search"
    description = (
        "Vektor veritabaninda benzer metin parcalari ara. "
        "Onceden eklenmis dokumanlardan en iliskili k tane chunk doner."
    )
    permission = "none"
    parameters = {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Aranacak metin"},
            "k": {"type": "integer", "default": 5},
            "collection": {"type": "string", "description": "Hedef koleksiyon (varsayilan: ajanin)"},
            "scope": {
                "type": "string",
                "enum": ["agent", "global"],
                "default": "agent",
                "description": "agent=sadece bu ajanin hafizasi, global=paylasimli"}},
        "required": ["query"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        unavailable = _check_vector_available()
        if unavailable:
            return unavailable
        query = (args.get("query") or "").strip()
        if not query:
            return ToolResult(ok=False, error="query gerekli")
        k = int(args.get("k", 5))
        collection = args.get("collection")
        scope = (args.get("scope") or "agent").lower()
        agent_id = context.agent_id if scope == "agent" else None

        try:
            embedding = await embedding_service.embed_one(query)
            results = vector_store.query(
                embedding,
                k=k,
                collection=collection,
                agent_id=agent_id,
            )
        except RuntimeError as exc:
            return ToolResult(ok=False, error=str(exc))
        except Exception as exc:
            logger.exception("vector_search hatasi")
            return ToolResult(ok=False, error=f"Arama hatasi: {exc}")

        if not results:
            return ToolResult(ok=True, output="(eslesme yok)", data={"results": []})

        lines = []
        for i, r in enumerate(results, 1):
            preview = (r.get("text") or "")[:200]
            src = (r.get("metadata") or {}).get("source", "?")
            dist = r.get("distance")
            dist_str = f"{dist:.3f}" if isinstance(dist, (int, float)) else str(dist)
            lines.append(f"#{i} [dist={dist_str}] ({src})\n{preview}")
        return ToolResult(
            ok=True,
            output="\n\n".join(lines),
            data={"results": results, "count": len(results)},
        )


class VectorUpsertTool(BaseTool):
    name = "vector_upsert"
    description = (
        "Bir metni vektor veritabanina ekle (chunk + embed + store). "
        "Daha sonra vector_search ile bulunabilir."
    )
    permission = "none"
    parameters = {
        "type": "object",
        "properties": {
            "text": {"type": "string"},
            "source": {"type": "string", "default": "manual"},
            "scope": {"type": "string", "enum": ["agent", "global"], "default": "agent"},
            "collection": {"type": "string"}},
        "required": ["text"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        unavailable = _check_vector_available()
        if unavailable:
            return unavailable
        text = (args.get("text") or "").strip()
        if not text:
            return ToolResult(ok=False, error="text gerekli")
        source = args.get("source") or "manual"
        scope = (args.get("scope") or "agent").lower()
        collection = args.get("collection")
        agent_id = context.agent_id if scope == "agent" else None

        try:
            result = await ingest_text(
                text,
                source=source,
                agent_id=agent_id,
                collection=collection,
            )
        except RuntimeError as exc:
            return ToolResult(ok=False, error=str(exc))
        except Exception as exc:
            logger.exception("vector_upsert hatasi")
            return ToolResult(ok=False, error=f"Yazma hatasi: {exc}")

        return ToolResult(
            ok=True,
            output=f"{result['chunks']} parca eklendi (kaynak: {source})",
            data=result,
        )


class IngestDocumentTool(BaseTool):
    name = "ingest_document"
    description = (
        "Bir dokumani (PDF/DOCX/MD/TXT/HTML/CSV/XLSX) okuyup vektor "
        "veritabanina ekler. Daha sonra icerigi vector_search ile sorulabilir."
    )
    permission = "file_system"
    parameters = {
        "type": "object",
        "properties": {
            "path": {"type": "string"},
            "scope": {"type": "string", "enum": ["agent", "global"], "default": "agent"},
            "collection": {"type": "string"}},
        "required": ["path"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        unavailable = _check_vector_available()
        if unavailable:
            return unavailable
        path = (args.get("path") or "").strip()
        if not path:
            return ToolResult(ok=False, error="path gerekli")
        scope = (args.get("scope") or "agent").lower()
        collection = args.get("collection")
        agent_id = context.agent_id if scope == "agent" else None

        try:
            result = await ingest_document(
                path,
                agent_id=agent_id,
                collection=collection,
            )
        except Exception as exc:
            logger.exception("ingest_document hatasi")
            return ToolResult(ok=False, error=f"Ingest hatasi: {exc}")

        if not result.get("ok"):
            return ToolResult(ok=False, error=result.get("error", "ingest basarisiz"))

        return ToolResult(
            ok=True,
            output=f"Eklendi: {result.get('chunks')} parca ({path})",
            data=result,
        )


# ============================================================
# Knowledge Graph tools (FAZ 3.5)
# ============================================================

class KGAddEntityTool(BaseTool):
    name = "kg_add_entity"
    description = "Bilgi grafigine bir varlik (entity) ekle."
    permission = "none"
    parameters = {
        "type": "object",
        "properties": {
            "name": {"type": "string"},
            "type": {"type": "string", "default": "concept"},
            "description": {"type": "string", "default": ""}},
        "required": ["name"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        if not knowledge_graph.available:
            return ToolResult(ok=False, error="networkx kurulu degil")
        name = (args.get("name") or "").strip()
        if not name:
            return ToolResult(ok=False, error="name gerekli")
        try:
            await knowledge_graph.add_entity(
                name,
                entity_type=args.get("type", "concept"),
                description=args.get("description", ""),
            )
            return ToolResult(ok=True, output=f"Eklendi: {name}")
        except Exception as exc:
            return ToolResult(ok=False, error=f"KG hata: {exc}")


class KGAddRelationTool(BaseTool):
    name = "kg_add_relation"
    description = "Iki entity arasinda iliski (edge) ekle."
    permission = "none"
    parameters = {
        "type": "object",
        "properties": {
            "source": {"type": "string"},
            "target": {"type": "string"},
            "label": {"type": "string", "default": "related_to"}},
        "required": ["source", "target"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        if not knowledge_graph.available:
            return ToolResult(ok=False, error="networkx kurulu degil")
        source = (args.get("source") or "").strip()
        target = (args.get("target") or "").strip()
        if not source or not target:
            return ToolResult(ok=False, error="source ve target gerekli")
        try:
            await knowledge_graph.add_relation(
                source, target, label=args.get("label", "related_to"),
            )
            return ToolResult(ok=True, output=f"Iliski: {source} -[{args.get('label')}]-> {target}")
        except Exception as exc:
            return ToolResult(ok=False, error=f"KG hata: {exc}")


class KGQueryNeighborsTool(BaseTool):
    name = "kg_query_neighbors"
    description = "Bir entity'nin komsularini (iliskili dugumlerini) sorgula."
    permission = "none"
    parameters = {
        "type": "object",
        "properties": {
            "name": {"type": "string"},
            "depth": {"type": "integer", "default": 1}},
        "required": ["name"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        if not knowledge_graph.available:
            return ToolResult(ok=False, error="networkx kurulu degil")
        name = (args.get("name") or "").strip()
        if not name:
            return ToolResult(ok=False, error="name gerekli")
        depth = int(args.get("depth", 1))
        try:
            data = await knowledge_graph.neighbors(name, depth=depth)
        except Exception as exc:
            return ToolResult(ok=False, error=f"KG hata: {exc}")
        if not data.get("found"):
            return ToolResult(ok=True, output=f"Bulunamadi: {name}", data=data)
        nbrs = data.get("neighbors") or []
        lines = [f"{n['name']} (d={n['distance']}, type={n.get('type', '?')})" for n in nbrs]
        return ToolResult(
            ok=True,
            output=f"{name} komsulari:\n" + "\n".join(lines) if lines else f"{name} icin komsu yok",
            data=data,
        )


class KGSearchTool(BaseTool):
    name = "kg_search"
    description = "Bilgi grafiginde isimle arama yap."
    permission = "none"
    parameters = {
        "type": "object",
        "properties": {
            "query": {"type": "string"},
            "limit": {"type": "integer", "default": 10}},
        "required": ["query"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        if not knowledge_graph.available:
            return ToolResult(ok=False, error="networkx kurulu degil")
        query = (args.get("query") or "").strip()
        if not query:
            return ToolResult(ok=False, error="query gerekli")
        try:
            results = await knowledge_graph.search(query, limit=int(args.get("limit", 10)))
        except Exception as exc:
            return ToolResult(ok=False, error=f"KG hata: {exc}")
        if not results:
            return ToolResult(ok=True, output="(eslesme yok)", data={"results": []})
        lines = [f"- {r['name']} (type={r.get('type', '?')})" for r in results]
        return ToolResult(
            ok=True,
            output="\n".join(lines),
            data={"results": results},
        )