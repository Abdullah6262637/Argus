"""Doküman ingest pipeline (FAZ 3.4): chunk + embed + store."""
from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.services.memory.embedding import embedding_service
from app.services.memory.vector_store import vector_store

logger = logging.getLogger(__name__)


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 100) -> List[str]:
    """Metni anlamsal sinirlara gore parcalar.
    
    Markdown basliklar, paragraf sinirlari ve kod bloklari
    dogal bolunme noktalari olarak kullanilir.
    """
    if not text or not text.strip():
        return []
    
    # 1. Dogal sinirlarda bol
    segments = _split_by_boundaries(text)
    
    # 2. Buyuk segmentleri chunk_size'a gore parcala
    chunks = []
    current = ""
    for seg in segments:
        if len(current) + len(seg) <= chunk_size:
            current += seg
        else:
            if current.strip():
                chunks.append(current.strip())
            if len(seg) > chunk_size:
                # Cok buyuk segment - karakter bazli bol
                for i in range(0, len(seg), chunk_size - overlap):
                    part = seg[i:i + chunk_size]
                    if part.strip():
                        chunks.append(part.strip())
                current = ""
            else:
                current = seg
    if current.strip():
        chunks.append(current.strip())
    
    # 3. Overlap ekle
    if overlap > 0 and len(chunks) > 1:
        overlapped = [chunks[0]]
        for i in range(1, len(chunks)):
            prev_tail = chunks[i-1][-overlap:] if len(chunks[i-1]) > overlap else ""
            overlapped.append(prev_tail + chunks[i])
        chunks = overlapped
    
    return chunks


def _split_by_boundaries(text: str) -> List[str]:
    """Metni dogal sinirlara gore parcalar."""
    import re
    # Markdown basliklar, paragraf sinirlari ve kod bloklari
    parts = []
    # Kod bloklarini koru
    code_pattern = re.compile(r'(```[\s\S]*?```)', re.MULTILINE)
    last_end = 0
    for m in code_pattern.finditer(text):
        before = text[last_end:m.start()]
        if before:
            parts.extend(_split_prose(before))
        parts.append(m.group(0))  # Kod bloku parcalanmaz
        last_end = m.end()
    remaining = text[last_end:]
    if remaining:
        parts.extend(_split_prose(remaining))
    return parts


def _split_prose(text: str) -> List[str]:
    """Duz metni paragraf ve baslik sinirlarinda parcalar."""
    import re
    # Markdown basliklari ve cift satir sonu
    pattern = re.compile(r'(?=^#{1,4} |\n\n)', re.MULTILINE)
    segments = pattern.split(text)
    return [s for s in segments if s and s.strip()]


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