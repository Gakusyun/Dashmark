/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 云同步官方服务器地址；未设置时回退到内置默认值 */
  readonly VITE_SYNC_SERVER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
