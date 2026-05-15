import { Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Users, Database, Shield, Activity, Settings, Calendar, RefreshCw, GraduationCap, ArrowRight, Lock, Eye, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function SuperAdminDashboard({ stats, roleDistribution, auth }) {
    const [isRefreshing, setIsRefreshing] = useState(false)

    const safeRoleDistribution = Array.isArray(roleDistribution) ? roleDistribution : []
    const totalRoleAccounts = safeRoleDistribution.reduce((sum, item) => sum + (item.count || 0), 0)

    const handleRefresh = () => {
        if (isRefreshing) return

        setIsRefreshing(true)
        // Simulate refresh - in real implementation, this would call an API
        setTimeout(() => {
            setIsRefreshing(false)
            toast.success('Dashboard data refreshed successfully!')
        }, 2000)
    }
    return (
        <AuthenticatedLayout
            auth={auth}
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-100 p-2 rounded-lg">
                            <Shield className="w-6 h-6 text-slate-700" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                                Super Admin Dashboard
                            </h1>
                            <p className="text-sm text-gray-600 font-medium mt-0.5">
                                System monitoring & maintenance overview
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</span>
                        </div>
                        <Button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs"
                        >
                            <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                            {isRefreshing ? 'Refreshing...' : 'Refresh'}
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title="Super Admin Dashboard" />

            <div className="space-y-8 p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">System Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_users}</div>
                            <Progress value={stats.total_users > 0 ? (stats.active_users / stats.total_users) * 100 : 0} className="h-1 mt-2" />
                            <div className="text-xs text-muted-foreground mt-1">
                                {stats.total_users > 0 ? Math.round((stats.active_users / stats.total_users) * 100) : 0}% active
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.active_students}</div>
                            <Progress value={stats.total_students > 0 ? (stats.active_students / stats.total_students) * 100 : 0} className="h-1 mt-2" />
                            <div className="text-xs text-muted-foreground mt-1">
                                {stats.total_students > 0 ? Math.round((stats.active_students / stats.total_students) * 100) : 0}% of total students
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Database</CardTitle>
                            <Database className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.database_size}</div>
                            <Progress value={stats.database_size > 0 ? Math.min((stats.database_size / 1000) * 100, 100) : 0} className="h-1 mt-2" />
                            <div className="text-xs text-muted-foreground mt-1">
                                Database size in MB
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">System Health</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span>Database:</span>
                                    <Badge variant={stats.system_health?.database === 'Healthy' ? 'default' : 'destructive'}>
                                        {stats.system_health?.database}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span>Storage:</span>
                                    <Badge variant={stats.system_health?.storage === 'Healthy' ? 'default' : 'destructive'}>
                                        {stats.system_health?.storage}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">IT Administration</CardTitle>
                            <Settings className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Link href={route('superadmin.users')} className="flex items-center justify-between text-sm text-blue-600 hover:text-blue-800 transition-colors">
                                Manage role accounts
                                <ArrowRight className="h-3 w-3" />
                            </Link>
                            <Link href={route('superadmin.backup.index')} className="flex items-center justify-between text-sm text-blue-600 hover:text-blue-800 transition-colors">
                                Backup and restore database
                                <ArrowRight className="h-3 w-3" />
                            </Link>
                            <Link href={route('superadmin.system-logs')} className="flex items-center justify-between text-sm text-blue-600 hover:text-blue-800 transition-colors">
                                Review system logs
                                <ArrowRight className="h-3 w-3" />
                            </Link>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">ELMS Operations Center</CardTitle>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="rounded-lg border p-3 bg-muted/30">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Lock className="h-3.5 w-3.5" />
                                        Account Governance
                                    </div>
                                    <div className="mt-1 text-sm font-semibold">{stats.total_users} total managed accounts</div>
                                </div>
                                <div className="rounded-lg border p-3 bg-muted/30">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Activity className="h-3.5 w-3.5" />
                                        Service Monitoring
                                    </div>
                                    <div className="mt-1 text-sm font-semibold">DB: {stats.system_health?.database} • Storage: {stats.system_health?.storage}</div>
                                </div>
                                <div className="rounded-lg border p-3 bg-muted/30">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                        Attention Needed
                                    </div>
                                    <div className="mt-1 text-sm font-semibold">
                                        {(stats.system_health?.database !== 'Healthy' || stats.system_health?.storage !== 'Healthy') ? '1 or more services need checks' : 'No critical alerts'}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium">User Account Distribution</p>
                                    <Badge variant="secondary">{totalRoleAccounts} accounts</Badge>
                                </div>
                                {safeRoleDistribution.length > 0 ? (
                                    <div className="space-y-2">
                                        {safeRoleDistribution.map((role) => {
                                            const percentage = totalRoleAccounts > 0 ? Math.round(((role.count || 0) / totalRoleAccounts) * 100) : 0

                                            return (
                                                <div key={role.role} className="rounded-md border p-3">
                                                    <div className="mb-2 flex items-center justify-between text-sm">
                                                        <span className="font-medium capitalize">{role.role}</span>
                                                        <span className="text-muted-foreground">{role.count || 0} ({percentage}%)</span>
                                                    </div>
                                                    <Progress value={percentage} className="h-1.5" />
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="rounded-md border p-4 text-sm text-muted-foreground">
                                        No role distribution data available yet.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    )
}
