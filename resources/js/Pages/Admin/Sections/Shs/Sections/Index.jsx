import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    School, 
    Users, 
    BookOpen, 
    Calendar, 
    Plus, 
    GraduationCap, 
    Settings, 
    Building2,
    ChevronRight,
    Star,
    Filter,
    RefreshCcw
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
            '2nd': 'Second Semester'
        };
        return semesterMap[semester] || semester;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between px-2 py-1">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-1.5 rounded-md">
                            <School className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">SHS Sections</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Manage SHS program sections</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="SHS Sections" />
            
            <div className="p-2 sm:p-3 lg:p-4">
                {/* Filters */}
                <Card className="mb-4">
                    <CardContent className="pt-3 pb-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <Filter className="w-4 h-4" />
                                <span className="text-sm font-medium">Filter Sections</span>
                            </div>
                            {/* Current Period Badge - Top Right */}
                            <Badge variant="outline" className="bg-white border-purple-200 text-purple-600 px-3 py-2">
                                <Calendar className="w-4 h-4 mr-2" />
                                Academic Year: {currentAcademicPeriod.academic_year} - {currentAcademicPeriod.semester}
                            </Badge>
                        </div>
                        <div className="flex items-end gap-3">
                            {/* Filters Container */}
                            <div className="flex gap-3 flex-1">
                                {/* Academic Year Filter */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">Academic Year</label>
                                    <Select 
                                        value={selectedAcademicYear || 'all'} 
                                        onValueChange={(value) => handleFilterChange('academic_year', value)}
                                    >
                                        <SelectTrigger className="h-8 w-48 text-sm">
                                            <SelectValue placeholder="Academic Year" />
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
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">Semester</label>
                                    <Select 
                                        value={selectedSemester || 'all'} 
                                        onValueChange={(value) => handleFilterChange('semester', value)}
                                    >
                                        <SelectTrigger className="h-8 w-48 text-sm">
                                            <SelectValue placeholder="Semester" />
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
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">Track</label>
                                    <Select 
                                        value={selectedTrack || 'all'} 
                                        onValueChange={(value) => handleFilterChange('track', value)}
                                    >
                                        <SelectTrigger className="h-8 w-48 text-sm">
                                            <SelectValue placeholder="Track" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Show All Tracks</SelectItem>
                                            {tracks.map((track) => (
                                                <SelectItem key={track} value={track}>
                                                    {track}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Create Section Button - Right Side */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-600 opacity-0">Action</label>
                                <div className="h-8 flex items-center">
                                    <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                                        <Link href={route('admin.shs.sections.create')}>
                                            <Plus className="w-3 h-3 mr-1" />
                                            Create Section
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>                {/* Sections Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                    {sections?.data?.length > 0 ? (
                        sections.data.map((section) => {
                            return (
                                <Card key={section.id} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 relative overflow-hidden">
                                    {/* Status Badge */}
                                    <div className="absolute top-4 right-4">
                                        <Badge 
                                            className={`shadow-md font-semibold ${
                                                section.status === 'active' 
                                                    ? 'bg-white text-green-500 border-green-600' 
                                                    : 'bg-white text-red-600 border-red-600'
                                            }`}
                                        >
                                            {section.status}
                                        </Badge>
                                    </div>

                                    <CardHeader className="pb-4">
                                        <div className="flex items-start space-x-3">
                                            <div className="p-3 bg-blue-600 rounded-xl flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                                                <School className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                                                    {section.program?.program_code}-{section.year_level}{section.section_name}
                                                </CardTitle>
                                                <CardDescription className="text-blue-600 font-semibold truncate">
                                                    {section.program?.track || 'N/A'}
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    
                                    <CardContent className="space-y-6">
                                        {/* Section Details */}
                                        <div className="space-y-4">
                                            <Card className="p-3 bg-gradient-to-r from-green-50 to-purple-50 border border-green-200">
                                                <div className="flex items-center text-sm">
                                                    <GraduationCap className="w-4 h-4 text-green-600 mr-3 flex-shrink-0" />
                                                    <span className="text-gray-700 font-medium truncate">
                                                        Grade {section.year_level} - Section {section.section_name}
                                                    </span>
                                                </div>
                                            </Card>
                                            
                                            <div className="grid grid-cols-2 gap-2">
                                                <Card className="p-2 text-center bg-orange-50 border-orange-200">
                                                    <div className="flex flex-col items-center">
                                                        <BookOpen className="w-4 h-4 text-orange-600 mb-1" />
                                                        <span className="text-xs font-semibold text-gray-700">
                                                            {section.section_subjects?.length || 0}
                                                        </span>
                                                        <span className="text-xs text-gray-600">Subjects</span>
                                                    </div>
                                                </Card>
                                                
                                                <Card className="p-2 text-center bg-pink-50 border-pink-200">
                                                    <div className="flex flex-col items-center">
                                                        <Users className="w-4 h-4 text-pink-600 mb-1" />
                                                        <span className="text-xs font-semibold text-gray-700">
                                                            {section.enrolled_count || 0}
                                                        </span>
                                                        <span className="text-xs text-gray-600">Students</span>
                                                    </div>
                                                </Card>
                                            </div>
                                            
                                            <Card className="p-3 bg-purple-50 border-purple-200">
                                                <div className="flex items-center text-sm">
                                                    <Calendar className="w-4 h-4 text-purple-600 mr-3 flex-shrink-0" />
                                                    <span className="text-gray-700 font-medium truncate">
                                                        {section.academic_year} - {getSemesterDisplayName(section.semester)}
                                                    </span>
                                                </div>
                                            </Card>
                                        </div>
                                        
                                        {/* Action Buttons */}
                                        <div className="space-y-3">
                                            <Button asChild className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-md">
                                                <Link href={route('admin.shs.sections.subjects', section.id)}>
                                                    <BookOpen className="w-4 h-4 mr-2" />
                                                    Manage Subjects
                                                    <ChevronRight className="w-4 h-4 ml-auto" />
                                                </Link>
                                            </Button>
                                            
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button asChild variant="outline" className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50 font-medium">
                                                    <Link href={route('admin.sections.students', section.id)}>
                                                        <Users className="w-3 h-3 mr-1" />
                                                        Students
                                                    </Link>
                                                </Button>
                                                <Button asChild variant="outline" className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium">
                                                    <Link href={route('admin.shs.sections.edit', section.id)}>
                                                        <Settings className="w-3 h-3 mr-1" />
                                                        Edit
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    ) : (
                        <div className="col-span-full">
                            <Card className="p-16 text-center border-2 border-dashed border-gray-300">
                                <div className="space-y-6">
                                    <div className="p-6 bg-gray-100 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                                        <Building2 className="w-10 h-10 text-gray-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-3">No SHS sections found</h3>
                                        <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                                            Create your first SHS section to get started with managing senior high school academic programs and student enrollments.
                                        </p>
                                        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base">
                                            <Link href={route('admin.shs.sections.create')}>
                                                <Plus className="w-5 h-5 mr-2" />
                                                Create First SHS Section
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {sections?.links && sections.links.length > 3 && (
                    <Card className="p-3 mt-4">
                        <div className="flex justify-center">
                            <nav className="flex items-center space-x-1">
                                {sections.links.map((link, index) => {
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
            </div>
        </AuthenticatedLayout>
    );
};

export default Index;