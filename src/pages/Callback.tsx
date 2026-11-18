import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// Recibe ?code=...&state=... del Authorization Server y obtiene el token.
export default function Callback() {
  const { finishLogin } = useAuth();
  const { search } = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false); // StrictMode ejecuta efectos dos veces; el code es de un solo uso.

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    finishLogin(search)
      .then(() => {
        const to = sessionStorage.getItem('auth.returnTo') || '/';
        sessionStorage.removeItem('auth.returnTo');
        navigate(to, { replace: true });
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, [finishLogin, search, navigate]);

  return (
    <main className="center-page" aria-live="polite">
      {error ? (
        <>
          <h1>No se pudo iniciar sesión</h1>
          <p className="muted">{error}</p>
          <Link className="btn btn--primary" to="/login">Intentar de nuevo</Link>
        </>
      ) : (
        <>
          <span className="spinner" aria-hidden="true" />
          <p>Iniciando sesión…</p>
        </>
      )}
    </main>
  );
}
