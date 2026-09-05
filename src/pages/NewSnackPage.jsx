import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { LoadingState, PageHeader, PrimaryButton } from '../components/Page';

const SNACK_CATEGORIES = [
  'SNACKS',
  'CHIPS',
  'SWEETS',
  'CHAKKULI',
  'CARBONATED DRINKS',
  'JUICES',
  'WATER'
];

const initialForm = {
  name: '',
  snackCategory: 'SNACKS',
  stock: '100',
  acquiringPrice: '',
  mrp: '',
  sellingPrice: ''
};

export function NewSnackPage({ editing = false }) {
  const { snackId } = useParams();
  const isEditMode = Boolean(editing || snackId);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isEditMode || !snackId) return;
    let live = true;
    setLoading(true);
    api.listSnacks()
      .then((snacks) => {
        if (!live) return;
        const target = Array.isArray(snacks) ? snacks.find((s) => String(s._id) === String(snackId)) : null;
        if (target) {
          setForm({
            name: target.name || '',
            snackCategory: target.snackCategory || 'SNACKS',
            stock: String(target.stock ?? 100),
            acquiringPrice: String(target.acquiringPrice ?? ''),
            mrp: String(target.mrp ?? ''),
            sellingPrice: String(target.sellingPrice ?? '')
          });
        } else {
          setError('Snack item not found.');
        }
      })
      .catch((err) => live && setError(err.message))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [isEditMode, snackId]);

  // Pure input update without auto-inserting MRP or acquiringPrice on keystroke
  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    const stock = Number(form.stock);
    const acquiringPrice = Number(form.acquiringPrice);
    const mrp = Number(form.mrp);
    const sellingPrice = Number(form.sellingPrice);

    if (!form.name.trim()) {
      setError('Please enter a snack name.');
      return;
    }
    if (isNaN(stock) || stock < 0) {
      setError('Please enter a valid stock quantity.');
      return;
    }
    if (isNaN(sellingPrice) || sellingPrice <= 0) {
      setError('Please enter a valid selling price greater than ₹0.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        snackCategory: form.snackCategory,
        stock,
        acquiringPrice: isNaN(acquiringPrice) || acquiringPrice <= 0 ? sellingPrice : acquiringPrice,
        mrp: isNaN(mrp) || mrp <= 0 ? sellingPrice : mrp,
        sellingPrice,
        isAvailable: true
      };

      if (isEditMode && snackId) {
        await api.updateSnack({
          id: snackId,
          ...payload
        });
      } else {
        await api.createSnack(payload);
      }
      navigate('/snacks');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!snackId) return;
    if (!window.confirm(`Are you sure you want to permanently delete "${form.name}"?`)) {
      return;
    }
    setDeleting(true);
    setError('');
    try {
      await api.deleteSnack(snackId);
      navigate('/snacks', { replace: true });
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  if (loading) return <LoadingState label="Loading snack details…" />;

  return (
    <>
      <PageHeader
        title={isEditMode ? 'Edit Snack' : 'Add New Snack'}
        back
        action={
          isEditMode ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1 rounded-lg bg-red-500/20 px-2.5 py-1.5 text-xs font-bold text-red-100 hover:bg-red-500/30 disabled:opacity-50"
            >
              <Trash2 size={15} />
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          ) : null
        }
      />

      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-600">
            {error}
          </div>
        )}

        <Field
          label="Snack Name"
          name="name"
          value={form.name}
          onChange={update}
          placeholder="e.g. Potato Chips / Banana Chips"
          required
        />

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-slate-700">Category</span>
          <select
            name="snackCategory"
            value={form.snackCategory}
            onChange={update}
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            {SNACK_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Selling Price (₹)"
            name="sellingPrice"
            type="number"
            min="0.01"
            step="0.01"
            value={form.sellingPrice}
            onChange={update}
            placeholder="0.00"
            required
          />
          <Field
            label="MRP (₹)"
            name="mrp"
            type="number"
            min="0.01"
            step="0.01"
            value={form.mrp}
            onChange={update}
            placeholder="0.00"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Cost / Acquiring Price (₹)"
            name="acquiringPrice"
            type="number"
            min="0.01"
            step="0.01"
            value={form.acquiringPrice}
            onChange={update}
            placeholder="0.00"
            required
          />
          <Field
            label="Initial Stock Quantity"
            name="stock"
            type="number"
            min="0"
            value={form.stock}
            onChange={update}
            placeholder="100"
            required
          />
        </div>

        <div className="pt-2 space-y-2">
          <PrimaryButton className="w-full" loading={saving} type="submit">
            {isEditMode ? 'Update snack item' : 'Save snack item'}
          </PrimaryButton>

          {isEditMode && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-3 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 size={16} /> {deleting ? 'Deleting…' : 'Delete Snack'}
            </button>
          )}
        </div>
      </form>
    </>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-700">{label}</span>
      <input
        {...props}
        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}
