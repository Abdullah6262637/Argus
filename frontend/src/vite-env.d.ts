/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend API base URL'ini override et (orn: http://192.168.1.5:8000/api). */
  readonly VITE_API_BASE?: string;
  /** WebSocket base URL'ini override et (orn: ws://192.168.1.5:8000). */
  readonly VITE_WS_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}