import React, { useState, useEffect, useCallback } from 'react';
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
    ChevronUp
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

    const { data, setData, put, processing, errors, reset } = useForm({
        first_name: '',
        last_name: '',
        middle_name: '',
        email: '',
        is_active: false,
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
        });
        setEditModalOpen(true);
    };

    const closeModals = () => {
        setViewModalOpen(false);
        setEditModalOpen(false);
        setSelectedRegistrar(null);
        reset();
    };

    const saveEditing = (registrarId) => {
        put(route('admin.registrars.update', registrarId), {
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
                    <DialogContent className="sm:max-w-md">
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
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-sm font-medium">Name</Label>
                                        <p className="text-sm text-gray-600 mt-1">{selectedRegistrar.name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Employee Number</Label>
                                        <p className="text-sm text-gray-600 mt-1 font-mono">{selectedRegistrar.employee_number || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Email</Label>
                                        <p className="text-sm text-gray-600 mt-1">{selectedRegistrar.email}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Status</Label>
                                        <div className="mt-1">
                                            {getStatusBadge(selectedRegistrar.is_active)}
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <Label className="text-sm font-medium">Created</Label>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {new Date(selectedRegistrar.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex justify-end">
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
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center">
                                <Edit className="w-5 h-5 mr-2" />
                                Edit Registrar
                            </DialogTitle>
                            <DialogDescription>
                                Update the registrar's information and status.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedRegistrar && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name">First Name</Label>
                                    <Input
                                        id="first_name"
                                        value={data.first_name}
                                        onChange={(e) => setData('first_name', e.target.value)}
                                        placeholder="First Name"
                                    />
                                    {errors.first_name && <p className="text-sm text-red-600">{errors.first_name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="middle_name">Middle Name (Optional)</Label>
                                    <Input
                                        id="middle_name"
                                        value={data.middle_name}
                                        onChange={(e) => setData('middle_name', e.target.value)}
                                        placeholder="Middle Name"
                                    />
                                    {errors.middle_name && <p className="text-sm text-red-600">{errors.middle_name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="last_name">Last Name</Label>
                                    <Input
                                        id="last_name"
                                        value={data.last_name}
                                        onChange={(e) => setData('last_name', e.target.value)}
                                        placeholder="Last Name"
                                    />
                                    {errors.last_name && <p className="text-sm text-red-600">{errors.last_name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="Email Address"
                                    />
                                    {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    {getStatusSelect(data.is_active)}
                                    {errors.is_active && <p className="text-sm text-red-600">{errors.is_active}</p>}
                                </div>

                                <div className="flex justify-end gap-2 pt-4">
                                    <Button variant="outline" onClick={closeModals}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => saveEditing(selectedRegistrar.id)}
                                        disabled={processing}
                                        className="bg-blue-600 hover:bg-blue-700"
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