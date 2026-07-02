// FileBrowser: tool sonuclarini tree gorunumunde modal (Material Symbols)

import { useState } from 'react';
import { Icon } from './Icon';

interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size?: number;
}

interface FileBrowserProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  entries: FileEntry[];
}

export function FileBrowser({ open, onClose, title = 'Dosyalar', entries }: FileBrowserProps) {
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<FileEntry | null>(null);

  if (!open) return null;

  const filtered = filter
    ? entries.filter((e) =>
        e.name.toLowerCase().includes(filter.toLowerCase()),
      )
    : entries;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center p-4 animate-backdrop-in"
      onClick={onClose}
    >
      <div
        className="bg-brand-bg border border-brand-border rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-brand-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-brand-text flex items-center gap-2">
            <Icon name="folder_open" size={18} weight={500} className="text-brand-accent" />
            {title}
          </h3>
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center text-brand-muted hover:text-brand-text hover:bg-brand-panelAlt transition-all"
            onClick={onClose}
            title="Kapat"
          >
            <Icon name="close" size={18} weight={500} />
          </button>
        </div>

        <div className="px-4 py-2 border-b border-brand-border">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrele..."
            className="w-full bg-brand-panel border border-brand-border rounded px-3 py-1.5 text-sm text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="text-center text-sm text-brand-muted py-8">
              {filter ? 'Eslesme yok' : 'Bos'}
            </div>
          ) : (
            <ul className="space-y-0.5">
              {filtered.map((e, i) => (
                <li
                  key={i}
                  className={`px-2 py-1.5 rounded cursor-pointer hover:bg-brand-panel transition flex items-center gap-2 ${
                    selected?.path === e.path ? 'bg-brand-panel' : ''
                  }`}
                  onClick={() => setSelected(e)}
                >
                  <Icon
                    name={e.is_dir ? 'folder' : 'description'}
                    size={16}
                    weight={500}
                    filled={e.is_dir}
                    className={`flex-shrink-0 ${e.is_dir ? 'text-brand-accent' : 'text-brand-muted'}`}
                  />
                  <span className="text-sm text-brand-text flex-1 truncate">
                    {e.name}
                  </span>
                  {e.size !== undefined && !e.is_dir && (
                    <span className="text-[10px] text-brand-mutedSoft flex-shrink-0">
                      {formatSize(e.size)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {selected && (
          <div className="border-t border-brand-border p-3 bg-brand-panel/40">
            <div className="text-xs text-brand-mutedSoft mb-1">Secili:</div>
            <div className="text-sm text-brand-text font-mono break-all">
              {selected.path}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}