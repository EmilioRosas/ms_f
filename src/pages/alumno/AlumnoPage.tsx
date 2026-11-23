import { useEffect, useState } from 'react';
import CrudScreen, { type FieldDef } from '../../components/crud/CrudScreen';
import { asignaturaApi } from './../../api/asignaturaApi';
import { alumnoApi } from '../../api/alumnoApi';
import { errorText } from '../../api/httpClient';
import type { CrudApi, Alumno, Asignatura } from '../../types';

// Alumnos · /api/alumno → Alumnos. Sin /by-ids: la búsqueda múltiple consulta GET /api/alumno/{id}
// por cada ID (ver useCrudResource). Cada alumno puede pertenecer a una Asignatura (entityAsignaturaId, opcional).
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
        { key: 'nombreAlumno', label: 'Nombre', kind: 'text', max: 100, placeholder: 'Ej. Jhon' },
        { key: 'matricula', label: 'Matricula', kind: 'text', max: 50, placeholder: 'Matricula escolar' },
        { key: 'estadoAlumno', label: 'Estado', kind: 'checkbox' },
        {
            key: 'entityAsignaturaId',
            label: 'Asignatura',
            kind: 'select',
            optional: true,
            options: asignaturas.map((d) => ({ value: d.id, label: d.nombreAsignatura, hidden: !d.estadoAsignatura })),
        },
    ];

    return (
        <CrudScreen
            api={api}
            fields={fields}
            prefix="alumno"
            title="Alumnos"
            serviceName="Alumnos"
            notice={error ? `No se pudieron cargar los Alumnos: ${error}` : undefined}
        />
    );
}
