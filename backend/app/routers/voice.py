"""/api/voice router (FAZ 8.2)."""
from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field

from app.services.voice import voice_service

router = APIRouter(prefix="/api/voice", tags=["voice"])


class TranscribeOut(BaseModel):
    text: str
    language: str | None = None


class SpeakRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=4000)
    voice: str = "tr-TR-EmelNeural"


@router.get("/status")
async def status() -> dict:
    return {
        "stt_available": voice_service.stt_available,
        "tts_available": voice_service.tts_available}


@router.post("/transcribe", response_model=TranscribeOut)
async def transcribe(file: UploadFile = File(...), language: str | None = None) -> TranscribeOut:
    if not voice_service.stt_available:
        raise HTTPException(503, "STT kurulu degil. pip install -r requirements-voice.txt")
    audio = await file.read()
    try:
        text = await voice_service.transcribe(audio, language=language)
    except RuntimeError as exc:
        raise HTTPException(503, str(exc))
    except Exception as exc:
        raise HTTPException(500, f"Transcribe hata: {exc}")
    return TranscribeOut(text=text, language=language)


@router.get("/speak")
async def speak(
    text: str = Query(..., min_length=1, max_length=4000),
    voice: str = Query("tr-TR-EmelNeural")
):
    """TTS endpoint - GET request ile text parametresi alir, audio dondurur."""
    if not voice_service.tts_available:
        raise HTTPException(503, "TTS kurulu degil. pip install -r requirements-voice.txt")
    try:
        audio = await voice_service.speak_to_bytes(text, voice=voice)
    except RuntimeError as exc:
        raise HTTPException(503, str(exc))
    except Exception as exc:
        raise HTTPException(500, f"TTS hata: {exc}")
    return Response(content=audio, media_type="audio/mpeg")