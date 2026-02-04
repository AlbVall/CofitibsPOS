import React, { useState } from 'react';
import { Product, CartItem, EventConfig } from '../types';

interface EventPOSViewProps {
  products: Product[];
  onCheckout: (items: CartItem[], customerName: string) => void;
  eventConfig: EventConfig;
  onUpdateEventConfig: (config: EventConfig) => void;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  customerName: string;
  setCustomerName: React.Dispatch<React.SetStateAction<string>>;
}

const EventPOSView: React.FC<EventPOSViewProps> = ({ 
  products, 
  onCheckout, 
  eventConfig,
  onUpdateEventConfig,
  cart,
  setCart,
  customerName,
  setCustomerName
}) => {
  const [category, setCategory] = useState<string>('All');
  const [showCartMobile, setShowCartMobile] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(eventConfig.maxCups === 0);
  const [setupCups, setSetupCups] = useState(eventConfig.maxCups.toString());

  const categories = ['All', 'Hot Coffee', 'Iced Coffee', 'Soda', 'Milk Drinks'];
  
  const filteredProducts = category === 'All' 
    ? products 
    : products.filter(p => p.category === category);

  const cartTotalCups = cart.reduce((sum, item) => sum + item.quantity, 0);
  const remainingAfterCart = eventConfig.remainingCups - cartTotalCups;

  const addToCart = (product: Product) => {
    if (remainingAfterCart <= 0) return;

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    if (delta > 0 && remainingAfterCart <= 0) return;

    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    const cups = parseInt(setupCups);
    if (isNaN(cups) || cups <= 0) return;
    
    onUpdateEventConfig({
      ...eventConfig,
      maxCups: cups,
      remainingCups: cups,
      isActive: true
    });
    setIsSetupOpen(false);
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="flex h-full flex-col lg:flex-row overflow-hidden relative">
      {/* Product Selection Area */}
      <div className={`flex-1 flex flex-col min-w-0 min-h-0 bg-slate-50/50 ${showCartMobile ? 'hidden lg:flex' : 'flex'}`}>
        
        {/* Optimized Minimalist Event Status Bar */}
        <div className="bg-emerald-950 shrink-0 relative shadow-md">
           <div className="px-4 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-emerald-800/50 flex items-center justify-center text-emerald-400">
                    <i className="fas fa-glass-water text-sm"></i>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 leading-none mb-1">Catering Balance</span>
                    <span className="text-sm font-black text-white leading-none">
                       {eventConfig.remainingCups}<span className="text-emerald-500 mx-1">/</span>{eventConfig.maxCups} <span className="text-[10px] opacity-40 font-bold ml-1">CUPS</span>
                    </span>
                 </div>
              </div>

              {/* Progress Bar Container */}
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden border border-white/5">
                 <div 
                   className={`h-full transition-all duration-700 ${eventConfig.remainingCups < 10 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`}
                   style={{ width: `${(eventConfig.remainingCups / (eventConfig.maxCups || 1)) * 100}%` }}
                 ></div>
              </div>

              <button 
                onClick={() => setIsSetupOpen(true)}
                className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl text-emerald-400 transition-all border border-white/10 active:scale-90"
                title="Pool Management"
              >
                <i className="fas fa-sliders text-sm"></i>
              </button>
           </div>
        </div>

        {/* Improved Wrapped Category Filter */}
        <div className="bg-white border-b border-slate-100 shrink-0 shadow-sm z-10">
          <div className="flex flex-wrap py-3 px-4 gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 border-2 ${
                  category === cat 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100 scale-105' 
                    : 'bg-white text-slate-400 border-slate-100 hover:border-emerald-200 hover:text-emerald-600 hover:bg-emerald-50/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Container */}
        <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar min-h-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-32 lg:pb-6">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={remainingAfterCart <= 0}
                className={`relative group flex flex-col bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm active:scale-95 transition-all duration-300 ${
                  remainingAfterCart <= 0 ? 'opacity-60 grayscale cursor-not-allowed' : ''
                }`}
              >
                <div className="aspect-[4/3] w-full overflow-hidden relative bg-slate-50">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-3.5 flex flex-col flex-1 text-left">
                  <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter mb-1">{product.category}</span>
                  <h3 className="font-bold text-slate-800 text-[11px] leading-tight line-clamp-2 h-7 mb-2">{product.name}</h3>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">₱{product.price.toLocaleString()}</span>
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${remainingAfterCart <= 0 ? 'bg-slate-100 text-slate-300' : 'bg-emerald-50 text-emerald-600'}`}>
                      <i className="fas fa-plus text-[10px]"></i>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile View Cart FAB */}
        {cartTotalCups > 0 && !showCartMobile && (
          <button
            onClick={() => setShowCartMobile(true)}
            className="lg:hidden fixed bottom-24 right-4 left-4 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-2xl flex items-center justify-between px-6 z-20 border-2 border-white animate-in slide-in-from-bottom"
          >
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                 <i className="fas fa-shopping-basket text-xs"></i>
               </div>
               <span className="text-sm font-black uppercase tracking-tight">Basket ({cartTotalCups})</span>
             </div>
             <div className="flex items-center gap-3">
               <span className="font-black text-xl">₱{total.toLocaleString()}</span>
             </div>
          </button>
        )}
      </div>

      {/* Cart Sidebar */}
      <div className={`w-full lg:w-[380px] bg-white border-l border-slate-200 flex flex-col shrink-0 shadow-2xl relative z-30 transition-transform duration-500 ${
        showCartMobile ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      } ${showCartMobile ? 'fixed inset-0 lg:static' : 'hidden lg:flex'}`}>
        
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
           <div className="flex items-center gap-3">
             {showCartMobile && <button onClick={() => setShowCartMobile(false)} className="w-10 h-10 bg-slate-50 rounded-xl text-slate-400 flex items-center justify-center"><i className="fas fa-chevron-left"></i></button>}
             <h2 className="text-xl font-black text-emerald-900 brand-font">Event Order</h2>
           </div>
           <button onClick={() => setCart([])} className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-500 transition-all hover:bg-rose-50"><i className="fas fa-trash-can"></i></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-40 gap-4">
               <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center mb-2">
                 <i className="fas fa-calendar-plus text-3xl"></i>
               </div>
               <p className="font-bold text-[11px] uppercase tracking-widest text-center">Empty basket</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-4 animate-in slide-in-from-right-2">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-100 shadow-sm">
                    <img src={item.image} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-slate-800 truncate">{item.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold">₱{item.price.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 text-slate-400 hover:text-emerald-600 transition-colors"><i className="fas fa-minus text-[10px]"></i></button>
                    <span className="w-7 text-center text-xs font-black">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 text-slate-400 hover:text-emerald-600 transition-colors"><i className="fas fa-plus text-[10px]"></i></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
          <div className="mb-5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Guest Reference</label>
            <input 
              type="text" 
              placeholder="Guest Name / Table" 
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
            />
          </div>

          <div className="flex justify-between items-center mb-5">
             <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cup Deduction</p>
               <p className={`text-xl font-black ${remainingAfterCart < 0 ? 'text-rose-500' : 'text-emerald-700'}`}>{cartTotalCups} CUPS</p>
             </div>
             <div className="text-right">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Value</p>
               <p className="text-2xl font-black text-slate-900">₱{total.toLocaleString()}</p>
             </div>
          </div>

          <button
            onClick={() => {
              if (cart.length > 0 && customerName.trim() && remainingAfterCart >= 0) {
                onCheckout(cart, customerName);
                setShowCartMobile(false);
              }
            }}
            disabled={cart.length === 0 || !customerName.trim() || remainingAfterCart < 0}
            className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95"
          >
            {remainingAfterCart < 0 ? 'Pool Depleted' : 'Confirm & Deduct'}
          </button>
        </div>
      </div>

      {/* Setup Modal */}
      {isSetupOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => setIsSetupOpen(false)}></div>
           <form onSubmit={handleSetup} className="relative bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-200">
              <h3 className="text-2xl font-black text-emerald-900 brand-font mb-2">Event Capacity</h3>
              <p className="text-[11px] text-slate-500 mb-6 font-medium uppercase tracking-widest">Configure package volume</p>
              
              <div className="mb-6 text-center">
                 <input 
                   type="number" 
                   value={setupCups}
                   onChange={e => setSetupCups(e.target.value)}
                   className="w-full text-center text-5xl font-black text-emerald-600 outline-none p-5 bg-emerald-50 rounded-3xl border-2 border-emerald-100"
                   autoFocus
                 />
                 <span className="text-[10px] font-black text-slate-400 uppercase mt-3 block tracking-[0.2em]">Total Allocated Cups</span>
              </div>

              <div className="space-y-3">
                <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-transform hover:bg-emerald-700">Set Pool Volume</button>
                <button type="button" onClick={() => setIsSetupOpen(false)} className="w-full py-3 text-slate-400 font-bold text-[11px] uppercase tracking-widest hover:text-slate-600 transition-colors">Cancel</button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
};

export default EventPOSView;