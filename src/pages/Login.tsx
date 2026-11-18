import { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useServiceStatus, type ServiceKey, type ServiceState } from '../hooks/useServiceStatus';
import Icon from '../components/Icon';
import './Login.css';

const STATUS_LABEL: Record<ServiceState, string> = { up: 'En línea', down: 'Sin respuesta', checking: 'Verificando' };

const REASONS: Record<string, string> = {
  required: 'Inicia sesión para entrar a esa sección.',
  expired: 'Tu sesión venció. Inicia sesión de nuevo.',
};

const SERVICES: { key: ServiceKey; name: string }[] = [
  { key: 'auth', name: 'Authorization Server' },
  { key: 'gateway', name: 'API Gateway' },
  { key: 'msa', name: 'Microservicio A' },
  { key: 'msb', name: 'Microservicio B' },
];

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const { status, refresh } = useServiceStatus();
  const [params] = useSearchParams();
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const reason = REASONS[params.get('reason') ?? ''];
  const authDown = status.auth === 'down';

  const onLogin = async () => {
    setError(null);
    setRedirecting(true);
    try {
      await login(); // navega a :9000/oauth2/authorize
    } catch {
      setRedirecting(false);
      setError('No se pudo iniciar sesión. Abre la app en http://localhost:3000 e inténtalo de nuevo.');
    }
  };

  return (
    <div className="login">
      <aside className="login__rail" aria-labelledby="rail-title">
        <header className="login__brand">
          <h1 id="rail-title">Consola de microservicios</h1>
        </header>

        <section className="status" aria-labelledby="status-title">
          <div className="status__top">
            <h2 id="status-title">Servicios</h2>
            <button type="button" className="status__refresh" onClick={refresh}>
              <Icon name="refresh" size={14} /> Verificar
            </button>
          </div>
          <ul className="status__list">
            {SERVICES.map((s) => {
              const state = status[s.key];
              return (
                <li key={s.key} className="status__item">
                  <span className="status__name">{s.name}</span>
                  <span className={`status__state status__state--${state}`}>
                    <span className="status__dot" aria-hidden="true" />
                    {STATUS_LABEL[state]}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </aside>

      <main className="login__main">
        <div className="login__panel">
          <header className="login__header">
            <p className="login__mobile-brand">Consola de microservicios</p>
            <h2>Iniciar sesión</h2>
          </header>

          <div className="login__alerts" aria-live="polite">
            {reason && !error && <div className="alert alert--info" role="status">{reason}</div>}
            {authDown && (
              <div className="alert alert--warn" role="status">
                <div>
                  <strong>El Authorization Server no responde</strong>
                  Enciende el proyecto <span className="mono">server</span> (puerto 9000) y pulsa Verificar.
                </div>
              </div>
            )}
            {error && <div className="alert alert--error" role="alert">{error}</div>}
          </div>

          <button type="button" className="btn btn--primary login__cta" onClick={onLogin} disabled={redirecting}>
            {redirecting ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Redirigiendo…
              </>
            ) : (
              'Iniciar sesión'
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
