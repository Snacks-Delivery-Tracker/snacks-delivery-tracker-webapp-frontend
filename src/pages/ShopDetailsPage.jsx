import { Edit3, Phone, ReceiptText, Save, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { AmountTriplet, ConfirmDialog, ErrorState, LoadingState, PageHeader, PrimaryButton } from '../components/Page';
import { formatDate } from '../utils/format';

export function ShopDetailsPage() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [form, setForm] = useState({ name: '', ownerName: '', ownerNumber: '', ownerEmail: '', address: '', deliveryWeekday: '' });

  const loadData = async () => {
    try {
      const history = await api.getShopHistory(shopId);
      setData(history);
      if (history.shop) {
        setForm({
          name: history.shop.name || '',
          ownerName: history.shop.ownerName || '',
          ownerNumber: history.shop.ownerNumber || '',
          ownerEmail: history.shop.ownerEmail || '',
          address: history.shop.address || '',
          deliveryWeekday: history.shop.deliveryWeekday || ''
        });
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [shopId]);

  const handleUpdate = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.updateShop(shopId, form);
      await loadData();
      setIsEditing(false);
    } catch (requestError) {
      window.alert(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteShop(shopId);
      navigate('/shops', { replace: true });
    } catch (requestError) {
      window.alert(requestError.message);
      setDeleting(false);
    }
  };

  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState label="Loading shop details…" />;

  const { shop, payments } = data;

  return (
    <>
      <PageHeader
        title="Shop Details"
        back
        action={
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-white/25"
            >
              {isEditing ? <X size={15} /> : <Edit3 size={15} />}
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="flex items-center gap-1 rounded-lg bg-red-500/20 px-2.5 py-1.5 text-xs font-bold text-red-100 hover:bg-red-500/30"
            >
              <Trash2 size={15} />
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        }
      />

      {isEditing ? (
        <form onSubmit={handleUpdate} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-extrabold text-slate-900">Edit Shop Information</h2>
          <Field label="Shop Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Field label="Owner Name" value={form.ownerName} onChange={(v) => setForm({ ...form, ownerName: v })} required />
          <Field label="Phone Number" value={form.ownerNumber} onChange={(v) => setForm({ ...form, ownerNumber: v })} type="tel" required />
          <Field label="Email (optional)" value={form.ownerEmail} onChange={(v) => setForm({ ...form, ownerEmail: v })} type="email" />
          <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} required />
          <SelectField label="Delivery Weekday (Optional)" value={form.deliveryWeekday} onChange={(v) => setForm({ ...form, deliveryWeekday: v })} options={[ { label: 'None', value: '' }, { label: 'Monday', value: 'Monday' }, { label: 'Tuesday', value: 'Tuesday' }, { label: 'Wednesday', value: 'Wednesday' }, { label: 'Thursday', value: 'Thursday' }, { label: 'Friday', value: 'Friday' }, { label: 'Saturday', value: 'Saturday' }, { label: 'Sunday', value: 'Sunday' } ]} />

          <div className="flex gap-2 pt-2">
            <PrimaryButton type="submit" loading={saving} className="flex-1">
              <Save size={16} /> Save Changes
            </PrimaryButton>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex justify-between gap-3">
            <div>
              <h1 className="text-base font-extrabold text-slate-900">{shop.name}</h1>
              <p className="mt-1 text-xs text-slate-500">{shop.address}</p>
              {shop.ownerName && (
                <p className="mt-2 text-xs font-semibold text-slate-700">
                  Owner: {shop.ownerName} ({shop.ownerNumber})
                </p>
              )}
              {shop.ownerEmail && (
                <p className="mt-0.5 text-xs text-slate-400">
                  {shop.ownerEmail}
                </p>
              )}
              {shop.deliveryWeekday && (
                <p className="mt-2 inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
                  {shop.deliveryWeekday}
                </p>
              )}
            </div>
            {shop.ownerNumber && (
              <a
                className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100"
                href={`tel:${shop.ownerNumber}`}
              >
                <Phone size={18} />
              </a>
            )}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <AmountTriplet
              total={shop.totalOutstandingBalance}
              collected={shop.creditBalance}
              pending={shop.totalOutstandingBalance}
            />
          </div>
          <p className="mt-2 text-center text-[11px] text-slate-400">Outstanding balance and available credit</p>
        </section>
      )}

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900">Payment History</h2>
          <span className="text-xs text-slate-400">{payments.length} entries</span>
        </div>

        {payments.length ? (
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            {payments.map((payment) => (
              <div key={payment._id} className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                  <ReceiptText size={16} />
                </span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-700">{payment.paymentMode.replace('_', ' ')}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{formatDate(payment.paymentDate)}</p>
                </div>
                <span className="text-sm font-extrabold text-emerald-600">₹{payment.amountPaid}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
            No payment history recorded.
          </div>
        )}
      </section>

      {showDeleteConfirm && (
        <ConfirmDialog
          title={`Delete "${shop.name}"?`}
          description="This shop will be permanently deleted from the directory. Delivery history and payments are not affected. This cannot be undone."
          confirmLabel="Delete Shop"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
}

function Field({ label, value, onChange, type = 'text', required = false }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-slate-700">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
  );
}
