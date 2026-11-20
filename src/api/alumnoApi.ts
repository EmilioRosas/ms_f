import { apiFetch } from './httpClient';
import { env } from '../config/env';
import type { Alumno, EntityAlumnoConAsignatura } from '../types';

// ALUMNOS · localhost:8083 · /api/alumno → Alumnos { id, nombreAlumno, matricula, estadoAlumno, entityAsignaturaId }
// Al crear/editar se envía { nombreAlumno, matricula, entityAsignaturaId }: `estado` se queda en su valor por defecto (true).
const base = env.alumnosBase;

export const alumnoApi = {
    listar: () => apiFetch<Alumno[]>(base),
    buscar: (id: number) => apiFetch<Alumno>(`${base}/${id}`),
    crear: (values: Record<string, unknown>) => apiFetch<Alumno>(base, { method: 'POST', body: values }),
    actualizar: (id: number, values: Record<string, unknown>) => apiFetch<Alumno>(`${base}/${id}`, { method: 'PUT', body: values }),
    eliminar: (id: number) => apiFetch(`${base}/${id}`, { method: 'DELETE' }),
    conAsignatura: () => apiFetch<EntityAlumnoConAsignatura[]>(`${base}/con-asignatura`),
};
