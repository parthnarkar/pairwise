import type { JourneyStatus } from '../../types';

const statusStyles: Record<JourneyStatus, string> = {
    Onboarding: 'bg-blue-50 text-blue-700 border-blue-200',
    'Active Search': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Matching: 'bg-violet-50 text-violet-700 border-violet-200',
    'Dates Planned': 'bg-amber-50 text-amber-700 border-amber-200',
    Paused: 'bg-slate-100 text-slate-600 border-slate-200',
    Success: 'bg-green-50 text-green-700 border-green-200',
};

export function StatusBadge({ status }: { status: JourneyStatus }) {
    return (
        <span
            className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${statusStyles[status]}`}
        >
            {status}
        </span>
    );
}