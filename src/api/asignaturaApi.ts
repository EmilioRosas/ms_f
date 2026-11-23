import { apiFetch } from './httpClient';
import { env } from '../config/env';
import type { Asignatura } from '../types';

// MS-B · localhost:8082 · /api/b → Carrera { id, nombre, descripcion, intensiva, estado, publica, entityAId }
// Al crear/editar se envía { nombre, descripcion, intensiva, entityAId }: `estado` y `publica` quedan en su valor por defecto (true).
const base = env.asignaturasBase;

export const asignaturaApi = {
    listar: () => apiFetch<Asignatura[]>(base),
    buscar: (id: number) => apiFetch<Asignatura>(`${base}/${id}`),
    crear: (values: Record<string, unknown>) => apiFetch<Asignatura>(base, { method: 'POST', body: values }),
    actualizar: (id: number, values: Record<string, unknown>) => apiFetch<Asignatura>(`${base}/${id}`, { method: 'PUT', body: values }),
    eliminar: (id: number) => apiFetch(`${base}/${id}`, { method: 'DELETE' }),
};
