<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE sections MODIFY `status` ENUM('active','inactive','archived') NOT NULL DEFAULT 'active'");
    }

    public function down(): void
    {
        // convert any archived statuses to inactive so the enum can be shrunk
        DB::table('sections')
            ->where('status', 'archived')
            ->update(['status' => 'inactive']);

        DB::statement("ALTER TABLE sections MODIFY `status` ENUM('active','inactive') NOT NULL DEFAULT 'active'");
    }
};
