<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithCharts;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Chart\Chart;
use PhpOffice\PhpSpreadsheet\Chart\DataSeries;
use PhpOffice\PhpSpreadsheet\Chart\DataSeriesValues;
use PhpOffice\PhpSpreadsheet\Chart\Legend;
use PhpOffice\PhpSpreadsheet\Chart\PlotArea;
use PhpOffice\PhpSpreadsheet\Chart\Title;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ClassReportSheet implements FromCollection, WithHeadings, WithStyles, WithColumnWidths, WithCharts
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
            '',
            'Status Category',
            'Count',
        ];
    }

    public function collection()
    {
        $summaryCategories = [
            ['label' => 'On Track', 'key' => 'onTrack'],
            ['label' => 'Needs Support', 'key' => 'needsSupport'],
            ['label' => 'At Risk', 'key' => 'atRisk'],
            ['label' => 'In Progress', 'key' => 'in_progress'],
            ['label' => 'Not Started', 'key' => 'notStarted'],
        ];

        $statusCounts = [
            'onTrack' => 0,
            'needsSupport' => 0,
            'atRisk' => 0,
            'in_progress' => 0,
            'notStarted' => 0,
        ];

        foreach ($this->students as $s) {
            $st = $s['status'] ?? 'notStarted';
            if (isset($statusCounts[$st])) {
                $statusCounts[$st]++;
            } else {
                $statusCounts['notStarted']++;
            }
        }

        $rows = [];
        $maxRows = max(count($this->students), count($summaryCategories));

        for ($i = 0; $i < $maxRows; $i++) {
            $student = $this->students[$i] ?? null;
            $summary = $summaryCategories[$i] ?? null;

            $rows[] = [
                $student ? ($student['name'] ?? '') : '',
                $student ? ($student['section'] ?? '') : '',
                $student ? ($student['status'] ?? '') : '',
                $student ? ($student['wordBlastAcc'] ?? 0) : '',
                $student ? ($student['storyQuestAcc'] ?? 0) : '',
                $student ? ($student['read_level'] ?? 1) : '',
                $student ? ($student['speak_level'] ?? 1) : '',
                $student ? ($student['parent_email'] ?? '') : '',
                $student && ! empty($student['report_sent_at'])
                    ? \Carbon\Carbon::parse($student['report_sent_at'])->format('M j, Y g:i A')
                    : '',
                '',
                $summary ? $summary['label'] : '',
                $summary ? ($statusCounts[$summary['key']] ?? 0) : '',
            ];
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
            'C' => 18,
            'D' => 22,
            'E' => 22,
            'F' => 14,
            'G' => 14,
            'H' => 30,
            'I' => 25,
            'J' => 5,
            'K' => 20,
            'L' => 12,
        ];
    }

    public function charts()
    {
        $studentCount = max(count($this->students), 1);
        $studentEndRow = $studentCount + 1;

        // 1. Pie Chart for Class Health Distribution (K2:L6 summary)
        $categoriesPie = [
            new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_STRING, "'Class Report'!\$K\$2:\$K\$6", null, 5),
        ];
        $valuesPie = [
            new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_NUMBER, "'Class Report'!\$L\$2:\$L\$6", null, 5),
        ];

        $seriesPie = new DataSeries(
            DataSeries::TYPE_PIECHART,
            null,
            range(0, count($valuesPie) - 1),
            [],
            $categoriesPie,
            $valuesPie
        );

        $plotAreaPie = new PlotArea(null, [$seriesPie]);
        $legendPie = new Legend(Legend::POSITION_RIGHT, null, false);
        $titlePie = new Title('Class Health Distribution');

        $pieChart = new Chart('health_pie_chart', $titlePie, $legendPie, $plotAreaPie);
        $pieChart->setTopLeftCell('N2');
        $pieChart->setBottomRightCell('V16');

        // 2. Bar (Column) Chart for Student Accuracies (A2:A{N} vs D2:D{N} & E2:E{N})
        $categoriesBar = [
            new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_STRING, "'Class Report'!\$A\$2:\$A\$" . $studentEndRow, null, $studentCount),
        ];
        $labelsBar = [
            new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_STRING, "'Class Report'!\$D\$1", null, 1),
            new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_STRING, "'Class Report'!\$E\$1", null, 1),
        ];
        $valuesBar = [
            new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_NUMBER, "'Class Report'!\$D\$2:\$D\$" . $studentEndRow, null, $studentCount),
            new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_NUMBER, "'Class Report'!\$E\$2:\$E\$" . $studentEndRow, null, $studentCount),
        ];

        $seriesBar = new DataSeries(
            DataSeries::TYPE_BARCHART,
            DataSeries::GROUPING_STANDARD,
            range(0, count($valuesBar) - 1),
            $labelsBar,
            $categoriesBar,
            $valuesBar
        );
        $seriesBar->setPlotDirection(DataSeries::DIRECTION_COL);

        $plotAreaBar = new PlotArea(null, [$seriesBar]);
        $legendBar = new Legend(Legend::POSITION_TOPRIGHT, null, false);
        $titleBar = new Title('Student Accuracy Comparison (%)');

        $barChart = new Chart('accuracy_bar_chart', $titleBar, $legendBar, $plotAreaBar);
        $barChart->setTopLeftCell('N18');
        $barChart->setBottomRightCell('V35');

        return [$pieChart, $barChart];
    }
}
