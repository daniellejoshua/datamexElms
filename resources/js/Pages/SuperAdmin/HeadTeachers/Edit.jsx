import React, { useRef, useState, useEffect } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Save, Edit as EditIcon, User, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const Edit = ({ user, teacher, student }) => {
    const fileInputRef = useRef(null);
    const [imagePreview, setImagePreview] = useState(null);

    // Determine user type and get appropriate data
    const userType = user.role;
    const profileData = teacher || student || {};
    const isTeacher = userType === 'teacher' || userType === 'head_teacher';
    const isStudent = userType === 'student';

    const getRoleDisplay = () => {
        return user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
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

    // Format hire_date for date input (yyyy-MM-dd)
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    const { data, setData, put, processing, errors } = useForm({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        middle_name: profileData.middle_name || '',
        email: user?.email || '',
        department: profileData.department || '',
        specialization: profileData.specialization || '',
        hire_date: formatDateForInput(profileData.hire_date),
        status: profileData.status || 'active',
        profile_picture: null,
    });

    const handleProfilePictureClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setData('profile_picture', file);

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target.result);
            reader.readAsDataURL(file);
        } else {
            setImagePreview(null);
        }
    };

    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const handleSubmit = (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('_method', 'PUT');

        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });

        router.post(route('superadmin.users.update', user.id), formData, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Head teacher updated successfully!');
            },
            onError: () => {
                toast.error('Failed to update head teacher');
            }
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm">
                            <Link href={route('superadmin.users.show', user.id)} className="flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Back to {getRoleDisplay()}</span>
                                <span className="sm:hidden">Back</span>
                            </Link>
                        </Button>
                        <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-100 p-1.5 rounded-md">
                                <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Edit {getRoleDisplay()}</h2>
                                <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">Update user account and profile</p>
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`Edit ${getDisplayName()}`} />

            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <EditIcon className="w-5 h-5 mr-2" />
                                Edit {getRoleDisplay()} Information
                            </CardTitle>
                            <CardDescription>
                                Modify head teacher personal, account, and professional information.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label>First name *</Label>
                                        <Input value={data.first_name} onChange={e => setData('first_name', e.target.value)} />
                                        {errors.first_name && <p className="text-sm text-red-600 mt-1">{errors.first_name}</p>}
                                    </div>
                                    <div>
                                        <Label>Middle name</Label>
                                        <Input value={data.middle_name} onChange={e => setData('middle_name', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label>Last name *</Label>
                                        <Input value={data.last_name} onChange={e => setData('last_name', e.target.value)} />
                                        {errors.last_name && <p className="text-sm text-red-600 mt-1">{errors.last_name}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Email *</Label>
                                        <Input value={data.email} onChange={e => setData('email', e.target.value)} />
                                        {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
                                    </div>
                                    <div>
                                        <Label>Status *</Label>
                                        <Select value={data.status} onValueChange={v => setData('status', v)}>
                                            <SelectTrigger className="h-10">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-4 pt-6 border-t">
                                    <Button type="button" variant="outline" onClick={() => router.visit(route('superadmin.users'))}>Cancel</Button>
                                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={processing}><Save className="w-4 h-4 mr-2" />{processing ? 'Updating...' : 'Update Head Teacher'}</Button>
                                </div>
                            </form>

                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Edit;
