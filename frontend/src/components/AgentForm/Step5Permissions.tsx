import { useEffect, useState } from 'react';
import { Icon } from '../Icon';
import { StepHeading } from './FormComponents';
import type { AgentPermissions } from '@/types';
import {
  ReadonlyIcon,
  ResearcherIcon,
  WriterIcon,
  DeveloperIcon,
  FullIcon,
  CustomIcon,
} from '../icons/PermissionIcons';

const PRESET_ICONS: Record<string, React.ComponentType<any>> = {
  readonly: ReadonlyIcon,
  researcher: ResearcherIcon,
  writer: WriterIcon,
  developer: DeveloperIcon,
  full: FullIcon,
  custom: CustomIcon,
};

export interface ToolHint {
  name: string;
  desc: string;
}

export interface PermissionCategory {
  key: keyof AgentPermissions;
  title: string;
  icon: string;
  desc: string;
  tools: ToolHint[];
}

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    key: 'file_system',
    title: 'Dosya Sistemi',
    icon: 'folder',
    desc: 'Yerel dosyalari okuma, yazma, kopyalama, silme ve arama yetkileri.',
    tools: [
      { name: 'read_file', desc: 'Dosya icerigini okur' },
      { name: 'write_file', desc: 'Dosyaya yazar (ustune yazar)' },
      { name: 'append_file', desc: 'Dosya sonuna ekler' },
      { name: 'list_dir', desc: 'Klasor icerigini listeler' },
      { name: 'search_files', desc: 'Dosyalarda metin arar' },
      { name: 'copy_file / move_file / delete_file', desc: 'Kopyala / tasi / sil' },
      { name: 'mkdir', desc: 'Klasor olusturur' },
      { name: 'zip / unzip', desc: 'Arsiv islemleri' },
      { name: 'read_document', desc: 'PDF / DOCX / XLSX okuma' },
      { name: 'pdf_generate / xlsx_write', desc: 'PDF / XLSX uretir' }
    ]
  },
  {
    key: 'terminal_cmd',
    title: 'Terminal ve Komut Calistirma',
    icon: 'terminal',
    desc: 'CMD/PowerShell/Bash komutlari, git, paket yoneticileri, kod degerlendirme.',
    tools: [
      { name: 'run_command', desc: 'Whitelist\'teki komutlari calistirir' },
      { name: 'open_app', desc: 'Uygulama acar' },
      { name: 'python_eval', desc: 'Sandbox\'ta Python kodu calistirir' },
      { name: 'evaluate_math', desc: 'Matematik ifadesini hesaplar' },
      { name: 'regex_match', desc: 'Regex eslesmeleri' },
      { name: 'list_processes / kill_process', desc: 'Surec yonetimi' },
      { name: 'git_*', desc: 'Git: clone, status, commit, push, pull, branch...' },
      { name: 'db_query / db_execute / db_schema', desc: 'SQLite/Postgres erisimi' }
    ]
  },
  {
    key: 'web_search',
    title: 'Web Erisimi',
    icon: 'public',
    desc: 'Internet aramalari, sayfa okuma, browser otomasyonu, e-posta, mesajlasma.',
    tools: [
      { name: 'web_search', desc: 'Web aramasi' },
      { name: 'open_url', desc: 'URL acar' },
      { name: 'http_request', desc: 'GET/POST/PUT/DELETE istegi' },
      { name: 'download_file', desc: 'Dosya indirir' },
      { name: 'browser_navigate / browser_click / browser_fill', desc: 'Playwright otomasyonu' },
      { name: 'read_webpage', desc: 'Sayfayi okuyup metne donustur' },
      { name: 'email_send / email_read_inbox', desc: 'SMTP / IMAP' },
      { name: 'slack_send / discord_send / telegram_send', desc: 'Mesajlasma' },
      { name: 'image_generate', desc: 'OpenAI image API' }
    ]
  },
  {
    key: 'system_admin',
    title: 'Sistem Yonetimi',
    icon: 'admin_panel_settings',
    desc: 'Ekran yakalama, fare/klavye otomasyonu, pencere ve guc yonetimi. Dikkatli kullanin.',
    tools: [
      { name: 'screenshot', desc: 'Ekran goruntusu alir' },
      { name: 'click / mouse_move', desc: 'Fare olaylari' },
      { name: 'type_text / key_press', desc: 'Klavye olaylari' },
      { name: 'list_windows / focus_window', desc: 'Pencere listesi/odak' },
      { name: 'minimize / maximize / close_window', desc: 'Pencere kontrolu' },
      { name: 'clipboard_get / clipboard_set', desc: 'Pano' },
      { name: 'show_notification / play_beep / text_to_speech', desc: 'Bildirim & ses' },
      { name: 'set_volume / lock_screen', desc: 'Sistem kontrolu' },
      { name: 'shutdown / cancel_shutdown', desc: 'Kapatma planlama' }
    ]
  }
];

