import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { Icon } from './Icon';

interface Skill {
  id: number;
  name: string;
  description: string;
  tool_chain: string[];
  success_count: number;
  is_macro: boolean;
  is_active: boolean;
  created_at: string;
}

export function SkillsTab() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'macro' | 'active'>('all');

  const loadSkills = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listSkills();
      setSkills(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const handleToggle = async (skill: Skill) => {
    try {
      const updated = await api.updateSkill(skill.id, { is_active: !skill.is_active });
      setSkills((prev) => prev.map((s) => (s.id === skill.id ? updated : s)));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDelete = async (skill: Skill) => {
    if (!confirm(`"${skill.name}" silinsin mi?`)) return;
    try {
      await api.deleteSkill(skill.id);
      setSkills((prev) => prev.filter((s) => s.id !== skill.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const filtered = skills.filter((s) => {
    if (filter === 'macro') return s.is_macro;
    if (filter === 'active') return s.is_active;
    return true;
  });

  const macroCount = skills.filter((s) => s.is_macro).length;
  const activeCount = skills.filter((s) => s.is_active).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-xs text-brand-muted py-6">
        <Icon name="progress_activity" size={14} className="animate-spin-slow" />
        <span>Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="p-2.5 text-[11px] rounded-lg border border-brand-danger/40 bg-brand-danger/10 text-brand-danger flex items-start gap-2">
          <Icon name="error" size={14} weight={500} filled className="flex-shrink-0 mt-px" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {/* Filter */}
      {skills.length > 0 && (
        <div className="flex items-center bg-brand-bg/40 border border-brand-border rounded-lg p-0.5 gap-0.5">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 h-7 inline-flex items-center justify-center gap-1 text-[10.5px] font-semibold rounded-md transition-all ${
              filter === 'all'
                ? 'bg-brand-accent/15 text-brand-accent'
                : 'text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt'
            }`}
          >
            <span>Tümü</span>
            <span className="text-[9.5px] font-mono font-bold">{skills.length}</span>
          </button>
          <button
            onClick={() => setFilter('macro')}
            className={`flex-1 h-7 inline-flex items-center justify-center gap-1 text-[10.5px] font-semibold rounded-md transition-all ${
              filter === 'macro'
                ? 'bg-brand-accent/15 text-brand-accent'
                : 'text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt'
            }`}
          >
            <Icon name="star" size={11} weight={500} filled={filter === 'macro'} />
            <span>Macro</span>
            <span className="text-[9.5px] font-mono font-bold">{macroCount}</span>
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`flex-1 h-7 inline-flex items-center justify-center gap-1 text-[10.5px] font-semibold rounded-md transition-all ${
              filter === 'active'
                ? 'bg-brand-accent/15 text-brand-accent'
                : 'text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-success" />
            <span>Aktif</span>
            <span className="text-[9.5px] font-mono font-bold">{activeCount}</span>
          </button>
        </div>
      )}

      {/* Empty state */}
      {skills.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center text-center py-10 gap-2">
          <Icon name="school" size={32} weight={300} className="text-brand-mutedSoft" />
          <div className="text-xs text-brand-muted">Henüz skill yok</div>
          <div className="text-[10px] text-brand-mutedSoft max-w-[200px]">
            Başarılı plan'lar otomatik olarak skill olarak kaydedilir.
          </div>
        </div>
      )}

      {/* Skills list */}
      {filtered.map((skill) => (
        <SkillCard
          key={skill.id}
          skill={skill}
          onToggle={() => handleToggle(skill)}
          onDelete={() => handleDelete(skill)}
        />
      ))}

      {filtered.length === 0 && skills.length > 0 && (
        <div className="text-center text-[11px] text-brand-mutedSoft py-6">
          Bu filtre için skill yok
        </div>
      )}
    </div>
  );
}

function SkillCard({
  skill,
  onToggle,
  onDelete,
}: {
  skill: Skill;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-lg border bg-brand-panelAlt p-2.5 space-y-2 transition-all hover:border-brand-borderStrong ${
        skill.is_active ? 'border-brand-border' : 'border-brand-border opacity-60'
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-2">
        <div
          className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
            skill.is_macro
              ? 'bg-brand-accent/15 text-brand-accent'
              : 'bg-brand-panelAlt text-brand-mutedSoft'
          }`}
        >
          <Icon
            name={skill.is_macro ? 'star' : 'school'}
            size={15}
            weight={600}
            filled={skill.is_macro}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-mono text-brand-text truncate leading-tight">
            {skill.name}
          </div>
          {skill.description && (
            <div className="text-[10px] text-brand-mutedSoft mt-0.5 line-clamp-2 leading-snug">
              {skill.description}
            </div>
          )}
          <div className="flex items-center gap-1.5 mt-1 text-[9.5px] text-brand-mutedSoft">
            <Icon name="repeat" size={10} weight={500} />
            <span className="font-mono font-bold">{skill.success_count}x</span>
            <span className="text-brand-border">·</span>
            <Icon name="build" size={10} weight={500} />
            <span className="font-mono">{skill.tool_chain.length} tool</span>
            {skill.is_macro && (
              <>
                <span className="text-brand-border">·</span>
                <span className="text-brand-accent font-semibold">MACRO</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tool chain (expandable) */}
      {skill.tool_chain.length > 0 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full text-left text-[10px] text-brand-mutedSoft hover:text-brand-text transition-colors flex items-center gap-1"
        >
          <Icon
            name={expanded ? 'expand_less' : 'expand_more'}
            size={12}
            weight={500}
          />
          <span>{expanded ? 'Gizle' : 'Tool zincirini göster'}</span>
        </button>
      )}

      {expanded && (
        <div className="space-y-1 animate-fade-in-up">
          {skill.tool_chain.map((toolName, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-brand-bg/60 border border-brand-border"
            >
              <span className="text-[9px] font-mono font-bold text-brand-mutedSoft w-4">{i + 1}</span>
              <Icon name="build" size={10} weight={500} className="text-brand-accent" />
              <span className="text-[10px] font-mono text-brand-text truncate">{toolName}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-1 pt-0.5">
        <button
          onClick={onToggle}
          title={skill.is_active ? 'Devre dışı bırak' : 'Etkinleştir'}
          className="flex-1 h-7 inline-flex items-center justify-center gap-1 text-[10.5px] font-semibold rounded-md border border-brand-border text-brand-textSoft hover:text-brand-text hover:bg-brand-panel transition-all active:scale-95"
        >
          <Icon
            name={skill.is_active ? 'toggle_on' : 'toggle_off'}
            size={14}
            weight={550}
            filled
          />
          {skill.is_active ? 'Aktif' : 'Pasif'}
        </button>
        <button
          onClick={onDelete}
          title="Sil"
          className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-brand-danger/30 text-brand-danger hover:bg-brand-danger/10 transition-all active:scale-95"
        >
          <Icon name="delete" size={13} weight={550} />
        </button>
      </div>
    </div>
  );
}