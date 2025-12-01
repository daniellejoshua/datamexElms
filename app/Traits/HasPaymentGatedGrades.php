<?php

namespace App\Traits;

use App\Models\StudentPayment;

trait HasPaymentGatedGrades
{
    /**
     * Check if student can view grades for a specific period
     */
    public function canViewGradesForPeriod(string $academicYear, string $semester, string $period): bool
    {
        $payment = $this->payments()
            ->where('academic_year', $academicYear)
            ->where('semester', $semester)
            ->where('period_name', $period)
            ->first();
            
        return $payment && $payment->canViewGrades();
    }

    /**
     * Get grades with payment status filtering
     */
    public function getGradesWithPaymentStatus(string $academicYear, string $semester, ?string $userRole = null)
    {
        $grades = $this->studentGrades()
            ->with(['studentEnrollment.section.subject'])
            ->where('academic_year', $academicYear)
            ->where('semester', $semester)
            ->get();

        // Admins and registrars can see all grades
        if (in_array($userRole, ['admin', 'registrar'])) {
            return $grades->map(function ($grade) {
                $grade->payment_required = false;
                $grade->can_view = true;
                return $grade;
            });
        }

        // For students, check payment status for each period
        return $grades->map(function ($grade) use ($academicYear, $semester) {
            $canView = $this->canViewGradesForPeriod($academicYear, $semester, $grade->period);
            $grade->payment_required = !$canView;
            $grade->can_view = $canView;
            
            // Hide actual grades if payment not made
            if (!$canView) {
                $grade->grade = 'Payment Required';
                $grade->numeric_grade = null;
            }
            
            return $grade;
        });
    }

    /**
     * Get payment summary for student
     */
    public function getPaymentSummary(string $academicYear, string $semester): array
    {
        $payments = $this->payments()
            ->forPeriod($academicYear, $semester)
            ->get();

        $totalDue = $payments->sum('amount_due');
        $totalPaid = $payments->sum('amount_paid');
        $balance = $totalDue - $totalPaid;
        
        $paidPeriods = $payments->where('is_paid', true)->pluck('period_name')->toArray();
        $unpaidPeriods = $payments->where('is_paid', false)->pluck('period_name')->toArray();

        return [
            'total_due' => $totalDue,
            'total_paid' => $totalPaid,
            'balance' => $balance,
            'payment_percentage' => $totalDue > 0 ? ($totalPaid / $totalDue) * 100 : 0,
            'paid_periods' => $paidPeriods,
            'unpaid_periods' => $unpaidPeriods,
            'payments' => $payments
        ];
    }
}