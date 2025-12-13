import { Head, Link, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Save, BookOpen } from 'lucide-react'

export default function SubjectsEdit({ auth, subject }) {
    const { data, setData, put, processing, errors, reset } = useForm({
        subject_code: subject.subject_code || '',
        subject_name: subject.subject_name || '',
        description: subject.description || '',
        education_level: subject.education_level || '',
        year_level: subject.year_level || '',
        semester: subject.semester || '',
        units: subject.units || '',
        subject_type: subject.subject_type || '',
        prerequisites: subject.prerequisites || '',
        status: subject.status || 'active',
    });

    const educationLevels = [
        { value: 'college', label: 'College' },
        { value: 'shs', label: 'Senior High School' },
    ];

    const semesters = [
        { value: 'first', label: '1st Semester' },
        { value: 'second', label: '2nd Semester' },
    ];

    const subjectTypes = [
        { value: 'major', label: 'Major' },
        { value: 'minor', label: 'Minor' },
        { value: 'general', label: 'General Education' },
        { value: 'elective', label: 'Elective' },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('admin.subjects.update', subject.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between px-2 py-1">
                    <div className="flex items-center gap-2">
                        <Button asChild variant="ghost" size="sm" className="text-xs h-7 px-2">
                            <Link href={route('admin.subjects.index')}>
                                <ArrowLeft className="w-3 h-3 mr-1" />
                                Back to Subjects
                            </Link>
                        </Button>
                        <div className="bg-green-100 p-1.5 rounded-md">
                            <BookOpen className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Edit Subject</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Update subject information</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`Edit ${subject.subject_name}`} />

            <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Subject Information</CardTitle>
                            <CardDescription>
                                Update the subject details. All fields marked with * are required.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="subject_code">Subject Code *</Label>
                                    <Input
                                        id="subject_code"
                                        type="text"
                                        value={data.subject_code}
                                        onChange={(e) => setData('subject_code', e.target.value.toUpperCase())}
                                        placeholder="e.g., CS101"
                                        className="mt-1"
                                    />
                                    {errors.subject_code && (
                                        <p className="text-sm text-red-600 mt-1">{errors.subject_code}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="units">Units *</Label>
                                    <Input
                                        id="units"
                                        type="number"
                                        min="0"
                                        max="10"
                                        step="0.5"
                                        value={data.units}
                                        onChange={(e) => setData('units', e.target.value)}
                                        placeholder="e.g., 3"
                                        className="mt-1"
                                    />
                                    {errors.units && (
                                        <p className="text-sm text-red-600 mt-1">{errors.units}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="subject_name">Subject Name *</Label>
                                <Input
                                    id="subject_name"
                                    type="text"
                                    value={data.subject_name}
                                    onChange={(e) => setData('subject_name', e.target.value)}
                                    placeholder="e.g., Introduction to Computer Science"
                                    className="mt-1"
                                />
                                {errors.subject_name && (
                                    <p className="text-sm text-red-600 mt-1">{errors.subject_name}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Brief description of the subject..."
                                    rows={3}
                                    className="mt-1"
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="education_level">Education Level *</Label>
                                    <Select
                                        value={data.education_level}
                                        onValueChange={(value) => setData('education_level', value)}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select education level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {educationLevels.map(level => (
                                                <SelectItem key={level.value} value={level.value}>
                                                    {level.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.education_level && (
                                        <p className="text-sm text-red-600 mt-1">{errors.education_level}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="year_level">Year Level *</Label>
                                    <Select
                                        value={data.year_level}
                                        onValueChange={(value) => setData('year_level', value)}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select year level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[1, 2, 3, 4].map(year => (
                                                <SelectItem key={year} value={year.toString()}>
                                                    Year {year}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.year_level && (
                                        <p className="text-sm text-red-600 mt-1">{errors.year_level}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="semester">Semester *</Label>
                                    <Select
                                        value={data.semester}
                                        onValueChange={(value) => setData('semester', value)}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select semester" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {semesters.map(semester => (
                                                <SelectItem key={semester.value} value={semester.value}>
                                                    {semester.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.semester && (
                                        <p className="text-sm text-red-600 mt-1">{errors.semester}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="subject_type">Subject Type *</Label>
                                    <Select
                                        value={data.subject_type}
                                        onValueChange={(value) => setData('subject_type', value)}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select subject type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subjectTypes.map(type => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.subject_type && (
                                        <p className="text-sm text-red-600 mt-1">{errors.subject_type}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="prerequisites">Prerequisites</Label>
                                <Input
                                    id="prerequisites"
                                    type="text"
                                    value={data.prerequisites}
                                    onChange={(e) => setData('prerequisites', e.target.value)}
                                    placeholder="e.g., CS101, MATH101"
                                    className="mt-1"
                                />
                                {errors.prerequisites && (
                                    <p className="text-sm text-red-600 mt-1">{errors.prerequisites}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="status">Status *</Label>
                                <Select
                                    value={data.status}
                                    onValueChange={(value) => setData('status', value)}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && (
                                    <p className="text-sm text-red-600 mt-1">{errors.status}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4 mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            asChild
                        >
                            <Link href={route('admin.subjects.index')}>
                                Cancel
                            </Link>
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {processing ? 'Updating...' : 'Update Subject'}
                        </Button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    )
}