import CrudScreen from '../../components/crud/CrudScreen';
import { msbApi } from '../../api/msbApi';
import type { CrudApi, EntityB } from '../../types';

// MS-B · /api/b → { id, nombreB }. Sin /by-ids: la búsqueda múltiple
// consulta GET /api/b/{id} por cada ID (ver useCrudResource).
// Se pasa sin `conA`/`porIds` para que el hook use buscar() por ID.
const api: CrudApi<EntityB> = {
  listar: msbApi.listar,
  buscar: msbApi.buscar,
  crear: msbApi.crear,
  actualizar: msbApi.actualizar,
  eliminar: msbApi.eliminar,
};

export default function EntityBPage() {
  return (
    <CrudScreen
      api={api}
      field="nombreB"
      prefix="msb"
      title="Entidad B"
      serviceName="Entidad B"
      placeholder="Ej. Elemento B1"
    />
  );
}
