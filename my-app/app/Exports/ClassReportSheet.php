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

class ClassReportSheet implements FromCollection, WithCharts, WithColumnWidths, WithHeadings, WithStyles
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
            'Word Blast Accuracy (%)',
            'Story Quest Accuracy (%)',
            'Final Average (%)',
            'Status Category',
            'Count',
        ];
    }

    public function collection()
    {
        $labelByKey = [
            'onTrack' => 'On Track',
            'support' => 'Needs Support',
            'atRisk' => 'At Risk',
            'in_progress' => 'In Progress',
            'notStarted' => 'Not Started',
        ];

        $statusCounts = [
            'onTrack' => 0,
            'support' => 0,
            'atRisk' => 0,
            'in_progress' => 0,
            'notStarted' => 0,
        ];

        foreach ($this->students as $s) {
            $st = $s['status'] ?? 'notStarted';
            if (! isset($labelByKey[$st])) {
                $st = 'notStarted';
            }
            $statusCounts[$st]++;
        }

        // Per-student roster: each row shows the student's own status category.
        $rows = [];
        foreach ($this->students as $s) {
            $st = $s['status'] ?? 'notStarted';
            $fa = $s['finalAverage'] ?? null;
            if ($fa === null && isset($s['wordBlastAcc'], $s['storyQuestAcc'])) {
                $wb = (float) $s['wordBlastAcc'];
                $sq = (float) $s['storyQuestAcc'];
                $fa = ($wb == 0 || $sq == 0) ? null : (int) round(($wb + $sq) / 2);
            }
            $rows[] = [
                $s['name'] ?? '',
                $s['wordBlastAcc'] ?? 0,
                $s['storyQuestAcc'] ?? 0,
                $fa ?? 'N/A',
                $labelByKey[$st] ?? 'Not Started',
                '', // Count applies only to the summary block below
            ];
        }

        // Class-health summary block (feeds the pie chart), placed below the roster.
        $rows[] = ['', '', '', '', '', ''];
        $rows[] = ['Class Health Summary', '', '', '', '', ''];

        foreach (['onTrack', 'support', 'atRisk', 'in_progress', 'notStarted'] as $key) {
            $rows[] = [
                '',
                '',
                '',
                '',
                $labelByKey[$key],
                $statusCounts[$key],
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
            'B' => 22,
            'C' => 22,
            'D' => 15,
            'E' => 20,
            'F' => 12,
        ];
    }

    public function charts()
    {
        $studentCount = max(count($this->students), 1);
        $studentEndRow = $studentCount + 1;
        // Summary block sits below the roster: a spacer + header row push the
        // 5 category rows to Excel rows $studentCount+4 .. +8 (feeds the pie).
        $summaryStart = $studentCount + 4;
        $summaryEnd = $summaryStart + 4;

        // 1. Pie Chart for Class Health Distribution (summary block below roster)
        $categoriesPie = [
            new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_STRING, "'Class Summary'!\$E\$" . $summaryStart . ':$E$' . $summaryEnd, null, 5),
        ];
        $valuesPie = [
            new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_NUMBER, "'Class Summary'!\$F\$" . $summaryStart . ':$F$' . $summaryEnd, null, 5),
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
            new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_STRING, "'Class Summary'!\$A\$2:\$A\$".$studentEndRow, null, $studentCount),
        ];
        $labelsBar = [
            new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_STRING, "'Class Summary'!\$B\$1", null, 1),
            new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_STRING, "'Class Summary'!\$C\$1", null, 1),
        ];
        $valuesBar = [
            new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_NUMBER, "'Class Summary'!\$B\$2:\$B\$".$studentEndRow, null, $studentCount),
            new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_NUMBER, "'Class Summary'!\$C\$2:\$C\$".$studentEndRow, null, $studentCount),
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
