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
    programs = []
}) => {
    const [selectedAcademicYear, setSelectedAcademicYear] = useState(filters.academic_year || '');
    const [selectedSemester, setSelectedSemester] = useState(filters.semester || '');
    const [selectedProgram, setSelectedProgram] = useState(filters.program_id || '');

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
        } else if (type === 'program_id') {
            setSelectedProgram(value === 'all' ? '' : value);
        }

        // Navigate with filters
        router.get(route('admin.college.sections.index'), newFilters, {
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
            '2nd': 'Second Semester', 
            'summer': 'Summer'
        };
        return semesterMap[semester] || semester;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center px-2 py-1">
                    <div className="flex items-center gap-2">
                        <div className="bg-green-100 p-1.5 rounded-md">
                            <School className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">College Sections</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Manage college program sections and student enrollments</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="College Sections" />
            
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
                                <Badge variant="outline" className="bg-white border-red-200 text-red-600 px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm">
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

                                {/* Program Filter */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">Program</label>
                                    <Select 
                                        value={selectedProgram || 'all'} 
                                        onValueChange={(value) => handleFilterChange('program_id', value)}
                                    >
                                        <SelectTrigger className="h-8 w-48 text-sm">
                                            <SelectValue placeholder="Program" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Show All Programs</SelectItem>
                                            {programs.map((program) => (
                                                <SelectItem key={program.id} value={program.id.toString()}>
                                                    {program.program_code} - {program.program_name}
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
                                    <Button 
                                        size="sm" 
                                        className="bg-red-600 hover:bg-red-700 text-white px-3"
                                        onClick={() => router.visit(route('admin.college.sections.create'))}
                                    >
                                        <Plus className="w-3 h-3 mr-2" />
                                        Create Section
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

                                {/* Program Filter */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Program</label>
                                    <Select 
                                        value={selectedProgram || 'all'} 
                                        onValueChange={(value) => handleFilterChange('program_id', value)}
                                    >
                                        <SelectTrigger className="h-10 w-full text-sm">
                                            <SelectValue placeholder="Program" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Show All Programs</SelectItem>
                                            {programs.map((program) => (
                                                <SelectItem key={program.id} value={program.id.toString()}>
                                                    {program.program_code} - {program.program_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Create Section Button */}
                                <div className="flex justify-end pt-2">
                                    <Button asChild className="bg-red-600 hover:bg-red-700 text-white px-4 py-2">
                                        <Link href={route('admin.college.sections.create')}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create Section
                                        </Link>
                                    </Button>
                                </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sections Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                    {sections?.data?.length > 0 ? (
                        sections.data.map((section) => {
                            return (
                                <TooltipProvider key={section.id}>
                                    <Tooltip delayDuration={1000}>
                                        <TooltipTrigger asChild>
                                            <Link href={route('admin.sections.show', section.id)} className="block">
                                                <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-red-300 relative overflow-hidden cursor-pointer">
                                        {/* Status Badge */}
                                        <div className="absolute top-4 right-4">
                                            <Badge 
                                                className={`shadow-md font-semibold ${
                                                    section.status === 'active' 
                                                        ? 'bg-white  text-green-500 border-green-600' 
                                                        : 'bg-white text-red-600 border-red-600'
                                                }`}
                                            >
                                                {section.status}
                                            </Badge>
                                        </div>

                                        <CardHeader className="pb-4">
                                            <div className="flex items-start space-x-3">
                                                <div className="p-3 bg-red-600 rounded-xl flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                                                    <School className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <CardTitle className="text-lg font-bold text-gray-900 truncate group-hover:text-red-700 transition-colors">
                                                        {section.program?.program_code}-{section.year_level}{section.section_name}
                                                    </CardTitle>
                                                    <CardDescription className="text-red-600 font-semibold truncate">
                                                        {section.program?.program_name || 'N/A'}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        
                                        <CardContent className="space-y-6">
                                            {/* Section Details */}
                                            <div className="space-y-4">
                                                <Card className="p-3 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
                                                    <div className="flex items-center text-sm">
                                                        <GraduationCap className="w-4 h-4 text-green-600 mr-3 flex-shrink-0" />
                                                        <span className="text-gray-700 font-medium truncate">
                                                            Year {section.year_level} - Section {section.section_name}
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
                                                    
                                                    <Card className="p-2 text-center bg-purple-50 border-purple-200">
                                                        <div className="flex flex-col items-center">
                                                            <Users className="w-4 h-4 text-purple-600 mb-1" />
                                                            <span className="text-xs font-semibold text-gray-700">
                                                                {section.enrolled_count || 0}
                                                            </span>
                                                            <span className="text-xs text-gray-600">Students</span>
                                                        </div>
                                                    </Card>
                                                </div>
                                                
                                                <Card className="p-3 bg-red-50 border-red-200">
                                                    <div className="flex items-center text-sm">
                                                        <Calendar className="w-4 h-4 text-red-600 mr-3 flex-shrink-0" />
                                                    <span className="text-gray-700 font-medium truncate">
                                                        {section.academic_year} - {getSemesterDisplayName(section.semester)}
                                                    </span>
                                                </div>
                                            </Card>
                                        </div>
                                        
                                        {/* Action Buttons - Prevent event bubbling */}
                                        <div className="space-y-3" onClick={(e) => e.preventDefault()}>
                                            <Button 
                                                asChild 
                                                className={`w-full shadow-md ${
                                                    isSectionReadOnly(section) 
                                                        ? 'bg-gray-400 cursor-not-allowed opacity-60' 
                                                        : 'bg-red-600 hover:bg-red-700'
                                                } text-white`}
                                                disabled={isSectionReadOnly(section)}
                                            >
                                                <Link href={route('admin.college.sections.subjects', section.id)}>
                                                    <BookOpen className="w-4 h-4 mr-2" />
                                                    Manage Subjects
                                                    <ChevronRight className="w-4 h-4 ml-auto" />
                                                </Link>
                                            </Button>
                                            
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button 
                                                    asChild 
                                                    variant="outline" 
                                                    className={`border-2 font-medium ${
                                                        isSectionReadOnly(section) 
                                                            ? 'border-gray-300 text-gray-400 cursor-not-allowed opacity-60' 
                                                            : 'border-red-300 text-red-700 hover:bg-red-50'
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
                                                    className={`border-2 font-medium ${
                                                        isSectionReadOnly(section) 
                                                            ? 'border-gray-300 text-gray-400 cursor-not-allowed opacity-60' 
                                                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                                    }`}
                                                    disabled={isSectionReadOnly(section)}
                                                >
                                                    <Link href={route('admin.college.sections.edit', section.id)}>
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
                            <Card className="p-16 text-center border-2 border-dashed border-gray-300">
                                <div className="space-y-6">
                                    <div className="p-6 bg-gray-100 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                                        <Building2 className="w-10 h-10 text-gray-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-3">No college sections found</h3>
                                        <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                                            Create your first college section to get started with managing college academic programs and student enrollments.
                                        </p>
                                        <Button asChild className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-base">
                                            <Link href={route('admin.college.sections.create')}>
                                                <Plus className="w-5 h-5 mr-2" />
                                                Create First Section
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
                                                        ? "bg-red-600 hover:bg-red-700 text-white" 
                                                        : "border-gray-300 hover:border-red-300 text-gray-700"
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