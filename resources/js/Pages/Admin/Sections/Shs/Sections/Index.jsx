import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
    RefreshCcw,
    Menu,
    X
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

    const isSectionReadOnly = (section) => {
        const sectionYear = parseInt(section.academic_year);
        const currentYear = parseInt(currentAcademicPeriod.academic_year);
        
        if (sectionYear < currentYear) return true;
        if (sectionYear > currentYear) return false;
        
        // Same year, check semester
        const semesterOrder = { '1st': 1, '2nd': 2, 'summer': 3 };
        const sectionSemesterOrder = semesterOrder[section.semester] || 0;
        const currentSemesterOrder = semesterOrder[currentAcademicPeriod.semester] || 0;
        
        return sectionSemesterOrder < currentSemesterOrder;
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
                <div className="flex items-center gap-2 sm:gap-3 min-h-[44px]">
                    <div className="bg-blue-100 p-1.5 sm:p-2 rounded-md flex-shrink-0">
                        <School className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                            SHS Sections
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-600 mt-0.5 hidden sm:block">
                            Manage Senior High School program sections and student enrollments
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="SHS Sections" />
            
            <div className="p-2 sm:p-3 lg:p-4">
                {/* Filters */}
                <Card className="mb-4">
                    <CardContent className="pt-3 pb-3">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <Filter className="w-4 h-4 text-gray-600" />
                                <span className="text-sm font-medium text-gray-900">Filter Sections</span>
                            </div>
                            
                            {/* Current Period Badge and Mobile Filter Toggle */}
                            <div className="flex items-center gap-2">
                                {/* Current Period Badge - Always visible */}
                                <Badge variant="outline" className="bg-white border-purple-200 text-purple-600 px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm">
                                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                    <span className="hidden lg:inline">Academic Year: </span>
                                    {currentAcademicPeriod.academic_year} - {currentAcademicPeriod.semester}
                                </Badge>
                            </div>
                        </div>
                        
                        {/* Desktop Filters - Always visible on lg+ */}
                        <div className="hidden lg:flex items-end gap-3">
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

                            {/* Create Section Button */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-600 opacity-0">Action</label>
                                <div className="h-8 flex items-center">
                                    <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white px-3">
                                        <Link href={route('admin.shs.sections.create')}>
                                            <Plus className="w-3 h-3 mr-2" />
                                            Create Section
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                        
                        {/* Mobile Filters - Always visible */}
                        <div className="lg:hidden pt-3 border-t border-gray-200 space-y-4">
                                {/* Academic Year Filter */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Academic Year</label>
                                    <Select 
                                        value={selectedAcademicYear || 'all'} 
                                        onValueChange={(value) => handleFilterChange('academic_year', value)}
                                    >
                                        <SelectTrigger className="h-10 w-full text-sm">
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
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Semester</label>
                                    <Select 
                                        value={selectedSemester || 'all'} 
                                        onValueChange={(value) => handleFilterChange('semester', value)}
                                    >
                                        <SelectTrigger className="h-10 w-full text-sm">
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
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Track</label>
                                    <Select 
                                        value={selectedTrack || 'all'} 
                                        onValueChange={(value) => handleFilterChange('track', value)}
                                    >
                                        <SelectTrigger className="h-10 w-full text-sm">
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

                                {/* Create Section Button */}
                                <div className="flex justify-end pt-2">
                                    <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2">
                                        <Link href={route('admin.shs.sections.create')}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create Section
                                        </Link>
                                    </Button>
                                </div>
                        </div>
                    </CardContent>
                </Card>                {/* Sections Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {sections?.data?.length > 0 ? (
                        sections.data.map((section) => {
                            return (
                                <TooltipProvider key={section.id}>
                                    <Tooltip delayDuration={1000}>
                                        <TooltipTrigger asChild>
                                            <Link href={route('admin.sections.show', section.id)} className="block">
                                                <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 relative overflow-hidden cursor-pointer h-full">
                                    {/* Status Badge */}
                                    <div className="absolute top-3 right-3 z-10">
                                        <Badge 
                                            className={`shadow-md font-semibold text-xs px-2 py-1 ${
                                                section.status === 'active' 
                                                    ? 'bg-white text-green-600 border-green-600' 
                                                    : 'bg-white text-red-600 border-red-600'
                                            }`}
                                        >
                                            {section.status}
                                        </Badge>
                                    </div>

                                    <CardHeader className="pb-3">
                                        <div className="flex items-start space-x-3">
                                            <div className="p-2 sm:p-3 bg-blue-600 rounded-xl flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                                                <School className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-base sm:text-lg font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                                                    {section.program?.program_code}-{section.year_level}{section.section_name}
                                                </CardTitle>
                                                <CardDescription className="text-blue-600 font-semibold truncate text-sm">
                                                    {section.program?.track || 'N/A'}
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    
                                    <CardContent className="space-y-4 flex-1 flex flex-col">
                                        {/* Section Details */}
                                        <div className="space-y-3 flex-1">
                                            <Card className="p-2 sm:p-3 bg-gradient-to-r from-green-50 to-purple-50 border border-green-200">
                                                <div className="flex items-center text-sm">
                                                    <GraduationCap className="w-4 h-4 text-green-600 mr-2 sm:mr-3 flex-shrink-0" />
                                                    <span className="text-gray-700 font-medium truncate text-xs sm:text-sm">
                                                        Grade {section.year_level} - Section {section.section_name}
                                                    </span>
                                                </div>
                                            </Card>
                                            
                                            <div className="grid grid-cols-2 gap-2">
                                                <Card className="p-2 text-center bg-orange-50 border-orange-200">
                                                    <div className="flex flex-col items-center">
                                                        <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600 mb-1" />
                                                        <span className="text-xs font-semibold text-gray-700">
                                                            {section.section_subjects?.length || 0}
                                                        </span>
                                                        <span className="text-xs text-gray-600">Subjects</span>
                                                    </div>
                                                </Card>
                                                
                                                <Card className="p-2 text-center bg-pink-50 border-pink-200">
                                                    <div className="flex flex-col items-center">
                                                        <Users className="w-3 h-3 sm:w-4 sm:h-4 text-pink-600 mb-1" />
                                                        <span className="text-xs font-semibold text-gray-700">
                                                            {section.enrolled_count || 0}
                                                        </span>
                                                        <span className="text-xs text-gray-600">Students</span>
                                                    </div>
                                                </Card>
                                            </div>
                                            
                                            <Card className="p-2 sm:p-3 bg-purple-50 border-purple-200">
                                                <div className="flex items-center text-sm">
                                                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 mr-2 sm:mr-3 flex-shrink-0" />
                                                    <span className="text-gray-700 font-medium truncate text-xs sm:text-sm">
                                                        {section.academic_year} - {getSemesterDisplayName(section.semester)}
                                                    </span>
                                                </div>
                                            </Card>
                                        </div>
                                        
                                        {/* Action Buttons */}
                                        <div className="space-y-2 sm:space-y-3">
                                            <Button 
                                                asChild 
                                                className={`w-full shadow-md text-sm ${
                                                    isSectionReadOnly(section) 
                                                        ? 'bg-gray-400 cursor-not-allowed opacity-60' 
                                                        : 'bg-purple-600 hover:bg-purple-700'
                                                } text-white`}
                                                disabled={isSectionReadOnly(section)}
                                            >
                                                <Link href={route('admin.shs.sections.subjects', section.id)}>
                                                    <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                                    <span className="hidden sm:inline">Manage Subjects</span>
                                                    <span className="sm:hidden">Subjects</span>
                                                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-auto" />
                                                </Link>
                                            </Button>
                                            
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button 
                                                    asChild 
                                                    variant="outline" 
                                                    className={`border-2 font-medium text-xs sm:text-sm ${
                                                        isSectionReadOnly(section) 
                                                            ? 'border-gray-300 text-gray-400 cursor-not-allowed opacity-60' 
                                                            : 'border-purple-300 text-purple-700 hover:bg-purple-50'
                                                    }`}
                                                    disabled={isSectionReadOnly(section)}
                                                >
                                                    <Link href={route('admin.sections.students', section.id)}>
                                                        <Users className="w-3 h-3 mr-1" />
                                                        Students
                                                    </Link>
                                                </Button>
                                                <Button 
                                                    asChild 
                                                    variant="outline" 
                                                    className={`border-2 font-medium text-xs sm:text-sm ${
                                                        isSectionReadOnly(section) 
                                                            ? 'border-gray-300 text-gray-400 cursor-not-allowed opacity-60' 
                                                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                                    }`}
                                                    disabled={isSectionReadOnly(section)}
                                                >
                                                    <Link href={route('admin.shs.sections.edit', section.id)}>
                                                        <Settings className="w-3 h-3 mr-1" />
                                                        Edit
                                                    </Link>
                                                </Button>
                                            </div>
                                            
                                            {isSectionReadOnly(section) && (
                                                <div className="text-xs text-gray-500 text-center bg-gray-50 px-3 py-2 rounded-md border">
                                                    <span className="font-medium">Read-only:</span> Past academic year
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                                </Link>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Click to view section details</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            );
                        })
                    ) : (
                        <div className="col-span-full">
                            <Card className="p-8 sm:p-12 lg:p-16 text-center border-2 border-dashed border-gray-300">
                                <div className="space-y-4 sm:space-y-6">
                                    <div className="p-4 sm:p-6 bg-gray-100 rounded-full w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto flex items-center justify-center">
                                        <Building2 className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">No SHS sections found</h3>
                                        <p className="text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed text-sm sm:text-base">
                                            Create your first SHS section to get started with managing senior high school academic programs and student enrollments.
                                        </p>
                                        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base">
                                            <Link href={route('admin.shs.sections.create')}>
                                                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
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
                    <Card className="p-3 sm:p-4 mt-4">
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
                                                className={`h-7 px-2 sm:px-3 text-xs sm:text-sm ${
                                                    link.active 
                                                        ? "bg-blue-600 hover:bg-blue-700 text-white" 
                                                        : "border-gray-300 hover:border-blue-300 text-gray-700"
                                                }`}
                                            >
                                                <Link href={link.url}>
                                                    <span className="hidden sm:inline" dangerouslySetInnerHTML={{ __html: link.label }} />
                                                    <span className="sm:hidden" dangerouslySetInnerHTML={{ __html: link.label.replace(/&laquo; Previous|Next &raquo;/g, '⋯') }} />
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
                                                className="border-gray-200 text-gray-400 h-7 px-2 sm:px-3 text-xs sm:text-sm"
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