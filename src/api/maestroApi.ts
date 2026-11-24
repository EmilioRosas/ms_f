import { apiFetch } from './httpClient';
import { env } from '../config/env';
import type { Maestro, MaestroDetalle, OpcionMaestro } from '../types';

const base = env.maestrosBase;

export const maestroApi = {
  listar: () => apiFetch<Maestro[]>(base),
  detalleTodos: () => apiFetch<MaestroDetalle[]>(`${base}/detalle`),
  crear: (values: Record<string, unknown>) => apiFetch<Maestro>(base, { method: 'POST', body: values }),
  actualizar: (id: number, values: Record<string, unknown>) => apiFetch<Maestro>(`${base}/${id}`, { method: 'PUT', body: values }),
  activar: (id: number) => apiFetch<Maestro>(`${base}/${id}/activar`, { method: 'PATCH' }),
  desactivar: (id: number) => apiFetch<Maestro>(`${base}/${id}/desactivar`, { method: 'PATCH' }),
  opciones: () => apiFetch<OpcionMaestro[]>(`${base}/opciones`),
};
