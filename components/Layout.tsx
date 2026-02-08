import React from 'react';
import { View } from '../types';
import { logOut, auth } from '../services/firebase';

interface LayoutProps {
  children: React.ReactNode;
  activeView: View;
  setView: (view: View) => void;
  onOpenProfile: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setView, onOpenProfile }) => {
  const navItems = [
    { id: 'pos', icon: 'fa-cash-register', label: 'Orders' },
    { id: 'event', icon: 'fa-calendar-check', label: 'Event Mode' },
    { id: 'queue', icon: 'fa-mug-hot', label: 'Prep Room' },
    { id: 'insights', icon: 'fa-chart-pie', label: 'Dashboard' },
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
          <div 
            onClick={onOpenProfile}
            className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl mb-4 cursor-pointer hover:bg-slate-100 transition-colors group"
          >
            {auth.currentUser?.photoURL ? (
              <img src={auth.currentUser.photoURL} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" alt="Profile" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xs">
                {auth.currentUser?.displayName?.substring(0, 2).toUpperCase() || auth.currentUser?.email?.substring(0, 2).toUpperCase() || 'ST'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900 truncate">
                {auth.currentUser?.displayName || auth.currentUser?.email || 'Staff'}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Staff Profile</p>
            </div>
            <i className="fas fa-pen-to-square text-[10px] text-slate-300 group-hover:text-emerald-500 transition-colors"></i>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl transition-all font-bold text-xs uppercase tracking-widest"
          >
            <i className="fas fa-right-from-bracket"></i>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {children}

        {/* Mobile Navigation */}
        <nav className="md:hidden flex bg-white border-t border-slate-100 px-2 py-3 shrink-0 justify-between items-center z-50">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as View)}
              className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
                activeView === item.id 
                  ? 'text-emerald-600 scale-110' 
                  : 'text-slate-300'
              }`}
            >
              <i className={`fas ${item.icon} text-lg`}></i>
              <span className="text-[8px] font-black uppercase tracking-widest">{item.label.split(' ')[0]}</span>
            </button>
          ))}
          <button 
            onClick={onOpenProfile}
            className="flex flex-col items-center gap-1.5 px-3 py-2 text-slate-300"
          >
            <i className="fas fa-user-circle text-lg"></i>
            <span className="text-[8px] font-black uppercase tracking-widest">Profile</span>
          </button>
        </nav>
      </main>
    </div>
  );
};

export default Layout;