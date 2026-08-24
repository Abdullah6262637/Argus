import { useCallback, useState } from 'react';
import { api } from '@/api/client';
import { Icon } from './Icon';

interface FileDropZoneProps {
  agentId?: string | null;
  onIngested?: (info: { filename: string; chunks: number }) => void;
}

interface IngestStatus {
  filename: string;
  state: 'pending' | 'uploading' | 'done' | 'error';
  chunks?: number;
  error?: string;
}

export function FileDropZone({ agentId, onIngested }: FileDropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [items, setItems] = useState<IngestStatus[]>([]);

  const upload = useCallback(
    async (file: File) => {
      const idx = items.length;
      setItems((prev) => [...prev, { filename: file.name, state: 'uploading' }]);
      try {
        const result = await api.memoryIngestFile(file, agentId ?? undefined);
        setItems((prev) =>
          prev.map((it, i) =>
            i === idx ? { ...it, state: 'done', chunks: result.chunks } : it,
          ),
        );
        onIngested?.({ filename: file.name, chunks: result.chunks });
      } catch (err) {
        setItems((prev) =>
          prev.map((it, i) =>
            i === idx
              ? { ...it, state: 'error', error: err instanceof Error ? err.message : String(err) }
              : it,
          ),
        );
      }
    },
    [agentId, items.length, onIngested],
  );

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(upload);
  };

  return (
    <div className="space-y-2.5 animate-fade-in-down">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`relative rounded-2xl p-6 text-center transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer group overflow-hidden ${
          dragOver
            ? 'bg-brand-accent/15 ring-2 ring-brand-accent/40 shadow-xl shadow-brand-accent/10 scale-[1.01]'
            : 'bg-brand-panelAlt/50 hover:bg-brand-panelAlt/80 hover:shadow-lg active:scale-[0.995]'
        }`}
      >
        <label className="cursor-pointer block">
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            accept=".pdf,.docx,.xlsx,.csv,.html,.htm,.txt,.md,.json"
          />

          {/* Avatar & Icon with subtle hover float */}
          <div
            className={`w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              dragOver
                ? 'bg-brand-accent text-brand-bg scale-110 shadow-lg shadow-brand-accent/30'
                : 'bg-brand-bg/60 text-brand-mutedSoft group-hover:bg-brand-accent/15 group-hover:text-brand-accent group-hover:scale-105'
            }`}
          >
            <Icon
              name="cloud_upload"
              size={24}
              weight={500}
              className="transition-transform duration-300 group-hover:-translate-y-0.5"
            />
          </div>

          {/* Heading */}
          <div className="text-xs font-semibold text-brand-text flex items-center justify-center gap-1.5">
            <span>Dosyaları buraya bırak</span>
            <span className="text-brand-mutedSoft font-normal">veya</span>
            <span className="px-2 py-0.5 rounded-lg bg-brand-accent/15 text-brand-accent text-[11px] font-bold group-hover:bg-brand-accent group-hover:text-brand-bg transition-all duration-300 shadow-sm">
              Gözat
            </span>
          </div>

          {/* Subtitle Format Badges */}
          <div className="flex items-center justify-center gap-1 flex-wrap mt-2.5">
            {['PDF', 'DOCX', 'XLSX', 'CSV', 'HTML', 'TXT', 'MD', 'JSON'].map((fmt) => (
              <span
                key={fmt}
                className="text-[9.5px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-brand-bg/40 text-brand-mutedSoft/90 tracking-tight"
              >
                {fmt}
              </span>
            ))}
          </div>

          <div className="text-[10px] text-brand-mutedSoft mt-2 font-mono opacity-80">
            Chunk · Embed · Vector Memory Store
          </div>
        </label>
      </div>

      {/* Ingest Progress List */}
      {items.length > 0 && (
        <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {items.map((it, i) => (
            <li
              key={i}
              className={`text-[11px] px-3 py-2 rounded-xl transition-all animate-slide-in-right flex items-center justify-between gap-3 ${
                it.state === 'done'
                  ? 'bg-brand-success/10 text-brand-success'
                  : it.state === 'error'
                    ? 'bg-brand-danger/10 text-brand-danger'
                    : 'bg-brand-panelAlt/80 text-brand-textSoft'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <Icon
                  name={
                    it.state === 'uploading'
                      ? 'progress_activity'
                      : it.state === 'done'
                        ? 'check_circle'
                        : it.state === 'error'
                          ? 'error'
                          : 'pending'
                  }
                  size={15}
                  weight={550}
                  filled={it.state === 'done' || it.state === 'error'}
                  className={it.state === 'uploading' ? 'animate-spin-slow text-brand-accent' : ''}
                />
                <span className="truncate font-medium">{it.filename}</span>
              </div>

              {it.chunks != null && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-brand-bg/50 text-brand-success flex-shrink-0 tabular-nums">
                  {it.chunks} chunk
                </span>
              )}
              {it.error && <div className="text-[10px] text-brand-danger truncate">{it.error}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}