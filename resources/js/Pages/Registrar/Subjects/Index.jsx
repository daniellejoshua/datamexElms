import { Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Eye, Edit, Trash2, Search, Filter, BookOpen, GraduationCap, Building2, ChevronRight, Star, Users, Calendar } from 'lucide-react'
import { useState } from 'react'

export default function SubjectsIndex({ subjects, auth, filters = {} }) {
    const [selectedEducationLevel, setSelectedEducationLevel] = useState(filters.education_level || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState(null);

    const educationLevels = [
        { value: 'college', label: 'College' },
        { value: 'shs', label: 'Senior High School' },
    ];

    const statusOptions = [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
    ];

    const handleFilterChange = (type, value) => {
        const newFilters = {};
        Object.keys(filters).forEach(key => {
            if (filters[key] && filters[key] !== '') {
                newFilters[key] = filters[key];
            }
        });

        if (value !== 'all' && value !== '') {
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
        router.get(route('registrar.subjects.index'), newFilters, {
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
            case 'elective': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getSemesterColor = (semester) => {
        return semester === 'first' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between px-2 py-1">
                    <div className="flex items-center gap-2">
                        <div className="bg-green-100 p-1.5 rounded-md">
                            <BookOpen className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Subjects</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Manage academic subjects and curriculum</p>
                        </div>
                    </div>
                    <Button asChild size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-7 px-2">
                        <Link href={route('registrar.subjects.create')}>
                            <Plus className="w-3 h-3 mr-1" />
                            Create Subject
                        </Link>
                    </Button>
                </div>
            }
        >
            <Head title="Subjects" />

            <div className="space-y-6">
                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-base">
                            <Filter className="w-4 h-4 mr-2" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Education Level
                                </label>
                                <Select
                                    value={selectedEducationLevel}
                                    onValueChange={(value) => handleFilterChange('education_level', value)}
                                >
                                    <SelectTrigger>
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <Select
                                    value={selectedStatus}
                                    onValueChange={(value) => handleFilterChange('status', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        {statusOptions.map(status => (
                                            <SelectItem key={status.value} value={status.value}>
                                                {status.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Search
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        type="text"
                                        placeholder="Search by subject code or name..."
                                        value={searchQuery}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Subjects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {subjects.data.map((subject) => (
                        <Card key={subject.id} className="hover:shadow-lg transition-shadow">
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
                            <CardContent className="pt-0">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Level:</span>
                                        <Badge variant="outline" className="text-xs">
                                            {subject.education_level === 'college' ? 'College' : 'SHS'} - Year {subject.year_level}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Semester:</span>
                                        <Badge className={`text-xs ${getSemesterColor(subject.semester)}`}>
                                            {subject.semester === 'first' ? '1st' : '2nd'} Semester
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Type:</span>
                                        <Badge className={`text-xs ${getSubjectTypeColor(subject.subject_type)}`}>
                                            {subject.subject_type}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Units:</span>
                                        <span className="font-medium">{subject.units}</span>
                                    </div>

                                    <div className="flex gap-2 pt-2">
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
                                </div>
                            </CardContent>
                        </Card>
                    ))}
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
                                <Link href={route('registrar.subjects.create')}>
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
                    </DialogHeader>

                    {selectedSubject && (
                        <div className="space-y-6">
                            {/* Subject Overview */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Subject Details</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Subject Code</label>
                                            <p className="font-mono text-lg">{selectedSubject.subject_code}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Subject Name</label>
                                            <p className="text-lg">{selectedSubject.subject_name}</p>
                                        </div>
                                        {selectedSubject.description && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600">Description</label>
                                                <p className="text-gray-700">{selectedSubject.description}</p>
                                            </div>
                                        )}
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Credit Units</label>
                                            <p className="text-2xl font-bold text-blue-600">{selectedSubject.units}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Academic Information</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Education Level</label>
                                            <p>{selectedSubject.education_level === 'college' ? 'College' : 'Senior High School'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Year Level</label>
                                            <p>Year {selectedSubject.year_level}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Semester</label>
                                            <Badge className={selectedSubject.semester === 'first' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                                                {selectedSubject.semester === 'first' ? '1st Semester' : '2nd Semester'}
                                            </Badge>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Subject Type</label>
                                            <Badge className={getSubjectTypeColor(selectedSubject.subject_type)}>
                                                {selectedSubject.subject_type.charAt(0).toUpperCase() + selectedSubject.subject_type.slice(1)}
                                            </Badge>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Status</label>
                                            <Badge className={selectedSubject.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                                {selectedSubject.status === 'active' ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Prerequisites */}
                            {selectedSubject.prerequisites && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Prerequisites</h3>
                                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedSubject.prerequisites}</p>
                                </div>
                            )}

                            {/* Programs */}
                            {selectedSubject.programs && selectedSubject.programs.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Assigned to Programs ({selectedSubject.programs.length})
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {selectedSubject.programs.map((program) => (
                                            <div key={program.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                                                <div>
                                                    <p className="font-medium">{program.program_name}</p>
                                                    <p className="text-sm text-gray-600">{program.program_code}</p>
                                                </div>
                                                <Badge variant="outline">
                                                    {program.education_level === 'college' ? 'College' : 'SHS'}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t">
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
                    </DialogHeader>

                    {selectedSubject && (
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            const data = Object.fromEntries(formData.entries());

                            router.put(route('registrar.subjects.update', selectedSubject.id), data, {
                                onSuccess: () => {
                                    setEditModalOpen(false);
                                    router.reload();
                                }
                            });
                        }}>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code *</label>
                                        <Input
                                            name="subject_code"
                                            defaultValue={selectedSubject.subject_code}
                                            placeholder="e.g., CS101"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Units *</label>
                                        <Input
                                            name="units"
                                            type="number"
                                            min="0"
                                            max="10"
                                            step="0.5"
                                            defaultValue={selectedSubject.units}
                                            placeholder="e.g., 3"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name *</label>
                                    <Input
                                        name="subject_name"
                                        defaultValue={selectedSubject.subject_name}
                                        placeholder="e.g., Introduction to Computer Science"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        name="description"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                        rows={3}
                                        defaultValue={selectedSubject.description || ''}
                                        placeholder="Brief description of the subject..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Education Level *</label>
                                        <Select name="education_level" defaultValue={selectedSubject.education_level}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="college">College</SelectItem>
                                                <SelectItem value="shs">Senior High School</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Year Level *</label>
                                        <Select name="year_level" defaultValue={selectedSubject.year_level.toString()}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">Year 1</SelectItem>
                                                <SelectItem value="2">Year 2</SelectItem>
                                                <SelectItem value="3">Year 3</SelectItem>
                                                <SelectItem value="4">Year 4</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
                                        <Select name="semester" defaultValue={selectedSubject.semester}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="first">1st Semester</SelectItem>
                                                <SelectItem value="second">2nd Semester</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject Type *</label>
                                        <Select name="subject_type" defaultValue={selectedSubject.subject_type}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="major">Major</SelectItem>
                                                <SelectItem value="minor">Minor</SelectItem>
                                                <SelectItem value="general">General Education</SelectItem>
                                                <SelectItem value="elective">Elective</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prerequisites</label>
                                    <Input
                                        name="prerequisites"
                                        defaultValue={selectedSubject.prerequisites || ''}
                                        placeholder="e.g., CS101, MATH101"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                                    <Select name="status" defaultValue={selectedSubject.status}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="bg-green-600 hover:bg-green-700">
                                        <Edit className="w-4 h-4 mr-2" />
                                        Update Subject
                                    </Button>
                                </div>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    )
}