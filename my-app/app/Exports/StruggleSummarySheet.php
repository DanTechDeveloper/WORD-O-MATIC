<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class StruggleSummarySheet implements FromCollection, WithColumnWidths, WithHeadings, WithStyles
{
    protected array $students;

    public function __construct(array $students)
    {
        $this->students = $students;
    }

    public function headings(): array
    {
        return [
            'Student Name',
            'Student ID',
            'Section',
            'Hardest Module (Word Blast)',
            'Hardest Word (Word Blast)',
        ];
    }

    public function collection()
    {
        return collect($this->students)->map(fn ($s) => [
            $s['name'] ?? '',
            $s['student_id'] ?? '',
            $s['section'] ?? '',
            $s['hardestWbModule'] ?? 'N/A',
            $s['hardestWbWord'] ?? 'N/A',
        ]);
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '475569']],
                'fontColor' => ['rgb' => 'FFFFFF'],
            ],
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 25,
            'B' => 15,
            'C' => 15,
            'D' => 32,
            'E' => 28,
        ];
    }
}
