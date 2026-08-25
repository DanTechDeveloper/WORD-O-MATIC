<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class ReportsExport implements WithMultipleSheets
{
    protected array $students;

    public function __construct(array $students)
    {
        $this->students = $students;
    }

    public function sheets(): array
    {
        return [
            'Student Progress Summary' => new SkillsOverviewSheet($this->students),
            'Words Needing Practice' => new SkillsWordsSheet($this->students),
            'Class Summary' => new ClassReportSheet($this->students)
        ];
    }
}
