export type ToolMeta = { icon: string; label: string };

/**
 * Tool ad → görsel meta (Material Symbol icon + Türkçe etiket).
 * Bilinmeyen tool'lar için fallback "build" ikonu kullanılır.
 */
export const TOOL_META: Record<string, { icon: string; label: string }> = {
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
export function getToolMeta(name: string): { icon: string; label: string } {
  return TOOL_META[name] || { icon: 'build', label: name.replace(/_/g, ' ') };
}
