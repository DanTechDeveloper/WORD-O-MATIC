<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('word_modules', function (Blueprint $table) {
            $table->id();
            $table->integer('level')->unique(); // Para masiguro na isa lang ang config per level (1-10)
            $table->string('title');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('word_modules');
    }
};
