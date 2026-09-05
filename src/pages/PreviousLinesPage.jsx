import { CalendarDays, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ErrorState, LoadingState, PageHeader } from '../components/Page';
import { formatCurrency, formatDate } from '../utils/format';

export function PreviousLinesPage() {
  const [lines, setLines] = useState(null);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  useEffect(() => { api.listLines().then(setLines).catch((requestError) => setError(requestError.message)); }, []);
  if (error) return <ErrorState message={error} />;
  if (!lines) return <LoadingState label="Loading previous lines…" />;
  const visibleLines = statusFilter === 'ALL' ? lines : lines.filter((line) => line.status === statusFilter);
  return <><PageHeader title="Previous Lines" /><div className="mb-4 flex rounded-xl border border-slate-200 bg-white p-1" role="group" aria-label="Filter line history">{[['ALL', 'All'], ['OPEN', 'Open'], ['CLOSED', 'Closed']].map(([value, label]) => <button key={value} type="button" onClick={() => setStatusFilter(value)} className={`flex-1 rounded-lg py-2 text-[11px] font-bold ${statusFilter === value ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>{label}</button>)}</div><section className="space-y-2.5">{visibleLines.map((line) => { const pending = Math.max(0, (line.totalGoodsDelivered || 0) - (line.totalCashCollected || 0)); return <Link key={line._id} to={`/lines/${line._id}`} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-700"><CalendarDays size={19} /></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="block text-sm font-extrabold text-slate-800">{formatDate(line.deliveryDate || line.createdAt)}</span><span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${line.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{line.status}</span></span><span className="mt-1 block text-[11px] text-slate-500">Shops: {line.shops.length} · Total: {formatCurrency(line.totalGoodsDelivered)}</span><span className="mt-1 block text-[11px] font-bold text-red-500">Pending: {formatCurrency(pending)}</span></span><ChevronRight size={18} className="text-slate-300" /></Link>; })}{!visibleLines.length && <div className="py-14 text-center text-sm text-slate-400">No {statusFilter.toLowerCase()} delivery lines found.</div>}</section></>;
}
