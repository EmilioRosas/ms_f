import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { JwtClaims, Session } from '../types';
import { clearSession, completeLogin, loadSession, logoutUrl, startLogin } from './authService';

interface AuthValue {
  session: Session | null;
  user: JwtClaims | null;
  isAuthenticated: boolean;
  /** true si un 401 cerró la sesión */
  expired: boolean;
  login: () => Promise<void>;
  finishLogin: (search: string) => Promise<Session>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [expired, setExpired] = useState(false);

  // httpClient emite este evento cuando un microservicio responde 401.
  useEffect(() => {
    const onExpired = () => {
      clearSession();
      setSession(null);
      setExpired(true);
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const finishLogin = useCallback(async (search: string) => {
    const s = await completeLogin(search);
    setSession(s);
    setExpired(false);
    return s;
  }, []);

  const logout = useCallback(() => {
    const url = logoutUrl(session?.idToken);
    clearSession();
    setSession(null);
    if (url) window.location.assign(url);
  }, [session]);

  const value = useMemo<AuthValue>(
    () => ({ session, user: session?.user ?? null, isAuthenticated: !!session, expired, login: startLogin, finishLogin, logout }),
    [session, expired, finishLogin, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
