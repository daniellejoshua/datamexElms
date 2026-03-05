<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    $args = array_slice($argv, 1);

    if (count($args) === 0) {
        // default behavior (legacy)
        DB::statement('DROP TABLE IF EXISTS public.programs CASCADE');
        DB::statement('ALTER TABLE public.students DROP COLUMN IF EXISTS education_level');
        echo "DROPPED_OK\n";
        $res = DB::select("select to_regclass('public.programs') as programs");
        print_r($res);
        $col = DB::select("select count(*) as cnt from information_schema.columns where table_schema='public' and table_name='students' and column_name='education_level'");
        print_r($col);
    } else {
        foreach ($args as $arg) {
            // if arg contains a dot, treat as table.column to drop column
            if (strpos($arg, '.') !== false) {
                [$table, $column] = explode('.', $arg, 2);
                $table = preg_replace('/[^a-z0-9_]/i', '', $table);
                $column = preg_replace('/[^a-z0-9_]/i', '', $column);
                $sql = sprintf("ALTER TABLE public.%s DROP COLUMN IF EXISTS %s", $table, $column);
                DB::statement($sql);
                echo "DROPPED_COLUMN {$table}.{$column}\n";
            } else {
                $table = preg_replace('/[^a-z0-9_]/i', '', $arg);
                $sql = sprintf("DROP TABLE IF EXISTS public.%s CASCADE", $table);
                DB::statement($sql);
                echo "DROPPED_TABLE {$table}\n";
            }
        }
    }
    exit(0);
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
