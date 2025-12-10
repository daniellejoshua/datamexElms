import { Head, Link, useForm } from '@inertiajs/react'
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

    const { data, setData, put, processing, errors, reset } = useForm({
        program_name: program.program_name || '',
        program_code: program.program_code || '',
        description: program.description || '',
        education_level: program.education_level || '',
        program_fees: program.program_fees || [],
    });

    const educationLevels = [
        { value: 'college', label: 'College' },
        { value: 'shs', label: 'Senior High School' },
    ];

    // Initialize program fees if empty
    useEffect(() => {
        if (program && (!data.program_fees || data.program_fees.length === 0)) {
            const defaultFees = [];
            // Create fees for each year level (1-4 for bachelor's, 1-2 for master's)
            const maxYears = data.education_level === 'masteral' ? 2 : 4;

            for (let year = 1; year <= maxYears; year++) {
                defaultFees.push({
                    year_level: year,
                    fee_type: 'regular',
                    semester_fee: 0,
                });
            }
            setData('program_fees', defaultFees);
        }
    }, [data.education_level, program]);

    const updateFee = (yearLevel, amount) => {
        const numericAmount = amount === '' ? 0 : parseFloat(amount) || 0;
        const updatedFees = data.program_fees.map(fee =>
            fee.year_level === yearLevel && fee.fee_type === 'regular'
                ? { ...fee, semester_fee: numericAmount }
                : fee
        );
        setData('program_fees', updatedFees);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFeeErrors({});

        try {
            await put(route('registrar.programs.update', program.id), {
                onSuccess: () => {
                    window.location.href = route('registrar.programs.show', program.id);
                },
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
                                Back to Program
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
                    <Card>
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
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Array.from({ length: data.education_level === 'masteral' ? 2 : 4 }, (_, i) => i + 1).map((year) => {
                                    const fee = data.program_fees.find(
                                        f => f.year_level === year && f.fee_type === 'regular'
                                    );
                                    const amount = fee ? fee.semester_fee : 0;

                                    return (
                                        <div key={year} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                                            <Label className="text-sm font-medium w-24 flex-shrink-0">
                                                {year}{year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} Year:
                                            </Label>
                                            <div className="relative flex-1 max-w-32">
                                                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">
                                                    ₱
                                                </span>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={amount || ''}
                                                    onChange={(e) => updateFee(year, e.target.value)}
                                                    className="pl-6 h-8 text-sm"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <span className="text-xs text-gray-500">per semester</span>
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