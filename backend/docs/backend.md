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

El entorno local usa MySQL/MariaDB; ajuste las variables `DB_*` en `.env` según su instalación antes de migrar. Los adjuntos se guardan en el disco privado elegido por `FILESYSTEM_DISK` (`local` para desarrollo, `s3`/Cloudflare R2 en producción); no ejecute `storage:link` para exponerlos. Ejecute `php artisan test` para las pruebas.

Configure `CORS_ALLOWED_ORIGINS=http://localhost:4200,http://127.0.0.1:4200` para Angular local. En producción use únicamente los orígenes HTTPS reales.

El seeder no crea usuarios ni contraseñas. Cree la primera cuenta de RRHH de forma segura siguiendo [deployment.md](deployment.md#ejecución-local).

Para Koyeb, Aiven MySQL, Cloudflare R2 y las variables de producción consulte [deployment.md](deployment.md).
