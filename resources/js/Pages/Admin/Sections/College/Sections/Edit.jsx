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
import { ArrowLeft, GraduationCap, AlertCircle} from 'lucide-react';

const Edit = ({ section, programs, curricula, academicYearOptions, semesterOptions }) => {
    const { data, setData, put, processing, errors } = useForm({
        section_name: section.section_name,
        status: section.status
    });

    const [generatedSectionName, setGeneratedSectionName] = useState('');

    // Determine current semester for display
    const getCurrentSemester = () => {
        if (data.semester === '1st') return '1st';
        if (data.semester === '2nd') return '2nd'; 
        return 'summer';
    };

    // Generate section name when section_name changes
    useEffect(() => {
        if (data.section_name && section.program && section.year_level) {
            const sectionName = `${section.program.program_code}-${section.year_level}${data.section_name}`;
            setGeneratedSectionName(sectionName);
        } else {
            setGeneratedSectionName('');
        }
    }, [data.section_name, section.program, section.year_level]);

    const handleSectionNameChange = (value) => {
        // Only allow single letters
        const letter = value.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 1);
        setData('section_name', letter);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('admin.college.sections.update', section.id));
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
                            <h2 className="text-2xl font-bold text-gray-900">Edit College Section</h2>
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
                                College Section Information
                            </CardTitle>
                            <CardDescription>
                                Update college section details and configuration
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Program and Curriculum Row - Read Only */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Program Display */}
                                    <div className="space-y-2">
                                        <Label className="font-medium">
                                            College Program
                                        </Label>
                                        <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                                            <Badge variant="secondary" className="font-mono text-xs">
                                                {section.program.program_code}
                                            </Badge>
                                            <span className="text-sm font-medium">{section.program.program_name}</span>
                                        </div>
                                    </div>

                                    {/* Curriculum Display */}
                                    <div className="space-y-2">
                                        <Label className="font-medium">
                                            Curriculum
                                        </Label>
                                        <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                                            <Badge variant="secondary" className="font-mono text-xs">
                                                {section.curriculum?.curriculum_code || 'N/A'}
                                            </Badge>
                                            <Badge variant={section.curriculum?.is_current ? "default" : "outline"} className="text-xs">
                                                {section.curriculum?.is_current ? "Current" : "Old"}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Year Level and Section Identifier Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Year Level Display */}
                                    <div className="space-y-2">
                                        <Label className="font-medium">
                                            Year Level
                                        </Label>
                                        <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                                            <span className="text-sm font-medium">
                                                {section.year_level === 1 ? '1st Year' : 
                                                 section.year_level === 2 ? '2nd Year' : 
                                                 section.year_level === 3 ? '3rd Year' : '4th Year'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Section Identifier - Editable */}
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
                                </div>

                                {/* Academic Year and Semester Row - Read Only */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Academic Year Display */}
                                    <div className="space-y-2">
                                        <Label className="font-medium">Academic Year</Label>
                                        <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                                            <span className="text-sm font-medium">{section.academic_year}</span>
                                        </div>
                                    </div>

                                    {/* Semester Display */}
                                    <div className="space-y-2">
                                        <Label className="font-medium">Semester</Label>
                                        <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                                            <span className="text-sm font-medium">
                                                {section.semester === '1st' ? '1st Semester' : 
                                                 section.semester === '2nd' ? '2nd Semester' : 'Summer'}
                                            </span>
                                        </div>
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
                                        <Link href="/admin/college/sections">
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