export interface PermissionPreset {
  id: string;
  label: string;
  icon: string;
  desc: string;
  values: AgentPermissions;
}

export const PERMISSION_PRESETS: PermissionPreset[] = [
  {
    id: 'readonly',
    label: 'Salt-okunur',
    icon: 'lock',
    desc: 'Sadece sohbet — hicbir sistem aracina erisim yok',
    values: { file_system: false, terminal_cmd: false, web_search: false, system_admin: false }
  },
  {
    id: 'researcher',
    label: 'Arastirmaci',
    icon: 'travel_explore',
    desc: 'Web arama + sayfa okuma; dosya/terminal yok',
    values: { file_system: false, terminal_cmd: false, web_search: true, system_admin: false }
  },
  {
    id: 'writer',
    label: 'Yazar',
    icon: 'edit_note',
    desc: 'Dosya yazma + web arama; terminal yok',
    values: { file_system: true, terminal_cmd: false, web_search: true, system_admin: false }
  },
  {
    id: 'developer',
    label: 'Gelistirici',
    icon: 'code',
    desc: 'Dosya + terminal + git + web; sistem yonetimi yok',
    values: { file_system: true, terminal_cmd: true, web_search: true, system_admin: false }
  },
  {
    id: 'full',
    label: 'Tam yetkili',
    icon: 'verified_user',
    desc: 'Hersey acik — ekran/klavye/fare dahil',
    values: { file_system: true, terminal_cmd: true, web_search: true, system_admin: true }
  }
];

function permsEqual(a: AgentPermissions, b: AgentPermissions): boolean {
  return a.file_system === b.file_system && a.terminal_cmd === b.terminal_cmd
    && a.web_search === b.web_search && a.system_admin === b.system_admin;
}

