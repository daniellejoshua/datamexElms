import { useEffect, useMemo, useState } from 'react'
import { Head, router, usePage } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, CalendarRange, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function Calendar({ events = [] }) {
    const { errors = {} } = usePage().props
    const [form, setForm] = useState({
        start_date: '',
        end_date: '',
        amount: '',
        notes: '',
    })
    const [processing, setProcessing] = useState(false)

    const totalDiscount = useMemo(() => {
        return (events || []).reduce((sum, event) => sum + Number(event.amount || 0), 0)
    }, [events])

    useEffect(() => {
        if (!errors || Object.keys(errors).length === 0) return

        const firstError = Object.values(errors)[0]
        if (firstError) {
            toast.error(Array.isArray(firstError) ? firstError[0] : firstError)
        }
    }, [errors])

    const handleSubmit = (e) => {
        e.preventDefault()
        router.post(route('registrar.calendar.store'), form, {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
        })
    }

    const handleDelete = (id) => {
        if (!window.confirm('Delete this discount period?')) return

        router.delete(route('registrar.calendar.destroy', id), {
            preserveScroll: true,
        })
    }

    const formatDate = (dateValue) => {
        if (!dateValue) return '-'
        return new Date(dateValue).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center px-2 py-1">
                    <div className="flex items-center gap-2">
                        <div className="bg-emerald-100 p-2 rounded-lg">
                            <CalendarDays className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Enrollment Calendar</h2>
                            <p className="text-xs text-gray-500 mt-0.5">College early enrollment discount periods</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Enrollment Calendar" />

            <div className="space-y-4 m-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Total Periods</CardDescription>
                            <CardTitle className="text-2xl">{events.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Configured Discounts</CardDescription>
                            <CardTitle className="text-2xl">PHP {totalDiscount.toFixed(2)}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Coverage</CardDescription>
                            <CardTitle className="text-2xl">College Only</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Add Early Enrollment Discount
                        </CardTitle>
                        <CardDescription>Set the enrollment period and amount to deduct from college fees.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                            <div className="space-y-1">
                                <Label htmlFor="start_date">Start Date</Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    value={form.start_date}
                                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                    required
                                />
                                {errors.start_date && <p className="text-xs text-red-600">{errors.start_date}</p>}
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="end_date">End Date</Label>
                                <Input
                                    id="end_date"
                                    type="date"
                                    value={form.end_date}
                                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                                    required
                                />
                                {errors.end_date && <p className="text-xs text-red-600">{errors.end_date}</p>}
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="amount">Discount Amount</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={form.amount}
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                    required
                                />
                                {errors.amount && <p className="text-xs text-red-600">{errors.amount}</p>}
                            </div>

                            <Button type="submit" disabled={processing} className="w-full md:w-auto">
                                {processing ? 'Saving...' : 'Save Period'}
                            </Button>

                            <div className="md:col-span-4 space-y-1">
                                <Label htmlFor="notes">Notes (Optional)</Label>
                                <Input
                                    id="notes"
                                    type="text"
                                    placeholder="Ex: promo for first batch enrollees"
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                />
                                {errors.notes && <p className="text-xs text-red-600">{errors.notes}</p>}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <CalendarRange className="w-4 h-4" />
                            Existing Discount Periods
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {events.length === 0 ? (
                            <div className="text-sm text-gray-500 py-8 text-center border rounded-md">
                                No discount period configured yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto border rounded-md">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="text-left px-3 py-2 font-medium text-gray-600">Period</th>
                                            <th className="text-left px-3 py-2 font-medium text-gray-600">Amount</th>
                                            <th className="text-left px-3 py-2 font-medium text-gray-600">Scope</th>
                                            <th className="text-left px-3 py-2 font-medium text-gray-600">Notes</th>
                                            <th className="text-right px-3 py-2 font-medium text-gray-600">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {events.map((event) => (
                                            <tr key={event.id} className="border-b last:border-b-0">
                                                <td className="px-3 py-2 text-gray-800">
                                                    {formatDate(event.start_date ?? event.effective_date)} to {formatDate(event.end_date ?? event.effective_date)}
                                                </td>
                                                <td className="px-3 py-2 font-medium text-emerald-700">
                                                    PHP {Number(event.amount || 0).toFixed(2)}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <Badge variant="secondary">College</Badge>
                                                </td>
                                                <td className="px-3 py-2 text-gray-600">
                                                    {event.notes || '-'}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(event.id)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    )
}
