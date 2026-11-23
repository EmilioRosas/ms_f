import { apiFetch } from './httpClient';
import { env } from '../config/env';
import type { Asignatura } from '../types';
const base = env.asignaturasBase;
export const asignaturasApi = {
  listar: () => apiFetch<Asignatura[]>(base),
  buscar: (id: number) =>
    apiFetch<Asignatura>(`${base}/${id}`),
  crear: (values: {
    nombre: string;
    descripcion: string;
    carreraId: number;
  }) =>
    apiFetch<Asignatura>(base, {
      method: 'POST',
      body: values,
    }),
  actualizar: (
    id: number,
    values: {
      nombre: string;
      descripcion: string;
      carreraId: number;
    },
  ) =>
    apiFetch<Asignatura>(`${base}/${id}`, {
      method: 'PUT',
      body: values,
    }),
  activar: (id: number) =>
    apiFetch<Asignatura>(`${base}/${id}/activar`, {
      method: 'PATCH',
    }),
  desactivar: (id: number) =>
    apiFetch<Asignatura>(`${base}/${id}/desactivar`, {
      method: 'PATCH',
    }),
};