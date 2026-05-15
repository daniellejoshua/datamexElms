<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
try {
    $rows = Illuminate\Support\Facades\DB::select("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
    if (empty($rows)) {
        echo "<no tables returned>\n";
    }
    foreach ($rows as $r) {
        echo $r->tablename . PHP_EOL;
    }
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . PHP_EOL;
}
