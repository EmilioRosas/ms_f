import { apiFetch } from './httpClient';
import { env } from '../config/env';
import type { Carrera, EntityBConA } from '../types';

// MS-B · localhost:8082 · /api/b → Carrera { id, nombre, descripcion, intensiva, estado, publica, entityAId }
// Al crear/editar se envía { nombre, descripcion, intensiva, entityAId }: `estado` y `publica` quedan en su valor por defecto (true).
const base = env.msbBase;

export const msbApi = {
  listar: () => apiFetch<Carrera[]>(base),
  buscar: (id: number) => apiFetch<Carrera>(`${base}/${id}`),
  crear: (values: Record<string, unknown>) => apiFetch<Carrera>(base, { method: 'POST', body: values }),
  actualizar: (id: number, values: Record<string, unknown>) => apiFetch<Carrera>(`${base}/${id}`, { method: 'PUT', body: values }),
  eliminar: (id: number) => apiFetch(`${base}/${id}`, { method: 'DELETE' }),
  conA: () => apiFetch<EntityBConA[]>(`${base}/con-a`),
};
