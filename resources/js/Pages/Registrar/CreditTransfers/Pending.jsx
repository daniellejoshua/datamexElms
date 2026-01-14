import { Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, CheckCircle, XCircle, User, BookOpen, GraduationCap } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import axios from 'axios'

export default function PendingCreditTransfers({ auth }) {
    const [pendingCredits, setPendingCredits] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedCredit, setSelectedCredit] = useState(null)
    const [gradeInfo, setGradeInfo] = useState(null)
    const [checkingGrades, setCheckingGrades] = useState(false)

    useEffect(() => {
        loadPendingCredits()
    }, [])

    const loadPendingCredits = async () => {
        setLoading(true)
        try {
            const response = await axios.get('/registrar/credit-transfers/pending')
            setPendingCredits(response.data.data.data || [])
        } catch (error) {
            console.error('Error loading pending credits:', error)
            toast.error('Failed to load pending credits')
        } finally {
            setLoading(false)
        }
    }

    const checkGradeCompletion = async (studentId, subjectId, creditId) => {
        setCheckingGrades(true)
        setSelectedCredit(creditId)
        try {
            const response = await axios.post('/registrar/credit-transfers/check-grades', {
                student_id: studentId,
                subject_id: subjectId,
            })
            setGradeInfo(response.data.data)
            
            if (response.data.data.has_completed_grades) {
                toast.success(`Student has completed all grades with ${response.data.data.semester_grade}%`)
            } else {
                toast.info('Student has not completed all grading periods yet')
            }
        } catch (error) {
            console.error('Error checking grades:', error)
            toast.error('Failed to check grade completion')
        } finally {
            setCheckingGrades(false)
        }
    }

    const updateCreditStatus = async (creditId, status, reason = null) => {
        try {
            await axios.patch(`/registrar/credit-transfers/${creditId}/status`, {
                credit_status: status,
                rejection_reason: reason,
            })
            toast.success(`Credit ${status === 'credited' ? 'approved' : 'rejected'} successfully`)
            loadPendingCredits()
            setGradeInfo(null)
            setSelectedCredit(null)
        } catch (error) {
            console.error('Error updating credit status:', error)
            toast.error('Failed to update credit status')
        }
    }

    const getStatusBadge = (status) => {
        const variants = {
            pending: 'bg-yellow-100 text-yellow-800',
            credited: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            for_catchup: 'bg-blue-100 text-blue-800',
        }
        
        return (
            <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
                {status.replace('_', ' ').toUpperCase()}
            </Badge>
        )
    }

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Pending Credit Transfers" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Pending Credit Transfers</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Review and verify student credit transfers that are awaiting grade completion
                        </p>
                    </div>

                    {loading ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <p className="text-gray-500">Loading pending credits...</p>
                            </CardContent>
                        </Card>
                    ) : pendingCredits.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <p className="text-gray-500">No pending credit transfers at this time</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {pendingCredits.map((credit) => (
                                <Card key={credit.id}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <User className="w-5 h-5 text-gray-500" />
                                                    <div>
                                                        <CardTitle className="text-lg">
                                                            {credit.student?.user?.name}
                                                        </CardTitle>
                                                        <CardDescription>
                                                            {credit.student?.student_number}
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getStatusBadge(credit.credit_status)}
                                                <Badge variant="outline">
                                                    {credit.transfer_type === 'shiftee' ? '🔄 Shiftee' : '📚 Transferee'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div className="flex items-start gap-3">
                                                <BookOpen className="w-5 h-5 text-blue-500 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700">Subject</p>
                                                    <p className="text-sm text-gray-900">
                                                        {credit.subject_code} - {credit.subject_name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {credit.units} units • Year {credit.year_level} - {credit.semester}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <GraduationCap className="w-5 h-5 text-purple-500 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700">Program</p>
                                                    <p className="text-sm text-gray-900">
                                                        {credit.new_program?.program_name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {credit.new_program?.program_code}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {selectedCredit === credit.id && gradeInfo && (
                                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                                                <h4 className="font-semibold text-sm mb-2">Grade Information</h4>
                                                {gradeInfo.has_completed_grades ? (
                                                    <div>
                                                        <div className="grid grid-cols-5 gap-2 mb-3">
                                                            <div className="text-center">
                                                                <p className="text-xs text-gray-600">Prelim</p>
                                                                <p className="font-semibold">{gradeInfo.grading_periods.prelim || '-'}</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-xs text-gray-600">Midterm</p>
                                                                <p className="font-semibold">{gradeInfo.grading_periods.midterm || '-'}</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-xs text-gray-600">Prefinal</p>
                                                                <p className="font-semibold">{gradeInfo.grading_periods.prefinal || '-'}</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-xs text-gray-600">Final</p>
                                                                <p className="font-semibold">{gradeInfo.grading_periods.final || '-'}</p>
                                                            </div>
                                                            <div className="text-center bg-blue-100 rounded">
                                                                <p className="text-xs text-blue-700">Semester</p>
                                                                <p className="font-bold text-blue-900">{gradeInfo.semester_grade}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {gradeInfo.passed ? (
                                                                <Badge className="bg-green-100 text-green-800">✓ Passed</Badge>
                                                            ) : (
                                                                <Badge className="bg-red-100 text-red-800">✗ Failed</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-600">
                                                        Student has not completed all grading periods yet.
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex gap-2 mt-4">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => checkGradeCompletion(credit.student_id, credit.subject_id, credit.id)}
                                                disabled={checkingGrades && selectedCredit === credit.id}
                                            >
                                                <Clock className="w-4 h-4 mr-2" />
                                                {checkingGrades && selectedCredit === credit.id ? 'Checking...' : 'Check Grades'}
                                            </Button>

                                            {gradeInfo && gradeInfo.has_completed_grades && selectedCredit === credit.id && (
                                                <>
                                                    {gradeInfo.passed ? (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => updateCreditStatus(credit.id, 'credited')}
                                                            className="bg-green-600 hover:bg-green-700"
                                                        >
                                                            <CheckCircle className="w-4 h-4 mr-2" />
                                                            Approve Credit
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => updateCreditStatus(credit.id, 'rejected', `Failed with grade: ${gradeInfo.semester_grade}`)}
                                                        >
                                                            <XCircle className="w-4 h-4 mr-2" />
                                                            Reject Credit
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    )
}
