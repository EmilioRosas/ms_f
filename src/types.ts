// Tipos compartidos del frontend.

/** Claims del JWT que emite el Authorization Server (solo los que usa la UI). */
export interface JwtClaims {
  sub?: string;
  iss?: string;
  iat?: number;
  exp?: number;
  [claim: string]: unknown;
}

/** Sesión guardada en sessionStorage tras el intercambio del code. */
export interface Session {
  accessToken: string;
  idToken: string | null;
  scope: string;
  expiresAt: number;
  user: JwtClaims | null;
}

/** MS-A · /api/entity-a — División. (`publica` no se usa en el front.) */
export interface Division {
  id: number;
  nombre: string;
  descripcion: string;
  /** Activa por defecto: el front nunca lo envía. */
  estado: boolean;
}

/** MS-B · /api/b — Carrera. Pertenece a una División (una división, muchas carreras). */
export interface Carrera {
  id: number;
  nombre: string;
  descripcion: string;
  intensiva: boolean;
  estado: boolean;
  /** ID de la división (MS-A); null = sin división. */
  entityAId: number | null;
}

/** Microservicio Alumnos · /api/alumno */
export interface Alumno {
  id: number;
  nombreAlumno: string;
  matricula: string;
  estadoAlumno: boolean;
  estado?: boolean;
  nombre?: string;
  /** ID de la asignatura (Asignatura); null = sin asignatura. */
  entityAsignaturaId: number | null;
  asignaturaId?: number | null;
}

/** Microservicio Asignaturas · /api/asignaturas */
export interface Asignatura {
  id: number;
  nombre: string;
  nombreAsignatura?: string;
  descripcion: string | null;
  estado: boolean;
  estadoAsignatura?: boolean;
  carreraId: number;
  nombreCarrera?: string | null;
}

/** MS-B · /api/b/con-a (OpenFeign → MS-A) */
export interface EntityBConA {
  id: number;
  nombreB: string;
  entityAId: number | null;
  nombreA: string | null;
}

export interface EntityAlumnoConAsignatura {
  id: number;
  nombreAlumno: string;
  entityAsignaturaId: number | null;
  nombreAsignatura: string | null;
}

/** Microservicio Servicio Social · /api/servicio-social */
export interface ServicioSocial {
  id: number;
  alumnoId: number;
  institucion: string;
  programa: string;
  horasAcumuladas: number;
  horasTotales: number;
  estado: string;
  fechaInicio: string;
  nombreAlumno?: string;
  matricula?: string;
}

export interface ServicioSocialListDto extends ServicioSocial {
  nombreAlumno: string;
  matricula: string;
}

export interface StatusServicioSocial {
  alumnoId: number;
  servicioSocialId: number | null;
  nombreAlumno: string;
  matricula: string;
  tieneServicio: boolean;
  institucion: string | null;
  programa: string | null;
  horasAcumuladas: number;
  horasTotales: number;
  porcentajeAvance: number;
  estado: string;
  fechaInicio: string | null;
  mensaje: string;
}

/** Operaciones que necesita la pantalla CRUD genérica. */
export interface CrudApi<T extends { id: number }> {
  listar: () => Promise<T[]>;
  buscar: (id: number) => Promise<T>;
  /** `values` = campos del formulario (sin `estado`). */
  crear: (values: Record<string, unknown>) => Promise<T>;
  actualizar: (id: number, values: Record<string, unknown>) => Promise<T>;
  eliminar: (id: number) => Promise<unknown>;
  porIds?: (ids: number[]) => Promise<T[]>;
}

export type LoadStatus = 'loading' | 'ready' | 'error';
