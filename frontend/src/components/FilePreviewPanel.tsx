import { Icon } from './Icon';
import { PreviewIcon } from './icons/HeaderIcons';

export interface AttachedFileItem {
  id: string;
  name: string;
  ext: string;
  status: 'uploading' | 'done' | 'error';
  chunks?: number;
  error?: string;
  isRemoving?: boolean;
  content?: string;
  size?: number;
}

interface FilePreviewPanelProps {
  attachedFiles: AttachedFileItem[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function FilePreviewPanel({
  attachedFiles,
  activeFileId,
  onSelectFile,
  isOpen,
  onClose,
}: FilePreviewPanelProps) {
  const activeFile =
    attachedFiles.find((f) => f.id === activeFileId) || attachedFiles[0] || null;

  return (
    <aside
      className={`relative h-full flex-shrink-0 bg-brand-panel flex flex-col transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
        isOpen ? 'w-80 opacity-100' : 'w-0 opacity-0'
      }`}
    >
      <div
        className={`w-80 h-full flex flex-col transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-8'
        }`}
      >
        {/* Top Header Bar */}
        <div className="h-11 px-4 bg-brand-panel flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-brand-text font-semibold text-xs min-w-0">
            <PreviewIcon size={16} className="text-brand-accent flex-shrink-0" />
            <span className="truncate">Dosya Önizleme</span>
          </div>

          <button
            onClick={onClose}
            title="Kapat"
            className="w-7 h-7 rounded-md inline-flex items-center justify-center text-brand-mutedSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Multi-File Tab Bar (If multiple files attached) */}
        {attachedFiles.length > 1 && (
          <div className="flex items-center gap-1 px-4 py-1 overflow-x-auto scrollbar-none flex-shrink-0">
            {attachedFiles.map((file) => (
              <button
                key={file.id}
                onClick={() => onSelectFile(file.id)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium truncate max-w-[100px] transition-all ${
                  file.id === activeFile?.id
                    ? 'bg-brand-accent/20 text-brand-accent font-semibold'
                    : 'text-brand-mutedSoft hover:text-brand-text hover:bg-brand-panelAlt/60'
                }`}
                title={file.name}
              >
                {file.name}
              </button>
            ))}
          </div>
        )}

        {/* Content Viewer */}
        {activeFile ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* File Info Bar */}
            <div className="px-4 py-2.5 flex items-center justify-between text-xs text-brand-textSoft flex-shrink-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-panelAlt text-brand-accent flex-shrink-0">
                  {activeFile.ext}
                </span>
                <span className="truncate text-[11px] font-medium" title={activeFile.name}>
                  {activeFile.name}
                </span>
              </div>
              <span className="text-[10px] font-mono text-brand-mutedSoft flex-shrink-0">
                {activeFile.chunks ? `${activeFile.chunks} chunk` : `${activeFile.size ?? 0} B`}
              </span>
            </div>

            {/* Main Code/Text View */}
            <div className="flex-1 px-4 py-2 overflow-y-auto font-mono text-xs text-brand-textSoft leading-relaxed select-text scrollbar-thin">
              {activeFile.content ? (
                <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed">
                  {activeFile.content}
                </pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-brand-muted text-xs p-4">
                  <Icon name="description" size={32} className="text-brand-mutedSoft mb-2" />
                  <span>Dosya içeriği yükleniyor veya boş...</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-brand-muted text-xs">
            <Icon name="file_present" size={40} className="text-brand-mutedSoft mb-3" />
            <p>Önizlemek için bir dosyaya çift tıklayınız.</p>
          </div>
        )}
      </div>
    </aside>
  );
}
