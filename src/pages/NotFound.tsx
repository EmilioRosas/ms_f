import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="center-page">
      <p className="eyebrow mono">404</p>
      <h1>Esta ruta no existe</h1>
      <Link className="btn btn--ghost" to="/">Volver al inicio</Link>
    </main>
  );
}
