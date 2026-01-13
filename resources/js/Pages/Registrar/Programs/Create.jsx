import { Head, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { BookOpen, ArrowLeft, Save, Plus } from 'lucide-react'
import { useState } from 'react'

export default function CreateProgram({ auth }) {
    const [form, setForm] = useState({
        program_code: '',
        program_name: '',
        description: '',
        education_level: '',
        total_years: 4,
        status: 'active'
    })

    const [processing, setProcessing] = useState(false)
    const [errors, setErrors] = useState({})

    const handleSubmit = (e) => {
        e.preventDefault()
        setProcessing(true)

        router.post(route('registrar.programs.store'), form, {
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
                <div className="flex items-center justify-between px-2 py-1">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.visit(route('registrar.programs.index'))}
                            className="mr-2"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back to Programs
                        </Button>
                        <div className="bg-green-100 p-2 rounded-lg">
                            <Plus className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Create Program</h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Add a new course program with semester fees
                            </p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Create Program" />

            <div className="max-w-2xl mx-auto mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <BookOpen className="w-5 h-5 mr-2" />
                            Program Details
                        </CardTitle>
                        <CardDescription>
                            Enter the basic program information
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
                                            <SelectValue placeholder="Select education level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="college">College</SelectItem>
                                            <SelectItem value="senior_high">Senior High School</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.education_level && (
                                        <p className="text-red-500 text-sm mt-1">{errors.education_level}</p>
                                    )}
                                </div>

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
                                    {processing ? 'Creating...' : 'Create Program'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    )
}