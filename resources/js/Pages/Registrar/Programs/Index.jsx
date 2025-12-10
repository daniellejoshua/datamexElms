import { Head, Link, useForm, router } from '@inertiajs/react'
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
import { Plus, Eye, Edit, BookOpen, Users, DollarSign, Filter, Search, GraduationCap, Building2, ChevronRight, Star } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function ProgramsIndex({ programs, auth, filters = {} }) {
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feeErrors, setFeeErrors] = useState({});
    const [subjectModalOpen, setSubjectModalOpen] = useState(false);
    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [selectedSubjects, setSelectedSubjects] = useState(new Set());

    // Filter states
    const [selectedEducationLevel, setSelectedEducationLevel] = useState(filters.education_level || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    const { data, setData, put, processing, errors, reset } = useForm({
        program_name: '',
        program_code: '',
        description: '',
        education_level: '',
        program_fees: [],
    });

    const educationLevels = [
        { value: 'college', label: 'College' },
        { value: 'shs', label: 'Senior High School' },
    ];

    const statusOptions = [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
    ];

    const handleFilterChange = (type, value) => {
        const newFilters = { ...filters };

        if (value === 'all' || value === '') {
            delete newFilters[type];
        } else {
            newFilters[type] = value;
        }

        // Update local state
        if (type === 'education_level') {
            setSelectedEducationLevel(value === 'all' ? '' : value);
        } else if (type === 'status') {
            setSelectedStatus(value === 'all' ? '' : value);
        } else if (type === 'search') {
            setSearchQuery(value);
        }

        // Navigate with filters
        router.get(route('registrar.programs.index'), newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const openEditModal = (program) => {
        setSelectedProgram(program);
        setData({
            program_name: program.program_name || program.name || '',
            program_code: program.program_code || program.code || '',
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
        const numericAmount = amount === '' ? 0 : parseFloat(amount) || 0;
        const updatedFees = data.program_fees.map(fee =>
            fee.year_level === yearLevel && fee.fee_type === 'regular'
                ? { ...fee, semester_fee: numericAmount }
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
                    // Don't reset here, let the modal close first
                    setTimeout(() => {
                        reset();
                        window.location.reload(); // Refresh to show updated data
                    }, 100);
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
                <div className="flex items-center justify-between px-2 py-1">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-1.5 rounded-md">
                            <GraduationCap className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Programs</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Manage academic programs and curriculum</p>
                        </div>
                    </div>
                    <Button asChild size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs h-7 px-2">
                        <Link href={route('registrar.programs.create')}>
                            <Plus className="w-3 h-3 mr-1" />
                            Create
                        </Link>
                    </Button>
                </div>
            }
        >
            <Head title="Course Management" />

            <div className="space-y-6">
                {/* Filters */}
                <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3 mb-3">
                            <Filter className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">Filter Programs</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Search Filter */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-600 flex items-center gap-1 h-4">
                                    <Search className="w-3 h-3" />
                                    Search Programs
                                </label>
                                <Input
                                    placeholder="Search by name or code..."
                                    value={searchQuery}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className="h-8 text-sm border-blue-200 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-200"
                                />
                            </div>

                            {/* Education Level Filter */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-600 h-4 flex items-center">Education Level</label>
                                <Select
                                    value={selectedEducationLevel || 'all'}
                                    onValueChange={(value) => handleFilterChange('education_level', value)}
                                >
                                    <SelectTrigger className="h-8 text-sm border-blue-200 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-200">
                                        <SelectValue placeholder="All Levels" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Education Levels</SelectItem>
                                        {educationLevels.map((level) => (
                                            <SelectItem key={level.value} value={level.value}>
                                                {level.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Status Filter */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-600 h-4 flex items-center">Status</label>
                                <Select
                                    value={selectedStatus || 'all'}
                                    onValueChange={(value) => handleFilterChange('status', value)}
                                >
                                    <SelectTrigger className="h-8 text-sm border-blue-200 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-200">
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        {statusOptions.map((status) => (
                                            <SelectItem key={status.value} value={status.value}>
                                                {status.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {programs.data.map((program) => (
                        <Card key={program.id} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 relative overflow-hidden">
                            {/* Status Badge */}
                            <div className="absolute top-4 right-4">
                                <Badge
                                    className={`shadow-md font-semibold ${
                                        program.status === 'active'
                                            ? 'bg-white text-green-600 border-green-600'
                                            : 'bg-white text-red-600 border-red-600'
                                    }`}
                                >
                                    {program.status}
                                </Badge>
                            </div>

                            <CardHeader className="pb-4">
                                <div className="flex items-start space-x-3">
                                    <div className="p-3 bg-blue-600 rounded-xl flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                                        <GraduationCap className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                                            {program.program_code}
                                        </CardTitle>
                                        <CardDescription className="text-blue-600 font-semibold truncate">
                                            {program.program_name}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                {/* Program Details */}
                                <div className="space-y-4">
                                    <Card className="p-3 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
                                        <div className="flex items-center text-sm">
                                            <Building2 className="w-4 h-4 text-green-600 mr-3 flex-shrink-0" />
                                            <span className="text-gray-700 font-medium truncate">
                                                {program.education_level.toUpperCase()} • {program.total_years} Years
                                            </span>
                                        </div>
                                    </Card>

                                    <div className="grid grid-cols-2 gap-2">
                                        <Card className="p-2 text-center bg-orange-50 border-orange-200">
                                            <div className="flex flex-col items-center">
                                                <BookOpen className="w-4 h-4 text-orange-600 mb-1" />
                                                <span className="text-xs font-semibold text-gray-700">
                                                    {program.subjects.length}
                                                </span>
                                                <span className="text-xs text-gray-600">Subjects</span>
                                            </div>
                                        </Card>

                                        <Card className="p-2 text-center bg-purple-50 border-purple-200">
                                            <div className="flex flex-col items-center">
                                                <Users className="w-4 h-4 text-purple-600 mb-1" />
                                                <span className="text-xs font-semibold text-gray-700">
                                                    {program.students_count}
                                                </span>
                                                <span className="text-xs text-gray-600">Students</span>
                                            </div>
                                        </Card>
                                    </div>

                                    {/* Fee Information */}
                                    <Card className="p-3 bg-blue-50 border-blue-200">
                                        <div className="flex items-center text-sm">
                                            <DollarSign className="w-4 h-4 text-blue-600 mr-3 flex-shrink-0" />
                                            <div className="flex-1">
                                                <span className="text-gray-700 font-medium">Semester Fees (per semester)</span>
                                                <div className="mt-1 space-y-1">
                                                    {program.program_fees
                                                        ?.filter(fee => fee.fee_type === 'regular')
                                                        ?.sort((a, b) => a.year_level - b.year_level)
                                                        ?.slice(0, 2) // Show only first 2 years for brevity
                                                        ?.map(fee => (
                                                        <div key={fee.id} className="flex justify-between text-xs">
                                                            <span>Year {fee.year_level}:</span>
                                                            <span className="font-semibold text-green-600">
                                                                {formatCurrency(fee.semester_fee)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {program.program_fees?.filter(fee => fee.fee_type === 'regular').length > 2 && (
                                                        <div className="text-xs text-gray-500">
                                                            +{program.program_fees.filter(fee => fee.fee_type === 'regular').length - 2} more years
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-3">
                                    <Button
                                        onClick={() => openSubjectModal(program)}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                                    >
                                        <BookOpen className="w-4 h-4 mr-2" />
                                        Manage Subjects
                                        <ChevronRight className="w-4 h-4 ml-auto" />
                                    </Button>

                                    <div className="grid grid-cols-2 gap-2">
                                        <Button asChild variant="outline" className="border-2 border-blue-300 text-blue-700 hover:bg-blue-50 font-medium">
                                            <Link href={route('registrar.programs.show', program.id)}>
                                                <Eye className="w-3 h-3 mr-1" />
                                                View
                                            </Link>
                                        </Button>
                                        <Button variant="outline" className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium" onClick={() => openEditModal(program)}>
                                            <Edit className="w-3 h-3 mr-1" />
                                            Edit
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {programs.data.length === 0 && (
                    <div className="col-span-full">
                        <Card className="p-16 text-center border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors bg-gradient-to-br from-gray-50 to-blue-50">
                            <div className="space-y-6">
                                <div className="p-6 bg-gradient-to-br from-blue-100 to-green-100 rounded-full w-24 h-24 mx-auto flex items-center justify-center shadow-lg">
                                    <GraduationCap className="w-10 h-10 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No programs found</h3>
                                    <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                                        {Object.keys(filters).length > 0
                                            ? "No programs match your current filters. Try adjusting your search criteria."
                                            : "Create your first program to get started with managing academic programs and student enrollments."
                                        }
                                    </p>
                                    {Object.keys(filters).length > 0 ? (
                                        <Button
                                            onClick={() => {
                                                setSelectedEducationLevel('');
                                                setSelectedStatus('');
                                                setSearchQuery('');
                                                router.get(route('registrar.programs.index'), {}, {
                                                    preserveState: true,
                                                    preserveScroll: true,
                                                });
                                            }}
                                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg px-8 py-3 text-base mr-4"
                                        >
                                            Clear Filters
                                        </Button>
                                    ) : (
                                        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg px-8 py-3 text-base">
                                            <Link href={route('registrar.programs.create')}>
                                                <Plus className="w-5 h-5 mr-2" />
                                                Create First Program
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
                </div>

                {/* Pagination */}
                {programs.links && programs.links.length > 3 && (
                    <Card className="p-3 mt-6">
                        <div className="flex justify-center">
                            <nav className="flex items-center space-x-1">
                                {programs.links.map((link, index) => {
                                    if (link.url) {
                                        return (
                                            <Button
                                                key={index}
                                                asChild
                                                variant={link.active ? "default" : "outline"}
                                                size="sm"
                                                className={`h-7 px-2 text-xs ${
                                                    link.active
                                                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                                                        : "border-gray-300 hover:border-blue-300 text-gray-700"
                                                }`}
                                            >
                                                <Link href={link.url}>
                                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                                </Link>
                                            </Button>
                                        );
                                    } else {
                                        return (
                                            <Button
                                                key={index}
                                                variant="outline"
                                                size="sm"
                                                disabled
                                                className="border-gray-200 text-gray-400 h-7 px-2 text-xs"
                                            >
                                                <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                            </Button>
                                        );
                                    }
                                })}
                            </nav>
                        </div>
                    </Card>
                )}

            {/* Edit Program Modal */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Program</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="program_name">Program Name</Label>
                                <Input
                                    id="program_name"
                                    value={data.program_name}
                                    onChange={(e) => setData('program_name', e.target.value)}
                                    required
                                />
                                {errors.program_name && (
                                    <p className="text-sm text-red-600 mt-1">{errors.program_name}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="program_code">Program Code</Label>
                                <Input
                                    id="program_code"
                                    value={data.program_code}
                                    onChange={(e) => setData('program_code', e.target.value)}
                                    required
                                />
                                {errors.program_code && (
                                    <p className="text-sm text-red-600 mt-1">{errors.program_code}</p>
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
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                Set different fees for each year level. These fees will be automatically applied to regular students during enrollment.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Array.from({ length: data.education_level === 'masteral' ? 2 : 4 }, (_, i) => i + 1).map((year) => {
                                    const fee = data.program_fees.find(
                                        f => f.year_level === year && f.fee_type === 'regular'
                                    );
                                    const amount = fee ? fee.semester_fee : 0;

                                    return (
                                        <div key={year} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                                            <Label className="text-sm font-medium w-24 flex-shrink-0">
                                                {year}{year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} Year:
                                            </Label>
                                            <div className="relative flex-1 max-w-32">
                                                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">
                                                    ₱
                                                </span>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={amount || ''}
                                                    onChange={(e) => updateFee(year, e.target.value)}
                                                    className="pl-6 h-8 text-sm"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <span className="text-xs text-gray-500">per semester</span>
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
                                            {availableSubjects[year]?.['first']?.length > 0 ? (
                                                availableSubjects[year]['first'].map(subject => {
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
                                            {availableSubjects[year]?.['second']?.length > 0 ? (
                                                availableSubjects[year]['second'].map(subject => {
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