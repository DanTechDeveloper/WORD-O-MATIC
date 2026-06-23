<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('practice_words', function (Blueprint $table) {
            $table->id();
            $table->foreignId('practice_word_set_id')->constrained()->cascadeOnDelete();
            $table->string('word');
            $table->integer('position');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('practice_words');
    }
};
