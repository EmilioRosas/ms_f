import { useCallback, useEffect, useState } from 'react';
import { errorText } from '../api/httpClient';
import type { CrudApi, LoadStatus } from '../types';

/**
 * Estado y operaciones CRUD para un recurso { id, <field> }.
 * `api` debe tener listar, crear, actualizar, eliminar y buscar; porIds es opcional.
 * Reutilizable por MS-A (Divisiones), MS-B (Carreras) y Alumnos.
 */
export function useCrudResource<T extends { id: number }>(api: CrudApi<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<number[] | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    setFilter(null);
    try {
      const data = await api.listar();
      setItems(Array.isArray(data) ? data : []);
      setStatus('ready');
    } catch (e) {
      setError(errorText(e));
      setStatus('error');
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (values: Record<string, unknown>) => {
    const created = await api.crear(values);
    setItems((list) => [...list, created]);
    return created;
  };

  const update = async (id: number, values: Record<string, unknown>) => {
    const updated = await api.actualizar(id, values);
    setItems((list) => list.map((it) => (it.id === id ? updated : it)));
    return updated;
  };

  const remove = async (id: number) => {
    await api.eliminar(id);
    setItems((list) => list.filter((it) => it.id !== id));
  };

  /** Busca por uno o varios IDs. Devuelve los IDs que no existen. */
  const search = async (ids: number[]): Promise<number[]> => {
    setStatus('loading');
    setError(null);
    try {
      let found: T[];
      if (api.porIds) {
        found = await api.porIds(ids);
      } else {
        const results = await Promise.allSettled(ids.map((id) => api.buscar(id)));
        found = results
          .filter((r): r is PromiseFulfilledResult<Awaited<T>> => r.status === 'fulfilled')
          .map((r) => r.value);
      }
      const safeFound = Array.isArray(found) ? found : [];
      setItems(safeFound);
      setFilter(ids);
      setStatus('ready');
      const foundIds = new Set(safeFound.map((f) => f.id));
      return ids.filter((id) => !foundIds.has(id));
    } catch (e) {
      setError(errorText(e));
      setStatus('error');
      return [];
    }
  };

  return { items, status, error, filter, load, create, update, remove, search };
}
