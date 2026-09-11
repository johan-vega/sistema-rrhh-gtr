# Contexto compartido: GTR, Angular, Laravel y MySQL

Este documento describe el estado actual para que los dos colaboradores trabajen sobre el mismo contexto.

## Estructura y alcance

- `frontend/`: Angular 22. Contiene pantallas, estilos y servicios HTTP.
- `backend/`: Laravel 12, PHP 8.2, Sanctum y la API REST.
- `docs/`: documentación compartida del proyecto.

El frontend no accede a MySQL directamente. Toda lectura y escritura se hace mediante la API Laravel autenticada.

## Base de datos local

MySQL/MariaDB local:

```text
Host: 127.0.0.1
Puerto: 3306
Base de datos: sistema_gtr
```

La configuración efectiva está en `backend/.env`. Las migraciones se ejecutaron y la base tiene las tablas de autenticación, roles, perfiles de trabajador, catálogos, solicitudes, documentos, auditoría y notificaciones.

En esta instalación de desarrollo Laravel usa temporalmente `root` local sin contraseña, porque MariaDB tiene una corrupción previa en `mysql.global_priv` que impide crear una cuenta restringida. Antes de producción se debe reparar esa tabla de MariaDB y cambiar `DB_USERNAME` y `DB_PASSWORD` por una cuenta limitada solo a `sistema_gtr`.

No insertar contraseñas en texto plano desde MySQL. Laravel usa hashes BCrypt. Para crear trabajadores se recomienda usar el formulario Angular o `POST /api/hr/workers`, que crea `users` y `workers` dentro de una transacción.

## Credencial inicial de desarrollo

```text
Correo: rrhh@gtr.test
Contraseña: Password123!
Rol: RRHH
```

Esta cuenta fue generada por `DatabaseSeeder`. Debe cambiarse o eliminarse antes de producción.

## Cómo iniciar el entorno

1. Iniciar MySQL/MariaDB (XAMPP) y comprobar que el puerto 3306 esté disponible.
2. En una terminal, iniciar Laravel:

   ```powershell
   cd C:\sistema_GTR\backend
   php artisan migrate --seed
   php artisan serve --host=127.0.0.1 --port=8000
   ```

3. En otra terminal, iniciar Angular:

   ```powershell
   cd C:\sistema_GTR\frontend
   npm install
   npm start
   ```

4. Abrir `http://localhost:4200` e iniciar sesión con la cuenta RRHH.

Laravel permite CORS para `http://localhost:4200` y `http://127.0.0.1:4200`. Angular apunta a `http://localhost:8000/api` y adjunta el token Sanctum automáticamente con el interceptor.

## Integración implementada

`frontend/src/environments/environment.ts` tiene `useMocks: false`. Los servicios consultan ahora Laravel y adaptan los campos de la API sin modificar las vistas o estilos:

| Módulo Angular | API Laravel |
|---|---|
| Autenticación | `POST /login`, `POST /logout`, `GET /me` |
| Perfil trabajador | `GET/PUT /profile` |
| Categorías disponibles | `GET /categories` |
| Solicitudes trabajador | `GET/POST /requests`, `GET /requests/{id}`, `POST /requests/{id}/cancel` |
| Calendario trabajador | `GET /calendar` |
| Notificaciones | `GET /notifications`, `POST /notifications/{id}/read`, `POST /notifications/read-all` |
| Dashboard RRHH | `GET /hr/dashboard` |
| Trabajadores | `/hr/workers` y cambio de estado |
| Áreas y puestos | `/hr/areas`, `/hr/positions` y cambio de estado |
| Categorías RRHH | `/hr/categories` y cambio de estado |
| Solicitudes RRHH | `/hr/requests`, detalle, aprobar, rechazar y cancelar |
| Calendario RRHH | `GET /hr/calendar` |
| Notificaciones RRHH | `GET /hr/notifications` |

Los adaptadores están en `frontend/src/app/core/mappers/api.mappers.ts`. Convierten los nombres y estados de Laravel (por ejemplo, `APROBADA`) al formato ya usado por Angular (`APPROVED`), evitando cambios visuales.

## Sesiones y cierre de sesión

Angular valida la sesión guardada con `GET /api/me` antes de permitir una ruta protegida. Tokens vencidos, inválidos o heredados de la fase de mocks se eliminan y el usuario vuelve a `/login`.

El cierre de sesión siempre borra token y usuario del navegador, aun cuando el servidor local esté detenido o la llamada a `POST /api/logout` falle. De ese modo ya no puede quedar un dashboard abierto por una sesión obsoleta.

## Reglas de trabajo

- El token se guarda localmente en el navegador; no debe subirse al repositorio.
- Los documentos se guardan privados en Laravel y se descargan únicamente por endpoints autorizados.
- RRHH crea usuarios trabajadores desde el módulo de trabajadores y debe asignar una contraseña inicial de al menos ocho caracteres.
- No modificar el esquema directamente en producción: crear una migración Laravel para cada cambio.
- Ejecutar validaciones antes de entregar cambios:

  ```powershell
  cd C:\sistema_GTR\backend; php artisan test
  cd C:\sistema_GTR\frontend; npm run build
  ```
