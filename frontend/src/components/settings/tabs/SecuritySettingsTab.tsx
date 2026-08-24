import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { Icon } from '../../Icon';
import { PanelHeader } from '../shared/PanelHeader';
import { FormField } from '../shared/FormField';

export function SecuritySettingsTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [allowlist, setAllowlist] = useState('');
  const [cwdJail, setCwdJail] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getEnv();
        const safeValues = (data && typeof data.values === 'object' && data.values) || {};
        
        setAllowlist(safeValues.RUN_COMMAND_ALLOWLIST || 'git,npm,python,pip,node,echo,dir,ls,cat,type,where,pwd,hostname');
        setCwdJail(safeValues.RUN_COMMAND_CWD_JAIL || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.updateEnv({
        RUN_COMMAND_ALLOWLIST: allowlist.trim(),
        RUN_COMMAND_CWD_JAIL: cwdJail.trim()
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center text-xs text-brand-muted py-10">Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Güvenlik & Sandbox Kontrolleri"
        description="Ajanların bilgisayarınızda çalıştırabileceği komut limitlerini belirleyin."
        icon="security"
      />
      <div className="space-y-5 py-2">
        <FormField label="Terminal Komut İzin Listesi (Allowlist)" icon="terminal">
          <textarea
            value={allowlist}
            onChange={(e) => setAllowlist(e.target.value)}
            rows={3}
            className="w-full bg-brand-bg/40 border border-brand-border/40 rounded-lg px-3 py-2 text-xs font-mono text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-borderStrong transition-all resize-none"
            placeholder="git,npm,python,pip..."
          />
          <p className="text-[10px] text-brand-mutedSoft mt-1 leading-normal">
            Virgülle ayrılmış değerler. Ajanın `run_command` aracıyla çalıştırmasına izin verilen programların ana isimleridir.
          </p>
        </FormField>

        <FormField label="Çalışma Dizini Hapsi (Workspace Jail)" icon="folder_lock">
          <input
            type="text"
            value={cwdJail}
            onChange={(e) => setCwdJail(e.target.value)}
            className="w-full bg-brand-bg/40 border border-brand-border/40 rounded-lg h-9 px-3 text-xs text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-borderStrong transition-all"
            placeholder="Örn: C:\Users\HP\Desktop\sandbox"
          />
          <p className="text-[10px] text-brand-mutedSoft mt-1 leading-normal">
            Boş bırakılırsa kısıtlama uygulanmaz. Bir klasör belirtildiğinde ajan terminal komutlarını sadece bu klasörün dışına çıkamadan çalıştırabilir.
          </p>
        </FormField>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={save}
          disabled={saving}
          className="h-9 px-4 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg bg-brand-accent text-brand-bg hover:bg-brand-accentDim disabled:opacity-40 transition-all active:scale-95 shadow-sm"
        >
          <Icon name={saving ? 'progress_activity' : 'save'} size={14} className={saving ? 'animate-spin-slow' : ''} />
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-[11px] text-brand-success font-semibold">
            <Icon name="check_circle" size={13} filled /> Kaydedildi
          </span>
        )}
        {error && (
          <span className="inline-flex items-center gap-1 text-[11px] text-brand-danger">
            <Icon name="error" size={13} filled /> {error}
          </span>
        )}
      </div>
    </div>
  );
}
