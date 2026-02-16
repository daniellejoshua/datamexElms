import { Head } from '@inertiajs/react'
import { Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Users,
    School,
    GraduationCap,
    BookOpen,
    AlertTriangle,
    UserX,
    UserCheck,
    ClipboardList,
    TrendingUp,
    ArrowLeft,
    Filter,
    Download
} from 'lucide-react'

import { useState } from 'react'

export default function AlertsIndex({
    lowEnrollmentSections,
    studentsWithoutSections,
    sectionsWithoutTeachers,
    pendingGradeTeachers,
    alertsSummary
}) {


    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between px-2 py-1">
                    <div className="flex items-center gap-2">
                        <Link href={route('admin.dashboard')} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                            <ArrowLeft className="w-4 h-4 text-gray-600" />
                        </Link>
                        <div className="bg-red-100 p-1.5 rounded-md">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Academic Alerts Center</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Comprehensive view of all academic issues</p>
                        </div>
                    </div>
                  
                </div>
            }
        >
            <Head title="Academic Alerts Center" />
                    
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-amber-800">Low Enrollment</CardTitle>
                            <School className="h-4 w-4 text-amber-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-700">
                                {alertsSummary.low_enrollment_count}
                            </div>
                            <p className="text-xs text-amber-600 mt-1">
                                Sections need attention
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-red-200 bg-gradient-to-br from-red-50 to-pink-50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-red-800">Unassigned Students</CardTitle>
                            <UserX className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-700">
                                {alertsSummary.unassigned_students_count}
                            </div>
                            <p className="text-xs text-red-600 mt-1">
                                Need section assignment
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-orange-800">Unassigned Subjects</CardTitle>
                            <UserCheck className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-700">
                                {alertsSummary.unassigned_subjects_count}
                            </div>
                            <p className="text-xs text-orange-600 mt-1">
                                Sections need teachers
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-purple-800">Pending Grades</CardTitle>
                            <ClipboardList className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-700">
                                {alertsSummary.pending_grades_count}
                            </div>
                            <p className="text-xs text-purple-600 mt-1">
                                Teachers need to submit
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Alerts Tabs */}
                <Tabs defaultValue="low-enrollment" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="low-enrollment" className="flex items-center gap-2">
                            <School className="w-4 h-4" />
                            Low Enrollment ({alertsSummary.low_enrollment_count})
                        </TabsTrigger>
                        <TabsTrigger value="unassigned-students" className="flex items-center gap-2">
                            <UserX className="w-4 h-4" />
                            Unassigned Students ({alertsSummary.unassigned_students_count})
                        </TabsTrigger>
                        <TabsTrigger value="unassigned-subjects" className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4" />
                            Unassigned Subjects ({alertsSummary.unassigned_subjects_count})
                        </TabsTrigger>
                        <TabsTrigger value="pending-grades" className="flex items-center gap-2">
                            <ClipboardList className="w-4 h-4" />
                            Pending Grades ({alertsSummary.pending_grades_count})
                        </TabsTrigger>
                    </TabsList>

                    {/* Low Enrollment Tab */}
                    <TabsContent value="low-enrollment" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg">Sections with Low Enrollment</CardTitle>
                                        <CardDescription>Sections with fewer than 20 students enrolled</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {lowEnrollmentSections.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <School className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        <p>No sections with low enrollment found.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {lowEnrollmentSections.map((section, index) => (
                                            <Link key={section.id ?? index} href={route('admin.sections.show', section.id)} className="block">
                                                <Card className="h-full p-4 border border-amber-200 bg-white/80 hover:bg-white hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between">
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-sm text-gray-900 truncate">{section.section_name}</p>
                                                        <p className="text-xs text-gray-600 truncate mt-1">{section.program_name}</p>
                                                    </div>

                                                    <div className="mt-4 flex items-center justify-between">
                                                        <Badge variant="outline" className="text-xs">
                                                            {section.student_count} students
                                                        </Badge>

                                                        <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                                                            Low Enrollment
                                                        </Badge>
                                                    </div>
                                                </Card>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Unassigned Students Tab */}
                    <TabsContent value="unassigned-students" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg">Students Without Section Assignment</CardTitle>
                                        <CardDescription>Students who are not enrolled in any active section</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {studentsWithoutSections.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        <p>All students are properly assigned to sections.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {studentsWithoutSections.map((student, index) => (
                                            <Link key={student.id ?? index} href={route('registrar.students')} className="block">
                                                <Card className="h-full p-4 border border-red-200 bg-white/80 hover:bg-white hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between">
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-sm text-gray-900 truncate">{student.name}</p>
                                                        <p className="text-xs text-gray-600 truncate mt-1">
                                                            {student.student_number} • {student.program_name} • Year {student.year_level}
                                                        </p>
                                                    </div>

                                                    <div className="mt-4 flex items-center justify-between">
                                                        <div className="flex flex-col text-right">
                                                            <div className="text-xs text-gray-500">Year</div>
                                                            <div className="text-sm font-semibold text-gray-900">{student.year_level}</div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="text-xs text-red-700 border-red-300 bg-red-50">
                                                                {student.education_level === 'senior_high' ? 'SHS' : 'College'}
                                                            </Badge>
                                                            <Badge variant="outline" className="text-xs text-gray-500">View</Badge>
                                                        </div>
                                                    </div>
                                                </Card>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Unassigned Subjects Tab */}
                    <TabsContent value="unassigned-subjects" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg">Sections with Unassigned Subjects</CardTitle>
                                        <CardDescription>Sections that have subjects without assigned teachers</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {sectionsWithoutTeachers.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        <p>All section subjects have assigned teachers.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {sectionsWithoutTeachers.map((section, index) => (
                                            <Link key={section.id ?? index} href={route(section.education_level === 'senior_high' ? 'admin.shs.sections.subjects' : 'admin.college.sections.subjects', section.id)} className="block">
                                                <Card className="h-full p-4 border border-orange-200 bg-white/80 hover:bg-white hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between">
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-sm text-gray-900 truncate">{section.section_name}</p>
                                                        <p className="text-xs text-gray-600 truncate mt-1">{section.program_name}</p>
                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                            {section.unassigned_subjects.slice(0, 3).map((subject, subjIndex) => (
                                                                <Badge key={subjIndex} variant="outline" className="text-xs text-orange-700 border-orange-300 bg-orange-50">
                                                                    {subject}
                                                                </Badge>
                                                            ))}
                                                            {section.unassigned_subjects.length > 3 && (
                                                                <Badge variant="outline" className="text-xs text-orange-700 border-orange-300 bg-orange-50">
                                                                    +{section.unassigned_subjects.length - 3} more
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 flex items-center justify-between">
                                                        <div className="flex flex-col items-end">
                                                            <div className="text-right text-xs text-gray-500">Capacity</div>
                                                            <div className="text-sm font-semibold text-gray-900">{section.capacity}</div>
                                                        </div>
                                                        <Badge variant="outline" className="text-orange-700 border-orange-300 bg-orange-50 font-semibold">
                                                            {section.unassigned_count} subjects
                                                        </Badge>
                                                    </div>
                                                </Card>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Pending Grades Tab */}
                    <TabsContent value="pending-grades" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg">Teachers with Pending Grade Submissions</CardTitle>
                                        <CardDescription>Teachers who haven't submitted grades for the current period</CardDescription>
                                    </div>

                                </div> 
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {pendingGradeTeachers.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        <p>All teachers have submitted their grades.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {pendingGradeTeachers.map((teacher, index) => (
                                            <Link key={teacher.id ?? index} href={route('admin.teachers.show', teacher.id)} className="block">
                                                <Card className="h-full p-4 border border-purple-200 bg-white/80 hover:bg-white hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between">
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-sm text-gray-900 truncate">{teacher.name}</p>

                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                            {teacher.sections.slice(0, 3).map((section, sectIndex) => (
                                                                <Badge key={sectIndex} variant="outline" className="text-xs text-purple-700 border-purple-300 bg-purple-50">
                                                                    {section.name} • {section.student_count}
                                                                </Badge>
                                                            ))}
                                                            {teacher.sections.length > 3 && (
                                                                <Badge variant="outline" className="text-xs text-purple-700 border-purple-300 bg-purple-50">
                                                                    +{teacher.sections.length - 3} more
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="mt-2 flex gap-1">
                                                            {teacher.education_levels.map((level, levelIndex) => (
                                                                <Badge key={levelIndex} variant="outline" className="text-xs text-purple-600 border-purple-300">
                                                                    {level === 'senior_high' ? 'SHS' : 'College'}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 flex items-center justify-end gap-3">
                                                        <Badge variant="outline" className="text-purple-700 border-purple-300 bg-purple-50 font-semibold">
                                                            {teacher.pending_subjects_count} subjects
                                                        </Badge>

                                                        <div className="text-right">
                                                            {teacher.email && (
                                                                <div className="text-xs text-gray-500">{teacher.email}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Card>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

            </div>
        </AuthenticatedLayout>
    )
}