export function Step5Permissions({
  permissions,
  setPermissions
}: {
  permissions: AgentPermissions;
  setPermissions: (v: AgentPermissions) => void;
}) {
  const matchedPreset = PERMISSION_PRESETS.find((p) => permsEqual(p.values, permissions));
  const [selectedPresetId, setSelectedPresetId] = useState<string>(matchedPreset?.id ?? 'custom');

  useEffect(() => {
    const m = PERMISSION_PRESETS.find((p) => permsEqual(p.values, permissions));
    setSelectedPresetId(m?.id ?? 'custom');
  }, [permissions]);

  const update = (patch: Partial<AgentPermissions>) =>
    setPermissions({ ...permissions, ...patch });

  const applyPreset = (id: string) => {
    setSelectedPresetId(id);
    if (id === 'custom') return;
    const p = PERMISSION_PRESETS.find((x) => x.id === id);
    if (p) setPermissions(p.values);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-step-in">
      <StepHeading
        title="Güvenlik ve İzinler"
        desc="Hazır bir izin profili seç ya da Özel ile detaylı ayar yap."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {PERMISSION_PRESETS.map((p) => {
          const isActive = selectedPresetId === p.id;
          const PresetIcon = PRESET_ICONS[p.id] || CustomIcon;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              className={`text-left rounded-2xl p-4 transition-all duration-200 active:scale-[0.98] flex items-start gap-3.5 ${
                isActive
                  ? 'bg-brand-accent/[0.08] text-brand-text shadow-sm'
                  : 'bg-brand-panelAlt/30 hover:bg-brand-panelAlt/60 text-brand-text'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                isActive ? 'bg-brand-accent/20 text-brand-accent' : 'bg-brand-panelAlt text-brand-mutedSoft'
              }`}>
                <PresetIcon size={18} filled={isActive} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-brand-text leading-tight">{p.label}</div>
                <div className="text-[11px] text-brand-textSoft mt-1.5 leading-normal">{p.desc}</div>
              </div>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => applyPreset('custom')}
          className={`text-left rounded-2xl p-4 transition-all duration-200 active:scale-[0.98] flex items-start gap-3.5 ${
            selectedPresetId === 'custom'
              ? 'bg-brand-accent/[0.08] text-brand-text shadow-sm'
              : 'bg-brand-panelAlt/30 hover:bg-brand-panelAlt/60 text-brand-text'
          }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
            selectedPresetId === 'custom' ? 'bg-brand-accent/20 text-brand-accent' : 'bg-brand-panelAlt text-brand-mutedSoft'
          }`}>
            <CustomIcon size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-brand-text leading-tight">Özel Yapılandırma</div>
            <div className="text-[11px] text-brand-textSoft mt-1.5 leading-normal">İzinleri tek tek elle belirleyin</div>
          </div>
        </button>
      </div>

      {selectedPresetId === 'custom' && (
        <div className="space-y-3.5 pt-2">
          {PERMISSION_CATEGORIES.map((cat) => (
            <PermissionBlock
              key={cat.key}
              title={cat.title}
              desc={cat.desc}
              icon={cat.icon}
              tools={cat.tools}
              enabled={permissions[cat.key]}
              onChange={(v) => update({ [cat.key]: v } as Partial<AgentPermissions>)}
            />
          ))}
        </div>
      )}

      {selectedPresetId !== 'custom' && (
        <div className="rounded-2xl bg-brand-panelAlt/15 p-4.5 space-y-3.5">
          <div className="text-[10px] uppercase tracking-wider font-bold text-brand-mutedSoft">
            Bu profil şu izinleri verir:
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            {PERMISSION_CATEGORIES.map((cat) => {
              const on = permissions[cat.key];
              return (
                <div key={cat.key} className="flex items-center gap-2.5 py-1 text-xs">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    on ? 'bg-brand-success/12 text-brand-success' : 'bg-brand-panelAlt text-brand-mutedSoft'
                  }`}>
                    <Icon name={on ? 'check' : 'close'} size={11} weight={600} />
                  </div>
                  <span className={`font-semibold truncate ${on ? 'text-brand-text' : 'text-brand-mutedSoft'}`}>
                    {cat.title}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="text-[11.5px] text-brand-mutedSoft pt-2 mt-1.5 opacity-80">
            İnce ayar yapmak istersen <strong>Özel Yapılandırma</strong>'yı seç.
          </div>
        </div>
      )}
    </div>
  );
}

function PermissionBlock({
  title,
  desc,
  icon,
  tools,
  enabled,
  onChange
}: {
  title: string;
  desc: string;
  icon: string;
  tools: ToolHint[];
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visibleTools = showAll ? tools : tools.slice(0, 6);

  return (
    <div
      className={`rounded-xl p-3.5 transition-all duration-300 ${
        enabled
          ? 'bg-brand-panelAlt shadow-md shadow-brand-accent/5'
          : 'bg-brand-panelAlt/40'
      }`}
    >
      <label className="flex items-start justify-between gap-2 cursor-pointer text-brand-text">
        <div className="flex gap-3 min-w-0">
          <div className="text-brand-accent mt-0.5">
            <Icon name={icon} size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold">{title}</div>
            <div className="text-[11px] text-brand-muted mt-0.5">{desc}</div>
          </div>
        </div>
        <div className="relative flex items-center mt-1 flex-shrink-0">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only"
            id={`toggle-perm-${title}`}
          />
          <div
            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 ${
              enabled ? 'bg-brand-accent' : 'bg-brand-borderStrong'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-brand-bg shadow-md transform transition-transform duration-300 ${
                enabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </div>
        </div>
      </label>

      {/* Tool listesi (chip + tooltip) */}
      <div className={`mt-2 pt-2 transition ${enabled ? 'opacity-100' : 'opacity-50'}`}>
        <div className="text-[10px] uppercase tracking-wider text-brand-mutedSoft mb-1.5">
          Bu kategori asagidaki tool'lara erisim verir:
        </div>
        <div className="flex flex-wrap gap-1">
          {visibleTools.map((t) => (
            <span
              key={t.name}
              title={t.desc}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border border-brand-border bg-brand-panel text-brand-textSoft cursor-help"
            >
              <Icon name="bolt" size={10} className="text-brand-accent" />
              {t.name}
            </span>
          ))}
          {tools.length > 6 && (
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="text-[10px] text-brand-accent hover:underline px-1"
            >
              {showAll ? 'Az goster' : `+${tools.length - 6} daha`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
