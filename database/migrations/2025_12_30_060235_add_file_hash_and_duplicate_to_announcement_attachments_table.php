<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('announcement_attachments', function (Blueprint $table) {
            $table->string('file_hash', 64)->nullable()->index()->after('original_name');
            $table->boolean('is_duplicate')->default(false)->after('file_hash');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('announcement_attachments', function (Blueprint $table) {
            $table->dropColumn(['file_hash', 'is_duplicate']);
        });
    }
};
