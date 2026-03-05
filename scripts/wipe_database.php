<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    // drop public schema completely and recreate to clear all tables, types, etc.
    echo "about to drop schema\n";
    DB::statement('DROP SCHEMA public CASCADE');
    echo "schema dropped\n";
    DB::statement('CREATE SCHEMA public');
    echo "schema created\n";
    // grants may fail when username contains a dot; ignore errors
    try {
        DB::statement('GRANT ALL ON SCHEMA public TO public');
        echo "granted public\n";
    } catch (Throwable $e) {
        echo "warning: grant public failed: " . $e->getMessage() . "\n";
    }
    // skip granting to owner to avoid syntax problems
    echo "DATABASE WIPED\n";
    exit(0);
} catch (Throwable $e) {
    echo "ERROR wiping database: " . $e->getMessage() . "\n";
    exit(1);
}
