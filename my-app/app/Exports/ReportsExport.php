<?php

namespace App\Exports;

use Maatwebsite\Excel\Concern\WithMultipleSheets;

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
            'Class Report' => new ClassReportSheet($this->students),
            'Training Words Detail' => new TrainingWordsSheet($this->students),
        ];
    }
}
