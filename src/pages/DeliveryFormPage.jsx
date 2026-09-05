import { Minus, PackagePlus, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useLine } from '../contexts/LineContext';
import { ErrorState, LoadingState, PageHeader, PrimaryButton } from '../components/Page';
import { formatCurrency } from '../utils/format';

export function DeliveryFormPage({ editing = false }) {
  const { shopId, orderId } = useParams();
  const [searchParams] = useSearchParams();
  const { line, refreshLine } = useLine();
  const [shop, setShop] = useState(null);
  const [snacks, setSnacks] = useState([]);
  const [mode, setMode] = useState(searchParams.get('mode') === 'items' ? 'ITEMIZED' : 'QUICK');
  const [totalAmount, setTotalAmount] = useState('');
  const [collectedAmount, setCollectedAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let live = true;
    const load = async () => {
      try {
        const snackRequest = api.listSnacks();
        if (editing) {
          const [delivery, loadedSnacks] = await Promise.all([api.getDelivery(orderId), snackRequest]);
          if (!live) return;
          setShop(delivery.shopId);
          setSnacks(loadedSnacks);
          setMode(delivery.entryType);
          setTotalAmount(String(delivery.totalPayableAmount));
          setCollectedAmount(String(delivery.collectedAmount));
          setNotes(delivery.notes || '');
          setPaymentMode(delivery.collectionPayments?.[0]?.paymentMode || 'CASH');
          setItems(delivery.items.map((item) => ({ snackId: item.snackId._id || item.snackId, quantity: item.orderedQuantity })));
        } else {
          const [loadedShop, loadedSnacks] = await Promise.all([api.getShop(shopId), snackRequest]);
          if (!live) return;
          setShop(loadedShop);
          setSnacks(loadedSnacks);
        }
      } catch (requestError) { if (live) setError(requestError.message); } finally { if (live) setLoading(false); }
    };
    load();
    return () => { live = false; };
  }, [editing, orderId, shopId]);

  const selectedItems = useMemo(() => items.map((item) => ({ ...item, snack: snacks.find((snack) => snack._id === item.snackId) })).filter((item) => item.snack), [items, snacks]);
  const itemTotal = useMemo(() => selectedItems.reduce((sum, item) => sum + item.quantity * item.snack.sellingPrice, 0), [selectedItems]);
  const actualTotal = mode === 'ITEMIZED' ? itemTotal : Number(totalAmount || 0);
  const collectionValue = Number(collectedAmount || 0);
  const pendingAmount = Math.max(0, actualTotal - collectionValue);

  const addItem = (snackId) => { if (snackId && !items.some((i) => i.snackId === snackId)) setItems((current) => [...current, { snackId, quantity: 1 }]); };
  const updateQuantity = (snackId, amount) => setItems((current) => current.map((item) => item.snackId === snackId ? { ...item, quantity: Math.max(1, Math.min((snacks.find((snack) => snack._id === snackId)?.stock || 999), item.quantity + amount)) } : item));
  const removeItem = (snackId) => setItems((current) => current.filter((item) => item.snackId !== snackId));

  const handleSnackCreated = (newSnack) => {
    setSnacks((current) => [...current, newSnack]);
    addItem(newSnack._id);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!shop) return;
    if (!editing && !line) {
      setError('Please start a delivery line from Home before creating a delivery.');
      return;
    }
    if (mode === 'ITEMIZED' && items.length === 0) {
      setError('Please select at least one snack item to proceed.');
      return;
    }
    if (mode === 'QUICK' && (!Number.isFinite(actualTotal) || actualTotal <= 0)) {
      setError('Please enter a total amount greater than ₹0.');
      return;
    }
    if (!Number.isFinite(collectionValue) || collectionValue < 0) {
      setError('Please enter a valid collected amount.');
      return;
    }
    if (collectionValue > actualTotal + 0.005) {
      setError('Collected amount cannot be greater than the delivery bill amount.');
      return;
    }

    setSaving(true);
    try {
      const isShopOnLine = line?.shops?.some((entry) => String(entry.shopId) === String(shop._id) || String(entry._id) === String(shop._id));
      if (!editing && line && !isShopOnLine) {
        await api.addShopToLine(line._id, shop._id);
      }

      const payload = {
        ...(editing ? {} : { lineId: line._id, shopId: shop._id }),
        entryType: mode,
        totalAmount: actualTotal,
        collectedAmount: collectionValue,
        notes,
        paymentMode,
        items: items.map((item) => ({ snackId: item.snackId, quantity: item.quantity }))
      };
      const delivery = editing ? await api.updateDelivery(orderId, payload) : await api.createDelivery(payload);
      await refreshLine(delivery.lineId || line?._id);
      navigate(`/deliveries/${delivery._id}`, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Preparing delivery entry…" />;
  if (error && !shop) return <ErrorState message={error} />;
  if (!shop) return null;

  return (
    <>
      <PageHeader
        title={editing ? 'Edit Delivery' : mode === 'ITEMIZED' ? 'Item-wise Entry' : 'Quick Amount Entry'}
        back
        subtitle={shop.name}
      />
      <form onSubmit={submit} className="space-y-5 pb-4">
        <section className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-sm font-extrabold text-slate-800">{shop.name}</p>
          <p className="mt-1 text-xs text-slate-500">{shop.address}</p>
        </section>

        {mode === 'ITEMIZED' ? (
          <ItemEditor
            items={selectedItems}
            allSnacks={snacks}
            addItem={addItem}
            updateQuantity={updateQuantity}
            removeItem={removeItem}
            onSnackCreated={handleSnackCreated}
          />
        ) : (
          <MoneyField label="Total amount (₹)" value={totalAmount} onChange={setTotalAmount} autoFocus />
        )}

        {mode === 'ITEMIZED' && (
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex justify-between text-sm font-bold text-slate-800">
              <span>Total amount</span>
              <span>{formatCurrency(itemTotal)}</span>
            </div>
          </section>
        )}

        <section className="space-y-3">
          <MoneyField
            label="Collected amount (₹)"
            value={collectedAmount}
            onChange={setCollectedAmount}
            max={Number.isFinite(actualTotal) && actualTotal > 0 ? actualTotal : undefined}
          />
          {actualTotal > 0 && (
            <p className="-mt-1 text-[11px] font-medium text-slate-500">
              You can collect up to {formatCurrency(actualTotal)} for this delivery.
            </p>
          )}
          <div className="rounded-lg bg-red-50 px-3 py-2">
            <span className="text-xs font-bold text-red-600">Pending amount</span>
            <span className="float-right text-sm font-extrabold text-red-600">{formatCurrency(pendingAmount)}</span>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-700">Payment method</span>
            <select
              value={paymentMode}
              onChange={(event) => setPaymentMode(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank transfer</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </label>
        </section>

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-slate-700">Notes (optional)</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Add note…"
            rows="3"
            className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        {error && <div className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-600">{error}</div>}

        <PrimaryButton type="submit" loading={saving} className="w-full">
          {editing ? 'Update delivery' : 'Save delivery'}
        </PrimaryButton>
      </form>
    </>
  );
}

function MoneyField({ label, value, onChange, autoFocus = false, max }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-700">{label}</span>
      <input
        autoFocus={autoFocus}
        required
        min="0"
        max={max}
        step="0.01"
        inputMode="decimal"
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="0"
        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function ItemEditor({ items, allSnacks, addItem, updateQuantity, removeItem, onSnackCreated }) {
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const availableSnacks = useMemo(() => {
    return allSnacks.filter(
      (snack) =>
        !items.some((item) => item.snack._id === snack._id) &&
        (snack.name.toLowerCase().includes(search.toLowerCase()) ||
         (snack.snackCategory && snack.snackCategory.toLowerCase().includes(search.toLowerCase())))
    );
  }, [allSnacks, items, search]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-extrabold text-slate-800">Selected Items ({items.length})</h2>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800"
        >
          <PackagePlus size={15} /> + Create New Snack
        </button>
      </div>

      {/* Selected Items List */}
      {items.length ? (
        <div className="space-y-2">
          {items.map(({ snack, quantity }) => (
            <div key={snack._id} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-800">{snack.name}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  ₹{snack.sellingPrice} per unit
                </p>
              </div>

              <div className="flex items-center rounded-lg border border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={() => updateQuantity(snack._id, -1)}
                  className="p-1.5 text-slate-500 hover:text-slate-800"
                >
                  <Minus size={14} />
                </button>
                <span className="w-7 text-center text-xs font-bold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(snack._id, 1)}
                  className="p-1.5 text-slate-500 hover:text-slate-800"
                >
                  <Plus size={14} />
                </button>
              </div>

              <span className="w-14 text-right text-xs font-extrabold text-slate-800">
                ₹{quantity * snack.sellingPrice}
              </span>

              <button
                type="button"
                onClick={() => removeItem(snack._id)}
                className="p-1 text-red-500 hover:text-red-700"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-400">
          No items added yet. Search or select snacks below.
        </p>
      )}

      {/* Snack Picker / Searchable Dropdown */}
      <div className="border-t border-slate-100 pt-3">
        <label className="mb-1.5 block text-xs font-bold text-slate-700">Select Snack to Add</label>
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search snacks by name or category…"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {availableSnacks.length > 0 ? (
          <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/70 p-1.5 space-y-1">
            {availableSnacks.map((snack) => (
              <button
                key={snack._id}
                type="button"
                onClick={() => {
                  addItem(snack._id);
                  setSearch('');
                }}
                className="flex w-full items-center justify-between rounded-lg p-2 text-left transition hover:bg-white hover:shadow-sm"
              >
                <div>
                  <span className="block text-xs font-bold text-slate-800">{snack.name}</span>
                  {snack.snackCategory && (
                    <span className="text-[10px] text-slate-400">{snack.snackCategory}</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="block text-xs font-extrabold text-blue-700">₹{snack.sellingPrice}</span>
                  <span className="text-[10px] font-semibold text-slate-500">+ Add</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-2 rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-400">
            {allSnacks.length === 0
              ? 'No snacks available in directory. Click "+ Create New Snack" above to add your first item.'
              : search
              ? 'No matching snacks found. Click "+ Create New Snack" to create it.'
              : 'All available snacks are already added.'}
          </div>
        )}
      </div>

      {/* Modal to Create New Snack */}
      {showCreateModal && (
        <CreateSnackModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(snack) => {
            onSnackCreated(snack);
            setShowCreateModal(false);
          }}
        />
      )}
    </section>
  );
}

function CreateSnackModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '',
    sellingPrice: '',
    mrp: '',
    acquiringPrice: '',
    stock: '100',
    snackCategory: 'SNACKS'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSaveSnack = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setError('');

    const sellingPrice = Number(form.sellingPrice);
    const mrp = Number(form.mrp || form.sellingPrice);
    const acquiringPrice = Number(form.acquiringPrice || Math.round(sellingPrice * 0.7));
    const stock = Number(form.stock || 100);

    if (!form.name.trim()) {
      setError('Snack name is required');
      return;
    }
    if (isNaN(sellingPrice) || sellingPrice <= 0) {
      setError('Enter a valid selling price');
      return;
    }

    setSaving(true);
    try {
      const createdSnack = await api.createSnack({
        name: form.name.trim(),
        sellingPrice,
        mrp,
        acquiringPrice,
        stock,
        snackCategory: form.snackCategory,
        isAvailable: true
      });
      onCreated(createdSnack);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
            <PackagePlus size={18} className="text-blue-700" /> Create New Snack Item
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-700">Snack Name</span>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Banana Chips 100g"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium outline-none focus:border-blue-500"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-700">Selling Price (₹)</span>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={form.sellingPrice}
                onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                placeholder="₹30"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium outline-none focus:border-blue-500"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-700">MRP (₹)</span>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={form.mrp}
                onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                placeholder="₹30"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium outline-none focus:border-blue-500"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-700">Cost Price (₹)</span>
              <input
                type="number"
                required
                min="0"
                step="1"
                value={form.acquiringPrice}
                onChange={(e) => setForm({ ...form, acquiringPrice: e.target.value })}
                placeholder="₹20"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium outline-none focus:border-blue-500"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-700">Initial Stock</span>
              <input
                type="number"
                required
                min="1"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                placeholder="100"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium outline-none focus:border-blue-500"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-700">Category</span>
            <select
              value={form.snackCategory}
              onChange={(e) => setForm({ ...form, snackCategory: e.target.value })}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium outline-none focus:border-blue-500"
            >
              <option value="SNACKS">SNACKS</option>
              <option value="SWEETS">SWEETS</option>
              <option value="CHIPS">CHIPS</option>
              <option value="CHAKKULI">CHAKKULI</option>
              <option value="CARBONATED DRINKS">CARBONATED DRINKS</option>
              <option value="JUICES">JUICES</option>
              <option value="WATER">WATER</option>
            </select>
          </label>

          {error && <p className="text-xs font-bold text-red-600">{error}</p>}

          <div className="flex gap-2 pt-2">
            <PrimaryButton type="button" onClick={handleSaveSnack} loading={saving} className="flex-1">
              Create & Select
            </PrimaryButton>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
