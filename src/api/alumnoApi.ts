import { apiFetch } from './httpClient';
import { env } from '../config/env';
import type { Alumno, EntityAlumnoConAsignatura } from '../types';

// ALUMNOS · localhost:8083 · /api/alumno → Alumnos { id, nombreAlumno, matricula, estadoAlumno, entityAsignaturaId }
const base = env.alumnosBase;

export const alumnoApi = {
  listar: () => apiFetch<Alumno[]>(base),
  buscar: (id: number) => apiFetch<Alumno>(`${base}/${id}`),
  crear: (values: Record<string, unknown>) => apiFetch<Alumno>(base, { method: 'POST', body: values }),
  actualizar: (id: number, values: Record<string, unknown>) => apiFetch<Alumno>(`${base}/${id}`, { method: 'PUT', body: values }),
  activar: (id: number) => apiFetch<Alumno>(`${base}/${id}/activar`, { method: 'PATCH' }),
  desactivar: (id: number) => apiFetch<Alumno>(`${base}/${id}/desactivar`, { method: 'PATCH' }),
  eliminar: (id: number) => apiFetch(`${base}/${id}`, { method: 'DELETE' }),
  conAsignatura: () => apiFetch<EntityAlumnoConAsignatura[]>(`${base}/con-asignatura`),
  insertarIniciales: () => apiFetch<Alumno[]>(`${base}/insertar-alumnos-iniciales`, { method: 'POST' }),
};
