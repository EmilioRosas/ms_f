import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { servicioSocialApi } from '../../api/servicioSocialApi';
import { alumnoApi } from '../../api/alumnoApi';
import { errorText } from '../../api/httpClient';
import Icon from '../../components/Icon';
import type { ServicioSocialListDto, Alumno } from '../../types';
import '../../styles/crud.css';
import './ServicioSocialPage.css';

type FormValues = {
  alumnoId: string;
  institucion: string;
  programa: string;
  horasAcumuladas: number;
  horasTotales: number;
  estado: string;
  fechaInicio: string;
};

interface Toast {
  kind: 'ok' | 'error';
  text: string;
  key: number;
}

const todayIso = () => new Date().toISOString().split('T')[0];

const EMPTY = (): FormValues => ({
  alumnoId: '',
  institucion: '',
  programa: '',
  horasAcumuladas: 0,
  horasTotales: 480,
  estado: 'NO LIBERADO',
  fechaInicio: todayIso(),
});

export default function ServicioSocialPage() {
  const [items, setItems] = useState<ServicioSocialListDto[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [alumnosNotice, setAlumnosNotice] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [modal, setModal] = useState<{ id: number | null } | null>(null);
  const [form, setForm] = useState<FormValues>(() => EMPTY());
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [filterText, setFilterText] = useState('');

  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (modal && !d.open) d.showModal();
    if (!modal && d.open) d.close();
  }, [modal]);

  const notify = (kind: Toast['kind'], text: string) => setToast({ kind, text, key: Date.now() });

  async function loadData() {
    setLoading(true);
    setLoadError(null);
    setAlumnosNotice(null);
    try {
      const [listaServicios, listaAlumnos] = await Promise.all([
        servicioSocialApi.listarConAlumnos(),
        alumnoApi.listar().catch((e: unknown) => {
          setAlumnosNotice(`No se pudieron cargar los alumnos: ${errorText(e)}`);
          return [] as Alumno[];
        }),
      ]);
      setItems(listaServicios);
      setAlumnos(listaAlumnos);
    } catch (e) {
      setLoadError(errorText(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function handleHorasChange(nuevasHoras: number) {
    const limpias = Math.max(0, nuevasHoras);
    const horasTotales = form.horasTotales || 480;
    let nuevoEstado = form.estado;
    if (limpias >= horasTotales) {
      nuevoEstado = 'LIBERADO';
    } else if (form.estado === 'LIBERADO') {
      nuevoEstado = limpias > 0 ? 'EN PROCESO' : 'NO LIBERADO';
    } else if (limpias === 0) {
      nuevoEstado = 'NO LIBERADO';
    } else if (form.estado.includes('NO') && limpias > 0) {
      nuevoEstado = 'EN PROCESO';
    }
    setForm((prev) => ({
      ...prev,
      horasAcumuladas: limpias,
      estado: nuevoEstado,
    }));
  }

  function handleHorasTotalesChange(nuevasTotales: number) {
    const totales = nuevasTotales > 0 ? nuevasTotales : 480;
    let nuevoEstado = form.estado;
    if (form.horasAcumuladas >= totales) {
      nuevoEstado = 'LIBERADO';
    } else if (form.estado === 'LIBERADO') {
      nuevoEstado = form.horasAcumuladas > 0 ? 'EN PROCESO' : 'NO LIBERADO';
    }
    setForm((prev) => ({
      ...prev,
      horasTotales: totales,
      estado: nuevoEstado,
    }));
  }

  function openCreate() {
    setConfirmId(null);
    setForm(EMPTY());
    setFormError(null);
    setModal({ id: null });
  }

  function openEdit(item: ServicioSocialListDto) {
    setConfirmId(null);
    const est = item.estado ? item.estado.replace(/_/g, ' ').toUpperCase() : 'NO LIBERADO';
    setForm({
      alumnoId: String(item.alumnoId),
      institucion: item.institucion ?? '',
      programa: item.programa ?? '',
      horasAcumuladas: item.horasAcumuladas ?? 0,
      horasTotales: item.horasTotales ?? 480,
      estado: est,
      fechaInicio: item.fechaInicio && /^\d{4}-\d{2}-\d{2}$/.test(item.fechaInicio) ? item.fechaInicio : todayIso(),
    });
    setFormError(null);
    setModal({ id: item.id });
  }

  function closeModal() {
    if (!saving) setModal(null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!modal) return;
    setFormError(null);

    const alumnoId = parseInt(form.alumnoId, 10);
    if (!alumnoId || alumnoId <= 0) {
      setFormError('Selecciona un alumno.');
      return;
    }
    if (!form.institucion.trim()) {
      setFormError('Escribe la institución receptora.');
      return;
    }
    if (!form.programa.trim()) {
      setFormError('Escribe el nombre del programa.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        alumnoId,
        institucion: form.institucion.trim(),
        programa: form.programa.trim(),
        horasAcumuladas: Math.max(0, Number(form.horasAcumuladas) || 0),
        horasTotales: Math.max(1, Number(form.horasTotales) || 480),
        estado: form.estado,
        fechaInicio: form.fechaInicio,
      };

      if (modal.id === null) {
        const created = await servicioSocialApi.crear(payload);
        notify('ok', `Registro #${created.id} agregado.`);
      } else {
        await servicioSocialApi.actualizar(modal.id, payload);
        notify('ok', `Registro #${modal.id} guardado.`);
      }
      setModal(null);
      await loadData();
    } catch (err) {
      setFormError(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete(id: number) {
    setBusyId(id);
    try {
      await servicioSocialApi.eliminar(id);
      setConfirmId(null);
      notify('ok', `Registro #${id} eliminado.`);
      await loadData();
    } catch (err) {
      notify('error', errorText(err));
    } finally {
      setBusyId(null);
    }
  }

  const rowKeys = (e: KeyboardEvent<HTMLTableRowElement>) => {
    if (e.key === 'Escape') setConfirmId(null);
  };

  // IDs de alumnos que ya tienen servicio social registrado
  const alumnosConServicioIds = useMemo(() => {
    return new Set(items.map((i) => i.alumnoId));
  }, [items]);

  // Filtrado por texto o por ID
  const filteredItems = useMemo(() => {
    const raw = filterText.trim();
    if (!raw) return items;
    const q = raw.toLowerCase();
    return items.filter(
      (i) =>
        String(i.id) === raw.replace(/^#/, '') ||
        i.nombreAlumno?.toLowerCase().includes(q) ||
        i.matricula?.toLowerCase().includes(q) ||
        i.institucion?.toLowerCase().includes(q) ||
        i.programa?.toLowerCase().includes(q) ||
        i.estado?.toLowerCase().includes(q),
    );
  }, [items, filterText]);

  return (
    <section className="crud" aria-labelledby="ss-title">
      <header className="crud__head">
        <div className="crud__heading">
          <div className="crud__title">
            <h1 id="ss-title">Servicio Social</h1>
            {!loading && !loadError && (
              <span className="crud__count">
                {items.length} {items.length === 1 ? 'registro' : 'registros'}
              </span>
            )}
          </div>
          <p className="muted">Administración y seguimiento de horas y liberación de Servicio Social.</p>
        </div>

        <div className="crud__head-actions">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => {
              setFilterText('');
              void loadData();
            }}
            disabled={loading}
          >
            <Icon name="refresh" size={16} />
            Recargar
          </button>
          <button type="button" className="btn btn--primary btn--sm" onClick={openCreate}>
            <Icon name="plus" size={16} />
            Nuevo
          </button>
        </div>
      </header>

      {alumnosNotice && (
        <div className="alert alert--warn" role="status">
          {alumnosNotice}
        </div>
      )}

      <div className="crud__panel">
        <div className="crud__toolbar" style={{ gridTemplateColumns: '1fr' }}>
          <div className="crud__form">
            <label htmlFor="ss-search">Buscar servicio social</label>
            <div className="crud__row">
              <input
                id="ss-search"
                type="search"
                className="input"
                placeholder="Buscar por ID, alumno, matrícula, institución o programa..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                autoComplete="off"
              />
              {filterText && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setFilterText('')}>
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        {loadError ? (
          <div className="crud__state" role="alert">
            <p className="crud__state-title">No se pudieron cargar los registros</p>
            <p>{loadError}</p>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => void loadData()}>
              <Icon name="refresh" size={16} /> Reintentar
            </button>
          </div>
        ) : !loading && filteredItems.length === 0 ? (
          <div className="crud__state">
            {filterText ? (
              <>
                <p className="crud__state-title">No hay registros que coincidan con la búsqueda</p>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setFilterText('')}>
                  Ver todos
                </button>
              </>
            ) : (
              <>
                <p className="crud__state-title">Aún no hay registros en Servicio Social</p>
                <button type="button" className="btn btn--ghost btn--sm" onClick={openCreate}>
                  <Icon name="plus" size={16} /> Agregar registro
                </button>
              </>
            )}
          </div>
        ) : (
          <table className="crud__table" aria-busy={loading}>
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Alumno</th>
                <th scope="col">Institución / Programa</th>
                <th scope="col">Avance</th>
                <th scope="col">Estado</th>
                <th scope="col" className="crud__actions">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [0, 1, 2, 3].map((i) => (
                    <tr key={i} aria-hidden="true">
                      <td className="crud__id">
                        <div className="skel" style={{ width: 28 }} />
                      </td>
                      {[0, 1, 2, 3].map((c) => (
                        <td key={c}>
                          <div className="skel" style={{ width: `${50 + ((i + c) % 3) * 15}%` }} />
                        </td>
                      ))}
                      <td className="crud__actions">
                        <div className="skel" style={{ width: 64 }} />
                      </td>
                    </tr>
                  ))
                : filteredItems.map((item) => {
                    const confirming = confirmId === item.id;
                    const busy = busyId === item.id;
                    const totales = item.horasTotales || 480;
                    const pct = Math.min(100, Math.round(((item.horasAcumuladas || 0) / totales) * 100));
                    const estNorm = (item.estado || '').replace(/_/g, ' ').toUpperCase();
                    const isLiberado = estNorm === 'LIBERADO';
                    const isNoLiberado = estNorm.includes('NO');

                    const badgeClass = isLiberado
                      ? 'ss__badge--done'
                      : isNoLiberado
                        ? 'ss__badge--cancel'
                        : 'ss__badge--process';

                    const fillClass = isLiberado
                      ? 'ss__progress-fill--done'
                      : isNoLiberado
                        ? 'ss__progress-fill--cancel'
                        : 'ss__progress-fill--process';

                    const alumnoLabel = item.nombreAlumno || `Alumno #${item.alumnoId}`;

                    return (
                      <tr key={item.id} className={confirming ? 'is-danger' : undefined} onKeyDown={rowKeys}>
                        <td className="crud__id">#{item.id}</td>

                        <td className="crud__name">
                          {confirming ? (
                            <span className="crud__confirm">
                              ¿Eliminar servicio social de <strong>{alumnoLabel}</strong>? No se puede deshacer.
                            </span>
                          ) : (
                            <>
                              <div>
                                <strong>{alumnoLabel}</strong>
                              </div>
                              {item.matricula && <div className="ss__sub mono">Mat: {item.matricula}</div>}
                            </>
                          )}
                        </td>

                        <td className="crud__name">
                          <div>{item.institucion || '—'}</div>
                          {item.programa && <div className="ss__sub">{item.programa}</div>}
                        </td>

                        <td>
                          <div className="ss__hours-head">
                            <span>
                              <strong>{item.horasAcumuladas}</strong> / {totales} hrs
                            </span>
                            <span className="ss__pct">{pct}%</span>
                          </div>
                          <div className="ss__progress-bar">
                            <div className={`ss__progress-fill ${fillClass}`} style={{ width: `${pct}%` }} />
                          </div>
                        </td>

                        <td>
                          <span className={`ss__badge ${badgeClass}`}>{estNorm || '—'}</span>
                          {item.fechaInicio && <div className="ss__sub">Inicio: {item.fechaInicio}</div>}
                        </td>

                        <td className="crud__actions">
                          <div className="crud__actions-inner">
                            {confirming ? (
                              <>
                                <button
                                  type="button"
                                  className="btn btn--danger btn--sm"
                                  onClick={() => void confirmDelete(item.id)}
                                  disabled={busy}
                                  autoFocus
                                >
                                  {busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="trash" size={16} />}
                                  Eliminar
                                </button>
                                <button
                                  type="button"
                                  className="icon-btn"
                                  onClick={() => setConfirmId(null)}
                                  aria-label="Cancelar eliminación"
                                  title="Cancelar"
                                >
                                  <Icon name="close" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="icon-btn"
                                  onClick={() => openEdit(item)}
                                  disabled={busyId !== null}
                                  aria-label={`Editar registro ${item.id}`}
                                  title="Editar"
                                >
                                  <Icon name="edit" />
                                </button>
                                <button
                                  type="button"
                                  className="icon-btn icon-btn--danger"
                                  onClick={() => setConfirmId(item.id)}
                                  disabled={busyId !== null}
                                  aria-label={`Eliminar registro ${item.id}`}
                                  title="Eliminar"
                                >
                                  <Icon name="trash" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Alta / Edición igual al resto del sistema */}
      <dialog
        ref={dialogRef}
        className="modal ss__dialog"
        onClose={() => setModal(null)}
        onCancel={(e) => {
          if (saving) e.preventDefault();
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) closeModal();
        }}
        aria-labelledby="ss-modal-title"
      >
        {modal && (
          <form className="modal__form" onSubmit={submit} noValidate>
            <header className="modal__head">
              <h2 id="ss-modal-title">
                {modal.id === null ? 'Nuevo servicio social' : `Editar servicio social #${modal.id}`}
              </h2>
              <button type="button" className="icon-btn" onClick={closeModal} aria-label="Cerrar" title="Cerrar">
                <Icon name="close" />
              </button>
            </header>

            <div className="modal__body">
              <div className="ss__grid-2">
                <div className="modal__field">
                  <label htmlFor="ss-alumno">Alumno</label>
                  <select
                    id="ss-alumno"
                    className="input"
                    required
                    value={form.alumnoId}
                    onChange={(e) => setForm({ ...form, alumnoId: e.target.value })}
                  >
                    <option value="">Selecciona un alumno…</option>
                    {alumnos.map((a) => {
                      const yaTieneOtro =
                        alumnosConServicioIds.has(a.id) &&
                        (modal.id === null || String(a.id) !== form.alumnoId);
                      return (
                        <option key={a.id} value={a.id} disabled={yaTieneOtro}>
                          {a.nombreAlumno} ({a.matricula}){yaTieneOtro ? ' — Ya tiene servicio' : ''}
                        </option>
                      );
                    })}
                    {modal.id !== null &&
                      form.alumnoId &&
                      !alumnos.some((a) => String(a.id) === form.alumnoId) && (
                        <option value={form.alumnoId}>Alumno #{form.alumnoId}</option>
                      )}
                  </select>
                </div>

                <div className="modal__field">
                  <label htmlFor="ss-estado">Estado</label>
                  <select
                    id="ss-estado"
                    className="input"
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  >
                    <option value="NO LIBERADO">No Liberado</option>
                    <option value="EN PROCESO">En Proceso</option>
                    <option value="LIBERADO">Liberado</option>
                  </select>
                </div>
              </div>

              <div className="modal__field">
                <label htmlFor="ss-institucion">Institución receptora</label>
                <input
                  id="ss-institucion"
                  className="input"
                  maxLength={150}
                  required
                  value={form.institucion}
                  onChange={(e) => setForm({ ...form, institucion: e.target.value })}
                  placeholder="Ej. DIF Municipal, Hospital General"
                />
              </div>

              <div className="modal__field">
                <label htmlFor="ss-programa">Programa</label>
                <input
                  id="ss-programa"
                  className="input"
                  maxLength={150}
                  required
                  value={form.programa}
                  onChange={(e) => setForm({ ...form, programa: e.target.value })}
                  placeholder="Ej. Apoyo Comunitario Digital"
                />
              </div>

              <div className="ss__grid-3">
                <div className="modal__field">
                  <label htmlFor="ss-horas-acum">Horas acumuladas</label>
                  <input
                    id="ss-horas-acum"
                    type="number"
                    min={0}
                    max={form.horasTotales || 480}
                    className="input"
                    value={form.horasAcumuladas}
                    onChange={(e) => handleHorasChange(parseInt(e.target.value, 10) || 0)}
                  />
                </div>

                <div className="modal__field">
                  <label htmlFor="ss-horas-totales">Horas totales</label>
                  <input
                    id="ss-horas-totales"
                    type="number"
                    min={1}
                    className="input"
                    value={form.horasTotales}
                    onChange={(e) => handleHorasTotalesChange(parseInt(e.target.value, 10) || 480)}
                  />
                </div>

                <div className="modal__field">
                  <label htmlFor="ss-fecha">Fecha de inicio</label>
                  <input
                    id="ss-fecha"
                    type="date"
                    className="input"
                    value={form.fechaInicio}
                    onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
                  />
                </div>
              </div>

              {formError && <span className="field-error">{formError}</span>}
            </div>

            <footer className="modal__foot">
              <button type="button" className="btn btn--ghost btn--sm" onClick={closeModal} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" className="btn btn--primary btn--sm" disabled={saving}>
                {saving ? <span className="spinner" aria-hidden="true" /> : <Icon name="check" size={16} />}
                Guardar
              </button>
            </footer>
          </form>
        )}
      </dialog>

      <div aria-live="polite" aria-atomic="true">
        {toast && (
          <div key={toast.key} className={`toast toast--${toast.kind}`} role={toast.kind === 'error' ? 'alert' : 'status'}>
            <Icon name={toast.kind === 'error' ? 'close' : 'check'} size={16} />
            {toast.text}
          </div>
        )}
      </div>
    </section>
  );
}
