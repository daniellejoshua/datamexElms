import React, { useRef, useState, useEffect } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, UserPlus, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

const Create = () => {
    const page = usePage();
    const fileInputRef = useRef(null);
    const [imagePreview, setImagePreview] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: '',
        last_name: '',
        middle_name: '',
        email: '',
        profile_picture: null,
    }, {
        onSuccess: () => {
            reset();
            toast.success('Registrar created successfully!');
            router.visit(route('admin.registrars.index'));
        },
        onError: () => {
            toast.error('Failed to create registrar. Please check the errors.');
        }
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

        console.log('Submitting registrar creation with data:', submitData);

        post(route('admin.registrars.store'), {
            data: submitData,
            forceFormData: true, // This ensures file uploads work properly
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
                                <UserPlus className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Add New Registrar</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Create a new registrar account</p>
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Add Registrar" />

            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <UserPlus className="w-5 h-5 mr-2" />
                                Registrar Information
                            </CardTitle>
                            <CardDescription>
                                Fill in the details below to create a new registrar account. A default password will be set.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Profile Picture Preview */}
                            <div className="flex justify-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-300 transition-colors" onClick={handleProfilePictureClick}>
                                            {imagePreview ? (
                                                <img
                                                    src={imagePreview}
                                                    alt="Profile preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <UserPlus className="w-8 h-8 text-gray-400" />
                                            )}
                                        </div>
                                        {imagePreview && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setData('profile_picture', null);
                                                    setImagePreview(null);
                                                    if (fileInputRef.current) {
                                                        fileInputRef.current.value = '';
                                                    }
                                                }}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 font-medium">Profile Picture</p>
                                        <p className="text-xs text-gray-500">
                                            {imagePreview ? 'Click the image to change it' : 'Click the circle to upload an image'}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleProfilePictureClick}
                                            >
                                                <Upload className="w-4 h-4 mr-2" />
                                                Choose File
                                            </Button>
                                            {data.profile_picture && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setData('profile_picture', null);
                                                        setImagePreview(null);
                                                        if (fileInputRef.current) {
                                                            fileInputRef.current.value = '';
                                                        }
                                                    }}
                                                >
                                                    <X className="w-4 h-4 mr-2" />
                                                    Remove
                                                </Button>
                                            )}
                                        </div>
                                        {data.profile_picture && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Selected: {data.profile_picture.name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

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

                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-sm text-blue-800">
                                            <strong>Note:</strong> A default password of "password123" will be set for new accounts.
                                            Users should change their password upon first login.
                                        </p>
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
                                        {processing ? 'Creating...' : 'Create Registrar'}
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

export default Create;