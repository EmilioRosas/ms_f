# Cómo funciona el proyecto

Consola web para la práctica de **autenticación con Authorization Server** (grupo IDGS17).
Un usuario inicia sesión una sola vez y, con el token que recibe, administra los registros de
dos microservicios que solo responden a peticiones con un token válido.

## Índice

1. [Piezas del sistema](#1-piezas-del-sistema)
2. [Cómo inicia sesión el usuario](#2-cómo-inicia-sesión-el-usuario)
3. [Cómo viaja una petición](#3-cómo-viaja-una-petición)
4. [La vista "B con A"](#4-la-vista-b-con-a)
5. [Pantallas del frontend](#5-pantallas-del-frontend)
6. [Endpoints](#6-endpoints)
7. [Seguridad](#7-seguridad)
8. [Arrancar el proyecto](#8-arrancar-el-proyecto)
9. [Problemas comunes](#9-problemas-comunes)
10. [Limitaciones conocidas](#10-limitaciones-conocidas)

---

## 1. Piezas del sistema

| Proyecto | Puerto | Qué hace |
|---|---|---|
| `server` | 9000 | **Authorization Server** (Spring Authorization Server). Muestra el login, valida usuario y contraseña y emite el token JWT firmado. |
| `apigateway` | 8080 | **API Gateway** y servidor **Eureka**. Recibe todas las peticiones del frontend y las envía al microservicio que corresponde. |
| `ms-a` | 8081 | **Microservicio A**. CRUD de la entidad A `{ id, nombreA }`. Se registra en Eureka como `msa`. |
| `ms-b` | 8082 | **Microservicio B**. CRUD de la entidad B `{ id, nombreB }` y la lista combinada con A. Se registra en Eureka como `microb`. |
| `frontend` | 3000 | **Consola web** (React + TypeScript + Vite). Este repositorio. |

```
                         ┌──────────────────────────────┐
                         │ server :9000                 │
         1. login ──────►│ Authorization Server         │
                         │ emite el JWT                 │
                         └──────────────▲───────────────┘
                                        │ claves públicas (JWKS)
┌──────────────┐  2. API + Bearer  ┌────┴─────────────┐        ┌───────────────┐
│ frontend     │──────────────────►│ apigateway :8080 │──────► │ ms-a :8081    │
│ :3000        │                   │ Gateway + Eureka │        │ valida el JWT │
└──────────────┘                   │                  │──────► ├───────────────┤
                                   └──────────────────┘        │ ms-b :8082    │
                                                               │ valida el JWT │
                                                               │ ── Feign ──► ms-a
                                                               └───────────────┘
```

Cada microservicio usa una base **H2 en memoria**: los datos se borran al apagarlo.

---

## 2. Cómo inicia sesión el usuario

El frontend usa **OAuth 2 con `authorization_code` + PKCE**. La contraseña se escribe solo en
el Authorization Server: el frontend nunca la ve.

1. En `/login` el usuario pulsa **Iniciar sesión**.
2. El frontend genera dos valores aleatorios y los guarda en `sessionStorage`:
   - `code_verifier`: un secreto de un solo uso.
   - `state`: para comprobar que la respuesta corresponde a esta solicitud.
3. Redirige a `http://localhost:9000/oauth2/authorize` con el `client_id` (`frontend-client`),
   los permisos (`openid profile read write`) y el `code_challenge` (SHA-256 del `code_verifier`).
4. El server muestra su página de login (`templates/login.html`). El usuario escribe usuario y contraseña.
5. Si son correctos, el server regresa a `http://localhost:3000/callback?code=…&state=…`.
6. La pantalla `/callback`:
   - comprueba que `state` coincide;
   - envía `POST /oauth2/token` con el `code` y el `code_verifier`;
   - recibe el `access_token` (JWT) y el `id_token`.
7. El frontend guarda la sesión en `sessionStorage` y lleva al usuario a la sección que quería ver
   (o al inicio).

El token dura **5 minutos** (valor por defecto del server). La tarjeta del inicio muestra cuánto
falta para que venza. Cuando vence, cualquier petición responde `401` y el frontend regresa al
login con el aviso "Tu sesión venció".

**Cerrar sesión** borra la sesión local y llama a `/connect/logout` del server, que cierra la
sesión allá también y regresa a `http://localhost:3000/login`.

Código: `src/auth/pkce.ts`, `src/auth/authService.ts`, `src/auth/AuthContext.tsx`, `src/pages/Callback.tsx`.

---

## 3. Cómo viaja una petición

Ejemplo: el usuario abre **Entidad A**.

```
navegador ─ GET /api/entity-a ─► Vite :3000 (proxy)
                                   │  Authorization: Bearer <JWT>
                                   ▼
                              apigateway :8080
                                   │  ruta /api/entity-a/** → lb://msa
                                   │  (busca la instancia de "msa" en Eureka)
                                   ▼
                                ms-a :8081
                                   │  valida la firma y vigencia del JWT
                                   ▼
                              responde [{ id, nombreA }, …]
```

- **Proxy de Vite** (`vite.config.ts`): en desarrollo, el navegador solo habla con `localhost:3000`.
  Vite reenvía `/oauth2/token` al server y `/api/entity-a` y `/api/b` al gateway. Así no hace
  falta configurar CORS.
- **Gateway**: no valida el token; lo deja pasar tal cual. Cada microservicio lo valida por su cuenta.
- **Microservicios**: son *resource servers*. Al arrancar descargan las claves públicas del server
  (`issuer-uri=http://localhost:9000`) y con ellas comprueban cada JWT.

Código: `src/api/httpClient.ts` agrega el header `Authorization` a cada petición y convierte los
errores de Spring en mensajes legibles.

---

## 4. La vista "B con A"

`GET /api/b/con-a` devuelve cada registro B junto con el nombre del registro A con el que está
relacionado.

1. MS-B lee sus registros y la tabla de relación `entity_b_entity_a`.
2. Junta los IDs de A relacionados y llama a MS-A con **OpenFeign**:
   `POST http://localhost:8081/api/entity-a/by-ids`.
3. `FeignClientInterceptor` copia el token del usuario en esa llamada, así que MS-A también la valida.
4. Si un registro B no tiene relación, o MS-A no devolvió ese ID, MS-B responde
   `nombreA: "Sin dato de MSA"`. El frontend lo muestra como **Sin dato de A**.

El frontend no tiene una pantalla para relacionar registros. Para tener datos de ejemplo con
relación, MS-B incluye `POST /api/b/insertar-iniciales`: crea 5 registros B y los relaciona con
el registro A de ID 1 (crea primero ese registro A desde la pantalla Entidad A).

---

## 5. Pantallas del frontend

| Ruta | Pantalla | Qué muestra |
|---|---|---|
| `/login` | Iniciar sesión | Botón de inicio de sesión y estado en vivo de los 4 servicios. Si el server no responde, avisa qué encender. |
| `/callback` | — | Intercambia el `code` por el token. Solo se ve un momento. |
| `/` | Inicio | Nombre del usuario, tiempo restante del token y cuántos registros hay en cada servicio. |
| `/entity-a` | Entidad A | Agregar, editar en línea, eliminar con confirmación y buscar por uno o varios IDs (`POST /by-ids`). |
| `/entity-b` | Entidad B | Lo mismo para MS-B. La búsqueda por varios IDs hace un `GET /{id}` por cada uno. |
| `/combinado` | B con A | Lista de B con su dato de A y filtro Todos / Con A / Sin A. |

Las rutas privadas pasan por `ProtectedRoute`: sin sesión, redirigen a `/login` y, al entrar,
regresan a donde iba el usuario.

---

## 6. Endpoints

Todos requieren `Authorization: Bearer <JWT>`. Desde el frontend se llaman por el gateway (`:8080`).

**MS-A** · `/api/entity-a`

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| GET | `/api/entity-a` | — | `[{ id, nombreA }]` |
| GET | `/api/entity-a/{id}` | — | `{ id, nombreA }` |
| POST | `/api/entity-a` | `{ nombreA }` | `{ id, nombreA }` |
| PUT | `/api/entity-a/{id}` | `{ nombreA }` | `{ id, nombreA }` |
| DELETE | `/api/entity-a/{id}` | — | texto |
| POST | `/api/entity-a/by-ids` | `[1, 3]` | `[{ id, nombreA }]` |

**MS-B** · `/api/b`

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| GET | `/api/b` | — | `[{ id, nombreB }]` |
| GET | `/api/b/{id}` | — | `{ id, nombreB }` |
| POST | `/api/b` | `{ nombreB }` | `{ id, nombreB }` |
| PUT | `/api/b/{id}` | `{ nombreB }` | `{ id, nombreB }` |
| DELETE | `/api/b/{id}` | — | texto |
| GET | `/api/b/con-a` | — | `[{ id, nombreB, nombreA }]` |
| POST | `/api/b/insertar-iniciales` | — | datos de ejemplo (ver sección 4) |

**Authorization Server** · `:9000`

| Ruta | Para qué |
|---|---|
| `/oauth2/authorize` | Inicio del login (redirección desde el frontend). |
| `/oauth2/token` | Cambia el `code` por el token. |
| `/oauth2/jwks` | Claves públicas con las que los microservicios validan el JWT. |
| `/.well-known/openid-configuration` | Descubrimiento OIDC. El frontend lo usa para saber si el server está encendido. |
| `/connect/logout` | Cierra la sesión en el server. |

---

## 7. Seguridad

- **Cliente público con PKCE.** Un navegador no puede guardar un secreto, así que `frontend-client`
  no tiene secreto (`ClientAuthenticationMethod.NONE`) y el server exige PKCE (`requireProofKey(true)`).
  Está registrado en `server/.../config/SecurityConfig.java`.
- **La contraseña nunca pasa por el frontend.** Solo la recibe el server.
- **Token en `sessionStorage`.** Se borra al cerrar la pestaña. No se usa `localStorage`.
- **Cada microservicio valida el token.** El gateway no es la única barrera: si alguien llama
  directo a `:8081` o `:8082` sin token, recibe `401`.
- **El token se propaga en llamadas internas.** MS-B reenvía el token del usuario a MS-A (Feign).
- **Sesión vencida.** Cualquier `401` dispara el evento `auth:expired`: el frontend borra la
  sesión y regresa al login.

---

## 8. Arrancar el proyecto

Requisitos: Java (el proyecto se probó con JDK 26), Maven y Node.js 18 o superior.

Orden: primero `server` y `apigateway` (Eureka vive en el gateway), luego `ms-a` y `ms-b`, y al
final el frontend. Cada servicio en su propia terminal:

```bash
cd server && mvn spring-boot:run
```

```bash
cd apigateway && mvn spring-boot:run
```

```bash
cd ms-a && mvn spring-boot:run
```

```bash
cd ms-b && mvn spring-boot:run
```

```bash
npm install && npm run dev
```

Abrir `http://localhost:3000` e iniciar sesión con el usuario de prueba definido en
`userDetailsService()` de `server/.../config/SecurityConfig.java`.

Comandos del frontend:

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en `:3000` con el proxy hacia `:9000` y `:8080`. |
| `npm run typecheck` | Revisa los tipos con TypeScript. |
| `npm run build` | Revisa tipos y genera la versión de producción en `dist/`. |
| `npm run preview` | Sirve `dist/` para probar el build. |

Las URLs del frontend se pueden cambiar con variables `VITE_*` (ver `.env.example`).

---

## 9. Problemas comunes

| Síntoma | Causa | Qué hacer |
|---|---|---|
| En el login: "El Authorization Server no responde". | `server` está apagado. | Encender `server` y pulsar **Verificar**. |
| "El servicio no responde. Revisa que el API Gateway y los microservicios estén encendidos." | El gateway o el microservicio está apagado, o todavía no se registra en Eureka. | Encenderlo y esperar unos 30 segundos a que aparezca en Eureka. |
| Después de reiniciar `server`, todo responde "Tu sesión venció". | El server genera claves nuevas en cada arranque; los tokens anteriores ya no son válidos. | Iniciar sesión de nuevo. |
| Los registros desaparecen. | Las bases H2 son en memoria. | Es normal al reiniciar `ms-a` o `ms-b`. |
| En B con A todo sale "Sin dato de A". | Los registros B no tienen relación con A. | Ver la sección 4 (`/api/b/insertar-iniciales`). |
| `mvnw` falla en `server`. | Falta la carpeta `.mvn` del wrapper en ese proyecto. | Usar `mvn` instalado en el sistema. |

---

## 10. Limitaciones conocidas

- **No se renueva el token.** El cliente tiene `refresh_token`, pero el frontend no lo usa: al
  vencer (5 min) hay que iniciar sesión otra vez.
- **Claves RSA en memoria.** Se generan al arrancar el server; reiniciarlo invalida todos los tokens.
- **Usuarios y clientes en memoria.** Definidos en `SecurityConfig.java`, sin base de datos.
- **Sin pantalla para relacionar B con A.** La relación solo se crea con `insertar-iniciales`.
- **Feign con URL fija.** MS-B llama a MS-A en `http://localhost:8081` (propiedad `msa.url`), no por Eureka.
