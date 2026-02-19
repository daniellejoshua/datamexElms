import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
    ArrowLeft,
    Edit,
    Mail,
    Phone,
    Calendar,
    Building2,
    GraduationCap,
    User,
    UserCheck,
    UserX,
    MapPin,
    Clock
} from 'lucide-react';

const Show = ({ user, teacher }) => {
    const t = teacher || user.teacher || {};

    const getStatusBadge = (status) => {
        return status === 'active' ? (
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm">
                            <Link href={route('superadmin.users')} className="flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Back to Head Teachers</span>
                                <span className="sm:hidden">Back</span>
                            </Link>
                        </Button>
                        <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-100 p-1.5 rounded-md">
                                <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Head Teacher Details</h2>
                                <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">View head teacher information and assignments</p>
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`${t.first_name || user.name} ${t.last_name || ''} - Head Teacher`} />

            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                            <div className="flex flex-col items-center">
                                {t.profile_picture ? (
                                    <img
                                        src={t.profile_picture}
                                        alt={`${t.first_name} ${t.last_name}`}
                                        className="w-20 h-20 rounded-full object-cover border-4 border-gray-100 flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-white font-bold text-2xl">
                                            {(t.first_name || '').charAt(0)}{(t.last_name || '').charAt(0)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0 w-full text-center sm:text-left">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                    <div className="flex-1">
                                        <h1 className="text-2xl font-bold text-gray-900">
                                            {t.first_name || user.name} {t.middle_name ? t.middle_name + ' ' : ''}{t.last_name}
                                        </h1>
                                        <p className="text-lg text-gray-600 mt-1">
                                            Employee #{t.employee_number || user.formatted_employee_number || 'N/A'}
                                        </p>
                                        <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mt-2">
                                            {getStatusBadge(t.status || 'active')}
                                            {t.department && (
                                                <Badge variant="outline">
                                                    <Building2 className="w-3 h-3 mr-1" />
                                                    {t.department}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-center sm:justify-end mt-4 sm:mt-0">
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={route('superadmin.users.edit', user.id)}>
                                                <Edit className="w-4 h-4 mr-2" />
                                                Edit Head Teacher
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Keep other sections minimal for now (assignments etc. reuse admin's layout if needed) */}

            </div>
        </AuthenticatedLayout>
    );
};

export default Show;
