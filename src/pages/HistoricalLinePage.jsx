import { ChevronRight, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { AmountTriplet, ErrorState, LoadingState, PageHeader } from '../components/Page';
import { formatDate } from '../utils/format';

export function HistoricalLinePage() {
  const { lineId } = useParams();
  const [line, setLine] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.getLine(lineId).then(setLine).catch((requestError) => setError(requestError.message)); }, [lineId]);
  if (error) return <ErrorState message={error} />;
  if (!line) return <LoadingState label="Loading line…" />;
  return <><PageHeader title={formatDate(line.deliveryDate || line.createdAt)} back action={<Link to={`/lines/${lineId}/bill`} aria-label="Generate line bill"><FileText size={19} /></Link>} /><section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Line summary</p><AmountTriplet total={line.summary.totalAmount} collected={line.summary.collectedAmount} pending={line.summary.pendingAmount} /></section><section className="mt-5 space-y-2.5">{line.shops.map((shop, index) => <Link to={shop.latestOrder ? `/deliveries/${shop.latestOrder._id}` : '#'} key={shop._id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm"><span className="text-sm font-extrabold text-slate-500">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-800">{shop.name}</p><p className="mt-1 text-[11px] text-slate-500">{shop.orders.length} delivery entries</p></div><ChevronRight className="text-slate-300" size={17} /></Link>)}</section></>;
}
