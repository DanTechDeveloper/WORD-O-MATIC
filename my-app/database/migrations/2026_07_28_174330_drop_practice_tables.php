<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('practice_items');
        Schema::dropIfExists('practice_sets');
    }

    public function down(): void
    {
        Schema::create('practice_sets', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('type');
            $table->text('content')->nullable();
            $table->integer('total_items')->default(0);
            $table->timestamps();
        });

        Schema::create('practice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('practice_set_id')->constrained()->cascadeOnDelete();
            $table->string('content');
            $table->integer('position');
            $table->timestamps();
        });
    }
};
