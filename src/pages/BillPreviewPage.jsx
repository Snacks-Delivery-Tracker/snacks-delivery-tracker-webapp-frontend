import { Download, Printer, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { ErrorState, LoadingState, PageHeader, PrimaryButton } from '../components/Page';
import { formatDate, formatTime } from '../utils/format';

export function BillPreviewPage() {
  const { orderId } = useParams();
  const [delivery, setDelivery] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.getDelivery(orderId).then(setDelivery).catch((requestError) => setError(requestError.message)); }, [orderId]);
  const print = () => window.print();
  const share = () => navigator.share?.({ title: `Bill – ${delivery.shopId.name}`, text: `Total ₹${delivery.totalPayableAmount}` });
  if (error) return <ErrorState message={error} />;
  if (!delivery) return <LoadingState label="Preparing bill…" />;
  return <><PageHeader title="Bill Preview" back action={<button onClick={share} aria-label="Share bill"><Share2 size={19} /></button>} /><article className="print-sheet rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="border-b-2 border-slate-800 pb-4"><h1 className="text-sm font-black uppercase tracking-wide text-slate-900">Snacks Deliters</h1><p className="mt-1 text-[11px] text-slate-500">Delivery receipt</p><div className="mt-4 flex justify-between text-[11px] text-slate-600"><span>{delivery.shopId.name}<br />{delivery.shopId.address}</span><span className="text-right">Date: {formatDate(delivery.orderDate)}<br />Time: {formatTime(delivery.orderDate)}</span></div></div><table className="mt-4 w-full text-left text-[11px]"><thead className="border-y border-slate-300 bg-slate-50 text-slate-600"><tr><th className="px-1 py-2">#</th><th className="px-1 py-2">Item</th><th className="px-1 py-2 text-right">Qty</th><th className="px-1 py-2 text-right">Rate</th><th className="px-1 py-2 text-right">Amount</th></tr></thead><tbody>{delivery.items.length ? delivery.items.map((item, index) => <tr key={item._id} className="border-b border-slate-100"><td className="px-1 py-2">{index + 1}</td><td className="px-1 py-2">{item.snackId.name}</td><td className="px-1 py-2 text-right">{item.orderedQuantity}</td><td className="px-1 py-2 text-right">₹{item.unitPrice}</td><td className="px-1 py-2 text-right">₹{item.totalPrice}</td></tr>) : <tr><td colSpan="4" className="px-1 py-3 text-slate-500">Quick amount delivery</td><td className="px-1 py-3 text-right font-bold">₹{delivery.totalPayableAmount}</td></tr>}</tbody></table><div className="ml-auto mt-5 max-w-48 space-y-2 text-right text-xs"><p>Total amount <strong className="ml-5 text-slate-900">₹{delivery.totalPayableAmount}</strong></p><p>Collected amount <strong className="ml-5 text-emerald-600">₹{delivery.collectedAmount}</strong></p><p className="border-t border-slate-200 pt-2">Pending amount <strong className="ml-5 text-red-500">₹{delivery.deliveryPendingAmount}</strong></p></div></article><div className="mt-5 grid grid-cols-2 gap-3 print:hidden"><PrimaryButton onClick={print}><Printer size={18} /> Print / save PDF</PrimaryButton><button onClick={print} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white text-sm font-bold text-blue-700"><Download size={18} /> Download PDF</button></div></>;
}
