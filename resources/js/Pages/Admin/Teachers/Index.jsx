import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Users,
    Plus,
    Search,
    Edit,
    Eye,
    Trash2,
    GraduationCap,
    Building2,
    UserCheck,
    UserX,
    Filter,
    Mail,
    Calendar,
    MoreHorizontal
} from 'lucide-react';

const Index = ({ teachers, departments, filters }) => {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [departmentFilter, setDepartmentFilter] = useState(filters.department || 'all');

    const handleSearch = () => {
        router.get(route('admin.teachers.index'), {
            search: searchTerm,
            status: statusFilter,
            department: departmentFilter,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleFilterChange = () => {
        handleSearch();
    };

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
                            <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Teachers</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Manage faculty members and assignments</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Teacher Management" />

            <div className="p-4 sm:p-6 lg:p-8 space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg transition-all duration-300">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-blue-800 flex items-center">
                                <Users className="w-4 h-4 mr-2" />
                                Total Teachers
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-blue-900">
                                {teachers.total || 0}
                            </div>
                            <p className="text-xs text-blue-600 mt-1">Faculty members</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-all duration-300">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-green-800 flex items-center">
                                <GraduationCap className="w-4 h-4 mr-2" />
                                Teaching Subjects
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-900">
                                {teachers.data?.reduce((total, teacher) => total + (teacher.active_subjects_count || 0), 0) || 0}
                            </div>
                            <p className="text-xs text-green-600 mt-1">Active subject assignments</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 hover:shadow-lg transition-all duration-300">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-orange-800 flex items-center">
                                <Building2 className="w-4 h-4 mr-2" />
                                Departments
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-orange-900">
                                {departments.length || 0}
                            </div>
                            <p className="text-xs text-orange-600 mt-1">Academic departments</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                            <Filter className="w-5 h-5 mr-2" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search teachers..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="pl-10"
                                />
                            </div>

                            <Select value={statusFilter} onValueChange={(value) => {
                                setStatusFilter(value);
                                setTimeout(handleFilterChange, 100);
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={departmentFilter} onValueChange={(value) => {
                                setDepartmentFilter(value);
                                setTimeout(handleFilterChange, 100);
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Departments" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {departments.map((dept) => (
                                        <SelectItem key={dept} value={dept}>
                                            {dept}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button asChild className="bg-blue-600 hover:bg-blue-700">
                                <Link href={route('admin.teachers.create')}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Teacher
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Teachers List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Teachers ({teachers.total || 0})</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {teachers.data && teachers.data.length > 0 ? (
                            <div className="grid gap-4">
                                {teachers.data.map((teacher) => (
                                    <div key={teacher.id} className="relative bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-blue-300 transition-all duration-300 group hover:-translate-y-1">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-4 flex-1">
                                                {/* Avatar with status indicator */}
                                                <div className="relative">
                                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                                                        <span className="text-white font-bold text-xl">
                                                            {teacher.first_name.charAt(0)}{teacher.last_name.charAt(0)}
                                                        </span>
                                                    </div>
                                                    {/* Status indicator */}
                                                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-sm ${
                                                        teacher.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'
                                                    }`}></div>
                                                </div>

                                                {/* Teacher Information */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                                {teacher.first_name} {teacher.middle_name ? teacher.middle_name + ' ' : ''}{teacher.last_name}
                                                            </h3>
                                                            <p className="text-sm text-gray-600 font-medium">
                                                                {teacher.employee_number}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Contact & Department Info */}
                                                    <div className="space-y-2 mb-3">
                                                        {teacher.user?.email && (
                                                            <div className="flex items-center text-sm text-gray-600">
                                                                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                                                {teacher.user.email}
                                                            </div>
                                                        )}
                                                        {teacher.department && (
                                                            <div className="flex items-center text-sm text-gray-600">
                                                                <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                                                                {teacher.department}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Badges */}
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {teacher.specialization && (
                                                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                                                <GraduationCap className="w-3 h-3 mr-1" />
                                                                {teacher.specialization}
                                                            </Badge>
                                                        )}
                                                        {getStatusBadge(teacher.status)}
                                                        {teacher.hire_date && (
                                                            <Badge variant="outline" className="text-xs">
                                                                <Calendar className="w-3 h-3 mr-1" />
                                                                Hired {new Date(teacher.hire_date).toLocaleDateString()}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Menu */}
                                            <div className="absolute top-4 right-4">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 hover:bg-gray-100"
                                                        >
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={route('admin.teachers.show', teacher.id)} className="flex items-center">
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                View Details
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={route('admin.teachers.edit', teacher.id)} className="flex items-center">
                                                                <Edit className="w-4 h-4 mr-2" />
                                                                Edit Teacher
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Users className="w-12 h-12 text-blue-600" />
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
        </AuthenticatedLayout>
    );
};

export default Index;