import { useEffect, useRef, useState } from 'react';
import type { AgentInfo, ChatMessage, Plan, ToolCallInfo } from '@/types';
import type { ReflectionInfo } from '@/hooks/useChat';
import { MessageBubble } from './MessageBubble';
import { Icon } from './Icon';
import { TaskTimeline } from './TaskTimeline';
import { VoiceButton } from './VoiceButton';
import { FileDropZone } from './FileDropZone';
import { WorkflowsModal } from './WorkflowsModal';
import { KnowledgeGraphModal } from './KnowledgeGraphModal';
import { getModelLogo } from '../utils/modelHelper';

interface ChatWindowProps {
  agent: AgentInfo | null;
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  liveToolCalls?: ToolCallInfo[];
  plan?: Plan | null;
  lastReflection?: ReflectionInfo | null;
  onSend: (content: string) => void;
  onNewConversation: () => void;
  onCancel?: () => void;
  agentListOpen: boolean;
  onToggleAgentList: () => void;
  systemPanelOpen: boolean;
  onToggleSystemPanel: () => void;
}

/**
 * Tool ad → görsel meta (Material Symbol icon + Türkçe etiket).
 * Bilinmeyen tool'lar için fallback "build" ikonu kullanılır.
 */
const TOOL_META: Record<string, { icon: string; label: string }> = {
  // Browser & Web
  open_url:           { icon: 'public',            label: 'Tarayıcı açılıyor' },
  web_search:         { icon: 'travel_explore',    label: 'Web aranıyor' },
  http_request:       { icon: 'cloud_sync',        label: 'HTTP isteği' },
  download_file:      { icon: 'download',          label: 'Dosya indiriliyor' },
  ping_host:          { icon: 'network_ping',      label: 'Host ping' },
  browser_navigate:   { icon: 'open_in_browser',   label: 'Sayfaya gidiliyor' },
  browser_click:      { icon: 'ads_click',         label: 'Tıklanıyor' },
  browser_fill:       { icon: 'edit_note',         label: 'Form dolduruluyor' },
  browser_get_text:   { icon: 'text_fields',       label: 'Metin alınıyor' },
  browser_screenshot: { icon: 'photo_camera',      label: 'Ekran görüntüsü' },
  read_webpage:       { icon: 'article',           label: 'Sayfa okunuyor' },

  // System
  run_command:        { icon: 'terminal',          label: 'Komut çalıştırılıyor' },
  open_app:           { icon: 'apps',              label: 'Uygulama açılıyor' },
  system_info:        { icon: 'memory',            label: 'Sistem bilgisi' },
  get_date_time:      { icon: 'schedule',          label: 'Tarih / saat' },
  lock_screen:        { icon: 'lock',              label: 'Ekran kilitleniyor' },
  set_volume:         { icon: 'volume_up',         label: 'Ses ayarlanıyor' },
  shutdown:           { icon: 'power_settings_new',label: 'Kapatılıyor' },
  cancel_shutdown:    { icon: 'cancel',            label: 'Kapatma iptali' },
  list_processes:     { icon: 'list_alt',          label: 'Süreçler listeleniyor' },
  kill_process:       { icon: 'block',             label: 'Süreç sonlandırılıyor' },

  // Window
  list_windows:       { icon: 'web_asset',         label: 'Pencereler' },
  focus_window:       { icon: 'select_window',     label: 'Pencere odaklanıyor' },
  minimize_window:    { icon: 'minimize',          label: 'Pencere küçültülüyor' },
  maximize_window:    { icon: 'fullscreen',        label: 'Pencere büyütülüyor' },
  close_window:       { icon: 'close',             label: 'Pencere kapatılıyor' },

  // File
  read_file:          { icon: 'description',       label: 'Dosya okunuyor' },
  write_file:         { icon: 'edit_document',     label: 'Dosya yazılıyor' },
  append_file:        { icon: 'note_add',          label: 'Dosyaya ekleniyor' },
  list_dir:           { icon: 'folder_open',       label: 'Dizin listeleniyor' },
  search_files:       { icon: 'search',            label: 'Dosyalar aranıyor' },
  copy_file:          { icon: 'content_copy',      label: 'Dosya kopyalanıyor' },
  move_file:          { icon: 'drive_file_move',   label: 'Dosya taşınıyor' },
  delete_file:        { icon: 'delete',            label: 'Dosya siliniyor' },
  mkdir:              { icon: 'create_new_folder', label: 'Klasör oluşturuluyor' },
  zip:                { icon: 'folder_zip',        label: 'Sıkıştırılıyor' },
  unzip:              { icon: 'unarchive',         label: 'Açılıyor' },

  // UI Otomasyon
  screenshot:         { icon: 'screenshot_monitor',label: 'Ekran görüntüsü' },
  click:              { icon: 'ads_click',         label: 'Tıklanıyor' },
  type_text:          { icon: 'keyboard',          label: 'Metin yazılıyor' },
  key_press:          { icon: 'keyboard_command_key', label: 'Tuş basılıyor' },
  mouse_move:         { icon: 'mouse',             label: 'Fare hareketi' },

  // Clipboard / Media
  clipboard_get:      { icon: 'content_paste',     label: 'Pano okunuyor' },
  clipboard_set:      { icon: 'content_copy',      label: 'Panoya yazılıyor' },
  text_to_speech:     { icon: 'record_voice_over', label: 'Sese çevriliyor' },
  show_notification:  { icon: 'notifications',     label: 'Bildirim' },
  play_beep:          { icon: 'campaign',          label: 'Ses çalınıyor' },

  // Code
  python_eval:        { icon: 'code',              label: 'Python çalıştırılıyor' },
  evaluate_math:      { icon: 'calculate',         label: 'Hesaplanıyor' },
  regex_match:        { icon: 'pattern',           label: 'Regex eşleniyor' },

  // Memory (basic + vector + KG)
  save_memory:        { icon: 'bookmark_add',      label: 'Hafızaya kaydediliyor' },
  recall_memory:      { icon: 'bookmark',          label: 'Hafızadan getiriliyor' },
  list_memory:        { icon: 'list',              label: 'Hafıza listesi' },
  delete_memory:      { icon: 'delete_sweep',      label: 'Hafıza siliniyor' },
  vector_search:      { icon: 'manage_search',     label: 'Vektör aranıyor' },
  vector_upsert:      { icon: 'database',          label: 'Vektör ekleniyor' },
  ingest_document:    { icon: 'upload_file',       label: 'Belge işleniyor' },
  kg_add_entity:      { icon: 'hub',               label: 'KG düğümü ekleniyor' },
  kg_add_relation:    { icon: 'share',             label: 'KG ilişki ekleniyor' },
  kg_query_neighbors: { icon: 'account_tree',      label: 'KG komşu sorgusu' },
  kg_search:          { icon: 'travel_explore',    label: 'KG aranıyor' },

  // Doküman
  read_document:      { icon: 'description',       label: 'Belge okunuyor' },
  pdf_generate:       { icon: 'picture_as_pdf',    label: 'PDF üretiliyor' },
  xlsx_write:         { icon: 'table_chart',       label: 'Excel yazılıyor' },
  pptx_generate:      { icon: 'slideshow',         label: 'Sunum üretiliyor' },
  pdf_merge:          { icon: 'merge',             label: 'PDF birleştiriliyor' },
  pdf_split:          { icon: 'call_split',        label: 'PDF bölünüyor' },
  markdown_to_html:   { icon: 'html',              label: 'Markdown→HTML' },

  // Git
  git_clone:          { icon: 'cloud_download',    label: 'Repo klonlanıyor' },
  git_status:         { icon: 'fact_check',        label: 'Git durumu' },
  git_pull:           { icon: 'cloud_download',    label: 'Pull yapılıyor' },
  git_push:           { icon: 'cloud_upload',      label: 'Push yapılıyor' },
  git_commit:         { icon: 'commit',            label: 'Commit yapılıyor' },
  git_diff:           { icon: 'difference',        label: 'Diff alınıyor' },
  git_branch_list:    { icon: 'fork_right',        label: 'Branch listesi' },
  git_branch_switch:  { icon: 'swap_horiz',        label: 'Branch değişiyor' },
  git_log:            { icon: 'history',           label: 'Git logu' },
  git_init:           { icon: 'add_circle',        label: 'Repo oluşturuluyor' },

  // Email & Messaging
  email_send:         { icon: 'send',              label: 'E-posta gönderiliyor' },
  email_read_inbox:   { icon: 'inbox',             label: 'Gelen kutusu' },
  slack_send:         { icon: 'forum',             label: 'Slack mesajı' },
  discord_send:       { icon: 'chat',              label: 'Discord mesajı' },
  telegram_send:      { icon: 'send',              label: 'Telegram mesajı' },

  // DB / Image
  db_query:           { icon: 'database',          label: 'Veritabanı sorgusu' },
  db_execute:         { icon: 'play_arrow',        label: 'SQL çalıştırılıyor' },
  db_schema:          { icon: 'schema',            label: 'Şema okunuyor' },
  image_generate:     { icon: 'imagesmode',        label: 'Görsel üretiliyor' },

  // Araştırma
  arxiv_search:       { icon: 'science',           label: 'arXiv aranıyor' },
  wikipedia_lookup:   { icon: 'menu_book',         label: 'Wikipedia' },
  youtube_search:     { icon: 'smart_display',     label: 'YouTube aranıyor' },
  youtube_transcript: { icon: 'closed_caption',    label: 'YouTube transkripti' },

  // Güvenlik & Ağ
  dns_lookup:         { icon: 'dns',               label: 'DNS sorgusu' },
  whois_query:        { icon: 'badge',             label: 'WHOIS sorgusu' },
  ssl_cert_check:     { icon: 'shield',            label: 'SSL kontrol' },
  port_scan:          { icon: 'lan',               label: 'Port tarama' },

  // DevOps
  docker_ps:          { icon: 'directions_boat',   label: 'Docker süreçleri' },
  docker_logs:        { icon: 'receipt_long',      label: 'Docker logları' },
  docker_run:         { icon: 'play_circle',       label: 'Docker run' },
  docker_build:       { icon: 'construction',      label: 'Docker build' },
  kubectl_get:        { icon: 'view_list',         label: 'K8s kaynakları' },
  kubectl_logs:       { icon: 'receipt_long',      label: 'K8s logları' },
  kubectl_apply:      { icon: 'check_circle',      label: 'K8s apply' },

  // Multi-agent
  delegate_to_agent:  { icon: 'group',             label: 'Ajan delegasyonu' }};

