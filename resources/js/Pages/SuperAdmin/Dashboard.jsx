import { Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Users, Server, Database, FileText } from 'lucide-react'

export default function SuperAdminDashboard({ stats, recentUsers, roleDistribution }) {
    return (
        <AuthenticatedLayout
            header={(
                <div className="flex items-center gap-3 px-2 py-1">
                    <div className="bg-slate-100 p-1.5 rounded-md">
                        <Server className="w-4 h-4 text-slate-700" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Super Admin</h2>
                        <p className="text-xs text-gray-500 mt-0.5">System monitoring & maintenance</p>
                    </div>
                </div>
            )}
        >
            <Head title="Super Admin" />

            <div className="p-6 lg:p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm">System Users</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_users}</div>
                            <p className="text-xs text-gray-500 mt-2">All accounts in the system</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm">Active Sessions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.active_sessions}</div>
                            <p className="text-xs text-gray-500 mt-2">Current active sessions</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm">Database</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.database_size ?? 'N/A'} MB</div>
                            <p className="text-xs text-gray-500 mt-2">Estimated DB size</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm">System Health</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm font-medium">Database: {stats.system_health?.database}</div>
                            <div className="text-sm font-medium mt-1">Storage: {stats.system_health?.storage}</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Link href={route('superadmin.users')} className="inline-block text-sm text-blue-600">Manage users &rarr;</Link>
                            <Link href={route('superadmin.backup.index')} className="inline-block text-sm text-blue-600">Backup / Restore DB &rarr;</Link>
                            <Link href={route('superadmin.system-logs')} className="inline-block text-sm text-blue-600">View system logs &rarr;</Link>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-sm">Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {recentUsers?.map(user => (
                                    <li key={user.id} className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-sm">{user.name}</div>
                                            <div className="text-xs text-gray-500">{user.email} • {user.role}</div>
                                        </div>
                                        <div className="text-xs text-gray-400">{new Date(user.updated_at).toLocaleString()}</div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    )
}
