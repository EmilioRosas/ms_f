import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import AccessPass from '../components/pass/AccessPass';
import Icon from '../components/Icon';
import { msaApi } from '../api/msaApi';
import { msbApi } from '../api/msbApi';
import { alumnoApi } from '../api/alumnoApi';
import { asignaturasApi } from '../api/asignaturasApi';
import { servicioSocialApi } from '../api/servicioSocialApi';
import { errorText } from '../api/httpClient';
import type { Division, Carrera, Alumno, Asignatura, ServicioSocial } from '../types';
import './Dashboard.css';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

interface Stats {
  a: PromiseSettledResult<Division[]>;
  b: PromiseSettledResult<Carrera[]>;
  asignaturas: PromiseSettledResult<Asignatura[]>;
  alumnos: PromiseSettledResult<Alumno[]>;
  servicioSocial: PromiseSettledResult<ServicioSocial[]>;
}

interface ServiceRow {
  to: string;
  name: string;
  value: ReactNode;
}

export default function Dashboard() {
  const { session, user, login } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null); // null = cargando

  const load = useCallback(async () => {
    setStats(null);
    const [a, b, asignaturas, alumnos, servicioSocial] = await Promise.allSettled([
      msaApi.listar(),
      msbApi.listar(),
      asignaturasApi.listar(),
      alumnoApi.listar(),
      servicioSocialApi.listar(),
    ]);
    setStats({ a, b, asignaturas, alumnos, servicioSocial });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function metric<T>(result: PromiseSettledResult<T> | undefined, render: (value: T) => string): ReactNode {
    if (!result) return <span className="skel services__skel" aria-label="Cargando" />;
    if (result.status === 'rejected') {
      return <span className="services__error" title={errorText(result.reason)}>No responde</span>;
    }
    return <span className="services__value">{render(result.value)}</span>;
  }

  const rows: ServiceRow[] = [
    {
      to: '/entity-a',
      name: 'Divisiones',
      value: metric(stats?.a, (list) => plural(list.length, 'registro', 'registros')),
    },
    {
      to: '/entity-b',
      name: 'Carreras',
      value: metric(stats?.b, (list) => plural(list.length, 'registro', 'registros')),
    },
    {
      to: '/asignaturas',
      name: 'Asignaturas',
      value: metric(stats?.asignaturas, (list) => plural(list.length, 'registro', 'registros')),
    },
    {
      to: '/alumno',
      name: 'Alumnos',
      value: metric(stats?.alumnos, (list) => plural(list.length, 'registro', 'registros')),
    },
    {
      to: '/servicio-social',
      name: 'Servicio Social',
      value: metric(stats?.servicioSocial, (list) => plural(list.length, 'registro', 'registros')),
    },
  ];

  const partial = stats && Object.values(stats).some((r) => r.status === 'rejected');

  return (
    <section className="home" aria-labelledby="home-title">
      <header className="home__head">
        <h1 id="home-title">Hola, {user?.sub ?? 'usuario'}</h1>
      </header>

      <div className="home__grid">
        {session && <AccessPass session={session} onRenew={login} />}

        <section className="services" aria-labelledby="services-title">
          <div className="services__top">
            <h2 id="services-title">Servicios</h2>
            <button type="button" className="btn btn--ghost btn--sm" onClick={load} disabled={!stats}>
              <Icon name="refresh" size={16} /> Actualizar
            </button>
          </div>

          {partial && (
            <p className="alert alert--warn services__partial" role="status">
              Algunos servicios no respondieron. Revisa que estén encendidos y pulsa Actualizar.
            </p>
          )}

          <ul className="services__list">
            {rows.map((r) => (
              <li key={r.to}>
                <Link to={r.to} className="services__row">
                  <span className="services__name">{r.name}</span>
                  {r.value}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
