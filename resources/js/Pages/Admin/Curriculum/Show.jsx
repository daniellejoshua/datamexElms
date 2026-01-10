import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, BookOpen, Clock, Users, GraduationCap, Target, Edit, Calendar, Star } from 'lucide-react';
import { Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';

export default function Show({ curriculum, subjectsByYearSemester, totalSubjects, totalUnits, totalMajors, totalMinors }) {
    const [isOpen, setIsOpen] = useState(true);

    const handleClose = () => {
        setIsOpen(false);
        router.visit(route('admin.curriculum.index'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between px-2 py-1">
                    <div className="flex items-center gap-2">
                        <Button asChild variant="ghost" size="sm" className="mr-2">
                            <Link href={route('admin.curriculum.index')}>
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Back To Curriculum
                            </Link>
                        </Button>
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

            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            {curriculum.curriculum_name}
                        </DialogTitle>
                        <DialogDescription>
                            {curriculum.curriculum_code} • {curriculum.program.program_name}
                        </DialogDescription>
                    </DialogHeader>

            <div className="space-y-6">
                {/* Curriculum Info Banner */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-blue-900">
                                    {curriculum.curriculum_name}
                                </h3>
                                <p className="text-sm text-blue-700 font-medium">
                                    {curriculum.curriculum_code} • {curriculum.program.program_name}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {(curriculum.is_current === 1 || curriculum.is_current === true || curriculum.is_current === '1') && (
                                <Badge className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white px-3 py-1.5 text-xs font-bold shadow-md border-0">
                                    <Star className="w-3 h-3 fill-white" />
                                    Current
                                </Badge>
                            )}
                            <Badge className={curriculum.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-300 font-semibold' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 font-semibold'}>
                                {curriculum.status}
                            </Badge>
                            <Badge className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 font-medium">
                                {curriculum.program.education_level.toUpperCase()}
                            </Badge>
                            <Badge className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 font-medium">
                                {curriculum.program.total_years} Years
                            </Badge>
                        </div>
                    </div>
                    {curriculum.description && (
                        <p className="text-sm text-gray-700 mt-3 leading-relaxed">
                            {curriculum.description}
                        </p>
                    )}
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <BookOpen className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                            <div className="text-xs text-gray-600">Total Subjects</div>
                            <div className="text-2xl font-bold text-gray-900">{totalSubjects}</div>
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <Clock className="w-6 h-6 text-green-600 mx-auto mb-2" />
                            <div className="text-xs text-gray-600">Total Units</div>
                            <div className="text-2xl font-bold text-gray-900">{totalUnits}</div>
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <GraduationCap className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                            <div className="text-xs text-gray-600">Major Subjects</div>
                            <div className="text-2xl font-bold text-gray-900">{totalMajors}</div>
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <Target className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                            <div className="text-xs text-gray-600">Minor Subjects</div>
                            <div className="text-2xl font-bold text-gray-900">{totalMinors}</div>
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <Calendar className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                            <div className="text-xs text-gray-600">Created</div>
                            <div className="text-sm font-bold text-gray-900">
                                {new Date(curriculum.created_at).toLocaleDateString()}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Subjects by Year and Semester */}
                <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Subjects by Year and Semester</h4>
                    
                    {(() => {
                        // Group subjects by year and semester
                        const groupedSubjects = {};
                        Object.entries(subjectsByYearSemester).forEach(([yearSemester, subjects]) => {
                            const [yearPart, semesterPart] = yearSemester.split(' - ');
                            const yearNum = yearPart.split(' ')[1]; // "Year 1" -> "1"
                            const semester = semesterPart; // "1st Semester" or "2nd Semester"
                            if (!groupedSubjects[yearNum]) {
                                groupedSubjects[yearNum] = { '1st Semester': [], '2nd Semester': [] };
                            }
                            groupedSubjects[yearNum][semester] = subjects;
                        });

                        return Object.keys(groupedSubjects).sort().map(year => (
                            <div key={year} className="border rounded-lg p-4">
                                <h3 className="text-lg font-semibold mb-4 text-black">
                                    {year}{year === '1' ? 'st' : year === '2' ? 'nd' : year === '3' ? 'rd' : 'th'} Year
                                </h3>

                                <Accordion type="multiple" className="w-full">
                                    {/* First Semester */}
                                    {groupedSubjects[year]['1st Semester'].length > 0 && (
                                        <AccordionItem value={`${year}-first`}>
                                            <AccordionTrigger className="text-red-600 hover:text-red-700">
                                                <div className="flex items-center gap-2">
                                                    <span>1st Semester</span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {groupedSubjects[year]['1st Semester'].length} subjects
                                                    </Badge>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="space-y-3 pt-2">
                                                    {groupedSubjects[year]['1st Semester'].map(subject => (
                                                        <div key={subject.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                                                        <BookOpen className="w-4 h-4 text-red-600" />
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-medium text-gray-900">
                                                                            {subject.subject_code || subject.subject?.subject_code || 'N/A'}
                                                                        </span>
                                                                        <span className="text-sm text-gray-600 ml-2">
                                                                            {subject.subject_name || subject.subject?.subject_name || 'Unknown Subject'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                                <span>{subject.units} units</span>
                                                                <Badge variant="secondary" className="capitalize">
                                                                    {subject.subject_type}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    )}

                                    {/* Second Semester */}
                                    {groupedSubjects[year]['2nd Semester'].length > 0 && (
                                        <AccordionItem value={`${year}-second`}>
                                            <AccordionTrigger className="text-blue-600 hover:text-blue-700">
                                                <div className="flex items-center gap-2">
                                                    <span>2nd Semester</span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {groupedSubjects[year]['2nd Semester'].length} subjects
                                                    </Badge>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="space-y-3 pt-2">
                                                    {groupedSubjects[year]['2nd Semester'].map(subject => (
                                                        <div key={subject.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                                        <BookOpen className="w-4 h-4 text-blue-600" />
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-medium text-gray-900">
                                                                            {subject.subject_code || subject.subject?.subject_code || 'N/A'}
                                                                        </span>
                                                                        <span className="text-sm text-gray-600 ml-2">
                                                                            {subject.subject_name || subject.subject?.subject_name || 'Unknown Subject'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                                <span>{subject.units} units</span>
                                                                <Badge variant="secondary" className="capitalize">
                                                                    {subject.subject_type}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    )}
                                </Accordion>
                            </div>
                        ));
                    })()}

                    {Object.keys(subjectsByYearSemester).length === 0 && (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No subjects found</h3>
                            <p className="text-gray-500">This curriculum doesn't have any subjects yet.</p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-6 border-t">
                    <Button
                        asChild
                        variant="outline"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                        <Link href={route('admin.curriculum.edit', curriculum.id)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Curriculum
                        </Link>
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                    >
                        Close
                    </Button>
                </div>
            </div>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}