import CrudScreen from '../../components/crud/CrudScreen';
import { msaApi } from '../../api/msaApi';

// MS-A · /api/entity-a → { id, nombreA }. Búsqueda múltiple con POST /by-ids.
export default function EntityAPage() {
  return (
    <CrudScreen
      api={msaApi}
      field="nombreA"
      prefix="msa"
      title="Entidad A"
      serviceName="Entidad A"
      placeholder="Ej. Elemento A1"
    />
  );
}
