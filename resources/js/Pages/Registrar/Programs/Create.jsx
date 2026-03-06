import { Head, router } from '@inertiajs/react'
import { route } from 'ziggy-js';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { BookOpen, ArrowLeft, Save, Plus } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function CreateProgram({ auth }) {
    const [form, setForm] = useState({
        program_code: '',
        program_name: '',
        description: '',
        education_level: '',
        total_years: 4,
        status: 'active',
        // per-year fees (created on the fly to match total_years)
        program_fees: [],
        // keep a top-level semester_fee for backwards compatibility with the controller
        semester_fee: 0,
    })

    const [processing, setProcessing] = useState(false)
    const [errors, setErrors] = useState({})

    // initialize program_fees whenever total_years or education_level changes
    useEffect(() => {
        const years = form.total_years || 1;
        const maxYears = form.education_level === 'senior_high' ? 2 : years;

        const fees = [];
        for (let year = 1; year <= maxYears; year++) {
            fees.push({
                year_level: year,
                fee_type: 'regular',
                tuition_fee: 0,
                miscellaneous_fee: 0,
                semester_fee: 0,
            });
        }

        setForm(prev => ({ ...prev, program_fees: fees, semester_fee: fees[0]?.semester_fee ?? 0 }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.total_years, form.education_level])

    const handleSubmit = (e) => {
        e.preventDefault()
        setProcessing(true)

        // ensure top-level semester_fee exists for validation compatibility
        const payload = { ...form, semester_fee: form.program_fees?.[0]?.semester_fee ?? form.semester_fee ?? 0 };

        router.post(route('registrar.programs.store'), payload, {
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

    const updateFeeComponent = (yearLevel, feeKey, amount) => {
        const numericAmount = amount === '' ? 0 : parseFloat(amount) || 0;
        const updatedFees = (form.program_fees || []).map(fee =>
            fee.year_level === yearLevel && fee.fee_type === 'regular'
                ? {
                    ...fee,
                    [feeKey]: numericAmount,
                    semester_fee: feeKey === 'tuition_fee'
                        ? numericAmount + (parseFloat(fee.miscellaneous_fee) || 0)
                        : (parseFloat(fee.tuition_fee) || 0) + numericAmount,
                }
                : fee
        );
        setForm(prev => ({ ...prev, program_fees: updatedFees, semester_fee: updatedFees[0]?.semester_fee ?? prev.semester_fee }));
    };

    // Format number with commas for display
    const formatCurrency = (value) => {
        if (!value || value === 0) return '';
        return new Intl.NumberFormat('en-US').format(value);
    };

    // Handle fee input change with formatting
    const handleFeeChange = (yearLevel, feeKey, inputValue) => {
        // Remove any non-numeric characters except decimal point
        const cleanValue = inputValue.replace(/[^0-9.]/g, '');
        const numericValue = cleanValue === '' ? 0 : parseFloat(cleanValue) || 0;
        updateFeeComponent(yearLevel, feeKey, numericValue.toString());
    };

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

            <div className="max-w-4xl mx-auto mt-6">
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

                            {/* Fee Structure (match total_years) */}
                            <div className="mt-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Fee Structure</CardTitle>
                                        <CardDescription>
                                            Set semester fees for each year level. These fees will be automatically applied to regular students during enrollment.
                                            {form.education_level === 'senior_high' ? ' (Senior High fees are annual)' : ''}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {Array.from({ length: form.education_level === 'senior_high' ? Math.min(2, form.total_years) : form.total_years }, (_, i) => i + 1).map((year) => {
                                                const fee = (form.program_fees || []).find(
                                                    f => f.year_level === year && f.fee_type === 'regular'
                                                );
                                                const tuitionAmount = fee ? (fee.tuition_fee ?? fee.semester_fee ?? 0) : 0;
                                                const miscellaneousAmount = fee ? (fee.miscellaneous_fee ?? 0) : 0;
                                                const totalAmount = (parseFloat(tuitionAmount) || 0) + (parseFloat(miscellaneousAmount) || 0);

                                                return (
                                                    <div key={year} className="p-3 border rounded-lg bg-gray-50 space-y-2">
                                                        <Label className="text-sm font-medium w-24 flex-shrink-0">
                                                            {form.education_level === 'senior_high' ? `Grade ${year + 10}` : `${year}${year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} Year`}:
                                                        </Label>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            <div className="relative">
                                                                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs z-10">
                                                                    ₱
                                                                </span>
                                                                <Input
                                                                    type="text"
                                                                    value={formatCurrency(tuitionAmount)}
                                                                    onChange={(e) => handleFeeChange(year, 'tuition_fee', e.target.value)}
                                                                    className="pl-6 h-8 text-sm w-full"
                                                                    placeholder="Tuition fee"
                                                                />
                                                            </div>
                                                            <div className="relative">
                                                                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs z-10">
                                                                    ₱
                                                                </span>
                                                                <Input
                                                                    type="text"
                                                                    value={formatCurrency(miscellaneousAmount)}
                                                                    onChange={(e) => handleFeeChange(year, 'miscellaneous_fee', e.target.value)}
                                                                    className="pl-6 h-8 text-sm w-full"
                                                                    placeholder="Miscellaneous fee"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between text-xs text-gray-600">
                                                            <span>{form.education_level === 'senior_high' ? 'per year level' : 'per semester'}</span>
                                                            <span className="font-semibold text-green-700">Total: ₱{formatCurrency(totalAmount) || '0'}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {errors['program_fees'] && (
                                            <p className="text-sm text-red-600 mt-3">{errors['program_fees']}</p>
                                        )}
                                    </CardContent>
                                </Card>
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
