import { useCallback, useEffect, useState } from 'react';
import { api } from '@/api/client';
export function useAgents() {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const list = await api.listAgents(true);
            setAgents(list);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
        finally {
            setLoading(false);
        }
    }, []);
    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const list = await api.reloadAgents();
            setAgents(list);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        load();
    }, [load]);
    return { agents, loading, error, reload };
}
