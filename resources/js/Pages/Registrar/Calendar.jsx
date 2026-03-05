import { useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';

export default function Calendar() {
    const { events, flash } = usePage().props;
    const [form, setForm] = useState({
        effective_date: '',
        type: 'early_enrollment',
        term: '',
        amount: '',
        notes: '',
        college_only: true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        router.post(route('registrar.calendar.store'), form, { preserveScroll: true });
    };

    return (
        <div>
            <Head title="Registrar Calendar" />
            <h1 className="text-2xl font-bold mb-4">Fee Adjustment Calendar</h1>
            {flash.success && <div className="mb-4 text-green-700">{flash.success}</div>}

            <form onSubmit={handleSubmit} className="space-y-4 mb-8">
                <div>
                    <InputLabel htmlFor="effective_date">Date</InputLabel>
                    <TextInput
                        id="effective_date"
                        type="date"
                        value={form.effective_date}
                        onChange={e => setForm({ ...form, effective_date: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <InputLabel htmlFor="type">Type</InputLabel>
                    <select
                        id="type"
                        value={form.type}
                        onChange={e => setForm({ ...form, type: e.target.value })}
                        className="border rounded px-2 py-1"
                    >
                        <option value="early_enrollment">Early Enrollment Discount</option>
                        <option value="due_date_penalty">Due Date Penalty</option>
                    </select>
                </div>
                {form.type === 'due_date_penalty' && (
                    <div>
                        <InputLabel htmlFor="term">Term</InputLabel>
                        <select
                            id="term"
                            value={form.term}
                            onChange={e => setForm({ ...form, term: e.target.value })}
                            className="border rounded px-2 py-1"
                            required
                        >
                            <option value="">-- select --</option>
                            <option value="prelim">Prelim</option>
                            <option value="midterm">Midterm</option>
                            <option value="prefinals">Prefinals</option>
                            <option value="finals">Finals</option>
                        </select>
                    </div>
                )}
                <div>
                    <InputLabel htmlFor="amount">Amount</InputLabel>
                    <TextInput
                        id="amount"
                        type="number"
                        value={form.amount}
                        onChange={e => setForm({ ...form, amount: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <InputLabel htmlFor="notes">Notes (optional)</InputLabel>
                    <TextInput
                        id="notes"
                        type="text"
                        value={form.notes}
                        onChange={e => setForm({ ...form, notes: e.target.value })}
                    />
                </div>
                <div>
                    <label className="inline-flex items-center">
                        <input
                            type="checkbox"
                            checked={form.college_only}
                            onChange={e => setForm({ ...form, college_only: e.target.checked })}
                            className="mr-2"
                        />
                        College only
                    </label>
                </div>
                <PrimaryButton type="submit">Save Adjustment</PrimaryButton>
            </form>

            <h2 className="text-xl font-semibold mb-2">Existing Adjustments</h2>
            <ul className="space-y-2">
                {events.map(ev => (
                    <li key={ev.id} className="border p-2 rounded">
                        {ev.effective_date}: {ev.type.replace('_',' ')}
                        {ev.term ? ` (${ev.term})` : ''} – {ev.amount}
                    </li>
                ))}
            </ul>
        </div>
    );
}
