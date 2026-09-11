# Base de datos

`roles` identifica RRHH y TRABAJADOR. `users` tiene la credencial y pertenece a un rol; `workers` almacena el perfil laboral y pertenece a `areas` y `positions`.

`request_categories` define reglas administrables: documento obligatorio, anticipación mínima, activo y si permite cancelar solicitudes ya aprobadas. `labor_requests` pertenece a un trabajador y una categoría. Sus estados son `PENDIENTE`, `APROBADA`, `RECHAZADA` y `CANCELADA`.

`request_documents` conserva metadatos del archivo privado. `request_histories` registra cada transición y usuario actor. `notifications` usa la tabla estándar de Laravel y `personal_access_tokens` guarda tokens Sanctum.

Las relaciones históricas restringen el borrado. Áreas, puestos, categorías y trabajadores se desactivan mediante `active`.

## MySQL local

La aplicación local usa la base `sistema_gtr` en `127.0.0.1:3306`. Las cuentas de acceso de la aplicación se crean en `users` y el perfil laboral obligatorio del trabajador se registra también en `workers`, junto con su rol `TRABAJADOR` en `roles`. Las contraseñas deben almacenarse siempre con hash BCrypt generado por Laravel; no inserte contraseñas de texto plano mediante MySQL.

Para una administración segura, cree trabajadores desde `POST /api/hr/workers`; este endpoint crea `users` y `workers` en una transacción. La tabla puede consultarse desde MySQL, por ejemplo: `USE sistema_gtr; SELECT id, name, email, role_id FROM users;`.
tengo que terminar la bd 
