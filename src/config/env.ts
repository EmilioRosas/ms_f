const e = import.meta.env;

export const env = {
  authServerUrl: e.VITE_AUTH_SERVER_URL ?? 'http://localhost:9000',
  clientId: e.VITE_CLIENT_ID ?? 'frontend-client',
  redirectUri: e.VITE_REDIRECT_URI ?? 'http://localhost:3000/callback',
  postLogoutUri: e.VITE_POST_LOGOUT_URI ?? 'http://localhost:3000/login',
  scopes: e.VITE_SCOPES ?? 'openid profile read write',
  tokenEndpoint: e.VITE_TOKEN_ENDPOINT ?? '/oauth2/token',
  msaBase: e.VITE_MSA_BASE ?? '/api/entity-a',
  msbBase: e.VITE_MSB_BASE ?? '/api/b',
  asignaturasBase: e.VITE_ASIGNATURAS_BASE ?? '/api/asignaturas',
  gatewayUrl: e.VITE_GATEWAY_URL ?? 'http://localhost:8080',
  msaUrl: e.VITE_MSA_URL ?? 'http://localhost:8081',
  msbUrl: e.VITE_MSB_URL ?? 'http://localhost:8082',
} as const;
