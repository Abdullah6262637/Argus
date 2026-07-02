"""Knowledge Graph (FAZ 3.5): networkx + JSON persistence."""
from __future__ import annotations

import asyncio
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.config import get_settings

logger = logging.getLogger(__name__)


class KnowledgeGraph:
    """Basit yonlu graf bilgi deposu.

    Node'lar: entity'ler (kisi, kurum, kavram). Edge'ler: iliskiler.
    JSON ile diske persist edilir.
    """

    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._graph: Any = None  # nx.DiGraph
        self._available: Optional[bool] = None
        self._loaded: bool = False

    @property
    def available(self) -> bool:
        if self._available is None:
            try:
                import networkx  # noqa: F401
                self._available = True
            except ImportError:
                self._available = False
        return self._available

    def _ensure_graph(self) -> Any:
        if self._graph is not None:
            return self._graph
        if not self.available:
            raise RuntimeError("networkx kurulu degil. pip install networkx")
        import networkx as nx
        self._graph = nx.DiGraph()
        return self._graph

    @property
    def _path(self) -> Path:
        return Path(get_settings().knowledge_graph_path)

    async def load(self) -> None:
        async with self._lock:
            if self._loaded:
                return
            self._ensure_graph()
            path = self._path
            if path.exists():
                try:
                    data = json.loads(path.read_text(encoding="utf-8"))
                    for node in data.get("nodes", []):
                        nid = node.pop("id", None)
                        if nid:
                            self._graph.add_node(nid, **node)
                    for edge in data.get("edges", []):
                        src = edge.pop("source", None)
                        dst = edge.pop("target", None)
                        if src and dst:
                            self._graph.add_edge(src, dst, **edge)
                    logger.info(
                        "KnowledgeGraph yuklendi: %d node, %d edge",
                        self._graph.number_of_nodes(),
                        self._graph.number_of_edges(),
                    )
                except Exception as exc:
                    logger.warning("KG yukleme hatasi: %s", exc)
            self._loaded = True

    async def save(self) -> None:
        async with self._lock:
            if self._graph is None:
                return
            path = self._path
            path.parent.mkdir(parents=True, exist_ok=True)
            data = {
                "nodes": [
                    {"id": n, **dict(self._graph.nodes[n])}
                    for n in self._graph.nodes
                ],
                "edges": [
                    {"source": u, "target": v, **dict(self._graph.edges[u, v])}
                    for u, v in self._graph.edges
                ]}
            path.write_text(
                json.dumps(data, ensure_ascii=False, indent=2, default=str),
                encoding="utf-8",
            )

    async def add_entity(self, name: str, entity_type: str = "concept", **props: Any) -> None:
        await self.load()
        self._graph.add_node(name, type=entity_type, **props)
        await self.save()

    async def add_relation(
        self,
        source: str,
        target: str,
        label: str = "related_to",
        **props: Any,
    ) -> None:
        await self.load()
        # Otomatik node olustur
        if source not in self._graph:
            self._graph.add_node(source, type="concept")
        if target not in self._graph:
            self._graph.add_node(target, type="concept")
        self._graph.add_edge(source, target, label=label, **props)
        await self.save()

    async def neighbors(self, name: str, *, depth: int = 1) -> Dict[str, Any]:
        await self.load()
        if name not in self._graph:
            return {"node": name, "found": False, "neighbors": []}
        import networkx as nx
        try:
            sub_nodes = nx.single_source_shortest_path_length(self._graph, name, cutoff=depth)
        except Exception:
            sub_nodes = {name: 0}
        neighbors_data = []
        for n, dist in sub_nodes.items():
            if n == name:
                continue
            neighbors_data.append({
                "name": n,
                "distance": dist,
                "type": self._graph.nodes[n].get("type", "")})
        return {"node": name, "found": True, "neighbors": neighbors_data}

    async def search(self, query: str, *, limit: int = 10) -> List[Dict[str, Any]]:
        await self.load()
        q = query.lower()
        matches: List[Dict[str, Any]] = []
        for n in self._graph.nodes:
            if q in str(n).lower():
                matches.append({"name": n, **dict(self._graph.nodes[n])})
                if len(matches) >= limit:
                    break
        return matches


# Singleton
knowledge_graph = KnowledgeGraph()