<?php

namespace App\Services;

use App\Models\PaymentTransaction;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentSemesterPayment;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class StudentPaymentService
{
    /**
     * Calculate and create semester payment record for a student
     */
    public function createSemesterPayment(
        Student $student,
        string $academicYear,
        string $semester,
        array $customRates = []
    ): StudentSemesterPayment {
        // Check if payment record already exists
        $existingPayment = StudentSemesterPayment::where([
            'student_id' => $student->id,
            'academic_year' => $academicYear,
            'semester' => $semester,
        ])->first();

        if ($existingPayment) {
            return $existingPayment;
        }

        // Calculate fees based on student enrollment type
        $enrollment = $this->getStudentEnrollment($student, $academicYear, $semester);
        $subjectEnrollments = $this->getStudentSubjectEnrollments($student, $academicYear, $semester);

        $isIrregular = $subjectEnrollments->where('enrollment_type', 'irregular')->count() > 0;
        $irregularSubjectsCount = $subjectEnrollments->where('enrollment_type', 'irregular')->count();

        // Base rates (these could come from a settings table)
        $baseSemesterFee = $customRates['base_semester_fee'] ?? 12000.00;
        $enrollmentFeePercentage = $customRates['enrollment_fee_percentage'] ?? 0.25; // 25% as downpayment
        $irregularSubjectFee = $customRates['irregular_subject_fee'] ?? 300.00;

        // Add irregular subject fees
        $irregularFees = $irregularSubjectsCount * $irregularSubjectFee;
        $totalSemesterFee = $baseSemesterFee + $irregularFees;

        // For SHS, fees are annual, so pay full amount at enrollment
        if ($student->program->education_level === 'senior_high') {
            $enrollmentFee = $totalSemesterFee;
            $termPayment = 0;
        } else {
            // Calculate enrollment fee (downpayment)
            $enrollmentFee = $baseSemesterFee * $enrollmentFeePercentage;

            // Calculate remaining balance to be divided among terms
            $remainingBalance = $totalSemesterFee - $enrollmentFee;
            $termPayment = $remainingBalance / 4; // Divide among 4 terms
        }

        return StudentSemesterPayment::create([
            'student_id' => $student->id,
            'academic_year' => $academicYear,
            'semester' => $semester,
            'enrollment_fee' => $enrollmentFee,
            'enrollment_paid' => false,
            'prelim_amount' => $termPayment,
            'prelim_paid' => false,
            'midterm_amount' => $termPayment,
            'midterm_paid' => false,
            'prefinal_amount' => $termPayment,
            'prefinal_paid' => false,
            'final_amount' => $termPayment,
            'final_paid' => false,
            'irregular_subject_fee' => $irregularSubjectFee,
            'irregular_subjects_count' => $irregularSubjectsCount,
            'total_semester_fee' => $totalSemesterFee,
            'total_paid' => 0,
            'balance' => $totalSemesterFee,
            'payment_plan' => $isIrregular ? 'custom' : 'installment',
            'status' => 'pending',
        ]);
    }

    /**
     * Process a payment for a student
     */
    public function processPayment(
        StudentSemesterPayment $semesterPayment,
        string $paymentType,
        float $amount,
        string $paymentMethod = 'cash',
        ?int $processedBy = null,
        array $paymentData = []
    ): PaymentTransaction {
        return DB::transaction(function () use (
            $semesterPayment,
            $paymentType,
            $amount,
            $paymentMethod,
            $processedBy,
            $paymentData
        ) {
            // Create payment transaction record
            $transaction = PaymentTransaction::create([
                'student_id' => $semesterPayment->student_id,
                'payable_type' => StudentSemesterPayment::class,
                'payable_id' => $semesterPayment->id,
                'amount' => $amount,
                'payment_type' => $paymentType,
                'payment_method' => $paymentMethod,
                'reference_number' => $paymentData['reference_number'] ?? $this->generateReferenceNumber(),
                'description' => $paymentData['description'] ?? null,
                'processed_by' => $processedBy ?? Auth::id() ?? 1,
                'payment_date' => now(),
                'status' => 'completed',
                'notes' => $paymentData['notes'] ?? null,
            ]);

            // Update semester payment record
            $this->updatePaymentStatus($semesterPayment, $paymentType);

            // Always recalculate total paid and balance after any payment
            $totalPaid = $semesterPayment->calculateTotalPaid();
            $balance = $semesterPayment->calculateBalance();
            $semesterPayment->update([
                'total_paid' => $totalPaid,
                'balance' => $balance,
            ]);

            return $transaction;
        });
    }

    /**
     * Update payment status for specific payment type
     */
    private function updatePaymentStatus(StudentSemesterPayment $semesterPayment, string $paymentType): void
    {
        $fieldMap = [
            'enrollment_fee' => 'enrollment_paid',
            'prelim_payment' => 'prelim_paid',
            'midterm_payment' => 'midterm_paid',
            'prefinal_payment' => 'prefinal_paid',
            'final_payment' => 'final_paid',
        ];

        $dateFieldMap = [
            'enrollment_fee' => 'enrollment_payment_date',
            'prelim_payment' => 'prelim_payment_date',
            'midterm_payment' => 'midterm_payment_date',
            'prefinal_payment' => 'prefinal_payment_date',
            'final_payment' => 'final_payment_date',
        ];

        if (isset($fieldMap[$paymentType])) {
            $updates = [
                $fieldMap[$paymentType] => true,
                $dateFieldMap[$paymentType] => now()->toDateString(),
            ];

            // Recalculate total paid and balance
            $totalPaid = $semesterPayment->calculateTotalPaid();
            $balance = $semesterPayment->calculateBalance();

            $updates['total_paid'] = $totalPaid;
            $updates['balance'] = $balance;

            $semesterPayment->update($updates);
        }
    }

    /**
     * Get student enrollment for academic period
     */
    private function getStudentEnrollment(Student $student, string $academicYear, string $semester): ?StudentEnrollment
    {
        return $student->studentEnrollments()
            ->where('academic_year', $academicYear)
            ->where('semester', $semester)
            ->where('status', 'active')
            ->first();
    }

    /**
     * Get student subject enrollments (for irregular students)
     */
    private function getStudentSubjectEnrollments(Student $student, string $academicYear, string $semester)
    {
        return $student->studentSubjectEnrollments()
            ->where('academic_year', $academicYear)
            ->where('semester', $semester)
            ->where('status', 'active')
            ->get();
    }

    /**
     * Generate unique payment reference number
     */
    private function generateReferenceNumber(): string
    {
        return 'PAY-'.strtoupper(uniqid()).'-'.now()->format('Ymd');
    }

    /**
     * Get payment summary for a student
     */
    public function getPaymentSummary(Student $student, string $academicYear, string $semester): array
    {
        $semesterPayment = $student->studentSemesterPayments()
            ->where('academic_year', $academicYear)
            ->where('semester', $semester)
            ->first();

        if (! $semesterPayment) {
            return [
                'exists' => false,
                'message' => 'No payment record found for this semester',
            ];
        }

        $transactions = $semesterPayment->paymentTransactions()
            ->where('status', 'completed')
            ->orderBy('payment_date', 'desc')
            ->get();

        return [
            'exists' => true,
            'payment_record' => $semesterPayment,
            'total_fee' => $semesterPayment->total_semester_fee,
            'total_paid' => $semesterPayment->total_paid,
            'balance' => $semesterPayment->balance,
            'progress_percentage' => $semesterPayment->getPaymentProgress(),
            'next_payment_due' => $semesterPayment->getNextPaymentDue(),
            'transactions' => $transactions,
            'is_enrollment_overdue' => $semesterPayment->isEnrollmentOverdue(),
        ];
    }

    /**
     * Calculate fees for irregular students
     */
    public function calculateIrregularStudentFees(Student $student, string $academicYear, string $semester): float
    {
        $subjectEnrollments = $this->getStudentSubjectEnrollments($student, $academicYear, $semester);
        $irregularSubjectsCount = $subjectEnrollments->where('enrollment_type', 'irregular')->count();

        return $irregularSubjectsCount * 300.00; // 300 pesos per irregular subject
    }

    /**
     * Calculate detailed balance for irregular students.
     *
     * Formula:
     * - For each subject from past year levels: +300
     * - Plus base fee from program_fees (program, year_level, semester)
     * - For each credited subject aligned with current semester/year level: -300
     *
     * @return array with breakdown
     */
    public function calculateIrregularBalance(StudentSemesterPayment $payment): array
    {
        $student = $payment->student;
        $academicYear = $payment->academic_year;
        $semester = $payment->semester;

        // Get student's current year level
        $currentYearLevel = $student->current_year_level ?? $student->year_level;
        if (is_string($currentYearLevel)) {
            // Extract number from string like "1st Year" -> 1
            preg_match('/\d+/', $currentYearLevel, $matches);
            $currentYearLevel = isset($matches[0]) ? (int) $matches[0] : 1;
        }

        // Get all subject enrollments for this student in the current academic period
        // Include both active (current) and completed (archived) enrollments
        $subjectEnrollments = \App\Models\StudentSubjectEnrollment::with([
            'sectionSubject.subject',
            'sectionSubject.section',
        ])
            ->where('student_id', $student->id)
            ->where('academic_year', $academicYear)
            ->where('semester', $semester)
            ->whereIn('status', ['active', 'completed'])
            ->get();

        // Count subjects from past year levels (+300 each)
        $pastYearSubjectsCount = 0;
        $pastYearSubjects = [];

        foreach ($subjectEnrollments as $enrollment) {
            $subjectYearLevel = $enrollment->sectionSubject->section->year_level ?? $currentYearLevel;

            // If subject is from a past/lower year level
            if ($subjectYearLevel < $currentYearLevel) {
                $pastYearSubjectsCount++;
                $pastYearSubjects[] = [
                    'code' => $enrollment->sectionSubject->subject->subject_code,
                    'name' => $enrollment->sectionSubject->subject->subject_name,
                    'year_level' => $subjectYearLevel,
                ];
            }
        }

        $pastYearSubjectsFee = $pastYearSubjectsCount * 300;

        // Get base fee from program_fees table for this program, year level, and semester
        $programFee = \App\Models\ProgramFee::where('program_id', $student->program_id)
            ->where('year_level', $currentYearLevel)
            ->where('education_level', $student->education_level)
            ->where('fee_type', 'regular') // Use 'regular' fee type
            ->first();

        $baseFee = $programFee->semester_fee ?? $student->program->semester_fee ?? 12000.00;

        // Get credited subjects aligned with current year level and semester (-300 each)
        $creditedSubjectsCount = 0;
        $creditedSubjects = [];

        $credits = \App\Models\StudentSubjectCredit::with('subject')
            ->where('student_id', $student->id)
            ->where('year_level', $currentYearLevel)
            ->where('semester', $semester)
            ->where('credit_status', 'credited')
            ->get();

        foreach ($credits as $credit) {
            $creditedSubjectsCount++;
            $creditedSubjects[] = [
                'code' => $credit->subject_code,
                'name' => $credit->subject_name,
                'units' => $credit->units,
            ];
        }

        $creditedSubjectsDeduction = $creditedSubjectsCount * 300;

        // Calculate final balance
        $calculatedBalance = $pastYearSubjectsFee + $baseFee - $creditedSubjectsDeduction;

        // Ensure balance is not negative
        $calculatedBalance = max($calculatedBalance, 0);

        // Store the calculated balance in the payment record for future reference
        $payment->update([
            'calculated_total_amount' => $calculatedBalance,
            'irregular_balance_breakdown' => [
                'past_year_subjects_count' => $pastYearSubjectsCount,
                'past_year_subjects_fee' => $pastYearSubjectsFee,
                'past_year_subjects' => $pastYearSubjects,
                'base_fee' => $baseFee,
                'credited_subjects_count' => $creditedSubjectsCount,
                'credited_subjects_deduction' => $creditedSubjectsDeduction,
                'credited_subjects' => $creditedSubjects,
                'current_year_level' => $currentYearLevel,
                'breakdown' => "({$pastYearSubjectsCount} past subjects × ₱300) + ₱".number_format($baseFee, 2)." - ({$creditedSubjectsCount} credits × ₱300)",
            ],
            'is_balance_calculated' => true,
        ]);

        return [
            'past_year_subjects_count' => $pastYearSubjectsCount,
            'past_year_subjects_fee' => $pastYearSubjectsFee,
            'past_year_subjects' => $pastYearSubjects,
            'base_fee' => $baseFee,
            'credited_subjects_count' => $creditedSubjectsCount,
            'credited_subjects_deduction' => $creditedSubjectsDeduction,
            'credited_subjects' => $creditedSubjects,
            'calculated_balance' => $calculatedBalance,
            'current_year_level' => $currentYearLevel,
            'breakdown' => "({$pastYearSubjectsCount} past subjects × ₱300) + ₱".number_format($baseFee, 2)." - ({$creditedSubjectsCount} credits × ₱300)",
        ];
    }
}
