# Backend GTR

API REST de gestión de solicitudes laborales construida con Laravel 12, PHP 8.2 y Sanctum. Todo el código de esta aplicación reside en `backend`; no requiere ni modifica el frontend Angular.

## Inicio rápido

```bash
cd backend
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

En desarrollo se usa SQLite por defecto (`database/database.sqlite`). Para MySQL, configure las variables `DB_*` en `.env` antes de migrar. Los adjuntos se guardan en el disco privado `local`; no ejecute `storage:link` para exponerlos. Ejecute `php artisan test` para las pruebas.

Configure `CORS_ALLOWED_ORIGINS=http://localhost:4200,http://127.0.0.1:4200` para Angular local. En producción use únicamente los orígenes HTTPS reales.

Usuario semilla: `rrhh@gtr.test` / `Password123!` (solo desarrollo; cambiar antes de producción).
