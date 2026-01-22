import { Head, Link, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, FileText, AlertCircle, ChevronRight, ChevronLeft, BookOpen, Plus, Search } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState, useEffect } from 'react';

export default function Create({ programs, subjects: initialSubjects }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [curriculumSubjects, setCurriculumSubjects] = useState([]);
    const [subjects, setSubjects] = useState(initialSubjects || []);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [subjectsError, setSubjectsError] = useState(null);
    const [subjectModalOpen, setSubjectModalOpen] = useState(false);
    const [selectedSemester, setSelectedSemester] = useState(null);
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
    const [subjectSearch, setSubjectSearch] = useState('');

    const { data, setData, post, processing, errors } = useForm({
        program_id: '',
        curriculum_code: '',
        curriculum_name: '',
        description: '',
        status: 'active',
        curriculum_subjects: [],
    });

    // Constants
    const semesters = ['1st', '2nd'];
    const selectedProgram = programs?.find(p => p.id.toString() === data.program_id);
    const years = selectedProgram ? Array.from({ length: selectedProgram.total_years }, (_, i) => i + 1) : [];

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
                    // Filter minor subjects based on program's education level
                    let filteredMinorSubjects = initialSubjects;
                    if (selectedProgram) {
                        if (selectedProgram.education_level === 'senior_high') {
                            // For senior high programs, only show senior high minor subjects
                            filteredMinorSubjects = initialSubjects.filter(subject =>
                                subject.education_level === 'senior_high'
                            );
                        } else if (selectedProgram.education_level === 'college') {
                            // For college programs, only show college minor subjects
                            filteredMinorSubjects = initialSubjects.filter(subject =>
                                subject.education_level === 'college'
                            );
                        }
                        // For other education levels, show all minor subjects as fallback
                    }

                    // Combine filtered minor subjects with major subjects for the selected program
                    const combinedSubjects = [
                        ...filteredMinorSubjects,
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

    const openSubjectModal = (year, semester) => {
        setSelectedYear(year);
        setSelectedSemester(semester);
        // Get currently selected subjects for this semester
        const currentSubjectIds = curriculumSubjects
            .filter(cs => cs.year_level === year && cs.semester === semester)
            .map(cs => cs.subject_id);
        setSelectedSubjectIds(currentSubjectIds);
        setSubjectSearch(''); // Clear search when opening modal
        setSubjectModalOpen(true);
    };

    const handleSubjectSelection = (subjectId, checked) => {
        if (checked) {
            setSelectedSubjectIds(prev => [...prev, subjectId]);
        } else {
            setSelectedSubjectIds(prev => prev.filter(id => id !== subjectId));
        }
    };

    const saveSubjectSelection = () => {
        // Remove existing subjects for this semester/year
        setCurriculumSubjects(prev => prev.filter(cs => 
            !(cs.year_level === selectedYear && cs.semester === selectedSemester)
        ));

        // Add selected subjects
        const newSubjects = selectedSubjectIds.map(subjectId => ({
            subject_id: subjectId,
            year_level: selectedYear,
            semester: selectedSemester,
        }));

        setCurriculumSubjects(prev => [...prev, ...newSubjects]);
        setSubjectModalOpen(false);
        setSelectedSubjectIds([]);
    };

    const removeSubject = (index) => {
        setCurriculumSubjects(prev => prev.filter((_, i) => i !== index));
    };

    const filteredSubjects = subjects.filter(subject => {
        // Check if subject is already assigned to a different semester/year
        const isAlreadyAssigned = curriculumSubjects.some(cs => 
            cs.subject_id === subject.id && 
            !(cs.year_level === selectedYear && cs.semester === selectedSemester)
        );
        
        // Include subject if it matches search and is not already assigned to another semester
        return (subject.subject_name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
                subject.subject_code.toLowerCase().includes(subjectSearch.toLowerCase())) &&
               !isAlreadyAssigned;
    });

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm">
                            <Link href={route('admin.curriculum.index')} className="flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Back to Curriculum</span>
                            </Link>
                        </Button>
                        <div className="hidden md:block h-6 w-px bg-gray-300"></div>
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-100 p-1.5 rounded-md">
                                <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Create New Curriculum</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Step {currentStep} of 2 - {currentStep === 1 ? 'Basic Information' : 'Subject Selection'}</p>
                            </div>
                        </div>
                    </div>
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
                        <div className="grid grid-cols-1 gap-6">
                            {/* Left Side: Year/Semester Grid */}
                            <div className="lg:col-span-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="w-5 h-5" />
                                            Curriculum Structure
                                        </CardTitle>
                                        <CardDescription>
                                            Click on semester slots to add subjects. Each slot represents a semester in the curriculum.
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
                                                                className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[200px] bg-white hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 cursor-pointer"
                                                                onClick={() => openSubjectModal(year, semester)}
                                                            >
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <h4 className="font-medium text-gray-700 capitalize flex items-center gap-2">
                                                                        <div className={`w-3 h-3 rounded-full ${semester === '1st' ? 'bg-green-400' : 'bg-orange-400'}`}></div>
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
                                                                            <Plus className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                                                            <div className="text-sm">Click to add subjects</div>
                                                                            <div className="text-xs mt-1">Select subjects for this semester</div>
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
                        </div>
                    )}

                    {currentStep === 2 && (
                        <>
                            {errors.curriculum_subjects && (
                                <Alert className="mb-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        {errors.curriculum_subjects}
                                    </AlertDescription>
                                </Alert>
                            )}
                            <div className="flex justify-between mt-6">
                                <Button variant="outline" onClick={prevStep}>
                                    <ChevronLeft className="w-4 h-4 mr-2" />
                                    Previous Step
                                </Button>
                                <Button onClick={submit} disabled={processing}>
                                    Create Curriculum
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Subject Selection Modal */}
            <Dialog open={subjectModalOpen} onOpenChange={setSubjectModalOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                            <span>
                                Select Subjects for <Badge variant="secondary" className="font-semibold">Year {selectedYear}</Badge> - <Badge variant="outline" className="font-semibold">{selectedSemester} Semester</Badge>
                            </span>
                        </DialogTitle>
                        <DialogDescription>
                            Choose subjects to assign to this semester. Each subject can only be assigned to one semester.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Search subjects by name or code..."
                                value={subjectSearch}
                                onChange={(e) => setSubjectSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        {/* Minor Subjects */}
                        {filteredSubjects.filter(s => s.subject_type === 'minor').length > 0 ? (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <h4 className="font-semibold text-green-700">Minor Subjects</h4>
                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                        {filteredSubjects.filter(s => s.subject_type === 'minor').length}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                                    {filteredSubjects.filter(s => s.subject_type === 'minor').map(subject => (
                                        <div key={subject.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                            <Checkbox
                                                id={`minor-${subject.id}`}
                                                checked={selectedSubjectIds.includes(subject.id)}
                                                onCheckedChange={(checked) => handleSubjectSelection(subject.id, checked)}
                                            />
                                            <label htmlFor={`minor-${subject.id}`} className="flex-1 cursor-pointer">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-semibold text-green-800">{subject.subject_code}</span>
                                                    <Badge className="text-xs bg-green-100 text-green-800 border-green-300">
                                                        Minor
                                                    </Badge>
                                                </div>
                                                <div className="text-sm text-gray-700 font-medium">{subject.subject_name}</div>
                                                <div className="text-xs text-gray-600">
                                                    {subject.units} units • General Education
                                                </div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <h4 className="font-semibold text-green-700">Minor Subjects</h4>
                                </div>
                                <div className="text-center py-8 text-gray-500">
                                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p className="text-sm">No minor subjects available for this program</p>
                                </div>
                            </div>
                        )}

                        {/* Major Subjects */}
                        {filteredSubjects.filter(s => s.subject_type === 'major').length > 0 ? (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <h4 className="font-semibold text-blue-700">Major Subjects</h4>
                                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                        {filteredSubjects.filter(s => s.subject_type === 'major').length}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                                    {filteredSubjects.filter(s => s.subject_type === 'major').map(subject => (
                                        <div key={subject.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                            <Checkbox
                                                id={`major-${subject.id}`}
                                                checked={selectedSubjectIds.includes(subject.id)}
                                                onCheckedChange={(checked) => handleSubjectSelection(subject.id, checked)}
                                            />
                                            <label htmlFor={`major-${subject.id}`} className="flex-1 cursor-pointer">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-semibold text-blue-800">{subject.subject_code}</span>
                                                    <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                                                        Major
                                                    </Badge>
                                                </div>
                                                <div className="text-sm text-gray-700 font-medium">{subject.subject_name}</div>
                                                <div className="text-xs text-gray-600">
                                                    {subject.units} units • Program Specific
                                                </div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <h4 className="font-semibold text-blue-700">Major Subjects</h4>
                                </div>
                                <div className="text-center py-8 text-gray-500">
                                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p className="text-sm">No major subjects available for this program</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="outline" onClick={() => setSubjectModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={saveSubjectSelection}>
                            Save Selection ({selectedSubjectIds.length} subjects)
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}