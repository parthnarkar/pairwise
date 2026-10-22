import type { ReactNode } from 'react';

export function Card({
    children,
    className = '',
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}
        >
            {children}
        </div>
    );
}

export function CardHeader({
    title,
    action,
}: {
    title: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <h3 className="text-sm font-medium text-slate-900">{title}</h3>
            {action}
        </div>
    );
}

export function CardBody({
    children,
    className = '',
}: {
    children: ReactNode;
    className?: string;
}) {
    return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}