FROM node:22-alpine AS frontend-builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY resources ./resources
COPY public ./public
COPY vite.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY jsconfig.json ./

RUN npm run build

FROM php:8.4-fpm-alpine
WORKDIR /var/www/html
RUN apk add --no-cache \
    bash \
    git \
    curl \
    zip \
    unzip \
    libzip-dev \
    oniguruma-dev \
    icu-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    postgresql-dev \
    mysql-client \
    postgresql-client \
    nginx \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo \
        pdo_mysql \
        pdo_pgsql \
        bcmath \
        intl \
        gd \
        zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy minimal files needed for Composer post scripts (artisan package discovery)
COPY composer.json composer.lock ./
COPY artisan ./
COPY bootstrap/app.php bootstrap/app.php
# Ensure bootstrap/cache exists for package discovery scripts
RUN mkdir -p bootstrap/cache \
    && chmod -R 0777 bootstrap/cache
RUN composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction --no-scripts \
    && composer dump-autoload -o

COPY . .
COPY --from=frontend-builder /app/public/build ./public/build
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
RUN rm -f public/hot \
    && test -f public/build/manifest.json

# Run package discovery now that full app files are present
RUN php artisan package:discover --ansi || true \
    && composer dump-autoload -o

# enable OPcache for better PHP performance
RUN { \
    echo "opcache.memory_consumption=192"; \
    echo "opcache.interned_strings_buffer=16"; \
    echo "opcache.max_accelerated_files=10000"; \
    echo "opcache.revalidate_freq=2"; \
    echo "opcache.fast_shutdown=1"; \
    echo "opcache.enable_cli=1"; \
} > /usr/local/etc/php/conf.d/opcache.ini

RUN mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R ug+rwx storage bootstrap/cache

ENV APP_ENV=production
ENV APP_DEBUG=false

EXPOSE 80

# Start php-fpm and nginx (php-fpm foregrounded, nginx runs in foreground)
CMD ["sh", "-lc", "php artisan config:cache && php artisan route:cache && php artisan view:cache && php-fpm -F & nginx -g 'daemon off;'" ]
