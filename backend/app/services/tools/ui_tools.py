"""UI otomasyon tool'lari: screenshot, click, type_text, key_press, mouse_move."""
from __future__ import annotations

import asyncio
import base64
import io
import logging
import os
import time
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

from app.services.tools.base import BaseTool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


def _try_import_pyautogui():
    try:
        import pyautogui  # type: ignore
        pyautogui.FAILSAFE = True
        pyautogui.PAUSE = 0.1
        return pyautogui
    except Exception as exc:
        logger.warning("pyautogui yuklenemedi: %s", exc)
        return None


class ScreenshotTool(BaseTool):
    name = "screenshot"
    description = (
        "Ekranin tamaminin veya belirtilen bolgesinin gorsel kaydini alir. "
        "Dosya olarak kaydeder ve dosya yolunu doner. Ekrandaki seyleri "
        "gorup karar vermek icin kullan."
    )
    permission = "system_admin"
    parameters = {
        "type": "object",
        "properties": {
            "save_path": {
                "type": "string",
                "description": "(opsiyonel) Kaydedilecek dosya yolu. Bos ise gecici dizine kaydedilir."},
            "region": {
                "type": "array",
                "description": "(opsiyonel) [x, y, w, h] dikdortgeni. Bos ise tum ekran.",
                "items": {"type": "integer"}}},
        "required": []}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        save_path: Optional[str] = args.get("save_path") or None
        region = args.get("region") or None

        try:
            result = await asyncio.get_event_loop().run_in_executor(
                None, self._capture_sync, save_path, region
            )
            return ToolResult(ok=True, output=result["output"], data=result["data"])
        except Exception as exc:
            logger.exception("screenshot hatasi")
            return ToolResult(ok=False, error=f"Ekran goruntusu alinamadi: {exc}")

    @staticmethod
    def _capture_sync(save_path: Optional[str], region: Optional[list]) -> Dict[str, Any]:
        try:
            import mss  # type: ignore
            from PIL import Image  # type: ignore
        except ImportError as exc:
            raise RuntimeError(f"mss veya Pillow yuklu degil: {exc}")

        with mss.mss() as sct:
            if region and len(region) == 4:
                x, y, w, h = region
                bbox = {"left": int(x), "top": int(y), "width": int(w), "height": int(h)}
            else:
                bbox = sct.monitors[0]  # tum ekran (cok-monitor dahil)
            img_raw = sct.grab(bbox)
            img = Image.frombytes("RGB", img_raw.size, img_raw.rgb)

        if not save_path:
            tmp_dir = Path(os.environ.get("TEMP") or "/tmp") / "umtalagent_screens"
            tmp_dir.mkdir(parents=True, exist_ok=True)
            save_path = str(tmp_dir / f"screen_{int(time.time() * 1000)}.png")
        else:
            Path(save_path).parent.mkdir(parents=True, exist_ok=True)

        img.save(save_path, format="PNG")

        # ufak base64 onizleme (data URL'siz, sadece ek info icin)
        return {
            "output": f"Ekran goruntusu alindi: {save_path} ({img.size[0]}x{img.size[1]})",
            "data": {"path": save_path, "width": img.size[0], "height": img.size[1]}}


