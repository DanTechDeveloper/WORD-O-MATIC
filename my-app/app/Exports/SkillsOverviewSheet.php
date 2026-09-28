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
            'Final Average',
            'Top Struggle',
            'Hardest WB Module',
            'Hardest SQ Module',
        ];
    }

    public function collection()
    {
        // Label only, no attempt count: "Top Struggle" (column H) and the
        // "Words Needing Practice" sheet already name each struggling word with
        // its count, so repeating the total one level up is noise. Null when the
        // student has no training rows — an empty cell, never a fake 0.
        $hardest = static fn (?array $m): string => $m['level'] ?? '';

        return collect($this->students)->map(function ($s) use ($hardest) {
            $fa = $s['finalAverage'] ?? null;
            if ($fa === null && isset($s['wordBlastAcc'], $s['storyQuestAcc'])) {
                $wb = (float) $s['wordBlastAcc'];
                $sq = (float) $s['storyQuestAcc'];
                $fa = ($wb == 0 || $sq == 0) ? null : (int) round(($wb + $sq) / 2);
            }
            return [
                $s['name'] ?? '',
                $s['student_id'] ?? '',
                $s['section'] ?? '',
                $s['status'] ?? 'notStarted',
                ($s['wordBlastAcc'] ?? 0).'% ('.($s['wbLevelLabel'] ?? "Level {$s['read_level']}").')',
                ($s['storyQuestAcc'] ?? 0).'% ('.($s['sqLevelLabel'] ?? "Level {$s['speak_level']}").')',
                $fa !== null ? $fa.'%' : 'N/A',
                $s['topStruggle'] ?? '',
                $hardest($s['hardestWordModule'] ?? null),
                $hardest($s['hardestStoryModule'] ?? null),
            ];
        });
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
            'G' => 15,
            'H' => 30,
            // Appended, never inserted — columnWidths is keyed by letter, so
            // inserting a column would silently misalign every width after it.
            'I' => 34,
            'J' => 34,
        ];
    }
}
