import { ChevronRight, Package, Pencil, Plus, Search, Store, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { ConfirmDialog, ErrorState, LoadingState, PageHeader, PrimaryButton } from '../components/Page';

export function SnackPickerPage() {
  const [snacks, setSnacks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const loadSnacks = () => {
    let live = true;
    setLoading(true);
    api.listSnacks()
      .then((data) => { 
        if (live) { 
          const list = Array.isArray(data) ? data : [];
          setSnacks(list); 
          setError(''); 
        } 
      })
      .catch((requestError) => live && setError(requestError.message))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  };

  useEffect(() => {
    return loadSnacks();
  }, []);

  const filteredSnacks = search
    ? snacks.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.snackCategory && s.snackCategory.toLowerCase().includes(search.toLowerCase()))
      )
    : snacks;

  const handleDeleteClick = (snackId, snackName, e) => {
    e.stopPropagation();
    setDeleteTarget({ id: snackId, name: snackName });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteSnack(deleteTarget.id);
      setSnacks((prev) => prev.filter((s) => s._id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Add Shops / Snacks"
        subtitle={`${snacks.length} snacks registered`}
        back
      />

      {/* Directory Switcher Tabs */}
      <div className="mb-4 flex rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => navigate('/shops')}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold text-slate-500 transition hover:text-slate-800"
        >
          <Store size={14} /> Shops
        </button>
        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white py-2 text-xs font-bold text-blue-700 shadow-sm"
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
          placeholder="Search snacks by name or category…"
          className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      </div>

      {loading ? (
        <LoadingState label="Loading snacks catalog…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <section className="mt-4 space-y-2.5">
          {filteredSnacks.map((snack) => (
            <div
              key={snack._id}
              onClick={() => navigate(`/snacks/${snack._id}/edit`)}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 font-extrabold text-sm">
                <Package size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-extrabold text-slate-800">{snack.name}</span>
                  {snack.snackCategory && (
                    <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                      {snack.snackCategory}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                  <span>Price: <strong className="text-slate-800 font-extrabold">₹{snack.sellingPrice}</strong></span>
                  {snack.mrp && snack.mrp !== snack.sellingPrice && (
                    <span className="line-through text-slate-400 text-[11px]">MRP ₹{snack.mrp}</span>
                  )}
                  <span className={snack.stock <= 10 ? 'font-bold text-amber-600' : 'text-slate-500'}>
                    Stock: {snack.stock}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/snacks/${snack._id}/edit`);
                  }}
                  title="Edit snack"
                  className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                type="button"
                onClick={(e) => handleDeleteClick(snack._id, snack.name, e)}
                title="Delete snack"
                className="p-1.5 text-slate-300 transition hover:text-red-500"
              >
                <Trash2 size={16} />
              </button>
              </div>
            </div>
          ))}

          {!filteredSnacks.length && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 py-12 text-center text-sm text-slate-400">
              {search ? 'No matching snacks found.' : 'No snacks found. Click below to add your first snack item.'}
            </div>
          )}
        </section>
      )}

      <PrimaryButton className="mt-5 w-full" onClick={() => navigate('/snacks/new')}>
        <Plus size={18} /> Add New Snack
      </PrimaryButton>

      {deleteTarget && (
        <ConfirmDialog
          title={`Delete "${deleteTarget.name}"?`}
          description="This snack will be permanently removed from the catalog. This cannot be undone."
          confirmLabel="Delete Snack"
          loading={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
