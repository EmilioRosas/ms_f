import { useEffect, useState, type FormEvent } from 'react';
import { grupoApi } from '../../api/grupoApi';
import { maestroApi } from '../../api/maestroApi';
import { errorText } from '../../api/httpClient';
import type { GrupoDetalle, OpcionMaestro } from '../../types';
import '../../styles/crud.css';
import '../../styles/relacion.css';

/** Cada fila del formulario guarda "asignaturaId:maestroId" ('' = sin elegir). */
const clave = (asignaturaId: number, maestroId: number) => `${asignaturaId}:${maestroId}`;

export default function GruposPage() {
  const [items, setItems] = useState<GrupoDetalle[]>([]);
  const [opciones, setOpciones] = useState<OpcionMaestro[]>([]);
  const [nombre, setNombre] = useState('');
  const [filas, setFilas] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [grupos, ops] = await Promise.all([grupoApi.detalleTodos(), maestroApi.opciones()]);
      setItems(grupos);
      setOpciones(ops);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function resetForm() {
    setNombre('');
    setFilas([]);
    setEditingId(null);
  }

  function edit(item: GrupoDetalle) {
    setNotice(null);
    setError(null);
    setEditingId(item.id);
    setNombre(item.nombre);
    setFilas(item.materias.map((m) => clave(m.asignaturaId, m.maestroId)));
  }

  /** Opciones de una fila: sin las materias ya elegidas en otras filas. */
  function opcionesDe(index: number) {
    const usadas = new Set(filas.filter((_, i) => i !== index && filas[i]).map((f) => f.split(':')[0]));
    const lista = opciones
      .filter((o) => !usadas.has(String(o.asignaturaId)))
      .map((o) => ({ value: clave(o.asignaturaId, o.maestroId), label: `${o.nombreAsignatura} — ${o.nombreMaestro}` }));
    const actual = filas[index];
    // Par ya guardado que dejó de estar disponible (p. ej. maestro inactivo): se muestra para no perderlo en silencio.
    if (actual && !lista.some((o) => o.value === actual)) {
      const [a, m] = actual.split(':');
      lista.unshift({ value: actual, label: `Asignatura #${a} — Maestro #${m} (no disponible)` });
    }
    return lista;
  }

  const hayMateriasLibres = opciones.some((o) => !filas.some((f) => f.split(':')[0] === String(o.asignaturaId)));

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNotice(null);
    setError(null);
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      setError('El nombre del grupo es obligatorio.');
      return;
    }
    if (nombreLimpio.length > 100) {
      setError('El nombre no puede superar 100 caracteres.');
      return;
    }
    if (filas.some((f) => !f)) {
      setError('Elige la materia y el maestro en cada fila, o quita la fila vacía.');
      return;
    }
    const asignaciones = filas.map((f) => {
      const [asignaturaId, maestroId] = f.split(':').map(Number);
      return { asignaturaId, maestroId };
    });
    setSaving(true);
    try {
      const values = { nombre: nombreLimpio, asignaciones };
      if (editingId === null) {
        await grupoApi.crear(values);
        setNotice('Grupo registrado correctamente.');
      } else {
        await grupoApi.actualizar(editingId, values);
        setNotice('Grupo actualizado correctamente.');
      }
      resetForm();
      await loadData();
    } catch (ex) {
      setError(errorText(ex));
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(item: GrupoDetalle) {
    setBusyId(item.id);
    setError(null);
    setNotice(null);
    try {
      if (item.estado) {
        await grupoApi.desactivar(item.id);
        setNotice(`Grupo #${item.id} desactivado.`);
      } else {
        await grupoApi.activar(item.id);
        setNotice(`Grupo #${item.id} activado.`);
      }
      await loadData();
    } catch (ex) {
      setError(errorText(ex));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="crud" aria-labelledby="grupos-title">
      <header className="crud__head">
        <div className="crud__heading">
          <h1 id="grupos-title">Grupos</h1>
          <p className="muted">Materias de cada grupo y el maestro que las imparte.</p>
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => void loadData()} disabled={loading}>
          Recargar
        </button>
      </header>

      {error && <div className="alert alert--error" role="alert">{error}</div>}
      {notice && <div className="alert alert--info" role="status">{notice}</div>}

      <section className="crud__panel">
        <form className="modal__body" onSubmit={submit}>
          <h2>{editingId === null ? 'Registrar grupo' : `Editar grupo #${editingId}`}</h2>
          <div className="modal__field">
            <label htmlFor="grupo-nombre">Nombre</label>
            <input
              id="grupo-nombre"
              className="input"
              maxLength={100}
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. IDGS-17A"
            />
          </div>
          <fieldset className="modal__field">
            <legend>Materias y maestro</legend>
            <div className="rel-list">
              {filas.map((valor, i) => (
                <div key={i} className="rel-row">
                  <select
                    className="input"
                    value={valor}
                    onChange={(e) => setFilas(filas.map((f, j) => (j === i ? e.target.value : f)))}
                    aria-label={`Materia y maestro ${i + 1}`}
                  >
                    <option value="">Materia — Maestro…</option>
                    {opcionesDe(i).map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => setFilas(filas.filter((_, j) => j !== i))}>
                    Quitar
                  </button>
                </div>
              ))}
              <div>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setFilas([...filas, ''])}
                  disabled={!hayMateriasLibres || filas.includes('')}
                >
                  Agregar materia
                </button>
                {opciones.length === 0 && !loading && (
                  <span className="muted"> Primero asigna materias a algún maestro activo.</span>
                )}
              </div>
            </div>
          </fieldset>
          <div className="crud__head-actions">
            <button className="btn btn--primary btn--sm" type="submit" disabled={saving}>
              {saving ? 'Guardando...' : editingId === null ? 'Registrar' : 'Guardar cambios'}
            </button>
            {editingId !== null && (
              <button className="btn btn--ghost btn--sm" type="button" onClick={resetForm}>
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="crud__panel">
        {loading ? (
          <div className="crud__state"><p>Cargando grupos...</p></div>
        ) : items.length === 0 ? (
          <div className="crud__state"><p className="crud__state-title">No hay grupos registrados.</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="crud__table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Materias y maestros</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="crud__id">#{item.id}</td>
                    <td>{item.nombre}</td>
                    <td>
                      {item.materias.length === 0 ? '—' : (
                        <ul className="rel-items">
                          {item.materias.map((m) => (
                            <li key={m.asignaturaId}>
                              <strong>{m.nombreAsignatura}</strong>: {m.nombreMaestro}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td>{item.estado ? 'Activo' : 'Inactivo'}</td>
                    <td>
                      <div className="crud__actions-inner">
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => edit(item)} disabled={busyId !== null}>
                          Editar
                        </button>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => void changeStatus(item)} disabled={busyId !== null}>
                          {busyId === item.id ? 'Procesando...' : item.estado ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
