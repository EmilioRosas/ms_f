import { loadSession } from '../auth/authService';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Mensaje legible de cualquier valor lanzado. */
export function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

interface SpringError {
  message?: string;
  error?: string;
}

// Spring responde errores como JSON {status, error, message, trace...}.
// Nunca se muestra el trace: solo el mensaje legible.
async function errorMessage(res: Response): Promise<string> {
  const text = await res.text().catch(() => '');
  try {
    const body = JSON.parse(text) as SpringError;
    if (body.message) return body.message;
    if (body.error) return `${body.error} (${res.status})`;
  } catch {
    if (text && text.length < 200 && !text.includes('<html')) return text;
  }
  // El proxy de Vite responde 500 sin cuerpo cuando el gateway (:8080) está apagado.
  if (res.status >= 500) return 'El servicio no responde. Revisa que el API Gateway y los microservicios estén encendidos.';
  return `Error ${res.status}`;
}

interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * fetch con el Bearer token del Authorization Server.
 * Las rutas son relativas (/api/entity-a, /api/b, /api/alumno, /api/asignaturas) y pasan por el proxy de Vite.
 */
export async function apiFetch<T = unknown>(path: string, { method = 'GET', body, headers = {} }: ApiFetchOptions = {}): Promise<T> {
  const session = loadSession();
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(session && { Authorization: `Bearer ${session.accessToken}` }),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'No hay conexión con el API Gateway (:8080).');
  }

  if (res.status === 401) {
    window.dispatchEvent(new Event('auth:expired'));
    throw new ApiError(401, 'La sesión expiró o el token no es válido.');
  }
  if (!res.ok) throw new ApiError(res.status, await errorMessage(res));

  const type = res.headers.get('content-type') || '';
  if (type.includes('application/json')) {
    return res.json() as Promise<T>;
  }

  const text = await res.text();
  if (text.startsWith('<!doctype') || text.startsWith('<html') || text.includes('<html')) {
    throw new ApiError(res.status, 'Ruta no encontrada en el API Gateway o proxy de Vite (se recibió HTML en lugar de JSON).');
  }
  return text as unknown as T;
}
