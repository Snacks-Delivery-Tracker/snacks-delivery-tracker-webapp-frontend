import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  CreditCard,
  FileText,
  IndianRupee,
  Pencil,
  Plus,
  Trash2,
  X,
  AlertCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useLine } from '../contexts/LineContext';
import { ConfirmDialog, ErrorState, LoadingState, PageHeader, PrimaryButton } from '../components/Page';
import { CreateLineModal } from '../components/CreateLineModal';
import { formatDate, todayLabel } from '../utils/format';

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Collect Payment Modal                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */
function CollectPaymentModal({ shop, lineId, onClose, onSuccess }) {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const orderId = shop.latestOrder?._id || shop.orders?.[0]?._id;
  const delivered = shop.totalAmount || 0;
  const paid = shop.collectedAmount || 0;
  const balance = Math.max(0, delivered - paid);

  useEffect(() => {
    // Pre-fill with full balance, let user edit
    setAmount(balance > 0 ? String(balance) : '');
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    if (amountNum > balance + 0.005) {
      setError(`Cannot collect more than the outstanding balance (₹${balance.toFixed(2)}).`);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.processPayment({
        lineId,
        shopId: shop._id,
        amountPaid: amountNum,
        paymentMode,
      });
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Collect Payment</p>
            <h2 className="mt-0.5 text-base font-extrabold text-slate-800">{shop.name}</h2>
            {shop.address && <p className="text-xs text-slate-400">{shop.address}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Balance Summary Cards */}
        <div className="mb-5 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3 text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Delivered</p>
            <p className="mt-1 text-sm font-extrabold text-slate-800">₹{delivered.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3 text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-600">Paid</p>
            <p className="mt-1 text-sm font-extrabold text-emerald-700">₹{paid.toFixed(2)}</p>
          </div>
          <div
            className={`rounded-2xl border p-3 text-center ${
              balance > 0
                ? 'bg-red-50 border-red-100'
                : 'bg-emerald-50 border-emerald-100'
            }`}
          >
            <p
              className={`text-[9px] font-bold uppercase tracking-widest ${
                balance > 0 ? 'text-red-500' : 'text-emerald-600'
              }`}
            >
              Balance
            </p>
            <p
              className={`mt-1 text-sm font-extrabold ${
                balance > 0 ? 'text-red-600' : 'text-emerald-700'
              }`}
            >
              ₹{balance.toFixed(2)}
            </p>
          </div>
        </div>

        {shop.paymentBreakdown && paid > 0 && (
          <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
            <h4 className="mb-2 text-[10px] font-bold uppercase text-slate-500">Payment Breakdown</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(shop.paymentBreakdown)
                .filter(([_, amount]) => amount > 0)
                .map(([mode, amount]) => (
                  <div key={mode} className="flex justify-between">
                    <span className="font-semibold text-slate-600">{mode}</span>
                    <span className="font-bold text-slate-800">₹{amount}</span>
                  </div>
              ))}
            </div>
          </div>
        )}

        {orderId && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/deliveries/${orderId}/bill`);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
            >
              <FileText size={15} /> Download / View Shop Bill
            </button>
          </div>
        )}

        {balance <= 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-100 p-5 text-center">
            <CheckCircle2 size={28} className="text-emerald-500" />
            <p className="text-sm font-bold text-emerald-700">Fully Paid!</p>
            <p className="text-xs text-emerald-600">No outstanding balance for this shop.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount Input */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Amount to Collect
              </label>
              <div className="relative">
                <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={inputRef}
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={balance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Max ₹${balance.toFixed(2)}`}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-8 pr-4 text-sm font-bold text-slate-800 placeholder-slate-300 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
              {/* Quick fill buttons */}
              <div className="mt-2 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setAmount(String(balance))}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 transition hover:bg-blue-100"
                >
                  Full ₹{balance.toFixed(0)}
                </button>
                {balance >= 500 && (
                  <button
                    type="button"
                    onClick={() => setAmount('500')}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600 transition hover:bg-slate-100"
                  >
                    ₹500
                  </button>
                )}
                {balance >= 100 && (
                  <button
                    type="button"
                    onClick={() => setAmount(String(Math.ceil(balance / 2)))}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600 transition hover:bg-slate-100"
                  >
                    Half
                  </button>
                )}
              </div>
            </div>

            {/* Payment Mode — dropdown with backend-valid enum values */}
            <div>
              <label htmlFor="payment-mode-select" className="mb-1.5 block text-xs font-bold text-slate-600">
                Payment Mode
              </label>
              <select
                id="payment-mode-select"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 appearance-none"
              >
                <option value="CASH">💵  Cash</option>
                <option value="UPI">📱  UPI</option>
                <option value="CARD">💳  Card</option>
                <option value="CHEQUE">🏦  Cheque</option>
                <option value="BANK_TRANSFER">🔁  Bank Transfer</option>
              </select>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 p-3">
                <AlertCircle size={14} className="shrink-0 text-red-500" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-200 transition hover:from-blue-700 hover:to-blue-800 disabled:opacity-60"
            >
              {saving ? 'Processing…' : `Collect ₹${parseFloat(amount || 0).toFixed(2)}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Shop Row inside a Line Card                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */
function ShopPaymentRow({ shop, lineId, isOpen, onRemove, removing, onPaymentCollected }) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const delivered = shop.totalAmount || 0;
  const paid = shop.collectedAmount || 0;
  const pending = shop.pendingAmount || 0;
  const hasDelivery = delivered > 0;
  const isFullyPaid = hasDelivery && pending <= 0;
  const hasPartialPay = hasDelivery && paid > 0 && pending > 0;
  const isUnpaid = hasDelivery && paid === 0;

  // Colour semantics
  let cardBorderClass = 'border-slate-100 bg-slate-50/50';
  let statusDot = null;

  if (hasDelivery) {
    if (isFullyPaid) {
      cardBorderClass = 'border-emerald-200 bg-emerald-50/40';
      statusDot = <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Fully paid" />;
    } else if (hasPartialPay) {
      cardBorderClass = 'border-amber-200 bg-amber-50/40';
      statusDot = <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0 animate-pulse" title="Partially paid" />;
    } else if (isUnpaid) {
      cardBorderClass = 'border-amber-200 bg-amber-50/30';
      statusDot = <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0 animate-pulse" title="Unpaid" />;
    }
  } else if (shop.lineSummary?.startingOutstanding > 0) {
      // Just manually loaded, no delivery yet
  } else if (shop.deliveryWeekday) { // Or we could check line summary lineType, but weekday logic is simpler if we assume weekday loaded has red card
      cardBorderClass = 'border-red-400 bg-red-50/50';
  }

  const handleRowClick = () => {
    if (!isOpen) return;
    if (hasDelivery) {
      // Delivered → open payment collector
      setShowModal(true);
    } else {
      // No delivery yet → go to entry mode
      navigate(`/entry-mode/${shop._id}`);
    }
  };

  const handleSuccess = () => {
    setShowModal(false);
    onPaymentCollected(); // triggers fetchDetails + onRefreshAll in parent
  };

  return (
    <>
      <div
        onClick={handleRowClick}
        className={`flex items-center justify-between gap-2 rounded-2xl border p-3 transition ${cardBorderClass} ${isOpen ? 'cursor-pointer hover:shadow-sm hover:border-opacity-80' : ''}`}
      >
        {/* Left: number + name + address */}
        <div className="flex min-w-0 flex-1 items-start gap-2">
          {statusDot && <div className="mt-1.5">{statusDot}</div>}
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-slate-800">{shop.name}</p>
            {shop.address && <p className="truncate text-[10px] text-slate-400">{shop.address}</p>}

            {hasDelivery ? (
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] font-semibold">
                <span className="text-slate-500">
                  Delivered: <span className="font-extrabold text-slate-700">₹{delivered.toFixed(0)}</span>
                </span>
                <span className="text-emerald-600">
                  Paid: <span className="font-extrabold">₹{paid.toFixed(0)}</span>
                </span>
                {pending > 0 && (
                  <span className="text-red-600">
                    Pending: <span className="font-extrabold">₹{pending.toFixed(0)}</span>
                  </span>
                )}
              </div>
            ) : isOpen ? (
              <p className="mt-1 text-[10px] font-semibold text-blue-700">+ Tap to record delivery</p>
            ) : null}
          </div>
        </div>

        {/* Right: collect button or paid badge + remove */}
        <div className="flex shrink-0 items-center gap-1.5">
          {isOpen && hasDelivery && pending > 0 && (
            <div className="flex items-center gap-1 rounded-xl bg-blue-600 px-2.5 py-1.5 text-[10px] font-bold text-white shadow-sm">
              <CreditCard size={11} />
              Collect
            </div>
          )}
          {isOpen && hasDelivery && isFullyPaid && (
            <CheckCircle2 size={16} className="text-emerald-500" />
          )}
          {shop.latestOrder && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/deliveries/${shop.latestOrder._id}/bill`);
              }}
              title="View & Download Shop Bill"
              className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1.5 text-[10px] font-bold text-slate-700 transition hover:bg-slate-200"
            >
              <FileText size={13} /> Bill
            </button>
          )}
          {isOpen && shop.latestOrder && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/deliveries/${shop.latestOrder._id}/edit`);
              }}
              title="Edit latest delivery amount"
              className="flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1.5 text-[10px] font-bold text-blue-700 transition hover:bg-blue-100"
            >
              <Pencil size={13} /> Edit
            </button>
          )}
          {isOpen && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(shop._id, shop.name, e);
              }}
              disabled={removing}
              title="Remove shop from line"
              className="p-1.5 text-slate-300 transition hover:text-red-500"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <CollectPaymentModal
          shop={shop}
          lineId={lineId}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Line Card                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */
function LineCard({ lineSummaryItem, isExpanded, onToggle, onRefreshAll }) {
  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [closing, setClosing] = useState(false);
  const [removingShopId, setRemovingShopId] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const { refreshLine } = useLine();
  const navigate = useNavigate();

  const fetchDetails = async () => {
    setLoadingDetails(true);
    try {
      const d = await api.getLine(lineSummaryItem._id);
      setDetails(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (isExpanded) fetchDetails();
  }, [isExpanded, lineSummaryItem._id]);

  const askToCloseLine = (e) => {
    e.stopPropagation();
    setConfirmation({ type: 'close' });
  };

  const askToRemoveShop = (shopId, shopName, e) => {
    e.stopPropagation();
    setConfirmation({ type: 'remove-shop', shopId, shopName });
  };

  const askToDeleteLine = (e) => {
    e.stopPropagation();
    setConfirmation({ type: 'delete-line' });
  };

  const confirmAction = async () => {
    if (!confirmation) return;

    if (confirmation.type === 'close') {
      setClosing(true);
      try {
        await api.closeLine(lineSummaryItem._id);
        await Promise.all([fetchDetails(), onRefreshAll(), refreshLine()]);
        setConfirmation(null);
      } catch (err) {
        window.alert(err.message);
      } finally {
        setClosing(false);
      }
      return;
    }

    if (confirmation.type === 'remove-shop') {
      setRemovingShopId(confirmation.shopId);
      try {
        await api.removeShopFromLine(lineSummaryItem._id, confirmation.shopId);
        // Refresh the expanded content, card header, and current-line context
        // together so totals change immediately without a browser reload.
        await Promise.all([fetchDetails(), onRefreshAll(), refreshLine()]);
        setConfirmation(null);
      } catch (err) {
        window.alert(err.message);
      } finally {
        setRemovingShopId('');
      }
      return;
    }

    setDeleting(true);
    try {
      await api.deleteLine(lineSummaryItem._id);
      await Promise.all([onRefreshAll(), refreshLine()]);
      setConfirmation(null);
    } catch (err) {
      window.alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const isOpen = lineSummaryItem.status === 'OPEN';

  // Quick payment progress for the collapsed summary
  const totalDelivered = lineSummaryItem.totalGoodsDelivered || 0;
  const totalCollected = lineSummaryItem.totalCashCollected || 0;
  const totalPending = Math.max(0, totalDelivered - totalCollected);

  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-all ${
        isOpen ? 'border-blue-200 bg-white shadow-sm' : 'border-slate-200 bg-slate-50/50'
      }`}
    >
      {/* Collapsed header */}
      <div
        onClick={onToggle}
        className="flex cursor-pointer items-start justify-between p-4 transition hover:bg-slate-50/80"
      >
        <div className="min-w-0 flex-1 pr-3">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-sm font-extrabold text-slate-800">{lineSummaryItem.lineName}</h2>
            {isOpen ? (
              <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                OPEN
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                CLOSED
              </span>
            )}
          </div>

          <p className="mt-1 text-[11px] text-slate-500">
            {formatDate(lineSummaryItem.deliveryDate || lineSummaryItem.createdAt)} · {lineSummaryItem.shops?.length || 0} shops
          </p>

          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-2">
              <span className="block text-[9px] text-slate-400 font-semibold">DELIVERED</span>
              <span className="font-bold text-slate-800">₹{totalDelivered}</span>
            </div>
            <div className="rounded-xl bg-emerald-50/60 border border-emerald-100/60 p-2">
              <span className="block text-[9px] text-emerald-600 font-semibold">COLLECTED</span>
              <span className="font-bold text-emerald-700">₹{totalCollected}</span>
            </div>
            <div
              className={`rounded-xl border p-2 ${
                totalPending > 0
                  ? 'bg-red-50/60 border-red-100/60'
                  : 'bg-emerald-50/60 border-emerald-100/60'
              }`}
            >
              <span
                className={`block text-[9px] font-semibold ${
                  totalPending > 0 ? 'text-red-500' : 'text-emerald-600'
                }`}
              >
                PENDING
              </span>
              <span
                className={`font-bold ${totalPending > 0 ? 'text-red-600' : 'text-emerald-700'}`}
              >
                ₹{totalPending}
              </span>
            </div>
          </div>
        </div>

        <span className="shrink-0 text-slate-400 mt-1">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </span>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-slate-100 bg-white p-4 space-y-4">
          {loadingDetails ? (
            <LoadingState label="Fetching route details…" />
          ) : details ? (
            <>
              {/* Compact payment progress bar — no duplicate of collapsed totals */}
              {details.summary.totalAmount > 0 && (() => {
                const pct = Math.min(100, Math.round((details.summary.collectedAmount / details.summary.totalAmount) * 100));
                const pending = details.summary.pendingAmount;
                return (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <div className="mb-2 flex items-center justify-between text-[10px] font-bold">
                      <span className="text-slate-500">
                        {details.shops.filter((s) => (s.pendingAmount || 0) > 0).length} shop(s) with pending payments
                      </span>
                      <span className={pending > 0 ? 'text-red-600' : 'text-emerald-600'}>
                        {pct}% collected
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct >= 100 ? 'bg-emerald-500' : pct > 50 ? 'bg-amber-400' : 'bg-red-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-2 flex justify-between text-[10px] font-semibold">
                      <span className="text-emerald-600">Collected: ₹{details.summary.collectedAmount.toLocaleString('en-IN')}</span>
                      {pending > 0 && <span className="text-red-600">Still pending: ₹{pending.toLocaleString('en-IN')}</span>}
                      {pending <= 0 && <span className="text-emerald-600">✓ Fully collected!</span>}
                    </div>
                  </div>
                );
              })()}

              {isOpen && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/line/add-shop?lineId=${lineSummaryItem._id}`)}
                    className="flex-1 rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-800"
                  >
                    + Add Shop to Line
                  </button>
                  <button
                    type="button"
                    onClick={askToCloseLine}
                    disabled={closing}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {closing ? 'Closing…' : 'Close Line'}
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => navigate(`/lines/${lineSummaryItem._id}/bill`)}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800"
                >
                  <FileText size={15} /> Generate Line Bill
                </button>
                <button
                  type="button"
                  onClick={askToDeleteLine}
                  disabled={deleting}
                  className="text-[11px] font-bold text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  Delete Line
                </button>
              </div>

              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-extrabold text-slate-800">
                  Shops on this route ({details.shops.length})
                </h3>

                {details.shops.length ? (
                  <div className="space-y-2">
                    {details.shops.map((shop) => (
                      <ShopPaymentRow
                        key={shop._id}
                        shop={shop}
                        lineId={lineSummaryItem._id}
                        isOpen={isOpen}
                        onRemove={askToRemoveShop}
                        removing={removingShopId === shop._id}
                        onPaymentCollected={async () => {
                          // Keep the expanded list, collapsed header, and Home
                          // screen context in sync after a collection.
                          await Promise.all([fetchDetails(), onRefreshAll(), refreshLine()]);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-400">
                    No shops added yet. {isOpen && 'Click "+ Add Shop to Line" above.'}
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-400">Failed to load line details.</p>
          )}
        </div>
      )}

      {confirmation && (
        <ConfirmDialog
          title={
            confirmation.type === 'remove-shop'
              ? `Remove ${confirmation.shopName}?`
              : confirmation.type === 'close'
                ? 'Close this delivery line?'
                : 'Permanently delete this line?'
          }
          description={
            confirmation.type === 'remove-shop'
              ? 'The shop stays in your directory. Its figures are removed from this line, and adding it again starts a fresh line visit at ₹0.'
              : confirmation.type === 'close'
                ? 'No more shops, deliveries, or collections can be added after closing this line.'
                : 'This permanently deletes the line and every delivery and collection attached to it. Shop records stay in the directory and item stock is restored. This cannot be undone.'
          }
          confirmLabel={
            confirmation.type === 'remove-shop'
              ? 'Remove Shop'
              : confirmation.type === 'close'
                ? 'Close Line'
                : 'Delete Line Permanently'
          }
          loading={closing || Boolean(removingShopId) || deleting}
          onCancel={() => setConfirmation(null)}
          onConfirm={confirmAction}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Line Page                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */
export function LinePage() {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedLineId, setExpandedLineId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { refreshLine } = useLine();

  const loadAllLines = async () => {
    setLoading(true);
    try {
      const allLines = await api.listLines();
      setLines(allLines);
      setError('');
      const firstOpen = allLines.find((l) => l.status === 'OPEN');
      if (firstOpen && !expandedLineId) setExpandedLineId(firstOpen._id);
      else if (allLines.length && !expandedLineId) setExpandedLineId(allLines[0]._id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllLines();
  }, []);

  if (loading) return <LoadingState label="Loading delivery lines…" />;
  if (error) return <ErrorState message={error} retry={loadAllLines} />;

  const visibleLines = statusFilter === 'ALL'
    ? lines
    : lines.filter((lineItem) => lineItem.status === statusFilter);

  return (
    <>
      <PageHeader
        title="Delivery Lines Dashboard"
        subtitle={`${lines.length} total lines recorded`}
        action={
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/25"
          >
            <Plus size={15} />
            New Line
          </button>
        }
      />

      {!lines.length ? (
        <div className="pt-10 text-center">
          <ClipboardList className="mx-auto text-slate-300" size={42} />
          <h1 className="mt-4 text-base font-extrabold text-slate-800">No delivery lines yet</h1>
          <p className="mt-1 text-xs text-slate-500">Click below to start your first delivery route.</p>
          <PrimaryButton onClick={() => setShowCreateModal(true)} className="mt-5 w-full">
            <Plus size={18} /> Start New Delivery Line
          </PrimaryButton>
        </div>
      ) : (
        <section className="space-y-4 pb-6">
          <div className="flex rounded-xl border border-slate-200 bg-white p-1" role="group" aria-label="Filter delivery lines">
            {[
              ['ALL', `All (${lines.length})`],
              ['OPEN', `Open (${lines.filter((lineItem) => lineItem.status === 'OPEN').length})`],
              ['CLOSED', `Closed (${lines.filter((lineItem) => lineItem.status === 'CLOSED').length})`]
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={`flex-1 rounded-lg px-2 py-2 text-[11px] font-bold transition ${
                  statusFilter === value
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {visibleLines.map((lineItem) => (
            <LineCard
              key={lineItem._id}
              lineSummaryItem={lineItem}
              isExpanded={expandedLineId === lineItem._id}
              onToggle={() =>
                setExpandedLineId(expandedLineId === lineItem._id ? null : lineItem._id)
              }
              onRefreshAll={loadAllLines}
            />
          ))}
          {!visibleLines.length && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-400">
              No {statusFilter.toLowerCase()} delivery lines found.
            </div>
          )}
        </section>
      )}

      {showCreateModal && <CreateLineModal onClose={() => setShowCreateModal(false)} refreshLine={async (lineId) => { await refreshLine(lineId); await loadAllLines(); setExpandedLineId(lineId); }} />}

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
      `}</style>
    </>
  );
}
