<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class TrainingWordsSheet implements FromCollection, WithHeadings, WithStyles, WithColumnWidths
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
            'Section',
            'Mode',
            'Module',
            'Training Words',
            'Word Count',
        ];
    }

    public function collection()
    {
        $rows = [];

        foreach ($this->students as $s) {
            $name = $s['name'] ?? '';
            $section = $s['section'] ?? '';

            if (!empty($s['trainingWords'])) {
                foreach ($s['trainingWords'] as $moduleTitle => $words) {
                    $rows[] = [
                        $name,
                        $section,
                        'Word Blast',
                        $moduleTitle,
                        implode(', ', $words),
                        count($words),
                    ];
                }
            }

            if (!empty($s['paragraphTrainingWords'])) {
                foreach ($s['paragraphTrainingWords'] as $moduleTitle => $words) {
                    $rows[] = [
                        $name,
                        $section,
                        'Story Quest',
                        $moduleTitle,
                        implode(', ', $words),
                        count($words),
                    ];
                }
            }
        }

        return collect($rows);
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
            'C' => 14,
            'D' => 28,
            'E' => 40,
            'F' => 12,
        ];
    }
}
