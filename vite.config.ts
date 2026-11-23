import { defineConfig, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';

// El proxy evita configurar CORS en desarrollo: el navegador solo habla con
// localhost:3000. El token va directo al Authorization Server y las APIs
// pasan por el API Gateway (:8080), que las enruta a los microservicios vía Eureka.
// Se quita el header Origin para que Spring no trate la petición como cross-origin.
const target = (url: string): ProxyOptions => ({
  target: url,
  changeOrigin: true,
  configure: (proxy) => {
    proxy.on('proxyReq', (req) => req.removeHeader('origin'));
  },
});

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/oauth2/token': target('http://localhost:9000'), // Authorization Server
      '/api/entity-a': target('http://localhost:8080'), // Gateway → MS-A
      '/api/b': target('http://localhost:8080'),        // Gateway → MS-B
      '/api/alumno': target('http://localhost:8080'),   // Gateway → Alumnos
      '/api/asignaturas': target('http://localhost:8080'), // Gateway → Asignaturas
    },
  },
});
