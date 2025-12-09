import { Head, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { BookOpen, ArrowLeft, Save } from 'lucide-react'
import { useState } from 'react'

export default function EditProgram({ auth, program }) {
    const [form, setForm] = useState({
        program_code: program.program_code,
        program_name: program.program_name,
        description: program.description || '',
        education_level: program.education_level,
        track: program.track || '',
        total_years: program.total_years,
        semester_fee: program.semester_fee,
        status: program.status
    })

    const [processing, setProcessing] = useState(false)
    const [errors, setErrors] = useState({})

    const handleSubmit = (e) => {
        e.preventDefault()
        setProcessing(true)

        router.put(route('registrar.programs.update', program.id), form, {
            onFinish: () => setProcessing(false),
            onError: (errors) => setErrors(errors),
        })
    }

    const handleChange = (field, value) => {
        setForm(prev => ({
            ...prev,
            [field]: value
        }))
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.visit(route('registrar.programs.index'))}
                        className="mr-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Edit Program</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Update program details and semester fee
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Edit Program" />

            <div className="max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <BookOpen className="w-5 h-5 mr-2" />
                            Edit Program Details
                        </CardTitle>
                        <CardDescription>
                            Modify the program information and set the semester fee
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="program_code">Program Code *</Label>
                                    <Input
                                        id="program_code"
                                        value={form.program_code}
                                        onChange={(e) => handleChange('program_code', e.target.value)}
                                        placeholder="e.g., BSIT, BSCS"
                                        className={errors.program_code ? 'border-red-500' : ''}
                                    />
                                    {errors.program_code && (
                                        <p className="text-red-500 text-sm mt-1">{errors.program_code}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="program_name">Program Name *</Label>
                                    <Input
                                        id="program_name"
                                        value={form.program_name}
                                        onChange={(e) => handleChange('program_name', e.target.value)}
                                        placeholder="e.g., Bachelor of Science in Information Technology"
                                        className={errors.program_name ? 'border-red-500' : ''}
                                    />
                                    {errors.program_name && (
                                        <p className="text-red-500 text-sm mt-1">{errors.program_name}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={form.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    placeholder="Program description..."
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="education_level">Education Level *</Label>
                                    <Select value={form.education_level} onValueChange={(value) => handleChange('education_level', value)}>
                                        <SelectTrigger className={errors.education_level ? 'border-red-500' : ''}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="college">College</SelectItem>
                                            <SelectItem value="shs">Senior High School</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.education_level && (
                                        <p className="text-red-500 text-sm mt-1">{errors.education_level}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="track">Track (SHS only)</Label>
                                    <Input
                                        id="track"
                                        value={form.track}
                                        onChange={(e) => handleChange('track', e.target.value)}
                                        placeholder="e.g., STEM, ABM"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="total_years">Total Years *</Label>
                                    <Select value={form.total_years.toString()} onValueChange={(value) => handleChange('total_years', parseInt(value))}>
                                        <SelectTrigger className={errors.total_years ? 'border-red-500' : ''}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">1 year</SelectItem>
                                            <SelectItem value="2">2 years</SelectItem>
                                            <SelectItem value="3">3 years</SelectItem>
                                            <SelectItem value="4">4 years</SelectItem>
                                            <SelectItem value="5">5 years</SelectItem>
                                            <SelectItem value="6">6 years</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.total_years && (
                                        <p className="text-red-500 text-sm mt-1">{errors.total_years}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="semester_fee">Semester Fee (PHP) *</Label>
                                    <Input
                                        id="semester_fee"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={form.semester_fee}
                                        onChange={(e) => handleChange('semester_fee', e.target.value)}
                                        placeholder="0.00"
                                        className={errors.semester_fee ? 'border-red-500' : ''}
                                    />
                                    {errors.semester_fee && (
                                        <p className="text-red-500 text-sm mt-1">{errors.semester_fee}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="status">Status *</Label>
                                <Select value={form.status} onValueChange={(value) => handleChange('status', value)}>
                                    <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && (
                                    <p className="text-red-500 text-sm mt-1">{errors.status}</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.visit(route('registrar.programs.index'))}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    <Save className="w-4 h-4 mr-2" />
                                    {processing ? 'Updating...' : 'Update Program'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    )
}