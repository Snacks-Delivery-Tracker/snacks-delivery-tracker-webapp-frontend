import { ChevronRight, MapPin, Package, Plus, Search, Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { ErrorState, LoadingState, PageHeader, PrimaryButton } from '../components/Page';

export function ShopPickerPage() {
  const [shops, setShops] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let live = true;
    setLoading(true);
    api.listShops(search)
      .then((data) => { if (live) { setShops(data); setError(''); } })
      .catch((requestError) => live && setError(requestError.message))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [search]);

  return (
    <>
      <PageHeader
        title="Add Shops / Snacks"
        subtitle={`${shops.length} shops saved`}
        back
      />

      {/* Directory Switcher Tabs */}
      <div className="mb-4 flex rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white py-2 text-xs font-bold text-blue-700 shadow-sm"
        >
          <Store size={14} /> Shops
        </button>
        <button
          type="button"
          onClick={() => navigate('/snacks')}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold text-slate-500 transition hover:text-slate-800"
        >
          <Package size={14} /> Snacks
        </button>
      </div>

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
        <LoadingState label="Loading shops…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <section className="mt-4 space-y-2.5">
          {shops.map((shop) => (
            <div
              key={shop._id}
              onClick={() => navigate(`/shops/${shop._id}/details`)}
              className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
                <Store size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-extrabold text-slate-800">{shop.name}</span>
                <span className="mt-1 flex truncate text-[11px] text-slate-500">
                  <MapPin className="mr-1 shrink-0" size={12} />
                  {shop.address}
                </span>
                {shop.ownerName && (
                  <span className="mt-0.5 block text-[11px] text-slate-400">
                    Owner: {shop.ownerName} ({shop.ownerNumber})
                  </span>
                )}
              </span>

              <ChevronRight size={18} className="text-slate-300" />
            </div>
          ))}

          {!shops.length && (
            <div className="py-12 text-center text-sm text-slate-400">
              No shops found. Add your first shop below.
            </div>
          )}
        </section>
      )}

      <PrimaryButton className="mt-5 w-full" onClick={() => navigate('/shops/new')}>
        <Plus size={18} /> Create Shop
      </PrimaryButton>
    </>
  );
}
