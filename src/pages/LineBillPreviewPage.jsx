import { Download, Printer, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { AmountTriplet, ErrorState, LoadingState, PageHeader, PrimaryButton } from '../components/Page';
import { formatCurrency, formatDate, formatTime } from '../utils/format';

export function LineBillPreviewPage() {
  const { lineId } = useParams();
  const [line, setLine] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.getLine(lineId)
      .then((loadedLine) => active && setLine(loadedLine))
      .catch((requestError) => active && setError(requestError.message));
    return () => { active = false; };
  }, [lineId]);

  if (error) return <ErrorState message={error} />;
  if (!line) return <LoadingState label="Preparing line bill…" />;

  const share = async () => {
    const text = `${line.lineName} · Total ${formatCurrency(line.summary.totalAmount)} · Collected ${formatCurrency(line.summary.collectedAmount)}`;
    if (navigator.share) await navigator.share({ title: 'Line Bill', text });
    else await navigator.clipboard?.writeText(text);
  };

  return (
    <>
      <PageHeader
        title="Line Bill"
        subtitle={`${line.shops.length} shops`}
        back
        action={<button onClick={share} aria-label="Share line bill"><Share2 size={19} /></button>}
      />

      <article className="print-sheet rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-6">
        {/* Consolidated Line Header */}
        <div className="border-b-2 border-slate-800 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-sm font-black uppercase tracking-wide text-slate-900">Snacks Delivery Tracker</h1>
              <p className="mt-1 text-[11px] font-bold text-slate-600">CONSOLIDATED LINE BILL</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${line.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
              {line.status}
            </span>
          </div>
          <div className="mt-4 flex justify-between gap-4 text-[11px] text-slate-600">
            <span>
              <b className="block text-slate-800">{line.lineName}</b>
              {line.shops.length} shop{line.shops.length === 1 ? '' : 's'} on this route
            </span>
            <span className="text-right">
              Date: {formatDate(line.deliveryDate || line.createdAt)}
              <br />Generated: {formatDate(new Date())}
            </span>
          </div>
        </div>

        {/* Master Line Overview Table */}
        <div>
          <h2 className="mb-2 text-xs font-black uppercase tracking-wider text-slate-800">Route Summary</h2>
          <table className="w-full text-left text-[10px] sm:text-[11px]">
            <thead className="border-y border-slate-300 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-1 py-2">#</th>
                <th className="px-1 py-2">Shop</th>
                <th className="px-1 py-2 text-right">Bill</th>
                <th className="px-1 py-2 text-right">Collected</th>
                <th className="px-1 py-2 text-right">Pending</th>
              </tr>
            </thead>
            <tbody>
              {line.shops.map((shop, index) => (
                <tr key={shop._id} className="border-b border-slate-100">
                  <td className="px-1 py-2.5 align-top">{index + 1}</td>
                  <td className="px-1 py-2.5 align-top">
                    <b className="block text-slate-800">{shop.name}</b>
                    {shop.address && <span className="block text-[9px] text-slate-400">{shop.address}</span>}
                  </td>
                  <td className="px-1 py-2.5 text-right align-top font-bold text-slate-800">{formatCurrency(shop.totalAmount)}</td>
                  <td className="px-1 py-2.5 text-right align-top font-bold text-emerald-600">{formatCurrency(shop.collectedAmount)}</td>
                  <td className="px-1 py-2.5 text-right align-top font-bold text-red-500">{formatCurrency(shop.pendingAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {!line.shops.length && (
            <p className="py-6 text-center text-xs text-slate-400">No shops were added to this line.</p>
          )}

          <div className="mt-4 border-t border-slate-300 pt-4">
            <AmountTriplet total={line.summary.totalAmount} collected={line.summary.collectedAmount} pending={line.summary.pendingAmount} />
          </div>
        </div>

        {/* This invisible element forces a page-break after the summary when printing */}
        {line.shops.length > 0 && <div className="print:block hidden" style={{ pageBreakAfter: 'always' }} />}

        {/* Each shop's detailed bill — each one starts on a fresh page when printing */}
        {line.shops.length > 0 && (
          <div>

            {line.shops.map((shop, shopIdx) => {
              const orders = shop.orders || (shop.latestOrder ? [shop.latestOrder] : []);
              return (
                <section
                  key={shop._id}
                  style={{ pageBreakBefore: 'always' }}
                  className="rounded-2xl border border-slate-200 p-4 bg-white mt-6 first:mt-0"
                >
                  {/* Shop Bill Sub-header */}
                  <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">Shop #{shopIdx + 1} Receipt</span>
                      <h3 className="mt-0.5 text-sm font-extrabold text-slate-900">{shop.name}</h3>
                      {shop.address && <p className="text-[11px] text-slate-500">{shop.address}</p>}
                    </div>
                    <div className="text-right text-[10px] text-slate-500">
                      {orders[0] ? (
                        <>
                          <p className="font-semibold text-slate-700">Date: {formatDate(orders[0].orderDate)}</p>
                          <p>Time: {formatTime(orders[0].orderDate)}</p>
                        </>
                      ) : (
                        <p className="italic text-slate-400">No delivery visit recorded</p>
                      )}
                    </div>
                  </div>

                  {/* Items Breakdown Table */}
                  {orders.length > 0 ? (
                    orders.map((order, orderIdx) => (
                      <div key={order._id || orderIdx} className="mt-3">
                        <table className="w-full text-left text-[10px] sm:text-[11px]">
                          <thead className="border-y border-slate-200 bg-white text-slate-600">
                            <tr>
                              <th className="px-1.5 py-1.5">#</th>
                              <th className="px-1.5 py-1.5">Item</th>
                              <th className="px-1.5 py-1.5 text-right">Qty</th>
                              <th className="px-1.5 py-1.5 text-right">Rate</th>
                              <th className="px-1.5 py-1.5 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items && order.items.length > 0 ? (
                              order.items.map((item, itemIdx) => (
                                <tr key={item._id || itemIdx} className="border-b border-slate-100">
                                  <td className="px-1.5 py-2">{itemIdx + 1}</td>
                                  <td className="px-1.5 py-2 font-medium text-slate-800">
                                    {item.snackId?.name || 'Snack Item'}
                                  </td>
                                  <td className="px-1.5 py-2 text-right">{item.orderedQuantity}</td>
                                  <td className="px-1.5 py-2 text-right">₹{item.unitPrice}</td>
                                  <td className="px-1.5 py-2 text-right font-bold text-slate-800">₹{item.totalPrice}</td>
                                </tr>
                              ))
                            ) : (
                              <tr className="border-b border-slate-100">
                                <td colSpan="4" className="px-1.5 py-2 text-slate-500 italic">Quick Amount Delivery</td>
                                <td className="px-1.5 py-2 text-right font-bold text-slate-800">₹{order.totalPayableAmount}</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-xs text-slate-400">
                      No delivery recorded for this shop in this line.
                    </div>
                  )}

                  {/* Individual Shop Totals */}
                  <div className="ml-auto mt-3 max-w-56 space-y-1.5 border-t border-slate-200 pt-2.5 text-right text-xs">
                    <p className="text-slate-600">
                      Total amount <strong className="ml-4 text-slate-900">₹{shop.totalAmount}</strong>
                    </p>
                    <p className="text-slate-600">
                      Collected amount <strong className="ml-4 text-emerald-600">₹{shop.collectedAmount}</strong>
                    </p>
                    <p className="border-t border-slate-200 pt-1 text-slate-700 font-bold">
                      Pending balance <strong className={`ml-4 ${shop.pendingAmount > 0 ? 'text-red-500' : 'text-emerald-600'}`}>₹{shop.pendingAmount}</strong>
                    </p>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </article>

      <div className="mt-5 grid grid-cols-2 gap-3 print:hidden">
        <PrimaryButton onClick={() => window.print()}><Printer size={18} /> Print / save PDF</PrimaryButton>
        <button onClick={() => window.print()} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white text-sm font-bold text-blue-700">
          <Download size={18} /> Download PDF
        </button>
      </div>
    </>
  );
}
