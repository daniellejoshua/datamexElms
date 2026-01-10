<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Teachers Report</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 20px;
            color: #333;
            background-color: #fff;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #800000;
            padding-bottom: 20px;
        }

        .logo {
            max-width: 100px;
            height: auto;
            margin-bottom: 10px;
        }

        .school-name {
            font-size: 24px;
            font-weight: bold;
            color: #800000;
            margin: 5px 0;
        }

        .school-address {
            font-size: 14px;
            color: #666;
            margin: 5px 0;
        }

        .report-title {
            font-size: 20px;
            font-weight: bold;
            color: #800000;
            margin: 15px 0 10px 0;
        }

        .report-info {
            font-size: 12px;
            color: #666;
            margin: 5px 0;
        }

        .stats-container {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin: 20px 0;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 8px;
        }

        .stat-item {
            text-align: center;
        }

        .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #800000;
        }

        .stat-label {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }

        .section-title {
            font-size: 18px;
            font-weight: bold;
            margin: 30px 0 15px 0;
            padding: 10px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
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

        .no-data {
            text-align: center;
            padding: 20px;
            color: #666;
            font-style: italic;
        }

        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #800000;
            text-align: center;
            font-size: 10px;
            color: #666;
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
                padding: 15px;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }

            .stats-container {
                background-color: white !important;
                -webkit-print-color-adjust: exact;
            }

            table {
                page-break-inside: avoid;
            }

            .section-title {
                page-break-after: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <img src="{{ public_path('images/datamexlogo.png') }}" alt="School Logo" class="logo">
        <div class="school-name">DATAMEX COLLEGE SAINT ADELINE, INC.</div>
        <div class="school-address">2nd floor. Gotaco Bldg 2, 32 MacArthur Highway, Valenzuela</div>
        <div class="report-title">TEACHERS REPORT</div>
        <div class="report-info">Generated on: {{ $currentDateTime }}</div>
    </div>


    <div class="section-title">ALL TEACHERS</div>
    <table>
        <thead>
            <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 20%;">EMPLOYEE NUMBER</th>
                <th style="width: 25%;">FULL NAME</th>
                <th style="width: 20%;">DEPARTMENT</th>
                <th style="width: 20%;">SPECIALIZATION</th>
                <th style="width: 10%;">STATUS</th>
            </tr>
        </thead>
        <tbody>
            @foreach($teachers as $index => $teacher)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ $teacher->employee_number ?? 'N/A' }}</td>
                <td>{{ strtoupper($teacher->last_name . ', ' . $teacher->first_name . ($teacher->middle_name ? ' ' . $teacher->middle_name : '')) }}</td>
                <td>{{ $teacher->department ?? 'N/A' }}</td>
                <td>{{ $teacher->specialization ?? 'N/A' }}</td>
                <td>{{ ucfirst($teacher->status) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    @if($teachers->count() == 0)
    <div class="no-data">No teachers found in the system.</div>
    @endif

    <div class="page-footer">
        <p>This report was generated automatically by the Datamex ELMS system.</p>
        <p>&copy; 2026 Datamex College Saint Adeline, Inc. All rights reserved.</p>
    </div>
</body>
</html>