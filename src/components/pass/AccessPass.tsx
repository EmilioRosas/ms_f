import { useEffect, useMemo, useState } from 'react';
import { decodeJwt } from '../../auth/pkce';
import type { JwtClaims, Session } from '../../types';
import './AccessPass.css';

function fmt(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

interface AccessPassProps {
  session: Session;
  onRenew?: () => void;
}

/** El pase de acceso: el access token del usuario con su vigencia en vivo. */
export default function AccessPass({ session, onRenew }: AccessPassProps) {
  const claims = useMemo<JwtClaims>(() => decodeJwt(session.accessToken) ?? {}, [session]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const holder = claims.sub ?? session.user?.sub ?? 'usuario';
  const issuedAt = (claims.iat ?? 0) * 1000;
  const expiresAt = claims.exp ? claims.exp * 1000 : session.expiresAt;
  const total = Math.max(1, expiresAt - (issuedAt || expiresAt - 300000));
  const left = expiresAt - now;
  const ratio = Math.max(0, Math.min(1, left / total));
  const expired = left <= 0;

  return (
    <article className={`pass${expired ? ' is-expired' : ''}`} aria-label={`Pase de acceso de ${holder}`}>
      <div className="pass__stub" aria-hidden="true">
        <span className="pass__initial">{holder.slice(0, 1)}</span>
      </div>

      <div className="pass__body">
        <p className="pass__holder">{holder}</p>

        <div className="pass__validity">
          <div
            className="pass__bar"
            role="meter"
            aria-label="Vigencia de la sesión"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(ratio * 100)}
          >
            <span style={{ width: `${ratio * 100}%` }} />
          </div>
          {expired ? (
            <p className="pass__left">
              Sesión vencida.{' '}
              {onRenew && <button type="button" className="btn btn--link" onClick={onRenew}>Iniciar sesión</button>}
            </p>
          ) : (
            <p className="pass__left">Vence en <span className="mono">{fmt(left)}</span></p>
          )}
        </div>
      </div>

      <span className="pass__seal" aria-hidden="true">{expired ? 'Vencido' : 'Emitido'}</span>
    </article>
  );
}
