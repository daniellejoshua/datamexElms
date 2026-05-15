import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FileText, AlertCircle, CheckCircle, XCircle, Edit as EditIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useEffect } from 'react';

export default function EditCurriculum({ curriculum, programs, currentSemester, activeFirstYearEnrollments = 0 }) {
    const { data, setData, put, processing, errors } = useForm({
        program_id: curriculum.program_id,
        curriculum_code: curriculum.curriculum_code,
        curriculum_name: curriculum.curriculum_name,
        is_current: curriculum.is_current || false,
    });

    const isAcademicYearOngoing = currentSemester === '1st' || currentSemester === '2nd';
    const canSetAsCurrent = currentSemester !== '2nd' && activeFirstYearEnrollments === 0;

    const submit = (e) => {
        e.preventDefault();
        put(route('admin.curriculum.update', curriculum.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm">
                            <Link href={route('admin.curriculum.index')} className="flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Back to Curriculum</span>
                            </Link>
                        </Button>
                        <div className="hidden md:block h-6 w-px bg-gray-300"></div>
                        <div className="flex items-center gap-2">
                            <div className="bg-orange-100 p-1.5 rounded-md">
                                <EditIcon className="w-4 h-4 text-orange-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Edit Curriculum</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Modify curriculum details</p>
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Edit Curriculum" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Current Curriculum Info */}
                    <Card className="border-blue-200 bg-blue-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-blue-900">
                                <FileText className="w-5 h-5" />
                                Current Curriculum Information
                            </CardTitle>
                            <CardDescription className="text-blue-700">
                                Review the current curriculum details before making changes
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700">Curriculum Name</Label>
                                        <p className="text-lg font-semibold text-gray-900">{curriculum.curriculum_name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700">Curriculum Code</Label>
                                        <p className="text-lg font-semibold text-gray-900">{curriculum.curriculum_code}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700">Program</Label>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {curriculum.program.program_name} ({curriculum.program.program_code})
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700">Current Status</Label>
                                        <div className="flex items-center gap-2">
                                            {curriculum.is_current === 1 || curriculum.is_current === true ? (
                                                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-yellow-300">
                                                    <span className="w-2 h-2 bg-white rounded-full animate-pulse mr-1"></span>
                                                    Current Curriculum
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-gray-600 border-gray-400">
                                                    Not Current
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700">Created</Label>
                                        <p className="text-sm text-gray-600">{new Date(curriculum.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Edit Curriculum Details
                            </CardTitle>
                            <CardDescription>
                                Modify the curriculum information and status as needed.
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

                                {curriculum.is_current ? (
                                    <div className="flex items-center gap-3">
                                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-yellow-300">
                                            Current Curriculum
                                        </Badge>
                                        <p className="text-sm text-gray-600">This curriculum is currently active for the program and cannot be unset from this edit form.</p>
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="is_current"
                                            checked={data.is_current}
                                            onCheckedChange={(checked) => setData('is_current', checked)}
                                            disabled={!canSetAsCurrent}
                                        />
                                        <Label htmlFor="is_current" className={`text-sm font-medium ${!canSetAsCurrent ? 'text-gray-400' : ''}`}>
                                            Set as Current Curriculum for Program
                                        </Label>
                                    </div>
                                )}

                                {activeFirstYearEnrollments > 0 && (
                                    <Alert variant="destructive" className="mt-2">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            <strong>Blocked:</strong> There are {activeFirstYearEnrollments} active enrollment(s) in first-year sections for this program and academic year. You cannot set a new curriculum as current while students are actively enrolled.
                                        </AlertDescription>
                                    </Alert>
                                )}
                                
                                
                                
                                <p className="text-xs text-gray-500">
                                    When checked, all new students in this program will be assigned to this curriculum.
                                    Only one curriculum per program can be current at a time.
                                </p>
                                
                                {errors.is_current && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{errors.is_current}</AlertDescription>
                                    </Alert>
                                )}

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