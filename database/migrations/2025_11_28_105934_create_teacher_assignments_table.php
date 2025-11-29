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
        Schema::create('teacher_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained()->onDelete('cascade');
            $table->foreignId('section_id')->constrained()->onDelete('cascade');
            $table->date('assigned_date');
            $table->foreignId('assigned_by')->constrained('users')->onDelete('cascade');
            $table->enum('status',['active','inactive'])->default('active');
            $table->timestamps();
            $table->unique(['teacher_id', 'section_id']);
                    $table->index(['teacher_id', 'status']); 
        $table->index(['section_id', 'status']); 
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teacher_assignments');
    }
};
