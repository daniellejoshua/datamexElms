<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Section Students Report - {{ $section->program->program_code }}-{{ $section->year_level }}{{ $section->section_name }}</title>
    <style>
        @page {
            margin: 20mm;
            size: A4;
        }

        @page :first {
            margin-top: 20mm;
        }

        @page {
            @bottom-center {
                content: "Page " counter(page) " of " counter(pages);
                font-size: 10px;
                color: #9ca3af;
            }
        }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 0;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #800000;
            padding-bottom: 20px;
        }

        .logo {
            max-width: 120px;
            height: auto;
            margin-bottom: 15px;
        }

        .school-name {
            font-size: 18px;
            font-weight: bold;
            color: #800000;
            margin-bottom: 5px;
        }

        .school-address {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 10px;
        }

        .report-title {
            font-size: 16px;
            font-weight: bold;
            color: #374151;
            margin-bottom: 10px;
        }

        .section-info {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 20px;
        }

        .stats-container {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            padding: 15px;
            background-color: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }

        .stat-box {
            text-align: center;
            flex: 1;
            margin: 0 10px;
        }

        .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #800000;
            display: block;
        }

        .stat-label {
            font-size: 12px;
            color: #64748b;
            margin-top: 5px;
        }

        .gender-section {
            margin-bottom: 40px;
            page-break-inside: avoid;
        }

        .gender-section.page-break {
            page-break-before: always;
        }

        .gender-title {
            font-size: 16px;
            font-weight: bold;
            color: #800000;
            margin-bottom: 15px;
            padding: 8px 12px;
            background-color: #fef2f2;
            border-left: 4px solid #800000;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 11px;
        }

        th, td {
            border: 1px solid #d1d5db;
            padding: 8px 12px;
            text-align: left;
            vertical-align: top;
        }

        th {
            background-color: #f9fafb;
            font-weight: bold;
            color: #374151;
            font-size: 12px;
        }

        tr:nth-child(even) {
            background-color: #f9fafb;
        }

        tr:hover {
            background-color: #f3f4f6;
        }

        .student-number {
            font-weight: bold;
        }

        .student-name {
            font-weight: 500;
        }

        .no-students {
            text-align: center;
            padding: 40px;
            color: #6b7280;
            font-style: italic;
        }

        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 10px;
            color: #9ca3af;
        }

        /* Force page breaks before gender sections if needed */
        .gender-section.page-break {
            page-break-before: always;
        }

        /* Footer on all pages */
        @page {
            margin-bottom: 40px;
        }

        .page-footer {
            position: fixed;
            bottom: 10px;
            left: 20px;
            right: 20px;
            padding: 10px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 9px;
            color: #9ca3af;
            background-color: white;
        }

        @media print {
            body {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <img src="{{ public_path('images/datamexlogo.png') }}" alt="School Logo" class="logo">
        <div class="school-name">DATAMEX COLLEGE SAINT ADELINE, INC.</div>
        <div class="school-address">2nd floor. Gotaco Bldg 2, 32 MacArthur Highway, Valenzuela</div>
        <div class="report-title">SECTION STUDENTS REPORT</div>
        <div class="section-info">
            {{ $section->program->program_code }}-{{ $section->year_level }}{{ $section->section_name }} |
            Academic Year: {{ $section->academic_year }} |
            Semester: {{ $section->semester }}
        </div>
    </div>

    @if($maleStudents->count() > 0)
    <div class="gender-section">
        <div class="gender-title">Male Students ({{ $maleStudents->count() }})</div>
        <table>
            <thead>
                <tr>
                    <th width="10%">No.</th>
                    <th width="25%">Student Number</th>
                    <th width="65%">Full Name</th>
                </tr>
            </thead>
            <tbody>
                @foreach($maleStudents as $index => $student)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td class="student-number">{{ $student->student_number ?? 'N/A' }}</td>
                    <td class="student-name">
                        {{ strtoupper($student->last_name ?? '') }}, {{ strtoupper($student->first_name ?? '') }} {{ strtoupper($student->middle_name ?? '') }}
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    @if($femaleStudents->count() > 0)
    <div class="gender-section page-break">
        <div class="gender-title"> Female Students ({{ $femaleStudents->count() }})</div>
        <table>
            <thead>
                <tr>
                    <th width="10%">No.</th>
                    <th width="25%">Student Number</th>
                    <th width="65%">Full Name</th>
                </tr>
            </thead>
            <tbody>
                @foreach($femaleStudents as $index => $student)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td class="student-number">{{ $student->student_number ?? 'N/A' }}</td>
                    <td class="student-name">
                        {{ strtoupper($student->last_name ?? '') }}, {{ strtoupper($student->first_name ?? '') }} {{ strtoupper($student->middle_name ?? '') }}
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    @if($totalStudents === 0)
    <div class="no-students">
        No students are currently enrolled in this section.
    </div>
    @endif

    <div class="page-footer">
        <p>This report was generated automatically by the Datamex ELMS system.</p>
        <p>&copy; 2026 Datamex College Saint Adeline, Inc. All rights reserved.</p>
    </div>
</body>
</html>