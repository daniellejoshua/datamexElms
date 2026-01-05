import React, { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, GraduationCap, Users, Calendar, BookOpen, AlertCircle } from 'lucide-react';

const Create = ({ programs, curricula, archivedSections, currentAcademicPeriod, academicYearOptions, semesterOptions }) => {
    const { data, setData, post, processing, errors } = useForm({
        program_id: '',
        curriculum_id: '',
        section_name: '',
        year_level: 1,
        academic_year: currentAcademicPeriod?.academic_year || '',
        semester: currentAcademicPeriod?.semester || '',
        status: 'active'
    });

    const [selectedProgram, setSelectedProgram] = useState(null);
    const [selectedCurriculum, setSelectedCurriculum] = useState(null);
    const [generatedSectionName, setGeneratedSectionName] = useState('');
    const [autoSelectedCurriculum, setAutoSelectedCurriculum] = useState(null);
    const [manualCurriculumOverride, setManualCurriculumOverride] = useState(false);

    // Filter archived sections based on selected program and year level
    const filteredArchivedSections = archivedSections?.filter(section => {
        if (!selectedProgram || !data.year_level) return true; // Show all if nothing selected
        
        // Check if this archived section belongs to the same program
        // Since we store program_id in archived sections now, we can check that
        return section.program_id === selectedProgram.id;
    }) || [];

    // Determine current semester for display
    const getCurrentSemester = () => {
        if (currentAcademicPeriod?.semester === '1st') return '1st';
        if (currentAcademicPeriod?.semester === '2nd') return '2nd'; 
        return 'summer';
    };

    // Update selected program when program_id changes
    useEffect(() => {
        if (programs) {
            const program = programs.find(p => p.id.toString() === data.program_id.toString());
            setSelectedProgram(program || null);
            // Reset manual override when program changes
            setManualCurriculumOverride(false);
            setAutoSelectedCurriculum(null);
            setSelectedCurriculum(null);
            setData('curriculum_id', '');
        }
    }, [data.program_id, programs]);

    // Auto-select curriculum based on year level guide when program and year level change
    useEffect(() => {
        const autoSelectCurriculum = async () => {
            if (!selectedProgram || !data.year_level || manualCurriculumOverride) {
                // Don't auto-select if user has manually overridden
                return;
            }

            try {
                // Check if there's a year level guide for this program and year level
                const guide = selectedProgram.year_level_guides?.find(g => g.year_level === parseInt(data.year_level));
                if (guide && guide.curriculum) {
                    setAutoSelectedCurriculum(guide.curriculum);
                    setSelectedCurriculum(guide.curriculum);
                    setData('curriculum_id', guide.curriculum.id.toString());
                } else {
                    // Fallback to program's current curriculum
                    const current = selectedProgram.current_curriculum;
                    if (current) {
                        setAutoSelectedCurriculum(current);
                        setSelectedCurriculum(current);
                        setData('curriculum_id', current.id.toString());
                    } else {
                        setAutoSelectedCurriculum(null);
                        setSelectedCurriculum(null);
                        setData('curriculum_id', '');
                    }
                }
            } catch (error) {
                console.error('Error auto-selecting curriculum:', error);
                setAutoSelectedCurriculum(null);
                setSelectedCurriculum(null);
                setData('curriculum_id', '');
            }
        };

        autoSelectCurriculum();
    }, [selectedProgram, data.year_level, manualCurriculumOverride]);

    // Update selected curriculum when curriculum_id changes (for manual selection)
    useEffect(() => {
        if (curricula && data.curriculum_id && manualCurriculumOverride) {
            const curriculum = curricula.find(c => c.id.toString() === data.curriculum_id.toString());
            setSelectedCurriculum(curriculum || null);
        }
    }, [data.curriculum_id, curricula, manualCurriculumOverride]);

    // Generate section name when program and other fields change
    useEffect(() => {
        if (selectedProgram && data.section_name && data.year_level) {
            const sectionName = `${selectedProgram.program_code}-${data.year_level}${data.section_name}`;
            setGeneratedSectionName(sectionName);
        } else {
            setGeneratedSectionName('');
        }
    }, [selectedProgram, data.section_name, data.year_level]);

    const handleSectionNameChange = (value) => {
        // Only allow single letters
        const letter = value.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 1);
        setData('section_name', letter);
    };

    const handleArchivedSectionClick = (archivedSection) => {
        // Carry forward data from the archived section
        const sectionLetter = archivedSection.section_name.slice(-1); // Get the last character (should be the letter)
        
        // Pre-fill form data from archived section
        setData({
            ...data,
            program_id: archivedSection.program_id?.toString() || data.program_id,
            curriculum_id: archivedSection.curriculum_id?.toString() || data.curriculum_id,
            year_level: archivedSection.year_level || data.year_level,
            section_name: sectionLetter,
        });
        
        // Update selected program if it changed
        if (archivedSection.program_id && archivedSection.program_id !== parseInt(data.program_id)) {
            const program = programs.find(p => p.id === archivedSection.program_id);
            setSelectedProgram(program || null);
        }
        
        // Update selected curriculum if it changed
        if (archivedSection.curriculum_id && archivedSection.curriculum_id !== parseInt(data.curriculum_id)) {
            const curriculum = curricula.find(c => c.id === archivedSection.curriculum_id);
            setSelectedCurriculum(curriculum || null);
            setAutoSelectedCurriculum(curriculum || null);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.college.sections.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm">
                            <Link href="/admin/college/sections" className="flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Back to College Sections
                            </Link>
                        </Button>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Create College Section</h2>
                            <p className="text-sm text-blue-600 font-medium mt-1">Add a new college section</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Create College Section" />
            
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-2xl mx-auto">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <GraduationCap className="w-5 h-5 text-blue-600" />
                                College Section Information
                            </CardTitle>
                            <CardDescription>
                                Create a new section for college programs
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Current Academic Period Info */}
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-4 h-4 text-blue-600" />
                                        <span className="font-medium text-blue-800">Current Academic Period</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className="text-blue-700 border-blue-300 text-xs">
                                            {currentAcademicPeriod?.academic_year}
                                        </Badge>
                                        <Badge variant="outline" className="text-blue-700 border-blue-300 text-xs">
                                            {getCurrentSemester()} Semester
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-blue-600 mt-2">
                                        New sections will be created for this academic period
                                    </p>
                                </div>

                                {/* Program, Curriculum and Year Level Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Program Selection */}
                                    <div className="space-y-2">
                                        <Label htmlFor="program" className="font-medium">
                                            College Program
                                        </Label>
                                        <Select value={data.program_id} onValueChange={(value) => setData('program_id', value)}>
                                            <SelectTrigger className={`h-10 ${errors.program_id ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}>
                                                <SelectValue placeholder="Select college program">
                                                    {data.program_id && programs?.find(p => p.id.toString() === data.program_id) && (
                                                        <Badge variant="secondary" className="font-mono text-xs">
                                                            {programs.find(p => p.id.toString() === data.program_id).program_code}
                                                        </Badge>
                                                    )}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {programs?.map((program) => (
                                                    <SelectItem key={program.id} value={program.id.toString()}>
                                                        <Badge variant="secondary" className="font-mono text-xs">
                                                            {program.program_code}
                                                        </Badge>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.program_id && (
                                            <Alert variant="destructive" className="py-2">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription className="text-sm">{errors.program_id}</AlertDescription>
                                            </Alert>
                                        )}
                                    </div>

                                    {/* Curriculum Selection */}
                                    <div className="space-y-2">
                                        <Label htmlFor="curriculum" className="font-medium">
                                            Curriculum {autoSelectedCurriculum && <span className="text-green-600 text-sm">(Auto-selected)</span>}
                                        </Label>
                                        {autoSelectedCurriculum ? (
                                            <div className="space-y-2">
                                                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="font-mono text-xs">
                                                            {autoSelectedCurriculum.curriculum_code}
                                                        </Badge>
                                                        <Badge variant={autoSelectedCurriculum.is_current ? "default" : "outline"} className="text-xs">
                                                            {autoSelectedCurriculum.is_current ? "Current" : "Old"}
                                                        </Badge>
                                                        <span className="text-sm font-medium text-green-800">
                                                            {autoSelectedCurriculum.curriculum_name}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-green-600 mt-1">
                                                        Automatically selected based on year level guide
                                                    </p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setAutoSelectedCurriculum(null);
                                                        setSelectedCurriculum(null);
                                                        setData('curriculum_id', '');
                                                        setManualCurriculumOverride(true);
                                                    }}
                                                    className="w-full"
                                                >
                                                    Select Different Curriculum
                                                </Button>
                                            </div>
                                        ) : (
                                            <Select value={data.curriculum_id} onValueChange={(value) => setData('curriculum_id', value)}>
                                                <SelectTrigger className={`h-10 ${errors.curriculum_id ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}>
                                                    <SelectValue placeholder="Select curriculum">
                                                        {data.curriculum_id && curricula?.find(c => c.id.toString() === data.curriculum_id) && (
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="secondary" className="font-mono text-xs">
                                                                    {curricula.find(c => c.id.toString() === data.curriculum_id).curriculum_code}
                                                                </Badge>
                                                                <Badge variant={curricula.find(c => c.id.toString() === data.curriculum_id).is_current ? "default" : "outline"} className="text-xs">
                                                                    {curricula.find(c => c.id.toString() === data.curriculum_id).is_current ? "Current" : "Old"}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {curricula?.filter(curriculum => !data.program_id || curriculum.program_id.toString() === data.program_id.toString()).map((curriculum) => (
                                                        <SelectItem key={curriculum.id} value={curriculum.id.toString()}>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="secondary" className="font-mono text-xs">
                                                                    {curriculum.curriculum_code}
                                                                </Badge>
                                                                {curriculum.is_current && (
                                                                    <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700">
                                                                        Current
                                                                    </Badge>
                                                                )}
                                                                {!curriculum.is_current && (
                                                                    <Badge variant="outline" className="text-xs">
                                                                        Old
                                                                    </Badge>
                                                                )}
                                                                <span className="text-sm">{curriculum.curriculum_name}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                        {errors.curriculum_id && (
                                            <Alert variant="destructive" className="py-2">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription className="text-sm">{errors.curriculum_id}</AlertDescription>
                                            </Alert>
                                        )}
                                    </div>

                                    {/* Year Level */}
                                    <div className="space-y-2">
                                        <Label htmlFor="year_level" className="font-medium">
                                            Year Level
                                        </Label>
                                        <Select value={data.year_level.toString()} onValueChange={(value) => setData('year_level', parseInt(value))}>
                                            <SelectTrigger className={`h-10 ${errors.year_level ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">1st Year</SelectItem>
                                                <SelectItem value="2">2nd Year</SelectItem>
                                                <SelectItem value="3">3rd Year</SelectItem>
                                                <SelectItem value="4">4th Year</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.year_level && (
                                            <Alert variant="destructive" className="py-2">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription className="text-sm">{errors.year_level}</AlertDescription>
                                            </Alert>
                                        )}
                                    </div>
                                </div>

                                {/* Section Identifier */}
                                <div className="space-y-2">
                                    <Label htmlFor="section_name" className="font-medium">Section Identifier</Label>
                                    <div className="flex gap-4 items-start">
                                        <Input
                                            id="section_name"
                                            type="text"
                                            value={data.section_name}
                                            onChange={(e) => handleSectionNameChange(e.target.value)}
                                            className={`w-16 h-12 text-center text-xl font-bold ${errors.section_name ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                                            placeholder="A"
                                            maxLength={1}
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-600 mb-2">
                                                Single letter (A, B, C, etc.)
                                            </p>
                                            {generatedSectionName && (
                                                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                                                    <p className="text-sm text-green-800 mb-1">Preview:</p>
                                                    <span className="text-lg font-mono font-bold text-green-900">
                                                        {generatedSectionName}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {errors.section_name && (
                                        <Alert variant="destructive" className="py-2">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription className="text-sm">{errors.section_name}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                {/* Status */}
                                <div className="space-y-2">
                                    <Label className="font-medium">Status</Label>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-sm font-medium">Active</span>
                                    </div>
                                </div>

                                {/* Submit Buttons */}
                                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                                    <Button asChild variant="outline">
                                        <Link href="/admin/college/sections">
                                            Cancel
                                        </Link>
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={processing}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        {processing ? 'Creating...' : 'Create College Section'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Archived Sections Reference */}
                {filteredArchivedSections && filteredArchivedSections.length > 0 && (
                    <div className="max-w-4xl mx-auto mt-8">
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <BookOpen className="w-5 h-5 text-amber-600" />
                                    Previous Sections Reference
                                </CardTitle>
                                <CardDescription>
                                    Historical section data from the most recently archived semester for reference when creating new sections. Click on any section to carry forward its program, year level, and section name.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredArchivedSections.slice(0, 12).map((archivedSection) => (
                                        <div 
                                            key={archivedSection.id} 
                                            className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
                                            onClick={() => handleArchivedSectionClick(archivedSection)}
                                            title="Click to use this section name"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-medium text-gray-900">{archivedSection.section_name}</h4>
                                                <Badge variant="outline" className="text-xs">
                                                    {archivedSection.academic_year} {archivedSection.semester}
                                                </Badge>
                                            </div>
                                            <div className="space-y-1 text-sm text-gray-600">
                                                <div className="flex justify-between">
                                                    <span>Enrolled:</span>
                                                    <span className="font-medium">{archivedSection.total_enrolled_students || 0}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Completed:</span>
                                                    <span className="font-medium text-green-600">{archivedSection.completed_students || 0}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Dropped:</span>
                                                    <span className="font-medium text-red-600">{archivedSection.dropped_students || 0}</span>
                                                </div>
                                                {archivedSection.section_average_grade && (
                                                    <div className="flex justify-between">
                                                        <span>Avg Grade:</span>
                                                        <span className="font-medium">{archivedSection.section_average_grade}%</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-2 text-xs text-blue-600">
                                                Click to use section name
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {filteredArchivedSections.length > 12 && (
                                    <div className="mt-4 text-center">
                                        <p className="text-sm text-gray-500">
                                            Showing 12 of {filteredArchivedSections.length} archived sections
                                        </p>
                                    </div>
                                )}
                                {archivedSections && archivedSections.length > 0 && filteredArchivedSections.length === 0 && (
                                    <div className="mt-4 text-center">
                                        <p className="text-sm text-gray-500">
                                            No archived sections found for the selected program and year level
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
};

export default Create;