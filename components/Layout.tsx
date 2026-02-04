import React from 'react';
import { View } from '../types';
import { logOut, auth } from '../services/firebase';

interface LayoutProps {
  children: React.ReactNode;
  activeView: View;
  setView: (view: View) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setView }) => {
  const navItems = [
    { id: 'pos', icon: 'fa-cash-register', label: 'Orders' },
    { id: 'event', icon: 'fa-calendar-check', label: 'Event Mode' },
    { id: 'queue', icon: 'fa-mug-hot', label: 'Prep Room' },
    { id: 'inventory', icon: 'fa-boxes-stacked', label: 'Inventory' },
    { id: 'history', icon: 'fa-clock-rotate-left', label: 'History' },
  ];

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out?')) {
      logOut();
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden text-slate-800">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0">
        <div className="p-8 pb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <i className="fas fa-dog text-white text-xl"></i>
            </div>
            <div className="brand-font font-semibold text-xl tracking-tight text-emerald-900">
              Cofitibs<span className="text-emerald-500">.</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as View)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                activeView === item.id 
                  ? 'bg-emerald-50 text-emerald-700 active-nav' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <i className={`fas ${item.icon} text-lg ${activeView === item.id ? 'text-emerald-600' : 'text-slate-300 group-hover:text-slate-500'}`}></i>
              <span className="text-sm font-semibold tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-slate-100">
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl group relative">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs shadow-sm uppercase">
              {auth.currentUser?.email?.[0] || 'S'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate">{auth.currentUser?.email?.split('@')[0] || 'Staff User'}</p>
              <p className="text-[10px] text-slate-400">Main Branch</p>
            </div>
            <button 
              onClick={handleLogout}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
              title="Logout"
            >
              <i className="fas fa-sign-out-alt text-sm"></i>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <i className="fas fa-dog text-emerald-600"></i>
            <div className="brand-font font-bold text-lg text-emerald-900">Cofitibs</div>
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={handleLogout}
               className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1.5 rounded-md"
             >
               Sign Out
             </button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden bg-[#fbfcfd]">
          {children}
        </main>

        {/* Mobile Nav */}
        <nav className="md:hidden flex justify-around items-center px-4 py-3 bg-white border-t border-slate-100 shrink-0 shadow-lg">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as View)}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all ${
                activeView === item.id ? 'text-emerald-600 scale-110' : 'text-slate-400'
              }`}
            >
              <i className={`fas ${item.icon} text-lg`}></i>
              <span className="text-[9px] font-bold uppercase">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Layout;