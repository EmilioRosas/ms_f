import { useEffect, useState, type FormEvent } from 'react';
import { asignaturasApi } from '../../api/asignaturasApi';
import { msbApi } from '../../api/msbApi';
import { errorText } from '../../api/httpClient';
import type { Asignatura, Carrera } from '../../types';
import '../../styles/crud.css';
type FormValues = {
  nombre: string;
  descripcion: string;
  carreraId: string;
};
const EMPTY: FormValues = {
  nombre: '',
  descripcion: '',
  carreraId: '',
};
export default function AsignaturasPage() {
  const [items, setItems] = useState<Asignatura[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [form, setForm] = useState<FormValues>(EMPTY);
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
      const [asignaturas, listaCarreras] = await Promise.all([
        asignaturasApi.listar(),
        msbApi.listar(),
      ]);
      setItems(asignaturas);
      setCarreras(listaCarreras);
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
  function edit(item: Asignatura) {
    setNotice(null);
    setError(null);
    setEditingId(item.id);
    setForm({
      nombre: item.nombre,
      descripcion: item.descripcion ?? '',
      carreraId: String(item.carreraId),
    });
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNotice(null);
    setError(null);
    const nombre = form.nombre.trim();
    const descripcion = form.descripcion.trim();
    const carreraId = Number(form.carreraId);
    if (!nombre) {
      setError('El nombre de la asignatura es obligatorio.');
      return;
    }
    if (nombre.length > 120) {
      setError('El nombre no puede superar 120 caracteres.');
      return;
    }
    if (!Number.isInteger(carreraId) || carreraId <= 0) {
      setError('Selecciona una carrera válida.');
      return;
    }
    setSaving(true);
    try {
      const values = { nombre, descripcion, carreraId };
      if (editingId === null) {
        await asignaturasApi.crear(values);
        setNotice('Asignatura registrada correctamente.');
      } else {
        await asignaturasApi.actualizar(editingId, values);
        setNotice('Asignatura actualizada correctamente.');
      }
      resetForm();
      await loadData();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setSaving(false);
          }
  }
  async function changeStatus(item: Asignatura) {
    setBusyId(item.id);
    setError(null);
    setNotice(null);
    try {
      if (item.estado) {
        await asignaturasApi.desactivar(item.id);
        setNotice(`Asignatura #${item.id} desactivada.`);
      } else {
        await asignaturasApi.activar(item.id);
        setNotice(`Asignatura #${item.id} activada.`);
      }
      await loadData();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusyId(null);
    }
  }
  return (
    <section className="crud" aria-labelledby="asignaturas-title">
      <header className="crud__head">
        <div className="crud__heading">
          <h1 id="asignaturas-title">Asignaturas</h1>
          <p className="muted">Administración del catálogo de asignaturas.</p>
        </div>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => void loadData()}
          disabled={loading}
        >
          Recargar
        </button>
      </header>
      {error && <div className="alert alert--error" role="alert">{error}</div>}
      {notice && <div className="alert alert--info" role="status">{notice}</div>}
      <section className="crud__panel">
        <form className="modal__body" onSubmit={submit}>
          <h2>{editingId === null ? 'Registrar asignatura' : `Editar asignatura #${editingId}`}</h2>
          <div className="modal__field">
            <label htmlFor="asig-nombre">Nombre</label>
            <input
              id="asig-nombre"
              className="input"
              maxLength={120}
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej. Programación Orientada a Objetos"
            />
          </div>
          <div className="modal__field">
            <label htmlFor="asig-descripcion">Descripción</label>
            <textarea
              id="asig-descripcion"
              className="input"
              maxLength={500}
              rows={3}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Descripción de la asignatura"
            />
          </div>
          <div className="modal__field">
            <label htmlFor="asig-carrera">Carrera</label>
            <select
              id="asig-carrera"
              className="input"
              required
              value={form.carreraId}
              onChange={(e) => setForm({ ...form, carreraId: e.target.value })}
            >
              <option value="">Selecciona una carrera...</option>
              {carreras.filter((c) => c.estado).map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
                          </select>
          </div>
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
          <div className="crud__state"><p>Cargando asignaturas...</p></div>
        ) : items.length === 0 ? (
          <div className="crud__state"><p className="crud__state-title">No hay asignaturas
              registradas.</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="crud__table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Carrera</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="crud__id">#{item.id}</td>
                    <td>{item.nombre}</td>
                    <td>{item.descripcion || '—'}</td>
                    <td>{item.nombreCarrera || `Carrera #${item.carreraId}`}</td>
                    <td>{item.estado ? 'Activa' : 'Inactiva'}</td>
                    <td>
                      <div className="crud__actions-inner">
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
                          className="btn btn--ghost btn--sm"
                          onClick={() => void changeStatus(item)}
                          disabled={busyId !== null}
                        >
                          {busyId === item.id
                            ? 'Procesando...'
                            : item.estado ? 'Desactivar' : 'Activar'}
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