/** Tool meta'yı ad'a göre çöz; bulunamazsa default. */
function getToolMeta(name: string): { icon: string; label: string } {
  return TOOL_META[name] || { icon: 'build', label: name.replace(/_/g, ' ') };
}

/**
 * Tool çağrısı için kompakt tek satır rozet.
 * Linear / Vercel / Stripe tarzı kurumsal sade görünüm.
 */
function ToolCallCard({ tc, index }: { tc: ToolCallInfo; index: number }) {
  const finished = tc.duration_ms > 0 || !!tc.output || !!tc.error;
  const meta = getToolMeta(tc.name);

  return (
    <div
      className="animate-tool-card-enter relative group/tc flex items-center gap-2.5 px-3 py-2 rounded-lg bg-brand-panel/80 backdrop-blur-sm border border-brand-border/70 hover:border-brand-borderStrong hover:bg-brand-panelAlt/90 transition-all duration-200"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Sol kenar: animated progress bar veya static durum çizgisi */}
      <div
        className={`absolute left-0 top-[6px] bottom-[6px] w-[2.5px] rounded-full ${
          !finished
            ? 'bg-gradient-to-b from-brand-accent via-brand-accent/30 to-brand-accent bg-[length:100%_200%]'
            : tc.ok
              ? 'bg-brand-success/70'
              : 'bg-brand-danger/70'
        }`}
        style={!finished ? { animation: 'tool-progress-glow 1.4s ease-in-out infinite' } : undefined}
      />

      {/* Tool ikonu — ince daire arka plan */}
      <div className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg ${
        !finished
          ? 'bg-brand-accent/10 text-brand-accent'
          : tc.ok
            ? 'bg-brand-success/10 text-brand-success'
            : 'bg-brand-danger/10 text-brand-danger'
      }`}>
        <Icon name={meta.icon} size={15} weight={500} />
      </div>

      {/* Tool etiketi (Türkçe) + tool adı subtitle */}
      <div className="flex-1 min-w-0">
        <span className="block text-[11.5px] font-semibold text-brand-text truncate leading-tight">
          {meta.label}
        </span>
        <span className="block text-[9.5px] font-mono text-brand-mutedSoft truncate leading-tight mt-0.5">
          {tc.name}
        </span>
      </div>

      {/* Sağ: durum göstergesi */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {finished ? (
          <>
            <span
              className={`text-[10px] font-mono font-semibold tabular-nums ${
                tc.ok ? 'text-brand-mutedSoft' : 'text-brand-danger'
              }`}
            >
              {tc.duration_ms > 0
                ? tc.duration_ms < 1000
                  ? `${tc.duration_ms}ms`
                  : `${(tc.duration_ms / 1000).toFixed(1)}s`
                : tc.ok
                  ? 'ok'
                  : 'hata'}
            </span>
            <div className="animate-tool-status-pop">
              <Icon
                name={tc.ok ? 'check_circle' : 'cancel'}
                size={15}
                weight={500}
                filled
                className={tc.ok ? 'text-brand-success' : 'text-brand-danger'}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1.5">
            <Icon
              name="progress_activity"
              size={14}
              weight={550}
              className="text-brand-accent animate-spin-slow"
            />
            <span className="text-[9.5px] uppercase tracking-wider font-bold text-brand-accent">
              çalışıyor
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Reflection (PASS/RETRY/REPLAN/FAIL) sonucu kartı.
 * Material Symbols ile profesyonel tasarım.
 */
function ReflectionCard({ reflection }: { reflection: ReflectionInfo }) {
  const config: Record<
    string,
    { icon: string; label: string; cls: string; iconBg: string }
  > = {
    pass: {
      icon: 'task_alt',
      label: 'Adım Onaylandı',
      cls: 'border-brand-success/40 bg-brand-success/5',
      iconBg: 'bg-brand-success/15 text-brand-success'},
    retry: {
      icon: 'refresh',
      label: 'Yeniden Deneniyor',
      cls: 'border-yellow-500/40 bg-yellow-500/5',
      iconBg: 'bg-yellow-500/15 text-yellow-500'},
    replan: {
      icon: 'autorenew',
      label: 'Plan Güncelleniyor',
      cls: 'border-brand-accent/40 bg-brand-accent/5',
      iconBg: 'bg-brand-accent/15 text-brand-accent'},
    fail: {
      icon: 'error',
      label: 'Adım Başarısız',
      cls: 'border-brand-danger/40 bg-brand-danger/5',
      iconBg: 'bg-brand-danger/15 text-brand-danger'}};
  const c = config[reflection.verdict] || config.pass;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border ${c.cls} px-3 py-2.5 backdrop-blur-sm shadow-sm animate-reflection-in`}
    >
      <div
        className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${c.iconBg}`}
      >
        <Icon name={c.icon} size={20} weight={500} filled />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-brand-text">
            {c.label}
          </span>
          <span className="text-[9.5px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-panel-alt text-brand-mutedSoft font-mono">
            Adım #{reflection.step_id}
          </span>
        </div>
        <div className="text-[11.5px] text-brand-textSoft mt-1 leading-relaxed">
          {reflection.reason}
        </div>
        {reflection.suggested_fix && (
          <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-brand-textSoft italic">
            <Icon
              name="lightbulb"
              size={13}
              weight={500}
              filled
              className="text-yellow-500 flex-shrink-0 mt-px"
            />
            <span>{reflection.suggested_fix}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Klavye kısayol pill rozeti — composer altındaki yardım için.
 * Birden fazla tuş kombinasyonu desteği, hepsi aynı baseline'da.
 */
function HintPill({ keys, label }: { keys: string[]; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[9.5px] text-brand-mutedSoft">
      <span className="inline-flex items-center gap-0.5">
        {keys.map((k, i) => (
          <kbd
            key={i}
            className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded bg-brand-panelAlt border border-brand-border font-mono text-[9px] leading-none not-italic font-semibold text-brand-textSoft"
            style={{ fontStyle: 'normal' }}
          >
            {k}
          </kbd>
        ))}
      </span>
      <span className="font-medium">{label}</span>
    </span>
  );
}

/** Header'daki tek başına ikon-buton (toggle destekli). */
function HeaderIconButton({
  icon,
  active = false,
  onClick,
  title}: {
  icon: string;
  active?: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all duration-200 active:scale-95 ${
        active
          ? 'border-brand-accent text-brand-accent bg-brand-accent/10 shadow-sm'
          : 'border-brand-border text-brand-muted hover:text-brand-text hover:border-brand-borderStrong hover:bg-brand-panelAlt'
      }`}
    >
      <Icon name={icon} size={18} weight={550} filled={active} />
    </button>
  );
}

