import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import Icon from '../Icon';
import { useCrudResource } from '../../hooks/useCrudResource';
import { errorText } from '../../api/httpClient';
import type { CrudApi } from '../../types';

import '../../styles/crud.css';

/** Campo editable de un registro. `estado` no se declara: nunca se envía (activo por defecto). */
export interface FieldDef {
  /** clave en el JSON */
  key: string;
  label: string;
  kind: 'text' | 'checkbox' | 'select';
  /** máximo de caracteres (text) */
  max?: number;
  placeholder?: string;
  /** select: permite dejarlo vacío (se envía null) */
  optional?: boolean;
  /** opciones (select): value = ID numérico */
  options?: { value: number; label: string; hidden?: boolean }[];
}

type Values = Record<string, string | boolean>;
type Errors = Record<string, string>;

interface Toast {
  kind: 'ok' | 'error';
  text: string;
  key: number;
}

const get = (item: unknown, key: string): unknown => (item as Record<string, unknown>)[key];

const blank = (fields: FieldDef[]): Values =>
  Object.fromEntries(fields.map((f) => [f.key, f.kind === 'checkbox' ? false : '']));

const fromItem = (fields: FieldDef[], item: unknown): Values =>
  Object.fromEntries(
    fields.map((f) => {
      const v = get(item, f.key);
      return [f.key, f.kind === 'checkbox' ? Boolean(v) : v == null ? '' : String(v)];
    }),
  );

/** Todos los campos de texto y select son obligatorios. */
function validate(fields: FieldDef[], values: Values): Errors {
  const errors: Errors = {};
  for (const f of fields) {
    const v = values[f.key];
    if (f.kind === 'text') {
      const t = String(v).trim();
      if (!t) errors[f.key] = `Escribe ${f.label.toLowerCase()}.`;
      else if (f.max && t.length > f.max) errors[f.key] = `Máximo ${f.max} caracteres.`;
    } else if (f.kind === 'select' && !f.optional && !v) {
      errors[f.key] = `Elige ${f.label.toLowerCase()}.`;
    }
  }
  return errors;
}

const payload = (fields: FieldDef[], values: Values): Record<string, unknown> =>
  Object.fromEntries(
    fields.map((f) => {
      const v = values[f.key];
      return [f.key, f.kind === 'checkbox' ? v : f.kind === 'select' ? (v ? Number(v) : null) : String(v).trim()];
    }),
  );

type ParsedIds = { ids: number[]; error: null } | { ids: null; error: string };

function parseIds(text: string): ParsedIds {
  const parts = text.split(/[\s,]+/).filter(Boolean);
  if (!parts.length) return { ids: null, error: 'Escribe al menos un ID.' };
  const ids = parts.map(Number);
  if (ids.some((n) => !Number.isInteger(n) || n <= 0)) {
    return { ids: null, error: 'Usa números enteros separados por comas. Ej. 1, 3' };
  }
  return { ids: [...new Set(ids)], error: null };
}

interface CrudScreenProps<T extends { id: number }> {
  api: CrudApi<T>;
  fields: FieldDef[];
  /** prefijo para los ids de HTML */
  prefix: string;
  title: string;
  /** nombre del servicio para los mensajes */
  serviceName: string;
  /** aviso opcional bajo el formulario de alta */
  notice?: string;
}

