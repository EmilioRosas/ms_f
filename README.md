# Frontend · Consola de microservicios

React + TypeScript + Vite. Obtiene el token del **Authorization Server** (`server`, :9000) y consume **MS-A** (:8081)
y **MS-B** (:8082) a través del **API Gateway** (`apigateway`, :8080), que los encuentra en Eureka.
Corre en `http://localhost:3000`, el origen que pide la práctica.

```
microservicios/
├── server/        Authorization Server (:9000)
├── ms-a/          Resource server (:8081)
├── ms-b/          Resource server (:8082)
├── apigateway/    API Gateway + Eureka (:8080)
└── frontend/      ← este proyecto (independiente, su propio package.json)
```

**[Cómo funciona el proyecto](docs/funcionamiento.md)**: piezas del sistema, flujo de inicio de
sesión, recorrido de una petición, endpoints, seguridad, arranque paso a paso y problemas comunes.

## Arranque

```bash
npm install
npm run dev
```

`npm run typecheck` revisa los tipos y `npm run build` compila (primero `tsc`, luego Vite).

## Estructura

```
src/
├── main.tsx                 Monta React, router y AuthProvider
├── App.tsx                  Rutas públicas y privadas
├── types.ts                 Tipos compartidos (Session, EntityA, EntityB, CrudApi…)
├── vite-env.d.ts            Tipos de las variables VITE_*
├── config/env.ts            URLs, client_id y scopes (VITE_*)
├── auth/
│   ├── pkce.ts              code_verifier / code_challenge (S256)
│   ├── authService.ts       /oauth2/authorize, /oauth2/token, sesión, logout
│   ├── AuthContext.tsx      useAuth(): session, user, login, logout
│   └── ProtectedRoute.tsx   Redirige a /login si no hay token
├── api/
│   ├── httpClient.ts        fetch + Authorization: Bearer, 401 → sesión expirada
│   ├── msaApi.ts            CRUD /api/entity-a + /by-ids
│   └── msbApi.ts            CRUD /api/b + /con-a
├── hooks/useServiceStatus.ts  Estado en vivo de :9000, :8081, :8082
├── components/
│   ├── layout/AppLayout.tsx   Barra superior + navegación (privado)
│   ├── pass/AccessPass.tsx    El pase de acceso (JWT decodificado + vigencia)
│   └── crud/CrudScreen.tsx    Pantalla CRUD genérica (MS-A y MS-B)
├── hooks/useCrudResource.ts   Estado y operaciones CRUD
├── pages/
│   ├── Login.tsx            Pase "sin emitir" + ruta del token
│   ├── Callback.tsx         Cambia el code por el token
│   ├── Dashboard.tsx        Pase emitido + resumen de servicios
│   ├── entity-a/EntityAPage.tsx   CRUD MS-A (/api/entity-a, /by-ids)
│   ├── entity-b/EntityBPage.tsx   CRUD MS-B (/api/b)
│   ├── combined/CombinedPage.tsx  GET /api/b/con-a
│   └── NotFound.tsx
└── styles/tokens.css, global.css, crud.css

## Dirección visual

"El token es un pase de acceso": el JWT se muestra como una credencial con talón
perforado. Azul institucional UTEQ (`#0B5FA5`) y cian de la portada (`#29A9E1`) sobre
papel frío (`#EEF2F7`); en oscuro, azul marino (`#0F1828`). Public Sans para la
interfaz y JetBrains Mono solo para datos reales (token, IDs, endpoints). La única
animación automática es el sello "Emitido" del pase.
```

## Flujo de autenticación

1. `/login` → botón → redirige a `:9000/oauth2/authorize` con PKCE.
2. El usuario escribe usuario y contraseña **en el Authorization Server** (el front nunca los ve).
3. `:9000` regresa a `/callback?code=…`; el front hace `POST /oauth2/token` y guarda el JWT.
4. Cada llamada a MS-A / MS-B lleva `Authorization: Bearer <token>` y pasa por el gateway.

```
navegador → :3000 (proxy Vite) ─┬─ /oauth2/token ─────────────→ server :9000
                                └─ /api/** → gateway :8080 ─┬─ lb://msa    → MS-A :8081
                                                            └─ lb://microb → MS-B :8082
```

En desarrollo, Vite hace de proxy (`vite.config.ts`), así que **no hace falta configurar CORS**.
Orden de arranque: `server` y `apigateway` primero, luego `ms-a` y `ms-b` (se registran en Eureka).

## Cliente del frontend en `server` (SecurityConfig.java)

El cliente `client-app` usa secreto y redirige a Postman; un navegador no puede guardar secretos.
Por eso `server` registra además un **cliente público con PKCE**, ya incluido en
`registeredClientRepository()`:

```java
RegisteredClient frontendClient = RegisteredClient.withId(UUID.randomUUID().toString())
        .clientId("frontend-client")
        .clientAuthenticationMethod(ClientAuthenticationMethod.NONE)
        .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
        .redirectUri("http://localhost:3000/callback")
        .postLogoutRedirectUri("http://localhost:3000/login")
        .scope(OidcScopes.OPENID)
        .scope(OidcScopes.PROFILE)
        .scope("read")
        .scope("write")
        .clientSettings(ClientSettings.builder()
                .requireProofKey(true)
                .requireAuthorizationConsent(false)
                .build())
        .build();

return new InMemoryRegisteredClientRepository(oidcClient, frontendClient);
```

Usuario de prueba: el definido en `userDetailsService()` del `server`.
