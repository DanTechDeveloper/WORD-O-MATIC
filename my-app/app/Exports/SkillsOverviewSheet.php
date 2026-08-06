<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class SkillsOverviewSheet implements FromCollection, WithColumnWidths, WithHeadings, WithStyles
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
            'Final Status',
            'Word Blast',
            'Story Quest',
        ];
    }

    public function collection()
    {
        return collect($this->students)->map(fn ($s) => [
            $s['name'] ?? '',
            $s['student_id'] ?? '',
            $s['section'] ?? '',
            $s['status'] ?? 'notStarted',
            ($s['wordBlastAcc'] ?? 0).'% ('.($s['wbLevelLabel'] ?? "Level {$s['read_level']}").')',
            ($s['storyQuestAcc'] ?? 0).'% ('.($s['sqLevelLabel'] ?? "Level {$s['speak_level']}").')',
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
            'D' => 18,
            'E' => 42,
            'F' => 42,
        ];
    }
}
