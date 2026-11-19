import { apiFetch } from './httpClient';
import { env } from '../config/env';
import type { CrudApi, Division } from '../types';

// MS-A · localhost:8081 · /api/entity-a   →  División { id, nombre, descripcion, estado }
// Al crear/editar solo se envían { nombre, descripcion }: `estado` queda activo por defecto.
const base = env.msaBase;

export const msaApi = {
  listar: () => apiFetch<Division[]>(base),
  buscar: (id) => apiFetch<Division>(`${base}/${id}`),
  crear: (values) => apiFetch<Division>(base, { method: 'POST', body: values }),
  actualizar: (id, values) => apiFetch<Division>(`${base}/${id}`, { method: 'PUT', body: values }),
  eliminar: (id) => apiFetch(`${base}/${id}`, { method: 'DELETE' }),
  porIds: (ids) => apiFetch<Division[]>(`${base}/by-ids`, { method: 'POST', body: ids }),
} satisfies CrudApi<Division>;
