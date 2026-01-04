import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Edit as EditIcon, User } from 'lucide-react';
import { toast } from 'sonner';

const Edit = ({ registrar }) => {
    const { data, setData, put, processing, errors } = useForm({
        first_name: registrar.name.split(' ')[0] || '',
        last_name: registrar.name.split(' ').slice(-1)[0] || '',
        middle_name: registrar.name.split(' ').slice(1, -1).join(' ') || '',
        email: registrar.email || '',
        is_active: registrar.is_active || false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('admin.registrars.update', registrar.id), {
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat().join(', ');
                toast.error(`Failed to update registrar: ${errorMessage}`, {
                    style: {
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                    },
                });
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm">
                            <Link href={route('admin.registrars.show', registrar.id)} className="flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Registrar
                            </Link>
                        </Button>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-100 p-1.5 rounded-md">
                                <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Edit Registrar</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Update registrar information and account details</p>
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`Edit ${registrar.name}`} />

            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <EditIcon className="w-5 h-5 mr-2" />
                                Edit Registrar Information
                            </CardTitle>
                            <CardDescription>
                                Modify the registrar's personal and account information.
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
                                            <Label htmlFor="email">Email Address *</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                placeholder="registrar@university.edu"
                                                className={errors.email ? 'border-red-500' : ''}
                                            />
                                            {errors.email && (
                                                <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="is_active">Status *</Label>
                                            <Select value={data.is_active ? 'active' : 'inactive'} onValueChange={(value) => setData('is_active', value === 'active')}>
                                                <SelectTrigger className={errors.is_active ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="inactive">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.is_active && (
                                                <p className="text-sm text-red-600 mt-1">{errors.is_active}</p>
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
                                        onClick={() => router.visit(route('admin.registrars.index'))}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        {processing ? 'Updating...' : 'Update Registrar'}
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

export default Edit;