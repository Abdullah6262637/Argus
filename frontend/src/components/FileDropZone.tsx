// FileDropZone: drag-drop ile vector store'a ingest (Material Symbols)

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
    <div className="space-y-2">
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
        className={`border-2 border-dashed rounded-lg p-4 text-center transition cursor-pointer ${
          dragOver
            ? 'border-brand-accent bg-brand-accent/10 text-brand-accent'
            : 'border-brand-border text-brand-muted hover:border-brand-borderStrong'
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
          <Icon
            name="cloud_upload"
            size={28}
            weight={400}
            className={`mb-1 ${dragOver ? 'text-brand-accent' : 'text-brand-mutedSoft'}`}
          />
          <div className="text-xs flex items-center justify-center gap-1">
            <strong>Dosya bırak</strong> veya
            <span className="underline">tıkla</span>
          </div>
          <div className="text-[10px] mt-1 opacity-70">
            PDF / DOCX / XLSX / CSV / HTML / TXT / MD — chunk + embed + memory'e yazılır
          </div>
        </label>
      </div>

      {items.length > 0 && (
        <ul className="space-y-1 max-h-40 overflow-y-auto">
          {items.map((it, i) => (
            <li
              key={i}
              className={`text-[11px] px-2 py-1 rounded border ${
                it.state === 'done'
                  ? 'border-brand-success/30 bg-brand-success/5 text-brand-success'
                  : it.state === 'error'
                    ? 'border-brand-danger/30 bg-brand-danger/5 text-brand-danger'
                    : 'border-brand-border bg-brand-panel text-brand-muted'
              }`}
            >
              <div className="flex items-center gap-2">
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
                  size={13}
                  weight={500}
                  filled={it.state === 'done' || it.state === 'error'}
                  className={it.state === 'uploading' ? 'animate-spin-slow' : ''}
                />
                <span className="truncate flex-1">{it.filename}</span>
                {it.chunks != null && (
                  <span className="text-brand-mutedSoft font-mono text-[10px]">
                    {it.chunks} chunk
                  </span>
                )}
              </div>
              {it.error && <div className="mt-0.5 truncate">{it.error}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}