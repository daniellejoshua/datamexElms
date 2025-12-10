import { Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, GraduationCap, BookOpen, UserCheck, School, FileText, Calendar, TrendingUp } from 'lucide-react'

export default function RegistrarDashboard({ stats, auth }) {
    const registrar = auth.user.registrar

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <School className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Registrar Dashboard</h2>
                            <p className="text-sm text-blue-600 font-medium mt-1">
                                Welcome back, {registrar?.full_name || auth.user.name} - Employee #{registrar?.employee_number || 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Registrar Dashboard" />

            <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_students}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.active_students} active
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_teachers}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.active_teachers} active
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Sections</CardTitle>
                            <School className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_sections}</div>
                            <p className="text-xs text-muted-foreground">
                                Current academic year
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Enrollment Rate</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {Math.round((stats.active_students / stats.total_students) * 100)}%
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Active enrollment
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <Link href={route('registrar.enrollments.index')} className="block">
                            <CardHeader>
                                <CardTitle className="flex items-center text-lg">
                                    <Users className="w-5 h-5 mr-2 text-blue-600" />
                                    Student Management
                                </CardTitle>
                                <CardDescription>
                                    Manage students, enrollments, and access historical records
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">
                                        {stats.total_students} students registered
                                    </span>
                                    <Badge variant="secondary">{stats.active_students} active</Badge>
                                </div>
                            </CardContent>
                        </Link>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <Link href={route('registrar.teachers')} className="block">
                            <CardHeader>
                                <CardTitle className="flex items-center text-lg">
                                    <GraduationCap className="w-5 h-5 mr-2 text-green-600" />
                                    Teacher Management
                                </CardTitle>
                                <CardDescription>
                                    Manage teacher profiles, assignments, and scheduling
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">
                                        {stats.total_teachers} teachers registered
                                    </span>
                                    <Badge variant="secondary">{stats.active_teachers} active</Badge>
                                </div>
                            </CardContent>
                        </Link>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <Link href={route('registrar.sections')} className="block">
                            <CardHeader>
                                <CardTitle className="flex items-center text-lg">
                                    <School className="w-5 h-5 mr-2 text-purple-600" />
                                    Section Management
                                </CardTitle>
                                <CardDescription>
                                    Create and manage class sections and course offerings
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">
                                        {stats.total_sections} sections available
                                    </span>
                                    <Badge variant="secondary">Current semester</Badge>
                                </div>
                            </CardContent>
                        </Link>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <Link href={route('registrar.enrollments.index')} className="block">
                            <CardHeader>
                                <CardTitle className="flex items-center text-lg">
                                    <UserCheck className="w-5 h-5 mr-2 text-orange-600" />
                                    Student Enrollment
                                </CardTitle>
                                <CardDescription>
                                    Manage students, enrollments, and access historical records
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">
                                        Enroll new students
                                    </span>
                                    <Badge variant="default">Quick Action</Badge>
                                </div>
                            </CardContent>
                        </Link>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <Link href={route('registrar.payments.college.index')} className="block">
                            <CardHeader>
                                <CardTitle className="flex items-center text-lg">
                                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                                    College Payments
                                </CardTitle>
                                <CardDescription>
                                    Manage college student payments, fees, and financial records
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">
                                        College payment management
                                    </span>
                                    <Badge variant="secondary">Payment System</Badge>
                                </div>
                            </CardContent>
                        </Link>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <Link href={route('registrar.payments.shs.index')} className="block">
                            <CardHeader>
                                <CardTitle className="flex items-center text-lg">
                                    <FileText className="w-5 h-5 mr-2 text-green-600" />
                                    SHS Payments
                                </CardTitle>
                                <CardDescription>
                                    Handle Senior High School student payments and billing
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">
                                        SHS payment management
                                    </span>
                                    <Badge variant="secondary">Payment System</Badge>
                                </div>
                            </CardContent>
                        </Link>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <Link href={route('registrar.subjects.index')} className="block">
                            <CardHeader>
                                <CardTitle className="flex items-center text-lg">
                                    <BookOpen className="w-5 h-5 mr-2 text-green-600" />
                                    Subject Management
                                </CardTitle>
                                <CardDescription>
                                    Create and manage academic subjects and curriculum
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">
                                        Manage subjects and curriculum
                                    </span>
                                    <Badge variant="default">Academic Content</Badge>
                                </div>
                            </CardContent>
                        </Link>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <Link href={route('registrar.programs.index')} className="block">
                            <CardHeader>
                                <CardTitle className="flex items-center text-lg">
                                    <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                                    Course Management
                                </CardTitle>
                                <CardDescription>
                                    Manage courses, set semester fees, and handle related subjects
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">
                                        Program and subject management
                                    </span>
                                    <Badge variant="default">Course Management</Badge>
                                </div>
                            </CardContent>
                        </Link>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader>
                            <CardTitle className="flex items-center text-lg">
                                <FileText className="w-5 h-5 mr-2 text-red-600" />
                                Academic Records
                            </CardTitle>
                            <CardDescription>
                                Generate transcripts, certificates, and academic reports
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">
                                    Generate documents
                                </span>
                                <Badge variant="outline">Coming Soon</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Latest updates and actions in the system
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">System initialized</p>
                                    <p className="text-xs text-gray-500">Registrar dashboard is ready for use</p>
                                </div>
                                <span className="text-xs text-gray-500">Just now</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    )
}