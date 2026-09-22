FROM composer:2 AS dependencies

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --prefer-dist \
    --no-interaction \
    --no-progress \
    --optimize-autoloader \
    --no-scripts

FROM php:8.2-cli-bookworm

WORKDIR /var/www/html

RUN apt-get update \
    && apt-get install -y --no-install-recommends libzip-dev unzip \
    && docker-php-ext-install pdo_mysql zip \
    && rm -rf /var/lib/apt/lists/*

COPY . ./
COPY --from=dependencies /app/vendor ./vendor
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint
COPY docker/php-upload.ini /usr/local/etc/php/conf.d/php-upload.ini

RUN chmod +x /usr/local/bin/docker-entrypoint \
    && chown -R www-data:www-data storage bootstrap/cache

USER www-data

ENTRYPOINT ["docker-entrypoint"]
CMD ["sh", "-c", "php -d upload_max_filesize=20M -d post_max_size=24M -d max_file_uploads=5 artisan serve --host=0.0.0.0 --port=${PORT:-8000}"]
