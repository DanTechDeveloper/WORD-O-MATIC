<table cellpadding="0" cellspacing="0" border="0" style="width:100%;font-family:Arial,Helvetica,sans-serif;background:#0b1120;margin:0;padding:32px 16px">
    <tr>
        <td align="center">

            <!-- MAIN CONTAINER -->
            <table cellpadding="0" cellspacing="0" border="0" style="max-width:640px;width:100%;background:#172033;border:2px solid #334155;border-radius:20px;overflow:hidden">

                <!-- HEADER -->
                <tr>
                    <td style="padding:32px 32px 28px;background:#111827;border-bottom:2px solid #334155">

                        <table cellpadding="0" cellspacing="0" border="0" style="width:100%">
                            <tr>

                                <td>
                                    <p style="color:#64748b;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px">
                                        WORD-O-MATIC
                                    </p>

                                    <h1 style="color:#ffffff;font-size:30px;line-height:1.15;font-weight:900;margin:0 0 8px">
                                        {{ $data['name'] }}
                                    </h1>

                                    <p style="color:#94a3b8;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0">
                                        Sector {{ $data['section'] }} &bull; Student Progress Report
                                    </p>
                                </td>

                                <td align="right" valign="top" style="padding-left:16px">

                                    @php
                                        $statusColors = [
                                            'onTrack' => ['bg' => '#22c55e', 'text' => '#052e16', 'label' => 'On Track'],
                                            'atRisk' => ['bg' => '#ef4444', 'text' => '#450a0a', 'label' => 'At Risk'],
                                            'support' => ['bg' => '#f59e0b', 'text' => '#451a03', 'label' => 'Needs Support'],
                                            'needsSupport' => ['bg' => '#f59e0b', 'text' => '#451a03', 'label' => 'Needs Support'],
                                            'in_progress' => ['bg' => '#38bdf8', 'text' => '#082f49', 'label' => 'In Progress'],
                                            'notStarted' => ['bg' => '#64748b', 'text' => '#0f172a', 'label' => 'Not Started'],
                                        ];

                                        $sc = $statusColors[$data['status']] ?? $statusColors['notStarted'];
                                    @endphp

                                    <span style="display:inline-block;background:{{ $sc['bg'] }};color:{{ $sc['text'] }};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.5px;padding:8px 12px;border-radius:20px">
                                        {{ $sc['label'] }}
                                    </span>

                                </td>

                            </tr>
                        </table>

                    </td>
                </tr>


                <!-- PERFORMANCE OVERVIEW -->
                <tr>
                    <td style="padding:30px 32px 0">

                        <p style="color:#64748b;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin:0 0 15px">
                            Performance Overview
                        </p>

                        <table cellpadding="0" cellspacing="0" border="0" style="width:100%">
                            <tr>

                                <!-- WORD BLAST -->
                                <td width="50%" style="padding:0 6px 0 0">

                                    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#0f172a;border:2px solid #334155;border-radius:14px">
                                        <tr>
                                            <td style="padding:20px">

                                                <p style="color:#84cc16;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin:0 0 11px">
                                                    Word Blast
                                                </p>

                                                <p style="color:#ffffff;font-size:38px;line-height:1;font-weight:900;margin:0">
                                                    {{ $data['wordBlastAcc'] ?? 0 }}<span style="color:#64748b;font-size:18px">%</span>
                                                </p>

                                                <p style="color:#64748b;font-size:12px;font-weight:700;margin:9px 0 0">
                                                    Accuracy
                                                </p>

                                            </td>
                                        </tr>
                                    </table>

                                </td>


                                <!-- STORY QUEST -->
                                <td width="50%" style="padding:0 0 0 6px">

                                    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#0f172a;border:2px solid #334155;border-radius:14px">
                                        <tr>
                                            <td style="padding:20px">

                                                <p style="color:#a78bfa;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin:0 0 11px">
                                                    Story Quest
                                                </p>

                                                <p style="color:#ffffff;font-size:38px;line-height:1;font-weight:900;margin:0">
                                                    {{ $data['storyQuestAcc'] ?? 0 }}<span style="color:#64748b;font-size:18px">%</span>
                                                </p>

                                                <p style="color:#64748b;font-size:12px;font-weight:700;margin:9px 0 0">
                                                    Accuracy
                                                </p>

                                            </td>
                                        </tr>
                                    </table>

                                </td>

                            </tr>
                        </table>

                        <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:12px">
                            <tr>
                                <td>
                                    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#0f172a;border:2px solid #f59e0b;border-radius:14px">
                                        <tr>
                                            <td style="padding:20px;text-align:center">
                                                <p style="color:#f59e0b;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin:0 0 11px">
                                                    Final Average
                                                </p>
                                                <p style="color:#ffffff;font-size:38px;line-height:1;font-weight:900;margin:0">
                                                    @if (($data['finalAverage'] ?? null) !== null)
                                                        {{ $data['finalAverage'] }}<span style="color:#64748b;font-size:18px">%</span>
                                                    @else
                                                        <span style="color:#64748b;font-size:20px">N/A</span>
                                                    @endif
                                                </p>
                                                <p style="color:#64748b;font-size:12px;font-weight:700;margin:9px 0 0">
                                                    (Word Blast + Story Quest) / 2
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>

                    </td>
                </tr>


                <!-- CURRICULUM PROGRESS -->
                <tr>
                    <td style="padding:24px 32px 0">

                        <p style="color:#64748b;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin:0 0 15px">
                            Curriculum Progress
                        </p>

                        <table cellpadding="0" cellspacing="0" border="0" style="width:100%">
                            <tr>

                                <!-- WORD BLAST PROGRESS -->
                                <td width="50%" style="padding:0 6px 0 0">

                                    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#111827;border:2px solid #334155;border-radius:14px">
                                        <tr>
                                            <td style="padding:18px">

                                                <table cellpadding="0" cellspacing="0" border="0" style="width:100%">
                                                    <tr>
                                                        <td>
                                                            <p style="color:#84cc16;font-size:11px;font-weight:900;text-transform:uppercase;margin:0 0 7px">
                                                                Word Blast
                                                            </p>
                                                        </td>

                                                        <td align="right">
                                                            <p style="color:#ffffff;font-size:15px;font-weight:900;margin:0">
                                                                {{ $data['wordBlastProg'] ?? 0 }}%
                                                            </p>
                                                        </td>
                                                    </tr>
                                                </table>

                                                <div style="height:8px;background:#334155;border-radius:10px;margin:10px 0 12px">
                                                    <div style="height:8px;background:#84cc16;border-radius:10px;width:{{ min(100, max(0, $data['wordBlastProg'] ?? 0)) }}%"></div>
                                                </div>

                                                <p style="color:#64748b;font-size:12px;margin:0">
                                                    Level {{ $data['read_level'] ?? 1 }}
                                                </p>

                                            </td>
                                        </tr>
                                    </table>

                                </td>


                                <!-- STORY QUEST PROGRESS -->
                                <td width="50%" style="padding:0 0 0 6px">

                                    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#111827;border:2px solid #334155;border-radius:14px">
                                        <tr>
                                            <td style="padding:18px">

                                                <table cellpadding="0" cellspacing="0" border="0" style="width:100%">
                                                    <tr>
                                                        <td>
                                                            <p style="color:#a78bfa;font-size:11px;font-weight:900;text-transform:uppercase;margin:0 0 7px">
                                                                Story Quest
                                                            </p>
                                                        </td>

                                                        <td align="right">
                                                            <p style="color:#ffffff;font-size:15px;font-weight:900;margin:0">
                                                                {{ $data['storyQuestProg'] ?? 0 }}%
                                                            </p>
                                                        </td>
                                                    </tr>
                                                </table>

                                                <div style="height:8px;background:#334155;border-radius:10px;margin:10px 0 12px">
                                                    <div style="height:8px;background:#a78bfa;border-radius:10px;width:{{ min(100, max(0, $data['storyQuestProg'] ?? 0)) }}%"></div>
                                                </div>

                                                <p style="color:#64748b;font-size:12px;margin:0">
                                                    Level {{ $data['speak_level'] ?? 1 }}
                                                </p>

                                            </td>
                                        </tr>
                                    </table>

                                </td>

                            </tr>
                        </table>

                    </td>
                </tr>


                <!-- LATEST BADGE -->
                <tr>
                    <td style="padding:24px 32px 0">

                        <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#1c1917;border:2px solid #92400e;border-radius:14px">
                            <tr>
                                <td style="padding:20px">

                                    <p style="color:#fbbf24;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin:0 0 9px">
                                        Latest Achievement
                                    </p>

                                    @if (!empty($data['latestBadge']) && !empty($data['latestBadge']['name']))

                                        <p style="color:#ffffff;font-size:22px;font-weight:900;margin:0">
                                            {{ $data['latestBadge']['name'] }}
                                        </p>

                                        @if (!empty($data['latestBadge']['earned_at']))
                                            <p style="color:#fbbf24;font-size:11px;font-weight:700;margin:6px 0 0">
                                                Earned {{ \Carbon\Carbon::parse($data['latestBadge']['earned_at'])->format('F j, Y') }}
                                            </p>
                                        @endif

                                    @else

                                        <p style="color:#64748b;font-size:20px;font-weight:900;margin:0">
                                            No badge earned yet
                                        </p>

                                    @endif

                                </td>
                            </tr>
                        </table>

                    </td>
                </tr>


                <!-- ================================= -->
                <!-- WORD BLAST TRAINING ZONE -->
                <!-- ================================= -->

                @if (!empty($data['trainingWords']) && count($data['trainingWords']) > 0)

                    <tr>
                        <td style="padding:34px 32px 0">

                            <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#111827;border:2px solid #334155;border-radius:16px">

                                <tr>
                                    <td style="padding:24px">

                                        <p style="color:#fbbf24;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin:0 0 7px">
                                            Training Zone
                                        </p>

                                        <h2 style="color:#ffffff;font-size:21px;font-weight:900;margin:0 0 13px">
                                            Word Blast
                                        </h2>

                                        <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0 0 12px">
                                            Words that are not mastered yet.
                                        </p>

                                        <p style="color:#94a3b8;font-size:13px;line-height:1.65;margin:0 0 17px">
                                            These words are still being learned. Attempts show the student's recorded practice history, not a recommended number of repetitions.
                                        </p>

                                        <div style="border-top:1px solid #334155;margin:0 0 18px"></div>


                                        @foreach ($data['trainingWords'] as $moduleTitle => $words)

                                            <p style="color:#64748b;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.8px;margin:0 0 10px">
                                                {{ $moduleTitle }}
                                            </p>

                                            @php
                                                $threshold = \App\Services\ReportService::NEEDS_ATTENTION_ATTEMPTS;

                                                $practicing = [];
                                                $needing = [];

                                                foreach ($words as $word) {
                                                    $tries = $data['wordAttempts'][$word] ?? 0;

                                                    if ($tries >= $threshold) {
                                                        $needing[] = [$word, $tries];
                                                    } else {
                                                        $practicing[] = [$word, $tries];
                                                    }
                                                }
                                            @endphp


                                            <!-- STILL PRACTICING -->
                                            @if (count($practicing) > 0)

                                                <p style="color:#64748b;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 9px">
                                                    Still Practicing
                                                </p>

                                                <div style="margin:0 0 17px">

                                                    @foreach ($practicing as [$word, $tries])

                                                        <span style="display:inline-block;background:#1e293b;color:#e2e8f0;font-size:14px;font-weight:700;padding:8px 11px;border-radius:12px;border:1px solid #475569;margin:0 5px 7px 0">

                                                            {{ $word }}<br>

                                                            <span style="color:#94a3b8;font-size:11px;font-weight:600">
                                                                {{ $tries }}
                                                                recorded attempt{{ $tries === 1 ? '' : 's' }}
                                                            </span>

                                                        </span>

                                                    @endforeach

                                                </div>

                                            @endif


                                            <!-- NEEDS MORE PRACTICE -->
                                            @if (count($needing) > 0)

                                                <p style="color:#fbbf24;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 9px">
                                                    Needs More Practice
                                                </p>

                                                <div style="margin:0 0 20px">

                                                    @foreach ($needing as [$word, $tries])

                                                        <span style="display:inline-block;background:#451a03;color:#fbbf24;font-size:14px;font-weight:700;padding:8px 11px;border-radius:12px;border:1px solid #f59e0b;margin:0 5px 7px 0">

                                                            {{ $word }}<br>

                                                            <span style="font-size:11px;font-weight:600">
                                                                {{ $tries }} recorded attempts &middot; Not yet mastered
                                                            </span>

                                                        </span>

                                                    @endforeach

                                                </div>

                                            @endif

                                        @endforeach

                                    </td>
                                </tr>

                            </table>

                        </td>
                    </tr>

                @endif


                <!-- ================================= -->
                <!-- STORY QUEST TRAINING ZONE -->
                <!-- ================================= -->

                @if (!empty($data['paragraphTrainingWords']) && count($data['paragraphTrainingWords']) > 0)

                    <tr>
                        <td style="padding:22px 32px 0">

                            <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#111827;border:2px solid #334155;border-radius:16px">

                                <tr>
                                    <td style="padding:24px">

                                        <p style="color:#a78bfa;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin:0 0 7px">
                                            Training Zone
                                        </p>

                                        <h2 style="color:#ffffff;font-size:21px;font-weight:900;margin:0 0 13px">
                                            Story Quest
                                        </h2>

                                        <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0 0 12px">
                                            Sentences that are not mastered yet. A sentence is mastered only when every word in it is mastered.
                                        </p>

                                        <p style="color:#94a3b8;font-size:13px;line-height:1.65;margin:0 0 17px">
                                            These sentences are still being learned. Attempts show summed word attempts for that sentence (recorded practice history, not a recommended number of repetitions).
                                        </p>

                                        <div style="border-top:1px solid #334155;margin:0 0 18px"></div>


                                        @foreach ($data['paragraphTrainingWords'] as $moduleTitle => $sentences)

                                            <p style="color:#64748b;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.8px;margin:0 0 10px">
                                                {{ $moduleTitle }}
                                            </p>

                                            @php
                                                $threshold = \App\Services\ReportService::NEEDS_ATTENTION_ATTEMPTS;

                                                $practicing = [];
                                                $needing = [];

                                                foreach ($sentences as $sentence) {
                                                    $tries = $data['paragraphWordAttempts'][$sentence] ?? 0;

                                                    if ($tries >= $threshold) {
                                                        $needing[] = [$sentence, $tries];
                                                    } else {
                                                        $practicing[] = [$sentence, $tries];
                                                    }
                                                }
                                            @endphp


                                            <!-- STILL PRACTICING -->
                                            @if (count($practicing) > 0)

                                                <p style="color:#64748b;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 9px">
                                                    Still Practicing
                                                </p>

                                                <div style="margin:0 0 17px">

                                                    @foreach ($practicing as [$sentence, $tries])

                                                        <span style="display:block;background:#1e293b;color:#e2e8f0;font-size:14px;font-weight:700;padding:10px 12px;border-radius:12px;border:1px solid #475569;margin:0 0 7px 0">

                                                            {{ $sentence }}<br>

                                                            <span style="color:#94a3b8;font-size:11px;font-weight:600">
                                                                {{ $tries }}
                                                                recorded attempt{{ $tries === 1 ? '' : 's' }}
                                                            </span>

                                                        </span>

                                                    @endforeach

                                                </div>

                                            @endif


                                            <!-- NEEDS MORE PRACTICE -->
                                            @if (count($needing) > 0)

                                                <p style="color:#fbbf24;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 9px">
                                                    Needs More Practice
                                                </p>

                                                <div style="margin:0 0 20px">

                                                    @foreach ($needing as [$sentence, $tries])

                                                        <span style="display:block;background:#451a03;color:#fbbf24;font-size:14px;font-weight:700;padding:10px 12px;border-radius:12px;border:1px solid #f59e0b;margin:0 0 7px 0">

                                                            {{ $sentence }}<br>

                                                            <span style="font-size:11px;font-weight:600">
                                                                {{ $tries }} recorded attempts &middot; Not yet mastered
                                                            </span>

                                                        </span>

                                                    @endforeach

                                                </div>

                                            @endif

                                        @endforeach

                                    </td>
                                </tr>

                            </table>

                        </td>
                    </tr>

                @endif


                <!-- ================================= -->
                <!-- RECOMMENDATION -->
                <!-- ================================= -->

                <tr>
                    <td style="padding:34px 32px">

                        @if ($data['status'] === 'onTrack')

                            <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#052e16;border:2px solid #22c55e;border-radius:14px">
                                <tr>
                                    <td style="padding:22px;text-align:center">

                                        <p style="color:#86efac;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin:0 0 9px">
                                            Recommendation
                                        </p>

                                        <p style="color:#ffffff;font-size:15px;line-height:1.6;font-weight:700;margin:0">
                                            Strong performance. Continue regular practice and work toward completing the remaining modules.
                                        </p>

                                    </td>
                                </tr>
                            </table>

                        @elseif ($data['status'] === 'needsSupport' || $data['status'] === 'support')

                            <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#451a03;border:2px solid #f59e0b;border-radius:14px">
                                <tr>
                                    <td style="padding:22px;text-align:center">

                                        <p style="color:#fbbf24;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin:0 0 9px">
                                            Recommendation
                                        </p>

                                        <p style="color:#ffffff;font-size:15px;line-height:1.6;font-weight:700;margin:0">
                                            Regular practice on both reading and speaking skills should help move the student back on track.
                                        </p>

                                    </td>
                                </tr>
                            </table>

                        @elseif ($data['status'] === 'atRisk')

                            <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#450a0a;border:2px solid #ef4444;border-radius:14px">
                                <tr>
                                    <td style="padding:22px;text-align:center">

                                        <p style="color:#fca5a5;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin:0 0 9px">
                                            Recommendation
                                        </p>

                                        <p style="color:#ffffff;font-size:15px;line-height:1.6;font-weight:700;margin:0">
                                            Performance requires additional support. A focused practice or intervention session is recommended.
                                        </p>

                                    </td>
                                </tr>
                            </table>

                        @elseif ($data['status'] === 'in_progress')

                            <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#082f49;border:2px solid #38bdf8;border-radius:14px">
                                <tr>
                                    <td style="padding:22px;text-align:center">

                                        <p style="color:#7dd3fc;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin:0 0 9px">
                                            Recommendation
                                        </p>

                                        <p style="color:#ffffff;font-size:15px;line-height:1.6;font-weight:700;margin:0">
                                            Progress is underway. Completing both reading and speaking activities will advance the student through the curriculum.
                                        </p>

                                    </td>
                                </tr>
                            </table>

                        @elseif ($data['status'] === 'notStarted')

                            <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#111827;border:2px solid #64748b;border-radius:14px">
                                <tr>
                                    <td style="padding:22px;text-align:center">

                                        <p style="color:#94a3b8;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin:0 0 9px">
                                            Recommendation
                                        </p>

                                        <p style="color:#ffffff;font-size:15px;line-height:1.6;font-weight:700;margin:0">
                                            Encourage the student to begin Word Blast and Story Quest activities.
                                        </p>

                                    </td>
                                </tr>
                            </table>

                        @endif

                    </td>
                </tr>


                <!-- FOOTER -->
                <tr>
                    <td style="padding:0 32px 30px">

                        <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-top:1px solid #334155">

                            <tr>
                                <td style="padding-top:20px;text-align:center">

                                    <p style="color:#475569;font-size:11px;line-height:1.5;margin:0">
                                        Word-O-Matic &bull; Student Progress Report
                                    </p>

                                    <p style="color:#334155;font-size:11px;margin:6px 0 0">
                                        As of {{ $data['reported_at'] }}
                                    </p>

                                </td>
                            </tr>

                        </table>

                    </td>
                </tr>

            </table>

        </td>
    </tr>
</table>