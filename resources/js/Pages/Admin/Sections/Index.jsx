import React, { useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    School, 
    Users, 
    BookOpen, 
    Calendar, 
    Plus, 
    GraduationCap, 
    ChevronRight,
    Building2,
    MapPin,
    Clock
} from 'lucide-react';

const Index = ({ 
    sections, 
    programs = [],
    currentAcademicPeriod = {}
}) => {
    // Separate college and SHS sections
    const collegeSections = useMemo(() => {
        if (!sections?.data) return [];
        return sections.data.filter(section => {
            const isCollege = section.program?.program_name?.toLowerCase().includes('bachelor') || 
                             section.year_level > 12 || 
                             ['1st', '2nd', '3rd', '4th', 'first', 'second', 'third', 'fourth'].some(year => 
                                 section.section_name?.toLowerCase().includes(year)
                             );
            return isCollege;
        });
    }, [sections]);

    const shsSections = useMemo(() => {
        if (!sections?.data) return [];
        return sections.data.filter(section => {
            const isCollege = section.program?.program_name?.toLowerCase().includes('bachelor') || 
                             section.year_level > 12 || 
                             ['1st', '2nd', '3rd', '4th', 'first', 'second', 'third', 'fourth'].some(year => 
                                 section.section_name?.toLowerCase().includes(year)
                             );
            return !isCollege;
        });
    }, [sections]);

    // Calculate stats
    const totalSections = sections?.data?.length || 0;
    const totalStudents = sections?.data?.reduce((total, section) => total + (section.enrolled_count || 0), 0) || 0;
    const totalPrograms = programs.length || 0;
    const currentSemesterSections = sections?.data?.filter(section => 
        section.semester === currentAcademicPeriod.semester && 
        section.academic_year === currentAcademicPeriod.academic_year
    ).length || 0;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center px-2 py-1">
                    <div className="flex items-center gap-2">
                        <div className="bg-green-100 p-1.5 rounded-md">
                            <School className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Section Overview</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Comprehensive section management dashboard</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Section Overview" />

            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
             <div className="flex flex-col sm:flex-row items-end justify-end sm:items-center gap-3 mt-4 sm:mt-0">
                      
                        
                        <Badge variant="outline" className="bg-white border-blue-200 text-blue-600 px-3 py-2">
                            <Calendar className="w-4 h-4 mr-2" />
                           Academic Year: {currentAcademicPeriod.academic_year} - {currentAcademicPeriod.semester}
                        </Badge>
                    </div>

                {/* College and SHS Navigation Cards */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* College Sections Card */}
                    <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200/30 to-indigo-300/30 rounded-bl-full transform translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-300"></div>
                        
                        <CardHeader className="pb-4 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                                    <School className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                                        College Sections
                                    </CardTitle>
                                    <CardDescription className="text-blue-600 font-medium">
                                        Manage bachelor degree program sections
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4 relative z-10">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <School className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <span className="text-2xl font-bold text-blue-700">{collegeSections.length}</span>
                                    <p className="text-xs text-blue-600 font-semibold">Sections</p>
                                </div>
                                <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Users className="w-4 h-4 text-green-600" />
                                    </div>
                                    <span className="text-2xl font-bold text-green-700">
                                        {collegeSections.reduce((total, section) => total + (section.enrolled_count || 0), 0)}
                                    </span>
                                    <p className="text-xs text-green-600 font-semibold">Students</p>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200 font-semibold">
                                    <Link href={route('admin.college.sections.index')}>
                                        <BookOpen className="w-4 h-4 mr-2" />
                                        Manage College Sections
                                        <ChevronRight className="w-4 h-4 ml-auto" />
                                    </Link>
                                </Button>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" size="sm" asChild className="text-xs">
                                        <Link href={route('admin.college.sections.create')}>
                                            <Plus className="w-3 h-3 mr-1" />
                                            Add Section
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="sm" asChild className="text-xs">
                                        <Link href={route('admin.college.sections.index')}>
                                            <Users className="w-3 h-3 mr-1" />
                                            View Students
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* SHS Sections Card */}
                    <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-200/30 to-pink-300/30 rounded-bl-full transform translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-300"></div>
                        
                        <CardHeader className="pb-4 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                                    <GraduationCap className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                                        SHS Sections
                                    </CardTitle>
                                    <CardDescription className="text-purple-600 font-medium">
                                        Manage senior high school sections
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4 relative z-10">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <GraduationCap className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <span className="text-2xl font-bold text-purple-700">{shsSections.length}</span>
                                    <p className="text-xs text-purple-600 font-semibold">Sections</p>
                                </div>
                                <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Users className="w-4 h-4 text-green-600" />
                                    </div>
                                    <span className="text-2xl font-bold text-green-700">
                                        {shsSections.reduce((total, section) => total + (section.enrolled_count || 0), 0)}
                                    </span>
                                    <p className="text-xs text-green-600 font-semibold">Students</p>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Button asChild className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md hover:shadow-lg transition-all duration-200 font-semibold">
                                    <Link href={route('admin.shs.sections.index')}>
                                        <BookOpen className="w-4 h-4 mr-2" />
                                        Manage SHS Sections
                                        <ChevronRight className="w-4 h-4 ml-auto" />
                                    </Link>
                                </Button>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" size="sm" asChild className="text-xs">
                                        <Link href={route('admin.shs.sections.create')}>
                                            <Plus className="w-3 h-3 mr-1" />
                                            Add Section
                                        </Link>
                                    </Button>
                                    <Button variant="outline" size="sm" asChild className="text-xs">
                                        <Link href={route('admin.shs.sections.index')}>
                                            <Users className="w-3 h-3 mr-1" />
                                            View Students
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Index;