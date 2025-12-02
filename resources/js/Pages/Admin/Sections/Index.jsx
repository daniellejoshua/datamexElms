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
    Filter
} from 'lucide-react';

const Index = ({ 
    sections, 
    filters = {}, 
    currentAcademicPeriod = {}, 
    academicYearOptions = [], 
    semesterOptions = [] 
}) => {
    const [selectedAcademicYear, setSelectedAcademicYear] = useState(filters.academic_year || '');
    const [selectedSemester, setSelectedSemester] = useState(filters.semester || '');

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
        }

        // Navigate with filters
        router.get(route('admin.sections.index'), newFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };
    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Sections Management</h2>
                        <p className="text-sm text-blue-600 font-medium mt-1">Manage academic sections and enrollments</p>
                    </div>
                </div>
            }
        >
            <Head title="Sections Management" />
            
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Header with Add Button */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">All Sections</h3>
                        <p className="text-sm text-gray-600">
                            {sections?.data?.length || 0} section{(sections?.data?.length || 0) !== 1 ? 's' : ''} found
                        </p>
                    </div>
                    <Button asChild className="bg-red-600 hover:bg-red-700 text-white shadow-lg">
                        <Link href="/admin/sections/create">
                            <Plus className="w-4 h-4 mr-2" />
                            Add New Section
                        </Link>
                    </Button>
                </div>

                {/* Filters Section */}
                <Card className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-2 text-gray-700 font-medium">
                            <Filter className="w-4 h-4" />
                            <span>Filter by:</span>
                            {currentAcademicPeriod.academic_year && (
                                <Badge variant="outline" className="ml-2 text-xs text-blue-600 border-blue-300">
                                    Current: {currentAcademicPeriod.academic_year} - {currentAcademicPeriod.semester}
                                </Badge>
                            )}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3 flex-1">
                            {/* Academic Year Filter */}
                            <div className="flex-1">
                                <Select
                                    value={selectedAcademicYear || 'all'}
                                    onValueChange={(value) => handleFilterChange('academic_year', value)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Academic Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Academic Years</SelectItem>
                                        {academicYearOptions.map((year) => (
                                            <SelectItem key={year} value={year}>
                                                {year} {year === currentAcademicPeriod.academic_year ? '(Current)' : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Semester Filter */}
                            <div className="flex-1">
                                <Select
                                    value={selectedSemester || 'all'}
                                    onValueChange={(value) => handleFilterChange('semester', value)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Semester" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Semesters</SelectItem>
                                        {semesterOptions.map((semester) => (
                                            <SelectItem key={semester.value} value={semester.value}>
                                                {semester.label} {semester.value === currentAcademicPeriod.semester ? '(Current)' : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        {/* Reset to Current Button */}
                        {(selectedAcademicYear !== currentAcademicPeriod.academic_year || selectedSemester !== currentAcademicPeriod.semester) && (
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                    handleFilterChange('academic_year', currentAcademicPeriod.academic_year);
                                    handleFilterChange('semester', currentAcademicPeriod.semester);
                                }}
                                className="text-blue-600 hover:text-blue-800 border-blue-300"
                            >
                                Show Current
                            </Button>
                        )}
                        
                        {/* Clear Filters Button */}
                        {(selectedAcademicYear || selectedSemester) && (
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                    // Clear all filters to show ALL sections
                                    setSelectedAcademicYear('');
                                    setSelectedSemester('');
                                    router.get(route('admin.sections.index'), {}, {
                                        preserveState: true,
                                        preserveScroll: true,
                                    });
                                }}
                                className="text-gray-600 hover:text-gray-800"
                            >
                                Show All
                            </Button>
                        )}
                    </div>
                </Card>

                {/* Sections Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {sections?.data?.length > 0 ? (
                        sections.data.map((section) => {
                            return (
                                <Card key={section.id} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 relative overflow-hidden">
                                    {/* Status Badge */}
                                    <div className="absolute top-4 right-4">
                                        <Badge 
                                            className={`shadow-md font-semibold ${
                                                section.status === 'active' 
                                                    ? 'bg-white hover:bg-green-700 text-green-500 border-green-600' 
                                                    : 'bg-white hover:bg-red-700 text-red-600 border-red-600'
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
                                                <CardTitle className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                                                    {section.program?.program_code}-{section.year_level}{section.section_name}
                                                </CardTitle>
                                                <CardDescription className="text-blue-600 font-semibold truncate">
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
                                                            {section.subjects?.length || 0}
                                                        </span>
                                                        <span className="text-xs text-gray-600">Subjects</span>
                                                    </div>
                                                </Card>
                                                
                                                <Card className="p-2 text-center bg-purple-50 border-purple-200">
                                                    <div className="flex flex-col items-center">
                                                        <Users className="w-4 h-4 text-purple-600 mb-1" />
                                                        <span className="text-xs font-semibold text-gray-700">
                                                            {section.enrollments?.length || 0}
                                                        </span>
                                                        <span className="text-xs text-gray-600">Students</span>
                                                    </div>
                                                </Card>
                                            </div>
                                            
                                            <Card className="p-3 bg-blue-50 border-blue-200">
                                                <div className="flex items-center text-sm">
                                                    <Calendar className="w-4 h-4 text-blue-600 mr-3 flex-shrink-0" />
                                                    <span className="text-gray-700 font-medium truncate">
                                                        {section.academic_year} - {section.semester}
                                                    </span>
                                                </div>
                                            </Card>
                                        </div>
                                        
                                        {/* Action Buttons */}
                                        <div className="space-y-3">
                                            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                                                <Link href={`/admin/sections/${section.id}/subjects`}>
                                                    <BookOpen className="w-4 h-4 mr-2" />
                                                    Manage Subjects
                                                    <ChevronRight className="w-4 h-4 ml-auto" />
                                                </Link>
                                            </Button>
                                            
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button asChild variant="outline" className="border-2 border-blue-300 text-blue-700 hover:bg-blue-50 font-medium">
                                                    <Link href={`/admin/sections/${section.id}/students`}>
                                                        <Users className="w-3 h-3 mr-1" />
                                                        Students
                                                    </Link>
                                                </Button>
                                                <Button asChild variant="outline" className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium">
                                                    <Link href={`/admin/sections/${section.id}/edit`}>
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
                            <Card className="p-16 text-center border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors bg-gradient-to-br from-gray-50 to-blue-50">
                                <div className="space-y-6">
                                    <div className="p-6 bg-gradient-to-br from-blue-100 to-red-100 rounded-full w-24 h-24 mx-auto flex items-center justify-center shadow-lg">
                                        <Building2 className="w-10 h-10 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-3">No sections found</h3>
                                        <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                                            Create your first section to get started with managing academic programs and student enrollments.
                                        </p>
                                        <Button asChild className="bg-red-600 hover:bg-red-700 text-white shadow-lg px-8 py-3 text-base">
                                            <Link href="/admin/sections/create">
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
                    <Card className="p-6">
                        <div className="flex justify-center">
                            <nav className="flex items-center space-x-2">
                                {sections.links.map((link, index) => {
                                    if (link.url) {
                                        return (
                                            <Button
                                                key={index}
                                                asChild
                                                variant={link.active ? "default" : "outline"}
                                                size="sm"
                                                className={link.active 
                                                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md" 
                                                    : "border-gray-300 hover:border-blue-300 text-gray-700"
                                                }
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
                                                className="border-gray-200 text-gray-400"
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