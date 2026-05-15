<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Changes already applied manually
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // this migration had no actionable "up" because the schema was already
        // altered manually before it was committed. therefore the down() method
        // should also be a no-op to avoid inserting duplicate columns or indexes.
    }
};
