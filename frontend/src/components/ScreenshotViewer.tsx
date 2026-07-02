// ScreenshotViewer (FAZ 6.2): tool kartinda image preview + lightbox

import { useState } from 'react';

interface ScreenshotViewerProps {
  imageB64?: string;
  imagePath?: string;
  alt?: string;
}

export function ScreenshotViewer({ imageB64, imagePath, alt = 'screenshot' }: ScreenshotViewerProps) {
  const [open, setOpen] = useState(false);
  if (!imageB64 && !imagePath) return null;

  const src = imageB64
    ? `data:image/png;base64,${imageB64}`
    : `file://${imagePath}`;

  return (
    <>
      <div
        className="inline-block cursor-pointer hover:opacity-80 transition"
        onClick={() => setOpen(true)}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-[200px] max-h-[150px] rounded border border-brand-border"
        />
        {imagePath && (
          <div className="text-[10px] text-brand-mutedSoft mt-1 truncate max-w-[200px]">
            {imagePath.split(/[\\/]/).pop()}
          </div>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setOpen(false)}
        >
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain rounded shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/60 rounded-full w-10 h-10 flex items-center justify-center"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}