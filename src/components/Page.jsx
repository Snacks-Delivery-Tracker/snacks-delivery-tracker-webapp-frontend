import { AlertTriangle, ArrowLeft, LoaderCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PageHeader({ title, action, back = false, subtitle }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-20 -mx-4 mb-5 bg-gradient-to-r from-blue-800 to-indigo-700 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+0.8rem)] text-white shadow-lg sm:-mx-6 sm:px-6">
      <div className="flex min-h-7 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {back && <button onClick={() => navigate(-1)} className="-ml-2 rounded-full p-2 text-white/90 transition hover:bg-white/15" aria-label="Go back"><ArrowLeft size={21} /></button>}
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-0.5 truncate text-xs text-blue-100">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
    </header>
  );
}

export function LoadingState({ label = 'Loading your delivery line…' }) {
  return <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-500"><LoaderCircle className="animate-spin text-blue-600" size={28} /><p className="text-sm">{label}</p></div>;
}

export function ErrorState({ message, retry }) {
  return <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-center text-sm text-red-700"><p>{message}</p>{retry && <button onClick={retry} className="mt-3 rounded-lg bg-white px-3 py-2 font-semibold shadow-sm">Try again</button>}</div>;
}

export function PrimaryButton({ children, className = '', loading = false, ...props }) {
  return <button {...props} disabled={loading || props.disabled} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}>{loading && <LoaderCircle size={17} className="animate-spin" />}{children}</button>;
}

export function AmountTriplet({ total = 0, collected = 0, pending = 0, compact = false }) {
  const labelClass = compact ? 'text-[10px]' : 'text-[11px]';
  const valueClass = compact ? 'text-xs' : 'text-sm';
  const currency = (amount) => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(amount) || 0)}`;
  return <div className="grid grid-cols-3 gap-2 text-center">
    <div><p className={`${valueClass} font-extrabold text-blue-700`}>{currency(total)}</p><p className={`${labelClass} mt-0.5 text-slate-500`}>Total</p></div>
    <div><p className={`${valueClass} font-extrabold text-emerald-600`}>{currency(collected)}</p><p className={`${labelClass} mt-0.5 text-slate-500`}>Collected</p></div>
    <div><p className={`${valueClass} font-extrabold text-red-500`}>{currency(pending)}</p><p className={`${labelClass} mt-0.5 text-slate-500`}>Pending</p></div>
  </div>;
}

export function ConfirmDialog({ title, description, confirmLabel, onConfirm, onCancel, loading = false }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 backdrop-blur-sm sm:items-center"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && !loading && onCancel()}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle size={20} />
          </span>
          <div>
            <h2 id="confirmation-title" className="text-base font-extrabold text-slate-900">{title}</h2>
            <p className="mt-1.5 text-xs leading-5 text-slate-600">{description}</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="min-h-11 rounded-xl bg-red-600 px-3 text-xs font-extrabold text-white shadow-lg shadow-red-200 transition hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
