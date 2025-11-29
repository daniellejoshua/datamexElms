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
        Schema::create('announcement_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('announcement_id')->constrained()->onDelete('cascade');
            
            $table->string('file_name');
            $table->string('file_path');
            $table->string('file_type'); // pdf, doc, image, etc.
            $table->bigInteger('file_size'); // in bytes
            $table->string('original_name'); // Original filename
            $table->integer('download_count')->default(0);
            
            $table->timestamps();
            
            // Indexes for file queries
            $table->index(['announcement_id']);
            $table->index(['file_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('announcement_attachments');
    }
};
