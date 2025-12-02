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
import { ArrowLeft, GraduationCap, AlertCircle, Calendar } from 'lucide-react';

const Edit = ({ section, programs }) => {
    // Get current academic year
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // JS months are 0-indexed
    
    // Determine current academic year (starts in August)
    const currentAcademicYear = currentMonth >= 8 ? 
        `${currentYear}-${currentYear + 1}` : 
        `${currentYear - 1}-${currentYear}`;
    
    // Determine current semester
    const getCurrentSemester = () => {
        if (currentMonth >= 8 && currentMonth <= 12) return '1st';
        if (currentMonth >= 1 && currentMonth <= 5) return '2nd';
        return 'summer';
    };

    const { data, setData, put, processing, errors, reset } = useForm({
        program_id: section.program_id?.toString() || '',
        section_name: section.section_name || '',
        year_level: section.year_level || 1,
        academic_year: section.academic_year || '',
        semester: section.semester || '',
        status: section.status || 'active'
    });

    const [selectedProgram, setSelectedProgram] = useState(null);
    const [generatedSectionName, setGeneratedSectionName] = useState('');

    // Generate academic year options
    const academicYears = [];
    for (let i = -2; i < 3; i++) {
        const year = currentYear + i;
        academicYears.push(`${year}-${year + 1}`);
    }

    // Update selected program when program_id changes
    useEffect(() => {
        if (data.program_id) {
            const program = programs.find(p => p.id == data.program_id);
            setSelectedProgram(program);
        } else {
            setSelectedProgram(null);
        }
    }, [data.program_id, programs]);

    // Generate section name when program or year level changes
    useEffect(() => {
        if (selectedProgram && data.year_level && data.section_name) {
            const name = `${selectedProgram.program_code}-${data.year_level}${data.section_name.toUpperCase()}`;
            setGeneratedSectionName(name);
        } else {
            setGeneratedSectionName('');
        }
    }, [selectedProgram, data.year_level, data.section_name]);

    const handleSectionNameChange = (value) => {
        // Only allow single letter (A-Z)
        const filtered = value.replace(/[^A-Za-z]/g, '').slice(0, 1).toUpperCase();
        setData('section_name', filtered);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('admin.sections.update', section.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm">
                            <Link href="/admin/sections" className="flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Sections
                            </Link>
                        </Button>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Edit Section</h2>
                            <p className="text-sm text-blue-600 font-medium mt-1">Update section information</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`Edit Section: ${section.section_name}`} />
            
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-2xl mx-auto">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <GraduationCap className="w-5 h-5 text-blue-600" />
                                Section Information
                            </CardTitle>
                            <CardDescription>
                                Update section details and configuration
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Academic Period Info */}
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-4 h-4 text-blue-600" />
                                        <span className="font-medium text-blue-800">Current Academic Period</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className="text-blue-700 border-blue-300 text-xs">
                                            {currentAcademicYear}
                                        </Badge>
                                        <Badge variant="outline" className="text-blue-700 border-blue-300 text-xs">
                                            {getCurrentSemester()} Semester
                                        </Badge>
                                    </div>
                                </div>

                                {/* Program and Year Level Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Program Selection */}
                                    <div className="space-y-2">
                                        <Label htmlFor="program" className="font-medium">
                                            Academic Program
                                        </Label>
                                        <Select value={data.program_id} onValueChange={(value) => setData('program_id', value)}>
                                            <SelectTrigger className={`h-10 ${errors.program_id ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}>
                                                <SelectValue placeholder="Select program" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {programs?.map((program) => (
                                                    <SelectItem key={program.id} value={program.id.toString()}>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="secondary" className="font-mono text-xs">
                                                                {program.program_code}
                                                            </Badge>
                                                            <span className="text-sm">{program.program_name}</span>
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

                                {/* Academic Year and Semester Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Academic Year */}
                                    <div className="space-y-2">
                                        <Label htmlFor="academic_year" className="font-medium">Academic Year</Label>
                                        <Select value={data.academic_year} onValueChange={(value) => setData('academic_year', value)}>
                                            <SelectTrigger className={`h-10 ${errors.academic_year ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {academicYears.map((year) => (
                                                    <SelectItem key={year} value={year}>
                                                        {year} {year === currentAcademicYear && '(Current)'}
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
                                            <SelectTrigger className={`h-10 ${errors.semester ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1st">
                                                    1st Semester {getCurrentSemester() === '1st' && '(Current)'}
                                                </SelectItem>
                                                <SelectItem value="2nd">
                                                    2nd Semester {getCurrentSemester() === '2nd' && '(Current)'}
                                                </SelectItem>
                                                <SelectItem value="summer">
                                                    Summer {getCurrentSemester() === 'summer' && '(Current)'}
                                                </SelectItem>
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
                                        <SelectTrigger className={`h-10 max-w-xs ${errors.status ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}`}>
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
                                        <Link href="/admin/sections">
                                            Cancel
                                        </Link>
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={processing}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        {processing ? 'Updating...' : 'Update Section'}
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

export default Edit;