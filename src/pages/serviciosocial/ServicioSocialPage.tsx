import { useEffect, useState, useMemo, type FormEvent } from 'react';
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

const EMPTY: FormValues = {
  alumnoId: '',
  institucion: '',
  programa: '',
  horasAcumuladas: 0,
  horasTotales: 480,
  estado: 'NO LIBERADO',
  fechaInicio: new Date().toISOString().split('T')[0],
};

export default function ServicioSocialPage() {
  const [items, setItems] = useState<ServicioSocialListDto[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [form, setForm] = useState<FormValues>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [listaServicios, listaAlumnos] = await Promise.all([
        servicioSocialApi.listarConAlumnos(),
        alumnoApi.listar().catch(() => [] as Alumno[]),
      ]);
      setItems(listaServicios);
      setAlumnos(listaAlumnos);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function handleHorasChange(nuevasHoras: number) {
    const horasTotales = form.horasTotales || 480;
    let nuevoEstado = form.estado;
    if (nuevasHoras >= horasTotales) {
      nuevoEstado = 'LIBERADO';
    } else if (form.estado === 'LIBERADO') {
      nuevoEstado = nuevasHoras > 0 ? 'EN PROCESO' : 'NO LIBERADO';
    } else if (nuevasHoras === 0) {
      nuevoEstado = 'NO LIBERADO';
    } else if (form.estado.includes('NO') && nuevasHoras > 0) {
      nuevoEstado = 'EN PROCESO';
    }
    setForm((prev) => ({
      ...prev,
      horasAcumuladas: nuevasHoras,
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

  function resetForm() {
    setForm(EMPTY);
    setEditingId(null);
  }

  function edit(item: ServicioSocialListDto) {
    setEditingId(item.id);
    const est = item.estado ? item.estado.replace(/_/g, ' ') : 'NO LIBERADO';
    setForm({
      alumnoId: String(item.alumnoId),
      institucion: item.institucion,
      programa: item.programa,
      horasAcumuladas: item.horasAcumuladas,
      horasTotales: item.horasTotales,
      estado: est,
      fechaInicio: item.fechaInicio || new Date().toISOString().split('T')[0],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);

    const alumnoId = parseInt(form.alumnoId, 10);
    if (!alumnoId) {
      setError('Debes seleccionar un alumno.');
      setSaving(false);
      return;
    }

    try {
      const payload = {
        alumnoId,
        institucion: form.institucion.trim(),
        programa: form.programa.trim(),
        horasAcumuladas: Number(form.horasAcumuladas) || 0,
        horasTotales: Number(form.horasTotales) || 480,
        estado: form.estado,
        fechaInicio: form.fechaInicio,
      };

      if (editingId === null) {
        await servicioSocialApi.crear(payload);
        setNotice('Servicio Social registrado exitosamente.');
      } else {
        await servicioSocialApi.actualizar(editingId, payload);
        setNotice('Servicio Social actualizado exitosamente.');
      }
      resetForm();
      await loadData();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  async function eliminar(id: number) {
    if (!window.confirm(`¿Estás seguro de eliminar el registro de Servicio Social #${id}?`)) {
      return;
    }
    setBusyId(id);
    setError(null);
    setNotice(null);
    try {
      await servicioSocialApi.eliminar(id);
      setNotice(`Servicio Social #${id} eliminado correctamente.`);
      if (editingId === id) resetForm();
      await loadData();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusyId(null);
    }
  }

  // IDs de alumnos que ya tienen servicio social registrado (para avisar en el select)
  const alumnosConServicioIds = useMemo(() => {
    return new Set(items.map((i) => i.alumnoId));
  }, [items]);

  // Filtrado de la tabla
  const filteredItems = useMemo(() => {
    if (!filterText.trim()) return items;
    const q = filterText.toLowerCase();
    return items.filter(
      (i) =>
        i.nombreAlumno?.toLowerCase().includes(q) ||
        i.matricula?.toLowerCase().includes(q) ||
        i.institucion?.toLowerCase().includes(q) ||
        i.programa?.toLowerCase().includes(q) ||
        String(i.id).includes(q)
    );
  }, [items, filterText]);

  return (
    <section className="crud" aria-labelledby="ss-title">
      <header className="crud__head">
        <div className="crud__heading">
          <h1 id="ss-title">Servicio Social</h1>
          <p className="muted">Administración y seguimiento del Servicio Social de alumnos.</p>
        </div>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => void loadData()}
          disabled={loading}
        >
          <Icon name="refresh" size={16} /> Recargar
        </button>
      </header>

      {error && <div className="alert alert--error" role="alert">{error}</div>}
      {notice && <div className="alert alert--info" role="status">{notice}</div>}

      {/* Formulario de Alta / Edición */}
      <section className="crud__panel">
        <form className="modal__body" onSubmit={submit}>
          <h2>{editingId === null ? 'Registrar Servicio Social' : `Editar Servicio Social #${editingId}`}</h2>

          <div className="modal__grid">
            <div className="modal__field">
              <label htmlFor="ss-alumno">Alumno *</label>
              <select
                id="ss-alumno"
                className="input"
                required
                value={form.alumnoId}
                onChange={(e) => setForm({ ...form, alumnoId: e.target.value })}
                disabled={editingId !== null} // En edición no cambiamos el alumno para evitar duplicados
              >
                <option value="">Selecciona un alumno...</option>
                {alumnos.map((a) => {
                  const yaTiene = alumnosConServicioIds.has(a.id);
                  return (
                    <option key={a.id} value={a.id} disabled={yaTiene && editingId === null}>
                      {a.nombreAlumno} ({a.matricula}){yaTiene ? ' — (Ya tiene servicio)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="modal__field">
              <label htmlFor="ss-estado">Estado *</label>
              <select
                id="ss-estado"
                className="input"
                required
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
              >
                <option value="NO LIBERADO">No Liberado</option>
                <option value="EN PROCESO">En Proceso</option>
                <option value="LIBERADO">Liberado</option>
              </select>
            </div>
          </div>

          <div className="modal__grid">
            <div className="modal__field">
              <label htmlFor="ss-institucion">Institución *</label>
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
              <label htmlFor="ss-programa">Programa *</label>
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
          </div>

          <div className="modal__grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            <div className="modal__field">
              <label htmlFor="ss-horas-acum">Horas Acumuladas</label>
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
              <label htmlFor="ss-horas-totales">Horas Totales</label>
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
              <label htmlFor="ss-fecha">Fecha de Inicio</label>
              <input
                id="ss-fecha"
                type="date"
                className="input"
                value={form.fechaInicio}
                onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
              />
            </div>
          </div>

          <div className="crud__head-actions" style={{ marginTop: '8px' }}>
            <button className="btn btn--primary btn--sm" type="submit" disabled={saving}>
              {saving ? 'Guardando...' : editingId === null ? 'Registrar Servicio' : 'Guardar Cambios'}
            </button>
            {editingId !== null && (
              <button className="btn btn--ghost btn--sm" type="button" onClick={resetForm}>
                Cancelar Edición
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Tabla de Registros */}
      <section className="crud__panel">
        <div className="crud__toolbar" style={{ gridTemplateColumns: '1fr' }}>
          <div className="crud__row">
            <input
              type="search"
              className="input"
              placeholder="Buscar por alumno, matrícula, institución o programa..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="crud__state"><p>Cargando registros de Servicio Social...</p></div>
        ) : filteredItems.length === 0 ? (
          <div className="crud__state">
            <p className="crud__state-title">No hay registros de Servicio Social.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="crud__table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Alumno</th>
                  <th>Institución</th>
                  <th>Programa</th>
                  <th>Horas</th>
                  <th>Avance</th>
                  <th>Estado</th>
                  <th>Fecha Inicio</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const pct = Math.min(100, Math.round((item.horasAcumuladas / (item.horasTotales || 480)) * 100));
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

                  return (
                    <tr key={item.id}>
                      <td className="crud__id">#{item.id}</td>
                      <td>
                        <strong>{item.nombreAlumno || `Alumno #${item.alumnoId}`}</strong>
                        {item.matricula && (
                          <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                            Mat: {item.matricula}
                          </div>
                        )}
                      </td>
                      <td>{item.institucion}</td>
                      <td>{item.programa}</td>
                      <td>
                        <strong>{item.horasAcumuladas}</strong> / {item.horasTotales} hrs
                      </td>
                      <td style={{ minWidth: '120px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                          <span>{pct}%</span>
                        </div>
                        <div className="ss__progress-bar">
                          <div
                            className={`ss__progress-fill ${fillClass}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td>
                        <span className={`ss__badge ${badgeClass}`}>
                          {estNorm || '—'}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-2)' }}>
                        {item.fechaInicio || '—'}
                      </td>
                      <td>
                        <div className="crud__actions-inner" style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => edit(item)}
                            disabled={busyId !== null}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm icon-btn--danger"
                            onClick={() => void eliminar(item.id)}
                            disabled={busyId !== null}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