class ClickTool(BaseTool):
    name = "click"
    description = (
        "Fareyle belirtilen ekran koordinatlarina tikla. "
        "Once screenshot ile ekrani gor, sonra koordinati hesapla."
    )
    permission = "system_admin"
    parameters = {
        "type": "object",
        "properties": {
            "x": {"type": "integer", "description": "X koordinati (piksel)."},
            "y": {"type": "integer", "description": "Y koordinati (piksel)."},
            "button": {
                "type": "string",
                "enum": ["left", "right", "middle"],
                "description": "Hangi tus (varsayilan left).",
                "default": "left"},
            "double": {
                "type": "boolean",
                "description": "Cift tiklama mi (varsayilan false).",
                "default": False}},
        "required": ["x", "y"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        pyautogui = _try_import_pyautogui()
        if not pyautogui:
            return ToolResult(ok=False, error="pyautogui yuklu degil")

        x = int(args.get("x", 0))
        y = int(args.get("y", 0))
        button = args.get("button") or "left"
        double = bool(args.get("double", False))

        try:
            if double:
                await asyncio.get_event_loop().run_in_executor(
                    None, lambda: pyautogui.doubleClick(x, y, button=button)
                )
            else:
                await asyncio.get_event_loop().run_in_executor(
                    None, lambda: pyautogui.click(x, y, button=button)
                )
            return ToolResult(
                ok=True,
                output=f"({x},{y}) konumuna {button} {'cift ' if double else ''}tikladi.",
                data={"x": x, "y": y, "button": button, "double": double},
            )
        except Exception as exc:
            return ToolResult(ok=False, error=f"Tikla basarisiz: {exc}")


class TypeTextTool(BaseTool):
    name = "type_text"
    description = (
        "Klavyeden metin yazar (su an aktif olan pencerede). "
        "Once odaklanmak istedigin yere click ile tikla, sonra type_text kullan."
    )
    permission = "system_admin"
    parameters = {
        "type": "object",
        "properties": {
            "text": {"type": "string", "description": "Yazilacak metin."},
            "interval": {
                "type": "number",
                "description": "Karakterler arasi gecikme (saniye, varsayilan 0.02).",
                "default": 0.02}},
        "required": ["text"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        pyautogui = _try_import_pyautogui()
        if not pyautogui:
            return ToolResult(ok=False, error="pyautogui yuklu degil")

        text = args.get("text") or ""
        interval = float(args.get("interval") or 0.02)

        try:
            # pyautogui.write sadece ASCII'yi destekler. Turkce icin clipboard kullan.
            if any(ord(c) > 127 for c in text):
                await asyncio.get_event_loop().run_in_executor(None, self._paste_unicode, text)
                method = "clipboard"
            else:
                await asyncio.get_event_loop().run_in_executor(
                    None, lambda: pyautogui.write(text, interval=interval)
                )
                method = "keyboard"
            return ToolResult(
                ok=True,
                output=f"{len(text)} karakter yazildi ({method}).",
                data={"length": len(text), "method": method},
            )
        except Exception as exc:
            return ToolResult(ok=False, error=f"Metin yazilamadi: {exc}")

    @staticmethod
    def _paste_unicode(text: str) -> None:
        try:
            import pyperclip  # type: ignore
            import pyautogui  # type: ignore
            pyperclip.copy(text)
            pyautogui.hotkey("ctrl", "v")
        except ImportError:
            # pyperclip yoksa fallback: pyautogui ile karakter karakter (Turkce kayar)
            import pyautogui  # type: ignore
            pyautogui.write(text, interval=0.02)


class KeyPressTool(BaseTool):
    name = "key_press"
    description = (
        "Tek bir klavye tusuna veya kombinasyonuna basar. "
        "Ornekler: 'enter', 'esc', 'tab', 'win', 'ctrl+c', 'ctrl+shift+t'."
    )
    permission = "system_admin"
    parameters = {
        "type": "object",
        "properties": {
            "keys": {
                "type": "string",
                "description": "Tek tus veya '+' ile birlestirilen kombinasyon."}
        },
        "required": ["keys"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        pyautogui = _try_import_pyautogui()
        if not pyautogui:
            return ToolResult(ok=False, error="pyautogui yuklu degil")

        keys = (args.get("keys") or "").strip()
        if not keys:
            return ToolResult(ok=False, error="Tus belirtilmedi")

        try:
            parts = [k.strip().lower() for k in keys.split("+") if k.strip()]
            if len(parts) > 1:
                await asyncio.get_event_loop().run_in_executor(
                    None, lambda: pyautogui.hotkey(*parts)
                )
            else:
                await asyncio.get_event_loop().run_in_executor(
                    None, lambda: pyautogui.press(parts[0])
                )
            return ToolResult(ok=True, output=f"Tus(lar) basildi: {keys}", data={"keys": keys})
        except Exception as exc:
            return ToolResult(ok=False, error=f"Tus basilirken hata: {exc}")


class MouseMoveTool(BaseTool):
    name = "mouse_move"
    description = "Fare imlecini belirtilen koordinatlara tasiir (tiklamadan)."
    permission = "system_admin"
    parameters = {
        "type": "object",
        "properties": {
            "x": {"type": "integer"},
            "y": {"type": "integer"},
            "duration": {
                "type": "number",
                "description": "Hareket suresi (saniye, varsayilan 0.2).",
                "default": 0.2}},
        "required": ["x", "y"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        pyautogui = _try_import_pyautogui()
        if not pyautogui:
            return ToolResult(ok=False, error="pyautogui yuklu degil")

        x = int(args.get("x", 0))
        y = int(args.get("y", 0))
        duration = float(args.get("duration") or 0.2)
        try:
            await asyncio.get_event_loop().run_in_executor(
                None, lambda: pyautogui.moveTo(x, y, duration=duration)
            )
            return ToolResult(ok=True, output=f"Fare ({x},{y}) konumuna tasindi.", data={"x": x, "y": y})
        except Exception as exc:
            return ToolResult(ok=False, error=f"Fare hareketi basarisiz: {exc}")