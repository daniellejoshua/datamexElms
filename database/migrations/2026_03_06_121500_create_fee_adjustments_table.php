<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void
    {
        if (Schema::hasTable('fee_adjustments')) {
            // table already exists (e.g. dev) — nothing to do here
            return;
        }

        Schema::create('fee_adjustments', function (Blueprint $table) {
            $table->id();
            $table->date('effective_date')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('type')->index();
            $table->string('term')->nullable();
            $table->decimal('amount', 10, 2)->default(0);
            $table->text('notes')->nullable();
            $table->boolean('college_only')->default(false)->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        if (Schema::hasTable('fee_adjustments')) {
            Schema::dropIfExists('fee_adjustments');
        }
    }
};
