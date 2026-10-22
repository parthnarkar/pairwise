import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowLeft, Mail, Phone, MapPin, Briefcase, GraduationCap } from 'lucide-react';
import {
    getCustomer,
    updateStatus,
    addNote,
} from '../api/customers';
import { StatusBadge } from '../components/ui/Badge';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { formatDateTime, formatINR, initials } from '../lib/format';
import {
    JOURNEY_STATUSES,
    type JourneyStatus,
} from '../types';

export function CustomerDetailPage() {
    const { id = '' } = useParams();
    const navigate = useNavigate();
    const qc = useQueryClient();

    const { data: customer, isLoading, error } = useQuery({
        queryKey: ['customer', id],
        queryFn: () => getCustomer(id),
        enabled: !!id,
    });

    const [noteText, setNoteText] = useState('');
    const [statusSaving, setStatusSaving] = useState(false);

    const noteMutation = useMutation({
        mutationFn: (text: string) => addNote(id, text),
        onSuccess: () => {
            setNoteText('');
            qc.invalidateQueries({ queryKey: ['customer', id] });
        },
    });

    const statusMutation = useMutation({
        mutationFn: (s: JourneyStatus) => updateStatus(id, s),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['customer', id] });
            qc.invalidateQueries({ queryKey: ['customers'] });
        },
    });

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStatusSaving(true);
        try {
            await statusMutation.mutateAsync(e.target.value as JourneyStatus);
        } finally {
            setStatusSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
                Loading customer…
            </div>
        );
    }
    if (error || !customer) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-3">
                <p className="text-sm text-slate-600">Customer not found.</p>
                <Link to="/" className="text-sm text-slate-900 underline">
                    Back to dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
                    >
                        <ArrowLeft size={16} /> Back to dashboard
                    </button>
                    <StatusBadge status={customer.journeyStatus} />
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: Profile + biodata */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardBody className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-full bg-slate-900 text-white text-xl flex items-center justify-center font-medium shrink-0">
                                {initials(customer.firstName, customer.lastName)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-xl font-semibold text-slate-900">
                                    {customer.firstName} {customer.lastName}
                                </h1>
                                <p className="text-sm text-slate-600 mt-1">
                                    {customer.age} yrs · {customer.gender} · {customer.maritalStatus}
                                </p>
                                <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600">
                                    <span className="inline-flex items-center gap-1.5">
                                        <MapPin size={14} /> {customer.city}, {customer.country}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <Mail size={14} /> {customer.email}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <Phone size={14} /> {customer.phone}
                                    </span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHeader title="Biodata" />
                        <CardBody>
                            <BiodataGrid customer={customer} />
                        </CardBody>
                    </Card>
                </div>

                {/* RIGHT: Journey + Notes */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader title="Journey Status" />
                        <CardBody>
                            <Select
                                value={customer.journeyStatus}
                                onChange={handleStatusChange}
                                disabled={statusSaving}
                            >
                                {JOURNEY_STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </Select>
                            <p className="text-xs text-slate-500 mt-2">
                                Changing status updates the customer's journey immediately.
                            </p>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHeader title={`Notes (${customer.notes.length})`} />
                        <CardBody className="space-y-3">
                            <div>
                                <textarea
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    placeholder="Add a meeting or call note…"
                                    rows={3}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                />
                                <div className="flex justify-end mt-2">
                                    <Button
                                        onClick={() => noteMutation.mutate(noteText.trim())}
                                        loading={noteMutation.isPending}
                                        disabled={!noteText.trim()}
                                    >
                                        Save note
                                    </Button>
                                </div>
                                {noteMutation.isError && (
                                    <p className="text-xs text-red-600 mt-1">
                                        Could not save note.
                                    </p>
                                )}
                            </div>

                            <div className="space-y-3 pt-3 border-t border-slate-100 max-h-[400px] overflow-y-auto">
                                {customer.notes.length === 0 && (
                                    <p className="text-xs text-slate-500 text-center py-4">
                                        No notes yet.
                                    </p>
                                )}
                                {[...customer.notes].reverse().map((n, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-slate-50 rounded-lg px-3 py-2.5 text-sm"
                                    >
                                        <p className="text-slate-800 whitespace-pre-wrap">
                                            {n.text}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1.5">
                                            {n.author.name} · {formatDateTime(n.createdAt)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </main>
        </div>
    );
}

function BiodataGrid({ customer }: { customer: any }) {
    const rows: { label: string; value: string | number | undefined }[] = [
        { label: 'Full Name', value: `${customer.firstName} ${customer.lastName}` },
        { label: 'Date of Birth', value: new Date(customer.dateOfBirth).toLocaleDateString('en-IN') },
        { label: 'Age', value: `${customer.age} yrs` },
        { label: 'Gender', value: customer.gender },
        { label: 'Height', value: `${customer.height} cm` },
        { label: 'Marital Status', value: customer.maritalStatus },
        { label: 'City', value: customer.city },
        { label: 'Country', value: customer.country },
        { label: 'Email', value: customer.email },
        { label: 'Phone', value: customer.phone },
        {
            label: 'Education',
            value: `${customer.education.degree} — ${customer.education.undergraduateCollege}`,
        },
        {
            label: 'Profession',
            value: `${customer.profession.designation} at ${customer.profession.currentCompany}`,
        },
        { label: 'Annual Income', value: formatINR(customer.profession.income) },
        {
            label: 'Languages',
            value: customer.languagesKnown?.join(', ') || '—',
        },
        { label: 'Siblings', value: customer.siblings },
        { label: 'Religion', value: customer.background?.religion || '—' },
        { label: 'Caste', value: customer.background?.caste || '—' },
        { label: 'Diet', value: customer.lifestyle?.diet || '—' },
        { label: 'Drinking', value: customer.lifestyle?.drinking || '—' },
        { label: 'Smoking', value: customer.lifestyle?.smoking || '—' },
        { label: 'Want Kids', value: customer.preferences?.wantKids || '—' },
        { label: 'Open to Relocate', value: customer.preferences?.openToRelocate || '—' },
        { label: 'Open to Pets', value: customer.preferences?.openToPets || '—' },
        {
            label: 'Preferred Age Range',
            value:
                customer.preferences?.minAge && customer.preferences?.maxAge
                    ? `${customer.preferences.minAge}–${customer.preferences.maxAge} yrs`
                    : '—',
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            {rows.map((r) => (
                <div key={r.label}>
                    <p className="text-xs text-slate-500">{r.label}</p>
                    <p className="text-sm text-slate-900 mt-0.5">{r.value}</p>
                </div>
            ))}
        </div>
    );
}