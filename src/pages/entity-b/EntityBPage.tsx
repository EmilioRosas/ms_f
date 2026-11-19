import { useEffect, useState } from 'react';
import CrudScreen, { type FieldDef } from '../../components/crud/CrudScreen';
import { msaApi } from '../../api/msaApi';
import { msbApi } from '../../api/msbApi';
import { errorText } from '../../api/httpClient';
import type { CrudApi, Carrera, Division } from '../../types';

// MS-B · /api/b → Carrera. Sin /by-ids: la búsqueda múltiple consulta GET /api/b/{id}
// por cada ID (ver useCrudResource). Cada carrera puede pertenecer a una División (entityAId, opcional).
const api: CrudApi<Carrera> = {
  listar: msbApi.listar,
  buscar: msbApi.buscar,
  crear: msbApi.crear,
  actualizar: msbApi.actualizar,
  eliminar: msbApi.eliminar,
};

export default function EntityBPage() {
  const [divisiones, setDivisiones] = useState<Division[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    msaApi.listar().then(setDivisiones).catch((e: unknown) => setError(errorText(e)));
  }, []);

  const fields: FieldDef[] = [
    { key: 'nombre', label: 'Nombre', kind: 'text', max: 100, placeholder: 'Ej. Ingeniería en Software' },
    { key: 'descripcion', label: 'Descripción', kind: 'text', max: 200, placeholder: 'Descripción de la carrera' },
    { key: 'intensiva', label: 'Intensiva', kind: 'checkbox' },
    {
      key: 'entityAId',
      label: 'División',
      kind: 'select',
      optional: true,
      options: divisiones.map((d) => ({ value: d.id, label: d.nombre, hidden: !d.estado })),
    },
  ];

  return (
    <CrudScreen
      api={api}
      fields={fields}
      prefix="msb"
      title="Carreras"
      serviceName="Carreras"
      notice={error ? `No se pudieron cargar las divisiones: ${error}` : undefined}
    />
  );
}
