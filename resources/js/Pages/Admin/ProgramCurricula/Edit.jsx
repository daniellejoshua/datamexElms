import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Edit({ programCurriculum, programs, curriculums }) {
    const { data, setData, put, processing, errors } = useForm({
        program_id: programCurriculum.program_id,
        academic_year: programCurriculum.academic_year,
        curriculum_id: programCurriculum.curriculum_id,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.program-curricula.update', programCurriculum.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href={route('admin.program-curricula.index')}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Program Curriculum Mapping
                        </Button>
                    </Link>
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Edit Program Curriculum Mapping
                    </h2>
                </div>
            }
        >
            <Head title="Edit Program Curriculum Mapping" />

            <div className="py-12">
                <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <LinkIcon className="w-5 h-5" />
                                Edit Program Curriculum Mapping
                            </CardTitle>
                            <CardDescription>
                                Update the curriculum mapping for this program and academic year.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-6">
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
                                    <Label htmlFor="curriculum_id">Curriculum</Label>
                                    <Select
                                        value={data.curriculum_id}
                                        onValueChange={(value) => setData('curriculum_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a curriculum" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {curriculums.map((curriculum) => (
                                                <SelectItem key={curriculum.id} value={curriculum.id.toString()}>
                                                    {curriculum.curriculum_name} ({curriculum.curriculum_code}) - {curriculum.academic_year}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.curriculum_id && (
                                        <p className="text-sm text-red-600">{errors.curriculum_id}</p>
                                    )}
                                </div>

                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        <strong>Note:</strong> Each program can only have one curriculum per academic year.
                                        Changing this mapping will affect all students enrolled in this program during this academic year.
                                    </AlertDescription>
                                </Alert>

                                <div className="flex justify-end gap-4">
                                    <Link href={route('admin.program-curricula.index')}>
                                        <Button variant="outline" type="button">
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Updating...' : 'Update Mapping'}
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