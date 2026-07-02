"""Voice mode (FAZ 8.2): Whisper STT + TTS.

Opsiyonel; requirements-voice.txt yuklu degilse modul yine import edilir
ama gercek cagrilarda RuntimeError doner.
"""
from __future__ import annotations

import asyncio
import io
import logging
import tempfile
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


class VoiceService:
    def __init__(self) -> None:
        self._whisper_model = None
        self._lock = asyncio.Lock()

    @property
    def stt_available(self) -> bool:
        try:
            import faster_whisper  # type: ignore  # pyright: ignore[reportMissingImports]  # noqa: F401
            return True
        except ImportError:
            return False

    @property
    def tts_available(self) -> bool:
        try:
            import edge_tts  # type: ignore  # pyright: ignore[reportMissingImports]  # noqa: F401
            return True
        except ImportError:
            try:
                import pyttsx3  # type: ignore  # pyright: ignore[reportMissingImports]  # noqa: F401
                return True
            except ImportError:
                return False

    async def _ensure_whisper(self, model_size: str = "tiny") -> None:
        if self._whisper_model is not None:
            return
        async with self._lock:
            if self._whisper_model is not None:
                return
            from faster_whisper import WhisperModel  # type: ignore  # pyright: ignore[reportMissingImports]
            logger.info("Whisper modeli yukleniyor: %s", model_size)
            loop = asyncio.get_event_loop()
            self._whisper_model = await loop.run_in_executor(
                None, lambda: WhisperModel(model_size, device="cpu", compute_type="int8")
            )

    async def transcribe(self, audio_bytes: bytes, *, language: Optional[str] = None) -> str:
        if not self.stt_available:
            raise RuntimeError(
                "faster-whisper kurulu degil. "
                "Yuklemek icin: pip install -r requirements-voice.txt"
            )
        await self._ensure_whisper()

        # Gecici dosyaya yaz
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            loop = asyncio.get_event_loop()
            segments, info = await loop.run_in_executor(
                None,
                lambda: self._whisper_model.transcribe(tmp_path, language=language),  # type: ignore
            )
            text = "".join(s.text for s in segments).strip()
            return text
        finally:
            try:
                Path(tmp_path).unlink()
            except Exception:
                pass

    async def speak_to_bytes(self, text: str, *, voice: str = "tr-TR-EmelNeural") -> bytes:
        """Metni MP3 audio bytes'a cevir. edge-tts ya da pyttsx3 fallback."""
        if not text.strip():
            return b""

        # Once edge-tts dene
        try:
            import edge_tts  # type: ignore  # pyright: ignore[reportMissingImports]
            communicate = edge_tts.Communicate(text, voice)
            buffer = io.BytesIO()
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    buffer.write(chunk["data"])
            return buffer.getvalue()
        except ImportError:
            pass
        except Exception as exc:
            logger.warning("edge-tts hatasi, pyttsx3'e dusuyor: %s", exc)

        # pyttsx3 fallback (sync, executor'da calistir)
        try:
            import pyttsx3  # type: ignore  # pyright: ignore[reportMissingImports]
            loop = asyncio.get_event_loop()

            def synthesize() -> bytes:
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                    out_path = tmp.name
                engine = pyttsx3.init()
                engine.save_to_file(text, out_path)
                engine.runAndWait()
                data = Path(out_path).read_bytes()
                try:
                    Path(out_path).unlink()
                except Exception:
                    pass
                return data

            return await loop.run_in_executor(None, synthesize)
        except ImportError:
            raise RuntimeError("Hicbir TTS engine yok (edge-tts veya pyttsx3 yuklu olmali)")


# Singleton
voice_service = VoiceService()