<?php

namespace App\Http\Middleware;

use App\Models\StudentPayment;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPaymentForGradeAccess
{
    /**
     * Handle an incoming request.
     * 
     * Admins and registrars can bypass payment restrictions.
     * Students must have paid for the specific period to view grades.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        // Allow admins and registrars to bypass payment restrictions
        if (!$user || in_array($user->role, ['admin', 'registrar'])) {
            return $next($request);
        }
        
        // Only apply to students
        if ($user->role !== 'student') {
            return $next($request);
        }
        
        // Get grade access parameters from route or request
        $studentId = $request->route('student_id') ?? $user->student?->id;
        $academicYear = $request->get('academic_year');
        $semester = $request->get('semester');
        $period = $request->get('period');
        
        // If no specific period requested, let the controller handle visibility
        if (!$studentId || !$academicYear || !$semester || !$period) {
            return $next($request);
        }
        
        // Check if payment exists and is paid for this period
        $payment = StudentPayment::where('student_id', $studentId)
            ->where('academic_year', $academicYear)
            ->where('semester', $semester)
            ->where('period_name', $period)
            ->first();
            
        if (!$payment || !$payment->canViewGrades()) {
            return response()->json([
                'message' => 'Payment required to view grades for this period.',
                'payment_required' => true,
                'period' => $period,
                'payment_status' => $payment?->payment_status ?? 'not_found'
            ], 402); // 402 Payment Required
        }
        
        return $next($request);
    }
}
