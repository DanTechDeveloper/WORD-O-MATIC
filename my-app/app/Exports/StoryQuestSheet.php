<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class StoryQuestSheet implements FromCollection, WithColumnWidths, WithHeadings, WithStyles
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
            'Status',
            'Accuracy (%)',
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
            $status = $s['status'] ?? 'notStarted';
            $accuracy = $s['storyQuestAcc'] ?? 0;

            $words = $s['paragraphTrainingWords'] ?? [];

            if (! empty($words)) {
                foreach ($words as $moduleTitle => $moduleWords) {
                    $rows[] = [
                        $name,
                        $section,
                        $status,
                        $accuracy,
                        $moduleTitle,
                        implode(', ', $moduleWords),
                        count($moduleWords),
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
            'D' => 15,
            'E' => 28,
            'F' => 40,
            'G' => 12,
        ];
    }
}
