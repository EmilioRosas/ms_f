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

/** MS-A · /api/entity-a */
export interface EntityA {
  id: number;
  nombreA: string;
}

/** MS-B · /api/b */
export interface EntityB {
  id: number;
  nombreB: string;
}

/** MS-B · /api/b/con-a (OpenFeign → MS-A) */
export interface EntityBConA {
  id: number;
  nombreB: string;
  nombreA: string | null;
}

/** Operaciones que necesita la pantalla CRUD genérica. */
export interface CrudApi<T extends { id: number }> {
  listar: () => Promise<T[]>;
  buscar: (id: number) => Promise<T>;
  crear: (value: string) => Promise<T>;
  actualizar: (id: number, value: string) => Promise<T>;
  eliminar: (id: number) => Promise<unknown>;
  porIds?: (ids: number[]) => Promise<T[]>;
}

export type LoadStatus = 'loading' | 'ready' | 'error';
