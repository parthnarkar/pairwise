import { forwardRef, type SelectHTMLAttributes } from 'react';

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
}

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
    { label, children, className = '', ...rest },
    ref
) {
    return (
        <div className="space-y-1">
            {label && (
                <label className="block text-xs font-medium text-slate-600">
                    {label}
                </label>
            )}
            <select
                ref={ref}
                className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white
          outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 ${className}`}
                {...rest}
            >
                {children}
            </select>
        </div>
    );
});