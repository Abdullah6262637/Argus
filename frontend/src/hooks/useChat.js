import { useCallback, useEffect, useRef, useState } from 'react';
import { api, API_BASE } from '@/api/client';
export function useChat(agentId, mode = 'sse') {
    const [conversationId, setConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    // Asistan henuz cevap vermeden once devreye giren tool cagrilari
    const [liveToolCalls, setLiveToolCalls] = useState([]);
    // Plan-aware (FAZ 1.4 / Sprint 1.1)
    const [plan, setPlan] = useState(null);
    const [lastReflection, setLastReflection] = useState(null);
    // Iptal icin AbortController referansi
    const abortRef = useRef(null);
    // Ajan degistikce state'i sifirla
    useEffect(() => {
        setConversationId(null);
        setMessages([]);
        setError(null);
        setLiveToolCalls([]);
        setPlan(null);
        setLastReflection(null);
        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
        }
    }, [agentId]);
    // Unmount cleanup
    useEffect(() => {
        return () => {
            if (abortRef.current) {
                abortRef.current.abort();
                abortRef.current = null;
            }
        };
    }, []);
    const loadConversation = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            const conv = await api.getConversation(id);
            setConversationId(conv.id);
            setMessages(conv.messages);
            setPlan(null);
            setLastReflection(null);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
        finally {
            setLoading(false);
        }
    }, []);
    const newConversation = useCallback(() => {
        setConversationId(null);
        setMessages([]);
        setError(null);
        setLiveToolCalls([]);
        setPlan(null);
        setLastReflection(null);
    }, []);
    // ------------------------------------------------------------------
    // Plan helpers
    // ------------------------------------------------------------------
    const updateStep = useCallback((stepId, updater) => {
        setPlan((prev) => {
            if (!prev)
                return prev;
            const idx = prev.steps.findIndex((s) => s.id === stepId);
            if (idx < 0)
                return prev;
            const newSteps = [...prev.steps];
            newSteps[idx] = updater(newSteps[idx]);
            return { ...prev, steps: newSteps };
        });
    }, []);
    // ------------------------------------------------------------------
    // SSE event handler (Sprint 1.1)
    // ------------------------------------------------------------------
    const handleSseEvent = useCallback((eventType, data, ctx) => {
        switch (eventType) {
            case 'plan_created':
            case 'plan_started': {
                const p = data.plan;
                if (p)
                    setPlan(p);
                break;
            }
            case 'plan_replanned': {
                const newSteps = data.new_steps || [];
                setPlan((prev) => {
                    if (!prev)
                        return prev;
                    const existing = new Set(prev.steps.map((s) => s.id));
                    return {
                        ...prev,
                        steps: [...prev.steps, ...newSteps.filter((s) => !existing.has(s.id))]
                    };
                });
                break;
            }
            case 'plan_completed': {
                const p = data.plan;
                const summary = data.final_summary || '';
                setPlan((prev) => {
                    if (p)
                        return { ...(prev || p), ...p, status: 'completed', final_summary: summary };
                    if (prev)
                        return { ...prev, status: 'completed', final_summary: summary };
                    return prev;
                });
                break;
            }
            case 'plan_failed': {
                const p = data.plan;
                setPlan((prev) => {
                    if (p)
                        return { ...(prev || p), ...p, status: 'failed' };
                    if (prev)
                        return { ...prev, status: 'failed' };
                    return prev;
                });
                break;
            }
            case 'step_started':
            case 'step_completed':
            case 'step_failed': {
                const step = data.step;
                if (step) {
                    updateStep(step.id, () => step);
                }
                break;
            }
            case 'step_retry': {
                const stepId = data.step_id;
                const attempt = data.attempt || 1;
                if (typeof stepId === 'number') {
                    updateStep(stepId, (s) => ({
                        ...s,
                        status: 'pending',
                        attempts: attempt
                    }));
                }
                break;
            }
            case 'reflection': {
                const stepId = data.step_id;
                const verdict = data.verdict || '';
                const reason = data.reason || '';
                const suggestedFix = data.suggested_fix;
                if (typeof stepId === 'number') {
                    updateStep(stepId, (s) => ({
                        ...s,
                        reflection: `${verdict}: ${reason}`
                    }));
                    setLastReflection({
                        step_id: stepId,
                        verdict,
                        reason,
                        suggested_fix: suggestedFix
                    });
                }
                break;
            }
            case 'tool_call_started': {
                const id = data.id;
                const name = data.name;
                const args = data.arguments || {};
                const stepId = data.step_id;
                setLiveToolCalls((prev) => {
                    if (prev.find((t) => t.id === id))
                        return prev;
                    return [
                        ...prev,
                        {
                            id,
                            name,
                            arguments: args,
                            ok: false,
                            output: '',
                            duration_ms: 0
                        }
                    ];
                });
                // Plan icindeki step'in tool_calls'una da ekle (ileride MessageBubble icin)
                if (typeof stepId === 'number') {
                    updateStep(stepId, (s) => ({
                        ...s,
                        tool_calls: [
                            ...(s.tool_calls || []),
                            {
                                id,
                                name,
                                arguments: args,
                                ok: false,
                                output: '',
                                duration_ms: 0
                            }
                        ]
                    }));
                }
                break;
            }
            case 'tool_call_completed': {
                const id = data.id;
                const stepId = data.step_id;
                const updates = {
                    ok: !!data.ok,
                    output: data.output || '',
                    error: data.error ?? null,
                    data: data.data || {},
                    duration_ms: data.duration_ms || 0
                };
                setLiveToolCalls((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
                if (typeof stepId === 'number') {
                    updateStep(stepId, (s) => ({
                        ...s,
                        tool_calls: (s.tool_calls || []).map((t) => t.id === id ? { ...t, ...updates } : t)
                    }));
                }
                break;
            }
            case 'message_saved': {
                // Backend final assistant mesajini DB'ye yazdi -> messages listesine ekle
                const convId = data.conversation_id;
                const userMsgId = data.user_message_id;
                const assistantMsgId = data.assistant_message_id;
                const content = data.content || '';
                if (convId)
                    setConversationId(convId);
                // Plan'in tool_calls'larini topla -> assistant mesajina iliskilendir
                const aggregatedTools = [];
                setPlan((prev) => {
                    if (prev) {
                        prev.steps.forEach((s) => {
                            (s.tool_calls || []).forEach((tc) => {
                                if (!aggregatedTools.find((x) => x.id === tc.id)) {
                                    aggregatedTools.push(tc);
                                }
                            });
                        });
                    }
                    return prev;
                });
                const userMsg = {
                    id: userMsgId,
                    conversation_id: convId,
                    role: 'user',
                    content: ctx.userContent,
                    created_at: new Date().toISOString()
                };
                const assistantMsg = {
                    id: assistantMsgId,
                    conversation_id: convId,
                    role: 'assistant',
                    content,
                    tokens: typeof data.tokens === 'number' ? data.tokens : undefined,
                    provider: typeof data.provider === 'string' ? data.provider : undefined,
                    model: typeof data.model === 'string' ? data.model : undefined,
                    created_at: new Date().toISOString(),
                    tool_calls: aggregatedTools.length > 0 ? aggregatedTools : undefined
                };
                setMessages((prev) => [
                    ...prev.filter((m) => m.id !== ctx.tempUserId),
                    userMsg,
                    assistantMsg
                ]);
                break;
            }
            case 'error': {
                const msg = data.message || 'Bilinmeyen hata';
                setError(msg);
                break;
            }
            case 'done':
                // stream sonu - cleanup send() finally'da yapilir
                break;
            default:
                // bilinmeyen event - sessizce yok say
                break;
        }
    }, [updateStep]);
    // ------------------------------------------------------------------
    // SSE parser - okurken event/data satirlarini birlestir
    // ------------------------------------------------------------------
    const consumeSseStream = useCallback(async (response, ctx, signal) => {
        if (!response.body) {
            throw new Error('SSE stream icin response.body yok');
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        const flushEvent = (rawLines) => {
            let eventType = 'message';
            const dataLines = [];
            for (const line of rawLines) {
                if (line.startsWith(':'))
                    continue; // SSE comment
                if (line.startsWith('event:')) {
                    eventType = line.slice(6).trim();
                }
                else if (line.startsWith('data:')) {
                    dataLines.push(line.slice(5).trim());
                }
            }
            if (dataLines.length === 0)
                return;
            const dataStr = dataLines.join('\n');
            let parsed = {};
            try {
                parsed = JSON.parse(dataStr);
            }
            catch {
                // JSON degilse string olarak gec
                parsed = { raw: dataStr };
            }
            handleSseEvent(eventType, parsed, ctx);
        };
        while (true) {
            if (signal.aborted) {
                try {
                    await reader.cancel();
                }
                catch {
                    /* ignore */
                }
                break;
            }
            const { value, done } = await reader.read();
            if (done)
                break;
            buffer += decoder.decode(value, { stream: true });
            // SSE event'leri \n\n ile ayrilir
            let dblNewline;
            while ((dblNewline = buffer.indexOf('\n\n')) !== -1) {
                const block = buffer.slice(0, dblNewline);
                buffer = buffer.slice(dblNewline + 2);
                const lines = block.split('\n').map((l) => l.replace(/\r$/, ''));
                flushEvent(lines);
            }
        }
        // kalan buffer'i flush et
        if (buffer.trim()) {
            const lines = buffer.split('\n').map((l) => l.replace(/\r$/, ''));
            flushEvent(lines);
        }
    }, [handleSseEvent]);
    // ------------------------------------------------------------------
    // SSE send
    // ------------------------------------------------------------------
    const sendSse = useCallback(async (content, tempUserId) => {
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        const resp = await fetch(`${API_BASE}/chat/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'text/event-stream'
            },
            body: JSON.stringify({
                agent_id: agentId,
                conversation_id: conversationId,
                content
            }),
            signal: ctrl.signal
        });
        if (!resp.ok) {
            let detail = `${resp.status} ${resp.statusText}`;
            try {
                const j = await resp.json();
                if (j?.detail)
                    detail = j.detail;
            }
            catch {
                /* ignore */
            }
            throw new Error(detail);
        }
        await consumeSseStream(resp, { tempUserId, userContent: content }, ctrl.signal);
    }, [agentId, conversationId, consumeSseStream]);
    // ------------------------------------------------------------------
    // REST send (legacy)
    // ------------------------------------------------------------------
    const sendRest = useCallback(async (content, tempUserId) => {
        const resp = await api.sendMessage({
            agent_id: agentId,
            conversation_id: conversationId,
            content
        });
        setConversationId(resp.conversation_id);
        const assistantWithTools = {
            ...resp.assistant_message,
            tool_calls: resp.tool_calls
        };
        setMessages((prev) => [
            ...prev.filter((m) => m.id !== tempUserId),
            resp.user_message,
            assistantWithTools
        ]);
    }, [agentId, conversationId]);
    // ------------------------------------------------------------------
    // send (public)
    // ------------------------------------------------------------------
    const send = useCallback(async (content) => {
        if (!agentId || !content.trim())
            return;
        setSending(true);
        setError(null);
        setLiveToolCalls([]);
        setPlan(null);
        setLastReflection(null);
        // Optimistic user mesaj
        const tempUserId = -Date.now();
        const tempUser = {
            id: tempUserId,
            conversation_id: conversationId ?? 0,
            role: 'user',
            content,
            created_at: new Date().toISOString()
        };
        setMessages((prev) => [...prev, tempUser]);
        try {
            if (mode === 'sse') {
                await sendSse(content, tempUserId);
            }
            else {
                await sendRest(content, tempUserId);
            }
        }
        catch (err) {
            // AbortError -> kullanici iptal etti, sessizce dus
            if (err instanceof DOMException && err.name === 'AbortError') {
                setMessages((prev) => prev.filter((m) => m.id !== tempUserId));
            }
            else {
                setError(err instanceof Error ? err.message : String(err));
                setMessages((prev) => prev.filter((m) => m.id !== tempUserId));
            }
        }
        finally {
            setSending(false);
            setLiveToolCalls([]);
            abortRef.current = null;
        }
    }, [agentId, conversationId, mode, sendSse, sendRest]);
    /**
     * WebSocket'ten gelen tool_call event'lerini buraya bagla.
     * SSE modunda zaten dahili olarak yakalaniyor; REST modunda WS'den ek bilgi
     * gelirse liveToolCalls guncellenir.
     */
    const onToolEvent = useCallback((event) => {
        if (mode === 'sse')
            return; // SSE modunda WS event'lerini cift saymayalim
        if (event.type === 'tool_call_started') {
            setLiveToolCalls((prev) => {
                if (prev.find((t) => t.id === event.id))
                    return prev;
                return [
                    ...prev,
                    {
                        id: event.id,
                        name: event.name,
                        arguments: event.arguments,
                        ok: false,
                        output: '',
                        duration_ms: 0
                    }
                ];
            });
        }
        else {
            setLiveToolCalls((prev) => prev.map((t) => t.id === event.id
                ? {
                    ...t,
                    ok: !!event.ok,
                    output: event.output || '',
                    error: event.error || null,
                    data: event.data || {},
                    duration_ms: event.duration_ms || 0
                }
                : t));
        }
    }, [mode]);
    const cancel = useCallback(() => {
        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
        }
    }, []);
    return {
        conversationId,
        messages,
        loading,
        sending,
        error,
        liveToolCalls,
        plan,
        lastReflection,
        send,
        cancel,
        loadConversation,
        newConversation,
        onToolEvent
    };
}
