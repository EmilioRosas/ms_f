import { useEffect, useState, type FormEvent } from 'react';
import { maestroApi } from '../../api/maestroApi';
import { asignaturasApi } from '../../api/asignaturasApi';
import { errorText } from '../../api/httpClient';
import type { Asignatura, Maestro, MaestroDetalle } from '../../types';
import '../../styles/crud.css';
import '../../styles/relacion.css';

type FormValues = { nombre: string; correo: string; asignaturaIds: number[] };

const EMPTY: FormValues = { nombre: '', correo: '', asignaturaIds: [] };

/** Si Grupos no responde, el detalle se arma con los datos básicos de Maestros (sin grupos). */
const sinGrupos = (m: Maestro, catalogo: Asignatura[]): MaestroDetalle => ({
  id: m.id,
  nombre: m.nombre,
  correo: m.correo,
  estado: m.estado,
  materias: m.asignaturaIds.map((id) => ({
    asignaturaId: id,
    nombreAsignatura: catalogo.find((a) => a.id === id)?.nombre ?? `Asignatura #${id}`,
    grupos: [],
  })),
});

export default function MaestrosPage() {
  const [items, setItems] = useState<MaestroDetalle[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [form, setForm] = useState<FormValues>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [detalle, catalogo] = await Promise.all([
        maestroApi.detalleTodos().catch(() => null),
        asignaturasApi.listar(),
      ]);
      setAsignaturas(catalogo);
      if (detalle) {
        setItems(detalle);
        setAviso(null);
      } else {
        const basicos = await maestroApi.listar();
        setItems(basicos.map((m) => sinGrupos(m, catalogo)));
        setAviso('No se pudo consultar Grupos: no se muestran los grupos de cada materia.');
      }
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
    setForm(EMPTY);
    setEditingId(null);
  }

  function edit(item: MaestroDetalle) {
    setNotice(null);
    setError(null);
    setEditingId(item.id);
    setForm({ nombre: item.nombre, correo: item.correo ?? '', asignaturaIds: item.materias.map((m) => m.asignaturaId) });
  }

  function toggleMateria(id: number) {
    setForm((f) => ({
      ...f,
      asignaturaIds: f.asignaturaIds.includes(id) ? f.asignaturaIds.filter((x) => x !== id) : [...f.asignaturaIds, id],
    }));
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNotice(null);
    setError(null);
    const nombre = form.nombre.trim();
    if (!nombre) {
      setError('El nombre del maestro es obligatorio.');
      return;
    }
    if (nombre.length > 120) {
      setError('El nombre no puede superar 120 caracteres.');
      return;
    }
    setSaving(true);
    try {
      const values = { nombre, correo: form.correo.trim(), asignaturaIds: form.asignaturaIds };
      if (editingId === null) {
        await maestroApi.crear(values);
        setNotice('Maestro registrado correctamente.');
      } else {
        await maestroApi.actualizar(editingId, values);
        setNotice('Maestro actualizado correctamente.');
      }
      resetForm();
      await loadData();
    } catch (ex) {
      setError(errorText(ex));
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(item: MaestroDetalle) {
    setBusyId(item.id);
    setError(null);
    setNotice(null);
    try {
      if (item.estado) {
        await maestroApi.desactivar(item.id);
        setNotice(`Maestro #${item.id} desactivado.`);
      } else {
        await maestroApi.activar(item.id);
        setNotice(`Maestro #${item.id} activado.`);
      }
      await loadData();
    } catch (ex) {
      setError(errorText(ex));
    } finally {
      setBusyId(null);
    }
  }

  // Activas, más las que el maestro ya tiene aunque se hayan desactivado.
  const disponibles = asignaturas.filter((a) => a.estado || form.asignaturaIds.includes(a.id));

  return (
    <section className="crud" aria-labelledby="maestros-title">
      <header className="crud__head">
        <div className="crud__heading">
          <h1 id="maestros-title">Maestros</h1>
          <p className="muted">Materias que imparte cada maestro y los grupos donde las da.</p>
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => void loadData()} disabled={loading}>
          Recargar
        </button>
      </header>

      {error && <div className="alert alert--error" role="alert">{error}</div>}
      {notice && <div className="alert alert--info" role="status">{notice}</div>}
      {aviso && <div className="alert alert--info" role="status">{aviso}</div>}

      <section className="crud__panel">
        <form className="modal__body" onSubmit={submit}>
          <h2>{editingId === null ? 'Registrar maestro' : `Editar maestro #${editingId}`}</h2>
          <div className="modal__field">
            <label htmlFor="maestro-nombre">Nombre</label>
            <input
              id="maestro-nombre"
              className="input"
              maxLength={120}
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej. Ana Pérez"
            />
          </div>
          <div className="modal__field">
            <label htmlFor="maestro-correo">Correo</label>
            <input
              id="maestro-correo"
              className="input"
              type="email"
              maxLength={120}
              value={form.correo}
              onChange={(e) => setForm({ ...form, correo: e.target.value })}
              placeholder="maestro@escuela.mx"
            />
          </div>
          <fieldset className="modal__field">
            <legend>Materias que imparte</legend>
            {disponibles.length === 0 ? (
              <span className="muted">No hay asignaturas disponibles.</span>
            ) : (
              <div className="rel-checks">
                {disponibles.map((a) => (
                  <label key={a.id} className="crud__check">
                    <input type="checkbox" checked={form.asignaturaIds.includes(a.id)} onChange={() => toggleMateria(a.id)} />
                    {a.nombre}
                  </label>
                ))}
              </div>
            )}
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
          <div className="crud__state"><p>Cargando maestros...</p></div>
        ) : items.length === 0 ? (
          <div className="crud__state"><p className="crud__state-title">No hay maestros registrados.</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="crud__table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Materias y grupos</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="crud__id">#{item.id}</td>
                    <td>{item.nombre}</td>
                    <td>{item.correo || '—'}</td>
                    <td>
                      {item.materias.length === 0 ? '—' : (
                        <ul className="rel-items">
                          {item.materias.map((m) => (
                            <li key={m.asignaturaId}>
                              <strong>{m.nombreAsignatura}</strong>
                              {!aviso && `: ${m.grupos.length ? m.grupos.map((g) => g.nombre).join(', ') : 'sin grupos'}`}
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
