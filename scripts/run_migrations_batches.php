<?php
/**
 * Run pending migrations one-by-one. On duplicate-table or duplicate-column
 * errors it will drop the offending object and retry the migration once.
 */

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;

function db_print($v) { echo $v . "\n"; }

$migrationsPath = database_path('migrations');
$files = array_values(array_filter(scandir($migrationsPath), fn($f)=>str_ends_with($f,'.php')));
sort($files);

// make sure migrations table exists so we can query it
Artisan::call('migrate:install');
$applied = array_map(fn($r)=>$r->migration, DB::select('select migration from migrations'));

foreach ($files as $file) {
    $migrationName = substr($file, 0, -4);
    if (in_array($migrationName, $applied)) {
        continue;
    }

    $path = 'database/migrations/' . $file;
    db_print("Running migration: {$migrationName}");

    $attempt = 0;
    while ($attempt < 2) {
        $attempt++;
        try {
            $code = $kernel->call('migrate', ['--path' => $path, '--force' => true]);
            $output = $kernel->output();
        } catch (Throwable $e) {
            $code = 1;
            $output = $e->getMessage();
        }

        if ($code === 0 && stripos($output, 'FAIL') === false && stripos($output, 'Error') === false) {
            db_print("OK: {$migrationName}");
            break;
        }

        // detect duplicate table
        if (preg_match('/relation "([^"]+)" already exists/i', $output, $m)) {
            $table = $m[1];
            db_print("Detected duplicate table '{$table}', dropping and retrying...");
            DB::statement("DROP TABLE IF EXISTS public." . $table . " CASCADE");
            continue; // retry
        }

        // detect duplicate column
        if (preg_match('/column "([^"]+)" of relation "([^"]+)" already exists/i', $output, $m)) {
            $column = $m[1];
            $table = $m[2];
            db_print("Detected duplicate column '{$column}' on '{$table}', dropping column and retrying...");
            DB::statement("ALTER TABLE public." . $table . " DROP COLUMN IF EXISTS " . $column);
            continue;
        }
        // detect duplicate type error, e.g. pg_type_typname_nsp_index
        if (preg_match('/duplicate key value violates unique constraint "pg_type_typname_nsp_index"[\s\S]*Key \(typname, typnamespace\)=\(([^,]+),/i', $output, $m)) {
            $type = trim($m[1]);
            db_print("Detected duplicate type '{$type}', dropping type and retrying...");
            DB::statement("DROP TYPE IF EXISTS public." . $type . " CASCADE");
            continue;
        }

        // If we get here we couldn't handle the error
        db_print("ERROR running {$migrationName}: ");
        db_print($output);
        exit(1);
    }

}

db_print('All pending migrations processed.');
