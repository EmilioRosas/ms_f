import { apiFetch } from './httpClient';
import { env } from '../config/env';
import type { ServicioSocial, ServicioSocialListDto, StatusServicioSocial } from '../types';

const base = env.servicioSocialBase;

export const servicioSocialApi = {
  listar: () => apiFetch<ServicioSocial[]>(base),
  listarConAlumnos: () => apiFetch<ServicioSocialListDto[]>(`${base}/con-alumno`),
  buscar: (id: number) => apiFetch<ServicioSocial>(`${base}/${id}`),
  crear: (values: {
    alumnoId: number;
    institucion: string;
    programa: string;
    horasAcumuladas?: number;
    horasTotales?: number;
    estado?: string;
    fechaInicio?: string;
  }) =>
    apiFetch<ServicioSocial>(base, {
      method: 'POST',
      body: values,
    }),
  actualizar: (id: number, values: Partial<ServicioSocial>) =>
    apiFetch<ServicioSocial>(`${base}/${id}`, {
      method: 'PUT',
      body: values,
    }),
  eliminar: (id: number) =>
    apiFetch(`${base}/${id}`, {
      method: 'DELETE',
    }),
  obtenerStatusPorAlumno: (alumnoId: number) =>
    apiFetch<StatusServicioSocial>(`${base}/alumno/${alumnoId}`),
};
