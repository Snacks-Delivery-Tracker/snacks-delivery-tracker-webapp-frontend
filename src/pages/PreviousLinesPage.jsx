import { CalendarDays, ChevronRight, Filter } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ErrorState, LoadingState, PageHeader } from '../components/Page';
import { formatCurrency, formatDate } from '../utils/format';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function PreviousLinesPage() {
  const [lines, setLines] = useState(null);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [weekdayFilter, setWeekdayFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    api.listLines().then(setLines).catch((requestError) => setError(requestError.message));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!lines) return <LoadingState label="Loading previous lines…" />;

  const visibleLines = lines.filter((line) => {
    if (statusFilter !== 'ALL' && line.status !== statusFilter) return false;
    if (weekdayFilter !== 'ALL') {
      // Match weekday lines by the line's own weekday field, or by the shops' weekdays
      const lineWeekday = line.weekday || '';
      if (line.lineType === 'WEEKDAY') {
        if (lineWeekday !== weekdayFilter) return false;
      } else {
        // For default lines, try matching by shop weekdays from billSnapshot if available
        return false; // only weekday lines match a weekday filter
      }
    }
    return true;
  });

  const activeWeekdayFilters = weekdayFilter !== 'ALL' || statusFilter !== 'ALL';

  return (
    <>
      <PageHeader
        title="Line History"
        subtitle={`${lines.length} total lines`}
        action={
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeWeekdayFilters ? 'bg-blue-200/30 text-blue-100' : 'bg-white/15 text-white hover:bg-white/25'
            }`}
          >
            <Filter size={14} />
            Filter{activeWeekdayFilters ? ' (on)' : ''}
          </button>
        }
      />

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {/* Status filter */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</p>
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1" role="group">
              {[['ALL', 'All'], ['OPEN', 'Open'], ['CLOSED', 'Closed']].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  className={`flex-1 rounded-lg py-2 text-[11px] font-bold transition ${
                    statusFilter === value ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-500 hover:bg-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Weekday filter */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Weekday Route</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setWeekdayFilter('ALL')}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                  weekdayFilter === 'ALL' ? 'bg-blue-700 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                All Days
              </button>
              {WEEKDAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setWeekdayFilter(day)}
                  className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                    weekdayFilter === day ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {activeWeekdayFilters && (
            <button
              type="button"
              onClick={() => { setStatusFilter('ALL'); setWeekdayFilter('ALL'); }}
              className="text-[11px] font-bold text-red-500 hover:text-red-700"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Status pill bar (quick access when filters panel is hidden) */}
      {!showFilters && (
        <div className="mb-4 flex rounded-xl border border-slate-200 bg-white p-1" role="group" aria-label="Filter line history">
          {[['ALL', 'All'], ['OPEN', 'Open'], ['CLOSED', 'Closed']].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              className={`flex-1 rounded-lg py-2 text-[11px] font-bold ${statusFilter === value ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <section className="space-y-2.5">
        {visibleLines.map((line) => {
          // For closed lines, use billSnapshot totals if available
          const snapshot = line.status === 'CLOSED' && line.billSnapshot;
          const totalDelivered = snapshot
            ? (line.billSnapshot.summary?.totalAmount ?? line.totalGoodsDelivered ?? 0)
            : (line.totalGoodsDelivered || 0);
          const totalCollected = snapshot
            ? (line.billSnapshot.summary?.collectedAmount ?? line.totalCashCollected ?? 0)
            : (line.totalCashCollected || 0);
          const pending = Math.max(0, totalDelivered - totalCollected);

          return (
            <Link
              key={line._id}
              to={`/lines/${line._id}`}
              className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm transition hover:border-blue-100 hover:shadow"
            >
              <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-extrabold ${
                line.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}>
                <CalendarDays size={19} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="block text-sm font-extrabold text-slate-800">{line.lineName}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                    line.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>{line.status}</span>
                  {line.lineType === 'WEEKDAY' && line.weekday && (
                    <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700">
                      {line.weekday}
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-[11px] text-slate-500">
                  {formatDate(line.deliveryDate || line.createdAt)} · {line.shops?.length || 0} shops
                </span>

                {/* Inline balance summary */}
                <span className="mt-2 flex gap-3 text-[11px] font-semibold">
                  <span className="text-slate-600">
                    Delivered: <span className="font-extrabold text-slate-800">{formatCurrency(totalDelivered)}</span>
                  </span>
                  <span className="text-emerald-600">
                    Collected: <span className="font-extrabold">{formatCurrency(totalCollected)}</span>
                  </span>
                  {pending > 0 && (
                    <span className="font-extrabold text-red-500">
                      Pending: {formatCurrency(pending)}
                    </span>
                  )}
                </span>
              </span>

              <ChevronRight size={18} className="mt-1 shrink-0 text-slate-300" />
            </Link>
          );
        })}

        {!visibleLines.length && (
          <div className="py-14 text-center text-sm text-slate-400">
            No {weekdayFilter !== 'ALL' ? weekdayFilter : statusFilter.toLowerCase()} delivery lines found.
          </div>
        )}
      </section>
    </>
  );
}
