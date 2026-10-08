<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class SquHardestWordSheet implements FromCollection, WithColumnWidths, WithHeadings, WithStyles
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
            'Hardest Module (Story Quest)',
            'Hardest Word (Story Quest)',
            'Recorded Attempts',
        ];
    }

    public function collection()
    {
        return collect($this->students)->map(fn ($s) => [
            $s['name'] ?? '',
            $s['hardestSqModule'] ?? 'N/A',
            $s['hardestSqWord'] ?? 'N/A',
            $s['hardestSqAttempts'] ?? 0,
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
            'B' => 32,
            'C' => 28,
            'D' => 18,
        ];
    }
}
