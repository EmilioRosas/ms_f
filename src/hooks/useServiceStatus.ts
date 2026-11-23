import { useCallback, useEffect, useState } from 'react';
import { env } from '../config/env';

// Ping "no-cors": no lee la respuesta, solo distingue servicio arriba (cualquier
// respuesta, incluido 401) de servicio caído (error de red).
const SERVICES = {
  auth: `${env.authServerUrl}/.well-known/openid-configuration`,
  gateway: `${env.gatewayUrl}/`,
  msa: `${env.msaUrl}/api/entity-a`,
  msb: `${env.msbUrl}/api/b`,
  alumno: `${env.alumnosUrl}/api/alumno`,
};

export type ServiceKey = keyof typeof SERVICES;
export type ServiceState = 'up' | 'down' | 'checking';
export type ServiceStatusMap = Record<ServiceKey, ServiceState>;

async function ping(url: string): Promise<ServiceState> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 3000);
  try {
    await fetch(url, { mode: 'no-cors', cache: 'no-store', signal: ctrl.signal });
    return 'up';
  } catch {
    return 'down';
  } finally {
    clearTimeout(t);
  }
}

const KEYS = Object.keys(SERVICES) as ServiceKey[];
const ALL_CHECKING = Object.fromEntries(KEYS.map((k) => [k, 'checking'])) as ServiceStatusMap;

export function useServiceStatus() {
  const [status, setStatus] = useState<ServiceStatusMap>(ALL_CHECKING);

  const refresh = useCallback(async () => {
    setStatus(ALL_CHECKING);
    const entries = await Promise.all(KEYS.map(async (k) => [k, await ping(SERVICES[k])] as const));
    setStatus(Object.fromEntries(entries) as ServiceStatusMap);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, refresh };
}
