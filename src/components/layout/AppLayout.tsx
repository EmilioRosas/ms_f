import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './AppLayout.css';

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

const LINKS: NavItem[] = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/entity-a', label: 'Divisiones' },
  { to: '/entity-b', label: 'Carreras' },
  { to: '/asignaturas', label: 'Asignaturas' },
  { to: '/alumno', label: 'Alumnos' },
  // { to: '/combinado', label: 'B con A' },
];

// Layout privado: barra superior fija + contenido.
export default function AppLayout() {
  const { user, logout } = useAuth();
  const name = user?.sub ?? 'usuario';

  return (
    <div className="shell">
      <header className="shell__bar">
        <span className="shell__brand">
          <span className="shell__mark" aria-hidden="true" />
          Consola IDGS17
        </span>

        <nav className="shell__nav" aria-label="Principal">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>{l.label}</NavLink>
          ))}
        </nav>

        <div className="shell__user">
          <span className="shell__who" title={name}>
            <span className="shell__avatar" aria-hidden="true">{name.slice(0, 1)}</span>
            <span className="shell__name">{name}</span>
          </span>
          <button type="button" className="btn btn--ghost shell__logout" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="shell__main">
        <Outlet />
      </main>
    </div>
  );
}
