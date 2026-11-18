import { env } from '../config/env';
import type { Session } from '../types';
import { challengeFrom, decodeJwt, randomString } from './pkce';

const SESSION_KEY = 'auth.session';
const PKCE_KEY = 'auth.pkce';

interface PkceState {
  verifier: string;
  state: string;
}

/** Respuesta de POST /oauth2/token (éxito o error OAuth). */
interface TokenResponse {
  access_token?: string;
  id_token?: string;
  scope?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

export class AuthError extends Error {
  code: string;

  constructor(code: string, description?: string | null) {
    super(description || code);
    this.code = code;
  }
}

/** Paso 1: redirige al Authorization Server (/oauth2/authorize) con PKCE. */
export async function startLogin(): Promise<void> {
  const verifier = randomString();
  const state = randomString(16);
  const saved: PkceState = { verifier, state };
  sessionStorage.setItem(PKCE_KEY, JSON.stringify(saved));

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.clientId,
    redirect_uri: env.redirectUri,
    scope: env.scopes,
    code_challenge: await challengeFrom(verifier),
    code_challenge_method: 'S256',
    state,
  });
  window.location.assign(`${env.authServerUrl}/oauth2/authorize?${params}`);
}

/** Paso 2: en /callback, cambia el code por el access token (POST /oauth2/token). */
export async function completeLogin(search: string): Promise<Session> {
  const q = new URLSearchParams(search);
  const oauthError = q.get('error');
  if (oauthError) throw new AuthError(oauthError, q.get('error_description'));

  const saved = JSON.parse(sessionStorage.getItem(PKCE_KEY) || 'null') as PkceState | null;
  sessionStorage.removeItem(PKCE_KEY);
  if (!saved || saved.state !== q.get('state')) {
    throw new AuthError('invalid_state', 'La respuesta no coincide con la solicitud de inicio de sesión.');
  }

  let res: Response;
  try {
    res = await fetch(env.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: q.get('code') ?? '',
        redirect_uri: env.redirectUri,
        client_id: env.clientId,
        code_verifier: saved.verifier,
      }),
    });
  } catch {
    throw new AuthError('network', 'No se pudo contactar al Authorization Server.');
  }

  const body = (await res.json().catch(() => ({}))) as TokenResponse;
  if (!res.ok || !body.access_token) {
    throw new AuthError(body.error || `http_${res.status}`, body.error_description);
  }

  const session: Session = {
    accessToken: body.access_token,
    idToken: body.id_token ?? null,
    scope: body.scope ?? '',
    expiresAt: Date.now() + (body.expires_in ?? 300) * 1000,
    user: decodeJwt(body.id_token || body.access_token),
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function loadSession(): Session | null {
  try {
    const s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null') as Session | null;
    return s && s.expiresAt > Date.now() ? s : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

/** URL para cerrar sesión también en el Authorization Server (OIDC RP-initiated logout). */
export function logoutUrl(idToken: string | null | undefined): string | null {
  if (!idToken) return null;
  const p = new URLSearchParams({ id_token_hint: idToken, post_logout_redirect_uri: env.postLogoutUri });
  return `${env.authServerUrl}/connect/logout?${p}`;
}
