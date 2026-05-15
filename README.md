# Datamex ELMS

Datamex ELMS is a Laravel 12 application designed for managing academic workflows, enrollment-related operations, and institutional data processes in a modern web interface.

## Project Status

[![Laravel](https://img.shields.io/badge/Laravel-12-red)](https://laravel.com)
[![PHP](https://img.shields.io/badge/PHP-8.2%2B-777bb4)](https://www.php.net)
[![Inertia](https://img.shields.io/badge/Inertia.js-v2-9553E9)](https://inertiajs.com)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v3-06b6d4)](https://tailwindcss.com)

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Technology Stack](#technology-stack)
- [Local Development Setup](#local-development-setup)
- [Environment Configuration](#environment-configuration)
- [Common Commands](#common-commands)
- [Testing](#testing)
- [Deployment Notes](#deployment-notes)
- [Project Structure](#project-structure)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

## Overview

This system provides a scalable foundation for school operations with a Laravel backend and an Inertia + React frontend. It includes real-time and reporting-related capabilities through queue workers, event handling, export utilities, and integrations used across academic administration workflows.

## Core Features

- Enrollment and student data workflow management
- Role-aware access control and policy-based authorization
- Dashboard and analytics-ready data structures
- Import and export workflows for institutional records
- Queue-driven background processing for heavy operations
- Realtime-ready architecture with socket and event support

## Technology Stack

- Backend: Laravel 12, PHP 8.2+, Sanctum
- Frontend: Inertia.js v2, React 18, Tailwind CSS v3, Vite
- Database: MySQL (via Laravel database layer)
- Dev Environment: Laravel Sail (Docker-based)
- Testing: Pest 4 / PHPUnit 12
- Integrations: Laravel Excel, Cloudinary, Ziggy

## Local Development Setup

### Prerequisites

- Docker Desktop (or Docker Engine + Compose)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/daniellejoshua/datamexElms.git
cd datamexElms
```

### 2. Install dependencies and start Sail

```bash
cp .env.example .env
vendor/bin/sail up -d
vendor/bin/sail composer install
vendor/bin/sail npm install
```

### 3. Application key, migrations, and frontend build

```bash
vendor/bin/sail artisan key:generate
vendor/bin/sail artisan migrate
vendor/bin/sail npm run build
```

### 4. Start development services

```bash
vendor/bin/sail composer run dev
```

## Environment Configuration

- Never commit real environment files containing secrets.
- Keep only template files such as `.env.example` and optional deployment templates.
- Ensure secrets for production are managed in your hosting or CI/CD secret manager.

## Common Commands

```bash
# Start / stop containers
vendor/bin/sail up -d
vendor/bin/sail stop

# Laravel commands
vendor/bin/sail artisan migrate
vendor/bin/sail artisan queue:work

# Frontend
vendor/bin/sail npm run dev
vendor/bin/sail npm run build

# Code style
vendor/bin/sail bin pint --dirty
```

## Testing

Run the full test suite:

```bash
vendor/bin/sail artisan test --compact
```

Run a specific test file:

```bash
vendor/bin/sail artisan test --compact tests/Feature/ExampleTest.php
```

## Deployment Notes

- Deployment-related files are included in the repository (`Dockerfile`, `compose.yaml`, `render.yaml`).
- Use environment variables from your deployment platform instead of committing production `.env` files.
- Build frontend assets during deployment with `vendor/bin/sail npm run build` (or equivalent non-Sail pipeline command on your target platform).

## Project Structure

```text
app/            # Business logic (models, services, jobs, policies, etc.)
bootstrap/      # App bootstrap and provider wiring
config/         # Application configuration
database/       # Migrations, factories, and seeders
public/         # Public entrypoint and compiled assets
resources/      # Frontend source (JS/CSS/views)
routes/         # Web, API, auth, and console routes
tests/          # Feature and unit tests (Pest)
```

## Security

If you discover a security issue, please report it privately to the repository maintainer. Do not open a public issue with sensitive details.

## Contributing

Contributions are welcome. Please open an issue first for major changes, then submit a pull request with clear scope, test coverage, and migration notes when applicable.

## License

This project is open-sourced under the [MIT License](https://opensource.org/licenses/MIT).
