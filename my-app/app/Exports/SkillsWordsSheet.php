<?php

namespace App\Exports;

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
            'Word Blast Mastered',
            'Word Blast Training',
            'Story Quest Mastered',
            'Story Quest Training',
        ];
    }

    public function collection()
    {
        return collect($this->students)->map(fn ($s) => [
            $s['name'] ?? '',
            $this->formatWords($s['masteredWords'] ?? []),
            $this->formatWords($s['trainingWords'] ?? []),
            $this->formatWords($s['paragraphMasteredWords'] ?? []),
            $this->formatWords($s['paragraphTrainingWords'] ?? []),
        ]);
    }

    private function formatWords(array $wordsByLevel): string
    {
        $lines = [];

        foreach ($wordsByLevel as $moduleLabel => $words) {
            $levelLabel = preg_replace('/:.*$/', '', $moduleLabel);
            $lines[] = $levelLabel.' - '.implode(', ', $words);
        }

        return implode("\n", $lines);
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
            'B' => 45,
            'C' => 45,
            'D' => 45,
            'E' => 45,
        ];
    }
}
