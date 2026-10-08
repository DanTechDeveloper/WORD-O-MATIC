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
            'Struggle Summary' => new StruggleSummarySheet($this->students),
            'Session History' => new SessionHistorySheet($this->students),
            'Hardest Words - Story Quest' => new SquHardestWordSheet($this->students),
        ];
    }
}
