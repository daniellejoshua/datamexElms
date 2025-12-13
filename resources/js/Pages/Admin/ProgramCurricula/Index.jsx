import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, Trash2, Link as LinkIcon } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ programCurricula }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Program Curriculum Mapping
                    </h2>
                    <Link href={route('admin.program-curricula.create')}>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Mapping
                        </Button>
                    </Link>
                </div>
            }
        >
            <Head title="Program Curriculum Mapping" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid gap-6">
                        {programCurricula.data.map((mapping) => (
                            <Card key={mapping.id}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <LinkIcon className="w-5 h-5" />
                                                {mapping.program.program_name}
                                            </CardTitle>
                                            <CardDescription>
                                                Academic Year: {mapping.academic_year}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-sm text-gray-600">
                                                Curriculum: <span className="font-medium">{mapping.curriculum.curriculum_name}</span>
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Code: <span className="font-medium">{mapping.curriculum.curriculum_code}</span>
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Link href={route('admin.program-curricula.show', mapping.id)}>
                                                <Button variant="outline" size="sm">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <Link href={route('admin.program-curricula.edit', mapping.id)}>
                                                <Button variant="outline" size="sm">
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {programCurricula.data.length === 0 && (
                            <Card>
                                <CardContent className="py-12">
                                    <div className="text-center">
                                        <LinkIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No program curriculum mappings found</h3>
                                        <p className="text-gray-500 mb-4">Get started by creating your first program curriculum mapping.</p>
                                        <Link href={route('admin.program-curricula.create')}>
                                            <Button>
                                                <Plus className="w-4 h-4 mr-2" />
                                                Create Mapping
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