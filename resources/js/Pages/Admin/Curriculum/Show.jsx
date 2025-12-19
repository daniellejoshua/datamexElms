import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, BookOpen, Clock, Users } from 'lucide-react';
import { Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Show({ curriculum, subjectsByYearSemester, totalSubjects, totalUnits }) {

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href={route('admin.curriculum.index')}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Curriculum
                            </Button>
                        </Link>
                        <div>
                            <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                                {curriculum.curriculum_name}
                            </h2>
                            <p className="text-sm text-gray-600">
                                {curriculum.curriculum_code} • Created {new Date(curriculum.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <Badge variant={curriculum.status === 'active' ? 'default' : 'secondary'}>
                        {curriculum.status}
                    </Badge>
                </div>
            }
        >
            <Head title={`${curriculum.curriculum_name} - Curriculum Details`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Curriculum Overview */}
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Curriculum Overview
                            </CardTitle>
                            <CardDescription>
                                Program: {curriculum.program.program_name} ({curriculum.program.program_code})
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="flex items-center gap-3">
                                    <BookOpen className="w-8 h-8 text-blue-600" />
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">{totalSubjects}</p>
                                        <p className="text-sm text-gray-600">Total Subjects</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="w-8 h-8 text-green-600" />
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">{totalUnits}</p>
                                        <p className="text-sm text-gray-600">Total Units</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Users className="w-8 h-8 text-purple-600" />
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">{curriculum.program.total_years}</p>
                                        <p className="text-sm text-gray-600">Years</p>
                                    </div>
                                </div>
                            </div>
                            {curriculum.description && (
                                <div className="mt-6">
                                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                                    <p className="text-gray-600">{curriculum.description}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Subjects by Year and Semester */}
                    <div className="space-y-6">
                        {Object.entries(subjectsByYearSemester).map(([yearSemester, subjects]) => (
                            <Card key={yearSemester}>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <BookOpen className="w-5 h-5" />
                                            {yearSemester}
                                        </span>
                                        <Badge variant="outline">
                                            {subjects.length} subjects • {subjects.reduce((sum, subject) => sum + parseFloat(subject.units), 0)} units
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {subjects.map((subject) => (
                                            <div key={subject.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <div>
                                                            <h4 className="font-medium text-gray-900">
                                                                {subject.subject_code} - {subject.subject_name}
                                                            </h4>
                                                            <p className="text-sm text-gray-600">
                                                                {subject.subject_type} • {subject.units} units
                                                                {subject.is_lab && <span className="ml-2 text-blue-600">(Lab)</span>}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Badge variant={subject.status === 'active' ? 'default' : 'secondary'}>
                                                        {subject.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {Object.keys(subjectsByYearSemester).length === 0 && (
                            <Card>
                                <CardContent className="py-12">
                                    <div className="text-center">
                                        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No subjects found</h3>
                                        <p className="text-gray-500">This curriculum doesn't have any subjects yet.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}