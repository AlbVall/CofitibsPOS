import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import POSView from './components/POSView';
import EventPOSView from './components/EventPOSView';
import InventoryView from './components/InventoryView';
import QueueView from './components/QueueView';
import AuthView from './components/AuthView';
import { Product, Order, CartItem, View, EventConfig } from './types';
import { 
  db, 
  auth,
  onAuthStateChanged,
  User,
  listenToOrders, 
  listenToProducts, 
  listenToEventConfig,
  saveOrderToCloud, 
  saveProductToCloud,
  saveEventConfigToCloud,
  deleteProductFromCloud
} from './services/firebase';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [eventConfig, setEventConfig] = useState<EventConfig>({ id: 'event_mode', remainingCups: 0, maxCups: 0, isActive: false });
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // History Filters
  const [historyDateFilter, setHistoryDateFilter] = useState<string>('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'normal' | 'event'>('all');

  // Persistent Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync with Firebase Cloud or Local Storage
  useEffect(() => {
    if (!user || !user.emailVerified) return;

    let unsubscribeOrders = () => {};
    let unsubscribeProducts = () => {};
    let unsubscribeEvent = () => {};

    setIsLoading(true);

    if (db) {
      unsubscribeOrders = listenToOrders((newOrders) => {
        setOrders(newOrders);
        setIsLoading(false);
      });

      unsubscribeProducts = listenToProducts((newProducts) => {
        setProducts(newProducts);
        setIsLoading(false);
      });

      unsubscribeEvent = listenToEventConfig((config) => {
        setEventConfig(config);
      });
    }

    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
      unsubscribeEvent();
    };
  }, [user]);

  const reserveStock = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const updated = { ...product, stock: Math.max(0, product.stock - quantity) };
      if (db) {
        saveProductToCloud(updated);
      }
    }
  };

  const releaseStock = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const updated = { ...product, stock: product.stock + quantity };
      if (db) {
        saveProductToCloud(updated);
      }
    }
  };

  const handleCheckout = (items: CartItem[], name: string) => {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
    const orderType: 'normal' | 'event' = activeView === 'event' ? 'event' : 'normal';
    
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      customerName: name,
      items,
      total,
      timestamp: Date.now(),
      status: 'queue',
      type: orderType
    };

    if (db) {
      saveOrderToCloud(newOrder);
      if (activeView === 'event') {
        saveEventConfigToCloud({
          ...eventConfig,
          remainingCups: Math.max(0, eventConfig.remainingCups - totalQty)
        });
      }
    }
    
    setCart([]);
    setCustomerName('');
    setActiveView('queue');
  };

  const handleUpdateEventConfig = (config: EventConfig) => {
    if (db) saveEventConfigToCloud(config);
  };

  const handleCompleteOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order && db) {
      saveOrderToCloud({ ...order, status: 'done' });
    }
  };

  const handleUpdateStock = (id: string, newStock: number) => {
    const product = products.find(p => p.id === id);
    if (product && db) {
      saveProductToCloud({ ...product, stock: newStock });
    }
  };

  const handleAddProduct = (product: Product) => {
    if (db) saveProductToCloud(product);
  };

  const handleEditProduct = (updatedProduct: Product) => {
    if (db) saveProductToCloud(updatedProduct);
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to permanently delete this item from the catalog?') && db) {
      await deleteProductFromCloud(id);
    }
  };

  // Filtered History Logic
  const filteredHistoryOrders = useMemo(() => {
    return orders.filter(o => {
      if (o.status !== 'done') return false;
      const effectiveType = o.type || 'normal';
      if (historyTypeFilter !== 'all' && effectiveType !== historyTypeFilter) return false;
      if (historyDateFilter) {
        const d = new Date(o.timestamp);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const localDateStr = `${year}-${month}-${day}`;
        if (localDateStr !== historyDateFilter) return false;
      }
      return true;
    });
  }, [orders, historyDateFilter, historyTypeFilter]);

  const historyTotalSales = useMemo(() => {
    return filteredHistoryOrders.reduce((sum, o) => sum + o.total, 0);
  }, [filteredHistoryOrders]);

  if (authLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#fbfcfd]">
        <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
        <p className="brand-font font-bold text-emerald-900 animate-pulse">Authenticating...</p>
      </div>
    );
  }

  // Auth Guard
  if (!user || !user.emailVerified) {
    return <AuthView user={user} />;
  }

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#fbfcfd]">
        <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
        <p className="brand-font font-bold text-emerald-900 animate-pulse">Syncing Cofitibs Data...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeView) {
      case 'pos':
        return (
          <POSView 
            products={products} 
            onCheckout={handleCheckout} 
            onReserve={reserveStock} 
            onRelease={releaseStock} 
            cart={cart}
            setCart={setCart}
            customerName={customerName}
            setCustomerName={setCustomerName}
          />
        );
      case 'event':
        return (
          <EventPOSView 
            products={products}
            onCheckout={handleCheckout}
            eventConfig={eventConfig}
            onUpdateEventConfig={handleUpdateEventConfig}
            cart={cart}
            setCart={setCart}
            customerName={customerName}
            setCustomerName={setCustomerName}
          />
        );
      case 'inventory':
        return <InventoryView products={products} onUpdateStock={handleUpdateStock} onAddProduct={handleAddProduct} onEditProduct={handleEditProduct} onDeleteProduct={handleDeleteProduct} />;
      case 'queue':
        return <QueueView orders={orders.filter(o => o.status === 'queue')} onComplete={handleCompleteOrder} />;
      case 'history':
        return (
          <div className="h-full flex flex-col p-4 md:p-8 bg-[#fbfcfd] overflow-hidden">
            <div className="mb-8 shrink-0">
               <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                 <div>
                   <h2 className="text-2xl font-black text-emerald-900 brand-font tracking-tight">Order History</h2>
                   <div className="flex items-center gap-6 mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Net Sales</span>
                        <span className="text-sm font-black text-emerald-700">₱{historyTotalSales.toLocaleString()}</span>
                      </div>
                      <div className="w-px h-3 bg-slate-200"></div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Count</span>
                        <span className="text-sm font-black text-slate-900">{filteredHistoryOrders.length}</span>
                      </div>
                   </div>
                 </div>
                 <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm transition-all">
                    <div className="relative flex items-center">
                      <i className="fas fa-calendar absolute left-3 text-[10px] text-slate-300 pointer-events-none"></i>
                      <input 
                        type="date" 
                        value={historyDateFilter}
                        onChange={(e) => setHistoryDateFilter(e.target.value)}
                        className="pl-8 pr-2 py-1.5 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase outline-none w-32 focus:ring-1 focus:ring-emerald-500/20 cursor-pointer"
                      />
                    </div>
                    <div className="w-px h-6 bg-slate-100 hidden sm:block"></div>
                    <div className="flex gap-1 bg-slate-50 p-1 rounded-xl">
                      {(['all', 'normal', 'event'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setHistoryTypeFilter(t)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all ${
                            historyTypeFilter === t 
                              ? 'bg-emerald-600 text-white shadow-sm' 
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    {(historyDateFilter || historyTypeFilter !== 'all') && (
                      <button 
                        onClick={() => { setHistoryDateFilter(''); setHistoryTypeFilter('all'); }}
                        className="w-7 h-7 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-50"
                        title="Clear all filters"
                      >
                        <i className="fas fa-xmark text-xs"></i>
                      </button>
                    )}
                 </div>
               </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 custom-scrollbar">
              {filteredHistoryOrders.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-300">
                  <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-4">
                    <i className="fas fa-magnifying-glass text-2xl"></i>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest">No matching history found</p>
                </div>
              ) : filteredHistoryOrders.map(order => (
                <div key={order.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${order.type === 'event' ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'}`}>
                       <i className={`fas ${order.type === 'event' ? 'fa-calendar-star' : 'fa-check'} text-sm`}></i>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-slate-900">{order.customerName}</div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${order.type === 'event' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {order.type === 'event' ? 'Event' : 'Normal'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {new Date(order.timestamp).toLocaleDateString()} at {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 line-clamp-1 italic font-medium">
                      {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </p>
                  </div>
                  <div className="md:text-right shrink-0">
                     <p className="text-lg font-black text-emerald-900 leading-none">₱{order.total.toLocaleString()}</p>
                     <p className="text-[8px] font-black uppercase tracking-widest text-slate-300 mt-1">Ref #{order.id}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return (
          <POSView 
            products={products} 
            onCheckout={handleCheckout} 
            onReserve={reserveStock} 
            onRelease={releaseStock} 
            cart={cart}
            setCart={setCart}
            customerName={customerName}
            setCustomerName={setCustomerName}
          />
        );
    }
  };

  return (
    <Layout activeView={activeView} setView={setActiveView}>
      {renderContent()}
    </Layout>
  );
};

export default App;