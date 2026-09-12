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
| Perfil de RRHH | `GET/PUT /hr/profile` |
| Trabajadores | `/hr/workers` y cambio de estado |
| Áreas y puestos | `/hr/areas`, `/hr/positions` y cambio de estado |
| Categorías RRHH | `/hr/categories` y cambio de estado |
| Solicitudes RRHH | `/hr/requests`, detalle, aprobar, rechazar y cancelar |
| Calendario RRHH | `GET /hr/calendar` |
| Reportes RRHH | `GET /hr/reports/requests` y `GET /hr/reports/requests/export` |
| Notificaciones RRHH | `GET /hr/notifications` |

Los adaptadores están en `frontend/src/app/core/mappers/api.mappers.ts`. Convierten los nombres y estados de Laravel (por ejemplo, `APROBADA`) al formato ya usado por Angular (`APPROVED`), evitando cambios visuales.

## Reportes de RRHH y Excel

El menú **Reportes** muestra inicialmente todo el historial y permite consultar solicitudes por rango de fechas, trabajador, motivo y estado. Los botones **Mes actual** y **Todo el historial** establecen esos rangos rápidamente. La consulta considera solicitudes que se crucen con el período elegido, incluso si empezaron antes o terminan después de sus límites.

**Exportar Excel** descarga el mismo conjunto filtrado en formato `.xlsx`, con una hoja **Resumen** y otra **Solicitudes**. El archivo se genera en Laravel y solo puede solicitarlo un usuario con rol RRHH; el navegador no recibe acceso directo a la base de datos.

## Topes mensuales y analítica

En **Áreas de Planta** y al crear o editar un trabajador, RRHH puede definir topes mensuales separados para **permisos** y **faltas**. Un valor vacío o `0` no aplica tope. Una categoría se marca como **falta** desde **Categorías**; las demás se contabilizan como permisos. Al registrar una solicitud, el sistema bloquea la creación si el trabajador o su área ya alcanzaron el máximo de ese mes; las solicitudes rechazadas y canceladas no consumen cupo.

El dashboard de RRHH incluye una gráfica de **solicitudes aprobadas y rechazadas** con filtros de rango, área y trabajador. Permite alternar entre barras y circular. El rango de esta gráfica usa las fechas del permiso o descanso solicitado, por lo que representa los eventos comprendidos en el período elegido.

## Sesiones, acceso inicial y cierre de sesión

Angular valida la sesión guardada con `GET /api/me` antes de permitir una ruta protegida. Tokens vencidos, inválidos o heredados de la fase de mocks se eliminan y el usuario vuelve a `/login`.

La ruta raíz (`/`) y la pantalla `/login` siempre presentan el formulario de acceso, incluso si quedó una sesión del navegador. Ya no redirigen automáticamente al dashboard al abrir el servidor para una prueba.

El formulario ofrece **Mantener sesión iniciada en este dispositivo**. Si no se marca, la sesión se guarda únicamente durante la pestaña actual (`sessionStorage`) y se pierde al cerrar el navegador. Si se marca, se conserva en ese navegador (`localStorage`) y permite acceder otra vez a una ruta privada hasta cerrar sesión o invalidar el token. Esta opción no evita que la ruta inicial muestre el login.

El cierre de sesión siempre borra token y usuario de ambos almacenamientos, aun cuando el servidor local esté detenido o la llamada a `POST /api/logout` falle.

## Perfil de RRHH

En el menú de RRHH está **Mi perfil**. La cuenta puede modificar su nombre, correo y contraseña. Para cambiar la contraseña la API exige la contraseña actual, una nueva clave de al menos ocho caracteres y su confirmación.

## PWA, instalación y notificaciones

La aplicación ya incluye manifiesto, `Service Worker` de Angular y el botón **Descargar aplicación** en el inicio. El navegador solo habilita ese botón cuando la aplicación cumple sus condiciones: producción con HTTPS (o `localhost`), manifiesto válido y Service Worker activo. Después de ejecutar `npm run build`, publicar el contenido de `frontend/dist/frontend/browser/` en HTTPS.

El usuario de RRHH ve dentro de su menú la pregunta para permitir notificaciones. Tras aceptarla, el portal consulta notificaciones nuevas cada 30 segundos y muestra un aviso del navegador por cada solicitud nueva mientras el portal o la PWA están abiertos. Para recibir avisos con la aplicación completamente cerrada hace falta un servicio de **Web Push** (suscripción/VAPID y un proveedor push) en el servidor; no es una capacidad que el navegador otorgue sin esa infraestructura.

Los navegadores no permiten a una página web pedir acceso global para “administrar archivos”. Por seguridad, el sistema solicita al usuario elegir cada archivo al adjuntar un sustento; el navegador concede acceso únicamente a los archivos seleccionados y Laravel los guarda de forma privada.

El logo temporal está en `frontend/public/assets/logo-generico-gtr.png`. Para usar el logo oficial, reemplácelo por un PNG cuadrado con el mismo nombre; `frontend/public/assets/README.md` describe la ruta.

## Reglas de trabajo

- Los tokens de sesión se guardan en el almacenamiento del navegador; no deben subirse al repositorio.
- Los documentos se guardan privados en Laravel y se descargan únicamente por endpoints autorizados.
- RRHH crea usuarios trabajadores desde el módulo de trabajadores y debe asignar una contraseña inicial de al menos ocho caracteres.
- No modificar el esquema directamente en producción: crear una migración Laravel para cada cambio.
- Ejecutar validaciones antes de entregar cambios:

  ```powershell
  cd C:\sistema_GTR\backend; php artisan test
  cd C:\sistema_GTR\frontend; npm run build
  ```
