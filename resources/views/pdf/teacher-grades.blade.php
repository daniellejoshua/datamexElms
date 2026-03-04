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
        table { width:100%; border-collapse:collapse; margin-bottom:30px; font-size:10px; page-break-inside: avoid; }
        th, td { border:1px solid #d1d5db; padding:6px 8px; text-align:left; vertical-align:top; }
        th { background:#f9fafb; font-weight:bold; color:#374151; font-size:11px; page-break-inside: avoid; }
        .footer { margin-top:40px; padding-top:20px; border-top:2px solid #800000; text-align:center; font-size:10px; color:#666; }
        @page { margin-bottom:40px; }
        .page-footer { position:fixed; bottom:10px; left:20px; right:20px; padding:10px; border-top:1px solid #e5e7eb; text-align:center; font-size:9px; color:#9ca3af; background:white; }
        .student-name { font-weight: bold; }
        .grade-cell { text-align: center; }
        h3 { page-break-after: avoid; }
        tr { page-break-inside: avoid; }
    </style>
</head>
<body>
    <div class="header">
        <img src="{{ public_path('images/datamexlogo.png') }}" alt="School Logo" class="logo">
        <div class="school-name">DATAMEX COLLEGE SAINT ADELINE, INC.</div>
        <div class="school-address">2nd floor. Gotaco Bldg 2, 32 MacArthur Highway, Valenzuela</div>
        <div class="report-title">CLASS GRADE REPORT</div>
        <div class="report-info">{{ $sectionSubject->subject->subject_name ?? 'Subject' }} &nbsp;|&nbsp; {{ $formattedSectionName ?? $section->section_name ?? 'Section' }}</div>
        <div class="report-info">Academic Year: {{ $section->academic_year ?? 'N/A' }} &nbsp;|&nbsp; Semester: {{ $section->semester ?? 'N/A' }} &nbsp;|&nbsp; Teacher: {{ $teacher->user->name ?? 'N/A' }}</div>
        <div class="report-info">{{ $generatedAt }}</div>
    </div>

    @if($grades)
        @if($separateByGender)
            @php
                $currentSection = null;
            @endphp
            @foreach($grades as $grade)
                @if(isset($grade['isHeader']) && $grade['isHeader'])
                    @if($currentSection)
                        </tbody>
                        </table>
                    @endif
                    <h3 style="font-size: 16px; font-weight: bold; color: #800000; margin: 20px 0 10px 0; text-align: center; page-break-after: avoid;">{{ $grade['section'] }}</h3>
                    <table>
                        <thead>
                            <tr>
                                <th style="width:5%;">#</th>
                                <th style="width:15%;">Student ID</th>
                                <th style="width:30%;">Student Name</th>
                                @if($isCollegeLevel)
                                    <th style="width:8%;" class="grade-cell">Prelim</th>
                                    <th style="width:8%;" class="grade-cell">Midterm</th>
                                    <th style="width:8%;" class="grade-cell">Pre Finals</th>
                                    <th style="width:8%;" class="grade-cell">Finals</th>
                                    <th style="width:8%;" class="grade-cell">Semester</th>
                                    <th style="width:15%;">Remarks</th>
                                @elseif($isShsLevel)
                                    <th style="width:12%;" class="grade-cell">Quarter 1</th>
                                    <th style="width:12%;" class="grade-cell">Quarter 2</th>
                                    <th style="width:12%;" class="grade-cell">Semester</th>
                                    <th style="width:20%;">Remarks</th>
                                @else
                                    <th style="width:6%;" class="grade-cell">Q1</th>
                                    <th style="width:6%;" class="grade-cell">Q2</th>
                                    <th style="width:6%;" class="grade-cell">Q3</th>
                                    <th style="width:6%;" class="grade-cell">Q4</th>
                                    <th style="width:8%;" class="grade-cell">Semester</th>
                                    <th style="width:15%;">Remarks</th>
                                @endif
                            </tr>
                        </thead>
                        <tbody>
                    @php
                        $currentSection = $grade['section'];
                        $counter = 1;
                    @endphp
                @else
                    <tr>
                        <td>{{ $counter }}</td>
                        <td>{{ $grade['student_id'] }}</td>
                        <td class="student-name">{{ $grade['student_name'] }}</td>
                        @if($isCollegeLevel)
                            <td class="grade-cell">{{ $grade['prelim_grade'] ?: '—' }}</td>
                            <td class="grade-cell">{{ $grade['midterm_grade'] ?: '—' }}</td>
                            <td class="grade-cell">{{ $grade['prefinal_grade'] ?: '—' }}</td>
                            <td class="grade-cell">{{ $grade['final_grade'] ?: '—' }}</td>
                            <td class="grade-cell">{{ $grade['semester_grade'] ?: '—' }}</td>
                            <td>{{ $grade['remarks'] ?: '—' }}</td>
                        @elseif($isShsLevel)
                            <td class="grade-cell">{{ $grade['q1_grade'] ?: '—' }}</td>
                            <td class="grade-cell">{{ $grade['q2_grade'] ?: '—' }}</td>
                            <td class="grade-cell">{{ $grade['semester_grade'] ?: '—' }}</td>
                            <td>{{ $grade['remarks'] ?: '—' }}</td>
                        @else
                            <td class="grade-cell">{{ $grade['q1_grade'] ?: '—' }}</td>
                            <td class="grade-cell">{{ $grade['q2_grade'] ?: '—' }}</td>
                            <td class="grade-cell">{{ $grade['q3_grade'] ?: '—' }}</td>
                            <td class="grade-cell">{{ $grade['q4_grade'] ?: '—' }}</td>
                            <td class="grade-cell">{{ $grade['semester_grade'] ?: '—' }}</td>
                            <td>{{ $grade['remarks'] ?: '—' }}</td>
                        @endif
                    </tr>
                    @php
                        $counter++;
                    @endphp
                @endif
            @endforeach
            @if($currentSection)
                </tbody>
                </table>
            @endif
        @else
            <table>
                <thead>
                    <tr>
                        <th style="width:5%;">#</th>
                        <th style="width:15%;">Student ID</th>
                        <th style="width:30%;">Student Name</th>
                        @if($isCollegeLevel)
                            <th style="width:8%;" class="grade-cell">Prelim</th>
                            <th style="width:8%;" class="grade-cell">Midterm</th>
                            <th style="width:8%;" class="grade-cell">Pre Finals</th>
                            <th style="width:8%;" class="grade-cell">Finals</th>
                            <th style="width:8%;" class="grade-cell">Semester</th>
                            <th style="width:15%;">Remarks</th>
                        @elseif($isShsLevel)
                            <th style="width:12%;" class="grade-cell">Quarter 1</th>
                            <th style="width:12%;" class="grade-cell">Quarter 2</th>
                            <th style="width:12%;" class="grade-cell">Semester</th>
                            <th style="width:20%;">Remarks</th>
                        @else
                            <th style="width:6%;" class="grade-cell">Q1</th>
                            <th style="width:6%;" class="grade-cell">Q2</th>
                            <th style="width:6%;" class="grade-cell">Q3</th>
                            <th style="width:6%;" class="grade-cell">Q4</th>
                            <th style="width:8%;" class="grade-cell">Semester</th>
                            <th style="width:15%;">Remarks</th>
                        @endif
                    </tr>
                </thead>
                <tbody>
                    @foreach($grades as $idx => $grade)
                        <tr>
                            <td>{{ $idx + 1 }}</td>
                            <td>{{ $grade['student_id'] }}</td>
                            <td class="student-name">{{ $grade['student_name'] }}</td>
                            @if($isCollegeLevel)
                                <td class="grade-cell">{{ $grade['prelim_grade'] ?: '—' }}</td>
                                <td class="grade-cell">{{ $grade['midterm_grade'] ?: '—' }}</td>
                                <td class="grade-cell">{{ $grade['prefinal_grade'] ?: '—' }}</td>
                                <td class="grade-cell">{{ $grade['final_grade'] ?: '—' }}</td>
                                <td class="grade-cell">{{ $grade['semester_grade'] ?: '—' }}</td>
                                <td>{{ $grade['remarks'] ?: '—' }}</td>
                            @elseif($isShsLevel)
                                <td class="grade-cell">{{ $grade['q1_grade'] ?: '—' }}</td>
                                <td class="grade-cell">{{ $grade['q2_grade'] ?: '—' }}</td>
                                <td class="grade-cell">{{ $grade['semester_grade'] ?: '—' }}</td>
                                <td>{{ $grade['remarks'] ?: '—' }}</td>
                            @else
                                <td class="grade-cell">{{ $grade['q1_grade'] ?: '—' }}</td>
                                <td class="grade-cell">{{ $grade['q2_grade'] ?: '—' }}</td>
                                <td class="grade-cell">{{ $grade['q3_grade'] ?: '—' }}</td>
                                <td class="grade-cell">{{ $grade['q4_grade'] ?: '—' }}</td>
                                <td class="grade-cell">{{ $grade['semester_grade'] ?: '—' }}</td>
                                <td>{{ $grade['remarks'] ?: '—' }}</td>
                            @endif
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @endif
    @else
        <div class="no-data">No grades available.</div>
    @endif

    <div class="page-footer">Powered by Datamex ELMS</div>
</body>
</html>