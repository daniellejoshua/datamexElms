import React, { useRef, useState, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Edit as EditIcon, User } from 'lucide-react';
import { toast } from 'sonner';

const Edit = ({ teacher }) => {
    const fileInputRef = useRef(null);
    const [imagePreview, setImagePreview] = useState(null);
    // Format hire_date for date input (yyyy-MM-dd)
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    const { data, setData, put, processing, errors } = useForm({
        first_name: teacher.first_name || '',
        last_name: teacher.last_name || '',
        middle_name: teacher.middle_name || '',
        email: teacher.user?.email || '',
        department: teacher.department || '',
        specialization: teacher.specialization || '',
        hire_date: formatDateForInput(teacher.hire_date),
        status: teacher.status || 'active',
        profile_picture: null,
    });

    const handleProfilePictureClick = () => {
        fileInputRef.current?.click();
    };

    // Handle file selection and create preview
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

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const handleSubmit = (e) => {
        e.preventDefault();

        console.log('Form data before submission:', data);

        // Prepare data for submission, excluding null profile_picture
        const submitData = { ...data };
        if (submitData.profile_picture === null) {
            delete submitData.profile_picture;
        }

        console.log('Submitting teacher update with data:', submitData);

        // Create FormData for submission
        const formData = new FormData();
        Object.entries(submitData).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                formData.append(key, value);
            }
        });
        formData.append('_method', 'PUT'); // Spoof PUT method

        console.log('FormData contents:');
        for (let [key, value] of formData.entries()) {
            console.log(key, value);
        }

        console.log('Submitting to URL:', route('admin.teachers.update', teacher.id));

        // Use fetch to send FormData as POST with _method
        fetch(route('admin.teachers.update', teacher.id), {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'X-Requested-With': 'XMLHttpRequest',
                'X-Inertia': 'true',
            },
        })
        .then(response => {
            if (response.redirected || response.status === 302) {
                console.log('Success response: redirect');
                toast.success('Teacher updated successfully!', {
                    style: {
                        background: '#f0fdf4',
                        color: '#166534',
                        border: '1px solid #bbf7d0',
                    },
                });
                router.visit(route('admin.teachers.show', teacher.id));
            } else {
                return response.json().then(data => {
                    if (data.errors) {
                        console.log('Error response:', data.errors);
                        const errorMessage = Object.values(data.errors).flat().join(', ');
                        toast.error(`Failed to update teacher: ${errorMessage}`, {
                            style: {
                                background: '#fef2f2',
                                color: '#dc2626',
                                border: '1px solid #fecaca',
                            },
                        });
                    } else {
                        console.log('Success response:', data);
                        toast.success('Teacher updated successfully!', {
                            style: {
                                background: '#f0fdf4',
                                color: '#166534',
                                border: '1px solid #bbf7d0',
                            },
                        });
                        router.visit(route('admin.teachers.show', teacher.id));
                    }
                });
            }
        })
        .catch(error => {
            console.log('Fetch error:', error);
            toast.error('An error occurred while updating the teacher.', {
                style: {
                    background: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                },
            });
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm">
                            <Link href={route('admin.teachers.show', teacher.id)} className="flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Teacher
                            </Link>
                        </Button>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-100 p-1.5 rounded-md">
                                <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Edit Teacher</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Update teacher information and account details</p>
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`Edit ${teacher.first_name} ${teacher.last_name}`} />

            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <EditIcon className="w-5 h-5 mr-2" />
                                Edit Teacher Information
                            </CardTitle>
                            <CardDescription>
                                Modify the teacher's personal, account, and professional information.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Profile Picture Preview */}
                            <div className="flex justify-start mb-6">
                                <div className="flex items-center gap-4">
                                    {imagePreview ? (
                                        <img
                                            src={imagePreview}
                                            alt="Profile preview"
                                            className="w-20 h-20 rounded-full object-cover border-4 border-gray-100 cursor-pointer hover:border-blue-300 transition-colors"
                                            onClick={handleProfilePictureClick}
                                            title="Click to change profile picture"
                                        />
                                    ) : teacher.profile_picture ? (
                                        <img
                                            src={teacher.profile_picture}
                                            alt={`${teacher.first_name} ${teacher.last_name}`}
                                            className="w-20 h-20 rounded-full object-cover border-4 border-gray-100 cursor-pointer hover:border-blue-300 transition-colors"
                                            onClick={handleProfilePictureClick}
                                            title="Click to update profile picture"
                                        />
                                    ) : (
                                        <div
                                            className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-4 border-gray-100 cursor-pointer hover:border-blue-300 transition-colors"
                                            onClick={handleProfilePictureClick}
                                            title="Click to upload profile picture"
                                        >
                                            <span className="text-white font-bold text-xl">
                                                {teacher.first_name.charAt(0)}{teacher.last_name.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm text-gray-600 font-medium">Profile Picture</p>
                                        <p className="text-xs text-gray-500">
                                            {imagePreview ? 'Click the image to change it' : teacher.profile_picture ? 'Click the image to update it' : 'Click the circle to upload an image'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-6">
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
                                                placeholder="teacher@university.edu"
                                                className={errors.email ? 'border-red-500' : ''}
                                            />
                                            {errors.email && (
                                                <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                                            )}
                                        </div>
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
                                                <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
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
                                        {processing ? 'Updating...' : 'Update Teacher'}
                                    </Button>
                                </div>
                            </form>

                            {/* Hidden file input for profile picture */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Edit;