/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_SERVER_URL?: string;
  readonly VITE_CLIENT_ID?: string;
  readonly VITE_REDIRECT_URI?: string;
  readonly VITE_POST_LOGOUT_URI?: string;
  readonly VITE_SCOPES?: string;
  readonly VITE_TOKEN_ENDPOINT?: string;
  readonly VITE_MSA_BASE?: string;
  readonly VITE_MSB_BASE?: string;
  readonly VITE_GATEWAY_URL?: string;
  readonly VITE_MSA_URL?: string;
  readonly VITE_MSB_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
