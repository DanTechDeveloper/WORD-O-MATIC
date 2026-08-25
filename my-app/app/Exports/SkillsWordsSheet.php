<?php

namespace App\Exports;

use App\Services\ReportService;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class SkillsWordsSheet implements FromCollection, WithColumnWidths, WithHeadings, WithStyles
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
            'Mode',
            'Level',
            'Word',
            'Attempts',
        ];
    }

    public function collection()
    {
        return collect($this->students)->flatMap(function ($s) {
            return collect($s['struggleRows'] ?? [])
                ->map(fn ($row) => [
                    $s['name'] ?? '',
                    $s['student_id'] ?? '',
                    $s['section'] ?? '',
                    $row['mode'],
                    $row['level'],
                    $row['word'],
                    $row['attempts'],
                ])
                ->all();
        });
    }

    public function styles(Worksheet $sheet)
    {
        $styles = [
            1 => [
                'font' => ['bold' => true],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '475569']],
                'fontColor' => ['rgb' => 'FFFFFF'],
            ],
        ];

        // Red-flag rows at/over the shared struggle threshold — the same band
        // the parent email's "Needs More Practice" section uses. Rows arrive
        // pre-sorted attempts-desc from the controller; +1 offsets the heading.
        $row = 2;

        foreach ($this->students as $s) {
            foreach ($s['struggleRows'] ?? [] as $r) {
                if ($r['attempts'] >= ReportService::NEEDS_ATTENTION_ATTEMPTS) {
                    $styles[$row] = [
                        'font' => ['bold' => true],
                        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'FEE2E2']],
                    ];
                }

                $row++;
            }
        }

        return $styles;
    }

    public function columnWidths(): array
    {
        return [
            'A' => 25,
            'B' => 14,
            'C' => 14,
            'D' => 16,
            'E' => 22,
            'F' => 16,
            'G' => 10,
        ];
    }
}
