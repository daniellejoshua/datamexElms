import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Link as LinkIcon, FileText, BookOpen, Clock, Users } from 'lucide-react';
import { Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Show({ programCurriculum }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href={route('admin.program-curricula.index')}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Program Curriculum Mapping
                            </Button>
                        </Link>
                        <div>
                            <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                                {programCurriculum.program.program_name} - {programCurriculum.academic_year}
                            </h2>
                            <p className="text-sm text-gray-600">
                                Curriculum: {programCurriculum.curriculum.curriculum_name}
                            </p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`${programCurriculum.program.program_name} - Program Curriculum Mapping`} />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    {/* Mapping Overview */}
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <LinkIcon className="w-5 h-5" />
                                Program Curriculum Mapping
                            </CardTitle>
                            <CardDescription>
                                Academic Year: {programCurriculum.academic_year}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Program Information</h4>
                                    <div className="space-y-2">
                                        <p className="text-sm">
                                            <span className="font-medium">Name:</span> {programCurriculum.program.program_name}
                                        </p>
                                        <p className="text-sm">
                                            <span className="font-medium">Code:</span> {programCurriculum.program.program_code}
                                        </p>
                                        <p className="text-sm">
                                            <span className="font-medium">Education Level:</span> {programCurriculum.program.education_lvl}
                                        </p>
                                        <p className="text-sm">
                                            <span className="font-medium">Track:</span> {programCurriculum.program.track}
                                        </p>
                                        <p className="text-sm">
                                            <span className="font-medium">Total Years:</span> {programCurriculum.program.total_years}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Curriculum Information</h4>
                                    <div className="space-y-2">
                                        <p className="text-sm">
                                            <span className="font-medium">Name:</span> {programCurriculum.curriculum.curriculum_name}
                                        </p>
                                        <p className="text-sm">
                                            <span className="font-medium">Code:</span> {programCurriculum.curriculum.curriculum_code}
                                        </p>
                                        <p className="text-sm">
                                            <span className="font-medium">Academic Year:</span> {programCurriculum.curriculum.academic_year}
                                        </p>
                                        <p className="text-sm">
                                            <span className="font-medium">Status:</span>
                                            <Badge variant={programCurriculum.curriculum.status === 'active' ? 'default' : 'secondary'} className="ml-2">
                                                {programCurriculum.curriculum.status}
                                            </Badge>
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {programCurriculum.curriculum.description && (
                                <div className="mt-6">
                                    <h4 className="font-medium text-gray-900 mb-2">Curriculum Description</h4>
                                    <p className="text-gray-600">{programCurriculum.curriculum.description}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Curriculum Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Curriculum Details
                            </CardTitle>
                            <CardDescription>
                                View the complete curriculum that students in this program will follow
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8">
                                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Curriculum Details</h3>
                                <p className="text-gray-500 mb-4">
                                    To view the complete subject breakdown and curriculum structure, visit the curriculum details page.
                                </p>
                                <Link href={route('admin.curriculum.show', programCurriculum.curriculum.id)}>
                                    <Button>
                                        <BookOpen className="w-4 h-4 mr-2" />
                                        View Curriculum Details
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}