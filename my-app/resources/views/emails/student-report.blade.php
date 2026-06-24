<table cellpadding="0" cellspacing="0" style="width:100%;font-family:Arial,Helvetica,sans-serif;background:#0f172a;padding:40px 20px">
    <tr>
        <td align="center">
            <table cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1e293b;border-radius:24px;overflow:hidden;border:4px solid #334155">
                <tr>
                    <td style="padding:40px">
                        <h1 style="color:#fff;font-size:28px;font-weight:900;text-transform:uppercase;font-style:italic;margin:0 0 8px;letter-spacing:-1px">
                            {{ $data['name'] }}
                        </h1>
                        <p style="color:#64748b;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin:0 0 32px">
                            Sector {{ $data['section'] }} &bull; Student Report
                        </p>

                        <div style="margin-bottom:32px">
                            @php
                                $statusColors = [
                                    'onTrack' => ['bg' => '#22c55e', 'label' => 'On Track'],
                                    'atRisk' => ['bg' => '#ef4444', 'label' => 'At Risk'],
                                    'support' => ['bg' => '#f59e0b', 'label' => 'Needs Support'],
                                    'notStarted' => ['bg' => '#64748b', 'label' => 'Not Started'],
                                ];
                                $sc = $statusColors[$data['status']] ?? $statusColors['notStarted'];
                            @endphp
                            <span style="display:inline-block;background:{{ $sc['bg'] }};color:#020617;font-weight:900;font-size:14px;text-transform:uppercase;padding:8px 20px;border-radius:100px;border:3px solid #020617">
                                {{ $sc['label'] }}
                            </span>
                        </div>

                        <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:32px">
                            <tr>
                                <td style="padding:8px 0">
                                    <table cellpadding="0" cellspacing="0" style="width:100%">
                                        <tr>
                                            <td style="padding:0 8px 16px 0;width:50%">
                                                <div style="background:#0f172a;border:2px solid #334155;border-radius:16px;padding:16px;text-align:center">
                                                    <p style="color:#64748b;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px">Word Blast</p>
                                                    <p style="color:#fff;font-size:32px;font-weight:900;margin:0">{{ $data['wordBlastAcc'] ?? 0 }}<span style="color:#64748b;font-size:16px">%</span></p>
                                                </div>
                                            </td>
                                            <td style="padding:0 0 16px 8px;width:50%">
                                                <div style="background:#0f172a;border:2px solid #334155;border-radius:16px;padding:16px;text-align:center">
                                                    <p style="color:#64748b;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px">Story Quest</p>
                                                    <p style="color:#fff;font-size:32px;font-weight:900;margin:0">{{ $data['storyQuestAcc'] ?? 0 }}<span style="color:#64748b;font-size:16px">%</span></p>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding:0 8px 0 0;width:50%">
                                                <div style="background:#0f172a;border:2px solid #334155;border-radius:16px;padding:16px;text-align:center">
                                                    <p style="color:#64748b;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px">Read Level</p>
                                                    <p style="color:#fff;font-size:24px;font-weight:900;margin:0">{{ $data['read_level'] ?? 1 }}</p>
                                                </div>
                                            </td>
                                            <td style="padding:0 0 0 8px;width:50%">
                                                <div style="background:#0f172a;border:2px solid #334155;border-radius:16px;padding:16px;text-align:center">
                                                    <p style="color:#64748b;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px">Speak Level</p>
                                                    <p style="color:#fff;font-size:24px;font-weight:900;margin:0">{{ $data['speak_level'] ?? 1 }}</p>
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>

                        @if (!empty($data['trainingWords']) && count($data['trainingWords']) > 0)
                            <div style="background:#0f172a;border:2px solid #334155;border-radius:16px;padding:24px;margin-bottom:32px">
                                <h2 style="color:#fbbf24;font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px">
                                    Words Still in Training
                                </h2>
                                @foreach ($data['trainingWords'] as $moduleTitle => $words)
                                    <p style="color:#94a3b8;font-size:12px;font-weight:700;margin:0 0 8px;text-transform:uppercase">
                                        {{ $moduleTitle }}
                                    </p>
                                    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">
                                        @foreach ($words as $word)
                                            <span style="display:inline-block;background:#334155;color:#fff;font-size:13px;font-weight:700;padding:4px 14px;border-radius:100px;border:2px solid #475569">
                                                {{ $word }}
                                            </span>
                                        @endforeach
                                    </div>
                                @endforeach
                            </div>
                        @endif

                        @if ($data['status'] === 'onTrack')
                            <div style="background:#052e16;border:2px solid #22c55e;border-radius:16px;padding:24px;margin-bottom:32px">
                                <p style="color:#22c55e;font-size:16px;font-weight:700;margin:0;text-align:center">
                                    All words mastered up to Level {{ $data['read_level'] }}!
                                    Keep up the fantastic work!
                                </p>
                            </div>
                        @else
                            <div style="background:#450a0a;border:2px solid #ef4444;border-radius:16px;padding:24px;margin-bottom:32px">
                                <h2 style="color:#fca5a5;font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px">
                                    Recommended Interventions
                                </h2>
                                <ul style="margin:0;padding-left:20px;color:#fecaca;font-size:14px;line-height:1.8">
                                    <li>Practice 15 minutes daily on Word Blast levels 1-{{ $data['read_level'] }}</li>
                                    <li>Review flashcards for the words listed above</li>
                                    <li>Encourage daily reading at home</li>
                                    <li>Schedule a 1-on-1 session with the teacher</li>
                                </ul>
                            </div>
                        @endif

                        <p style="color:#475569;font-size:12px;text-align:center;margin:0;border-top:2px solid #334155;padding-top:24px">
                            Word-O-Matic &bull; Automated Performance Report
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
