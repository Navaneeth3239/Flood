/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK_DATA?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_WS_URL?: string;
  readonly VITE_STALE_DATA_THRESHOLD_MINUTES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
