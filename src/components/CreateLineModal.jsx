import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { PrimaryButton } from './Page';
import { todayLabel } from '../utils/format';

export function CreateLineModal({ onClose, refreshLine }) {
  const navigate = useNavigate();
  const [lineType, setLineType] = useState('DEFAULT');
  const [weekday, setWeekday] = useState(() => {
    return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
  });
  const [saving, setSaving] = useState(false);

  const startLine = async () => {
    setSaving(true);
    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const lineName = lineType === 'WEEKDAY'
        ? `${weekday} Line · ${todayLabel()} (${timeStr})`
        : `Delivery line · ${todayLabel()} (${timeStr})`;
        
      const newLine = await api.createLine({
        lineName,
        deliveryDate: now.toISOString(),
        lineType,
        weekday: lineType === 'WEEKDAY' ? weekday : ''
      });

      // If weekday line, bulk add shops
      if (lineType === 'WEEKDAY') {
        const shops = await api.listShopsByWeekday(weekday);
        if (shops && shops.length > 0) {
          const shopIds = shops.map(s => s._id);
          await api.bulkAddShopsToLine(newLine._id, shopIds);
        }
      }

      await refreshLine(newLine._id);
      onClose();
      navigate('/line');
    } catch (requestError) {
      window.alert(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
        <h2 className="text-base font-extrabold text-slate-900">Create New Line</h2>
        <p className="mt-1 text-xs text-slate-500 mb-4">Choose how you want to start this delivery run.</p>
        
        <div className="space-y-3 mb-5">
          <label className={`block cursor-pointer rounded-xl border p-4 ${lineType === 'DEFAULT' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <input type="radio" name="lineType" value="DEFAULT" checked={lineType === 'DEFAULT'} onChange={(e) => setLineType(e.target.value)} className="h-4 w-4 text-blue-600 focus:ring-blue-500" />
              <div>
                <span className="block text-sm font-bold text-slate-800">Default Line</span>
                <span className="block text-xs text-slate-500">Manually select shops for this run.</span>
              </div>
            </div>
          </label>
          
          <label className={`block cursor-pointer rounded-xl border p-4 ${lineType === 'WEEKDAY' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <input type="radio" name="lineType" value="WEEKDAY" checked={lineType === 'WEEKDAY'} onChange={(e) => setLineType(e.target.value)} className="h-4 w-4 text-blue-600 focus:ring-blue-500" />
              <div>
                <span className="block text-sm font-bold text-slate-800">Weekday Line</span>
                <span className="block text-xs text-slate-500">Auto-load all shops for a specific day.</span>
              </div>
            </div>
          </label>
        </div>

        {lineType === 'WEEKDAY' && (
          <div className="mb-5">
            <span className="mb-1.5 block text-xs font-bold text-slate-700">Select Weekday</span>
            <select value={weekday} onChange={(e) => setWeekday(e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <button type="button" onClick={onClose} disabled={saving} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50">Cancel</button>
          <PrimaryButton onClick={startLine} loading={saving}>Create Line</PrimaryButton>
        </div>
      </div>
    </div>
  );
}
