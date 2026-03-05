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
    MoreHorizontal,
} from 'lucide-react'
import { useForm } from '@inertiajs/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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

export default function SuperAdminUsers({ users, departments, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '')
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all')
    const [roleFilter, setRoleFilter] = useState(filters.role || 'all')
    const [showForm, setShowForm] = useState(false)
    const [showEmailForm, setShowEmailForm] = useState(false)
    const [selectedUserForEmail, setSelectedUserForEmail] = useState(null)

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

    const {
        data: emailData,
        setData: setEmailData,
        patch: patchEmail,
        processing: emailProcessing,
        errors: emailErrors,
        reset: resetEmail,
        clearErrors: clearEmailErrors,
    } = useForm({
        email: '',
    })

    const debouncedSearch = useCallback(
        debounce(() => {
            router.get(route('superadmin.users'), {
                search: searchTerm,
                status: statusFilter,
                role: roleFilter,
            }, { preserveState: true, replace: true })
        }, 300),
        [searchTerm, statusFilter, roleFilter]
    )

    useEffect(() => { debouncedSearch() }, [searchTerm, statusFilter, roleFilter, debouncedSearch])

    const getStatusBadge = (isActive) => (
        isActive ? (
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

    const getDisplayName = (user) => {
        if ((user.role === 'head_teacher' || user.role === 'teacher') && user.teacher) {
            return [user.teacher.first_name, user.teacher.middle_name, user.teacher.last_name].filter(Boolean).join(' ')
        }

        if (user.role === 'student' && user.student) {
            return [user.student.first_name, user.student.middle_name, user.student.last_name].filter(Boolean).join(' ')
        }

        return user.name
    }

    const getIdentifier = (user) => {
        if ((user.role === 'head_teacher' || user.role === 'teacher') && user.teacher?.employee_number) {
            return user.teacher.employee_number
        }

        if (user.role === 'student' && user.student?.student_number) {
            return user.student.student_number
        }

        return user.employee_number || 'N/A'
    }

    const handleStatusUpdate = (userId, status) => {
        router.patch(route('superadmin.users.update-status', userId), {
            is_active: status === 'active',
        }, {
            preserveState: true,
            preserveScroll: true,
        })
    }

    const openEmailEditor = (user) => {
        setSelectedUserForEmail(user)
        setEmailData('email', user.email || '')
        clearEmailErrors()
        setShowEmailForm(true)
    }

    const submitEmailUpdate = (e) => {
        e.preventDefault()
        if (!selectedUserForEmail) return

        patchEmail(route('superadmin.users.update-email', selectedUserForEmail.id), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setShowEmailForm(false)
                setSelectedUserForEmail(null)
                resetEmail()
            },
        })
    }

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
                            <h2 className="text-lg font-semibold text-gray-900">User Governance</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Manage all ELMS user accounts and statuses</p>
                        </div>
                    </div>
                </div>
            )}
        >
            <Head title="User Governance" />

            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between mb-4">
                                <CardTitle className="flex items-center">
                                    <Users className="w-5 h-5 mr-2" />
                                    User Governance ({users.total || 0})
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
                                    <Input placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 w-64" />
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

                                <Select value={roleFilter} onValueChange={setRoleFilter}>
                                    <SelectTrigger className="w-48">
                                        <SelectValue placeholder="Filter by role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Roles</SelectItem>
                                        <SelectItem value="student">Student</SelectItem>
                                        <SelectItem value="teacher">Teacher</SelectItem>
                                        <SelectItem value="head_teacher">Head Teacher</SelectItem>
                                        <SelectItem value="registrar">Registrar</SelectItem>
                                    </SelectContent>
                                </Select>


                            </div>
                        </CardHeader>
                        <CardContent>
                            <Dialog
                                open={showEmailForm}
                                onOpenChange={(open) => {
                                    setShowEmailForm(open)
                                    if (!open) {
                                        setSelectedUserForEmail(null)
                                        resetEmail()
                                        clearEmailErrors()
                                    }
                                }}
                            >
                                <DialogContent className="max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Edit User Email</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={submitEmailUpdate} className="space-y-4 mt-2">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-700">User</label>
                                            <div className="text-sm text-gray-600">
                                                {selectedUserForEmail ? getDisplayName(selectedUserForEmail) : '-'}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-700">Email</label>
                                            <Input
                                                type="email"
                                                value={emailData.email}
                                                onChange={(e) => setEmailData('email', e.target.value)}
                                                placeholder="Enter new email"
                                                required
                                            />
                                            {emailErrors.email && <div className="text-xs text-red-500">{emailErrors.email}</div>}
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setShowEmailForm(false)}
                                                disabled={emailProcessing}
                                            >
                                                Cancel
                                            </Button>
                                            <Button type="submit" disabled={emailProcessing}>
                                                {emailProcessing ? 'Saving...' : 'Save Email'}
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>


                            {users.data && users.data.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Identifier</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Account Status</TableHead>
                                                <TableHead className="w-32">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {users.data.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell>
                                                        <div className="font-medium text-gray-900">
                                                            {getDisplayName(user)}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Badge variant="secondary" className="capitalize">{(user.role || '').replace('_', ' ')}</Badge>
                                                    </TableCell>

                                                    <TableCell>
                                                        <div className="font-mono text-sm text-gray-600">{getIdentifier(user)}</div>
                                                    </TableCell>

                                                    <TableCell>
                                                        <div className="flex items-center text-sm text-gray-600">{user.email}</div>
                                                    </TableCell>

                                                    <TableCell>
                                                        {getStatusBadge(user.is_active)}
                                                    </TableCell>

                                                    <TableCell>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                    <span className="sr-only">Open menu</span>
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => openEmailEditor(user)}>
                                                                    <Edit className="w-4 h-4 mr-2" />
                                                                    Edit Email
                                                                </DropdownMenuItem>
                                                                {user.role === 'head_teacher' && (
                                                                    <>
                                                                        <DropdownMenuItem asChild>
                                                                            <Link href={route('superadmin.users.edit', user.id)}>
                                                                                <Edit className="w-4 h-4 mr-2" />
                                                                                Edit
                                                                            </Link>
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem asChild>
                                                                            <Link href={route('superadmin.users.show', user.id)}>
                                                                                <Eye className="w-4 h-4 mr-2" />
                                                                                View
                                                                            </Link>
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )}
                                                                {user.is_active ? (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleStatusUpdate(user.id, 'inactive')}
                                                                        className="text-red-600"
                                                                    >
                                                                        <UserX className="w-4 h-4 mr-2" />
                                                                        Deactivate
                                                                    </DropdownMenuItem>
                                                                ) : (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleStatusUpdate(user.id, 'active')}
                                                                        className="text-green-600"
                                                                    >
                                                                        <UserCheck className="w-4 h-4 mr-2" />
                                                                        Activate
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
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
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No users found</h3>
                                    <p className="text-gray-500 mb-6 max-w-md mx-auto">Try adjusting your filters or add a head teacher account.</p>
                                    <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />Add Head Teacher</Button>
                                </div>
                            )}

                            {/* Pagination */}
                            {users.links && users.last_page > 1 && (
                                <div className="mt-6 flex justify-center">
                                    <div className="flex space-x-1">
                                        {users.links.map((link, index) => (
                                            <Button
                                                key={index}
                                                variant={link.active ? "default" : "outline"}
                                                size="sm"
                                                asChild={!link.active && !!link.url}
                                                disabled={!link.url}
                                                onClick={() => link.url && router.get(link.url)}
                                            >
                                                {link.active ? (
                                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                                ) : link.url ? (
                                                    <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />
                                                ) : (
                                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
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
