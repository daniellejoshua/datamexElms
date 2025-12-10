import { Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit, BookOpen, Users, Calendar, GraduationCap, Building2 } from 'lucide-react'

export default function SubjectsShow({ auth, subject }) {
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

    const getStatusColor = (status) => {
        return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between px-2 py-1">
                    <div className="flex items-center gap-2">
                        <Button asChild variant="ghost" size="sm" className="text-xs h-7 px-2">
                            <Link href={route('registrar.subjects.index')}>
                                <ArrowLeft className="w-3 h-3 mr-1" />
                                Back to Subjects
                            </Link>
                        </Button>
                        <div className="bg-green-100 p-1.5 rounded-md">
                            <BookOpen className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">{subject.subject_name}</h2>
                            <p className="text-xs text-gray-500 mt-0.5">{subject.subject_code}</p>
                        </div>
                    </div>
                    <Button asChild size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-7 px-2">
                        <Link href={route('registrar.subjects.edit', subject.id)}>
                            <Edit className="w-3 h-3 mr-1" />
                            Edit Subject
                        </Link>
                    </Button>
                </div>
            }
        >
            <Head title={subject.subject_name} />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Subject Overview */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-2xl">{subject.subject_name}</CardTitle>
                                <CardDescription className="text-lg font-mono mt-1">
                                    {subject.subject_code}
                                </CardDescription>
                            </div>
                            <Badge className={`text-sm ${getStatusColor(subject.status)}`}>
                                {subject.status === 'active' ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {subject.description && (
                            <p className="text-gray-700 mb-4">{subject.description}</p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-500" />
                                <div>
                                    <p className="text-sm text-gray-600">Education Level</p>
                                    <p className="font-medium">
                                        {subject.education_level === 'college' ? 'College' : 'Senior High School'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-gray-500" />
                                <div>
                                    <p className="text-sm text-gray-600">Year Level</p>
                                    <p className="font-medium">Year {subject.year_level}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <div>
                                    <p className="text-sm text-gray-600">Semester</p>
                                    <Badge className={`text-xs ${getSemesterColor(subject.semester)}`}>
                                        {subject.semester === 'first' ? '1st Semester' : '2nd Semester'}
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-gray-500" />
                                <div>
                                    <p className="text-sm text-gray-600">Subject Type</p>
                                    <Badge className={`text-xs ${getSubjectTypeColor(subject.subject_type)}`}>
                                        {subject.subject_type.charAt(0).toUpperCase() + subject.subject_type.slice(1)}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold text-blue-600">{subject.units}</span>
                                </div>
                                <div>
                                    <p className="font-medium">Credit Units</p>
                                    <p className="text-sm text-gray-600">Total units for this subject</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Prerequisites */}
                {subject.prerequisites && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Prerequisites</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-700">{subject.prerequisites}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Programs Using This Subject */}
                {subject.programs && subject.programs.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Programs Using This Subject
                            </CardTitle>
                            <CardDescription>
                                This subject is assigned to the following programs
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {subject.programs.map((program) => (
                                    <div key={program.id} className="flex items-center justify-between p-3 border rounded-lg">
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
                        </CardContent>
                    </Card>
                )}

                {/* Subject Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{subject.programs?.length || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                Programs using this subject
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Credit Units</CardTitle>
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{subject.units}</div>
                            <p className="text-xs text-muted-foreground">
                                Units awarded
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Status</CardTitle>
                            <div className={`w-3 h-3 rounded-full ${subject.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold capitalize">{subject.status}</div>
                            <p className="text-xs text-muted-foreground">
                                Subject availability
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    )
}