/** Pantalla CRUD genérica configurada por campos (Divisiones en MS-A, Carreras en MS-B). */
export default function CrudScreen<T extends { id: number }>({ api, fields, prefix, title, serviceName, notice }: CrudScreenProps<T>) {
  const crud = useCrudResource(api);
  const { items, status, error, filter } = crud;

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [modal, setModal] = useState<{ id: number | null } | null>(null);
  const [values, setValues] = useState<Values>(() => blank(fields));
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const [idQuery, setIdQuery] = useState('');
  const [idError, setIdError] = useState<string | null>(null);
  const [missingIds, setMissingIds] = useState<number[]>([]);

  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

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

  const labelOf = (f: FieldDef, value: unknown): string => {
    if (f.kind === 'checkbox') return value ? 'Sí' : 'No';
    if (f.kind === 'select') return f.options?.find((o) => o.value === value)?.label ?? '—';
    return value == null || value === '' ? '—' : String(value);
  };

  /** Control de un campo (alta o edición). */
  const control = (f: FieldDef, id: string, values: Values, set: (v: Values) => void, errs: Errors, setErrs: (e: Errors) => void, first = false): ReactNode => {
    const change = (v: string | boolean) => {
      set({ ...values, [f.key]: v });
      if (errs[f.key]) setErrs({ ...errs, [f.key]: '' });
    };
    const invalid = !!errs[f.key];
    if (f.kind === 'checkbox') {
      return (
        <label className="crud__check" htmlFor={id}>
          <input id={id} type="checkbox" checked={Boolean(values[f.key])} onChange={(e) => change(e.target.checked)} />
          {f.label}
        </label>
      );
    }
    if (f.kind === 'select') {
      return (
        <select
          id={id}
          className="input"
          value={String(values[f.key])}
          onChange={(e) => change(e.target.value)}
          aria-label={f.label}
          aria-invalid={invalid}
        >
          <option value="">{f.optional ? `Sin ${f.label.toLowerCase()}` : `${f.label}…`}</option>
          {(f.options ?? []).filter((o) => !o.hidden || String(o.value) === values[f.key]).map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
    }
    return (
      <input
        id={id}
        autoFocus={first}
        className="input"
        placeholder={f.placeholder ?? f.label}
        value={String(values[f.key])}
        maxLength={(f.max ?? 120) + 1}
        onChange={(e) => change(e.target.value)}
        aria-label={f.label}
        aria-invalid={invalid}
        autoComplete="off"
      />
    );
  };

  // ---------- Nuevo / Editar (modal) ----------
  const openCreate = () => {
    setConfirmId(null);
    setValues(blank(fields));
    setErrors({});
    setModal({ id: null });
  };

  const openEdit = (item: T) => {
    setConfirmId(null);
    setValues(fromItem(fields, item));
    setErrors({});
    setModal({ id: item.id });
  };

  const closeModal = () => {
    if (!saving) setModal(null);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!modal) return;
    const errs = validate(fields, values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      if (modal.id === null) {
        const created = await crud.create(payload(fields, values));
        notify('ok', `Registro #${created.id} agregado.`);
      } else {
        await crud.update(modal.id, payload(fields, values));
        notify('ok', `Registro #${modal.id} guardado.`);
      }
      setModal(null);
    } catch (ex) {
      notify('error', errorText(ex));
    } finally {
      setSaving(false);
    }
  };

  // ---------- Buscar por ID(s) ----------
  const onSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = parseIds(idQuery);
    setIdError(parsed.error);
    if (parsed.error !== null) return;
    setConfirmId(null);
    setMissingIds(await crud.search(parsed.ids));
  };

  const clearFilter = () => {
    setIdQuery('');
    setMissingIds([]);
    crud.load();
  };

  const toggleEstado = async (item: T) => {
    setBusyId(item.id);
    try {
      await crud.update(item.id, { ...payload(fields, fromItem(fields, item)), estado: !get(item, 'estado') });
    } catch (ex) {
      notify('error', errorText(ex));
    } finally {
      setBusyId(null);
    }
  };

  const cancelRowActions = () => setConfirmId(null);

  // ---------- Eliminar ----------
  const confirmDelete = async (id: number) => {
    setBusyId(id);
    try {
      await crud.remove(id);
      setConfirmId(null);
      notify('ok', `Registro #${id} eliminado.`);
    } catch (ex) {
      notify('error', errorText(ex));
    } finally {
      setBusyId(null);
    }
  };

  const rowKeys = () => (e: KeyboardEvent<HTMLTableRowElement>) => {
    if (e.key === 'Escape') cancelRowActions();
  };

    return (
    <section className="crud" aria-labelledby={`${prefix}-title`}>
      <header className="crud__head">
        <div className="crud__heading">
          <div className="crud__title">
            <h1 id={`${prefix}-title`}>{title}</h1>
            {status === 'ready' && (
              <span className="crud__count">
                {items.length} {items.length === 1 ? 'registro' : 'registros'}
              </span>
            )}
          </div>
        </div>
        <div className="crud__head-actions">
          <button type="button" className="btn btn--ghost btn--sm" onClick={clearFilter} disabled={status === 'loading'}>
            <Icon name="refresh" size={16} />
            Recargar
          </button>
          <button type="button" className="btn btn--primary btn--sm" onClick={openCreate}>
            <Icon name="plus" size={16} />
            Nuevo
          </button>
        </div>
      </header>

      <div className="crud__panel">
        <div className="crud__toolbar">
          <form className="crud__form" onSubmit={onSearch} noValidate role="search">
            <label htmlFor={`${prefix}-ids`}>Buscar por ID</label>
            <div className="crud__row">
              <input
                id={`${prefix}-ids`}
                className="input mono"
                placeholder="1, 3, 7"
                inputMode="numeric"
                value={idQuery}
                onChange={(e) => {
                  setIdQuery(e.target.value);
                  if (idError) setIdError(null);
                }}
                aria-invalid={!!idError}
                aria-describedby={idError ? `${prefix}-ids-error` : undefined}
                autoComplete="off"
              />
              <button type="submit" className="btn btn--ghost btn--sm" aria-label="Buscar">
                <Icon name="search" size={16} />
              </button>
            </div>
            {idError && <span id={`${prefix}-ids-error`} className="field-error">{idError}</span>}
          </form>
        </div>

        {filter && status === 'ready' && (
          <div className="crud__filter" role="status">
            <span>
              Mostrando ID{filter.length > 1 ? 's' : ''} <span className="mono">{filter.join(', ')}</span>
            </span>
            {missingIds.length > 0 && (
              <span className="crud__filter-missing">
                No existe{missingIds.length > 1 ? 'n' : ''}: <span className="mono">{missingIds.join(', ')}</span>
              </span>
            )}
            <button type="button" className="btn btn--link" onClick={clearFilter}>Ver todos</button>
          </div>
        )}

        {status === 'error' && (
          <div className="crud__state" role="alert">
            <p className="crud__state-title">No se pudieron cargar los registros</p>
            <p>{error}</p>
            <button type="button" className="btn btn--ghost btn--sm" onClick={clearFilter}>
              <Icon name="refresh" size={16} /> Reintentar
            </button>
          </div>
        )}

        {status === 'ready' && items.length === 0 && (
          <div className="crud__state">
            {filter ? (
              <>
                <p className="crud__state-title">Ningún registro con esos IDs</p>
                <button type="button" className="btn btn--ghost btn--sm" onClick={clearFilter}>Ver todos</button>
              </>
            ) : (
              <>
                <p className="crud__state-title">Aún no hay registros en {serviceName}</p>
                <button type="button" className="btn btn--ghost btn--sm" onClick={openCreate}>
                  <Icon name="plus" size={16} /> Agregar registro
                </button>
              </>
            )}
          </div>
        )}

        {(status === 'loading' || (status === 'ready' && items.length > 0)) && (
          <table className="crud__table" aria-busy={status === 'loading'}>
            <thead>
              <tr>
                <th scope="col">ID</th>
                {fields.map((f) => <th key={f.key} scope="col">{f.label}</th>)}
                <th scope="col">Estado</th>
                <th scope="col" className="crud__actions"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {status === 'loading'
                ? [0, 1, 2, 3].map((i) => (
                    <tr key={i} aria-hidden="true">
                      <td className="crud__id"><div className="skel" style={{ width: 28 }} /></td>
                      {Array.from({ length: fields.length + 1 }, (_, c) => (
                        <td key={c}><div className="skel" style={{ width: `${40 + ((i + c) % 4) * 12}%` }} /></td>
                      ))}
                      <td className="crud__actions"><div className="skel" style={{ width: 64 }} /></td>
                    </tr>
                  ))
                : items.map((item) => {
                    const confirming = confirmId === item.id;
                    const busy = busyId === item.id;
                    const estado = get(item, 'estado');
                    return (
                      <tr
                        key={item.id}
                        className={confirming ? 'is-danger' : undefined}
                        onKeyDown={rowKeys()}
                      >
                        <td className="crud__id">#{item.id}</td>

                        {fields.map((f, i) => (
                          <td key={f.key} className="crud__name">
                            {confirming && i === 0 ? (
                              <span className="crud__confirm">
                                ¿Eliminar <strong>{labelOf(f, get(item, f.key))}</strong>? No se puede deshacer.
                              </span>
                            ) : (
                              labelOf(f, get(item, f.key))
                            )}
                          </td>
                        ))}

                        <td>
                          {typeof estado === 'boolean' ? (
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              onClick={() => toggleEstado(item)}
                              disabled={busyId !== null}
                              title={estado ? 'Desactivar' : 'Activar'}
                            >
                              {estado ? 'Activa' : 'Inactiva'}
                            </button>
                          ) : '—'}
                        </td>

                        <td className="crud__actions">
                          <div className="crud__actions-inner">
                            {confirming ? (
                              <>
                                <button type="button" className="btn btn--danger btn--sm" onClick={() => confirmDelete(item.id)} disabled={busy} autoFocus>
                                  {busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="trash" size={16} />}
                                  Eliminar
                                </button>
                                <button type="button" className="icon-btn" onClick={cancelRowActions} aria-label="Cancelar eliminación" title="Cancelar">
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

      <dialog ref={dialogRef} className="modal" onClose={() => setModal(null)} onCancel={(e) => { if (saving) e.preventDefault(); }} onClick={(e) => { if (e.target === dialogRef.current) closeModal(); }} aria-labelledby={`${prefix}-modal-title`}>
        {modal && (
          <form className="modal__form" onSubmit={onSubmit} noValidate>
            <header className="modal__head">
              <h2 id={`${prefix}-modal-title`}>{modal.id === null ? 'Nuevo registro' : `Editar registro #${modal.id}`}</h2>
              <button type="button" className="icon-btn" onClick={closeModal} aria-label="Cerrar" title="Cerrar">
                <Icon name="close" />
              </button>
            </header>
            <div className="modal__body">
              {fields.map((f, i) => (
                <div key={f.key} className="modal__field">
                  {f.kind !== 'checkbox' && <label htmlFor={`${prefix}-f-${f.key}`}>{f.label}</label>}
                  {control(f, `${prefix}-f-${f.key}`, values, setValues, errors, setErrors, i === 0)}
                  {errors[f.key] && <span className="field-error">{errors[f.key]}</span>}
                </div>
              ))}
              {notice && <span className="field-error">{notice}</span>}
            </div>
            <footer className="modal__foot">
              <button type="button" className="btn btn--ghost btn--sm" onClick={closeModal} disabled={saving}>Cancelar</button>
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
