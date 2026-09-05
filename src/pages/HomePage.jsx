import { Bell, ChevronRight, Plus, Route, Store } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useLine } from '../contexts/LineContext';
import { AmountTriplet, ErrorState, LoadingState, PrimaryButton } from '../components/Page';
import { formatTime, todayLabel } from '../utils/format';

export function HomePage() {
  const { line, isLoading, error, refreshLine } = useLine();
  const navigate = useNavigate();
  const recentOrders = line?.shops.flatMap((shop) => shop.orders.map((order) => ({ ...order, shop })))
    .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)).slice(0, 4) || [];

  const startLine = async () => {
    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newLine = await api.createLine({ lineName: `Delivery line · ${todayLabel()} (${timeStr})`, deliveryDate: now.toISOString() });
      await refreshLine(newLine._id);
      navigate('/line');
    } catch (requestError) {
      window.alert(requestError.message);
    }
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} retry={() => refreshLine()} />;

  return <>
    <section className="-mx-4 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-700 px-4 pb-12 pt-[calc(env(safe-area-inset-top)+1.5rem)] text-white sm:-mx-6 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-sm font-bold text-blue-100">Good morning!</p><p className="mt-1 text-xs text-blue-100/90">{todayLabel()}</p></div>
        <Bell size={20} className="mt-1" />
      </div>
    </section>

    <section className="relative -mt-7 rounded-2xl bg-white p-4 shadow-xl shadow-blue-950/10">
      {line ? <>
        <div className="mb-4 flex items-center justify-between">
          <div><h1 className="text-base font-extrabold text-slate-900">Current Line</h1><p className="mt-0.5 text-xs text-slate-500">{line.lineName}</p></div>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">In progress</span>
        </div>
        <AmountTriplet total={line.summary.totalAmount} collected={line.summary.collectedAmount} pending={line.summary.pendingAmount} />
        <div className="mt-5 space-y-2">
          <PrimaryButton className="w-full" onClick={startLine}><Plus size={18} /> Start new delivery line</PrimaryButton>
          <div className="flex gap-2">
            <button type="button" onClick={() => navigate('/line')} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100">View Lines</button>
            <button type="button" onClick={() => navigate('/shops')} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100">Shops/Snacks</button>
          </div>
        </div>
      </> : <>
        <div className="flex items-start gap-3"><div className="rounded-xl bg-blue-50 p-3 text-blue-700"><Route size={24} /></div><div><h1 className="text-base font-extrabold text-slate-900">Start new delivery line</h1><p className="mt-1 text-sm leading-5 text-slate-500">Create a new delivery route run, add shops, and record collections.</p></div></div>
        <PrimaryButton className="mt-5 w-full" onClick={startLine}><Plus size={18} /> Start new delivery line</PrimaryButton>
      </>}
    </section>

    {line && <section className="mt-7">
      <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-extrabold text-slate-900">Recent deliveries</h2><Link to="/line" className="flex items-center gap-0.5 text-xs font-bold text-blue-700">View all <ChevronRight size={14} /></Link></div>
      {recentOrders.length ? <div className="space-y-2.5">{recentOrders.map((order, index) => <Link to={`/deliveries/${order._id}`} key={order._id} className="block rounded-xl border border-slate-100 bg-white px-3 py-3 shadow-sm transition hover:border-blue-100 hover:shadow">
        <div className="flex items-center gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-800">{order.shop.name}</p><p className="mt-0.5 text-[11px] text-slate-400">{formatTime(order.orderDate)}</p></div><ChevronRight className="text-slate-300" size={17} /></div>
        <div className="mt-3 border-t border-slate-100 pt-3"><AmountTriplet compact total={order.totalPayableAmount} collected={order.collectedAmount} pending={order.deliveryPendingAmount} /></div>
      </Link>)}</div> : <EmptyDeliveries />}
    </section>}
  </>;
}

function EmptyDeliveries() {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center"><Store className="mx-auto text-slate-300" size={28} /><p className="mt-3 text-sm font-bold text-slate-600">No deliveries yet</p><p className="mt-1 text-xs text-slate-400">Add a shop delivery to see it here.</p></div>;
}
