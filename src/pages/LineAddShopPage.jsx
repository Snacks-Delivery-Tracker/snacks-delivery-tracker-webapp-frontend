import { Check, ChevronRight, MapPin, Search, Store } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useLine } from '../contexts/LineContext';
import { ErrorState, LoadingState, PageHeader } from '../components/Page';

export function LineAddShopPage() {
  const [searchParams] = useSearchParams();
  const { line, isLoading: lineLoading, refreshLine } = useLine();
  const [shops, setShops] = useState([]);
  const [targetLine, setTargetLine] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const lineIdFromUrl = searchParams.get('lineId');

  useEffect(() => {
    let live = true;
    const fetchTargetLine = async () => {
      if (lineIdFromUrl) {
        try {
          const l = await api.getLine(lineIdFromUrl);
          if (live) setTargetLine(l);
        } catch (e) {
          if (live) setTargetLine(line);
        }
      } else {
        setTargetLine(line);
      }
    };
    fetchTargetLine();
    return () => { live = false; };
  }, [lineIdFromUrl, line]);

  const activeTargetLine = targetLine || line;
  const lineShopIds = useMemo(() => new Set(activeTargetLine?.shops.map((shop) => shop._id || shop.shopId) || []), [activeTargetLine]);

  useEffect(() => {
    let live = true;
    setLoading(true);
    api.listShops(search)
      .then((data) => { if (live) { setShops(data); setError(''); } })
      .catch((requestError) => live && setError(requestError.message))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [search]);

  const chooseShopForLine = async (shop) => {
    if (!activeTargetLine) { navigate('/'); return; }
    setSavingId(shop._id);
    try {
      if (!lineShopIds.has(shop._id)) {
        await api.addShopToLine(activeTargetLine._id, shop._id);
      }
      await refreshLine(activeTargetLine._id);
      navigate(`/entry-mode/${shop._id}`);
    } catch (requestError) {
      window.alert(requestError.message);
    } finally {
      setSavingId('');
    }
  };

  if (lineLoading) return <LoadingState />;
  if (!activeTargetLine) {
    return (
      <div className="pt-10 text-center">
        <Store className="mx-auto text-slate-300" size={38} />
        <p className="mt-4 text-sm text-slate-500">Start a delivery line before adding shops.</p>
        <Link to="/" className="mt-4 inline-block rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white">
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Add Shop to Today's Line"
        subtitle="Select a shop to add to your active delivery route"
        back
      />

      <div className="relative">
        <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          autoFocus
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search shops by name or address…"
          className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      </div>

      {loading ? (
        <LoadingState label="Loading available shops…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <section className="mt-4 space-y-2.5">
          {shops.map((shop) => {
            const isAdded = lineShopIds.has(shop._id);
            return (
              <button
                type="button"
                key={shop._id}
                onClick={() => chooseShopForLine(shop)}
                disabled={Boolean(savingId)}
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 text-left shadow-sm transition hover:border-blue-200 disabled:opacity-60"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
                  <Store size={19} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold text-slate-800">{shop.name}</span>
                  <span className="mt-1 flex truncate text-[11px] text-slate-500">
                    <MapPin className="mr-1 shrink-0" size={12} />
                    {shop.address}
                  </span>
                </span>

                {isAdded ? (
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-blue-700 text-white">
                    <Check size={15} />
                  </span>
                ) : savingId === shop._id ? (
                  <span className="text-xs font-bold text-blue-700">Adding…</span>
                ) : (
                  <ChevronRight size={18} className="text-slate-300" />
                )}
              </button>
            );
          })}

          {!shops.length && (
            <div className="py-12 text-center text-sm text-slate-400">
              No matching shops found in directory.
            </div>
          )}
        </section>
      )}
    </>
  );
}
