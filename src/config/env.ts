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
  alumnosBase: e.VITE_ALUMNOS_BASE ?? '/api/alumno',
  asignaturasBase: e.VITE_ASIGNATURAS_BASE ?? '/api/asignaturas',
  servicioSocialBase: e.VITE_SERVICIO_SOCIAL_BASE ?? '/api/servicio-social',
  maestrosBase: e.VITE_MAESTROS_BASE ?? '/api/maestros',
  gruposBase: e.VITE_GRUPOS_BASE ?? '/api/grupos',
  gatewayUrl: e.VITE_GATEWAY_URL ?? 'http://localhost:8080',
  msaUrl: e.VITE_MSA_URL ?? 'http://localhost:8081',
  msbUrl: e.VITE_MSB_URL ?? 'http://localhost:8082',
  alumnosUrl: e.VITE_ALUMNOS_URL ?? 'http://localhost:8083',
  asignaturasUrl: e.VITE_ASIGNATURAS_URL ?? 'http://localhost:8084',
  servicioSocialUrl: e.VITE_SERVICIO_SOCIAL_URL ?? 'http://localhost:8085',
} as const;
