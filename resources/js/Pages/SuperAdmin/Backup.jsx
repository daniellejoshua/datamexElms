import { Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { useState } from 'react'

export default function SuperAdminBackup({}) {
    const [message, setMessage] = useState(null)

    const doBackup = async () => {
        setMessage('Starting backup...')
        try {
            const res = await fetch(route('superadmin.backup.create'), { method: 'POST', headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') } })
            if (res.ok) {
                // download will be triggered by server response (if binary) — fallback to success message
                setMessage('Backup completed (download should begin).')
            } else {
                const payload = await res.text()
                setMessage('Backup failed: '+payload)
            }
        } catch (e) {
            setMessage('Backup failed: '+e.message)
        }
    }

    const doRestore = async (e) => {
        e.preventDefault()
        const file = e.target.backup.files[0]
        if (!file) return setMessage('Please select a backup file to upload')

        const fd = new FormData()
        fd.append('backup', file)

        const res = await fetch(route('superadmin.backup.restore'), { method: 'POST', body: fd, headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') } })
        if (res.ok) {
            setMessage('Backup uploaded. Server will process restore manually.')
        } else {
            const text = await res.text()
            setMessage('Restore failed: '+text)
        }
    }

    return (
        <AuthenticatedLayout header={<div className="flex items-center gap-2"><h2 className="text-lg font-semibold">Backup & Restore</h2></div>}>
            <Head title="Backup & Restore" />

            <div className="p-6 lg:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border rounded p-4">
                        <h3 className="font-semibold">Create database backup</h3>
                        <p className="text-sm text-gray-500 mt-2">Creates a compressed SQL dump and starts download (if supported).</p>
                        <div className="mt-4">
                            <button onClick={doBackup} className="px-4 py-2 bg-blue-600 text-white rounded">Create Backup</button>
                        </div>
                    </div>

                    <div className="border rounded p-4">
                        <h3 className="font-semibold">Restore database (upload)</h3>
                        <p className="text-sm text-gray-500 mt-2">Upload a previously exported SQL dump. Restoring is performed manually on the server for safety.</p>
                        <form onSubmit={doRestore} className="mt-4 space-y-3">
                            <input type="file" name="backup" accept=".sql,.gz,.zip" />
                            <div>
                                <button className="px-4 py-2 bg-amber-600 text-white rounded" type="submit">Upload & Save</button>
                            </div>
                        </form>
                    </div>
                </div>

                {message && (
                    <div className="text-sm text-gray-700">{message}</div>
                )}
            </div>
        </AuthenticatedLayout>
    )
}
