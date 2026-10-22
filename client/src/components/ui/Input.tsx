import { forwardRef, type InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
    { label, error, id, className = '', ...rest },
    ref
) {
    const inputId = id || `input-${label.replace(/\s+/g, '-').toLowerCase()}`;
    return (
        <div className="space-y-1.5">
            <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
                {label}
            </label>
            <input
                ref={ref}
                id={inputId}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition
          ${error ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:border-slate-500 focus:ring-slate-200'}
          focus:ring-2 ${className}`}
                {...rest}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
});