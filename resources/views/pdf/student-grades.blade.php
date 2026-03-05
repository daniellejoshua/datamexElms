<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Grades Report</title>
    <style>
        body { font-family: 'Times New Roman', serif; margin:0; padding:20px; color:#333; background:#fff; }
        .header { text-align:center; margin-bottom:30px; border-bottom:3px solid #800000; padding-bottom:20px; }
        .logo { max-width:100px; height:auto; margin-bottom:10px; }
        .school-name { font-size:24px; font-weight:bold; color:#800000; margin:5px 0; }
        .school-address { font-size:14px; color:#666; margin:5px 0; }
        .report-title { font-size:20px; font-weight:bold; color:#800000; margin:15px 0 10px; }
        .report-info { font-size:12px; color:#666; margin:5px 0; }
        table { width:100%; border-collapse:collapse; margin-bottom:30px; font-size:11px; }
        th, td { border:1px solid #d1d5db; padding:8px 12px; text-align:left; vertical-align:top; }
        th { background:#f9fafb; font-weight:bold; color:#374151; font-size:12px; }
        .footer { margin-top:40px; padding-top:20px; border-top:2px solid #800000; text-align:center; font-size:10px; color:#666; }
        @page { margin-bottom:40px; }
        .page-footer { position:fixed; bottom:10px; left:20px; right:20px; padding:10px; border-top:1px solid #e5e7eb; text-align:center; font-size:9px; color:#9ca3af; background:white; }
    </style>
</head>
<body>
    <div class="header">
        <img src="{{ public_path('images/datamexlogo.png') }}" alt="School Logo" class="logo">
        <div class="school-name">DATAMEX COLLEGE SAINT ADELINE, INC.</div>
        <div class="school-address">2nd floor. Gotaco Bldg 2, 32 MacArthur Highway, Valenzuela</div>
        <div class="report-title">GRADE REPORT</div>
        <div class="report-info">{{ $student->user->name ?? '' }} &nbsp;|&nbsp; Academic Year: {{ $academicYear }} &nbsp;|&nbsp; Semester: {{ $semester }}</div>
        <div class="report-info">{{ $generatedAt }}</div>
    </div>

    @if($grades->isEmpty())
        <div class="no-data">No grades available.</div>
    @else
        <table>
            <thead>
                <tr>
                    <th style="width:5%;">#</th>
                    <th style="width:20%;">Subject Code</th>
                    <th style="width:35%;">Subject Name</th>
                    @if(!empty($isShsView))
                        <th style="width:8%;">Quarter 1</th>
                        <th style="width:8%;">Quarter 2</th>
                        <th style="width:8%;">Semester Grade</th>
                        <th style="width:16%;">Remarks</th>
                    @else
                        <th style="width:8%;">Prelim</th>
                        <th style="width:8%;">Midterm</th>
                        <th style="width:8%;">Prefinal</th>
                        <th style="width:8%;">Final</th>
                        <th style="width:8%;">Semester</th>
                        <th style="width:10%;">Remarks</th>
                        <th style="width:10%;">Status</th>
                    @endif
                </tr>
            </thead>
            <tbody>
                @foreach($grades as $idx => $grade)
                    <?php
                        $subject = $grade['sectionSubject']['subject'] ?? null;
                        $prelim = $grade['prelim_grade'] ?? null;
                        $midterm = $grade['midterm_grade'] ?? null;
                        $prefinal = $grade['prefinal_grade'] ?? null;
                        $finalg = $grade['final_grade'] ?? null;
                        $q1 = $grade['q1_grade'] ?? null;
                        $q2 = $grade['q2_grade'] ?? null;
                        $semesterGrade = $grade['semester_grade'] ?? null;
                        $remarks = $grade['teacher_remarks'] ?? '—';
                        $status = $grade['overall_status'] ?? $grade['completion_status'] ?? ($semesterGrade ? 'Completed' : '');
                    ?>
                    <tr>
                        <td>{{ $idx + 1 }}</td>
                        <td>{{ $subject['subject_code'] ?? 'N/A' }}</td>
                        <td>{{ $subject['subject_name'] ?? 'N/A' }}</td>
                        @if(!empty($isShsView))
                            <td>{{ $q1 ?? '—' }}</td>
                            <td>{{ $q2 ?? '—' }}</td>
                            <td>{{ $semesterGrade ?? '—' }}</td>
                            <td>{{ $remarks }}</td>
                        @else
                            <td>
                                @if($visiblePeriods['prelim'])
                                    {{ $prelim ?? '—' }}
                                @else
                                    @if($prelim !== null)
                                        Grade hidden
                                    @else
                                        —
                                    @endif
                                @endif
                            </td>
                            <td>
                                @if($visiblePeriods['midterm'])
                                    {{ $midterm ?? '—' }}
                                @else
                                    @if($midterm !== null)
                                        Grade hidden
                                    @else
                                        —
                                    @endif
                                @endif
                            </td>
                            <td>
                                @if($visiblePeriods['prefinal'])
                                    {{ $prefinal ?? '—' }}
                                @else
                                    @if($prefinal !== null)
                                        Grade hidden
                                    @else
                                        —
                                    @endif
                                @endif
                            </td>
                            <td>
                                @if($visiblePeriods['final'])
                                    {{ $finalg ?? '—' }}
                                @else
                                    @if($finalg !== null)
                                        Grade hidden
                                    @else
                                        —
                                    @endif
                                @endif
                            </td>
                            <td>
                                @if($visiblePeriods['semester'])
                                    {{ $semesterGrade ?? '—' }}
                                @else
                                    @if($semesterGrade !== null)
                                        Grade hidden
                                    @else
                                        —
                                    @endif
                                @endif
                            </td>
                            <td>{{ $remarks }}</td>
                            <td>{{ $status }}</td>
                        @endif
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <div class="page-footer">Powered by Datamex ELMS</div>
</body>
</html>
