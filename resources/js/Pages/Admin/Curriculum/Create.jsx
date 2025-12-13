import { Head, Link, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FileText, AlertCircle, ChevronRight, ChevronLeft, BookOpen } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState, useEffect } from 'react';

export default function Create({ programs, subjects: initialSubjects }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [curriculumSubjects, setCurriculumSubjects] = useState([]);
    const [subjects, setSubjects] = useState(initialSubjects || []);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [subjectsError, setSubjectsError] = useState(null);
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
            setSubjectsError(null);
            fetch(route('admin.curriculum.api.subjects-for-program', { program_id: data.program_id }), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to load subjects');
                    }
                    return response.json();
                })
                .then(majorSubjects => {
                    // Combine minor subjects with major subjects for the selected program
                    const combinedSubjects = [
                        ...initialSubjects, // These are the minor subjects
                        ...majorSubjects.filter(major => major.subject_type === 'major') // Only add major subjects
                    ];
                    setSubjects(combinedSubjects);
                    setLoadingSubjects(false);
                })
                .catch(error => {
                    console.error('Error loading subjects:', error);
                    setSubjectsError('Failed to load major subjects for the selected program.');
                    setLoadingSubjects(false);
                });
        } else if (currentStep === 2) {
            // If no program selected but in step 2, show only minor subjects
            setSubjects(initialSubjects);
            setSubjectsError(null);
        }
    }, [data.program_id, currentStep, initialSubjects]);

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
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="secondary" className="font-mono text-xs">
                                                                {program.program_code}
                                                            </Badge>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium">{program.program_name}</span>
                                                                
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.program_id && <p className="text-red-500 text-sm mt-1">{errors.program_id}</p>}
                                    </div>

                                    {/* Selected Program Summary */}
                                    {data.program_id && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                <span className="text-sm font-medium text-blue-900">Selected Program</span>
                                            </div>
                                            {(() => {
                                                const selectedProgram = programs.find(p => p.id.toString() === data.program_id);
                                                return selectedProgram ? (
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="font-mono text-xs">
                                                            {selectedProgram.program_code}
                                                        </Badge>
                                                        <span className="text-sm text-blue-800">{selectedProgram.program_name}</span>
                                                        <span className="text-xs text-blue-600">
                                                            ({selectedProgram.education_level === 'college' ? 'College' : 'Senior High'}
                                                            {selectedProgram.track && ` • ${selectedProgram.track}`})
                                                        </span>
                                                    </div>
                                                ) : null;
                                            })()}
                                        </div>
                                    )}

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
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="w-5 h-5" />
                                            Curriculum Structure
                                        </CardTitle>
                                        <CardDescription>
                                            Drag subjects from the right panel into the appropriate year and semester slots. Each slot represents a semester in the curriculum.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-6">
                                            {years.map(year => (
                                                <div key={year} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                            <span className="text-sm font-semibold text-blue-700">{year}</span>
                                                        </div>
                                                        <h3 className="font-semibold text-gray-800">Year {year}</h3>
                                                        <div className="flex-1 h-px bg-gray-300"></div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {semesters.map(semester => (
                                                            <div
                                                                key={`${year}-${semester}`}
                                                                className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[200px] bg-white hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                                                                onDrop={(e) => handleDrop(e, year, semester)}
                                                                onDragOver={handleDragOver}
                                                            >
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <h4 className="font-medium text-gray-700 capitalize flex items-center gap-2">
                                                                        <div className={`w-3 h-3 rounded-full ${semester === 'first' ? 'bg-green-400' : 'bg-orange-400'}`}></div>
                                                                        {semester} Semester
                                                                    </h4>
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {curriculumSubjects.filter(cs => cs.year_level === year && cs.semester === semester).length} subjects
                                                                    </Badge>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    {curriculumSubjects
                                                                        .filter(cs => cs.year_level === year && cs.semester === semester)
                                                                        .map((cs, index) => {
                                                                            const subject = subjects.find(s => s.id === cs.subject_id);
                                                                            return (
                                                                                <div key={index} className={`p-2 rounded flex justify-between items-center border ${
                                                                                    subject?.subject_type === 'major' 
                                                                                        ? 'bg-blue-100 border-blue-200' 
                                                                                        : 'bg-green-100 border-green-200'
                                                                                }`}>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Badge className={`text-xs ${
                                                                                            subject?.subject_type === 'major'
                                                                                                ? 'bg-blue-200 text-blue-800'
                                                                                                : 'bg-green-200 text-green-800'
                                                                                        }`}>
                                                                                            {subject?.subject_type === 'major' ? 'Major' : 'Minor'}
                                                                                        </Badge>
                                                                                        <span className="text-sm font-medium">{subject?.subject_code}</span>
                                                                                        <span className="text-sm text-gray-600">-</span>
                                                                                        <span className="text-sm">{subject?.subject_name}</span>
                                                                                    </div>
                                                                                    <Button size="sm" variant="ghost" onClick={() => removeSubject(curriculumSubjects.indexOf(cs))} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                                                                        ×
                                                                                    </Button>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    {curriculumSubjects.filter(cs => cs.year_level === year && cs.semester === semester).length === 0 && (
                                                                        <div className="text-center py-8 text-gray-400">
                                                                            <div className="text-sm">Drop subjects here</div>
                                                                            <div className="text-xs mt-1">Drag from the right panel</div>
                                                                        </div>
                                                                    )}
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
                                        <CardTitle className="flex items-center gap-2">
                                            <BookOpen className="w-5 h-5" />
                                            Available Subjects
                                        </CardTitle>
                                        <CardDescription>
                                            Drag subjects into the curriculum structure. Minor subjects are always available, major subjects depend on the selected program.
                                        </CardDescription>

                                        {/* Program and Subjects Summary */}
                                        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                                <span className="text-sm font-medium text-gray-900">Program & Subjects Summary</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-600">Selected Program:</span>
                                                    <div className="font-medium">
                                                        {(() => {
                                                            const selectedProgram = programs.find(p => p.id.toString() === data.program_id);
                                                            return selectedProgram ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="secondary" className="font-mono text-xs">
                                                                        {selectedProgram.program_code}
                                                                    </Badge>
                                                                    <span>{selectedProgram.program_name}</span>
                                                                </div>
                                                            ) : <span className="text-gray-500">None selected</span>;
                                                        })()}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Subjects Loaded:</span>
                                                    <div className="font-medium">
                                                        {loadingSubjects ? (
                                                            <span className="text-blue-600">Loading...</span>
                                                        ) : subjectsError ? (
                                                            <span className="text-red-600">Error loading</span>
                                                        ) : (
                                                            <div className="flex gap-2">
                                                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                                                    {subjects.filter(s => s.subject_type === 'minor').length} Minor
                                                                </Badge>
                                                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                                                    {subjects.filter(s => s.subject_type === 'major').length} Major
                                                                </Badge>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4 max-h-[600px] overflow-y-auto">
                                            {loadingSubjects ? (
                                                <div className="text-center py-8">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                                    <div className="text-sm text-gray-500">Loading major subjects...</div>
                                                </div>
                                            ) : subjectsError ? (
                                                <div className="text-center py-8">
                                                    <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-4" />
                                                    <div className="text-sm text-red-600">{subjectsError}</div>
                                                </div>
                                            ) : subjects.length === 0 ? (
                                                <div className="text-center py-8">
                                                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                                    <div className="text-sm text-gray-500">
                                                        No subjects available. Minor subjects should always be shown.
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Minor Subjects Section */}
                                                    {subjects.filter(s => s.subject_type === 'minor').length > 0 && (
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                                <h4 className="font-semibold text-green-700">Minor Subjects</h4>
                                                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                                                    {subjects.filter(s => s.subject_type === 'minor').length}
                                                                </Badge>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {subjects.filter(s => s.subject_type === 'minor').map(subject => (
                                                                    <div
                                                                        key={subject.id}
                                                                        draggable
                                                                        onDragStart={(e) => handleDragStart(e, subject)}
                                                                        className="bg-green-50 border border-green-200 p-3 rounded-lg cursor-move hover:bg-green-100 hover:border-green-300 transition-all duration-200 hover:shadow-md group"
                                                                    >
                                                                        <div className="flex items-start justify-between">
                                                                            <div className="flex-1">
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <span className="font-mono font-semibold text-green-800">{subject.subject_code}</span>
                                                                                    <Badge className="text-xs bg-green-100 text-green-800 border-green-300">
                                                                                        Minor
                                                                                    </Badge>
                                                                                </div>
                                                                                <div className="text-sm text-gray-700 font-medium">{subject.subject_name}</div>
                                                                                <div className="text-xs text-gray-600 mt-1">
                                                                                    {subject.units} units • General Education
                                                                                </div>
                                                                            </div>
                                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center">
                                                                                    <span className="text-xs text-green-700">↗</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Major Subjects Section */}
                                                    {subjects.filter(s => s.subject_type === 'major').length > 0 && (
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                                <h4 className="font-semibold text-blue-700">Major Subjects</h4>
                                                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                                                    {subjects.filter(s => s.subject_type === 'major').length}
                                                                </Badge>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {subjects.filter(s => s.subject_type === 'major').map(subject => (
                                                                    <div
                                                                        key={subject.id}
                                                                        draggable
                                                                        onDragStart={(e) => handleDragStart(e, subject)}
                                                                        className="bg-blue-50 border border-blue-200 p-3 rounded-lg cursor-move hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 hover:shadow-md group"
                                                                    >
                                                                        <div className="flex items-start justify-between">
                                                                            <div className="flex-1">
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <span className="font-mono font-semibold text-blue-800">{subject.subject_code}</span>
                                                                                    <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                                                                                        Major
                                                                                    </Badge>
                                                                                </div>
                                                                                <div className="text-sm text-gray-700 font-medium">{subject.subject_name}</div>
                                                                                <div className="text-xs text-gray-600 mt-1">
                                                                                    {subject.units} units • Program Specific
                                                                                </div>
                                                                            </div>
                                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center">
                                                                                    <span className="text-xs text-blue-700">↗</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
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