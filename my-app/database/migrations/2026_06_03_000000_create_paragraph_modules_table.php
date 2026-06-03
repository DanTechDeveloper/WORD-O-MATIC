<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paragraph_modules', function (Blueprint $table) {
            $table->id();
            $table->integer('level')->unique();
            $table->string('title');
            $table->text('content')->nullable();
            $table->integer('total_score')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paragraph_modules');
    }
};
