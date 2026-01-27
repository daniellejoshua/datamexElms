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
import { ArrowLeft, GraduationCap, Users, Calendar, BookOpen, AlertCircle, Plus } from 'lucide-react';

const Create = ({ programs, archivedSections, currentAcademicPeriod, academicYearOptions, semesterOptions }) => {
    const { data, setData, post, processing, errors } = useForm({
        program_id: '',
        section_name: '',
        year_level: 11, // Start with Grade 11 for SHS
        academic_year: currentAcademicPeriod?.academic_year || '',
        semester: currentAcademicPeriod?.semester || '',
        status: 'active'
    });

    const [selectedProgram, setSelectedProgram] = useState(null);
    const [generatedSectionName, setGeneratedSectionName] = useState('');

    // Filter archived sections based on selected program and year level
    const filteredArchivedSections = archivedSections?.filter(section => {
        if (!selectedProgram || !data.year_level) return true; // Show all if nothing selected
        
        // Check if this archived section belongs to the same program and year level
        return section.program_id === selectedProgram.id && section.year_level === data.year_level;
    }) || [];

    // Determine current semester for display
    const getCurrentSemester = () => {
        if (currentAcademicPeriod?.semester === '1st') return '1st';
        if (currentAcademicPeriod?.semester === '2nd') return '2nd'; 
        return 'summer';
    };

    // Update selected program when program_id changes
    useEffect(() => {
        const program = programs.find(p => p.id.toString() === data.program_id.toString());
        setSelectedProgram(program || null);
    }, [data.program_id, programs]);

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
            year_level: archivedSection.year_level || data.year_level,
            section_name: sectionLetter,
        });
        
        // Update selected program if it changed
        if (archivedSection.program_id && archivedSection.program_id !== parseInt(data.program_id)) {
            const program = programs.find(p => p.id === archivedSection.program_id);
            setSelectedProgram(program || null);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.shs.sections.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm">
                            <Link href="/admin/shs/sections" className="flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Back to SHS Sections
                            </Link>
                        </Button>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <div className="flex items-center px-2 py-1">
                            <div className="flex items-center gap-2">
                                <div className="bg-green-100 p-1.5 rounded-md">
                                    <Plus className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Create SHS Section</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">Add a new senior high school section</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Create SHS Section" />
            
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-2xl mx-auto">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <GraduationCap className="w-5 h-5 text-purple-600" />
                                SHS Section Information
                            </CardTitle>
                            <CardDescription>
                                Create a new section for senior high school programs
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Current Academic Period Info */}
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-4 h-4 text-purple-600" />
                                        <span className="font-medium text-purple-800">Current Academic Period</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className="text-purple-700 border-purple-300 text-xs">
                                            {currentAcademicPeriod?.academic_year}
                                        </Badge>
                                        <Badge variant="outline" className="text-purple-700 border-purple-300 text-xs">
                                            {getCurrentSemester()} Semester
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-purple-600 mt-2">
                                        New sections will be created for this academic period
                                    </p>
                                </div>

                                {/* Program and Year Level Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Program Selection */}
                                    <div className="space-y-2">
                                        <Label htmlFor="program" className="font-medium">
                                            SHS Program/Track
                                        </Label>
                                        <Select value={data.program_id} onValueChange={(value) => setData('program_id', value)}>
                                            <SelectTrigger className={`h-10 ${errors.program_id ? 'border-red-500' : 'border-gray-300 focus:border-purple-500'}`}>
                                                <SelectValue placeholder="Select SHS track">
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
                                                        <div className="flex items-center w-full">
                                                            <Badge variant="secondary" className="font-mono text-xs mr-2">
                                                                {program.program_code}
                                                            </Badge>
                                                            <span>{program.program_name}</span>
                                                        </div>
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

                                    {/* Grade Level */}
                                    <div className="space-y-2">
                                        <Label htmlFor="year_level" className="font-medium">
                                            Grade Level
                                        </Label>
                                        <Select value={data.year_level.toString()} onValueChange={(value) => setData('year_level', parseInt(value))}>
                                            <SelectTrigger className={`h-10 ${errors.year_level ? 'border-red-500' : 'border-gray-300 focus:border-purple-500'}`}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="11">Grade 11</SelectItem>
                                                <SelectItem value="12">Grade 12</SelectItem>
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
                                            className={`w-16 h-12 text-center text-xl font-bold ${errors.section_name ? 'border-red-500' : 'border-gray-300 focus:border-purple-500'}`}
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
                                        <Link href="/admin/shs/sections">
                                            Cancel
                                        </Link>
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={processing}
                                        className="bg-purple-600 hover:bg-purple-700"
                                    >
                                        {processing ? 'Creating...' : 'Create SHS Section'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Archived Sections Reference */}
                {archivedSections && archivedSections.length > 0 && (
                    <div className="max-w-4xl mx-auto mt-8">
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <BookOpen className="w-5 h-5 text-amber-600" />
                                    Previous Sections Reference
                                </CardTitle>
                                <CardDescription>
                                    Historical section data from the most recently archived semester for reference when creating new sections. Click on any section to carry forward its program, grade level, and section name.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredArchivedSections.slice(0, 12).map((archivedSection) => (
                                        <div 
                                            key={archivedSection.id} 
                                            className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-purple-50 hover:border-purple-300 cursor-pointer transition-colors"
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
                                        <p className="text-sm text-amber-600">
                                            No archived sections found for the selected program and grade level. Showing all available sections.
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                            {archivedSections.slice(0, 6).map((archivedSection) => (
                                                <div 
                                                    key={archivedSection.id} 
                                                    className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-purple-50 hover:border-purple-300 cursor-pointer transition-colors opacity-60"
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
                                                </div>
                                            ))}
                                        </div>
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