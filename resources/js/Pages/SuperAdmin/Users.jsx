import { Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { useState } from 'react'
import { useForm } from '@inertiajs/react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function SuperAdminUsers({ users, filters }) {
    const [showForm, setShowForm] = useState(false)
    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: '',
        last_name: '',
        middle_name: '',
        email: '',
        department: '',
        hire_date: '',
        status: 'active',
    })

    function submit(e) {
        e.preventDefault()
        post(route('superadmin.users.head-teacher.store'), {
            onSuccess: () => {
                reset()
                setShowForm(false)
            }
        })
    }

    return (
        <AuthenticatedLayout
            header={<div className="flex items-center gap-2"><h2 className="text-lg font-semibold">Super Admin — Users</h2></div>}
        >
            <Head title="Super Admin - Users" />

            <div className="p-6 lg:p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Users</h3>
                    <div>
                        <Button onClick={() => setShowForm(s => !s)}>{showForm ? 'Close' : 'Add Head Teacher'}</Button>
                    </div>
                </div>

                {showForm && (
                    <Card>
                        <CardContent>
                            <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium">First name</label>
                                    <input value={data.first_name} onChange={e => setData('first_name', e.target.value)} className="w-full border rounded px-2 py-1" />
                                    {errors.first_name && <div className="text-xs text-red-500">{errors.first_name}</div>}
                                </div>

                                <div>
                                    <label className="text-xs font-medium">Last name</label>
                                    <input value={data.last_name} onChange={e => setData('last_name', e.target.value)} className="w-full border rounded px-2 py-1" />
                                    {errors.last_name && <div className="text-xs text-red-500">{errors.last_name}</div>}
                                </div>

                                <div>
                                    <label className="text-xs font-medium">Email</label>
                                    <input value={data.email} onChange={e => setData('email', e.target.value)} className="w-full border rounded px-2 py-1" />
                                    {errors.email && <div className="text-xs text-red-500">{errors.email}</div>}
                                </div>

                                <div>
                                    <label className="text-xs font-medium">Department</label>
                                    <input value={data.department} onChange={e => setData('department', e.target.value)} className="w-full border rounded px-2 py-1" />
                                </div>

                                <div>
                                    <label className="text-xs font-medium">Hire date</label>
                                    <input type="date" value={data.hire_date} onChange={e => setData('hire_date', e.target.value)} className="w-full border rounded px-2 py-1" />
                                </div>

                                <div>
                                    <label className="text-xs font-medium">Status</label>
                                    <select value={data.status} onChange={e => setData('status', e.target.value)} className="w-full border rounded px-2 py-1">
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>

                                <div className="sm:col-span-2 text-right">
                                    <Button type="submit" disabled={processing}>{processing ? 'Creating...' : 'Create Head Teacher'}</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">All users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3">
                            {users.data?.map(u => (
                                <div key={u.id} className="flex items-center justify-between p-3 border rounded">
                                    <div>
                                        <div className="font-medium">{u.name}</div>
                                        <div className="text-xs text-gray-500">{u.email} • {u.role}</div>
                                    </div>
                                    <div className="text-xs text-gray-400">{u.created_at}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    )
}
