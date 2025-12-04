# Datamex ELMS - Production Deployment Guide

## 🚀 Quick Production Setup

### 1. Server Requirements
- PHP 8.1+
- MySQL 8.0+ or PostgreSQL 13+
- Composer
- Node.js 18+
- Web server (Apache/Nginx)

### 2. Basic Deployment Steps

```bash
# Clone repository
git clone https://github.com/your-username/datamex-elms.git
cd datamex-elms

# Install dependencies
composer install --optimize-autoloader --no-dev
npm install && npm run build

# Environment setup
cp .env.example .env
php artisan key:generate

# Database setup
php artisan migrate
php artisan db:seed

# Storage setup
php artisan storage:link
chmod -R 775 storage bootstrap/cache
```

### 3. File Storage Configuration

#### Option A: Local Server Storage (Simple)
```env
# .env
FILESYSTEM_DISK=public
APP_URL=https://your-domain.com
```

**How it works:**
- Files uploaded to: `storage/app/public/course_materials/`
- Accessible via: `https://your-domain.com/storage/course_materials/`
- Backup: Regular server backups include files

#### Option B: Amazon S3 (Recommended)
```env
# .env
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=datamex-elms-files
```

**Benefits:**
- ✅ Unlimited storage
- ✅ Global CDN delivery
- ✅ Automatic backups
- ✅ Scalable for thousands of students

### 4. Production Environment Variables

```env
# .env for production
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

# Database (adjust for your setup)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=datamex_elms
DB_USERNAME=your_db_user
DB_PASSWORD=your_secure_password

# File storage (choose one)
FILESYSTEM_DISK=public  # or 's3' for cloud

# Session & Cache (for performance)
SESSION_DRIVER=redis
CACHE_STORE=redis
QUEUE_CONNECTION=redis
```

## 📁 File Upload/Download Flow

### Teacher Uploads:
1. Teacher selects file → Uploaded to configured disk
2. File metadata saved to database
3. File accessible via download routes

### Student Downloads:
1. Student clicks download → System checks permissions
2. File served from configured disk
3. Download logged in database

### File Locations:
- **Local**: `storage/app/public/course_materials/{section_id}/`
- **S3**: `s3://your-bucket/course_materials/{section_id}/`

## 🔧 Server Configuration

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/datamex-elms/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";

    index index.html index.htm index.php;

    charset utf-8;

    # Handle file uploads
    client_max_body_size 50M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### Apache Configuration
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/datamex-elms/public

    # File upload limits
    LimitRequestBody 52428800

    <Directory /var/www/datamex-elms/public>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

## 🔐 Security Checklist

- [ ] Set `APP_ENV=production`
- [ ] Set `APP_DEBUG=false`
- [ ] Use HTTPS in production
- [ ] Set strong database passwords
- [ ] Configure proper file permissions
- [ ] Enable rate limiting
- [ ] Set up regular backups
- [ ] Configure firewall rules

## 📊 File Storage Scaling

| Users | Storage Option | Estimated Cost | Setup Complexity |
|-------|---------------|----------------|------------------|
| <100  | Local Server  | Server storage | Low |
| 100-1K| Local + Backup| $10-50/month  | Medium |
| 1K+   | Amazon S3     | $20-100/month | Medium |
| 5K+   | S3 + CDN      | $50-200/month | High |

## 🆘 Troubleshooting

### File Upload Issues
```bash
# Check permissions
ls -la storage/
chmod -R 775 storage/

# Check disk space
df -h

# Check PHP limits
php -i | grep upload_max_filesize
php -i | grep post_max_size
```

### Storage Link Issues
```bash
# Recreate storage link
php artisan storage:unlink
php artisan storage:link

# Check if link exists
ls -la public/storage
```

### S3 Configuration Issues
```bash
# Test S3 connection
php artisan tinker
Storage::disk('s3')->put('test.txt', 'Hello World');
Storage::disk('s3')->exists('test.txt');
```

## 📞 Support

For deployment issues, check:
1. Laravel logs: `storage/logs/laravel.log`
2. Web server error logs
3. Database connection
4. File permissions

---

**Ready to deploy? Follow the steps above and your ELMS will be production-ready!**