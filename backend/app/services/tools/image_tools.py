"""Image tool'lari (Sprint 3.4): DALL-E ile gorsel uretim + vision aciklama."""
from __future__ import annotations

import base64
import logging
import os
from pathlib import Path
from typing import Any, Dict, Optional

from app.services.tools.base import BaseTool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


class ImageGenerateTool(BaseTool):
    name = "image_generate"
    description = (
        "Bir prompt'a gore gorsel uretir (OpenAI DALL-E). Sonucu lokal dosyaya "
        "kaydedip yolu doner."
    )
    permission = "web_search"
    parameters = {
        "type": "object",
        "properties": {
            "prompt": {"type": "string", "description": "Gorsel icin aciklama"},
            "size": {"type": "string", "description": "1024x1024 / 1792x1024 / 1024x1792 (varsayilan 1024x1024)"},
            "model": {"type": "string", "description": "OpenAI image model (varsayilan dall-e-3)"},
            "quality": {"type": "string", "description": "standard | hd (varsayilan standard)"},
            "output_path": {"type": "string", "description": "Kayit yolu (varsayilan: ./generated_<id>.png)"},
            "api_key": {"type": "string", "description": "OPENAI_API_KEY override (opsiyonel)"}},
        "required": ["prompt"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        prompt = str(args.get("prompt") or "").strip()
        if not prompt:
            return ToolResult(ok=False, error="prompt zorunlu")
        size = str(args.get("size") or "1024x1024")
        model = str(args.get("model") or "dall-e-3")
        quality = str(args.get("quality") or "standard")
        output_path = args.get("output_path")

        api_key = str(args.get("api_key") or os.environ.get("OPENAI_API_KEY") or "")
        if not api_key:
            return ToolResult(ok=False, error="OPENAI_API_KEY ayarli degil")

        try:
            from openai import AsyncOpenAI  # type: ignore
        except ImportError:
            return ToolResult(ok=False, error="openai paketi kurulu degil")

        client = AsyncOpenAI(api_key=api_key)
        try:
            resp = await client.images.generate(
                model=model,
                prompt=prompt,
                size=size,  # type: ignore[arg-type]
                quality=quality,  # type: ignore[arg-type]
                response_format="b64_json",
                n=1,
            )
        except Exception as exc:
            logger.exception("image_generate hata")
            return ToolResult(ok=False, error=f"Image API hata: {exc}")

        b64 = resp.data[0].b64_json if resp.data else None
        if not b64:
            return ToolResult(ok=False, error="API cevap bos")

        try:
            data = base64.b64decode(b64)
        except Exception as exc:
            return ToolResult(ok=False, error=f"Base64 cozumleme hata: {exc}")

        if not output_path:
            out_dir = Path.cwd() / "generated_images"
            out_dir.mkdir(parents=True, exist_ok=True)
            from uuid import uuid4
            output_path = str(out_dir / f"img_{uuid4().hex[:8]}.png")
        out_p = Path(output_path).expanduser().resolve()
        out_p.parent.mkdir(parents=True, exist_ok=True)
        out_p.write_bytes(data)

        return ToolResult(
            ok=True,
            output=f"Gorsel uretildi: {out_p}",
            data={
                "path": str(out_p),
                "size": size,
                "model": model,
                "image_base64": b64[:100] + "..."  # preview only
            },
        )