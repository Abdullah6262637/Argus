import { useEffect, useRef, useState } from 'react';
import { WS_BASE } from '@/api/client';
/**
 * Backend /ws endpoint'ine baglanir, gelen mesajlari onMessage'a iletir.
 * Baglanti kopunca otomatik yeniden bagli olur.
 *
 * React 18 StrictMode ile uyumlu: cleanup sirasinda WS kapatilir ve
 * unmount-sonrasi setState cagrilari engellenir.
 */
export function useWebSocket({ url = '/ws', onMessage, reconnectMs = 3000 } = {}) {
    const [connected, setConnected] = useState(false);
    const wsRef = useRef(null);
    const callbackRef = useRef(onMessage);
    const reconnectTimer = useRef(null);
    const closedByClient = useRef(false);
    const mountedRef = useRef(true);
    // callback'i mutable ref icine al
    useEffect(() => {
        callbackRef.current = onMessage;
    }, [onMessage]);
    useEffect(() => {
        mountedRef.current = true;
        closedByClient.current = false;
        const safeSetConnected = (value) => {
            if (mountedRef.current) {
                setConnected(value);
            }
        };
        const connect = () => {
            if (!mountedRef.current || closedByClient.current)
                return;
            const fullUrl = url.startsWith('ws://') || url.startsWith('wss://')
                ? url
                : `${WS_BASE}${url}`;
            let ws;
            try {
                ws = new WebSocket(fullUrl);
            }
            catch {
                // WebSocket constructor exception (cok nadir) - reconnect dene
                if (!closedByClient.current && mountedRef.current) {
                    reconnectTimer.current = window.setTimeout(connect, reconnectMs);
                }
                return;
            }
            wsRef.current = ws;
            ws.onopen = () => safeSetConnected(true);
            ws.onclose = () => {
                safeSetConnected(false);
                if (!closedByClient.current && mountedRef.current) {
                    reconnectTimer.current = window.setTimeout(connect, reconnectMs);
                }
            };
            ws.onerror = () => {
                // onclose zaten tetiklenecek
            };
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    callbackRef.current?.(data);
                }
                catch {
                    /* ignore */
                }
            };
        };
        connect();
        return () => {
            mountedRef.current = false;
            closedByClient.current = true;
            if (reconnectTimer.current) {
                clearTimeout(reconnectTimer.current);
                reconnectTimer.current = null;
            }
            const ws = wsRef.current;
            wsRef.current = null;
            if (ws) {
                // Listener'lari sokup kapat - unmount sonrasi onclose tetiklenmesin
                ws.onopen = null;
                ws.onclose = null;
                ws.onerror = null;
                ws.onmessage = null;
                try {
                    ws.close();
                }
                catch {
                    /* ignore */
                }
            }
        };
    }, [url, reconnectMs]);
    const send = (data) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(data);
        }
    };
    return { connected, send };
}
