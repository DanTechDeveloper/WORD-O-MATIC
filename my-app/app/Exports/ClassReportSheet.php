<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class ClassReportSheet implements FromCollection, WithHeadings, WithStyles, WithColumnWidths
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
            'Word Blast Accuracy (%)',
            'Story Quest Accuracy (%)',
            'Read Level',
            'Speak Level',
            'Parent Email',
            'Report Sent At',
        ];
    }

    public function collection()
    {
        return collect($this->students)->map(fn ($s) => [
            $s['name'] ?? '',
            $s['section'] ?? '',
            $s['status'] ?? '',
            $s['wordBlastAcc'] ?? 0,
            $s['storyQuestAcc'] ?? 0,
            $s['read_level'] ?? 1,
            $s['speak_level'] ?? 1,
            $s['parent_email'] ?? '',
            $s['report_sent_at'] ? \Carbon\Carbon::parse($s['report_sent_at'])->format('M j, Y g:i A') : '',
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
            'C' => 18,
            'D' => 22,
            'E' => 22,
            'F' => 14,
            'G' => 14,
            'H' => 30,
            'I' => 25,
        ];
    }
}
