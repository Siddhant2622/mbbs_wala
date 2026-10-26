import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
  duration?: number;
}

interface Toast extends ToastInput {
  id: string;
}

interface ToastContextValue {
  toast: (input: ToastInput) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const tones: Record<ToastTone, string> = {
  success: 'border-emerald-500/30 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/80 dark:text-emerald-50',
  error: 'border-red-500/30 bg-red-50 text-red-950 dark:bg-red-950/80 dark:text-red-50',
  info: 'border-sky-500/30 bg-sky-50 text-sky-950 dark:bg-sky-950/80 dark:text-sky-50',
  warning: 'border-amber-500/30 bg-amber-50 text-amber-950 dark:bg-amber-950/80 dark:text-amber-50',
};

const iconTone: Record<ToastTone, string> = {
  success: 'text-emerald-600',
  error: 'text-red-600',
  info: 'text-sky-600',
  warning: 'text-amber-600',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const item: Toast = {
        id,
        tone: 'info',
        duration: 3800,
        ...input,
      };
      setItems((prev) => [...prev.slice(-4), item]);
      const ms = item.duration ?? 3800;
      if (ms > 0) {
        window.setTimeout(() => dismiss(id), ms);
      }
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (title, description) => toast({ title, description, tone: 'success' }),
      error: (title, description) => toast({ title, description, tone: 'error' }),
      info: (title, description) => toast({ title, description, tone: 'info' }),
      dismiss,
    }),
    [toast, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-5 right-5 z-[2000] flex flex-col gap-2.5 w-[min(100vw-2rem,380px)] pointer-events-none"
        aria-live="polite"
      >
        {items.map((t) => {
          const Icon = icons[t.tone || 'info'];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-md transition-all duration-300 ${tones[t.tone || 'info']}`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconTone[t.tone || 'info']}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-snug">{t.title}</p>
                {t.description && (
                  <p className="text-xs font-medium opacity-80 mt-0.5 leading-relaxed">{t.description}</p>
                )}
              </div>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => dismiss(t.id)}
                className="opacity-50 hover:opacity-100 transition-opacity shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
