# Compartir PHP y extensiones entre la instalación y la ejecución del backend.
FROM php:8.2-cli-bookworm AS php-base

RUN apt-get update \
    && apt-get install -y --no-install-recommends libzip-dev unzip \
    && docker-php-ext-install pdo_mysql zip \
    && rm -rf /var/lib/apt/lists/*

FROM php-base AS dependencies

# Copiar solo Composer: su imagen puede incorporar otra versión de PHP.
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --prefer-dist \
    --no-interaction \
    --no-progress \
    --optimize-autoloader \
    --no-scripts

FROM php-base AS runtime

WORKDIR /var/www/html

COPY . ./
COPY --from=dependencies /app/vendor ./vendor
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint
COPY docker/php-upload.ini /usr/local/etc/php/conf.d/php-upload.ini

RUN chmod +x /usr/local/bin/docker-entrypoint \
    && chown -R www-data:www-data storage bootstrap/cache

USER www-data

ENTRYPOINT ["docker-entrypoint"]
CMD ["sh", "-c", "php -d upload_max_filesize=20M -d post_max_size=36M -d max_file_uploads=5 artisan serve --host=0.0.0.0 --port=${PORT:-8000}"]
