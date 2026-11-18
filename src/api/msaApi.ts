import { apiFetch } from './httpClient';
import { env } from '../config/env';
import type { CrudApi, EntityA } from '../types';

// MS-A · localhost:8081 · /api/entity-a   →  { id, nombreA }
const base = env.msaBase;

export const msaApi = {
  listar: () => apiFetch<EntityA[]>(base),
  buscar: (id) => apiFetch<EntityA>(`${base}/${id}`),
  crear: (nombreA) => apiFetch<EntityA>(base, { method: 'POST', body: { nombreA } }),
  actualizar: (id, nombreA) => apiFetch<EntityA>(`${base}/${id}`, { method: 'PUT', body: { nombreA } }),
  eliminar: (id) => apiFetch(`${base}/${id}`, { method: 'DELETE' }),
  porIds: (ids) => apiFetch<EntityA[]>(`${base}/by-ids`, { method: 'POST', body: ids }),
} satisfies CrudApi<EntityA>;
