/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** Deployment identity: "staging" on the staging build, unset in production */
  readonly VITE_APP_ENV?: string;
  readonly VITE_BUILD_TIME?: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
