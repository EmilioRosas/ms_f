import { apiFetch } from './httpClient';
import { env } from '../config/env';
import type { Grupo, GrupoDetalle } from '../types';

const base = env.gruposBase;

export const grupoApi = {
  detalleTodos: () => apiFetch<GrupoDetalle[]>(`${base}/detalle`),
  crear: (values: Record<string, unknown>) => apiFetch<Grupo>(base, { method: 'POST', body: values }),
  actualizar: (id: number, values: Record<string, unknown>) => apiFetch<Grupo>(`${base}/${id}`, { method: 'PUT', body: values }),
  activar: (id: number) => apiFetch<Grupo>(`${base}/${id}/activar`, { method: 'PATCH' }),
  desactivar: (id: number) => apiFetch<Grupo>(`${base}/${id}/desactivar`, { method: 'PATCH' }),
};
