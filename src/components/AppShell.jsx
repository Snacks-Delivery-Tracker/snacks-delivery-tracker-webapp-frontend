import { Home, ListOrdered, Plus, Store, MoreHorizontal, Download } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/line', label: 'Line', icon: ListOrdered },
  { to: '/shops', label: 'Shops', icon: Store },
  { to: '/previous-lines', label: 'History', icon: MoreHorizontal }
];

export function AppShell() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const location = useLocation();
  const isForm = location.pathname.includes('/delivery/') || location.pathname.includes('/entry-mode');

  useEffect(() => {
    const capturePrompt = (event) => { event.preventDefault(); setInstallPrompt(event); };
    window.addEventListener('beforeinstallprompt', capturePrompt);
    return () => window.removeEventListener('beforeinstallprompt', capturePrompt);
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
  };

  return <div className="app-frame">
    <main className="min-h-dvh px-4 pb-24 sm:px-6"><Outlet /></main>
    {installPrompt && <button onClick={install} className="fixed right-4 top-3 z-30 flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur hover:bg-white/25"><Download size={14} /> Install</button>}
    {!isForm && <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex h-[calc(4.5rem+env(safe-area-inset-bottom))] max-w-[480px] items-start justify-around border-t border-slate-200 bg-white px-2 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-6px_20px_rgba(15,23,42,0.08)]">
      {navItems.slice(0, 2).map((item) => <NavItem key={item.to} {...item} />)}
      <NavLink to="/shops" className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full border-4 border-slate-50 bg-blue-700 text-white shadow-lg shadow-blue-700/30" aria-label="Add delivery"><Plus size={27} /></NavLink>
      {navItems.slice(2).map((item) => <NavItem key={item.to} {...item} />)}
    </nav>}
  </div>;
}

function NavItem({ to, label, icon: Icon }) {
  return <NavLink to={to} end={to === '/'} className={({ isActive }) => `flex min-w-14 flex-col items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold ${isActive ? 'text-blue-700' : 'text-slate-400'}`}><Icon size={20} strokeWidth={2.2} /><span>{label}</span></NavLink>;
}
