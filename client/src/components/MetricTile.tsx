import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
    label: string;
    value: number | string;
    hint?: string;
    icon?: ReactNode;
    to?: string;
}

export function MetricTile({ label, value, hint, icon, to }: Props) {
    const body = (
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-start justify-between hover:border-slate-300 transition">
            <div>
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
                {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
            </div>
            {icon && <div className="text-slate-400">{icon}</div>}
        </div>
    );

    return to ? <Link to={to}>{body}</Link> : body;
}