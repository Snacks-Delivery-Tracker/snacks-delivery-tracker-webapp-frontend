import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useLine } from '../contexts/LineContext';
import { PageHeader, PrimaryButton } from '../components/Page';

const initialForm = { name: '', ownerName: '', ownerNumber: '', address: '', ownerEmail: '', deliveryWeekday: '' };

export function NewShopPage() {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.createShop(Object.fromEntries(Object.entries(form).filter(([, value]) => value)));
      navigate('/shops');
    } catch (requestError) {
      window.alert(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return <><PageHeader title="Add New Shop" back /><form onSubmit={submit} className="space-y-4"><Field label="Shop name" name="name" value={form.name} onChange={update} placeholder="e.g. Sri Lakshmi Stores" required /><Field label="Owner name" name="ownerName" value={form.ownerName} onChange={update} placeholder="e.g. Lakshmi" required /><Field label="Phone number" name="ownerNumber" type="tel" value={form.ownerNumber} onChange={update} placeholder="10-digit mobile number" required /><Field label="Address" name="address" value={form.address} onChange={update} placeholder="Street, locality, city" required /><Field label="Email (optional)" name="ownerEmail" type="email" value={form.ownerEmail} onChange={update} placeholder="name@example.com" />
    <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Delivery Weekday (Optional)</span><select name="deliveryWeekday" value={form.deliveryWeekday} onChange={update} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"><option value="">None</option><option value="Monday">Monday</option><option value="Tuesday">Tuesday</option><option value="Wednesday">Wednesday</option><option value="Thursday">Thursday</option><option value="Friday">Friday</option><option value="Saturday">Saturday</option><option value="Sunday">Sunday</option></select></label>
    <PrimaryButton className="mt-3 w-full" loading={saving} type="submit">Save master shop</PrimaryButton></form></>;
}

function Field({ label, ...props }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">{label}</span><input {...props} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>;
}
