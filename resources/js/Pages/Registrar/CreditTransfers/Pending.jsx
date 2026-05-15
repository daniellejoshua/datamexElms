import { Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Clock, CheckCircle, XCircle, User, BookOpen, GraduationCap, Plus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import axios from 'axios'

export default function PendingCreditTransfers({ auth }) {
    const [pendingCredits, setPendingCredits] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedCredit, setSelectedCredit] = useState(null)
    const [gradeInfo, setGradeInfo] = useState(null)
    const [checkingGrades, setCheckingGrades] = useState(false)
    const [gradeInputs, setGradeInputs] = useState({})
    
    // Add credit functionality
    const [transferees, setTransferees] = useState([])
    const [showAddCreditDialog, setShowAddCreditDialog] = useState(false)
    const [selectedTransferee, setSelectedTransferee] = useState(null)
    const [newCredit, setNewCredit] = useState({
        subject_code: '',
        subject_name: '',
        units: '',
        year_level: '',
        semester: '',
        grade: ''
    })

    useEffect(() => {
        loadPendingCredits()
        loadTransfereesWithoutCredits()
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

    const loadTransfereesWithoutCredits = async () => {
        try {
            // Get students who are transferees but don't have any credit transfers
            const response = await axios.get('/registrar/students?enrollment_status=enrolled&student_type=transferee')
            const students = response.data.data || []
            
            // Filter out students who already have credit transfers
            const studentsWithoutCredits = []
            for (const student of students) {
                const creditResponse = await axios.get(`/registrar/credit-transfers/student/${student.id}`)
                if (!creditResponse.data.data.credited_subjects.length) {
                    studentsWithoutCredits.push(student)
                }
            }
            
            setTransferees(studentsWithoutCredits)
        } catch (error) {
            console.error('Error loading transferees:', error)
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

    const updateCreditGrade = async (creditId, grade) => {
        try {
            await axios.patch(`/registrar/credit-transfers/${creditId}/grade`, {
                verified_semester_grade: grade,
            })
            toast.success('Grade updated successfully')
            // Update local state
            setGradeInputs(prev => ({ ...prev, [creditId]: grade }))
        } catch (error) {
            console.error('Error updating credit grade:', error)
            toast.error('Failed to update credit grade')
        }
    }

    const addCreditTransfer = async () => {
        if (!selectedTransferee || !newCredit.subject_code || !newCredit.subject_name || !newCredit.units) {
            toast.error('Please fill in all required fields')
            return
        }

        try {
            await axios.post('/registrar/credit-transfers/', {
                student_id: selectedTransferee.id,
                transfer_type: 'transferee',
                credited_subjects: [{
                    subject_code: newCredit.subject_code,
                    subject_name: newCredit.subject_name,
                    units: parseInt(newCredit.units),
                    year_level: parseInt(newCredit.year_level) || 1,
                    semester: newCredit.semester || '1st',
                    grade: newCredit.grade || null,
                    previous_school: selectedTransferee.previous_school || null,
                }],
            })

            toast.success('Credit transfer added successfully')
            setShowAddCreditDialog(false)
            setNewCredit({
                subject_code: '',
                subject_name: '',
                units: '',
                year_level: '',
                semester: '',
                grade: ''
            })
            setSelectedTransferee(null)
            loadPendingCredits() // Refresh the pending credits list
            loadTransfereesWithoutCredits() // Refresh the transferees list
        } catch (error) {
            console.error('Error adding credit transfer:', error)
            toast.error('Failed to add credit transfer')
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
                                            {credit.transfer_type === 'shiftee' ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => checkGradeCompletion(credit.student_id, credit.subject_id, credit.id)}
                                                    disabled={checkingGrades && selectedCredit === credit.id}
                                                >
                                                    <Clock className="w-4 h-4 mr-2" />
                                                    {checkingGrades && selectedCredit === credit.id ? 'Checking...' : 'Check Grades'}
                                                </Button>
                                            ) : (
                                                // For transferees, show grade input
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="text"
                                                        placeholder="Enter grade (e.g., 1.25, 2.0)"
                                                        value={gradeInputs[credit.id] || credit.verified_semester_grade || ''}
                                                        onChange={(e) => setGradeInputs(prev => ({ ...prev, [credit.id]: e.target.value }))}
                                                        className="w-32"
                                                        size="sm"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => updateCreditGrade(credit.id, gradeInputs[credit.id] || credit.verified_semester_grade)}
                                                        disabled={!gradeInputs[credit.id] && !credit.verified_semester_grade}
                                                    >
                                                        Save Grade
                                                    </Button>
                                                </div>
                                            )}

                                            {((gradeInfo && gradeInfo.has_completed_grades && selectedCredit === credit.id) || 
                                              (credit.transfer_type === 'transferee' && (gradeInputs[credit.id] || credit.verified_semester_grade))) && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => updateCreditStatus(credit.id, 'credited')}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                        Approve Credit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => updateCreditStatus(credit.id, 'rejected', 'Credit rejected by registrar')}
                                                    >
                                                        <XCircle className="w-4 h-4 mr-2" />
                                                        Reject Credit
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Transferees without credit transfers */}
                    {transferees.length > 0 && (
                        <div className="mt-8">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Transferees Needing Credit Evaluation</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Add credit transfers for transferee students who have completed subjects at their previous school
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {transferees.map((student) => (
                                    <Card key={student.id}>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center gap-3">
                                                <User className="w-5 h-5 text-gray-500" />
                                                <div>
                                                    <CardTitle className="text-lg">
                                                        {student.user?.name}
                                                    </CardTitle>
                                                    <CardDescription>
                                                        {student.student_number}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2 text-sm text-gray-600">
                                                <p><strong>Program:</strong> {student.program?.program_name}</p>
                                                <p><strong>Year Level:</strong> {student.year_level}</p>
                                                {student.previous_school && (
                                                    <p><strong>Previous School:</strong> {student.previous_school}</p>
                                                )}
                                            </div>
                                            <Button
                                                className="w-full mt-4"
                                                onClick={() => {
                                                    setSelectedTransferee(student)
                                                    setShowAddCreditDialog(true)
                                                }}
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Credit Transfer
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Credit Transfer Dialog */}
            <Dialog open={showAddCreditDialog} onOpenChange={setShowAddCreditDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add Credit Transfer</DialogTitle>
                        <DialogDescription>
                            Add a subject that {selectedTransferee?.user?.name} has completed at their previous school
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="subject_code">Subject Code</Label>
                                <Input
                                    id="subject_code"
                                    value={newCredit.subject_code}
                                    onChange={(e) => setNewCredit(prev => ({ ...prev, subject_code: e.target.value }))}
                                    placeholder="e.g., MATH101"
                                />
                            </div>
                            <div>
                                <Label htmlFor="subject_name">Subject Name</Label>
                                <Input
                                    id="subject_name"
                                    value={newCredit.subject_name}
                                    onChange={(e) => setNewCredit(prev => ({ ...prev, subject_name: e.target.value }))}
                                    placeholder="e.g., College Algebra"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="units">Units</Label>
                                <Input
                                    id="units"
                                    type="number"
                                    value={newCredit.units}
                                    onChange={(e) => setNewCredit(prev => ({ ...prev, units: e.target.value }))}
                                    placeholder="3"
                                />
                            </div>
                            <div>
                                <Label htmlFor="year_level">Year Level</Label>
                                <Select value={newCredit.year_level} onValueChange={(value) => setNewCredit(prev => ({ ...prev, year_level: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1st Year</SelectItem>
                                        <SelectItem value="2">2nd Year</SelectItem>
                                        <SelectItem value="3">3rd Year</SelectItem>
                                        <SelectItem value="4">4th Year</SelectItem>
                                        <SelectItem value="5">5th Year</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="semester">Semester</Label>
                                <Select value={newCredit.semester} onValueChange={(value) => setNewCredit(prev => ({ ...prev, semester: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select semester" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1st">1st Semester</SelectItem>
                                        <SelectItem value="2nd">2nd Semester</SelectItem>
                                        <SelectItem value="Summer">Summer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="grade">Grade (Optional)</Label>
                            <Input
                                id="grade"
                                value={newCredit.grade}
                                onChange={(e) => setNewCredit(prev => ({ ...prev, grade: e.target.value }))}
                                placeholder="e.g., 1.25, 2.0, 85"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setShowAddCreditDialog(false)
                                setNewCredit({
                                    subject_code: '',
                                    subject_name: '',
                                    units: '',
                                    year_level: '',
                                    semester: '',
                                    grade: ''
                                })
                                setSelectedTransferee(null)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={addCreditTransfer}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Add Credit Transfer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    )
}
