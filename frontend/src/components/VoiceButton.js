import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// VoiceButton (Sprint 2.4): MediaRecorder ile mic kayit + transcribe
import { useEffect, useRef, useState } from 'react';
import { api } from '@/api/client';
export function VoiceButton({ onTranscribed, disabled }) {
    const [recording, setRecording] = useState(false);
    const [busy, setBusy] = useState(false);
    const [available, setAvailable] = useState(null);
    const [error, setError] = useState(null);
    const recorderRef = useRef(null);
    const chunksRef = useRef([]);
    const streamRef = useRef(null);
    useEffect(() => {
        api.voiceStatus()
            .then((s) => setAvailable(Boolean(s.stt_available)))
            .catch(() => setAvailable(false));
    }, []);
    const stopAll = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        recorderRef.current = null;
        chunksRef.current = [];
    };
    const start = async () => {
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const mr = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                    ? 'audio/webm;codecs=opus'
                    : 'audio/webm'
            });
            recorderRef.current = mr;
            chunksRef.current = [];
            mr.ondataavailable = (e) => {
                if (e.data.size > 0)
                    chunksRef.current.push(e.data);
            };
            mr.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                stopAll();
                if (blob.size === 0) {
                    setRecording(false);
                    return;
                }
                setBusy(true);
                try {
                    const result = await api.voiceTranscribe(blob, 'tr');
                    if (result.text) {
                        onTranscribed(result.text);
                    }
                }
                catch (err) {
                    setError(err instanceof Error ? err.message : String(err));
                }
                finally {
                    setBusy(false);
                    setRecording(false);
                }
            };
            mr.start();
            setRecording(true);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Mikrofon erisimi reddedildi');
            stopAll();
            setRecording(false);
        }
    };
    const stop = () => {
        if (recorderRef.current && recorderRef.current.state !== 'inactive') {
            recorderRef.current.stop();
        }
        else {
            stopAll();
            setRecording(false);
        }
    };
    if (available === false) {
        return null; // STT yoksa button hic gosterme
    }
    const isDisabled = disabled || busy || available === null;
    return (_jsxs("div", { className: "flex items-center", children: [_jsx("button", { type: "button", onClick: recording ? stop : start, disabled: isDisabled, className: `h-10 w-10 flex items-center justify-center rounded transition disabled:opacity-40 ${recording
                    ? 'bg-brand-danger text-brand-bg animate-pulse'
                    : 'border border-brand-border text-brand-muted hover:text-brand-text hover:border-brand-borderStrong'}`, title: recording ? 'Kaydi durdur' : 'Sesli mesaj (mikrofonla yaz)', children: busy ? (_jsx("span", { className: "text-xs", children: "..." })) : recording ? (
                // Stop icon
                _jsx("span", { className: "block w-3 h-3 bg-current" })) : (
                // Mic icon (basit SVG)
                _jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("rect", { x: "9", y: "3", width: "6", height: "11", rx: "3" }), _jsx("path", { d: "M5 11a7 7 0 0 0 14 0M12 18v3" })] })) }), error && (_jsx("span", { className: "ml-2 text-[10px] text-brand-danger truncate max-w-[160px]", children: error }))] }));
}
