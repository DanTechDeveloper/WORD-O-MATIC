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
            'Top Struggle',
        ];
    }

    public function collection()
    {
        // Label only, no attempt count: "Top Struggle" (column G) and the
        // "Words Needing Practice" sheet already name each struggling word with
        // its count, so repeating the total one level up is noise.
        //
        // Final Average and the two Hardest Module columns are NOT here either:
        // the average is the arithmetic of the two accuracy columns beside it
        // (and already a column on Class Summary), and hardest-module re-ranks
        // the same training words the drill-down sheet lists one by one.
        return collect($this->students)->map(fn ($s) => [
            $s['name'] ?? '',
            $s['student_id'] ?? '',
            $s['section'] ?? '',
            $s['status'] ?? 'notStarted',
            ($s['wordBlastAcc'] ?? 0).'% ('.($s['wbLevelLabel'] ?? "Level {$s['read_level']}").')',
            ($s['storyQuestAcc'] ?? 0).'% ('.($s['sqLevelLabel'] ?? "Level {$s['speak_level']}").')',
            $s['topStruggle'] ?? '',
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
            // E/F stay wide: the accuracy and level live in one cell, e.g.
            // "85% (Level 3 - Phonics Fundamentals)".
            'E' => 42,
            'F' => 42,
            'G' => 30,
        ];
    }
}
