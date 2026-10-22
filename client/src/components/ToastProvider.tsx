import { createContext, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

type Toast = { id: number; message: string; kind: 'success' | 'error' };
const ToastContext = createContext<(message: string, kind?: Toast['kind']) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (message: string, kind: Toast['kind'] = 'success') => {
        const id = Date.now();
        setToasts((current) => [...current, { id, message, kind }]);
        window.setTimeout(() => {
            setToasts((current) => current.filter((toast) => toast.id !== id));
        }, 4000);
    };

    return (
        <ToastContext.Provider value={showToast}>
            {children}
            <div className="fixed bottom-4 left-4 z-[100] space-y-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${
                            toast.kind === 'success' ? 'bg-emerald-600' : 'bg-red-600'
                        }`}
                    >
                        {toast.kind === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        <span>{toast.message}</span>
                        <button onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}>
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);
