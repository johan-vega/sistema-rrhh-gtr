# Despliegue del backend

Este directorio contiene la API Laravel 12 del Sistema RRHH GTR. Conserva autenticación Laravel Sanctum mediante **Bearer tokens**: el frontend Angular debe enviar `Authorization: Bearer TOKEN`. No se usa autenticación SPA con cookies ni se requiere `/sanctum/csrf-cookie`.

## Ejecución local

1. Copie `.env.example` a `.env` y ajuste los valores locales. Para desarrollo normalmente use:

   ```env
   APP_ENV=local
   APP_DEBUG=true
   APP_URL=http://localhost:8000
   CORS_ALLOWED_ORIGINS=http://localhost:4200,http://127.0.0.1:4200

   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=sistema_gtr
   DB_USERNAME=root
   DB_PASSWORD=

   FILESYSTEM_DISK=local
   LOG_CHANNEL=stack
   LOG_LEVEL=debug
   ```

2. Instale dependencias y genere una clave solo en su entorno local:

   ```bash
   composer install
   php artisan key:generate
   php artisan migrate
   php artisan db:seed
   php artisan serve
   ```

3. La comprobación de disponibilidad es `GET http://localhost:8000/api/health`.

El seeder crea roles, áreas, cargos y categorías de ejemplo; **no crea usuarios ni contraseñas**. Para crear el primer usuario de RRHH, use Tinker en un entorno seguro y elija una contraseña única:

```bash
php artisan tinker
```

```php
$role = App\Models\Role::firstOrCreate(['code' => App\Models\Role::HR], ['name' => 'Recursos Humanos']);
App\Models\User::create([
    'name' => 'Administrador RRHH',
    'email' => 'admin@su-dominio.com',
    'password' => Illuminate\Support\Facades\Hash::make('UNA-CONTRASENA-UNICA-Y-SEGURA'),
    'role_id' => $role->id,
]);
```

No guarde ese comando con la contraseña elegida en el repositorio ni en el historial compartido de la terminal.

## Producción: Koyeb, Aiven y Cloudflare R2

Configure en Koyeb el directorio raíz como `backend` y use el `Dockerfile` incluido. Koyeb debe proporcionar `PORT`; el contenedor escucha en `0.0.0.0:$PORT` (usa `8000` solo como valor local por defecto).

Defina estas variables privadas en Koyeb, sin commitearlas:

```env
APP_NAME="Sistema RRHH GTR"
APP_ENV=production
APP_KEY=base64:...
APP_DEBUG=false
APP_URL=https://URL-DEL-BACKEND
APP_LOCALE=es
APP_FALLBACK_LOCALE=es
CORS_ALLOWED_ORIGINS=https://sistema-rrhh-gtr.vercel.app

DB_CONNECTION=mysql
DB_HOST=HOST-DE-AIVEN
DB_PORT=3306
DB_DATABASE=NOMBRE-DE-BASE
DB_USERNAME=USUARIO
DB_PASSWORD=CONTRASENA
MYSQL_ATTR_SSL_CA=/ruta/al/ca.pem

FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=ACCESS-KEY-DE-R2
AWS_SECRET_ACCESS_KEY=SECRET-KEY-DE-R2
AWS_DEFAULT_REGION=auto
AWS_BUCKET=NOMBRE-DEL-BUCKET
AWS_ENDPOINT=https://ACCOUNT_ID.r2.cloudflarestorage.com
AWS_USE_PATH_STYLE_ENDPOINT=false

LOG_CHANNEL=stderr
LOG_LEVEL=error
```

`MYSQL_ATTR_SSL_CA` es opcional para local, pero Aiven recomienda TLS. Su valor debe ser la ruta a un archivo CA disponible dentro del contenedor; cargue o monte ese certificado mediante el mecanismo seguro que ofrezca Koyeb. No use una ruta de una computadora de desarrollo. Si el plan de Aiven entrega otros requisitos TLS, configurelos según su conexión administrada.

El bucket de R2 debe permanecer privado. La API guarda los documentos en el disco indicado por `FILESYSTEM_DISK` y los entrega únicamente después de autenticar y autorizar al usuario; no crea URL públicas permanentes.

Después del primer despliegue, ejecute una vez desde la consola de Koyeb o una ejecución puntual conectada al mismo entorno:

```bash
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

No ejecute `migrate:fresh` ni seeders destructivos en producción. Para limpiar cachés durante diagnóstico use:

```bash
php artisan optimize:clear
```

El `Dockerfile` genera las cachés de configuración, rutas y vistas al iniciar. Las migraciones permanecen manuales para evitar modificaciones de datos no supervisadas.

## Verificación

Antes de desplegar ejecute:

```bash
php artisan test
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Luego puede limpiar los artefactos locales de caché con `php artisan optimize:clear`. Revise `GET /api/health`, el login Bearer y la descarga de un documento autorizado tras el despliegue.

## Límites históricos

Las columnas `monthly_permission_limit` y `monthly_absence_limit` se conservan temporalmente por compatibilidad con la interfaz existente y con bases ya migradas. Ya no se consultan al crear solicitudes ni bloquean a trabajadores o áreas: RRHH decide las aprobaciones y rechazos. No se eliminan en esta entrega para evitar una migración destructiva y una ruptura de clientes existentes.
