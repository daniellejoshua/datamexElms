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

const Create = ({ programs, currentAcademicPeriod, academicYearOptions, semesterOptions }) => {
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
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Create SHS Section</h2>
                            <p className="text-sm text-purple-600 font-medium mt-1">Add a new senior high school section</p>
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
                                                <SelectValue placeholder="Select SHS track" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {programs?.map((program) => (
                                                    <SelectItem key={program.id} value={program.id.toString()}>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="secondary" className="font-mono text-xs">
                                                                {program.program_code}
                                                            </Badge>
                                                            <span className="text-sm">{program.program_name}</span>
                                                            {program.track && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    {program.track}
                                                                </Badge>
                                                            )}
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

                                {/* Academic Year and Semester Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Academic Year */}
                                    <div className="space-y-2">
                                        <Label htmlFor="academic_year" className="font-medium">Academic Year</Label>
                                        <Select value={data.academic_year} onValueChange={(value) => setData('academic_year', value)}>
                                            <SelectTrigger className={`h-10 ${errors.academic_year ? 'border-red-500' : 'border-gray-300 focus:border-purple-500'}`}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {academicYearOptions?.map((year) => (
                                                    <SelectItem key={year} value={year}>
                                                        {year} {year === currentAcademicPeriod?.academic_year && '(Current)'}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.academic_year && (
                                            <Alert variant="destructive" className="py-2">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription className="text-sm">{errors.academic_year}</AlertDescription>
                                            </Alert>
                                        )}
                                    </div>

                                    {/* Semester */}
                                    <div className="space-y-2">
                                        <Label htmlFor="semester" className="font-medium">Semester</Label>
                                        <Select value={data.semester} onValueChange={(value) => setData('semester', value)}>
                                            <SelectTrigger className={`h-10 ${errors.semester ? 'border-red-500' : 'border-gray-300 focus:border-purple-500'}`}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {semesterOptions?.map((semester) => (
                                                    <SelectItem key={semester.value} value={semester.value}>
                                                        {semester.label} {semester.value === currentAcademicPeriod?.semester && '(Current)'}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.semester && (
                                            <Alert variant="destructive" className="py-2">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription className="text-sm">{errors.semester}</AlertDescription>
                                            </Alert>
                                        )}
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="space-y-2">
                                    <Label htmlFor="status" className="font-medium">Status</Label>
                                    <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                        <SelectTrigger className={`h-10 max-w-xs ${errors.status ? 'border-red-500' : 'border-gray-300 focus:border-purple-500'}`}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                    <span>Active</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="inactive">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                                    <span>Inactive</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.status && (
                                        <Alert variant="destructive" className="py-2">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription className="text-sm">{errors.status}</AlertDescription>
                                        </Alert>
                                    )}
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
            </div>
        </AuthenticatedLayout>
    );
};

export default Create;