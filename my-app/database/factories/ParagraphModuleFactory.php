<?php

namespace Database\Factories;

use App\Models\ParagraphModule;
use Illuminate\Database\Eloquent\Factories\Factory;

class ParagraphModuleFactory extends Factory
{
    protected $model = ParagraphModule::class;

    public function definition(): array
    {
        return [
            'level' => fake()->unique()->numberBetween(1, 10),
            'title' => fake()->word(),
            'content' => 'The cat is big and fat.',
        ];
    }
}
