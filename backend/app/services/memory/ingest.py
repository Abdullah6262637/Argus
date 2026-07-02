"""Doküman ingest pipeline (FAZ 3.4): chunk + embed + store."""
from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.services.memory.embedding import embedding_service
from app.services.memory.vector_store import vector_store

logger = logging.getLogger(__name__)


def chunk_text(
    text: str,
    *,
    chunk_size: int = 800,
    overlap: int = 120,
) -> List[str]:
    """Metni paragraf-aware overlap'li chunk'lara boler."""
    if not text:
        return []
    text = text.strip()
    if len(text) <= chunk_size:
        return [text]

    # Once paragraflara bol
    paragraphs = re.split(r"\n\s*\n", text)
    chunks: List[str] = []
    current = ""
    for p in paragraphs:
        p = p.strip()
        if not p:
            continue
        if len(current) + len(p) + 2 <= chunk_size:
            current = (current + "\n\n" + p) if current else p
        else:
            if current:
                chunks.append(current)
            # Tek paragraf bile cok buyukse cumle bazli bol
            if len(p) > chunk_size:
                sentences = re.split(r"(?<=[.!?])\s+", p)
                buf = ""
                for s in sentences:
                    if len(buf) + len(s) + 1 <= chunk_size:
                        buf = (buf + " " + s) if buf else s
                    else:
                        if buf:
                            chunks.append(buf)
                        buf = s
                current = buf
            else:
                current = p
    if current:
        chunks.append(current)

    # Overlap ekle
    if overlap > 0 and len(chunks) > 1:
        overlapped: List[str] = [chunks[0]]
        for i in range(1, len(chunks)):
            prev_tail = chunks[i - 1][-overlap:]
            overlapped.append(prev_tail + "\n" + chunks[i])
        chunks = overlapped

    return chunks


async def ingest_text(
    text: str,
    *,
    source: str = "manual",
    agent_id: Optional[str] = None,
    collection: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    chunk_size: int = 800,
    overlap: int = 120,
) -> Dict[str, Any]:
    """Bir metni chunk'la, embed et, vector store'a yaz."""
    chunks = chunk_text(text, chunk_size=chunk_size, overlap=overlap)
    if not chunks:
        return {"chunks": 0, "ids": []}

    embeddings = await embedding_service.embed(chunks)
    metas = []
    base_meta = metadata or {}
    for i in range(len(chunks)):
        m = dict(base_meta)
        m.update({"source": source, "chunk_index": i, "chunk_total": len(chunks)})
        metas.append(m)

    ids = vector_store.upsert(
        chunks,
        embeddings,
        metadatas=metas,
        agent_id=agent_id,
        collection=collection,
    )
    return {"chunks": len(chunks), "ids": ids, "source": source}


async def ingest_document(
    path: str,
    *,
    agent_id: Optional[str] = None,
    collection: Optional[str] = None,
    chunk_size: int = 800,
    overlap: int = 120,
) -> Dict[str, Any]:
    """Bir dosyayi oku, chunk + embed + store et."""
    p = Path(path).expanduser().resolve()
    if not p.exists() or not p.is_file():
        return {"ok": False, "error": f"Dosya yok: {p}"}

    # document_tools.py icindeki readers'i tekrar kullan
    from app.services.tools.document_tools import (
        _read_csv,
        _read_docx,
        _read_excel,
        _read_html,
        _read_pdf,
        _read_text,
    )

    ext = p.suffix.lower()
    try:
        if ext == ".pdf":
            text, _meta = _read_pdf(p, max_pages=200)
        elif ext == ".docx":
            text, _meta = _read_docx(p)
        elif ext in (".xlsx", ".xlsm"):
            text, _meta = _read_excel(p, max_rows_per_sheet=2000)
        elif ext == ".csv":
            text, _meta = _read_csv(p, max_rows=5000)
        elif ext in (".html", ".htm"):
            text, _meta = _read_html(p, max_chars=200000)
        else:
            text, _meta = _read_text(p, max_chars=500000)
    except Exception as exc:
        logger.exception("Ingest okuma hatasi")
        return {"ok": False, "error": f"Okuma hatasi: {exc}"}

    if not text.strip():
        return {"ok": False, "error": "Bos icerik"}

    result = await ingest_text(
        text,
        source=str(p),
        agent_id=agent_id,
        collection=collection,
        metadata={"filename": p.name, "ext": ext},
        chunk_size=chunk_size,
        overlap=overlap,
    )
    result["ok"] = True
    result["path"] = str(p)
    return result