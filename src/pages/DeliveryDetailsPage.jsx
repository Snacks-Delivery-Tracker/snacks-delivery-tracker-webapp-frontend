import { MoreVertical, Pencil, Phone, ReceiptText, Share2, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useLine } from '../contexts/LineContext';
import { AmountTriplet, ErrorState, LoadingState, PageHeader } from '../components/Page';
import { formatDate, formatTime } from '../utils/format';

export function DeliveryDetailsPage() {
  const { orderId } = useParams();
  const [delivery, setDelivery] = useState(null);
  const [error, setError] = useState('');
  const { refreshLine } = useLine();
  const navigate = useNavigate();
  useEffect(() => { api.getDelivery(orderId).then(setDelivery).catch((requestError) => setError(requestError.message)); }, [orderId]);
  const remove = async () => {
    if (!window.confirm('Delete this delivery and its recorded collection?')) return;
    try { await api.deleteDelivery(orderId); await refreshLine(); navigate('/line', { replace: true }); } catch (requestError) { window.alert(requestError.message); }
  };
  const share = async () => { if (navigator.share) await navigator.share({ title: 'Snack delivery', text: `Delivery for ${delivery.shopId.name}: ₹${delivery.totalPayableAmount}` }); else navigator.clipboard?.writeText(`${delivery.shopId.name} · ₹${delivery.totalPayableAmount}`); };
  if (error) return <ErrorState message={error} />;
  if (!delivery) return <LoadingState label="Loading delivery…" />;
  const shop = delivery.shopId;
  const rows = [
    ['Delivered at', `${formatDate(delivery.orderDate)} · ${formatTime(delivery.orderDate)}`],
    ['Entry type', delivery.entryType === 'ITEMIZED' ? 'Item-wise entry' : 'Quick amount entry'],
    ['Total amount', `₹${delivery.totalPayableAmount}`],
    ['Collected amount', `₹${delivery.collectedAmount}`],
    ['Pending amount', `₹${delivery.deliveryPendingAmount}`]
  ];
  return <><PageHeader title="Delivery Details" back action={<button className="p-1" aria-label="More options"><MoreVertical size={20} /></button>} /><section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><Link to={`/shops/${shop._id}/details`} className="text-sm font-extrabold text-slate-900 hover:text-blue-700">{shop.name}</Link><p className="mt-1 text-xs text-slate-500">{shop.address}</p></div>{shop.ownerNumber && <a href={`tel:${shop.ownerNumber}`} className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-blue-700"><Phone size={18} /></a>}</div><div className="mt-4 border-t border-slate-100 pt-4"><AmountTriplet total={delivery.totalPayableAmount} collected={delivery.collectedAmount} pending={delivery.deliveryPendingAmount} /></div></section>
    <section className="mt-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">{rows.map(([label, value]) => <div key={label} className="flex items-center justify-between border-b border-slate-100 py-2.5 last:border-0"><span className="text-xs text-slate-500">{label}</span><span className={`text-xs font-bold ${label.includes('Collected') ? 'text-emerald-600' : label.includes('Pending') ? 'text-red-500' : 'text-slate-800'}`}>{value}</span></div>)}{delivery.notes && <div className="pt-2.5"><p className="text-xs text-slate-500">Notes</p><p className="mt-1 text-xs font-medium text-slate-700">{delivery.notes}</p></div>}</section>
    {delivery.items.length > 0 && <section className="mt-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><h2 className="text-sm font-extrabold text-slate-800">Items</h2><div className="mt-3 space-y-2">{delivery.items.map((item) => <div key={item._id} className="flex justify-between text-xs"><span className="font-medium text-slate-700">{item.snackId.name} × {item.orderedQuantity}</span><span className="font-bold text-slate-800">₹{item.totalPrice}</span></div>)}</div></section>}
    <div className="mt-5 grid grid-cols-4 gap-2"><Link to={`/deliveries/${orderId}/bill`} className="action-tile"><ReceiptText size={19} />Bill</Link><Link to={`/deliveries/${orderId}/edit`} className="action-tile"><Pencil size={19} />Edit</Link><button onClick={share} className="action-tile"><Share2 size={19} />Share</button><button onClick={remove} className="action-tile text-red-500"><Trash2 size={19} />Delete</button></div></>;
}
