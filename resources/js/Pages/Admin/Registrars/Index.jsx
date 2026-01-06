import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Users,
    Plus,
    Search,
    Edit,
    Eye,
    Trash2,
    UserCheck,
    UserX,
    Filter,
    Mail,
    Save,
    X,
    MoreHorizontal,
    ChevronDown,
    ChevronUp,
    Upload
} from 'lucide-react';
import { toast } from 'sonner';

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const Index = ({ registrars, filters }) => {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedRegistrar, setSelectedRegistrar] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    const { data, setData, put, processing, errors, reset } = useForm({
        first_name: '',
        last_name: '',
        middle_name: '',
        email: '',
        is_active: false,
        profile_picture: null,
    });

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce((search, status) => {
            router.get(route('admin.registrars.index'), {
                search: search,
                status: status,
            }, {
                preserveState: true,
                replace: true,
            });
        }, 300),
        []
    );

    // Effect to trigger search when filters change
    useEffect(() => {
        debouncedSearch(searchTerm, statusFilter);
    }, [searchTerm, statusFilter, debouncedSearch]);

    const openViewModal = (registrar) => {
        setSelectedRegistrar(registrar);
        setViewModalOpen(true);
    };

    const openEditModal = (registrar) => {
        const nameParts = registrar.name.split(' ');
        setSelectedRegistrar(registrar);
        setData({
            first_name: nameParts[0] || '',
            last_name: nameParts[nameParts.length - 1] || '',
            middle_name: nameParts.slice(1, -1).join(' ') || '',
            email: registrar.email || '',
            is_active: registrar.is_active || false,
            profile_picture: null,
        });
        setImagePreview(null);
        setEditModalOpen(true);
    };

    const closeModals = () => {
        setViewModalOpen(false);
        setEditModalOpen(false);
        setSelectedRegistrar(null);
        setImagePreview(null);
        reset();
    };

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

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const saveEditing = (registrarId) => {
        // Prepare data for submission, excluding null profile_picture
        const submitData = { ...data };
        if (submitData.profile_picture === null) {
            delete submitData.profile_picture;
        }

        put(route('admin.registrars.update', registrarId), {
            data: submitData,
            forceFormData: true,
            onSuccess: () => {
                closeModals();
                toast.success('Registrar updated successfully!');
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat().join(', ');
                toast.error(`Failed to update registrar: ${errorMessage}`);
            },
        });
    };

    const getStatusBadge = (isActive) => {
        return isActive ? (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold">
                <UserCheck className="w-3 h-3 mr-1" />
                Active
            </Badge>
        ) : (
            <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-300">
                <UserX className="w-3 h-3 mr-1" />
                Inactive
            </Badge>
        );
    };

    const getStatusSelect = (isActive) => {
        return (
            <Select
                value={data.is_active ? 'active' : 'inactive'}
                onValueChange={(value) => setData('is_active', value === 'active')}
            >
                <SelectTrigger className="w-32">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="active">
                        <div className="flex items-center">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Active
                        </div>
                    </SelectItem>
                    <SelectItem value="inactive">
                        <div className="flex items-center">
                            <UserX className="w-3 h-3 mr-1" />
                            Inactive
                        </div>
                    </SelectItem>
                </SelectContent>
            </Select>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center px-2 py-1">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-1.5 rounded-md">
                            <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Registrars</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Manage registrar accounts and permissions</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Registrar Management" />

            <div className="p-4 sm:p-6 lg:p-8">
                {/* Registrars Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between mb-4">
                            <CardTitle className="flex items-center">
                                <Users className="w-5 h-5 mr-2" />
                                Registrars ({registrars.total || 0})
                            </CardTitle>
                            <Button asChild className="bg-blue-600 hover:bg-blue-700">
                                <Link href={route('admin.registrars.create')}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Registrar
                                </Link>
                            </Button>
                        </div>

                        {/* Dynamic filters */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search by name or employee number..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        <div className="flex items-center gap-2">
                                            <Filter className="w-4 h-4 text-gray-500" />
                                            <span>All Status</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="active">
                                        <div className="flex items-center gap-2">
                                            <UserCheck className="w-4 h-4 text-green-600" />
                                            <span className="text-green-700 font-medium">Active</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="inactive">
                                        <div className="flex items-center gap-2">
                                            <UserX className="w-4 h-4 text-red-600" />
                                            <span className="text-red-700 font-medium">Inactive</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {registrars.data && registrars.data.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Employee Number</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead className="w-32">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {registrars.data.map((registrar) => (
                                            <TableRow key={registrar.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        {registrar.profile_picture ? (
                                                            <img
                                                                src={registrar.profile_picture}
                                                                alt={`${registrar.name}`}
                                                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-gray-200">
                                                                <span className="text-white font-semibold text-sm">
                                                                    {registrar.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2)}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-medium text-gray-900">
                                                                {registrar.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                Registrar Account
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-mono text-sm text-gray-600">
                                                        {registrar.employee_number || 'N/A'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                                        {registrar.email}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(registrar.is_active)}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(registrar.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => openEditModal(registrar)}
                                                        >
                                                            <Edit className="w-3 h-3 mr-1" />
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => openViewModal(registrar)}
                                                        >
                                                            <Eye className="w-3 h-3 mr-1" />
                                                            View
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Users className="w-12 h-12 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No registrars found</h3>
                                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                                    {filters.search || filters.status !== 'all'
                                        ? 'Try adjusting your filters or search terms to find registrars.'
                                        : 'Get started by adding your first registrar to the system.'
                                    }
                                </p>
                                {!filters.search && filters.status === 'all' && (
                                    <Button asChild className="bg-blue-600 hover:bg-blue-700">
                                        <Link href={route('admin.registrars.create')}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add First Registrar
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Pagination */}
                        {registrars.links && registrars.last_page > 1 && (
                            <div className="mt-6 flex justify-center">
                                <div className="flex space-x-1">
                                    {registrars.links.map((link, index) => (
                                        <Button
                                            key={index}
                                            variant={link.active ? "default" : "outline"}
                                            size="sm"
                                            asChild={!link.active && link.url}
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url)}
                                        >
                                            {link.active ? (
                                                <span>{link.label}</span>
                                            ) : (
                                                <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />
                                            )}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* View Modal */}
                <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center">
                                <Eye className="w-5 h-5 mr-2" />
                                View Registrar Details
                            </DialogTitle>
                            <DialogDescription>
                                Detailed information about the registrar account.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedRegistrar && (
                            <div className="space-y-4">
                                {/* Profile Picture Section */}
                                <div className="flex items-center justify-center">
                                    <div className="relative">
                                        {selectedRegistrar.profile_picture ? (
                                            <img
                                                src={selectedRegistrar.profile_picture}
                                                alt={`${selectedRegistrar.name}`}
                                                className="w-20 h-20 rounded-full object-cover border-4 border-gray-100"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center">
                                                <span className="text-gray-500 font-semibold text-lg">
                                                    {selectedRegistrar.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Basic Information */}
                                <div className="space-y-3">
                                    <div className="text-center">
                                        <h3 className="text-lg font-semibold text-gray-900">{selectedRegistrar.name}</h3>
                                        <p className="text-sm text-gray-500">Registrar Account</p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                                            <Label className="text-sm font-medium text-gray-600">Employee Number</Label>
                                            <span className="text-sm font-mono text-gray-900">{selectedRegistrar.employee_number || 'N/A'}</span>
                                        </div>

                                        <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                                            <Label className="text-sm font-medium text-gray-600">Email</Label>
                                            <span className="text-sm text-gray-900">{selectedRegistrar.email}</span>
                                        </div>

                                        <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                                            <Label className="text-sm font-medium text-gray-600">Status</Label>
                                            <div>{getStatusBadge(selectedRegistrar.is_active)}</div>
                                        </div>

                                        <div className="flex items-center justify-between py-1.5">
                                            <Label className="text-sm font-medium text-gray-600">Created</Label>
                                            <span className="text-sm text-gray-900">
                                                {new Date(selectedRegistrar.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-3 border-t">
                                    <Button variant="outline" onClick={closeModals}>
                                        Close
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Edit Modal */}
                <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center">
                                <Edit className="w-5 h-5 mr-2" />
                                Edit Registrar
                            </DialogTitle>
                            <DialogDescription>
                                Update the registrar's information and profile picture.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedRegistrar && (
                            <div className="space-y-4">
                                {/* Profile Picture Section */}
                                <div className="flex items-center justify-center">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center overflow-hidden">
                                            {imagePreview ? (
                                                <img
                                                    src={imagePreview}
                                                    alt="Profile preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : selectedRegistrar.profile_picture ? (
                                                <img
                                                    src={selectedRegistrar.profile_picture}
                                                    alt="Current profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-gray-500 font-semibold text-sm">
                                                    {selectedRegistrar.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2)}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleProfilePictureClick}
                                            className="absolute -bottom-1 -right-1 bg-gray-600 text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
                                        >
                                            <Edit className="w-2.5 h-2.5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="text-center -mt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleProfilePictureClick}
                                        className="text-xs h-7"
                                    >
                                        <Upload className="w-3 h-3 mr-1" />
                                        Change Picture
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
                                            className="ml-2 text-xs h-7"
                                        >
                                            <X className="w-3 h-3 mr-1" />
                                            Remove
                                        </Button>
                                    )}
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />

                                {/* Form Fields */}
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label htmlFor="first_name" className="text-sm">First Name</Label>
                                            <Input
                                                id="first_name"
                                                value={data.first_name}
                                                onChange={(e) => setData('first_name', e.target.value)}
                                                placeholder="First Name"
                                                className="h-8"
                                            />
                                            {errors.first_name && <p className="text-xs text-red-600">{errors.first_name}</p>}
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="last_name" className="text-sm">Last Name</Label>
                                            <Input
                                                id="last_name"
                                                value={data.last_name}
                                                onChange={(e) => setData('last_name', e.target.value)}
                                                placeholder="Last Name"
                                                className="h-8"
                                            />
                                            {errors.last_name && <p className="text-xs text-red-600">{errors.last_name}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="middle_name" className="text-sm">Middle Name (Optional)</Label>
                                        <Input
                                            id="middle_name"
                                            value={data.middle_name}
                                            onChange={(e) => setData('middle_name', e.target.value)}
                                            placeholder="Middle Name"
                                            className="h-8"
                                        />
                                        {errors.middle_name && <p className="text-xs text-red-600">{errors.middle_name}</p>}
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="email" className="text-sm">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="Email Address"
                                            className="h-8"
                                        />
                                        {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-sm">Status</Label>
                                        {getStatusSelect(data.is_active)}
                                        {errors.is_active && <p className="text-xs text-red-600">{errors.is_active}</p>}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-3 border-t">
                                    <Button variant="outline" onClick={closeModals} size="sm">
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => saveEditing(selectedRegistrar.id)}
                                        disabled={processing}
                                        size="sm"
                                    >
                                        {processing ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AuthenticatedLayout>
    );
};

export default Index;