/** Toolbar kapsülünün içindeki segment buton. */
function ToolbarSegment({
  icon,
  active = false,
  filled = false,
  onClick,
  title}: {
  icon: string;
  active?: boolean;
  filled?: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-8 h-8 rounded-md flex items-center justify-center transition-all duration-200 active:scale-95 ${
        active
          ? 'bg-brand-accent/15 text-brand-accent'
          : 'text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt'
      }`}
    >
      <Icon name={icon} size={16} weight={550} filled={filled || active} />
    </button>
  );
}

/** Segmentler arasında dikey ince ayraç. */
function SegmentDivider() {
  return <div className="w-px h-4 bg-brand-border" />;
}

export function ChatWindow({
  agent,
  messages,
  loading,
  sending,
  error,
  liveToolCalls = [],
  plan = null,
  lastReflection = null,
  onSend,
  onNewConversation,
  onCancel,
  agentListOpen,
  onToggleAgentList,
  systemPanelOpen,
  onToggleSystemPanel}: ChatWindowProps) {
  const [draft, setDraft] = useState('');
  const [showPlan, setShowPlan] = useState(true);
  const [showFileDrop, setShowFileDrop] = useState(false);
  const [showWorkflows, setShowWorkflows] = useState(false);
  const [showKG, setShowKG] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const totalTokens = messages.reduce((acc, m) => acc + (m.tokens || 0), 0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending, liveToolCalls.length, plan?.steps.length]);

  if (!agent) {
    return (
      <main className="flex-1 flex items-center justify-center text-brand-muted bg-brand-bg animate-fade-in-up animate-stagger-2">
        <div className="text-center">
          <Icon
            name="forum"
            size={48}
            weight={300}
            className="text-brand-mutedSoft mb-3"
          />
          <p className="text-base text-brand-text">Başlamak için bir ajan seç</p>
          <p className="text-xs mt-2 text-brand-muted">
            Sol panelden bir ajan seçiniz.
          </p>
        </div>
      </main>
    );
  }

  const handleSubmit = () => {
    const content = draft.trim();
    if (!content || sending) return;
    onSend(content);
    setDraft('');
  };

  const planActive = plan && plan.steps.length > 0;

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-brand-bg animate-fade-in-up animate-stagger-2">
      {/* Üst başlık — kurumsal sade conversation header */}
      <header className="h-14 px-4 border-b border-brand-border flex items-center justify-between bg-brand-panel">
        {/* Sol: Ajan kimliği */}
        <div className="min-w-0 flex items-center gap-2 flex-1">
          {!agentListOpen && (
            <button
              onClick={onToggleAgentList}
              title="Ajanlar Listesini Göster"
              className="w-8 h-8 rounded-md inline-flex items-center justify-center text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all mr-1 flex-shrink-0 animate-fade-in"
            >
              <Icon name="menu" size={18} />
            </button>
          )}

          {/* Online status dot — tek başına, ikon kutusu yok */}
          <span
            className="w-2 h-2 rounded-full bg-brand-success flex-shrink-0"
            title="Aktif"
          />

          {/* Bilgi kolonu */}
          <div className="min-w-0 flex-1">
            {/* Üst satır: Ajan adı + opsiyonel rol rozet */}
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm font-semibold text-brand-text truncate leading-tight">
                {agent.name}
              </span>
              {agent.role && (
                <span className="hidden md:inline-flex items-center h-4 px-1.5 rounded text-[9.5px] font-semibold uppercase tracking-wider bg-brand-panelAlt text-brand-mutedSoft border border-brand-border flex-shrink-0">
                  {agent.role}
                </span>
              )}
            </div>

            {/* Alt satır: Provider + model + token rozeti */}
            <div className="flex items-center gap-1.5 mt-0.5 text-[10.5px] text-brand-mutedSoft min-w-0">
              {/* Provider adı ve logosu */}
              <span className="font-mono truncate flex items-center gap-1" title={`${agent.provider} sağlayıcısı`}>
                <img src={`/providers/${agent.provider === 'openai' ? 'openai-official' : agent.provider}.png?v=3`} alt="" className="w-3.5 h-3.5 object-contain rounded-sm" />
                <span className="capitalize">{agent.provider}</span>
              </span>

              <span className="text-brand-border flex-shrink-0">/</span>

              {/* Model adı ve logosu */}
              <span className="font-mono truncate flex items-center gap-1" title={agent.model}>
                <img src={getModelLogo(agent.model, agent.provider)} alt="" className="w-3.5 h-3.5 object-contain rounded-sm" />
                <span>{agent.model}</span>
              </span>

              {/* Token sayacı — her zaman görünür */}
              <span className="text-brand-border flex-shrink-0">·</span>
              <span
                className="inline-flex items-center gap-0.5 font-mono tabular-nums flex-shrink-0"
                title={`Bu sohbette toplam ${totalTokens.toLocaleString()} token harcandı`}
              >
                <Icon name="bolt" size={10} weight={500} filled className="text-brand-accent" />
                <span>{totalTokens.toLocaleString()}</span>
                <span className="text-brand-mutedSoft">tok</span>
              </span>
            </div>
          </div>
        </div>

        {/* Sağ: Toolbar + birincil aksiyon */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Segmentli ikon kapsülü */}
          <div className="hidden sm:flex items-center bg-brand-bg/40 border border-brand-border rounded-lg p-0.5">
            {planActive && (
              <>
                <ToolbarSegment
                  icon="checklist"
                  active={showPlan}
                  onClick={() => setShowPlan((v) => !v)}
                  title="Plan panelini aç/kapat"
                />
                <SegmentDivider />
              </>
            )}
            <ToolbarSegment
              icon="attach_file"
              active={showFileDrop}
              onClick={() => setShowFileDrop((v) => !v)}
              title="Dosya yükle"
            />
            <SegmentDivider />
            <ToolbarSegment
              icon="bolt"
              filled
              onClick={() => setShowWorkflows(true)}
              title="Workflow çalıştır"
            />
            <SegmentDivider />
            <ToolbarSegment
              icon="hub"
              filled
              onClick={() => setShowKG(true)}
              title="Knowledge Graph"
            />
          </div>

          {/* Mobile: tek tek butonlar */}
          <div className="sm:hidden flex items-center gap-1">
            {planActive && (
              <HeaderIconButton
                icon="checklist"
                active={showPlan}
                onClick={() => setShowPlan((v) => !v)}
                title="Plan"
              />
            )}
            <HeaderIconButton
              icon="attach_file"
              active={showFileDrop}
              onClick={() => setShowFileDrop((v) => !v)}
              title="Dosya"
            />
          </div>

          {/* Birincil aksiyon: Yeni Sohbet */}
          <button
            onClick={onNewConversation}
            className="h-9 px-3 rounded-lg bg-brand-accent text-brand-bg text-xs font-semibold hover:bg-brand-accentDim active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
            title="Yeni sohbet başlat"
          >
            <Icon name="add" size={16} weight={650} />
            <span className="hidden md:inline">Yeni Sohbet</span>
          </button>

          {!systemPanelOpen && (
            <button
              onClick={onToggleSystemPanel}
              title="Görevler & Loglar Panelini Göster"
              className="w-8 h-8 rounded-md inline-flex items-center justify-center text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all ml-1 flex-shrink-0 animate-fade-in"
            >
              <Icon name="assignment" size={18} />
            </button>
          )}
        </div>
      </header>

      {/* Plan paneli (smooth height slide) */}
      {planActive && (
        <div
          className={`grid transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            showPlan ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <div className={`px-3 pt-3 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              showPlan ? 'translate-y-0' : '-translate-y-4'
            }`}>
              <TaskTimeline plan={plan} />
            </div>
          </div>
        </div>
      )}

      {/* File Drop Zone */}
      {showFileDrop && (
        <div className="px-3 pt-3">
          <FileDropZone agentId={agent.id} />
        </div>
      )}

      {/* Mesaj alanı */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && (
          <div className="flex items-center justify-center text-sm text-brand-muted gap-2 py-4">
            <Icon
              name="progress_activity"
              size={16}
              className="animate-spin-slow"
            />
            <span>Yükleniyor...</span>
          </div>
        )}
        {!loading && messages.length === 0 && !planActive && (
          <div className="flex flex-col items-center justify-center text-sm text-brand-muted py-12 gap-2">
            <Icon
              name="chat"
              size={36}
              weight={300}
              className="text-brand-mutedSoft"
            />
            <span>İlk mesajını gönder...</span>
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} agentName={agent.name} />
        ))}

        {/* Canlı tool akışı — premium glassmorphic kart */}
        {sending && liveToolCalls.length > 0 && (
          <div className="flex justify-start animate-fade-in-up">
            <div className="max-w-[82%] w-full">
              <div className="rounded-xl bg-brand-panel/50 backdrop-blur-md border border-brand-border/50 shadow-lg shadow-black/10 overflow-hidden">
                {/* Kompakt başlık */}
                <div className="flex items-center gap-2 px-3.5 py-2 border-b border-brand-border/40">
                  <div className="flex items-center justify-center w-5 h-5 rounded-md bg-brand-accent/10">
                    <Icon
                      name="build"
                      size={11}
                      weight={600}
                      className="text-brand-accent"
                    />
                  </div>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-brand-mutedSoft">
                    Araçlar
                  </span>
                  <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md bg-brand-accent/10 text-[9.5px] font-mono font-bold text-brand-accent tabular-nums">
                    {liveToolCalls.length}
                  </span>
                </div>
                {/* Tool satırları */}
                <div className="p-2 space-y-1.5">
                  {liveToolCalls.map((tc, i) => (
                    <ToolCallCard key={tc.id} tc={tc} index={i} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reflection kartı */}
        {sending && lastReflection && (
          <div className="flex justify-start">
            <div className="max-w-[85%] w-full">
              <ReflectionCard reflection={lastReflection} />
            </div>
          </div>
        )}

        {/* Asistan düşünüyor — minimal premium */}
        {sending && (
          <div className="flex justify-start animate-fade-in-up">
            <div className="relative inline-flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-full bg-gradient-to-r from-brand-accent/8 via-brand-accent/4 to-transparent border border-brand-accent/15 backdrop-blur-sm">
              {/* Sol: sabit orb + dönen halo (büyüyüp küçülmez) */}
              <div className="relative w-6 h-6 flex-shrink-0">
                {/* Dönen ışık halkası */}
                <div className="orb-halo" />
                {/* Orb (sabit boyut, sadece soft opacity nefesi) */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-accent to-brand-accentDim flex items-center justify-center animate-orb-breathe">
                  <Icon
                    name="auto_awesome"
                    size={12}
                    weight={650}
                    filled
                    className="text-brand-bg"
                  />
                </div>
              </div>

              {/* Orta: shimmer text — soldan sağa parıltı geçer */}
              <span
                className="text-[12px] font-semibold tracking-normal leading-none bg-gradient-to-r from-brand-text via-brand-accent to-brand-text bg-[length:200%_100%] bg-clip-text text-transparent animate-text-shimmer not-italic inline-block align-middle"
                style={{ fontStyle: 'normal' }}
              >
                Düşünüyor
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Hata bandı */}
      {error && (
        <div className="mx-4 mb-2 p-2.5 text-xs rounded-lg border border-brand-danger/40 bg-brand-danger/10 text-brand-danger flex items-start gap-2 animate-slide-in-right">
          <Icon
            name="error"
            size={15}
            weight={500}
            filled
            className="flex-shrink-0 mt-px"
          />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {/* Composer — Claude/ChatGPT tarzı tek satır kapsül */}
      <div className="px-3 pt-2 pb-2 border-t border-brand-border bg-brand-panel">
        <div
          className={`flex items-end gap-1.5 rounded-2xl border bg-brand-bg pl-3 pr-1.5 py-1.5 transition-all duration-200 ${
            sending
              ? 'border-brand-accent/40'
              : 'border-brand-border hover:border-brand-borderStrong focus-within:border-brand-accent focus-within:ring-2 focus-within:ring-brand-accent/15'
          }`}
        >
          {/* Voice (sol) */}
          <div className="pb-1 flex-shrink-0">
            <VoiceButton
              disabled={sending}
              onTranscribed={(text) =>
                setDraft((prev) => (prev ? prev + ' ' + text : text))
              }
            />
          </div>

          {/* Textarea — auto-grow */}
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            rows={1}
            placeholder={`${agent.name} ajanına mesaj yaz...`}
            className="flex-1 resize-none bg-transparent text-sm text-brand-text placeholder:text-brand-mutedSoft focus:outline-none py-1.5 leading-relaxed max-h-32 min-h-[24px]"
            style={{
              height: 'auto',
              minHeight: '24px'}}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 128) + 'px';
            }}
          />

          {/* Karakter sayacı (sadece yazıyorken) */}
          {draft.length > 0 && !sending && (
            <span className="pb-2 text-[10px] font-mono text-brand-mutedSoft tabular-nums select-none flex-shrink-0">
              {draft.length}
            </span>
          )}

          {/* Gönder / İptal — kompakt yuvarlak */}
          {sending && onCancel ? (
            <button
              onClick={onCancel}
              title="Çalışmayı iptal et"
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-brand-danger text-brand-bg hover:opacity-90 active:scale-90 transition-all flex-shrink-0"
              aria-label="İptal"
            >
              <Icon name="stop" size={16} weight={650} filled />
            </button>
          ) : (
            <button
              disabled={sending || !draft.trim()}
              onClick={handleSubmit}
              title="Mesajı gönder (Enter)"
              className={`h-8 w-8 inline-flex items-center justify-center rounded-lg transition-all flex-shrink-0 ${
                draft.trim()
                  ? 'bg-brand-accent text-brand-bg hover:bg-brand-accentDim active:scale-90 shadow-sm'
                  : 'bg-brand-panelAlt text-brand-mutedSoft cursor-not-allowed'
              }`}
              aria-label="Gönder"
            >
              <Icon name="arrow_upward" size={17} weight={700} />
            </button>
          )}
        </div>

        {/* Yardım barı — uyumlu pill rozetler */}
        <div className="flex items-center justify-between mt-1.5 px-2 select-none">
          <div className="flex items-center gap-1.5">
            <HintPill keys={['Enter']} label="gönder" />
            <HintPill keys={['Shift', 'Enter']} label="yeni satır" />
            <span className="hidden md:inline-flex">
              <HintPill keys={['Ctrl', 'K']} label="komut" />
            </span>
          </div>
          {sending && (
            <span className="inline-flex items-center gap-1 text-[10px] text-brand-accent font-medium">
              <Icon
                name="progress_activity"
                size={10}
                className="animate-spin-slow"
              />
              <span>İşleniyor...</span>
            </span>
          )}
        </div>
      </div>

      {/* Modallar */}
      <WorkflowsModal open={showWorkflows} onClose={() => setShowWorkflows(false)} />
      <KnowledgeGraphModal
        open={showKG}
        onClose={() => setShowKG(false)}
        agentId={agent.id}
      />
    </main>
  );
}