# API para Angular

Base URL: `/api`. Todas las respuestas JSON usan `success`, `message` y `data`; validación devuelve HTTP 422 y `errors`. Envíe `Authorization: Bearer {token}` tras `POST /login`.

| Método y ruta | Rol | Uso |
|---|---|---|
| POST `/login`, POST `/logout`, GET `/me` | público / autenticado | Sesión Sanctum y usuario actual |
| GET/PUT `/profile` | trabajador | PUT permite `address`, `phone` |
| GET `/categories` | autenticado | Categorías activas |
| GET/POST `/requests` | trabajador | Listar y crear: `category_id`, `start_date`, `end_date`, `reason`, `documents[]` multipart |
| GET `/requests/{id}`; POST `/requests/{id}/cancel` | propietario | Detalle y cancelación permitida |
| GET `/requests/{id}/documents/{document}`; GET `/hr/requests/{id}/documents/{document}` | propietario / RRHH | Descarga privada autorizada |
| GET `/calendar` | trabajador | Aprobadas propias; `from`, `to` |
| GET `/notifications`; POST `/notifications/{id}/read`; POST `/notifications/read-all` | autenticado | Notificaciones |
| GET `/hr/dashboard` | RRHH | Conteos |
| `/hr/workers`, `/hr/areas`, `/hr/positions`, `/hr/categories` | RRHH | CRUD y `PATCH {id}/status` |
| GET `/hr/requests`; GET `/hr/requests/{id}` | RRHH | Filtros: `worker_id`, `area_id`, `category_id`, `status`, `from`, `to` |
| POST `/hr/requests/{id}/approve`, `/reject`, `/cancel` | RRHH | `observation` requerido al rechazar |
| GET `/hr/calendar`, GET `/hr/notifications` | RRHH | Calendario global y bandeja RRHH |

Errores principales: 401 sin token/credencial inválida, 403 sin autorización, 404 recurso inexistente, 422 validación o regla de negocio incumplida.
