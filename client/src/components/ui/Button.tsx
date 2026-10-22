import type { ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'ghost';
    loading?: boolean;
}

export function Button({
    variant = 'primary',
    loading = false,
    disabled,
    children,
    className = '',
    ...rest
}: Props) {
    const base =
        'inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    const styles =
        variant === 'primary'
            ? 'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-500'
            : 'bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-300';

    return (
        <button
            className={`${base} ${styles} ${className}`}
            disabled={disabled || loading}
            {...rest}
        >
            {loading ? 'Please wait…' : children}
        </button>
    );
}