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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

import { useState } from 'react'

export default function AlertsIndex({
    lowEnrollmentSections,
    studentsWithoutSections,
    sectionsWithoutTeachers,
    pendingGradeTeachers,
    alertsSummary
}) {
    const [showPendingModal, setShowPendingModal] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [pendingDetails, setPendingDetails] = useState(null); // paginator object
    const [isLoadingPendingDetails, setIsLoadingPendingDetails] = useState(false);
    const [pendingPage, setPendingPage] = useState(1);
    const PENDING_PER_PAGE = 5;

    const fetchPendingDetails = async (teacherId, page = 1) => {
        setIsLoadingPendingDetails(true);
        setPendingDetails(null);
        setPendingPage(page);

        try {
            const res = await fetch(`/admin/alerts/pending-grades/${teacherId}?page=${page}&per_page=${PENDING_PER_PAGE}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setPendingDetails(data ?? null);
        } catch (e) {
            setPendingDetails({ data: [] });
            console.error(e);
        } finally {
            setIsLoadingPendingDetails(false);
        }
    };

    const openPendingModal = (teacher) => {
        setSelectedTeacher(teacher);
        setShowPendingModal(true);
        fetchPendingDetails(teacher.id, 1);
    };

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
                    <TabsList className="flex gap-2 w-full overflow-x-auto -mx-4 px-4 py-2 sm:grid sm:grid-cols-4 sm:overflow-visible sm:mx-0 sm:px-0">
                        <TabsTrigger
                            value="low-enrollment"
                            aria-label={`Low Enrollment (${alertsSummary.low_enrollment_count})`}
                            className="flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded-md text-sm hover:bg-gray-50"
                        >
                            <School className="w-4 h-4 text-amber-600" />
                            <span className="hidden sm:inline">Low Enrollment</span>
                            <span className="ml-2 inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">{alertsSummary.low_enrollment_count}</span>
                        </TabsTrigger>

                        <TabsTrigger
                            value="unassigned-students"
                            aria-label={`Unassigned Students (${alertsSummary.unassigned_students_count})`}
                            className="flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded-md text-sm hover:bg-gray-50"
                        >
                            <UserX className="w-4 h-4 text-red-600" />
                            <span className="hidden sm:inline">Unassigned Students</span>
                            <span className="ml-2 inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full bg-red-100 text-red-700">{alertsSummary.unassigned_students_count}</span>
                        </TabsTrigger>

                        <TabsTrigger
                            value="unassigned-subjects"
                            aria-label={`Unassigned Subjects (${alertsSummary.unassigned_subjects_count})`}
                            className="flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded-md text-sm hover:bg-gray-50"
                        >
                            <UserCheck className="w-4 h-4 text-orange-600" />
                            <span className="hidden sm:inline">Unassigned Subjects</span>
                            <span className="ml-2 inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full bg-orange-100 text-orange-700">{alertsSummary.unassigned_subjects_count}</span>
                        </TabsTrigger>

                        <TabsTrigger
                            value="pending-grades"
                            aria-label={`Pending Grades (${alertsSummary.pending_grades_count})`}
                            className="flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded-md text-sm hover:bg-gray-50"
                        >
                            <ClipboardList className="w-4 h-4 text-purple-600" />
                            <span className="hidden sm:inline">Pending Grades</span>
                            <span className="ml-2 inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">{alertsSummary.pending_grades_count}</span>
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
                                {lowEnrollmentSections.data.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <School className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        <p>No sections with low enrollment found.</p>
                                    </div>
                                ) : (
                                    <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {lowEnrollmentSections.data.map((section, index) => (
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

                                    {(lowEnrollmentSections.prev_page_url || lowEnrollmentSections.next_page_url) && (
                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="text-sm text-gray-500">Showing {lowEnrollmentSections.from}–{lowEnrollmentSections.to} of {lowEnrollmentSections.total}</div>
                                            <div className="flex items-center gap-2">
                                                {lowEnrollmentSections.prev_page_url ? (
                                                    <Link href={lowEnrollmentSections.prev_page_url} preserveState className="text-sm px-3 py-1 rounded-md border">Previous</Link>
                                                ) : (
                                                    <span className="text-sm text-gray-400 px-3 py-1">Previous</span>
                                                )}

                                                {lowEnrollmentSections.next_page_url ? (
                                                    <Link href={lowEnrollmentSections.next_page_url} preserveState className="text-sm px-3 py-1 rounded-md border">Next</Link>
                                                ) : (
                                                    <span className="text-sm text-gray-400 px-3 py-1">Next</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    </>
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
                                {studentsWithoutSections.data.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        <p>All students are properly assigned to sections.</p>
                                    </div>
                                ) : (
                                    <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {studentsWithoutSections.data.map((student, index) => (
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

                                    {(studentsWithoutSections.prev_page_url || studentsWithoutSections.next_page_url) && (
                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="text-sm text-gray-500">Showing {studentsWithoutSections.from}–{studentsWithoutSections.to} of {studentsWithoutSections.total}</div>
                                            <div className="flex items-center gap-2">
                                                {studentsWithoutSections.prev_page_url ? (
                                                    <Link href={studentsWithoutSections.prev_page_url} preserveState className="text-sm px-3 py-1 rounded-md border">Previous</Link>
                                                ) : (
                                                    <span className="text-sm text-gray-400 px-3 py-1">Previous</span>
                                                )}

                                                {studentsWithoutSections.next_page_url ? (
                                                    <Link href={studentsWithoutSections.next_page_url} preserveState className="text-sm px-3 py-1 rounded-md border">Next</Link>
                                                ) : (
                                                    <span className="text-sm text-gray-400 px-3 py-1">Next</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    </>
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
                                {sectionsWithoutTeachers.data.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        <p>All section subjects have assigned teachers.</p>
                                    </div>
                                ) : (
                                    <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {sectionsWithoutTeachers.data.map((section, index) => (
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

                                    {(sectionsWithoutTeachers.prev_page_url || sectionsWithoutTeachers.next_page_url) && (
                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="text-sm text-gray-500">Showing {sectionsWithoutTeachers.from}–{sectionsWithoutTeachers.to} of {sectionsWithoutTeachers.total}</div>
                                            <div className="flex items-center gap-2">
                                                {sectionsWithoutTeachers.prev_page_url ? (
                                                    <Link href={sectionsWithoutTeachers.prev_page_url} preserveState className="text-sm px-3 py-1 rounded-md border">Previous</Link>
                                                ) : (
                                                    <span className="text-sm text-gray-400 px-3 py-1">Previous</span>
                                                )}

                                                {sectionsWithoutTeachers.next_page_url ? (
                                                    <Link href={sectionsWithoutTeachers.next_page_url} preserveState className="text-sm px-3 py-1 rounded-md border">Next</Link>
                                                ) : (
                                                    <span className="text-sm text-gray-400 px-3 py-1">Next</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    </>
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
                                {pendingGradeTeachers.data.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        <p>All teachers have submitted their grades.</p>
                                    </div>
                                ) : (
                                    <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {pendingGradeTeachers.data.map((teacher, index) => {
                                            const totalStudents = teacher.sections?.reduce((sum, s) => sum + (s.student_count || 0), 0) ?? 0;

                                            return (
                                                <div key={teacher.id ?? index} role="button" onClick={() => openPendingModal(teacher)} className="block">
                                                    <Card className="h-full p-4 border border-purple-200 bg-white/80 hover:bg-white hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between">
                                                        <div className="min-w-0">
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="min-w-0">
                                                                    <p className="font-semibold text-sm text-gray-900 truncate">{teacher.name}</p>
                                                                    <p className="text-xs text-gray-600 truncate mt-1">{teacher.sections?.[0]?.name ?? ''}</p>
                                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                                     
                                                                        {teacher.sections.length > 3 && (
                                                                            <Badge variant="outline" className="text-xs text-purple-700 border-purple-300 bg-purple-50">
                                                                                +{teacher.sections.length - 3} more
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="text-right">
                                                                    <div className="text-2xl font-bold text-purple-700">{totalStudents}</div>
                                                                    <div className="text-xs text-gray-500">students</div>
                                                                </div>
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
                                                                <div className="text-xs text-gray-500">Click to view missing students</div>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {(pendingGradeTeachers.prev_page_url || pendingGradeTeachers.next_page_url) && (
                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="text-sm text-gray-500">Showing {pendingGradeTeachers.from}–{pendingGradeTeachers.to} of {pendingGradeTeachers.total}</div>
                                            <div className="flex items-center gap-2">
                                                {pendingGradeTeachers.prev_page_url ? (
                                                    <Link href={pendingGradeTeachers.prev_page_url} preserveState className="text-sm px-3 py-1 rounded-md border">Previous</Link>
                                                ) : (
                                                    <span className="text-sm text-gray-400 px-3 py-1">Previous</span>
                                                )}

                                                {pendingGradeTeachers.next_page_url ? (
                                                    <Link href={pendingGradeTeachers.next_page_url} preserveState className="text-sm px-3 py-1 rounded-md border">Next</Link>
                                                ) : (
                                                    <span className="text-sm text-gray-400 px-3 py-1">Next</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Pending Grades Details Modal */}
                <Dialog open={showPendingModal} onOpenChange={setShowPendingModal}>
                    <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader className="border-b border-gray-200 pb-4">
                            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                                {selectedTeacher ? `Missing Grades — ${selectedTeacher.name}` : 'Missing Grades'}
                            </DialogTitle>
                            <DialogDescription>
                                <span className="text-sm text-gray-600">Students and missing grade components by subject</span>
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-4">
                            {isLoadingPendingDetails ? (
                                <div className="py-8 text-center text-gray-500">Loading…</div>
                            ) : (!pendingDetails || (Array.isArray(pendingDetails.data) && pendingDetails.data.length === 0)) ? (
                                <div className="text-center py-8 text-gray-500">
                                    <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>No missing grades for this teacher.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                                        <div className="max-h-[440px] overflow-y-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50 sticky top-0 z-10">
                                                    <tr className="border-b border-gray-200">
                                                        <th className="px-3 py-2.5 text-left font-semibold text-gray-700 w-12">#</th>
                                                        <th className="px-3 py-2.5 text-left font-semibold text-gray-700">Student</th>
                                                        <th className="px-3 py-2.5 text-left font-semibold text-gray-700">Subject</th>
                                                        <th className="px-3 py-2.5 text-left font-semibold text-gray-700">Section</th>
                                                        <th className="px-3 py-2.5 text-left font-semibold text-gray-700">Academic Year</th>
                                                        <th className="px-3 py-2.5 text-left font-semibold text-gray-700">Semester</th>
                                                        <th className="px-3 py-2.5 text-left font-semibold text-gray-700">Type</th>
                                                        <th className="px-3 py-2.5 text-left font-semibold text-gray-700">Missing Grades</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {pendingDetails.data.map((item, idx) => (
                                                        <tr key={`pending-${idx}`} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-3 py-3 text-gray-600 font-medium">{pendingDetails.from + idx}</td>
                                                            <td className="px-3 py-3">
                                                                <span className="font-medium text-gray-900">{item.student}</span>
                                                            </td>
                                                            <td className="px-3 py-3 text-gray-700">{item.subject}</td>
                                                            <td className="px-3 py-3 text-gray-700">{item.section}</td>
                                                            <td className="px-3 py-3 text-gray-700">{item.academic_year}</td>
                                                            <td className="px-3 py-3">
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">{item.semester}</span>
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">{item.type}</span>
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">{item.missing_grades}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {pendingDetails.total > pendingDetails.per_page && (
                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="text-sm text-gray-500">Showing {pendingDetails.from}–{pendingDetails.to} of {pendingDetails.total}</div>
                                            <div className="flex items-center gap-2">
                                                <Button size="sm" variant="outline" disabled={!pendingDetails.prev_page_url} onClick={() => fetchPendingDetails(selectedTeacher.id, pendingDetails.current_page - 1)}>
                                                    Previous
                                                </Button>

                                                <div className="text-sm text-gray-600">Page {pendingDetails.current_page} of {pendingDetails.last_page}</div>

                                                <Button size="sm" variant="outline" disabled={!pendingDetails.next_page_url} onClick={() => fetchPendingDetails(selectedTeacher.id, pendingDetails.current_page + 1)}>
                                                    Next
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <Button onClick={() => setShowPendingModal(false)} variant="outline">Close</Button>
                        </div>
                    </DialogContent>
                </Dialog>

            </div>
        </AuthenticatedLayout>
    )
}