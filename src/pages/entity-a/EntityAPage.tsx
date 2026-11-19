import CrudScreen, { type FieldDef } from '../../components/crud/CrudScreen';
import { msaApi } from '../../api/msaApi';

const FIELDS: FieldDef[] = [
  { key: 'nombre', label: 'Nombre', kind: 'text', max: 100, placeholder: 'Ej. División de Tecnologías' },
  { key: 'descripcion', label: 'Descripción', kind: 'text', max: 200, placeholder: 'Descripción de la división' },
];

// MS-A · /api/entity-a → División { id, nombre, descripcion, estado }. Búsqueda múltiple con POST /by-ids.
export default function EntityAPage() {
  return <CrudScreen api={msaApi} fields={FIELDS} prefix="msa" title="Divisiones" serviceName="Divisiones" />;
}
