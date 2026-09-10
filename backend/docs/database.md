# Base de datos

`roles` identifica RRHH y TRABAJADOR. `users` tiene la credencial y pertenece a un rol; `workers` almacena el perfil laboral y pertenece a `areas` y `positions`.

`request_categories` define reglas administrables: documento obligatorio, anticipación mínima, activo y si permite cancelar solicitudes ya aprobadas. `labor_requests` pertenece a un trabajador y una categoría. Sus estados son `PENDIENTE`, `APROBADA`, `RECHAZADA` y `CANCELADA`.

`request_documents` conserva metadatos del archivo privado. `request_histories` registra cada transición y usuario actor. `notifications` usa la tabla estándar de Laravel y `personal_access_tokens` guarda tokens Sanctum.

Las relaciones históricas restringen el borrado. Áreas, puestos, categorías y trabajadores se desactivan mediante `active`.
