"""ParseLayoutDocumentTool: Tablo ve paragraf uyumlu PDF/Word okuyucu."""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict

from app.services.tools.base import BaseTool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


class ParseLayoutDocumentTool(BaseTool):
    """Tablo ve yapisal korumalı PDF/Word okuyucu."""

    name = "parse_layout_document"
    description = (
        "PDF ve Word gibi dökümanları görsel yapısını, tablolarını ve paragraflarını "
        "koruyarak temiz metin biçiminde okur ve inceler."
    )
    permission = "file_system"
    parameters = {
        "type": "object",
        "properties": {
            "file_path": {
                "type": "string",
                "description": "Okunacak dosyanın tam veya göreceli yolu"
            }
        },
        "required": ["file_path"]
    }

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        file_path_str = (args.get("file_path") or "").strip()
        if not file_path_str:
            return ToolResult(ok=False, error="Dosya yolu bos olamaz")

        cwd = context.workspace_dir or "."
        path = Path(cwd) / file_path_str
        if not path.exists():
            path = Path(file_path_str)
            if not path.exists():
                return ToolResult(ok=False, error=f"Dosya bulunamadi: {file_path_str}")

        suffix = path.suffix.lower()
        if suffix not in (".pdf", ".docx", ".doc"):
            return ToolResult(ok=False, error=f"Desteklenmeyen dosya formati: {suffix}. Sadece PDF/Word desteklenir.")

        try:
            content_lines = []
            if suffix == ".pdf":
                # Fallback based pdf parser
                try:
                    import pdfplumber  # type: ignore
                    with pdfplumber.open(path) as pdf:
                        for page in pdf.pages[:10]:
                            text = page.extract_text()
                            if text:
                                content_lines.append(f"--- Sayfa {page.page_number} ---")
                                content_lines.append(text)
                            tables = page.extract_tables()
                            for t in tables:
                                if t:
                                    content_lines.append("\n[Tablo]")
                                    for row in t:
                                        content_lines.append(" | ".join(str(cell or "").strip() for cell in row))
                except ImportError:
                    try:
                        import pypdf
                        reader = pypdf.PdfReader(path)
                        for idx, page in enumerate(reader.pages[:10]):
                            text = page.extract_text()
                            if text:
                                content_lines.append(f"--- Sayfa {idx+1} ---")
                                content_lines.append(text)
                    except ImportError:
                        return ToolResult(ok=False, error="PDF okumak icin 'pypdf' veya 'pdfplumber' paketi yuklu olmalıdır.")
            else:
                try:
                    import docx  # type: ignore
                    doc = docx.Document(path)
                    for p in doc.paragraphs:
                        if p.text:
                            content_lines.append(p.text)
                except ImportError:
                    return ToolResult(ok=False, error="Word dosyalari icin 'python-docx' paketi yuklu olmalıdır.")

            output_text = "\n".join(content_lines)
            if len(output_text) > 30000:
                output_text = output_text[:30000] + "\n\n... (Dosya çok uzun oldugu icin kirpildi) ..."
            
            return ToolResult(ok=True, output=output_text or "(Dosya bos)", data={"path": str(path)})

        except Exception as exc:
            logger.exception("parse_layout_document hatasi")
            return ToolResult(ok=False, error=f"Dosya okunurken hata olustu: {exc}")
