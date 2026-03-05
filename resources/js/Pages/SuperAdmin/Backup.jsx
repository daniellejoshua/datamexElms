import { Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Database, Cloud, HardDrive, RefreshCw, Upload, ShieldCheck, Info } from 'lucide-react'
import { toast } from 'sonner'

// calculate approximate next scheduled run for display
function computeNextRun({ automatic_enabled, frequency, time, last_run_at }) {
    if (!automatic_enabled) {
        return null
    }
    const now = new Date()
    const last = last_run_at ? new Date(last_run_at) : null
    if (!last) {
        return now
    }

    const [hourStr, minuteStr] = (time || '00:00').split(':')
    const hour = parseInt(hourStr, 10)
    const minute = parseInt(minuteStr, 10)

    if (frequency === 'hourly') {
        return new Date(last.getTime() + 60 * 60 * 1000)
    }

    const next = new Date(last)
    if (frequency === 'daily') {
        next.setDate(next.getDate() + 1)
    } else if (frequency === 'weekly') {
        next.setDate(next.getDate() + 7)
    }
    next.setHours(hour, minute, 0, 0)

    return next < now ? now : next
}

export default function SuperAdminBackup({ settings, backups, lastRestore }) {
    // we now use toasts for all user feedback; message state no longer rendered
    // const [message, setMessage] = useState(null)
    const [isRunningManual, setIsRunningManual] = useState(false)
    const [isSavingSettings, setIsSavingSettings] = useState(false)
    const [isRunningAutomaticNow, setIsRunningAutomaticNow] = useState(false)
    const [isUploadingRestore, setIsUploadingRestore] = useState(false)
    const [restoreFileName, setRestoreFileName] = useState('');
    const [restorePassword, setRestorePassword] = useState('');

    const [manualDestination, setManualDestination] = useState(settings?.destination || 'local')

    // parse audit JSON which comes as strings from the server
    let parsedLast = null;
    if (lastRestore) {
        try {
            parsedLast = {
                ...lastRestore,
                metadata: lastRestore.metadata ? JSON.parse(lastRestore.metadata) : {},
                new_values: lastRestore.new_values ? JSON.parse(lastRestore.new_values) : {},
            };
        } catch {
            parsedLast = lastRestore;
        }
    }

    const [automaticEnabled, setAutomaticEnabled] = useState(Boolean(settings?.automatic_enabled))
    const [frequency, setFrequency] = useState(settings?.frequency || 'daily')
    const [time, setTime] = useState(settings?.time || '02:00')
    const [destination, setDestination] = useState(settings?.destination || 'local')

    const nextRun = useMemo(() => computeNextRun({
        automatic_enabled: automaticEnabled,
        frequency,
        time,
        last_run_at: settings?.last_run_at,
    }), [automaticEnabled, frequency, time, settings?.last_run_at])

    const formattedNextRun = nextRun ? new Date(nextRun).toLocaleString() : 'n/a'

    const doBackup = async () => {
        setIsRunningManual(true)

        try {
            const response = await fetch(route('superadmin.backup.create'), {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify({
                    destination: manualDestination,
                }),
            })

            const payload = await response.json()

            if (!response.ok || !payload.success) {
                throw new Error(payload.message || 'Backup failed')
            }

            toast.success(`Manual backup created: ${payload.backup.filename}`)
            window.location.reload()
        } catch (e) {
            toast.error('Backup failed', { description: e.message })
        } finally {
            setIsRunningManual(false)
        }
    }

    const saveSettings = async () => {
        setIsSavingSettings(true)

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
                    // cloud backups removed; manual upload elsewhere recommended
                }),
            })

            const payload = await response.json()

            if (!response.ok || !payload.success) {
                throw new Error(payload.message || 'Failed to save settings')
            }

            // toast.success already shown above
            toast.success('Backup settings saved')

            // reflect new settings locally so the status panel updates
            setAutomaticEnabled(payload.settings.automatic_enabled)
            setFrequency(payload.settings.frequency)
            setTime(payload.settings.time)
            setDestination(payload.settings.destination)
        } catch (e) {
            toast.error('Failed to save settings', { description: e.message })
        } finally {
            setIsSavingSettings(false)
        }
    }

    const runAutomaticNow = async () => {
        setIsRunningAutomaticNow(true)

        try {
            const response = await fetch(route('superadmin.backup.automatic.run'), {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
            })

            const payload = await response.json()

            if (!response.ok || !payload.success) {
                throw new Error(payload.message || 'Automatic backup failed')
            }

            toast.success('Automatic backup completed successfully.')
            window.location.reload()
        } catch (e) {
            toast.error('Automatic backup failed', { description: e.message })
        } finally {
            setIsRunningAutomaticNow(false)
        }
    }

    const doRestore = async (e) => {
        e.preventDefault()
        const file = e.target.backup.files[0]
        if (!file) {
            toast.error('Please select a backup file to upload')
            return
        }

        if (!restorePassword) {
            toast.error('You must enter your password to proceed')
            return
        }

        setRestoreFileName(file.name)
        setIsUploadingRestore(true)

        const fd = new FormData()
        fd.append('backup', file)
        fd.append('current_password', restorePassword)

        try {
            const response = await fetch(route('superadmin.backup.restore'), {
                method: 'POST',
                body: fd,
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
            })

            const text = await response.text()
            const contentType = response.headers.get('content-type') || ''
            if (!contentType.includes('application/json')) {
                console.error('restore endpoint returned non-JSON response:', text)
                throw new Error('Server error occurred; check logs for details.')
            }

            let payload;
            try {
                payload = JSON.parse(text || '{}')
            } catch (jsonErr) {
                console.error('restore endpoint returned invalid JSON:', text)
                throw new Error('Server returned malformed JSON; see console for details')
            }

            if (!response.ok || !payload.success) {
                throw new Error(payload.message || 'Upload failed')
            }

            toast.success(payload.message)
            e.target.reset()
            setRestoreFileName('')
            setRestorePassword('')
        } catch (err) {
            toast.error('Restore failed', { description: err.message })
            setRestorePassword('')
        } finally {
            setIsUploadingRestore(false)
        }
    }

    return (
        <AuthenticatedLayout header={<div className="flex items-center gap-3"><Database className="w-5 h-5 text-blue-600" /><h2 className="text-lg font-semibold">Backup & Restore</h2></div>}>
            <Head title="Backup & Restore" />

            <div className="p-6 lg:p-8 space-y-6">
                <div className="text-sm text-gray-700">
                    <p><Info className="inline w-4 h-4 mr-1 align-middle" />Use the controls below to create database backups or configure automatic scheduled copies. Manual backups run immediately and appear in the history; automatic backups depend on a scheduler job (see page description) and will run according to the settings you save.</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {parsedLast && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Last Restore</CardTitle>
                                <CardDescription>Output and details of the most recent restore job.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <p><strong>File:</strong> {parsedLast.new_values?.path || 'unknown'}</p>
                                <p><strong>Time:</strong> {new Date(parsedLast.created_at).toLocaleString()}</p>
                                {parsedLast.metadata?.output && (
                                    <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 text-xs overflow-auto whitespace-pre-wrap break-words">
                                        {parsedLast.metadata.output}
                                    </pre>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><HardDrive className="w-4 h-4" />Manual Backup</CardTitle>
                            <CardDescription>Create an immediate database backup to local storage; remember to move the file off‑site if you require a remote copy.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Destination</Label>
                                <Select value={manualDestination} onValueChange={setManualDestination}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select destination" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="local">Local (server)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button onClick={doBackup} disabled={isRunningManual} className="w-full">
                                {isRunningManual ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
                                {isRunningManual ? 'Creating Backup...' : 'Create Manual Backup'}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Cloud className="w-4 h-4" />Automatic Backup</CardTitle>
                            <CardDescription>Configure scheduled backups with frequency and destination. Once enabled, a scheduler (cron/job runner) must execute <code>php artisan schedule:run</code> so backups occur automatically.</CardDescription>
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

                            {automaticEnabled && (
                                <div className="mt-3 p-3 bg-muted/20 rounded text-xs space-y-1">
                                    <p><strong>Last run:</strong> {settings?.last_run_at ? new Date(settings.last_run_at).toLocaleString() : 'never'}</p>
                                    <p><strong>Status:</strong> {settings?.last_status || 'n/a'} {settings?.last_error && (<span className="text-red-600">— {settings.last_error}</span>)}</p>
                                    <p><strong>Next run:</strong> {formattedNextRun}</p>
                                </div>
                            )}


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Frequency</Label>
                                    <Select value={frequency} onValueChange={setFrequency} disabled={!automaticEnabled}>
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
                                    <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} disabled={!automaticEnabled} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Destination</Label>
                                    <Select value={destination} onValueChange={setDestination} disabled={!automaticEnabled}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Destination" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="local">Local (server)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Automatic backups are saved on the server.  Remember to transfer critical files to remote storage if required.
                                </p>
                            </div>

                            <div className="flex flex-col md:flex-row gap-2">
                                <Button onClick={saveSettings} disabled={isSavingSettings} className="md:flex-1">
                                    {isSavingSettings ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                                    Save Settings
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
                                <Input
                                    type="file"
                                    name="backup"
                                    accept=".sql,.gz,.zip"
                                    onChange={(e) => setRestoreFileName(e.target.files[0]?.name || '')}
                                />
                                {restoreFileName && (
                                    <p className="text-xs text-gray-600">Selected: {restoreFileName}</p>
                                )}
                                <div className="space-y-2">
                                    <Label>Confirm Password</Label>
                                    <Input
                                        type="password"
                                        name="current_password"
                                        value={restorePassword}
                                        onChange={(e) => setRestorePassword(e.target.value)}
                                        placeholder="Your account password"
                                    />
                                </div>
                                <Button type="submit" variant="secondary" disabled={isUploadingRestore}>
                                    {isUploadingRestore ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                    {isUploadingRestore ? 'Uploading...' : 'Upload & Restore'}
                                </Button>
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

            </div>
        </AuthenticatedLayout>
    )
}
