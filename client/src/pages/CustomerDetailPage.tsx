import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Sparkles,
} from 'lucide-react';
import { getCustomer, updateStatus, addNote } from '../api/customers';
import { StatusBadge } from '../components/ui/Badge';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { SentMatchesPanel } from '../components/SentMatchesPanel';
import { SuggestedMatchesDrawer } from '../components/SuggestedMatchesDrawer';
import { formatDateTime, formatINR, initials } from '../lib/format';
import { JOURNEY_STATUSES, type JourneyStatus } from '../types';
import { LoadingScreen } from '../components/LoadingScreen';

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
    const [matchesOpen, setMatchesOpen] = useState(false);

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, [id]);

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

    const handleStatusChange = async (
        e: React.ChangeEvent<HTMLSelectElement>
    ) => {
        setStatusSaving(true);
        try {
            await statusMutation.mutateAsync(e.target.value as JourneyStatus);
        } finally {
            setStatusSaving(false);
        }
    };

    if (isLoading) {
        return <LoadingScreen label="Loading customer profile" />;
    }
    if (error || !customer) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50">
                <p className="text-sm text-slate-600">Customer not found.</p>
                <Link to="/" className="text-sm text-slate-900 underline">
                    Back to dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50" style={{ fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif' }}>
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-8">
                    <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                    >
                        <ArrowLeft size={16} /> Back to dashboard
                    </button>
                    <StatusBadge status={customer.journeyStatus} />
                </div>
            </header>

            <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:px-8 lg:grid-cols-3">
                {/* LEFT: Profile + biodata */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="rounded-2xl">
                        <CardBody className="flex items-start gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-xl font-bold text-white">
                                {initials(customer.firstName, customer.lastName)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-indigo-500">Client profile</p>
                                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                                    {customer.firstName} {customer.lastName}
                                </h1>
                                <p className="text-sm text-slate-600 mt-1">
                                    {customer.age} yrs · {customer.gender} ·{' '}
                                    {customer.maritalStatus}
                                </p>
                                <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
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

                    <Card className="rounded-2xl">
                        <CardHeader title="Biodata" />
                        <CardBody>
                            <BiodataGrid customer={customer} />
                        </CardBody>
                    </Card>
                </div>

                {/* RIGHT: Matches + Journey + Notes */}
                <div className="space-y-6">
                    <Card className="rounded-2xl">
                        <CardHeader title="Matches" />
                        <CardBody>
                            <p className="mb-4 text-sm leading-6 text-slate-500">
                                Run the algorithm to find compatible candidates based on this
                                customer's biodata and preferences.
                            </p>
                            <Button
                                onClick={() => setMatchesOpen(true)}
                                className="w-full"
                            >
                                <Sparkles size={16} className="mr-2" />
                                Find Matches
                            </Button>
                        </CardBody>
                    </Card>

                    <Card className="rounded-2xl">
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

                    <Card className="rounded-2xl">
                        <CardHeader title="Sent Matches" />
                        <CardBody>
                            <SentMatchesPanel customerId={customer.id} />
                        </CardBody>
                    </Card>

                    <Card className="rounded-2xl">
                        <CardHeader title={`Notes (${customer.notes.length})`} />
                        <CardBody className="space-y-3">
                            <div>
                                <label htmlFor="customer-note" className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Private client note</label>
                                <textarea
                                    id="customer-note"
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    placeholder="Add a meeting or call note…"
                                    rows={3}
                                    className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
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
                                    <p role="alert" className="mt-1 text-xs text-red-600">
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

            <SuggestedMatchesDrawer
                customerId={customer.id}
                customerName={`${customer.firstName} ${customer.lastName}`}
                open={matchesOpen}
                onClose={() => setMatchesOpen(false)}
                onSendSuccess={() => {
                    // Reflect the backend's automatic Active Search -> Matching transition immediately.
                    qc.setQueryData(['customer', id], (current: typeof customer | undefined) =>
                        (current?.journeyStatus === 'Active Search' || current?.journeyStatus === 'Onboarding')
                            ? { ...current, journeyStatus: 'Matching' }
                            : current
                    );
                    qc.invalidateQueries({ queryKey: ['customer', id] });
                    qc.invalidateQueries({ queryKey: ['match-history', id] });
                    qc.invalidateQueries({ queryKey: ['match-stats'] });
                    qc.invalidateQueries({ queryKey: ['customers'] });
                }}
            />
        </div>
    );
}

function BiodataGrid({ customer }: { customer: any }) {
    const rows: { label: string; value: string | number | undefined }[] = [
        { label: 'Full Name', value: `${customer.firstName} ${customer.lastName}` },
        {
            label: 'Date of Birth',
            value: new Date(customer.dateOfBirth).toLocaleDateString('en-IN'),
        },
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
        {
            label: 'Open to Relocate',
            value: customer.preferences?.openToRelocate || '—',
        },
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