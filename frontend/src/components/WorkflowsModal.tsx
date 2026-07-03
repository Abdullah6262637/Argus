// WorkflowsModal: YAML workflow CRUD + run (kurumsal sade tasarım)

import { useEffect, useState, useRef } from 'react';
import { api } from '@/api/client';
import { Icon } from './Icon';

interface WorkflowsModalProps {
  open: boolean;
  onClose: () => void;
}

interface RunResult {
  name: string;
  success: boolean;
  final_output?: string;
  error?: string | null;
  steps?: Array<{
    id: string;
    agent_id: string;
    success: boolean;
    result: string;
    error?: string | null;
  }>;
}

type Mode = 'run' | 'edit';

const NEW_TEMPLATE = `# Yeni workflow şablonu
name: ornek_akis
description: Adım adım araştır ve yaz
inputs:
  - topic
steps:
  - id: search
    agent: researcher
    prompt: "{{ inputs.topic }} hakkında 5 kaynak topla"
  - id: outline
    agent: writer
    prompt: "Bu kaynaklara dayanarak outline çıkar:\\n{{ steps.search.result }}"
  - id: draft
    agent: writer
    prompt: "Outline'a göre 1000 kelimelik makale yaz:\\n{{ steps.outline.result }}"
`;

export function WorkflowsModal({ open, onClose }: WorkflowsModalProps) {
  const [mode, setMode] = useState<Mode>('run');
  const [workflows, setWorkflows] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [inputsJson, setInputsJson] = useState<string>('{\n  \n}');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);

  // Editor state
  const [editName, setEditName] = useState('');
  const [editContent, setEditContent] = useState(NEW_TEMPLATE);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savedEdit, setSavedEdit] = useState(false);
  const [isNew, setIsNew] = useState(true);

  // Height Observer
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(600);

  useEffect(() => {
    if (!contentRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Measure unconstrained content height, add header (48px) + padding (40px)
        const computedHeight = entry.contentRect.height + 88;
        const bounded = Math.max(500, Math.min(computedHeight, window.innerHeight * 0.88));
        setContentHeight(bounded);
      }
    });

    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [selected, mode, running, result, error]);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = (await api.listWorkflows()) as string[];
      setWorkflows(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    reload();
    setMode('run');
    setResult(null);
    setError(null);
    setSearch('');
  }, [open]);

  const handleRun = async () => {
    if (!selected) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      let inputs: Record<string, unknown> = {};
      try {
        inputs = JSON.parse(inputsJson || '{}');
      } catch (err) {
        setError(
          `Inputs JSON parse hatası: ${err instanceof Error ? err.message : String(err)}`,
        );
        setRunning(false);
        return;
      }
      const r = (await api.runWorkflow(selected, inputs)) as RunResult;
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  };

  const startNew = () => {
    setMode('edit');
    setIsNew(true);
    setEditName('');
    setEditContent(NEW_TEMPLATE);
    setSavedEdit(false);
    setError(null);
  };

  const startEdit = async (name: string) => {
    setMode('edit');
    setIsNew(false);
    setEditName(name);
    setSavedEdit(false);
    setError(null);
    try {
      const data = await api.getWorkflowRaw(name);
      setEditContent(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const saveEdit = async () => {
    setSavingEdit(true);
    setSavedEdit(false);
    setError(null);
    try {
      const cleanName = editName.trim();
      if (!cleanName) {
        setError('Workflow adı zorunlu.');
        setSavingEdit(false);
        return;
      }
      await api.saveWorkflow(cleanName, editContent, true);
      setSavedEdit(true);
      setIsNew(false);
      await reload();
      setSelected(cleanName);
      setTimeout(() => setSavedEdit(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteWorkflow = async (name: string) => {
    if (!confirm(`"${name}" workflow'unu silmek istediğinden emin misin?`)) return;
    try {
      await api.deleteWorkflow(name);
      await reload();
      if (selected === name) setSelected(null);
      if (editName === name) {
        setMode('run');
        setEditName('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const filteredWorkflows = search.trim()
    ? workflows.filter((w) => w.toLowerCase().includes(search.toLowerCase()))
    : workflows;

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-backdrop-in">
      <div 
        style={{ height: `${contentHeight}px` }}
        className="bg-brand-bg border border-brand-border rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex overflow-hidden animate-modal-in transition-[height] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
      >
        {/* ============ Sol Sidebar: Workflow Listesi ============ */}
        <aside className="w-64 flex-shrink-0 border-r border-brand-border bg-brand-panel flex flex-col">
          {/* Sidebar Header */}
          <div className="px-3.5 py-3 border-b border-brand-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent">
                <Icon name="bolt" size={15} weight={550} filled />
              </div>
              <div>
                <h3 className="text-[12px] font-semibold text-brand-text leading-tight">
                  Workflow'lar
                </h3>
                <p className="text-[10px] text-brand-mutedSoft leading-tight font-mono tabular-nums">
                  {filteredWorkflows.length}
                  {search && workflows.length !== filteredWorkflows.length && (
                    <span>/{workflows.length}</span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={startNew}
              title="Yeni workflow"
              className="w-7 h-7 rounded-md inline-flex items-center justify-center text-brand-textSoft hover:text-brand-accent hover:bg-brand-accent/10 transition-all active:scale-90"
            >
              <Icon name="add" size={17} weight={650} />
            </button>
          </div>

          {/* Arama */}
          {workflows.length > 0 && (
            <div className="px-3 py-2 border-b border-brand-border">
              <div className="relative">
                <Icon
                  name="search"
                  size={13}
                  weight={500}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-brand-mutedSoft pointer-events-none"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ara..."
                  className="w-full h-7 bg-brand-bg border border-brand-border rounded-md pl-7 pr-2 text-[11px] text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/20 transition-all"
                />
              </div>
            </div>
          )}

          {/* Workflow Listesi */}
          <div className="flex-1 overflow-y-auto p-1.5">
            {loading && (
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-brand-muted py-6">
                <Icon
                  name="progress_activity"
                  size={12}
                  className="animate-spin-slow"
                />
                <span>Yükleniyor</span>
              </div>
            )}

            {!loading && workflows.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center py-10 px-3 gap-2">
                <Icon
                  name="bolt"
                  size={28}
                  weight={300}
                  className="text-brand-mutedSoft"
                />
                <span className="text-[11px] text-brand-muted">
                  Henüz workflow yok
                </span>
                <button
                  onClick={startNew}
                  className="text-[10px] text-brand-accent hover:underline inline-flex items-center gap-1"
                >
                  <Icon name="add" size={11} weight={600} />
                  İlk workflow'u oluştur
                </button>
              </div>
            )}

            {!loading &&
              workflows.length > 0 &&
              filteredWorkflows.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-8 px-3 gap-1.5">
                  <Icon
                    name="search_off"
                    size={20}
                    weight={300}
                    className="text-brand-mutedSoft"
                  />
                  <span className="text-[10.5px] text-brand-mutedSoft">
                    Eşleşme yok
                  </span>
                </div>
              )}

            <div className="space-y-0.5">
              {filteredWorkflows.map((w) => {
                const active = mode === 'run' ? selected === w : editName === w;
                return (
                  <button
                    key={w}
                    onClick={() => {
                      if (mode === 'run') {
                        setSelected(w);
                        setResult(null);
                      } else {
                        startEdit(w);
                      }
                    }}
                    className={`group w-full text-left px-2.5 py-2 rounded-md transition-all flex items-center gap-2 relative overflow-hidden ${
                      active
                        ? 'bg-brand-accent/10 ring-1 ring-brand-accent/40'
                        : 'hover:bg-brand-panelAlt'
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-brand-accent" />
                    )}
                    <Icon
                      name="schema"
                      size={13}
                      weight={500}
                      className={
                        active ? 'text-brand-accent' : 'text-brand-mutedSoft'
                      }
                    />
                    <span
                      className={`flex-1 text-[11.5px] font-medium truncate ${
                        active ? 'text-brand-text' : 'text-brand-textSoft'
                      }`}
                    >
                      {w}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteWorkflow(w);
                      }}
                      className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded inline-flex items-center justify-center text-brand-mutedSoft hover:text-brand-danger hover:bg-brand-danger/10 transition-all flex-shrink-0"
                      title="Sil"
                    >
                      <Icon name="delete" size={12} weight={500} />
                    </button>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ============ Sağ Ana İçerik ============ */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Üst Header */}
          <div className="h-12 px-4 border-b border-brand-border flex items-center justify-between bg-brand-panel">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-semibold text-brand-text">
                {mode === 'run' ? 'Workflow Çalıştır' : isNew ? 'Yeni Workflow' : `${editName}`}
              </h2>
              {/* Mod toggle */}
              <div className="flex items-center bg-brand-bg/50 border border-brand-border rounded-md p-0.5">
                <ModeButton
                  active={mode === 'run'}
                  onClick={() => setMode('run')}
                  icon="play_arrow"
                  label="Çalıştır"
                />
                <ModeButton
                  active={mode === 'edit'}
                  onClick={() => setMode('edit')}
                  icon="edit"
                  label="Düzenle"
                />
              </div>
            </div>
            <button
              onClick={onClose}
              title="Kapat"
              className="w-8 h-8 rounded-md flex items-center justify-center text-brand-muted hover:text-brand-text hover:bg-brand-panelAlt transition-all active:scale-95"
            >
              <Icon name="close" size={18} weight={550} />
            </button>
          </div>

          {/* İçerik */}
          <div className="flex-1 overflow-y-auto p-5">
            <div key={`${selected}_${mode}_${running}_${result ? 'res' : 'no'}`} ref={contentRef} className="animate-step-in">
              {/* RUN MODE */}
              {mode === 'run' && (
                <>
                  {!selected ? (
                    <div className="flex flex-col items-center justify-center text-center py-16 gap-2">
                      <Icon
                        name="touch_app"
                        size={36}
                        weight={300}
                        className="text-brand-mutedSoft"
                      />
                      <h3 className="text-sm font-semibold text-brand-text">
                        Workflow seç
                      </h3>
                      <p className="text-[11px] text-brand-mutedSoft max-w-xs">
                        Sol panelden bir workflow seçerek çalıştırabilir veya
                        düzenleyebilirsin.
                      </p>
                    </div>
                  ) : (
                    <RunPanel
                      workflowName={selected}
                      inputsJson={inputsJson}
                      onInputsChange={setInputsJson}
                      running={running}
                      result={result}
                      error={error}
                      onRun={handleRun}
                      onEdit={() => startEdit(selected)}
                    />
                  )}
                </>
              )}

              {/* EDIT MODE */}
              {mode === 'edit' && (
                <EditPanel
                  isNew={isNew}
                  editName={editName}
                  onEditNameChange={setEditName}
                  editContent={editContent}
                  onEditContentChange={setEditContent}
                  error={error}
                  saved={savedEdit}
                  saving={savingEdit}
                  onSave={saveEdit}
                  onDelete={() => deleteWorkflow(editName)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Yardımcı bileşenler
// ============================================================

function ModeButton({
  active,
  onClick,
  icon,
  label}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-7 px-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold rounded transition-all ${
        active
          ? 'bg-brand-accent/15 text-brand-accent'
          : 'text-brand-mutedSoft hover:text-brand-text hover:bg-brand-panelAlt'
      }`}
    >
      <Icon name={icon} size={13} weight={550} filled={active} />
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}

// ============================================================
// Run Paneli
// ============================================================

function RunPanel({
  workflowName,
  inputsJson,
  onInputsChange,
  running,
  result,
  error,
  onRun,
  onEdit}: {
  workflowName: string;
  inputsJson: string;
  onInputsChange: (v: string) => void;
  running: boolean;
  result: RunResult | null;
  error: string | null;
  onRun: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="space-y-4 max-w-3xl">
      {/* Workflow başlık kartı */}
      <div className="rounded-lg border border-brand-border bg-brand-panel/40 p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent flex-shrink-0">
          <Icon name="schema" size={18} weight={550} filled />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-brand-mutedSoft font-bold">
            Workflow
          </div>
          <div className="text-sm font-semibold text-brand-text font-mono truncate">
            {workflowName}
          </div>
        </div>
        <button
          onClick={onEdit}
          className="h-8 px-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-md border border-brand-border text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all active:scale-95"
        >
          <Icon name="edit" size={13} weight={550} />
          Düzenle
        </button>
      </div>

      {/* Inputs alanı */}
      <FormField
        label="Inputs"
        icon="data_object"
        hint="JSON formatında parametreler. Workflow içindeki {{ inputs.x }} değişkenlerine bağlanır."
      >
        <textarea
          value={inputsJson}
          onChange={(e) => onInputsChange(e.target.value)}
          rows={6}
          spellCheck={false}
          className="w-full bg-brand-panel border border-brand-border rounded-md px-3 py-2 text-xs font-mono text-brand-text leading-relaxed focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/15 transition-all"
          placeholder='{\n  "topic": "..."\n}'
        />
      </FormField>

      {/* Çalıştır butonu */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRun}
          disabled={running}
          className="h-9 px-4 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg bg-brand-accent text-brand-bg hover:bg-brand-accentDim disabled:opacity-40 transition-all active:scale-95 shadow-sm"
        >
          <Icon
            name={running ? 'progress_activity' : 'play_arrow'}
            size={15}
            weight={650}
            filled
            className={running ? 'animate-spin-slow' : ''}
          />
          {running ? 'Çalışıyor...' : 'Çalıştır'}
        </button>
        {error && (
          <span className="inline-flex items-center gap-1 text-[11px] text-brand-danger">
            <Icon name="error" size={13} weight={500} filled />
            {error}
          </span>
        )}
      </div>

      {/* Sonuç */}
      {result && (
        <div className="space-y-3 animate-fade-in-up">
          <div className="rounded-lg border border-brand-border bg-brand-panel/40 overflow-hidden">
            {/* Result header */}
            <div
              className={`px-3.5 py-2.5 flex items-center gap-2.5 border-b border-brand-border ${
                result.success
                  ? 'bg-brand-success/5'
                  : 'bg-brand-danger/5'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center ${
                  result.success
                    ? 'bg-brand-success/15 text-brand-success'
                    : 'bg-brand-danger/15 text-brand-danger'
                }`}
              >
                <Icon
                  name={result.success ? 'task_alt' : 'cancel'}
                  size={15}
                  weight={550}
                  filled
                />
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={`text-[10px] uppercase tracking-wider font-bold ${
                    result.success ? 'text-brand-success' : 'text-brand-danger'
                  }`}
                >
                  {result.success ? 'Başarılı' : 'Başarısız'}
                </div>
                <div className="text-[12px] font-mono text-brand-text truncate">
                  {result.name}
                </div>
              </div>
              {result.steps && (
                <span className="text-[11px] font-mono text-brand-mutedSoft tabular-nums">
                  {result.steps.filter((s) => s.success).length}/
                  {result.steps.length} adım
                </span>
              )}
            </div>

            {/* Hata */}
            {!result.success && result.error && (
              <div className="px-3.5 py-2 text-[11px] text-brand-danger flex items-start gap-1.5">
                <Icon
                  name="error"
                  size={12}
                  weight={500}
                  filled
                  className="flex-shrink-0 mt-px"
                />
                <span className="leading-relaxed">{result.error}</span>
              </div>
            )}

            {/* Final output */}
            {result.final_output && (
              <div>
                <div className="px-3.5 pt-3 pb-1 text-[10px] uppercase tracking-wider text-brand-mutedSoft font-bold inline-flex items-center gap-1">
                  <Icon name="output" size={10} weight={500} />
                  Final Çıktı
                </div>
                <pre className="mx-3.5 mb-3 px-3 py-2 rounded-md bg-brand-bg/60 border border-brand-border font-mono text-[11px] text-brand-textSoft max-h-64 overflow-y-auto whitespace-pre-wrap break-words">
                  {result.final_output}
                </pre>
              </div>
            )}

            {/* Adımlar */}
            {result.steps && result.steps.length > 0 && (
              <div>
                <div className="px-3.5 pt-2 pb-1 text-[10px] uppercase tracking-wider text-brand-mutedSoft font-bold inline-flex items-center gap-1">
                  <Icon name="format_list_numbered" size={10} weight={500} />
                  Adımlar
                </div>
                <div className="divide-y divide-brand-border">
                  {result.steps.map((s, i) => (
                    <StepRow key={s.id} step={s} index={i + 1} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StepRow({
  step,
  index}: {
  step: {
    id: string;
    agent_id: string;
    success: boolean;
    result: string;
    error?: string | null;
  };
  index: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-brand-panelAlt/50 transition-colors"
      >
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
            step.success
              ? 'bg-brand-success/15 text-brand-success'
              : 'bg-brand-danger/15 text-brand-danger'
          }`}
        >
          <Icon
            name={step.success ? 'check' : 'close'}
            size={12}
            weight={650}
          />
        </div>
        <span className="text-[10px] font-mono font-semibold text-brand-mutedSoft tabular-nums w-5 text-right">
          {String(index).padStart(2, '0')}
        </span>
        <code className="flex-1 text-[11.5px] font-mono font-semibold text-brand-text truncate text-left">
          {step.id}
        </code>
        <span className="text-[10px] text-brand-mutedSoft inline-flex items-center gap-1">
          <Icon name="smart_toy" size={10} weight={500} />
          {step.agent_id}
        </span>
        <Icon
          name={open ? 'expand_less' : 'expand_more'}
          size={14}
          weight={500}
          className="text-brand-mutedSoft"
        />
      </button>
      {open && (
        <div className="px-12 pb-3 pt-1 space-y-2 animate-fade-in-up">
          {step.error && (
            <div className="text-[11px] text-brand-danger bg-brand-danger/5 rounded px-2 py-1.5 flex items-start gap-1.5">
              <Icon
                name="error"
                size={11}
                weight={500}
                filled
                className="flex-shrink-0 mt-px"
              />
              <span>{step.error}</span>
            </div>
          )}
          {step.result && (
            <pre className="text-[11px] font-mono text-brand-textSoft bg-brand-bg/60 border border-brand-border rounded px-2 py-1.5 max-h-32 overflow-y-auto whitespace-pre-wrap break-words">
              {step.result}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Edit Paneli
// ============================================================

function EditPanel({
  isNew,
  editName,
  onEditNameChange,
  editContent,
  onEditContentChange,
  error,
  saved,
  saving,
  onSave,
  onDelete}: {
  isNew: boolean;
  editName: string;
  onEditNameChange: (v: string) => void;
  editContent: string;
  onEditContentChange: (v: string) => void;
  error: string | null;
  saved: boolean;
  saving: boolean;
  onSave: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-4 max-w-3xl">
      {/* Ad alanı */}
      <FormField
        label="Workflow Adı"
        icon="label"
        hint={isNew ? 'a-z, 0-9, _, - karakterleri kullan' : 'Sadece yeni workflow oluştururken değiştirilebilir'}
      >
        <input
          type="text"
          value={editName}
          onChange={(e) => onEditNameChange(e.target.value)}
          placeholder="örn. arastir_ve_yaz"
          disabled={!isNew}
          className="w-full bg-brand-panel border border-brand-border rounded-md px-3 py-2 text-sm font-mono text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/15 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        />
      </FormField>

      {/* YAML editor */}
      <FormField
        label="YAML İçerik"
        icon="code"
        hint="{{ inputs.x }} ve {{ steps.id.result }} değişkenlerini kullanabilirsin"
      >
        <div className="rounded-md border border-brand-border bg-brand-panel overflow-hidden focus-within:border-brand-accent focus-within:ring-2 focus-within:ring-brand-accent/15 transition-all">
          {/* Editor toolbar */}
          <div className="px-3 py-1.5 border-b border-brand-border flex items-center justify-between bg-brand-panelAlt/40">
            <div className="flex items-center gap-1.5 text-[10px] text-brand-mutedSoft font-mono">
              <Icon name="data_object" size={11} weight={500} />
              <span>YAML</span>
              <span className="text-brand-border">·</span>
              <span className="tabular-nums">{editContent.split('\n').length} satır</span>
            </div>
          </div>
          <textarea
            value={editContent}
            onChange={(e) => onEditContentChange(e.target.value)}
            rows={20}
            spellCheck={false}
            className="w-full bg-transparent px-3 py-2 text-[11.5px] font-mono text-brand-text leading-relaxed focus:outline-none resize-none"
          />
        </div>
      </FormField>

      {/* Hata / Başarı mesajı */}
      {error && (
        <div className="p-2.5 text-[11px] rounded-lg border border-brand-danger/40 bg-brand-danger/5 text-brand-danger flex items-start gap-2">
          <Icon
            name="error"
            size={13}
            weight={500}
            filled
            className="flex-shrink-0 mt-px"
          />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}
      {saved && (
        <div className="p-2.5 text-[11px] rounded-lg border border-brand-success/40 bg-brand-success/5 text-brand-success flex items-center gap-2 animate-fade-in-up">
          <Icon name="check_circle" size={13} weight={550} filled />
          Kaydedildi
        </div>
      )}

      {/* Aksiyon butonları */}
      <div className="flex items-center gap-2 pt-2 border-t border-brand-border">
        <button
          onClick={onSave}
          disabled={saving || !editName.trim() || !editContent.trim()}
          className="h-9 px-4 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg bg-brand-accent text-brand-bg hover:bg-brand-accentDim disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
        >
          <Icon
            name={saving ? 'progress_activity' : 'save'}
            size={14}
            weight={650}
            filled
            className={saving ? 'animate-spin-slow' : ''}
          />
          {saving ? 'Kaydediliyor...' : isNew ? 'Oluştur' : 'Kaydet'}
        </button>
        {!isNew && editName && (
          <button
            onClick={onDelete}
            className="h-9 px-3 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg border border-brand-danger/30 text-brand-danger hover:bg-brand-danger/10 transition-all active:scale-95"
          >
            <Icon name="delete" size={14} weight={550} />
            Sil
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// FormField — tutarlı label + ikon + hint
// ============================================================

function FormField({
  label,
  icon,
  hint,
  children}: {
  label: string;
  icon: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-brand-mutedSoft font-bold">
          <Icon name={icon} size={11} weight={500} />
          {label}
        </label>
      </div>
      {children}
      {hint && (
        <p className="text-[10px] text-brand-mutedSoft leading-relaxed">
          {hint}
        </p>
      )}
    </div>
  );
}