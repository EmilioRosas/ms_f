// Marcador temporal para las vistas que aún no se diseñan.
interface PagePlaceholderProps {
  title: string;
  service: string;
  endpoints: string[];
}

export default function PagePlaceholder({ title, service, endpoints }: PagePlaceholderProps) {
  return (
    <section className="placeholder">
      <p className="eyebrow mono">{service}</p>
      <h1>{title}</h1>
      <p className="muted">Vista pendiente. Endpoints que consumirá:</p>
      <ul className="mono">
        {endpoints.map((e) => <li key={e}>{e}</li>)}
      </ul>
    </section>
  );
}
