# Implementar autenticación con AWS Cognito en API NestJS

## Contexto
Tenemos una API NestJS que está detrás de un ALB (Application Load Balancer). El frontend (SPA) se autentica directamente contra AWS Cognito y obtiene tokens JWT. La API debe validar esos tokens de forma offline (sin llamar a Cognito en cada request), usando las claves públicas del JWKS endpoint.

El ALB actúa como simple balanceador de carga, no maneja autenticación. Toda la validación de tokens se hace en NestJS.

## Requerimientos

### 1. Estrategia de autenticación con Passport
- Instalar las dependencias: `@nestjs/passport`, `passport`, `passport-jwt`, `jwks-rsa`
- Crear una estrategia JWT (`CognitoStrategy`) que:
  - Extraiga el token del header `Authorization: Bearer <token>`
  - Obtenga las claves públicas del endpoint JWKS de Cognito (`https://cognito-idp.{region}.amazonaws.com/{userPoolId}/.well-known/jwks.json`)
  - Use `jwks-rsa` con cache habilitado y rate limiting
  - Valide el issuer contra la URL del User Pool
  - Use algoritmo RS256
  - En el método `validate()`, verifique que `token_use` sea `"access"` (rechazar ID tokens y refresh tokens)
  - Devuelva un objeto con `userId` (del claim `sub`), `email` y `groups` (del claim `cognito:groups`)

### 2. AuthModule
- Crear un módulo de autenticación que registre Passport con la estrategia `cognito` como default
- Exportar `PassportModule` para que otros módulos puedan usar los guards

### 3. Guards
- Crear `CognitoAuthGuard` que extienda `AuthGuard('cognito')`
- Crear `RolesGuard` que:
  - Lea los roles requeridos de los metadata del handler (usando un decorator `@Roles()`)
  - Compare contra el array `groups` del usuario autenticado (que viene de `cognito:groups` en el token)
  - Si no hay roles requeridos en el handler, permita el acceso

### 4. Decorators
- `@Roles(...roles: string[])` para marcar qué grupos de Cognito pueden acceder a un endpoint
- `@CurrentUser()` como param decorator para extraer `request.user` de forma limpia

### 5. Variables de entorno
- `COGNITO_USER_POOL_ID` (formato: `{region}_{poolId}`)
- `AWS_REGION`
- Agregar al `.env.example` con valores placeholder

### 6. Aplicar globalmente
- Evaluar si conviene registrar el `CognitoAuthGuard` como guard global con excepciones para rutas públicas, o aplicarlo manualmente en cada controller. Proponé la mejor opción para el proyecto.

## Qué NO hacer
- No implementar registro, login ni recuperación de contraseña en la API. Eso lo maneja el frontend directamente con Cognito.
- No usar el ALB para autenticación. El ALB solo balancea tráfico.
- No llamar a Cognito en cada request para validar tokens. La validación es offline con JWKS cacheado.
- No aceptar refresh tokens ni ID tokens en los endpoints protegidos, solo access tokens.

## Estructura esperada
src/
auth/
auth.module.ts
strategies/
cognito.strategy.ts
guards/
cognito-auth.guard.ts
roles.guard.ts
decorators/
roles.decorator.ts
current-user.decorator.ts

## Notas
- Los access tokens de Cognito duran 1 hora por defecto. No implementar revocación activa por ahora, es aceptable para esta etapa.
- Si un token es inválido, expirado, o no es un access token, la API debe devolver 401.
- Si el usuario no tiene el rol requerido, la API debe devolver 403.