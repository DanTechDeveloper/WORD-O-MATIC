<?php

namespace App\Exports;

use App\Models\GameSession;
use App\Models\ParagraphModule;
use App\Models\WordModule;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class SessionHistorySheet implements FromCollection, WithColumnWidths, WithHeadings, WithStyles
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
            'Date/Time Played',
            'Mode',
            'Level',
            'Score',
            'Accuracy (%)',
            'Streak',
        ];
    }

    public function collection()
    {
        $tutorialWordIds = WordModule::where('is_tutorial', true)->pluck('id')->all();
        $tutorialParaIds = ParagraphModule::where('is_tutorial', true)->pluck('id')->all();

        // ponytail: preload modules once — was ::find() per session row (N+1 on export).
        $wordModules = WordModule::select('id', 'level', 'title')->get()->keyBy('id');
        $paraModules = ParagraphModule::select('id', 'level', 'title')->get()->keyBy('id');

        $rows = GameSession::with('user')->orderByDesc('created_at')->get()->map(function ($session) use ($tutorialWordIds, $tutorialParaIds, $wordModules, $paraModules) {
            if (($session->module_type === 'word' && in_array($session->module_id, $tutorialWordIds, true))
                || ($session->module_type === 'paragraph' && in_array($session->module_id, $tutorialParaIds, true))) {
                return null;
            }

            $user = $session->user;
            $module = $session->module_type === 'word'
                ? ($wordModules[$session->module_id] ?? null)
                : ($paraModules[$session->module_id] ?? null);

            $levelLabel = $module
                ? 'Level '.$module->level.' - '.$module->title
                : 'Module #'.$session->module_id;

            return [
                $user->name ?? '',
                $user->student_id ?? '',
                $user->student?->section ?? '',
                $session->created_at?->format('F j, Y g:i A') ?? '',
                $session->module_type === 'word' ? 'Word Blast' : 'Story Quest',
                $levelLabel,
                $session->score,
                $session->accuracy,
                $session->streak,
            ];
        })->filter()->values();

        return $rows;
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
            'D' => 20,
            'E' => 16,
            'F' => 30,
            'G' => 10,
            'H' => 14,
            'I' => 10,
        ];
    }
}
