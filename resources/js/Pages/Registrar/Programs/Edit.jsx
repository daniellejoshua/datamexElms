import { Head, Link, useForm } from '@inertiajs/react'
import { route } from 'ziggy-js';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Save, ArrowLeft } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function ProgramsEdit({ program, auth }) {
    const [feeErrors, setFeeErrors] = useState({});

    const normalizeProgramFees = (fees = []) => {
        return (fees || []).map((fee) => {
            const semesterFee = parseFloat(fee.semester_fee) || 0;
            const tuitionFee = fee.tuition_fee !== undefined
                ? (parseFloat(fee.tuition_fee) || 0)
                : semesterFee;
            const miscellaneousFee = fee.miscellaneous_fee !== undefined
                ? (parseFloat(fee.miscellaneous_fee) || 0)
                : 0;

            return {
                ...fee,
                tuition_fee: tuitionFee,
                miscellaneous_fee: miscellaneousFee,
                semester_fee: tuitionFee + miscellaneousFee,
            };
        });
    };

    const { data, setData, put, processing, errors, reset } = useForm({
        program_name: program.program_name || '',
        program_code: program.program_code || '',
        description: program.description || '',
        education_level: program.education_level || '',
        program_fees: normalizeProgramFees(program.program_fees || []),
    });

    const educationLevels = [
        { value: 'college', label: 'College' },
        { value: 'senior_high', label: 'Senior High School' },
    ];

    // Initialize program fees if empty
    useEffect(() => {
        if (program && (!data.program_fees || data.program_fees.length === 0)) {
            const defaultFees = [];
            // Create fees for each year level (1-4 for college, 1-2 for senior high)
            const maxYears = data.education_level === 'senior_high' ? 2 : 4;

            for (let year = 1; year <= maxYears; year++) {
                defaultFees.push({
                    year_level: year,
                    fee_type: 'regular',
                    tuition_fee: 0,
                    miscellaneous_fee: 0,
                    semester_fee: 0,
                });
            }
            setData('program_fees', defaultFees);
        }
    }, [data.education_level, program]);

    const updateFeeComponent = (yearLevel, feeKey, amount) => {
        const numericAmount = amount === '' ? 0 : parseFloat(amount) || 0;
        const updatedFees = data.program_fees.map(fee =>
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
        setData('program_fees', updatedFees);
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

        // Parse to number
        const numericValue = cleanValue === '' ? 0 : parseFloat(cleanValue) || 0;

        // Update the fee with the numeric value
        updateFeeComponent(yearLevel, feeKey, numericValue.toString());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFeeErrors({});

        try {
            await put(route('registrar.programs.update', program.id), {
                onError: (errors) => {
                    setFeeErrors(errors);
                }
            });
        } catch (error) {
            console.error('Submission error:', error);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between px-2 py-1">
                    <div className="flex items-center gap-2">
                        <Button asChild variant="ghost" size="sm" className="mr-2">
                            <Link href={route('registrar.programs.show', program.id)}>
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                <span className="hidden sm:inline">Back to Program</span>
                            </Link>
                        </Button>
                        <div className="bg-blue-100 p-1.5 rounded-md">
                            <Save className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Edit Program</h2>
                            <p className="text-xs text-gray-500 mt-0.5">{program.program_name}</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`Edit ${program.program_name} - Program Management`} />

            <div className="max-w-4xl mx-auto space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>
                                Update the program's basic details and settings.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="program_name">Program Name</Label>
                                    <Input
                                        id="program_name"
                                        value={data.program_name}
                                        onChange={(e) => setData('program_name', e.target.value)}
                                        required
                                    />
                                    {errors.program_name && (
                                        <p className="text-sm text-red-600 mt-1">{errors.program_name}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="program_code">Program Code</Label>
                                    <Input
                                        id="program_code"
                                        value={data.program_code}
                                        onChange={(e) => setData('program_code', e.target.value)}
                                        required
                                    />
                                    {errors.program_code && (
                                        <p className="text-sm text-red-600 mt-1">{errors.program_code}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    placeholder="Enter program description..."
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="education_level">Education Level</Label>
                                <Select
                                    value={data.education_level}
                                    onValueChange={(value) => setData('education_level', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select education level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {educationLevels.map((level) => (
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
                        </CardContent>
                    </Card>

                    {/* Fee Structure */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Fee Structure</CardTitle>
                            <CardDescription>
                                Set semester fees for each year level. These fees will be automatically applied to regular students during enrollment.
                                {data.education_level === 'senior_high' ? ' (Senior High fees are annual)' : ''}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Array.from({ length: data.education_level === 'senior_high' ? 2 : data.education_level === 'masteral' ? 2 : 4 }, (_, i) => i + 1).map((year) => {
                                    const fee = data.program_fees.find(
                                        f => f.year_level === year && f.fee_type === 'regular'
                                    );
                                    const tuitionAmount = fee ? (fee.tuition_fee ?? fee.semester_fee ?? 0) : 0;
                                    const miscellaneousAmount = fee ? (fee.miscellaneous_fee ?? 0) : 0;
                                    const totalAmount = (parseFloat(tuitionAmount) || 0) + (parseFloat(miscellaneousAmount) || 0);

                                    return (
                                        <div key={year} className="p-3 border rounded-lg bg-gray-50 space-y-2">
                                            <Label className="text-sm font-medium w-24 flex-shrink-0">
                                                {data.education_level === 'senior_high' ? `Grade ${year + 10}` : `${year}${year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} Year`}:
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
                                                        className="pl-6 h-8 text-sm"
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
                                                        className="pl-6 h-8 text-sm"
                                                        placeholder="Miscellaneous fee"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-600">
                                                <span>{data.education_level === 'senior_high' ? 'per year level' : 'per semester'}</span>
                                                <span className="font-semibold text-green-700">Total: ₱{formatCurrency(totalAmount) || '0'}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {Object.keys(feeErrors).length > 0 && (
                                <Alert className="mt-4">
                                    <AlertDescription>
                                        Please check the fee fields for errors.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => window.history.back()}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    )
}
