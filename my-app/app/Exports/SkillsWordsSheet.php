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
            'Mode',
            'Level',
            'Word',
            'Verdict',
            'Attempts',
        ];
    }

    public function collection()
    {
        // One row per WORD, both modes. Story Quest used to export one row per
        // SENTENCE, which hid the actual problem; the module (Level) already
        // answers "where", so there is no Sentence column — a teacher
        // reteaching a word needs the word and the module, not the full line.
        //
        // Only rows at/over the shared struggle threshold: the sheet is named
        // "Words Needing Practice", so a 0-2 attempt row is not one, and
        // exporting every still-training word is what made this tab unreadable
        // (hundreds of rows, none of them actionable). Sub-threshold words stay
        // visible in the parent email and StudentDetails.
        //
        // The Verdict column is the sort handle — it is the same
        // ReportService::verdict() the email and the teacher page read, so
        // "Needs Attention" means one thing in all three surfaces.
        //
        // Student ID and Section are dropped: a student contributes dozens of
        // rows, so both repeated identically down the page, and the name is
        // already unique (login is name + PIN, pinIsTaken() rejects a dup name).
        return collect($this->students)->flatMap(function ($s) {
            return collect($s['struggleRows'] ?? [])
                ->filter(fn ($row) => $row['attempts'] >= ReportService::NEEDS_ATTENTION_ATTEMPTS)
                ->map(fn ($row) => [
                    $s['name'] ?? '',
                    $row['mode'],
                    $row['level'],
                    $row['word'],
                    ReportService::verdictLabel($row['verdict'] ?? ReportService::VERDICT_NEEDS_ATTENTION),
                    $row['attempts'],
                ])
                ->all();
        });
    }

    public function styles(Worksheet $sheet)
    {
        // No per-row highlight: every exported row is at/over the threshold, so a
        // red band per row would flag the whole sheet and discriminate nothing.
        // The Verdict column carries the distinction instead.
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
            'B' => 16,
            'C' => 22,
            'D' => 20,
            'E' => 20,
            'F' => 10,
        ];
    }
}
