import { Head, Link, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FileText, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState, useEffect } from 'react';

export default function Create({ programs, subjects: initialSubjects }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [curriculumSubjects, setCurriculumSubjects] = useState([]);
    const [subjects, setSubjects] = useState(initialSubjects || []);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        program_id: '',
        curriculum_code: '',
        curriculum_name: '',
        academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        description: '',
        status: 'active',
        curriculum_subjects: [],
    });

    // Load subjects when program is selected
    useEffect(() => {
        if (data.program_id && currentStep === 2) {
            setLoadingSubjects(true);
            fetch(route('admin.curriculum.subjects-for-program', { program_id: data.program_id }))
                .then(response => response.json())
                .then(data => {
                    setSubjects(data);
                    setLoadingSubjects(false);
                })
                .catch(error => {
                    console.error('Error loading subjects:', error);
                    setLoadingSubjects(false);
                });
        }
    }, [data.program_id, currentStep]);

    const nextStep = () => {
        if (currentStep === 1) {
            // Validate step 1
            if (!data.program_id || !data.curriculum_code || !data.curriculum_name) {
                return;
            }
            setCurrentStep(2);
        }
    };

    const prevStep = () => {
        if (currentStep === 2) {
            setCurrentStep(1);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        data.curriculum_subjects = curriculumSubjects;
        post(route('admin.curriculum.store'));
    };

    const handleDragStart = (e, subject) => {
        e.dataTransfer.setData('subject', JSON.stringify(subject));
    };

    const handleDrop = (e, year, semester) => {
        e.preventDefault();
        const subject = JSON.parse(e.dataTransfer.getData('subject'));
        setCurriculumSubjects(prev => [...prev, {
            subject_id: subject.id,
            year_level: year,
            semester: semester,
        }]);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const removeSubject = (index) => {
        setCurriculumSubjects(prev => prev.filter((_, i) => i !== index));
    };

    const selectedProgram = programs.find(p => p.id === parseInt(data.program_id));
    const years = selectedProgram ? Array.from({ length: selectedProgram.total_years }, (_, i) => i + 1) : [];
    const semesters = ['first', 'second'];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href={route('admin.curriculum.index')}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Curriculum
                        </Button>
                    </Link>
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Create New Curriculum - Step {currentStep} of 2
                    </h2>
                </div>
            }
        >
            <Head title="Create Curriculum" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {currentStep === 1 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Basic Information
                                </CardTitle>
                                <CardDescription>
                                    Enter the basic details for the new curriculum.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <Label htmlFor="program_id">Program *</Label>
                                        <Select value={data.program_id} onValueChange={(value) => setData('program_id', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Program" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {programs.map(program => (
                                                    <SelectItem key={program.id} value={program.id.toString()}>
                                                        {program.program_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.program_id && <p className="text-red-500 text-sm mt-1">{errors.program_id}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="curriculum_code">Curriculum Code *</Label>
                                        <Input
                                            id="curriculum_code"
                                            value={data.curriculum_code}
                                            onChange={e => setData('curriculum_code', e.target.value)}
                                            placeholder="e.g., BSCS-2025"
                                        />
                                        {errors.curriculum_code && <p className="text-red-500 text-sm mt-1">{errors.curriculum_code}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="curriculum_name">Curriculum Name *</Label>
                                        <Input
                                            id="curriculum_name"
                                            value={data.curriculum_name}
                                            onChange={e => setData('curriculum_name', e.target.value)}
                                            placeholder="e.g., Bachelor of Science in Computer Science"
                                        />
                                        {errors.curriculum_name && <p className="text-red-500 text-sm mt-1">{errors.curriculum_name}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="academic_year">Academic Year *</Label>
                                        <Input
                                            id="academic_year"
                                            value={data.academic_year}
                                            onChange={e => setData('academic_year', e.target.value)}
                                            placeholder="e.g., 2025-2026"
                                        />
                                        {errors.academic_year && <p className="text-red-500 text-sm mt-1">{errors.academic_year}</p>}
                                    </div>

                                    <div className="md:col-span-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={e => setData('description', e.target.value)}
                                            placeholder="Optional description..."
                                            rows={3}
                                        />
                                        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="status">Status *</Label>
                                        <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status}</p>}
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={nextStep} disabled={!data.program_id || !data.curriculum_code || !data.curriculum_name}>
                                        Next Step
                                        <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {currentStep === 2 && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Side: Year/Semester Grid */}
                            <div className="lg:col-span-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Curriculum Structure</CardTitle>
                                        <CardDescription>
                                            Drag subjects from the right panel into the appropriate year and semester slots.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {years.map(year => (
                                                <div key={year} className="border rounded-lg p-4">
                                                    <h3 className="font-semibold mb-2">Year {year}</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {semesters.map(semester => (
                                                            <div
                                                                key={`${year}-${semester}`}
                                                                className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[200px]"
                                                                onDrop={(e) => handleDrop(e, year, semester)}
                                                                onDragOver={handleDragOver}
                                                            >
                                                                <h4 className="font-medium mb-2 capitalize">{semester} Semester</h4>
                                                                <div className="space-y-2">
                                                                    {curriculumSubjects
                                                                        .filter(cs => cs.year_level === year && cs.semester === semester)
                                                                        .map((cs, index) => {
                                                                            const subject = subjects.find(s => s.id === cs.subject_id);
                                                                            return (
                                                                                <div key={index} className="bg-blue-100 p-2 rounded flex justify-between items-center">
                                                                                    <span className="text-sm">{subject?.subject_code} - {subject?.subject_name}</span>
                                                                                    <Button size="sm" variant="ghost" onClick={() => removeSubject(curriculumSubjects.indexOf(cs))}>
                                                                                        ×
                                                                                    </Button>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right Side: Subjects List */}
                            <div>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Available Subjects</CardTitle>
                                        <CardDescription>
                                            Drag subjects to assign them to curriculum slots.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                            {loadingSubjects ? (
                                                <div className="text-center py-4">
                                                    <div className="text-sm text-gray-500">Loading subjects...</div>
                                                </div>
                                            ) : subjects.length === 0 ? (
                                                <div className="text-center py-4">
                                                    <div className="text-sm text-gray-500">
                                                        {data.program_id ? 'No major subjects found for this program.' : 'Please select a program first.'}
                                                    </div>
                                                </div>
                                            ) : (
                                                subjects.map(subject => (
                                                    <div
                                                        key={subject.id}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, subject)}
                                                        className="bg-gray-100 p-3 rounded cursor-move hover:bg-gray-200 transition-colors"
                                                    >
                                                        <div className="font-medium">{subject.subject_code}</div>
                                                        <div className="text-sm text-gray-600">{subject.subject_name}</div>
                                                        <div className="text-xs text-gray-500">{subject.units} units • Year {subject.year_level} • {subject.semester}</div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="flex justify-between mt-6">
                            <Button variant="outline" onClick={prevStep}>
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Previous Step
                            </Button>
                            <Button onClick={submit} disabled={processing}>
                                Create Curriculum
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}