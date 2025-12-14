import { Head, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, FileText } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function Index({ curriculums }) {
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

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Curriculum Management
                    </h2>
                    <Link href={route('admin.curriculum.create')}>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Curriculum
                        </Button>
                    </Link>
                </div>
            }
        >
            <Head title="Curriculum" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid gap-6">
                        {curriculums.data.map((curriculum) => (
                            <Card key={curriculum.id}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <FileText className="w-5 h-5" />
                                                {curriculum.curriculum_name}
                                            </CardTitle>
                                            <CardDescription>
                                                {curriculum.curriculum_code} • Created {new Date(curriculum.created_at).toLocaleDateString()}
                                            </CardDescription>
                                        </div>
                                        <Badge variant={curriculum.status === 'active' ? 'default' : 'secondary'}>
                                            {curriculum.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-sm text-gray-600">
                                                Program: <span className="font-medium">{curriculum.program.program_name}</span>
                                            </p>
                                            {curriculum.description && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {curriculum.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Link href={route('admin.curriculum.show', curriculum.id)}>
                                                <Button variant="outline" size="sm">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <Link href={route('admin.curriculum.edit', curriculum.id)}>
                                                <Button variant="outline" size="sm">
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {curriculums.data.length === 0 && (
                            <Card>
                                <CardContent className="py-12">
                                    <div className="text-center">
                                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No curriculums found</h3>
                                        <p className="text-gray-500 mb-4">Get started by creating your first curriculum.</p>
                                        <Link href={route('admin.curriculum.create')}>
                                            <Button>
                                                <Plus className="w-4 h-4 mr-2" />
                                                Create Curriculum
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Pagination can be added here if needed */}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}