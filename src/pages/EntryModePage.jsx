import { ChevronRight, CircleDollarSign, ListChecks, Store } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLine } from '../contexts/LineContext';
import { LoadingState, PageHeader } from '../components/Page';

export function EntryModePage() {
  const { shopId } = useParams();
  const { line, isLoading } = useLine();
  const navigate = useNavigate();
  const shop = useMemo(() => line?.shops.find((entry) => entry._id === shopId), [line, shopId]);
  if (isLoading) return <LoadingState />;
  if (!shop) return <div className="pt-10 text-center"><Store className="mx-auto text-slate-300" size={38} /><p className="mt-4 text-sm text-slate-500">This shop is not on the active line.</p><Link to="/shops" className="mt-4 inline-block text-sm font-bold text-blue-700">Choose a shop</Link></div>;

  const options = [
    { mode: 'quick', title: 'Quick amount entry', description: 'Enter total and collected amount.', icon: CircleDollarSign, color: 'bg-emerald-100 text-emerald-700' },
    { mode: 'items', title: 'Item-wise entry', description: 'Add each snack with a quantity.', icon: ListChecks, color: 'bg-violet-100 text-violet-700' }
  ];
  return <><PageHeader title="Choose Entry Mode" back /><div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-sm font-extrabold text-slate-800">{shop.name}</p><p className="mt-1 text-xs text-slate-500">{shop.address}</p></div><p className="mb-3 mt-6 text-xs font-bold text-slate-700">How would you like to enter delivery?</p><div className="space-y-3">{options.map(({ mode, title, description, icon: Icon, color }) => <button key={mode} onClick={() => navigate(`/delivery/new/${shopId}?mode=${mode}`)} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300"><span className={`grid h-10 w-10 place-items-center rounded-xl ${color}`}><Icon size={21} /></span><span className="flex-1"><span className="block text-sm font-extrabold text-slate-800">{title}</span><span className="mt-1 block text-xs text-slate-500">{description}</span></span><ChevronRight className="text-blue-700" size={19} /></button>)}</div><p className="mt-5 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">Tip: Quick entry is fastest for a busy delivery.</p></>;
}
