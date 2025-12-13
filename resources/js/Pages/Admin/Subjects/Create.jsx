import { useEffect } from 'react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, Link, useForm, usePage } from '@inertiajs/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, BookOpen } from 'lucide-react'
import { Toaster, toast } from 'sonner'

export default function SubjectsCreate({ auth, programs }) {
    const page = usePage();

    useEffect(() => {
        if (page.props.flash?.success) {
            toast.success(page.props.flash.success);
        }
    }, [page.props.flash]);

    const { data, setData, post, processing, errors, reset } = useForm({
        subject_classification: '',
        program_id: '',
        subject_code: '',
        subject_name: '',
        description: '',
        education_level: '',
        year_level: '',
        semester: '',
        units: '',
        status: 'active',
    }, {
        onSuccess: () => {
            reset();
            setData('status', 'active'); // Ensure status remains active after reset
        },
        onError: () => {
            toast.error('Failed to create subject. Please check the errors.');
        }
    });

    // Auto-set education level when program is selected
    useEffect(() => {
        if (data.program_id) {
            const selectedProgram = programs?.find(p => p.id.toString() === data.program_id);
            if (selectedProgram && selectedProgram.education_level) {
                setData('education_level', selectedProgram.education_level);
                // Reset year_level and semester when education level changes
                setData('year_level', '');
                setData('semester', '');
            }
        }
    }, [data.program_id, programs]);

    const subjectClassifications = [
        { value: 'minor', label: 'Minor Subject', description: 'General subjects not tied to a specific program' },
        { value: 'major', label: 'Major Subject', description: 'Specialized subjects for a specific program' },
    ];

    const educationLevels = [
        { value: 'college', label: 'College' },
        { value: 'senior_high', label: 'Senior High School' },
    ];

    const semesters = [
        { value: 'first', label: '1st Semester' },
        { value: 'second', label: '2nd Semester' },
    ];

    // Dynamic year levels based on education level
    const getYearLevels = () => {
        if (data.education_level === 'senior_high') {
            return [
                { value: 11, label: 'Grade 11' },
                { value: 12, label: 'Grade 12' },
            ];
        }
        return [
            { value: 1, label: '1st Year' },
            { value: 2, label: '2nd Year' },
            { value: 3, label: '3rd Year' },
            { value: 4, label: '4th Year' },
        ];
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.subjects.store'));
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
                            <h2 className="text-lg font-semibold text-gray-900">Create Subject</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Add a new academic subject</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Create Subject" />

            <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Subject Information</CardTitle>
                            <CardDescription>
                                Enter the details for the new subject. All fields marked with * are required.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Subject Classification */}
                            <div>
                                <Label className="text-base font-medium">Subject Classification *</Label>
                                <p className="text-sm text-gray-600 mb-3">Choose whether this is a minor or major subject</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {subjectClassifications.map((classification) => (
                                        <div
                                            key={classification.value}
                                                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                                data.subject_classification === classification.value
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                                onClick={() => {
                                                setData('subject_classification', classification.value);
                                                // Reset program_id when switching to minor
                                                if (classification.value === 'minor') {
                                                    setData('program_id', '');
                                                }
                                            }}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-4 h-4 rounded-full border-2 ${
                                                    data.subject_classification === classification.value
                                                        ? 'border-blue-500 bg-blue-500'
                                                        : 'border-gray-300'
                                                }`}>
                                                    {data.subject_classification === classification.value && (
                                                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{classification.label}</div>
                                                    <div className="text-sm text-gray-600">{classification.description}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {errors.subject_classification && (
                                    <p className="text-sm text-red-600 mt-2">{errors.subject_classification}</p>
                                )}
                            </div>

                            {/* Program Selection - Only show for major subjects */}
                            {data.subject_classification === 'major' && (
                                <div>
                                    <Label htmlFor="program_id">Program *</Label>
                                    <Select 
                                        value={data.program_id} 
                                        onValueChange={(value) => {
                                            setData('program_id', value);
                                        }}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select a program" />
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
                                        <p className="text-sm text-red-600 mt-1">{errors.program_id}</p>
                                    )}
                                </div>
                            )}

                            {/* Row 1: Subject Code, Subject Name, and Units */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                            {/* Row 2: Education Level and Year Level */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="education_level">Education Level *</Label>
                                    <Select
                                        value={data.education_level}
                                        disabled={data.subject_classification === 'major' && data.program_id}
                                        onValueChange={(value) => {
                                            setData('education_level', value);
                                            // Reset year level when education level changes
                                            setData('year_level', '');
                                            // Reset semester for SHS
                                            if (value === 'senior_high') {
                                                setData('semester', '');
                                            }
                                        }}
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
                                        disabled={!data.education_level}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select year level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {getYearLevels().map(year => (
                                                <SelectItem key={year.value} value={year.value.toString()}>
                                                    {year.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.year_level && (
                                        <p className="text-sm text-red-600 mt-1">{errors.year_level}</p>
                                    )}
                                </div>
                            </div>

                            {/* Row 3: Semester (only for College) */}
                            {data.education_level === 'college' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                </div>
                            )}                            {/* Description - Full Width */}
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Brief description of the subject..."
                                    rows={2}
                                    className="mt-1"
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                                )}
                            </div>

                            {/* Major Confirmation */}
                            {data.subject_classification === 'major' && data.program_id && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span className="text-sm font-medium text-blue-900">Major Subject:</span>
                                        <span className="text-sm text-blue-700">
                                            {programs?.find(p => p.id.toString() === data.program_id)?.program_name}
                                        </span>
                                    </div>
                                    <p className="text-xs text-blue-600 mt-1">
                                        This subject will be considered a major subject for the selected program.
                                    </p>
                                </div>
                            )}
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
                            {processing ? 'Creating...' : 'Create Subject'}
                        </Button>
                    </div>
                </form>
            </div>
            <Toaster position="top-right" richColors />
        </AuthenticatedLayout>
    )
}