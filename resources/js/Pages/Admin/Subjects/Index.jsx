import { Head, Link, router, useForm, usePage } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Eye, Edit, Search, Filter, BookOpen, Users, Calendar, GraduationCap, Building2, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Toaster, toast } from 'sonner'

export default function SubjectsIndex({ subjects, programs, auth, filters = {}, stats }) {
    const page = usePage();

    const [selectedProgram, setSelectedProgram] = useState(filters.program_id || '');
    const [selectedEducationLevel, setSelectedEducationLevel] = useState(filters.education_level || '');
    const [selectedSubjectType, setSelectedSubjectType] = useState(filters.subject_type || '');
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

  

    const statusOptions = [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
    ];

    const subjectClassifications = [
        { value: 'minor', label: 'Minor Subject', description: 'General subjects not tied to a specific program' },
        { value: 'major', label: 'Major Subject', description: 'Specialized subjects for a specific program' },
    ];

    const educationLevels = [
        { value: 'college', label: 'College' },
        { value: 'senior_high', label: 'Senior High School' },
    ];
 
    const subjectTypes = [
        { value: 'major', label: 'Major' },
        { value: 'minor', label: 'Minor' },
        { value: 'core', label: 'Core' },
        { value: 'applied', label: 'Applied' },
        { value: 'specialized', label: 'Specialized' },
    ];

    const EditSubjectForm = ({ subject, programs, onClose }) => {
    const { data, setData, put, processing, errors } = useForm({
        subject_type: subject.subject_type || 'minor',
        program_id: subject.program_id ? String(subject.program_id) : '',
        subject_code: subject.subject_code || '',
        subject_name: subject.subject_name || '',
        description: subject.description || '',
        education_level: subject.education_level || '',
        units: subject.units || '',
        status: subject.status || 'active',
    });        // Auto-set education level when program is selected
        useEffect(() => {
            if (data.program_id) {
                const selectedProgram = programs?.find(p => p.id.toString() === data.program_id);
                if (selectedProgram && selectedProgram.education_level) {
                    setData('education_level', selectedProgram.education_level);
                }
            }
        }, [data.program_id, programs]);

        const subjectClassifications = data.education_level === 'senior_high' ? [
            { value: 'core', label: 'Core Subject', description: 'General education subjects required for all SHS students' },
            { value: 'applied', label: 'Applied Subject', description: 'Practical subjects with real-world applications' },
            { value: 'specialized', label: 'Specialized Subject', description: 'Track-specific subjects for specialization' },
        ] : [
            { value: 'minor', label: 'Minor Subject', description: 'General subjects not tied to a specific program' },
            { value: 'major', label: 'Major Subject', description: 'Specialized subjects for a specific program' },
        ];

        const handleSubmit = (e) => {
            e.preventDefault();
            put(route('admin.subjects.update', subject.id), {
                onSuccess: () => {
                    onClose();
                    router.reload();
                }
            });
        };

        return (
            <form onSubmit={handleSubmit} className="mt-4">
                <div className="space-y-6">
                    {/* Subject Classification */}
                    <div>
                        <Label className="text-base font-medium">Subject Classification *</Label>
                        <p className="text-sm text-gray-600 mb-3">Choose the appropriate subject classification</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {subjectClassifications.map((classification) => (
                                <div
                                    key={classification.value}
                                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                        data.subject_type === classification.value
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => {
                                        setData('subject_type', classification.value);
                                        // Reset program_id when switching to minor/core/applied
                                        if (classification.value === 'minor' || classification.value === 'core' || classification.value === 'applied') {
                                            setData('program_id', '');
                                        }
                                    }}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-4 h-4 rounded-full border-2 ${
                                            data.subject_type === classification.value
                                                ? 'border-blue-500 bg-blue-500'
                                                : 'border-gray-300'
                                        }`}>
                                            {data.subject_type === classification.value && (
                                                <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{classification.label}</div>
                                            <div className="text-sm text-gray-600">{classification.description}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {errors.subject_type && (
                            <p className="text-sm text-red-600 mt-2">{errors.subject_type}</p>
                        )}
                    </div>

                    {/* Program Selection - Only show for major/specialized subjects */}
                    {(data.subject_type === 'major' || data.subject_type === 'specialized') && (
                        <div>
                            <Label htmlFor="program_id">Program *</Label>
                            <Select 
                                value={data.program_id} 
                                onValueChange={(value) => {
                                    setData('program_id', value);
                                }}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select a program" />
                                </SelectTrigger>
                                <SelectContent>
                                    {programs?.map((program) => (
                                        <SelectItem key={program.id} value={program.id.toString()}>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="font-mono text-xs">
                                                    {program.program_code}
                                                </Badge>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{program.program_name}</span>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <span>{program.education_level === 'college' ? 'College' : 'Senior High'}</span>
                                                        {program.track && (
                                                            <>
                                                                <span>•</span>
                                                                <span>{program.track}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.program_id && (
                                <p className="text-sm text-red-600 mt-1">{errors.program_id}</p>
                            )}
                        </div>
                    )}

                    {/* Row 1: Subject Code, Subject Name, and Units */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="subject_code">Subject Code *</Label>
                            <Input
                                id="subject_code"
                                type="text"
                                value={data.subject_code}
                                onChange={(e) => setData('subject_code', e.target.value.toUpperCase())}
                                placeholder="e.g., CS101"
                                className="mt-1"
                            />
                            {errors.subject_code && (
                                <p className="text-sm text-red-600 mt-1">{errors.subject_code}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="subject_name">Subject Name *</Label>
                            <Input
                                id="subject_name"
                                type="text"
                                value={data.subject_name}
                                onChange={(e) => setData('subject_name', e.target.value)}
                                placeholder="e.g., Introduction to Computer Science"
                                className="mt-1"
                            />
                            {errors.subject_name && (
                                <p className="text-sm text-red-600 mt-1">{errors.subject_name}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="units">Units *</Label>
                            <Input
                                id="units"
                                type="number"
                                min="1"
                                max="9"
                                maxLength="1"
                                value={data.units}
                                onChange={(e) => setData('units', e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'e' || e.key === '+' || e.key === '-') {
                                        e.preventDefault();
                                    }
                                }}
                                placeholder="e.g., 3"
                                className="mt-1"
                            />
                            {errors.units && (
                                <p className="text-sm text-red-600 mt-1">{errors.units}</p>
                            )}
                        </div>
                    </div>

                    {/* Row 2: Education Level */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="education_level">Education Level *</Label>
                            <Select
                                value={data.education_level}
                                disabled={!!data.program_id}
                                onValueChange={(value) => {
                                    setData('education_level', value);
                                }}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select education level" />
                                </SelectTrigger>
                                <SelectContent>
                                    {educationLevels.map(level => (
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
                    </div>

                    {/* Description - Full Width */}
                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Brief description of the subject..."
                            rows={2}
                            className="mt-1"
                        />
                        {errors.description && (
                            <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                        )}
                    </div>

                    {/* Major Confirmation */}
                    {data.subject_type === 'major' && data.program_id && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-sm font-medium text-blue-900">Major Subject:</span>
                                <span className="text-sm text-blue-700">
                                    {programs?.find(p => p.id.toString() === data.program_id)?.program_name}
                                </span>
                            </div>
                            <p className="text-xs text-blue-600 mt-1">
                                This subject will be considered a major subject for the selected program.
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-4 mt-6 mb-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={processing}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <Edit className="w-4 h-4 mr-2" />
                        {processing ? 'Updating...' : 'Update Subject'}
                    </Button>
                </div>
            </form>
        );
    };

    const handleFilterChange = (type, value) => {
        const newFilters = {};
        Object.keys(filters).forEach(key => {
            if (key !== type && filters[key] && filters[key] !== '') {
                newFilters[key] = filters[key];
            }
        });

        if (value !== 'all' && value !== '') {
            newFilters[type] = value;
        }

        // Update local state
        if (type === 'program_id') {
            setSelectedProgram(value === 'all' ? '' : value);
        } else if (type === 'education_level') {
            setSelectedEducationLevel(value === 'all' ? '' : value);
        } else if (type === 'subject_type') {
            setSelectedSubjectType(value === 'all' ? '' : value);
        } else if (type === 'search') {
            setSearchQuery(value);
        }

        // Navigate with filters
        router.get(route('admin.subjects.index'), newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const openViewModal = (subject) => {
        setSelectedSubject(subject);
        setViewModalOpen(true);
    };

    const openEditModal = (subject) => {
        setSelectedSubject(subject);
        setEditModalOpen(true);
    };

    const getSubjectTypeColor = (type) => {
        switch (type) {
            case 'major': return 'bg-blue-100 text-blue-800';
            case 'minor': return 'bg-green-100 text-green-800';
            case 'general': return 'bg-purple-100 text-purple-800';
            case 'core': return 'bg-indigo-100 text-indigo-800';
            case 'applied': return 'bg-teal-100 text-teal-800';
            case 'specialized': return 'bg-pink-100 text-pink-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getSubjectTypeLabel = (type) => {
        switch (type) {
            case 'major': return 'Major';
            case 'minor': return 'Minor';
            case 'general': return 'General';
            case 'core': return 'Core';
            case 'applied': return 'Applied';
            case 'specialized': return 'Specialized';
            default: return type;
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center px-2 py-1">
                    <div className="flex items-center gap-2">
                        <div className="bg-green-100 p-1.5 rounded-md">
                            <BookOpen className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Subjects</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Manage academic subjects and curriculum</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Subjects" />

            <div className="space-y-6 m-2">
                {/* Overview Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center">
                                    <BookOpen className="w-8 h-8 text-blue-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Subjects</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center">
                                    <Users className="w-8 h-8 text-green-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Active Subjects</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center">
                                    <GraduationCap className="w-8 h-8 text-purple-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">College Subjects</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.college}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center">
                                    <Building2 className="w-8 h-8 text-orange-600" />
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">SHS Subjects</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.senior_high}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Filters */}
                <Card className="m-222">
                    <CardContent className="pt-3 pb-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3 ml-1">
                                <Filter className="w-4 h-4" />
                                <span className="text-sm font-medium">Filter Subjects</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="lg:hidden"
                                onClick={() => setShowMobileFilters(!showMobileFilters)}
                            >
                                {showMobileFilters ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                            </Button>
                        </div>
                        <div className="hidden lg:flex items-end gap-3">
                            {/* Filters Container */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
                                {/* Search Filter */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">Search</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                                        <Input
                                            type="text"
                                            placeholder="Search by subject code or name..."
                                            value={searchQuery}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            className="pl-9 text-sm h-8"
                                        />
                                    </div>
                                </div>

                                {/* Program Filter */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">Program Specialized Subjects</label>
                                    <Select
                                        value={selectedProgram}
                                        onValueChange={(value) => handleFilterChange('program_id', value)}
                                    >
                                        <SelectTrigger className="h-8 text-sm">
                                            <SelectValue placeholder="All Programs" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Programs</SelectItem>
                                            {programs.map(program => (
                                                <SelectItem key={program.id} value={program.id.toString()}>
                                                    <Badge variant="secondary" className="font-mono text-xs">
                                                        {program.program_code}
                                                    </Badge>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Education Level Filter */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">Education Level</label>
                                    <Select
                                        value={selectedEducationLevel}
                                        onValueChange={(value) => handleFilterChange('education_level', value)}
                                    >
                                        <SelectTrigger className="h-8 text-sm">
                                            <SelectValue placeholder="All Levels" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Levels</SelectItem>
                                            {educationLevels.map(level => (
                                                <SelectItem key={level.value} value={level.value}>
                                                    {level.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Subject Type Filter */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">Subject Type</label>
                                    <Select
                                        value={selectedSubjectType}
                                        onValueChange={(value) => handleFilterChange('subject_type', value)}
                                    >
                                        <SelectTrigger className="h-8 text-sm">
                                            <SelectValue placeholder="All Types" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            {subjectTypes.map(type => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-end">
                                <Button asChild size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8">
                                    <Link href={route('admin.subjects.create')}>
                                        <Plus className="w-3 h-3 mr-1" />
                                        Create Subject
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {/* Mobile Filters */}
                        {showMobileFilters && (
                            <div className="lg:hidden space-y-3 pt-3 border-t">
                                <div className="grid grid-cols-1 gap-3">
                                    {/* Search Filter */}
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-600">Search</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                                            <Input
                                                type="text"
                                                placeholder="Search by subject code or name..."
                                                value={searchQuery}
                                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                                className="pl-9 text-sm h-8"
                                            />
                                        </div>
                                    </div>

                                    {/* Program Filter */}
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-600">Program Major Subjects</label>
                                        <Select
                                            value={selectedProgram}
                                            onValueChange={(value) => handleFilterChange('program_id', value)}
                                        >
                                            <SelectTrigger className="h-8 text-sm">
                                                <SelectValue placeholder="All Programs" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Programs</SelectItem>
                                                {programs.map(program => (
                                                    <SelectItem key={program.id} value={program.id.toString()}>
                                                        <Badge variant="secondary" className="font-mono text-xs">
                                                            {program.program_code}
                                                        </Badge>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Education Level Filter */}
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-600">Education Level</label>
                                        <Select
                                            value={selectedEducationLevel}
                                            onValueChange={(value) => handleFilterChange('education_level', value)}
                                        >
                                            <SelectTrigger className="h-8 text-sm">
                                                <SelectValue placeholder="All Levels" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Levels</SelectItem>
                                                {educationLevels.map(level => (
                                                    <SelectItem key={level.value} value={level.value}>
                                                        {level.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Subject Type Filter */}
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-600">Subject Type</label>
                                        <Select
                                            value={selectedSubjectType}
                                            onValueChange={(value) => handleFilterChange('subject_type', value)}
                                        >
                                            <SelectTrigger className="h-8 text-sm">
                                                <SelectValue placeholder="All Types" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Types</SelectItem>
                                                {subjectTypes.map(type => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Create Button in Mobile */}
                                    <div className="pt-2">
                                        <Button asChild size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8 w-full">
                                            <Link href={route('admin.subjects.create')}>
                                                <Plus className="w-3 h-3 mr-1" />
                                                Create Subject
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Subjects Grid */}
                <div className="px-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {subjects.data.map((subject) => (
                            <Card key={subject.id} className="hover:shadow-lg transition-shadow h-full flex flex-col">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-base font-semibold text-gray-900">
                                                {subject.subject_code}
                                            </CardTitle>
                                            <CardDescription className="text-sm mt-1">
                                                {subject.subject_name}
                                            </CardDescription>
                                        </div>
                                        <Badge
                                            variant={subject.status === 'active' ? 'default' : 'secondary'}
                                            className="text-xs"
                                        >
                                            {subject.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                            <CardContent className="pt-0 flex-1 flex flex-col">
                                <div className="space-y-3 flex-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Level:</span>
                                        <Badge variant="outline" className="text-xs">
                                            {subject.education_level === 'college' ? 'College' : 'Senior High'}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Type:</span>
                                        <Badge className={`text-xs ${getSubjectTypeColor(subject.subject_type)}`}>
                                            {getSubjectTypeLabel(subject.subject_type)}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Units:</span>
                                        <span className="font-medium">{subject.units}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2 mt-auto">
                                    <Button asChild variant="outline" size="sm" className="flex-1">
                                        <button onClick={() => openViewModal(subject)}>
                                            <Eye className="w-3 h-3 mr-1" />
                                            View
                                        </button>
                                    </Button>
                                    <Button asChild variant="outline" size="sm" className="flex-1">
                                        <button onClick={() => openEditModal(subject)}>
                                            <Edit className="w-3 h-3 mr-1" />
                                            Edit
                                        </button>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    </div>
                </div>

                {/* Pagination */}
                {subjects.last_page > 1 && (
                    <div className="flex justify-center">
                        <div className="flex space-x-1">
                            {subjects.links.map((link, index) => (
                                <Button
                                    key={index}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    asChild={!!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                >
                                    {link.url ? (
                                        <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />
                                    ) : (
                                        <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                    )}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {subjects.data.length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <BookOpen className="w-12 h-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No subjects found</h3>
                            <p className="text-gray-500 text-center mb-4">
                                {Object.keys(filters).length > 0
                                    ? 'Try adjusting your filters or search terms.'
                                    : 'Get started by creating your first subject.'
                                }
                            </p>
                            <Button asChild>
                                <Link href={route('admin.subjects.create')}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Subject
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* View Subject Modal */}
            <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            {selectedSubject?.subject_name}
                        </DialogTitle>
                        <DialogDescription>
                            Detailed information about this subject
                        </DialogDescription>
                    </DialogHeader>

                    {selectedSubject && (
                        <div className="space-y-6">
                            {/* Subject Overview */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <BookOpen className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <h3 className="text-lg font-semibold">Subject Details</h3>
                                    </div>
                                    <div className="space-y-3 pl-10">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-medium text-gray-600 min-w-[100px]">Code:</span>
                                            <Badge variant="outline" className="font-mono text-sm">
                                                {selectedSubject.subject_code}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-medium text-gray-600 min-w-[100px]">Name:</span>
                                            <span className="text-sm">{selectedSubject.subject_name}</span>
                                        </div>
                                        {selectedSubject.description && (
                                            <div className="flex gap-3">
                                                <span className="text-sm font-medium text-gray-600 min-w-[100px]">Description:</span>
                                                <span className="text-sm text-gray-700">{selectedSubject.description}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-medium text-gray-600 min-w-[100px]">Units:</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl font-bold text-blue-600">{selectedSubject.units}</span>
                                                <span className="text-sm text-gray-500">credit units</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                            <GraduationCap className="w-4 h-4 text-green-600" />
                                        </div>
                                        <h3 className="text-lg font-semibold">Academic Information</h3>
                                    </div>
                                    <div className="space-y-3 pl-10">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-medium text-gray-600 min-w-[120px]">Level:</span>
                                            <Badge variant="secondary" className="text-xs">
                                                {selectedSubject.education_level === 'college' ? 'College' : 'Senior High School'}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-medium text-gray-600 min-w-[120px]">Type:</span>
                                            <Badge className={`text-xs ${getSubjectTypeColor(selectedSubject.subject_type)}`}>
                                                {getSubjectTypeLabel(selectedSubject.subject_type)}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-medium text-gray-600 min-w-[120px]">Status:</span>
                                            <Badge className={selectedSubject.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                                {selectedSubject.status === 'active' ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Prerequisites */}
                            {selectedSubject.prerequisites && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                            <Calendar className="w-4 h-4 text-yellow-600" />
                                        </div>
                                        <h3 className="text-lg font-semibold">Prerequisites</h3>
                                    </div>
                                    <div className="pl-10">
                                        <p className="text-gray-700 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                            {selectedSubject.prerequisites}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Programs */}
                            {selectedSubject.programs && selectedSubject.programs.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <Users className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                            Assigned Programs
                                            <Badge variant="outline" className="text-xs">
                                                {selectedSubject.programs.length}
                                            </Badge>
                                        </h3>
                                    </div>
                                    <div className="pl-10">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {selectedSubject.programs.map((program) => (
                                                <div key={program.id} className="flex items-center justify-between p-4 border rounded-lg bg-purple-50 border-purple-200">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center">
                                                            <Building2 className="w-5 h-5 text-purple-700" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-purple-900">{program.program_name}</p>
                                                            <p className="text-sm text-purple-600">{program.program_code}</p>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="text-xs">
                                                        {program.education_level === 'college' ? 'College' : 'SHS'}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-6 border-t">
                                <Button variant="outline" onClick={() => setViewModalOpen(false)}>
                                    Close
                                </Button>
                                <Button onClick={() => { setViewModalOpen(false); openEditModal(selectedSubject); }} className="bg-green-600 hover:bg-green-700">
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Subject
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Subject Modal */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="w-5 h-5" />
                            Edit Subject: {selectedSubject?.subject_name}
                        </DialogTitle>
                        <DialogDescription>
                            Update the subject details below.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedSubject && (
                        <EditSubjectForm 
                            subject={selectedSubject} 
                            programs={programs} 
                            onClose={() => setEditModalOpen(false)} 
                        />
                    )}
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    )
}