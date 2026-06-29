<?php

namespace Database\Factories;

use App\Models\WordModule;
use Illuminate\Database\Eloquent\Factories\Factory;

class WordModuleFactory extends Factory
{
    protected $model = WordModule::class;

    public function definition(): array
    {
        return [
            'level' => fake()->unique()->numberBetween(1, 10),
            'title' => fake()->word(),
        ];
    }
}
