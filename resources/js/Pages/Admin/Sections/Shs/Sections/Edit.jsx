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
import { ArrowLeft, GraduationCap, AlertCircle, Edit as EditIcon } from 'lucide-react';

const Edit = ({ section, programs, academicYearOptions, semesterOptions }) => {
    if (!section) {
        return (
            <AuthenticatedLayout>
                <div className="p-4 sm:p-6 lg:p-8">
                    <div className="max-w-2xl mx-auto">
                        <Card className="shadow-lg">
                            <CardContent className="p-6">
                                <div className="text-center">Loading section data...</div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    const { data, setData, put, processing, errors } = useForm({
        section_name: section.section_name?.split('-')[1]?.slice(-1) || '',
        status: section.status || 'active'
    });

    const [selectedProgram, setSelectedProgram] = useState(null);
    const [generatedSectionName, setGeneratedSectionName] = useState('');

    // Update selected program when component mounts
    useEffect(() => {
        const program = programs.find(p => p.id.toString() === (section.program?.id || section.program_id)?.toString());
        setSelectedProgram(program || null);
    }, [programs, section.program, section.program_id]);

    // Generate section name when section_name changes
    useEffect(() => {
        if (selectedProgram && data.section_name && section.year_level) {
            const sectionName = `${selectedProgram.program_code}-${section.year_level}${data.section_name}`;
            setGeneratedSectionName(sectionName);
        } else {
            setGeneratedSectionName('');
        }
    }, [selectedProgram, data.section_name, section.year_level]);

    const handleSectionNameChange = (value) => {
        const letter = value.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 1);
        setData('section_name', letter);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('admin.shs.sections.update', section.id));
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
                                    <EditIcon className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Edit SHS Section</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">Update section information</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`Edit Section: ${section.section_name}`} />

            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Section Information Card */}
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <GraduationCap className="w-5 h-5 text-purple-600" />
                                SHS Section Information
                            </CardTitle>
                            <CardDescription>
                                Update SHS section details and configuration
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Read-only Program Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">SHS Program/Track</Label>
                                    <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                                        {selectedProgram ? (
                                            <>
                                                <Badge variant="secondary" className="font-mono text-xs">
                                                    {selectedProgram.program_code}
                                                </Badge>
                                                <span className="text-sm font-medium">{selectedProgram.program_name}</span>
                                                {selectedProgram.track && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {selectedProgram.track}
                                                    </Badge>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-sm text-gray-500">Program not found</span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Grade Level</Label>
                                    <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                                        <Badge variant="secondary" className="font-mono text-xs">
                                            Grade {section.year_level || 'N/A'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Read-only Academic Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Academic Year</Label>
                                    <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                                        <span className="text-sm font-medium">{section.academic_year || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Semester</Label>
                                    <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                                        <span className="text-sm font-medium">
                                            {semesterOptions?.find(s => s.value === section.semester)?.label || section.semester || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Editable Section Identifier */}
                            <div className="space-y-3">
                                <Label htmlFor="section_name" className="text-sm font-medium text-gray-700">Section Identifier</Label>
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

                            {/* Editable Status */}
                            <div className="space-y-3">
                                <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
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
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-4">
                        <Button asChild variant="outline">
                            <Link href="/admin/shs/sections">
                                Cancel
                            </Link>
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={processing}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {processing ? 'Updating...' : 'Update Section'}
                        </Button>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Edit;