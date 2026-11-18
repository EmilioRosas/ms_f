import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/Icon';
import { msbApi } from '../../api/msbApi';
import { errorText } from '../../api/httpClient';
import type { EntityBConA, LoadStatus } from '../../types';
import '../../styles/crud.css';
import './CombinedPage.css';

// MS-B responde este texto cuando un registro B no tiene relación con A
// o MS-A no devolvió el dato (ver servicio.findAll en ms-b).
const NO_A = 'Sin dato de MSA';

type FilterId = 'all' | 'with' | 'without';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'with', label: 'Con A' },
  { id: 'without', label: 'Sin A' },
];

export default function CombinedPage() {
  const [items, setItems] = useState<EntityBConA[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<FilterId>('all');

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      setItems(await msbApi.conA());
      setStatus('ready');
    } catch (e) {
      setError(errorText(e));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const withA = useMemo(() => items.filter((i) => i.nombreA && i.nombreA !== NO_A), [items]);
  const counts: Record<FilterId, number> = { all: items.length, with: withA.length, without: items.length - withA.length };
  const visible = view === 'all' ? items : view === 'with' ? withA : items.filter((i) => !withA.includes(i));

  // return (
  //   <section className="crud" aria-labelledby="combo-title">
  //     <header className="crud__head">
  //       <div className="crud__heading">
  //         <div className="crud__title">
  //           <h1 id="combo-title">B con A</h1>
  //           {status === 'ready' && (
  //             <span className="crud__count">
  //               {items.length} {items.length === 1 ? 'registro' : 'registros'}
  //             </span>
  //           )}
  //         </div>
  //       </div>
  //       <button type="button" className="btn btn--ghost btn--sm" onClick={load} disabled={status === 'loading'}>
  //         <Icon name="refresh" size={16} />
  //         Recargar
  //       </button>
  //     </header>

  //     <div className="crud__panel">
  //       {status === 'ready' && items.length > 0 && (
  //         <div className="combo__bar">
  //           <div className="segmented" role="radiogroup" aria-label="Filtrar por dato de MS-A">
  //             {FILTERS.map((f) => (
  //               <button
  //                 key={f.id}
  //                 type="button"
  //                 role="radio"
  //                 aria-checked={view === f.id}
  //                 className={view === f.id ? 'is-active' : undefined}
  //                 onClick={() => setView(f.id)}
  //               >
  //                 {f.label}
  //                 <span className="segmented__count">{counts[f.id]}</span>
  //               </button>
  //             ))}
  //           </div>
  //         </div>
  //       )}

  //       {status === 'error' && (
  //         <div className="crud__state" role="alert">
  //           <p className="crud__state-title">No se pudieron cargar los registros</p>
  //           <p>{error}</p>
  //           <button type="button" className="btn btn--ghost btn--sm" onClick={load}>
  //             <Icon name="refresh" size={16} /> Reintentar
  //           </button>
  //         </div>
  //       )}

  //       {status === 'ready' && items.length === 0 && (
  //         <div className="crud__state">
  //           <p className="crud__state-title">Aún no hay registros en Entidad B</p>
  //           <Link className="btn btn--ghost btn--sm" to="/entity-b">
  //             <Icon name="plus" size={16} /> Ir a Entidad B
  //           </Link>
  //         </div>
  //       )}

  //       {status === 'ready' && items.length > 0 && visible.length === 0 && (
  //         <div className="crud__state">
  //           <p className="crud__state-title">Nada que mostrar con este filtro</p>
  //           <button type="button" className="btn btn--link" onClick={() => setView('all')}>Ver todos</button>
  //         </div>
  //       )}

  //       {(status === 'loading' || visible.length > 0) && status !== 'error' && (
  //         <table className="crud__table" aria-busy={status === 'loading'}>
  //           <thead>
  //             <tr>
  //               <th scope="col">ID B</th>
  //               <th scope="col">Nombre B</th>
  //               <th scope="col" className="combo__arrow-col"><span className="sr-only">relación</span></th>
  //               <th scope="col">Nombre A</th>
  //             </tr>
  //           </thead>
  //           <tbody>
  //             {status === 'loading'
  //               ? [0, 1, 2, 3].map((i) => (
  //                   <tr key={i} aria-hidden="true">
  //                     <td className="crud__id"><div className="skel" style={{ width: 28 }} /></td>
  //                     <td><div className="skel" style={{ width: `${50 + i * 10}%` }} /></td>
  //                     <td className="combo__arrow-col" />
  //                     <td><div className="skel" style={{ width: `${40 + i * 8}%` }} /></td>
  //                   </tr>
  //                 ))
  //               : visible.map((item) => {
  //                   const hasA = item.nombreA && item.nombreA !== NO_A;
  //                   return (
  //                     <tr key={item.id}>
  //                       <td className="crud__id">#{item.id}</td>
  //                       <td className="crud__name">{item.nombreB}</td>
  //                       <td className="combo__arrow-col" aria-hidden="true">→</td>
  //                       <td className="crud__name">
  //                         {hasA ? (
  //                           <span className="combo__a">{item.nombreA}</span>
  //                         ) : (
  //                           <span className="combo__none">Sin dato de A</span>
  //                         )}
  //                       </td>
  //                     </tr>
  //                   );
  //                 })}
  //           </tbody>
  //         </table>
  //       )}
  //     </div>
  //   </section>
  // );
}
