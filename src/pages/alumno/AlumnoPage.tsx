import { useEffect, useState } from 'react';
import CrudScreen, { type FieldDef } from '../../components/crud/CrudScreen';
import { asignaturaApi } from '../../api/asignaturaApi';
import { alumnoApi } from '../../api/alumnoApi';
import { errorText } from '../../api/httpClient';
import type { CrudApi, Alumno, Asignatura } from '../../types';

// Alumnos · /api/alumno → Alumnos. Cada alumno puede pertenecer a una Asignatura (entityAsignaturaId, opcional).
const api: CrudApi<Alumno> = {
  listar: alumnoApi.listar,
  buscar: alumnoApi.buscar,
  crear: alumnoApi.crear,
  actualizar: alumnoApi.actualizar,
  eliminar: alumnoApi.eliminar,
};

export default function AlumnoPage() {
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    asignaturaApi.listar().then(setAsignaturas).catch((e: unknown) => setError(errorText(e)));
  }, []);

  const fields: FieldDef[] = [
    { key: 'nombreAlumno', label: 'Nombre', kind: 'text', max: 100, placeholder: 'Ej. Juan Pérez' },
    { key: 'matricula', label: 'Matrícula', kind: 'text', max: 50, placeholder: 'Ej. 2023171001' },
    {
      key: 'entityAsignaturaId',
      label: 'Asignatura',
      kind: 'select',
      optional: true,
      options: asignaturas.map((d) => ({
        value: d.id,
        label: d.nombre ?? d.nombreAsignatura ?? `Asignatura #${d.id}`,
        hidden: d.estadoAsignatura !== undefined ? !d.estadoAsignatura : !d.estado,
      })),
    },
  ];

  return (
    <CrudScreen
      api={api}
      fields={fields}
      prefix="alumno"
      title="Alumnos"
      serviceName="Alumnos"
      notice={error ? `No se pudieron cargar las asignaturas: ${error}` : undefined}
    />
  );
}
