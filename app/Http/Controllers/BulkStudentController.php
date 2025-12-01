<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\User;
use App\Models\StudentPayment;
use App\Models\Program;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class BulkStudentController extends Controller
{
    public function index()
    {
        return Inertia::render('Registrar/BulkStudents/Index');
    }

    public function uploadCsv(Request $request)
    {
        $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt',
            'academic_year' => 'required|string',
            'semester' => 'required|string',
            'total_fee' => 'required|numeric|min:0',
        ]);

        $file = $request->file('csv_file');
        $academicYear = $request->input('academic_year');
        $semester = $request->input('semester');
        $totalFee = $request->input('total_fee');

        try {
            $csvData = $this->parseCsvFile($file);
            $validationResults = $this->validateCsvData($csvData);

            if (!empty($validationResults['errors'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'CSV validation failed',
                    'errors' => $validationResults['errors']
                ], 422);
            }

            $results = $this->processStudentData($validationResults['valid_data'], $academicYear, $semester, $totalFee);

            return response()->json([
                'success' => true,
                'message' => 'Bulk student upload completed',
                'results' => $results
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Upload failed: ' . $e->getMessage()
            ], 500);
        }
    }

    private function parseCsvFile($file): array
    {
        $csvData = [];
        $handle = fopen($file->getPathname(), 'r');
        
        // Read header row
        $headers = fgetcsv($handle);
        
        // Expected headers
        $expectedHeaders = ['first_name', 'last_name', 'email', 'student_id', 'program_code', 'year_level', 'student_type', 'education_level'];
        
        if ($headers !== $expectedHeaders) {
            throw new \Exception('CSV headers do not match expected format. Expected: ' . implode(', ', $expectedHeaders));
        }

        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) === count($headers)) {
                $csvData[] = array_combine($headers, $row);
            }
        }

        fclose($handle);
        return $csvData;
    }

    private function validateCsvData(array $csvData): array
    {
        $validData = [];
        $errors = [];
        
        $programs = Program::pluck('id', 'program_code')->toArray();

        foreach ($csvData as $index => $row) {
            $rowNumber = $index + 2; // +2 because index starts at 0 and we skip header row
            
            $validator = Validator::make($row, [
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'student_id' => 'required|string|unique:students,student_id',
                'program_code' => ['required', Rule::in(array_keys($programs))],
                'year_level' => 'required|integer|between:1,4',
                'student_type' => ['required', Rule::in(['regular', 'irregular'])],
                'education_level' => ['required', Rule::in(['college', 'shs'])],
            ]);

            if ($validator->fails()) {
                $errors[] = [
                    'row' => $rowNumber,
                    'data' => $row,
                    'errors' => $validator->errors()->all()
                ];
            } else {
                $row['program_id'] = $programs[$row['program_code']];
                $validData[] = $row;
            }
        }

        return [
            'valid_data' => $validData,
            'errors' => $errors
        ];
    }

    private function processStudentData(array $validData, string $academicYear, string $semester, float $totalFee): array
    {
        $created = 0;
        $failed = 0;
        $failedRecords = [];

        foreach ($validData as $studentData) {
            try {
                DB::transaction(function () use ($studentData, $academicYear, $semester, $totalFee) {
                    // Create user account
                    $user = User::create([
                        'name' => $studentData['first_name'] . ' ' . $studentData['last_name'],
                        'email' => $studentData['email'],
                        'password' => Hash::make('password123'), // Default password
                        'role' => 'student',
                    ]);

                    // Create student record
                    $student = Student::create([
                        'user_id' => $user->id,
                        'student_id' => $studentData['student_id'],
                        'first_name' => $studentData['first_name'],
                        'last_name' => $studentData['last_name'],
                        'program_id' => $studentData['program_id'],
                        'year_level' => $studentData['year_level'],
                        'student_type' => $studentData['student_type'],
                        'education_level' => $studentData['education_level'],
                        'status' => 'enrolled',
                    ]);

                    // Create payment records for all periods
                    StudentPayment::createPaymentsForStudent(
                        $student->id,
                        $academicYear,
                        $semester,
                        $studentData['education_level'],
                        $totalFee
                    );
                });

                $created++;
            } catch (\Exception $e) {
                $failed++;
                $failedRecords[] = [
                    'data' => $studentData,
                    'error' => $e->getMessage()
                ];
            }
        }

        return [
            'total_processed' => count($validData),
            'created' => $created,
            'failed' => $failed,
            'failed_records' => $failedRecords
        ];
    }

    public function downloadTemplate()
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="bulk_students_template.csv"',
        ];

        $template = [
            ['first_name', 'last_name', 'email', 'student_id', 'program_code', 'year_level', 'student_type', 'education_level'],
            ['John', 'Doe', 'john.doe@email.com', 'STU2024001', 'BSIT', '1', 'regular', 'college'],
            ['Jane', 'Smith', 'jane.smith@email.com', 'STU2024002', 'ABM', '2', 'irregular', 'shs'],
        ];

        $callback = function () use ($template) {
            $file = fopen('php://output', 'w');
            foreach ($template as $row) {
                fputcsv($file, $row);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
