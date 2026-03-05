<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Academic History - {{ $student->user->name }}</title>
    <style>
        /* aggressive compaction to fit on a single page */
        @page { size: A4 portrait; margin: 3mm; }
        body { font-family: 'DejaVu Sans', sans-serif; color:#111; margin:2px; font-size:7px; line-height:1; }
        .header { padding-bottom:1px; margin-bottom:4px; border-bottom:1px solid #800000; text-align:center; }
        /* logo and school name inline to save vertical space */
        .logo { display:inline-block; vertical-align:middle; margin:0 6px 0 0; max-width:30px; height:auto; }
        .header-content { display:inline-block; vertical-align:middle; text-align:center; margin-left:0; }
        /* single-line school name + title */
        .school-line { display:inline-flex; gap:4px; align-items:baseline; white-space:nowrap; }
        .school-line .school-name { font-size:10px; font-weight:700; color:#800000; margin:0; }
        .school-line .title { font-size:8px; font-weight:600; color:#374151; margin:0; }
        .school-sub { font-size:7px; color:#555; margin:1px 0; }
        .meta { margin-top:2px; font-size:7px; color:#374151; display:block; text-align:center }
        .meta div { display:inline-block; margin-right:4px; }
        .section { margin-top:2px; }
        table { width:90%; margin:0 auto; border-collapse:collapse; font-size:7px; table-layout: fixed; }
        th, td { border:1px solid #e5e7eb; padding:1px 1px; text-align:left; vertical-align:middle; }
        th { background:#f8fafc; color:#111827; font-weight:700; font-size:7px }
        .year-header { background:#f1f5f9; padding:1px 2px; margin-top:2px; border-left:2px solid #ef4444; font-size:9px; }
        .semester-title { font-weight:700; color:#0f172a; margin-bottom:1px; font-size:7px }
        .small { font-size:6px; color:#6b7280 }
        .col-unit, .col-grade { font-size:6px; }
        .subject-name { display:block; white-space:normal; overflow:visible; word-break:break-word; max-height:3.6em; line-height:1.1em; max-width: {{ $subjectMaxCh ?? 35 }}ch; }

        /* reduce row heights and avoid page breaks inside rows */
        tr { page-break-inside: avoid; }
        thead { display: table-header-group; }
        tbody { display: table-row-group; }
    </style> 
</head>
<body>
    <div class="header">
        <img src="{{ public_path('images/datamexlogo.png') }}" alt="logo" class="logo">
        <div class="header-content">
            <div class="school-line">
                <div class="school-name">DATAMEX COLLEGE SAINT ADELINE, INC.</div>
                <div class="title">Student Academic Record</div>
            </div>
            <div class="school-sub">Academic History / Transcript</div>
            <div class="meta">
                <div><strong>Name:</strong> {{ $student->user->name }}</div>
                <div><strong>Student No.:</strong> {{ $student->student_number ?? 'N/A' }}</div>
                <div><strong>Program:</strong> {{ $student->program?->program_code ?? $student->program?->name ?? 'N/A' }}</div>
                <div><strong>Year Level:</strong> {{ $student->year_level ?? 'N/A' }}</div>
            </div>
        </div>
    </div> 

    {{-- Group curriculum subjects by year/semester and print grades if available --}}
    @php
        $gradesMap = [];
        foreach ($subjectGrades as $g) {
            $gradesMap[$g['subject_code'] ?? $g['subject_id']] = $g;
        }

        $grouped = [];
        foreach ($curriculumSubjects as $sub) {
            // convert year level to ordinal (1st Year, 2nd Year, etc.)
            $num = $sub->year_level;
            $suffix = 'th';
            if ($num % 10 === 1 && $num % 100 !== 11) {
                $suffix = 'st';
            } elseif ($num % 10 === 2 && $num % 100 !== 12) {
                $suffix = 'nd';
            } elseif ($num % 10 === 3 && $num % 100 !== 13) {
                $suffix = 'rd';
            }
            $y = $num.$suffix.' Year';

            $s = $sub->semester === '1st' ? '1st Semester' : ($sub->semester === '2nd' ? '2nd Semester' : ucfirst($sub->semester));
            $grouped[$y][$s][] = $sub;
        }

        // ensure semesters within each year appear in logical order regardless of insertion
        foreach ($grouped as &$semesters) {
            $order = ['1st Semester', '2nd Semester', 'Summer'];
            uksort($semesters, function ($a, $b) use ($order) {
                return array_search($a, $order) <=> array_search($b, $order);
            });
        }
        unset($semesters);

        // compute longest subject name (characters) and clamp to a reasonable max for PDF
        $maxSubjectNameLen = 0;
        foreach ($curriculumSubjects as $s) {
            $len = mb_strlen($s->subject_name ?? '');
            if ($len > $maxSubjectNameLen) $maxSubjectNameLen = $len;
        }
        // clamp so very long names don't expand beyond practical limits
        $subjectMaxCh = (int) max(30, min($maxSubjectNameLen, 60));
    @endphp

    @foreach($grouped as $year => $semesters)
        <div class="section">
            <div class="year-header">{{ $year }}</div>
            @foreach($semesters as $semName => $subjects)
                <div style="margin-top:8px">
                    <div class="semester-title">{{ $semName }}</div>
                    <table>
                        <thead>
                            <tr>
                                <th style="width:10%">Code</th>
                                <th style="width:74%">Subject Title</th>
                                <th style="width:6%" class="col-unit">Units</th>
                                <th style="width:10%" class="col-grade">Grade</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($subjects as $sub)
                                @php
                                    $code = $sub->subject_code;
                                    $g = $gradesMap[$code] ?? null;
                                    $displayGrade = $g['semester_grade'] ?? $g['final_grade'] ?? ($g['final_gpa'] ?? null);
                                @endphp
                                <tr>
                                    <td style="width:12%">{{ $code }}</td>
                                    <td style="width:64%"><div class="subject-name">{{ $sub->subject_name }}</div></td>
                                        <td class="small col-unit" style="width:6%; text-align:center">{{ $sub->units ?? 'N/A' }}</td>
                                    <td class="small col-grade" style="width:10%; text-align:center">{{ $displayGrade ?? '—' }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            @endforeach
        </div>
    @endforeach





</body>
</html>