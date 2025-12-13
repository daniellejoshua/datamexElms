import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Create({ programs }) {
    const { data, setData, post, processing, errors } = useForm({
        program_id: '',
        curriculum_code: '',
        curriculum_name: '',
        academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        description: '',
        status: 'active',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.curriculum.store'));
    };

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
                        Create New Curriculum
                    </h2>
                </div>
            }
        >
            <Head title="Create Curriculum" />

            <div className="py-12">
                <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Curriculum Information
                            </CardTitle>
                            <CardDescription>
                                Create a new curriculum for a program. Subjects will be automatically populated based on the program structure.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="program_id">Program</Label>
                                        <Select
                                            value={data.program_id}
                                            onValueChange={(value) => setData('program_id', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a program" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {programs.map((program) => (
                                                    <SelectItem key={program.id} value={program.id.toString()}>
                                                        {program.program_name} ({program.program_code})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.program_id && (
                                            <p className="text-sm text-red-600">{errors.program_id}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="curriculum_code">Curriculum Code</Label>
                                        <Input
                                            id="curriculum_code"
                                            type="text"
                                            value={data.curriculum_code}
                                            onChange={(e) => setData('curriculum_code', e.target.value)}
                                            placeholder="e.g., BSIT-2025"
                                        />
                                        {errors.curriculum_code && (
                                            <p className="text-sm text-red-600">{errors.curriculum_code}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="curriculum_name">Curriculum Name</Label>
                                    <Input
                                        id="curriculum_name"
                                        type="text"
                                        value={data.curriculum_name}
                                        onChange={(e) => setData('curriculum_name', e.target.value)}
                                        placeholder="e.g., Bachelor of Science in Information Technology Curriculum 2025"
                                    />
                                    {errors.curriculum_name && (
                                        <p className="text-sm text-red-600">{errors.curriculum_name}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="academic_year">Academic Year</Label>
                                        <Input
                                            id="academic_year"
                                            type="text"
                                            value={data.academic_year}
                                            onChange={(e) => setData('academic_year', e.target.value)}
                                            placeholder="e.g., 2025-2026"
                                        />
                                        {errors.academic_year && (
                                            <p className="text-sm text-red-600">{errors.academic_year}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select
                                            value={data.status}
                                            onValueChange={(value) => setData('status', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.status && (
                                            <p className="text-sm text-red-600">{errors.status}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description (Optional)</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Brief description of this curriculum..."
                                        rows={3}
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-red-600">{errors.description}</p>
                                    )}
                                </div>

                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        <strong>Note:</strong> Once created, curriculum subjects cannot be modified.
                                        This ensures academic integrity and consistency across the program.
                                    </AlertDescription>
                                </Alert>

                                <div className="flex justify-end gap-4">
                                    <Link href={route('admin.curriculum.index')}>
                                        <Button variant="outline" type="button">
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Creating...' : 'Create Curriculum'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}