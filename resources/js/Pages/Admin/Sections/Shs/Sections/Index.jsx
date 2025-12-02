import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    GraduationCap, 
    Users, 
    BookOpen, 
    Calendar, 
    Plus, 
    Building2,
    ChevronRight,
    Star,
    Filter,
    School
} from 'lucide-react';

const Index = ({ 
    sections, 
    filters = {}, 
    currentAcademicPeriod = {}, 
    academicYearOptions = [], 
    semesterOptions = [],
    tracks = []
}) => {
    const [selectedAcademicYear, setSelectedAcademicYear] = useState(filters.academic_year || '');
    const [selectedSemester, setSelectedSemester] = useState(filters.semester || '');
    const [selectedTrack, setSelectedTrack] = useState(filters.track || '');

    const handleFilterChange = (type, value) => {
        const newFilters = { ...filters };
        
        if (value === 'all') {
            delete newFilters[type];
        } else {
            newFilters[type] = value;
        }

        // Update state
        if (type === 'academic_year') {
            setSelectedAcademicYear(value === 'all' ? '' : value);
        } else if (type === 'semester') {
            setSelectedSemester(value === 'all' ? '' : value);
        } else if (type === 'track') {
            setSelectedTrack(value === 'all' ? '' : value);
        }

        // Navigate with filters
        router.get(route('admin.shs.sections.index'), newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const isCurrentPeriod = (academicYear, semester) => {
        return academicYear === currentAcademicPeriod.academic_year && 
               semester === currentAcademicPeriod.semester;
    };

    const getSemesterDisplayName = (semester) => {
        const semesterMap = {
            '1st': 'First Semester',
            '2nd': 'Second Semester', 
            'summer': 'Summer'
        };
        return semesterMap[semester] || semester;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-2 rounded-lg">
                            <School className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Senior High School Sections</h2>
                            <p className="text-sm text-gray-600 mt-1">Manage SHS sections and enrollment</p>
                        </div>
                    </div>
                    <Button asChild>
                        <Link href={route('admin.shs.sections.create')} className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Create SHS Section
                        </Link>
                    </Button>
                </div>
            }
        >
            <Head title="SHS Sections" />
            
            <div className="p-4 sm:p-6 lg:p-8">
                {/* Current Academic Period Banner */}
                <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-purple-600" />
                        <div>
                            <h3 className="font-semibold text-purple-900">Current Academic Period</h3>
                            <p className="text-sm text-purple-700">
                                {currentAcademicPeriod.academic_year} • {getSemesterDisplayName(currentAcademicPeriod.semester)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Filter className="w-5 h-5" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Academic Year Filter */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Academic Year</label>
                                <Select 
                                    value={selectedAcademicYear || 'all'} 
                                    onValueChange={(value) => handleFilterChange('academic_year', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select academic year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Show All</SelectItem>
                                        {academicYearOptions.map((year) => (
                                            <SelectItem key={year} value={year}>
                                                {year} {year === currentAcademicPeriod.academic_year && '(Current)'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Semester Filter */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Semester</label>
                                <Select 
                                    value={selectedSemester || 'all'} 
                                    onValueChange={(value) => handleFilterChange('semester', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select semester" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Show All</SelectItem>
                                        {semesterOptions.map((semester) => (
                                            <SelectItem key={semester.value} value={semester.value}>
                                                {semester.label} {semester.value === currentAcademicPeriod.semester && '(Current)'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Track Filter */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Track</label>
                                <Select 
                                    value={selectedTrack || 'all'} 
                                    onValueChange={(value) => handleFilterChange('track', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select track" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Show All</SelectItem>
                                        {tracks.map((track) => (
                                            <SelectItem key={track} value={track}>
                                                {track}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sections Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sections.data.length > 0 ? (
                        sections.data.map((section) => (
                            <Card key={section.id} className="hover:shadow-md transition-shadow duration-200">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <GraduationCap className="w-5 h-5 text-purple-600" />
                                                {section.section_name}
                                                {isCurrentPeriod(section.academic_year, section.semester) && (
                                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                                )}
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                {section.program?.program_name} - {section.program?.track}
                                            </CardDescription>
                                        </div>
                                        <Badge 
                                            variant={section.status === 'active' ? 'default' : 'secondary'}
                                            className={section.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                                        >
                                            {section.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {/* Academic Period Info */}
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="outline" className="text-xs">
                                                {section.academic_year}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                {getSemesterDisplayName(section.semester)}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                Grade {section.year_level}
                                            </Badge>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Users className="w-4 h-4" />
                                                <span>{section.enrolled_count || 0} students</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <BookOpen className="w-4 h-4" />
                                                <span>{section.section_subjects?.length || 0} subjects</span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 pt-2">
                                            <Button asChild variant="outline" size="sm" className="flex-1">
                                                <Link href={route('admin.shs.sections.show', section.id)} className="flex items-center justify-center gap-1">
                                                    View
                                                    <ChevronRight className="w-3 h-3" />
                                                </Link>
                                            </Button>
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={route('admin.shs.sections.subjects', section.id)} className="flex items-center gap-1">
                                                    <BookOpen className="w-3 h-3" />
                                                    Subjects
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full">
                            <Card className="p-12 text-center">
                                <div className="flex flex-col items-center gap-4">
                                    <Building2 className="w-12 h-12 text-gray-400" />
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No SHS Sections Found</h3>
                                        <p className="text-gray-600 mb-4">
                                            {Object.keys(filters).some(key => filters[key]) 
                                                ? 'No sections match your current filters.' 
                                                : 'Get started by creating your first SHS section.'}
                                        </p>
                                        <Button asChild>
                                            <Link href={route('admin.shs.sections.create')}>
                                                <Plus className="w-4 h-4 mr-2" />
                                                Create SHS Section
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {sections.links && sections.links.length > 3 && (
                    <div className="mt-8 flex justify-center">
                        <div className="flex items-center gap-2">
                            {sections.links.map((link, index) => (
                                <Button
                                    key={index}
                                    variant={link.active ? "default" : "outline"}
                                    size="sm"
                                    className={link.url ? "" : "opacity-50 cursor-not-allowed"}
                                    onClick={() => link.url && router.visit(link.url)}
                                    disabled={!link.url}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
};

export default Index;