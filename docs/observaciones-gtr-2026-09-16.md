# Observaciones GTR — 16/09/2026

## Archivos modificados (23)

- [backend/app/Http/Controllers/HrController.php](/C:/sistema_GTR/backend/app/Http/Controllers/HrController.php)
- [backend/app/Http/Requests/StoreWorkerRequest.php](/C:/sistema_GTR/backend/app/Http/Requests/StoreWorkerRequest.php)
- [backend/app/Http/Requests/UpdateWorkerRequest.php](/C:/sistema_GTR/backend/app/Http/Requests/UpdateWorkerRequest.php)
- [backend/app/Http/Resources/AreaResource.php](/C:/sistema_GTR/backend/app/Http/Resources/AreaResource.php)
- [backend/app/Http/Resources/WorkerResource.php](/C:/sistema_GTR/backend/app/Http/Resources/WorkerResource.php)
- [backend/app/Models/Area.php](/C:/sistema_GTR/backend/app/Models/Area.php)
- [backend/app/Models/Worker.php](/C:/sistema_GTR/backend/app/Models/Worker.php)
- [backend/app/Services/LaborRequestService.php](/C:/sistema_GTR/backend/app/Services/LaborRequestService.php)
- [backend/app/Services/RequestReportExportService.php](/C:/sistema_GTR/backend/app/Services/RequestReportExportService.php)
- [backend/routes/api.php](/C:/sistema_GTR/backend/routes/api.php)
- [backend/tests/Feature/LaborRequestApiTest.php](/C:/sistema_GTR/backend/tests/Feature/LaborRequestApiTest.php)
- [frontend/src/app/core/mappers/api.mappers.ts](/C:/sistema_GTR/frontend/src/app/core/mappers/api.mappers.ts)
- [frontend/src/app/core/models/index.ts](/C:/sistema_GTR/frontend/src/app/core/models/index.ts)
- [frontend/src/app/core/services/hr-worker.service.ts](/C:/sistema_GTR/frontend/src/app/core/services/hr-worker.service.ts)
- [frontend/src/app/features/hr/areas/hr-areas.component.ts](/C:/sistema_GTR/frontend/src/app/features/hr/areas/hr-areas.component.ts)
- [frontend/src/app/features/hr/reports/hr-reports.component.html](/C:/sistema_GTR/frontend/src/app/features/hr/reports/hr-reports.component.html)
- [frontend/src/app/features/hr/reports/hr-reports.component.ts](/C:/sistema_GTR/frontend/src/app/features/hr/reports/hr-reports.component.ts)
- [frontend/src/app/features/hr/workers/hr-worker-form.component.ts](/C:/sistema_GTR/frontend/src/app/features/hr/workers/hr-worker-form.component.ts)
- [frontend/src/app/features/hr/workers/hr-workers-list.component.ts](/C:/sistema_GTR/frontend/src/app/features/hr/workers/hr-workers-list.component.ts)
- [frontend/src/app/features/worker/profile/worker-profile.component.ts](/C:/sistema_GTR/frontend/src/app/features/worker/profile/worker-profile.component.ts)
- [frontend/src/app/features/worker/requests/new/worker-request-new.component.html](/C:/sistema_GTR/frontend/src/app/features/worker/requests/new/worker-request-new.component.html)
- [frontend/src/app/features/worker/requests/new/worker-request-new.component.spec.ts](/C:/sistema_GTR/frontend/src/app/features/worker/requests/new/worker-request-new.component.spec.ts)
- [frontend/src/app/features/worker/requests/new/worker-request-new.component.ts](/C:/sistema_GTR/frontend/src/app/features/worker/requests/new/worker-request-new.component.ts)

## Archivos creados (12)

- [backend/app/Http/Controllers/RequestAvailabilityController.php](/C:/sistema_GTR/backend/app/Http/Controllers/RequestAvailabilityController.php)
- [backend/app/Http/Controllers/WorkerPhotoController.php](/C:/sistema_GTR/backend/app/Http/Controllers/WorkerPhotoController.php)
- [backend/app/Services/AreaAvailabilityService.php](/C:/sistema_GTR/backend/app/Services/AreaAvailabilityService.php)
- [backend/app/Services/WorkerPhotoService.php](/C:/sistema_GTR/backend/app/Services/WorkerPhotoService.php)
- [backend/database/migrations/2026_09_16_000001_add_worker_personal_details.php](/C:/sistema_GTR/backend/database/migrations/2026_09_16_000001_add_worker_personal_details.php)
- [backend/database/migrations/2026_09_16_000002_add_area_simultaneous_permissions.php](/C:/sistema_GTR/backend/database/migrations/2026_09_16_000002_add_area_simultaneous_permissions.php)
- [backend/tests/Feature/AreaAvailabilityTest.php](/C:/sistema_GTR/backend/tests/Feature/AreaAvailabilityTest.php)
- [backend/tests/Feature/WorkerDetailsTest.php](/C:/sistema_GTR/backend/tests/Feature/WorkerDetailsTest.php)
- [frontend/src/app/core/services/request-availability.service.ts](/C:/sistema_GTR/frontend/src/app/core/services/request-availability.service.ts)
- [frontend/src/app/shared/components/worker-photo.component.ts](/C:/sistema_GTR/frontend/src/app/shared/components/worker-photo.component.ts)
- [frontend/src/app/shared/directives/area-availability.directive.ts](/C:/sistema_GTR/frontend/src/app/shared/directives/area-availability.directive.ts)
- [docs/observaciones-gtr-2026-09-16.md](/C:/sistema_GTR/docs/observaciones-gtr-2026-09-16.md)

