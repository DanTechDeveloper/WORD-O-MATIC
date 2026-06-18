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
        Schema::create('game_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->unsignedBigInteger('module_id'); // Can be word_module_id or paragraph_module_id
            $table->string('module_type'); // 'word' or 'paragraph'
            $table->integer('score'); // e.g., words_smashed
            $table->decimal('accuracy', 5, 2); // Percentage, e.g., 95.50
            $table->integer('streak')->default(0); // Highest streak achieved in this session
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('game_sessions');
    }
};
