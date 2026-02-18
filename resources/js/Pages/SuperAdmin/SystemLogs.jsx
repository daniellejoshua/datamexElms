import { Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'

export default function SystemLogs({ logs }) {
    return (
        <AuthenticatedLayout header={<div className="flex items-center gap-2"><h2 className="text-lg font-semibold">System Logs</h2></div>}>
            <Head title="System Logs" />

            <div className="p-6 lg:p-8">
                <div className="space-y-3">
                    {logs.data?.map((log, idx) => (
                        <div key={idx} className="p-3 border rounded flex items-center justify-between">
                            <div>
                                <div className="font-medium">{log.name} • {log.email}</div>
                                <div className="text-xs text-gray-500">{log.role} • {log.ip_address}</div>
                            </div>
                            <div className="text-xs text-gray-400">{new Date(log.last_activity * 1000).toLocaleString()}</div>
                        </div>
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    )
}