## Base de datos y compatibilidad

Dos migraciones aditivas reversibles, sin modificar las históricas:

- `2026_09_16_000001_add_worker_personal_details`: `workers.dni_address` (string 255), `emergency_phone` (string 30), `worker_type` (string 20), `birth_date` (DATE), `photo_path` (string 255). Todos nullable para conservar registros existentes. RRHH debe completar tipo y nacimiento al crear/editar.
- `2026_09_16_000002_add_area_simultaneous_permissions`: `areas.max_simultaneous_permissions` (unsigned integer nullable). NULL significa sin límite; los valores configurados deben ser enteros >= 1.

Se reutilizan `address` y `phone`. No se asignan fechas/tipos ficticios. Los topes mensuales preexistentes conservan su significado y no se usan para cupos diarios.

## Fotos privadas

JPG/JPEG/PNG/WEBP, hasta 5 MiB, en `worker-photos/` usando el filesystem configurado. La base de datos solo almacena `photo_path`; la API solo publica `has_photo`.

`GET /api/workers/{worker}/photo` requiere Sanctum: RRHH puede acceder a cualquiera, el trabajador solo a su foto. No entrega URLs de R2 ni rutas internas. Angular obtiene un Blob con el interceptor existente y libera sus URLs temporales.

Al reemplazar se guarda la nueva foto, se actualiza bajo transacción y se elimina la anterior solo después del éxito. Si falla la transacción se limpia la foto nueva. El borrado está restringido a archivos de worker-photos.

Crear/editar trabajador con foto usa el mismo endpoint existente; editar usa POST con `_method=PUT` para que PHP reciba el archivo. Esto es exclusivo del formulario RRHH de trabajadores, no del envío de solicitudes.

## Cupo y disponibilidad

`GET /api/requests/availability?from=YYYY-MM-DD&to=YYYY-MM-DD`, bajo los middleware actuales de autenticación/trabajador. Solo devuelve `data.blocked_dates`, sin nombres ni IDs ajenos. Cada consulta admite hasta 366 días; Angular divide rangos mayores en bloques y se detiene en la primera fecha bloqueada.

La ocupación se calcula por trabajadores distintos del área actual con solicitudes APROBADAS no marcadas `is_absence`, por cada fecha inclusiva del permiso. Rangos solapados de la misma persona cuentan una sola vez. Se excluye al propio solicitante, cuyo permiso adicional no añade otra persona al cupo. PENDIENTES, RECHAZADAS y CANCELADAS no reservan.

El backend rechaza íntegramente un rango si hay alguna fecha llena. Revalida también al aprobar pendientes y bloquea la fila del área con `lockForUpdate` dentro de la transacción. No modifica la carga de documentos ni las notificaciones. La suite local usa SQLite: la concurrencia real de MySQL no se ensayó contra Aiven.

Para `is_absence` no se consulta ni reserva cupo. Se conserva `maximum_past_days` y se permite hoy incluso si la categoría tiene anticipación configurada. Se mantienen las validaciones de documentos. La selección nativa de fechas usa un validador asíncrono: muestra el bloqueo y evita enviar mientras consulta o mientras existe un error. No se agrega un date picker.

## Áreas y reporte

Al activar/desactivar o editar un área se reemplaza su elemento en el signal de la lista, actualizando badge y botón sin recargar. Crear trabajadores solo ofrece áreas/cargos activos; editar conserva también la referencia inactiva original. El backend aplica la misma restricción.

Excel conserva Trabajador, Motivo, Periodo, Estado y Solicitada, y agrega Área, Periodo inicio y Periodo fin. Las nuevas fechas son las del permiso, con formato dd/mm/yyyy. Se amplían anchos y autofiltro hasta H. No cambia el exportador. `worker.area` ya tenía eager loading y se conserva. La exportación usa los mismos filtros aplicados al detalle, no cambios del formulario todavía sin aplicar.

## Verificación

- `php artisan test`: 42 pruebas / 210 aserciones, correctas.
- `npm.cmd run test -- --watch=false`: 22 pruebas, correctas; se preservaron las pruebas de RequestService.
- `node scripts/upload-worker.test.mjs`: 3 pruebas correctas.
- `node scripts/upload-http.test.mjs`: 1 prueba correcta (multipart real de 2,4 MiB sobre PHP local).
- `npm.cmd run build`: correcto, sin errores TypeScript.
- Rutas nuevas comprobadas con `route:list`.
- `git diff --check`: correcto.
- Sin cambios en RequestService, su spec, StoreLaborRequest, CORS, interceptor, configuración R2, environment.production, Docker ni dependencias.
- No se hicieron pruebas en teléfonos físicos, ni llamadas autenticadas al sistema de producción.
- No se hizo push ni deployment ni se ejecutaron migraciones sobre una base de datos persistente. Las migraciones solo se aplicaron en SQLite efímero de PHPUnit.

## Pasos manuales en Northflank tras el merge

Cuando el contenedor tenga el nuevo código, antes de usar los campos/cupos nuevos:

```sh
php artisan migrate --force
php artisan migrate:status
```

Verificar que las dos migraciones del 16/09/2026 figuren como ejecutadas. Si el servicio mantiene caché de rutas, ejecutar además `php artisan route:clear` para que aparezcan las nuevas rutas (sin cambiar configuración de CORS/Sanctum/R2).

Después: completar tipo/nacimiento en trabajadores antiguos al editarlos, configurar los topes simultáneos deseados en Áreas y probar con RRHH y trabajador la foto privada y un permiso con fecha ocupada. Los valores iniciales de los topes son NULL: RRHH debe definirlos; no se inventan límites por área.
