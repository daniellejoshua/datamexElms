import React, { useState, useEffect, useCallback } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
    Users,
    Plus,
    Search,
    Edit,
    Eye,
    UserCheck,
    UserX,
    FileText,
    Menu,
} from 'lucide-react'
import { useForm } from '@inertiajs/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

// Debounce helper
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

export default function SuperAdminUsers({ teachers, departments, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '')
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all')
    const [showForm, setShowForm] = useState(false)

    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        password: '',
    }, {
        onSuccess: () => {
            reset();
            setShowForm(false);
        }
    })

    const debouncedSearch = useCallback(
        debounce(() => {
            router.get(route('superadmin.users'), {
                search: searchTerm,
                status: statusFilter,
            }, { preserveState: true, replace: true })
        }, 300),
        [searchTerm, statusFilter]
    )

    useEffect(() => { debouncedSearch() }, [searchTerm, statusFilter, debouncedSearch])

    const getStatusBadge = (status) => (
        status === 'active' ? (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold">
                <UserCheck className="w-3 h-3 mr-1" />
                Active
            </Badge>
        ) : (
            <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-300">
                <UserX className="w-3 h-3 mr-1" />
                Inactive
            </Badge>
        )
    )

    function submit(e) {
        e.preventDefault()
        post(route('superadmin.users.head-teacher.store'), {
            onError: () => {
                // keep form open on error
            }
        })
    }

    return (
        <AuthenticatedLayout
            header={(
                <div className="flex items-center px-2 py-1">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-1.5 rounded-md">
                            <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Head Teachers</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Manage head teacher accounts</p>
                        </div>
                    </div>
                </div>
            )}
        >
            <Head title="Manage Head Teachers" />

            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between mb-4">
                                <CardTitle className="flex items-center">
                                    <Users className="w-5 h-5 mr-2" />
                                    Head Teachers ({teachers.total || 0})
                                </CardTitle>
                                <div className="flex gap-2">
                                    <Dialog open={showForm} onOpenChange={setShowForm}>
                                    <div className="hidden md:flex gap-2">
                                        <DialogTrigger asChild>
                                            <Button className="bg-blue-600 hover:bg-blue-700">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Head Teacher
                                            </Button>
                                        </DialogTrigger>
                                    </div>

                                    <div className="md:hidden">
                                        <DialogTrigger asChild>
                                            <button className="p-2 rounded border">
                                                <Menu className="w-4 h-4" />
                                            </button>
                                        </DialogTrigger>
                                    </div>

                                    <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                            <DialogTitle>Create Head Teacher</DialogTitle>
                                        </DialogHeader>

                                        <div className="mt-4">
                                            <form onSubmit={submit} className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="text-xs font-medium">First name *</label>
                                                        <Input value={data.first_name} onChange={e => setData('first_name', e.target.value)} />
                                                        {errors.first_name && <div className="text-xs text-red-500">{errors.first_name}</div>}
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium">Middle name</label>
                                                        <Input value={data.middle_name} onChange={e => setData('middle_name', e.target.value)} />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium">Last name *</label>
                                                        <Input value={data.last_name} onChange={e => setData('last_name', e.target.value)} />
                                                        {errors.last_name && <div className="text-xs text-red-500">{errors.last_name}</div>}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-xs font-medium">Email *</label>
                                                        <Input value={data.email} onChange={e => setData('email', e.target.value)} />
                                                        {errors.email && <div className="text-xs text-red-500">{errors.email}</div>}
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium">Password *</label>
                                                        <Input type="password" value={data.password} onChange={e => setData('password', e.target.value)} />
                                                        {errors.password && <div className="text-xs text-red-500">{errors.password}</div>}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="md:col-span-3 text-right">
                                                        <Button type="submit" disabled={processing}>{processing ? 'Creating...' : 'Create Head Teacher'}</Button>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input placeholder="Search head teachers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 w-64" />
                                </div>

                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-48">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
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
                                                            {(teacher.profile_picture || teacher.teacher?.profile_picture) ? (
                                                                <img
                                                                    src={teacher.profile_picture || teacher.teacher?.profile_picture}
                                                                    alt={`${teacher.first_name || teacher.user?.name || teacher.name}`}
                                                                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                                                />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-gray-200">
                                                                    <span className="text-white font-semibold text-sm">
                                                                        {(teacher.first_name || (teacher.user?.name || teacher.name) || '').charAt(0) || ''}{(teacher.last_name || '').charAt(0) || ''}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            <div>
                                                                <div className="font-medium text-gray-900">
                                                                    {teacher.first_name || teacher.user?.name || teacher.name}
                                                                    {teacher.middle_name ? ` ${teacher.middle_name}` : ''}
                                                                    {teacher.last_name ? ` ${teacher.last_name}` : ''}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    <TableCell>
                                                        <div className="font-mono text-sm text-gray-600">{teacher.employee_number || teacher.teacher?.employee_number || teacher.user?.formatted_employee_number || 'N/A'}</div>
                                                    </TableCell>

                                                    <TableCell>
                                                        <div className="flex items-center text-sm text-gray-600">{teacher.user?.email || teacher.email}</div>
                                                    </TableCell>

                                                    <TableCell>{getStatusBadge(teacher.status || teacher.teacher?.status || 'active')}</TableCell>

                                                    <TableCell>{new Date(teacher.created_at || teacher.user?.created_at).toLocaleDateString()}</TableCell>

                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Button size="sm" variant="outline" asChild>
                                                                <Link href={route('superadmin.users.edit', teacher.id)}>
                                                                    <Edit className="w-3 h-3 mr-1" />
                                                                    Edit
                                                                </Link>
                                                            </Button>
                                                            <Button size="sm" variant="outline" asChild>
                                                                <Link href={route('superadmin.users.show', teacher.id)}>
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
                                        <Users className="w-12 h-12 text-blue-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No head teachers found</h3>
                                    <p className="text-gray-500 mb-6 max-w-md mx-auto">Try adjusting your filters or add your first head teacher.</p>
                                    <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />Add Head Teacher</Button>
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
                                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
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
    )
}
