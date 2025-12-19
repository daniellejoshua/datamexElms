import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const Create = () => {
    const page = usePage();

    useEffect(() => {
        if (page.props.flash?.success) {
            toast.success(page.props.flash.success);
        }
        if (page.props.errors?.error) {
            toast.error(page.props.errors.error);
        }
    }, [page.props.flash, page.props.errors]);

    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: '',
        last_name: '',
        middle_name: '',
        employee_number: '',
        email: '',
        department: '',
        specialization: '',
        hire_date: '',
        status: 'active',
    }, {
        onSuccess: () => {
            reset();
            setData('status', 'active'); // Ensure status remains active after reset
        },
        onError: () => {
            toast.error('Failed to create teacher. Please check the errors.');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.teachers.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm">
                            <Link href={route('admin.teachers.index')} className="flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Teachers
                            </Link>
                        </Button>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-100 p-1.5 rounded-md">
                                <UserPlus className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Add New Teacher</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Create a new teacher account and profile</p>
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Add Teacher" />

            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <UserPlus className="w-5 h-5 mr-2" />
                                Teacher Information
                            </CardTitle>
                            <CardDescription>
                                Fill in the details below to create a new teacher account. A default password will be set.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Personal Information */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Personal Information</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <Label htmlFor="first_name">First Name *</Label>
                                            <Input
                                                id="first_name"
                                                type="text"
                                                value={data.first_name}
                                                onChange={(e) => setData('first_name', e.target.value)}
                                                className={errors.first_name ? 'border-red-500' : ''}
                                            />
                                            {errors.first_name && (
                                                <p className="text-sm text-red-600 mt-1">{errors.first_name}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="middle_name">Middle Name</Label>
                                            <Input
                                                id="middle_name"
                                                type="text"
                                                value={data.middle_name}
                                                onChange={(e) => setData('middle_name', e.target.value)}
                                                className={errors.middle_name ? 'border-red-500' : ''}
                                            />
                                            {errors.middle_name && (
                                                <p className="text-sm text-red-600 mt-1">{errors.middle_name}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="last_name">Last Name *</Label>
                                            <Input
                                                id="last_name"
                                                type="text"
                                                value={data.last_name}
                                                onChange={(e) => setData('last_name', e.target.value)}
                                                className={errors.last_name ? 'border-red-500' : ''}
                                            />
                                            {errors.last_name && (
                                                <p className="text-sm text-red-600 mt-1">{errors.last_name}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Account Information */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Account Information</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="employee_number">Employee Number *</Label>
                                            <Input
                                                id="employee_number"
                                                type="text"
                                                value={data.employee_number}
                                                onChange={(e) => setData('employee_number', e.target.value)}
                                                placeholder="e.g., EMP001"
                                                className={errors.employee_number ? 'border-red-500' : ''}
                                            />
                                            {errors.employee_number && (
                                                <p className="text-sm text-red-600 mt-1">{errors.employee_number}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="email">Email Address *</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                placeholder="teacher@university.edu"
                                                className={errors.email ? 'border-red-500' : ''}
                                            />
                                            {errors.email && (
                                                <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-sm text-blue-800">
                                            <strong>Note:</strong> A default password of "password123" will be set for new accounts.
                                            Users should change their password upon first login.
                                        </p>
                                    </div>
                                </div>

                                {/* Professional Information */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Professional Information</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="department">Department</Label>
                                            <Input
                                                id="department"
                                                type="text"
                                                value={data.department}
                                                onChange={(e) => setData('department', e.target.value)}
                                                placeholder="e.g., Computer Science"
                                                className={errors.department ? 'border-red-500' : ''}
                                            />
                                            {errors.department && (
                                                <p className="text-sm text-red-600 mt-1">{errors.department}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="specialization">Specialization</Label>
                                            <Input
                                                id="specialization"
                                                type="text"
                                                value={data.specialization}
                                                onChange={(e) => setData('specialization', e.target.value)}
                                                placeholder="e.g., Machine Learning"
                                                className={errors.specialization ? 'border-red-500' : ''}
                                            />
                                            {errors.specialization && (
                                                <p className="text-sm text-red-600 mt-1">{errors.specialization}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="hire_date">Hire Date</Label>
                                            <Input
                                                id="hire_date"
                                                type="date"
                                                value={data.hire_date}
                                                onChange={(e) => setData('hire_date', e.target.value)}
                                                className={errors.hire_date ? 'border-red-500' : ''}
                                            />
                                            {errors.hire_date && (
                                                <p className="text-sm text-red-600 mt-1">{errors.hire_date}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="status">Status *</Label>
                                            <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                                <SelectTrigger disabled className={errors.status ? 'border-red-500' : ''}>
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
                                    </div>
                                </div>

                                {errors.error && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <p className="text-sm text-red-800">{errors.error}</p>
                                    </div>
                                )}

                                {/* Form Actions */}
                                <div className="flex items-center justify-end gap-4 pt-6 border-t">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.visit(route('admin.teachers.index'))}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        {processing ? 'Creating...' : 'Create Teacher'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Create;