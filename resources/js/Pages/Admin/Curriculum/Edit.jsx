import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function Edit({ curriculum, programs }) {
    const { data, setData, put, processing, errors } = useForm({
        program_id: curriculum.program_id,
        curriculum_code: curriculum.curriculum_code,
        curriculum_name: curriculum.curriculum_name,
    });

    const page = usePage();

    useEffect(() => {
        if (page.props.flash?.success) {
            toast.success(page.props.flash.success, {
                style: {
                    color: '#10b981', // green-500
                    border: '1px solid #10b981',
                },
            });
        }
        if (page.props.flash?.error) {
            toast.error(page.props.flash.error, {
                style: {
                    color: '#ef4444', // red-500
                    border: '1px solid #ef4444',
                },
            });
        }
    }, [page.props.flash]);

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.curriculum.update', curriculum.id));
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
                        Edit Curriculum
                    </h2>
                </div>
            }
        >
            <Head title="Edit Curriculum" />

            <div className="py-12">
                <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Edit Curriculum Details
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
                                        <Input
                                            id="program_id"
                                            type="text"
                                            value={programs.find(p => p.id == curriculum.program_id)?.program_name + ' (' + programs.find(p => p.id == curriculum.program_id)?.program_code + ')' || 'Unknown Program'}
                                            readOnly
                                            className="bg-gray-50 cursor-not-allowed"
                                        />
                                        <p className="text-sm text-gray-500">Program cannot be changed after curriculum creation</p>
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

                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        <strong>Note:</strong> Only the curriculum code and name can be edited. The program association and subjects cannot be modified to maintain academic integrity.
                                    </AlertDescription>
                                </Alert>

                                <div className="flex justify-end gap-4">
                                    <Link href={route('admin.curriculum.index')}>
                                        <Button variant="outline" type="button">
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Updating...' : 'Update Curriculum'}
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