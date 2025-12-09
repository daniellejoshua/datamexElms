import { Head, Link, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Save } from 'lucide-react'
import { Plus, Eye, Edit, BookOpen, Users, DollarSign } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function ProgramsIndex({ programs, auth }) {
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feeErrors, setFeeErrors] = useState({});
    const [subjectModalOpen, setSubjectModalOpen] = useState(false);
    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [selectedSubjects, setSelectedSubjects] = useState(new Set());

    const { data, setData, put, processing, errors, reset } = useForm({
        name: '',
        code: '',
        description: '',
        education_level: '',
        program_fees: [],
    });

    const educationLevels = [
        { value: 'college', label: 'College' },
        { value: 'masteral', label: 'Masteral' },
        { value: 'shs', label: 'Senior High School' },
    ];

    const openEditModal = (program) => {
        setSelectedProgram(program);
        setData({
            name: program.name || '',
            code: program.code || '',
            description: program.description || '',
            education_level: program.education_level || '',
            program_fees: program.program_fees || [],
        });
        setEditModalOpen(true);
    };

    // Initialize program fees if empty
    useEffect(() => {
        if (selectedProgram && (!data.program_fees || data.program_fees.length === 0)) {
            const defaultFees = [];
            // Create fees for each year level (1-4 for bachelor's, 1-2 for master's)
            const maxYears = data.education_level === 'masteral' ? 2 : 4;

            for (let year = 1; year <= maxYears; year++) {
                defaultFees.push({
                    year_level: year,
                    fee_type: 'regular',
                    semester_fee: 0,
                });
            }
            setData('program_fees', defaultFees);
        }
    }, [data.education_level, selectedProgram]);

    const updateFee = (yearLevel, amount) => {
        const updatedFees = data.program_fees.map(fee =>
            fee.year_level === yearLevel && fee.fee_type === 'regular'
                ? { ...fee, semester_fee: parseFloat(amount) || 0 }
                : fee
        );
        setData('program_fees', updatedFees);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFeeErrors({});

        try {
            await put(route('registrar.programs.update', selectedProgram.id), {
                onSuccess: () => {
                    setEditModalOpen(false);
                    setSelectedProgram(null);
                    reset();
                    window.location.reload(); // Refresh to show updated data
                },
                onError: (errors) => {
                    setFeeErrors(errors);
                }
            });
        } catch (error) {
            console.error('Submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openSubjectModal = async (program) => {
        setSelectedProgram(program);
        setSelectedSubjects(new Set(program.subjects?.map(s => s.id) || []));

        // Load available subjects for this program's education level
        try {
            const response = await fetch(route('registrar.programs.subjects.by-education-level', program.education_level));
            const subjectsData = await response.json();
            setAvailableSubjects(subjectsData);
        } catch (error) {
            console.error('Error loading subjects:', error);
            setAvailableSubjects({});
        }

        setSubjectModalOpen(true);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount)
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <BookOpen className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Course Management</h2>
                            <p className="text-sm text-blue-600 font-medium mt-1">
                                Manage programs, set semester fees, and handle subjects
                            </p>
                        </div>
                    </div>
                    <Link href={route('registrar.programs.create')}>
                        <Button className="mt-4 sm:mt-0">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Program
                        </Button>
                    </Link>
                </div>
            }
        >
            <Head title="Course Management" />

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {programs.map((program) => (
                        <Card key={program.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">{program.program_name}</CardTitle>
                                    <Badge variant={program.status === 'active' ? 'default' : 'secondary'}>
                                        {program.status}
                                    </Badge>
                                </div>
                                <CardDescription>
                                    {program.program_code} • {program.education_level.toUpperCase()}
                                    {program.track && ` • ${program.track}`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-sm text-gray-600">Semester Fees by Year (per semester):</span>
                                        <div className="mt-1 space-y-1">
                                            {program.program_fees
                                                ?.filter(fee => fee.fee_type === 'regular')
                                                ?.sort((a, b) => a.year_level - b.year_level)
                                                ?.map(fee => (
                                                <div key={fee.id} className="flex justify-between text-xs">
                                                    <span>Year {fee.year_level}:</span>
                                                    <span className="font-semibold text-green-600">
                                                        {formatCurrency(fee.semester_fee)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Duration:</span>
                                        <span>{program.total_years} years</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Students:</span>
                                        <span className="flex items-center">
                                            <Users className="w-4 h-4 mr-1" />
                                            {program.students_count}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Subjects:</span>
                                        <span className="flex items-center">
                                            <BookOpen className="w-4 h-4 mr-1" />
                                            {program.subjects.length}
                                        </span>
                                    </div>
                                    {program.description && (
                                        <p className="text-sm text-gray-600 mt-2">
                                            {program.description}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <Link href={route('registrar.programs.show', program.id)}>
                                        <Button variant="outline" size="sm">
                                            <Eye className="w-4 h-4 mr-1" />
                                            View
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openEditModal(program)}
                                    >
                                        <Edit className="w-4 h-4 mr-1" />
                                        Edit
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {programs.length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <BookOpen className="w-12 h-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Programs Found</h3>
                            <p className="text-gray-600 text-center mb-4">
                                Get started by creating your first program.
                            </p>
                            <Link href={route('registrar.programs.create')}>
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Program
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Edit Program Modal */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Program</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="name">Program Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="code">Program Code</Label>
                                <Input
                                    id="code"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value)}
                                    required
                                />
                                {errors.code && (
                                    <p className="text-sm text-red-600 mt-1">{errors.code}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                            />
                            {errors.description && (
                                <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="education_level">Education Level</Label>
                            <Select
                                value={data.education_level}
                                onValueChange={(value) => setData('education_level', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select education level" />
                                </SelectTrigger>
                                <SelectContent>
                                    {educationLevels.map((level) => (
                                        <SelectItem key={level.value} value={level.value}>
                                            {level.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.education_level && (
                                <p className="text-sm text-red-600 mt-1">{errors.education_level}</p>
                            )}
                        </div>

                        <div>
                            <Label className="text-base font-semibold">Regular Student Fees by Year Level</Label>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Set different fees for each year level. These fees will be automatically applied to regular students during enrollment.
                            </p>

                            <div className="space-y-4">
                                {Array.from({ length: data.education_level === 'masteral' ? 2 : 4 }, (_, i) => i + 1).map((year) => {
                                    const fee = data.program_fees.find(
                                        f => f.year_level === year && f.fee_type === 'regular'
                                    );
                                    const amount = fee ? fee.semester_fee : 0;

                                    return (
                                        <div key={year} className="flex items-center gap-4 p-4 border rounded-lg">
                                            <Label className="w-32">
                                                {year}{year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} Year (per semester):
                                            </Label>
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                                    ₱
                                                </span>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={amount}
                                                    onChange={(e) => updateFee(year, e.target.value)}
                                                    className="pl-8"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {Object.keys(feeErrors).length > 0 && (
                                <Alert className="mt-4">
                                    <AlertDescription>
                                        Please check the fee fields for errors.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>

                        <div>
                            <Label className="text-base font-semibold">Program Subjects</Label>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Manage subjects for this program. Subjects define the curriculum and course offerings.
                            </p>

                            {/* Existing Subjects */}
                            {selectedProgram?.subjects && selectedProgram.subjects.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium mb-2">Current Subjects ({selectedProgram.subjects.length})</h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {selectedProgram.subjects.map((subject) => (
                                            <div key={subject.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                                <div>
                                                    <span className="font-medium">{subject.subject_code}</span>
                                                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                                                        {subject.subject_name}
                                                    </span>
                                                    <Badge variant="outline" className="ml-2">
                                                        Year {subject.year_level}, {subject.semester === 1 ? '1st' : '2nd'} Sem
                                                    </Badge>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {subject.units} units
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Manage Subjects Button */}
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => openSubjectModal(selectedProgram)}
                            >
                                <BookOpen className="w-4 h-4 mr-2" />
                                Manage Program Subjects
                            </Button>

                            <p className="text-xs text-gray-500 mt-2">
                                Select subjects from the available subject pool to assign to this program.
                            </p>
                        </div>

                        <div className="flex justify-end space-x-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditModalOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing || isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Subject Management Modal */}
            <Dialog open={subjectModalOpen} onOpenChange={setSubjectModalOpen}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Manage Subjects for {selectedProgram?.name}</DialogTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Select subjects to assign to this program. Subjects are organized by year level and semester.
                        </p>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Year Level Tabs */}
                        {[1, 2, 3, 4].map(year => (
                            <div key={year} className="border rounded-lg p-4">
                                <h3 className="text-lg font-semibold mb-4">
                                    {year}{year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} Year
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* 1st Semester */}
                                    <div>
                                        <h4 className="text-md font-medium mb-3 text-blue-600">1st Semester</h4>
                                        <div className="space-y-2">
                                            {availableSubjects[year]?.[1]?.length > 0 ? (
                                                availableSubjects[year][1].map(subject => {
                                                    const isSelected = selectedSubjects.has(subject.id);
                                                    return (
                                                        <div
                                                            key={subject.id}
                                                            className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${
                                                                isSelected
                                                                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                                                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700'
                                                            }`}
                                                            onClick={() => {
                                                                const newSelected = new Set(selectedSubjects);
                                                                if (isSelected) {
                                                                    newSelected.delete(subject.id);
                                                                } else {
                                                                    newSelected.add(subject.id);
                                                                }
                                                                setSelectedSubjects(newSelected);
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => {}} // Handled by onClick
                                                                    className="rounded"
                                                                />
                                                                <div>
                                                                    <span className="font-medium">{subject.subject_code}</span>
                                                                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                                                                        {subject.subject_name}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {subject.units} units • {subject.subject_type}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="text-sm text-gray-500 italic">
                                                    No subjects available for Year {year}, 1st Semester
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2nd Semester */}
                                    <div>
                                        <h4 className="text-md font-medium mb-3 text-green-600">2nd Semester</h4>
                                        <div className="space-y-2">
                                            {availableSubjects[year]?.[2]?.length > 0 ? (
                                                availableSubjects[year][2].map(subject => {
                                                    const isSelected = selectedSubjects.has(subject.id);
                                                    return (
                                                        <div
                                                            key={subject.id}
                                                            className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${
                                                                isSelected
                                                                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                                                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700'
                                                            }`}
                                                            onClick={() => {
                                                                const newSelected = new Set(selectedSubjects);
                                                                if (isSelected) {
                                                                    newSelected.delete(subject.id);
                                                                } else {
                                                                    newSelected.add(subject.id);
                                                                }
                                                                setSelectedSubjects(newSelected);
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => {}} // Handled by onClick
                                                                    className="rounded"
                                                                />
                                                                <div>
                                                                    <span className="font-medium">{subject.subject_code}</span>
                                                                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                                                                        {subject.subject_name}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {subject.units} units • {subject.subject_type}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="text-sm text-gray-500 italic">
                                                    No subjects available for Year {year}, 2nd Semester
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end space-x-4 mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setSubjectModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={async () => {
                                try {
                                    await router.post(route('registrar.programs.subjects.store', selectedProgram.id), {
                                        subject_ids: Array.from(selectedSubjects)
                                    }, {
                                        onSuccess: () => {
                                            setSubjectModalOpen(false);
                                            window.location.reload(); // Refresh to show updated data
                                        }
                                    });
                                } catch (error) {
                                    console.error('Error saving subjects:', error);
                                }
                            }}
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Save Subject Assignments
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    )
}