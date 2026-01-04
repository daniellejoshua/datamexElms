import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    Edit,
    Mail,
    User,
    UserCheck,
    UserX,
    Calendar
} from 'lucide-react';

const Show = ({ registrar }) => {
    const getStatusBadge = (isActive) => {
        return isActive ? (
            <Badge className="bg-green-100 text-green-800 border-green-200">
                <UserCheck className="w-3 h-3 mr-1" />
                Active
            </Badge>
        ) : (
            <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
                <UserX className="w-3 h-3 mr-1" />
                Inactive
            </Badge>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm">
                            <Link href={route('admin.registrars.index')} className="flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Registrars
                            </Link>
                        </Button>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-100 p-1.5 rounded-md">
                                <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Registrar Details</h2>
                                <p className="text-xs text-gray-500 mt-0.5">View registrar information and account details</p>
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`${registrar.name} - Registrar Details`} />

            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Registrar Profile Header */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-6">
                            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-2xl">
                                    {registrar.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2)}
                                </span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900">
                                            {registrar.name}
                                        </h1>
                                        <p className="text-lg text-gray-600 mt-1">
                                            Registrar Account
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            {getStatusBadge(registrar.is_active)}
                                        </div>
                                    </div>

                                    <Button asChild variant="outline" size="sm">
                                        <Link href={route('admin.registrars.edit', registrar.id)}>
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit Registrar
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Account Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <User className="w-5 h-5 mr-2" />
                            Account Information
                        </CardTitle>
                        <CardDescription>
                            Registrar account details and contact information
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Email Address</label>
                                    <div className="flex items-center mt-1">
                                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="text-gray-900">{registrar.email}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Account Status</label>
                                    <div className="mt-1">
                                        {getStatusBadge(registrar.is_active)}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Account Created</label>
                                    <div className="flex items-center mt-1">
                                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="text-gray-900">{formatDate(registrar.created_at)}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Last Updated</label>
                                    <div className="flex items-center mt-1">
                                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="text-gray-900">{formatDate(registrar.updated_at)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Actions</CardTitle>
                        <CardDescription>
                            Manage this registrar account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-3">
                            <Button asChild variant="outline">
                                <Link href={route('admin.registrars.edit', registrar.id)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Registrar
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
};

export default Show;