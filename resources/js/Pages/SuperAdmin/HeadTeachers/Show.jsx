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

const Show = ({ user, teacher, student }) => {
    // Determine user type and get appropriate data
    const userType = user.role;
    const profileData = teacher || student || {};
    const isTeacher = userType === 'teacher' || userType === 'head_teacher';
    const isStudent = userType === 'student';

    const getStatusBadge = (status) => {
        return status === 'active' || user.is_active ? (
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

    const getDisplayName = () => {
        if (isTeacher && profileData.first_name) {
            return `${profileData.first_name} ${profileData.middle_name || ''} ${profileData.last_name}`.trim();
        }
        if (isStudent && profileData.first_name) {
            return `${profileData.first_name} ${profileData.middle_name || ''} ${profileData.last_name}`.trim();
        }
        return user.name;
    };

    const getIdentifier = () => {
        if (isTeacher && profileData.employee_number) {
            return `Employee #${profileData.employee_number}`;
        }
        if (isStudent && profileData.student_number) {
            return `Student #${profileData.student_number}`;
        }
        return user.email;
    };

    const getRoleDisplay = () => {
        return user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm">
                            <Link href={route('superadmin.users')} className="flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Back to User Governance</span>
                                <span className="sm:hidden">Back</span>
                            </Link>
                        </Button>
                        <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-100 p-1.5 rounded-md">
                                <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">{getRoleDisplay()} Details</h2>
                                <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">View user information and details</p>
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`${getDisplayName()} - ${getRoleDisplay()}`} />

            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                            <div className="flex flex-col items-center">
                                {profileData.profile_picture ? (
                                    <img
                                        src={profileData.profile_picture}
                                        alt={getDisplayName()}
                                        className="w-20 h-20 rounded-full object-cover border-4 border-gray-100 flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-white font-bold text-2xl">
                                            {(getDisplayName() || '').split(' ').map(n => n.charAt(0)).join('').slice(0, 2)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0 w-full text-center sm:text-left">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                    <div className="flex-1">
                                        <h1 className="text-2xl font-bold text-gray-900">
                                            {getDisplayName()}
                                        </h1>
                                        <p className="text-lg text-gray-600 mt-1">
                                            {getIdentifier()}
                                        </p>
                                        <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mt-2">
                                            {getStatusBadge(user.is_active)}
                                            <Badge variant="outline">
                                                {getRoleDisplay()}
                                            </Badge>
                                            {isTeacher && profileData.department && (
                                                <Badge variant="outline">
                                                    <Building2 className="w-3 h-3 mr-1" />
                                                    {profileData.department}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-center sm:justify-end mt-4 sm:mt-0">
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={route('superadmin.users.edit', user.id)}>
                                                <Edit className="w-4 h-4 mr-2" />
                                                Edit {getRoleDisplay()}
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
