import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, BookOpen, Clock, Users, GraduationCap, Target } from 'lucide-react';
import { Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function Show({ curriculum, subjectsByYearSemester, totalSubjects, totalUnits, totalMajors, totalMinors }) {

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="sm">
                        <Link href={route('admin.curriculum.index')} className="flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Curriculum
                        </Link>
                    </Button>
                    <div className="h-6 w-px bg-gray-300"></div>
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-1.5 rounded-md">
                            <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">{curriculum.curriculum_name}</h2>
                            <p className="text-xs text-gray-500 mt-0.5">{curriculum.curriculum_code} • {curriculum.program.program_name}</p>
                        </div>
                    </div>
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
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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
                                    <GraduationCap className="w-8 h-8 text-purple-600" />
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">{totalMajors}</p>
                                        <p className="text-sm text-gray-600">Major Subjects</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Target className="w-8 h-8 text-orange-600" />
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900">{totalMinors}</p>
                                        <p className="text-sm text-gray-600">Minor Subjects</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Users className="w-8 h-8 text-indigo-600" />
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

                    {/* Subjects by Year and Semester - Accordion */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5" />
                                Curriculum Subjects
                            </CardTitle>
                            <CardDescription>
                                Organized by year level and semester
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="multiple" className="w-full">
                                {Object.entries(subjectsByYearSemester).map(([yearSemester, subjects], index) => (
                                    <AccordionItem key={yearSemester} value={`item-${index}`} className="border border-gray-200 rounded-lg mb-3 px-6 bg-white">
                                        <AccordionTrigger className="hover:no-underline">
                                            <div className="flex items-center gap-4 text-left">
                                                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                                                    <BookOpen className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-gray-900 text-base truncate">
                                                        {yearSemester}
                                                    </h4>
                                                    <p className="text-sm text-gray-600 truncate">
                                                        {subjects.length} subjects • {subjects.reduce((sum, subject) => sum + parseFloat(subject.units), 0)} units
                                                    </p>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="pt-4">
                                                <div className="space-y-3">
                                                    {subjects.map((subject) => (
                                                        <div key={subject.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
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
                                                                <Badge className={subject.status === 'active' ? 'bg-white text-green-700 border border-green-500' : 'bg-gray-100 text-gray-700 border border-gray-300'}>
                                                                    {subject.status}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>

                            {Object.keys(subjectsByYearSemester).length === 0 && (
                                <div className="text-center py-12">
                                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No subjects found</h3>
                                    <p className="text-gray-500">This curriculum doesn't have any subjects yet.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}