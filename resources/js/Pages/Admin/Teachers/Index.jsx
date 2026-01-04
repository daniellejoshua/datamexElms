import React, { useState, useEffect, useCallback } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Users,
    Plus,
    Search,
    Edit,
    Eye,
    UserCheck,
    UserX,
    Filter,
    Mail,
    GraduationCap
} from 'lucide-react';

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

const Index = ({ teachers, departments, filters }) => {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce(() => {
            router.get(route('admin.teachers.index'), {
                search: searchTerm,
                status: statusFilter,
            }, {
                preserveState: true,
                replace: true,
            });
        }, 300),
        [searchTerm, statusFilter]
    );

    useEffect(() => {
        debouncedSearch();
    }, [searchTerm, statusFilter, debouncedSearch]);

    const getStatusBadge = (status) => {
        return status === 'active' ? (
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

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center px-2 py-1">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-1.5 rounded-md">
                            <GraduationCap className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Teachers</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Manage faculty members and assignments</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Teachers Management" />

            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between mb-4">
                                <CardTitle className="flex items-center">
                                    <Users className="w-5 h-5 mr-2" />
                                    Teachers ({teachers.total || 0})
                                </CardTitle>
                                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                                    <Link href={route('admin.teachers.create')}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Teacher
                                    </Link>
                                </Button>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="Search teachers..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 w-64"
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
                            {teachers.data && teachers.data.length > 0 ? (
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
                                            {teachers.data.map((teacher) => (
                                                <TableRow key={teacher.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            {teacher.profile_picture ? (
                                                                <img
                                                                    src={teacher.profile_picture}
                                                                    alt={`${teacher.first_name} ${teacher.last_name}`}
                                                                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                                                />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-gray-200">
                                                                    <span className="text-white font-semibold text-sm">
                                                                        {teacher.first_name.charAt(0)}{teacher.last_name.charAt(0)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="font-medium text-gray-900">
                                                                    {teacher.first_name} {teacher.middle_name ? teacher.middle_name + ' ' : ''}{teacher.last_name}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-mono text-sm text-gray-600">
                                                            {teacher.employee_number || teacher.user?.formatted_employee_number || 'N/A'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                                            {teacher.user?.email}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getStatusBadge(teacher.status)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(teacher.created_at).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                asChild
                                                            >
                                                                <Link href={route('admin.teachers.edit', teacher.id)}>
                                                                    <Edit className="w-3 h-3 mr-1" />
                                                                    Edit
                                                                </Link>
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                asChild
                                                            >
                                                                <Link href={route('admin.teachers.show', teacher.id)}>
                                                                    <Eye className="w-3 h-3 mr-1" />
                                                                    View
                                                                </Link>
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
                                        <GraduationCap className="w-12 h-12 text-blue-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No teachers found</h3>
                                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                                        {filters.search || filters.status !== 'all' || filters.department !== 'all'
                                            ? 'Try adjusting your filters or search terms to find teachers.'
                                            : 'Get started by adding your first teacher to the system.'
                                        }
                                    </p>
                                    {!filters.search && filters.status === 'all' && filters.department === 'all' && (
                                        <Button asChild className="bg-blue-600 hover:bg-blue-700">
                                            <Link href={route('admin.teachers.create')}>
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add First Teacher
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Pagination */}
                            {teachers.links && teachers.last_page > 1 && (
                                <div className="mt-6 flex justify-center">
                                    <div className="flex space-x-1">
                                        {teachers.links.map((link, index) => (
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
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Index;