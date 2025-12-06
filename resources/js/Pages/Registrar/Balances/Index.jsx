import { Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DollarSign, Users, Calculator, Plus, Search, Edit3, Save, X } from 'lucide-react'
import { useState } from 'react'

export default function StudentBalances({ balances, students, auth }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [editingBalance, setEditingBalance] = useState(null)
    const [balanceForm, setBalanceForm] = useState({
        amount: '',
        payment_type: '',
        description: '',
        academic_year: '',
        semester: ''
    })

    const filteredBalances = balances.filter(balance =>
        balance.student?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        balance.student?.student_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        balance.payment_type?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', { 
            style: 'currency', 
            currency: 'PHP' 
        }).format(amount)
    }

    const handleEditBalance = (balance) => {
        setEditingBalance(balance.id)
        setBalanceForm({
            amount: balance.amount,
            payment_type: balance.payment_type,
            description: balance.description,
            academic_year: balance.academic_year,
            semester: balance.semester
        })
    }

    const handleSaveBalance = (balanceId) => {
        router.patch(route('registrar.balances.update', balanceId), balanceForm, {
            onSuccess: () => {
                setEditingBalance(null)
                setBalanceForm({
                    amount: '',
                    payment_type: '',
                    description: '',
                    academic_year: '',
                    semester: ''
                })
            }
        })
    }

    const handleCancelEdit = () => {
        setEditingBalance(null)
        setBalanceForm({
            amount: '',
            payment_type: '',
            description: '',
            academic_year: '',
            semester: ''
        })
    }

    const getEducationLevelColor = (level) => {
        return level === 'college' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-green-100 text-green-800'
    }

    const currentYear = new Date().getFullYear()
    const academicYears = [
        `${currentYear-1}-${currentYear}`,
        `${currentYear}-${currentYear+1}`,
        `${currentYear+1}-${currentYear+2}`
    ]

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-2 rounded-lg">
                        <Calculator className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Student Balances</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Set exact balance amounts for student courses and manage billing
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Student Balances" />

            <div className="space-y-6">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Balances</CardTitle>
                            <Calculator className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{balances.length}</div>
                            <p className="text-xs text-muted-foreground">
                                Active balance records
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">College Students</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {balances.filter(b => b.education_level === 'college').length}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                College balances
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">SHS Students</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {balances.filter(b => b.education_level === 'shs').length}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                SHS balances
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {formatCurrency(balances.reduce((sum, b) => sum + b.amount, 0))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Outstanding balances
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Balance Set */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Calculator className="w-5 h-5 mr-2" />
                            Quick Balance Set
                        </CardTitle>
                        <CardDescription>
                            Set exact balance amounts for specific students and courses
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <select className="border border-gray-300 rounded-md px-3 py-2">
                                <option value="">Select Student...</option>
                                {students.map(student => (
                                    <option key={student.id} value={student.id}>
                                        {student.user.name} - {student.student_number}
                                    </option>
                                ))}
                            </select>
                            <Input 
                                placeholder="Amount (e.g., 5000)"
                                type="number"
                                step="0.01"
                            />
                            <Button className="w-full">
                                <Plus className="w-4 h-4 mr-2" />
                                Set Balance
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Search and Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Search Balances</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search by student name, number, or payment type..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <select className="border border-gray-300 rounded-md px-3 py-2">
                                <option value="">All Education Levels</option>
                                <option value="college">College</option>
                                <option value="shs">SHS</option>
                            </select>
                            <select className="border border-gray-300 rounded-md px-3 py-2">
                                <option value="">All Payment Types</option>
                                <option value="tuition">Tuition Fee</option>
                                <option value="miscellaneous">Miscellaneous Fee</option>
                                <option value="laboratory">Laboratory Fee</option>
                                <option value="graduation">Graduation Fee</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Balances Table */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="flex items-center">
                                    <DollarSign className="w-5 h-5 mr-2" />
                                    Student Balances ({filteredBalances.length})
                                </CardTitle>
                                <CardDescription>
                                    Manage exact balance amounts for students
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4">Student</th>
                                        <th className="text-left py-3 px-4">Education Level</th>
                                        <th className="text-left py-3 px-4">Payment Type</th>
                                        <th className="text-left py-3 px-4">Academic Year</th>
                                        <th className="text-left py-3 px-4">Balance Amount</th>
                                        <th className="text-left py-3 px-4">Description</th>
                                        <th className="text-left py-3 px-4">Last Updated</th>
                                        <th className="text-right py-3 px-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBalances.map((balance) => (
                                        <tr key={balance.id} className="border-b hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {balance.student?.user?.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {balance.student?.student_number}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge 
                                                    variant="secondary"
                                                    className={getEducationLevelColor(balance.education_level)}
                                                >
                                                    {balance.education_level?.toUpperCase()}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4">
                                                {editingBalance === balance.id ? (
                                                    <select 
                                                        value={balanceForm.payment_type}
                                                        onChange={(e) => setBalanceForm({...balanceForm, payment_type: e.target.value})}
                                                        className="w-full border rounded px-2 py-1 text-sm"
                                                    >
                                                        <option value="tuition">Tuition Fee</option>
                                                        <option value="miscellaneous">Miscellaneous Fee</option>
                                                        <option value="laboratory">Laboratory Fee</option>
                                                        <option value="graduation">Graduation Fee</option>
                                                        <option value="other">Other</option>
                                                    </select>
                                                ) : (
                                                    <span className="font-medium capitalize">
                                                        {balance.payment_type?.replace('_', ' ')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                {editingBalance === balance.id ? (
                                                    <div>
                                                        <select 
                                                            value={balanceForm.academic_year}
                                                            onChange={(e) => setBalanceForm({...balanceForm, academic_year: e.target.value})}
                                                            className="w-full border rounded px-2 py-1 text-sm mb-1"
                                                        >
                                                            {academicYears.map(year => (
                                                                <option key={year} value={year}>{year}</option>
                                                            ))}
                                                        </select>
                                                        <select 
                                                            value={balanceForm.semester}
                                                            onChange={(e) => setBalanceForm({...balanceForm, semester: e.target.value})}
                                                            className="w-full border rounded px-2 py-1 text-sm"
                                                        >
                                                            <option value="1st Semester">1st Semester</option>
                                                            <option value="2nd Semester">2nd Semester</option>
                                                            <option value="Summer">Summer</option>
                                                        </select>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="font-medium">
                                                            {balance.academic_year}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {balance.semester}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                {editingBalance === balance.id ? (
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={balanceForm.amount}
                                                        onChange={(e) => setBalanceForm({...balanceForm, amount: e.target.value})}
                                                        className="w-24"
                                                    />
                                                ) : (
                                                    <span className="font-medium text-red-600">
                                                        {formatCurrency(balance.amount)}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                {editingBalance === balance.id ? (
                                                    <Textarea
                                                        value={balanceForm.description}
                                                        onChange={(e) => setBalanceForm({...balanceForm, description: e.target.value})}
                                                        className="text-sm"
                                                        rows={2}
                                                    />
                                                ) : (
                                                    <span className="text-sm text-gray-600">
                                                        {balance.description}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-500">
                                                {new Date(balance.updated_at).toLocaleDateString()}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex justify-end gap-2">
                                                    {editingBalance === balance.id ? (
                                                        <>
                                                            <Button 
                                                                size="sm" 
                                                                onClick={() => handleSaveBalance(balance.id)}
                                                                className="bg-green-600 hover:bg-green-700"
                                                            >
                                                                <Save className="w-3 h-3 mr-1" />
                                                                Save
                                                            </Button>
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline"
                                                                onClick={handleCancelEdit}
                                                            >
                                                                <X className="w-3 h-3 mr-1" />
                                                                Cancel
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline"
                                                            onClick={() => handleEditBalance(balance)}
                                                        >
                                                            <Edit3 className="w-3 h-3 mr-1" />
                                                            Edit
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {filteredBalances.length === 0 && (
                                <div className="text-center py-8">
                                    <Calculator className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No balances found</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {searchTerm ? 'Try adjusting your search criteria.' : 'No student balances have been set yet.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    )
}