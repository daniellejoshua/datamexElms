import { Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Database, Cloud, HardDrive, RefreshCw, Upload, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

export default function SuperAdminBackup({ settings, backups }) {
    const [message, setMessage] = useState(null)
    const [isRunningManual, setIsRunningManual] = useState(false)
    const [isSavingSettings, setIsSavingSettings] = useState(false)
    const [isRunningAutomaticNow, setIsRunningAutomaticNow] = useState(false)

    const [manualDestination, setManualDestination] = useState(settings?.destination || 'local')
    const [manualCloudDisk, setManualCloudDisk] = useState(settings?.cloud_disk || 's3')

    const [automaticEnabled, setAutomaticEnabled] = useState(Boolean(settings?.automatic_enabled))
    const [frequency, setFrequency] = useState(settings?.frequency || 'daily')
    const [time, setTime] = useState(settings?.time || '02:00')
    const [destination, setDestination] = useState(settings?.destination || 'local')
    const [cloudDisk, setCloudDisk] = useState(settings?.cloud_disk || 's3')

    const doBackup = async () => {
        setIsRunningManual(true)
        setMessage('Starting manual backup...')

        try {
            const response = await fetch(route('superadmin.backup.create'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify({
                    destination: manualDestination,
                    cloud_disk: manualDestination === 'cloud' ? manualCloudDisk : null,
                }),
            })

            const payload = await response.json()

            if (!response.ok || !payload.success) {
                throw new Error(payload.message || 'Backup failed')
            }

            setMessage(`Manual backup created: ${payload.backup.filename}`)
            toast.success('Manual backup completed')
            window.location.reload()
        } catch (e) {
            setMessage(`Backup failed: ${e.message}`)
            toast.error('Backup failed', { description: e.message })
        } finally {
            setIsRunningManual(false)
        }
    }

    const saveSettings = async () => {
        setIsSavingSettings(true)
        setMessage('Saving automatic backup settings...')

        try {
            const response = await fetch(route('superadmin.backup.settings.update'), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify({
                    automatic_enabled: automaticEnabled,
                    frequency,
                    time,
                    destination,
                    cloud_disk: destination === 'cloud' ? cloudDisk : null,
                }),
            })

            const payload = await response.json()

            if (!response.ok || !payload.success) {
                throw new Error(payload.message || 'Failed to save settings')
            }

            setMessage('Automatic backup settings saved.')
            toast.success('Backup settings saved')
        } catch (e) {
            setMessage(`Failed to save settings: ${e.message}`)
            toast.error('Failed to save settings', { description: e.message })
        } finally {
            setIsSavingSettings(false)
        }
    }

    const runAutomaticNow = async () => {
        setIsRunningAutomaticNow(true)
        setMessage('Running automatic backup now...')

        try {
            const response = await fetch(route('superadmin.backup.automatic.run'), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
            })

            const payload = await response.json()

            if (!response.ok || !payload.success) {
                throw new Error(payload.message || 'Automatic backup failed')
            }

            setMessage('Automatic backup completed successfully.')
            toast.success('Automatic backup completed')
            window.location.reload()
        } catch (e) {
            setMessage(`Automatic backup failed: ${e.message}`)
            toast.error('Automatic backup failed', { description: e.message })
        } finally {
            setIsRunningAutomaticNow(false)
        }
    }

    const doRestore = async (e) => {
        e.preventDefault()
        const file = e.target.backup.files[0]
        if (!file) {
            setMessage('Please select a backup file to upload')
            return
        }

        const fd = new FormData()
        fd.append('backup', file)

        const response = await fetch(route('superadmin.backup.restore'), {
            method: 'POST',
            body: fd,
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            },
        })

        const payload = await response.json()

        if (!response.ok || !payload.success) {
            setMessage(`Restore failed: ${payload.message || 'Upload failed'}`)
            toast.error('Restore upload failed', { description: payload.message || 'Upload failed' })
            return
        }

        setMessage(payload.message)
        toast.success('Restore file uploaded')
        e.target.reset()
    }

    return (
        <AuthenticatedLayout header={<div className="flex items-center gap-3"><Database className="w-5 h-5 text-blue-600" /><h2 className="text-lg font-semibold">Backup & Restore</h2></div>}>
            <Head title="Backup & Restore" />

            <div className="p-6 lg:p-8 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><HardDrive className="w-4 h-4" />Manual Backup</CardTitle>
                            <CardDescription>Create an immediate database backup to local storage or cloud.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Destination</Label>
                                <Select value={manualDestination} onValueChange={setManualDestination}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select destination" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="local">Local</SelectItem>
                                        <SelectItem value="cloud">Cloud</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {manualDestination === 'cloud' && (
                                <div className="space-y-2">
                                    <Label>Cloud Disk</Label>
                                    <Input value={manualCloudDisk} onChange={(e) => setManualCloudDisk(e.target.value)} placeholder="s3" />
                                </div>
                            )}

                            <Button onClick={doBackup} disabled={isRunningManual} className="w-full">
                                {isRunningManual ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
                                {isRunningManual ? 'Creating Backup...' : 'Create Manual Backup'}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Cloud className="w-4 h-4" />Automatic Backup</CardTitle>
                            <CardDescription>Configure scheduled backups with frequency and destination.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <label className="flex items-center gap-2 text-sm font-medium">
                                <input
                                    type="checkbox"
                                    checked={automaticEnabled}
                                    onChange={(e) => setAutomaticEnabled(e.target.checked)}
                                    className="h-4 w-4"
                                />
                                Enable automatic backups
                            </label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Frequency</Label>
                                    <Select value={frequency} onValueChange={setFrequency}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Frequency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="hourly">Hourly</SelectItem>
                                            <SelectItem value="daily">Daily</SelectItem>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Time (for daily/weekly)</Label>
                                    <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Destination</Label>
                                    <Select value={destination} onValueChange={setDestination}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Destination" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="local">Local</SelectItem>
                                            <SelectItem value="cloud">Cloud</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Cloud Disk</Label>
                                    <Input value={cloudDisk} onChange={(e) => setCloudDisk(e.target.value)} disabled={destination !== 'cloud'} placeholder="s3" />
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-2">
                                <Button onClick={saveSettings} disabled={isSavingSettings} className="md:flex-1">
                                    {isSavingSettings ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                                    Save Settings
                                </Button>
                                <Button variant="outline" onClick={runAutomaticNow} disabled={isRunningAutomaticNow} className="md:flex-1">
                                    {isRunningAutomaticNow ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
                                    Run Automatic Now
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Upload className="w-4 h-4" />Restore Upload</CardTitle>
                            <CardDescription>Upload backup file for manual server-side restore processing.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={doRestore} className="space-y-3">
                                <Input type="file" name="backup" accept=".sql,.gz,.zip" />
                                <Button type="submit" variant="secondary">Upload Restore File</Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Backup History</CardTitle>
                            <CardDescription>Latest local backup artifacts.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {Array.isArray(backups) && backups.length > 0 ? (
                                <div className="space-y-2 max-h-72 overflow-y-auto">
                                    {backups.map((backup) => (
                                        <div key={backup.path} className="border rounded-md p-3 flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-sm">{backup.filename}</p>
                                                <p className="text-xs text-gray-500">{new Date(backup.last_modified).toLocaleString()}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline">{(backup.size / 1024 / 1024).toFixed(2)} MB</Badge>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        window.location.href = route('superadmin.backup.download', { path: backup.path })
                                                    }}
                                                >
                                                    Download
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No backups available yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {message && (
                    <div className="text-sm text-gray-700 border rounded-md p-3 bg-muted/30">{message}</div>
                )}
            </div>
        </AuthenticatedLayout>
    )
}
