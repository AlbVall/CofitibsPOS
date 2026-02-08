import React, { useState, useEffect, useMemo, useRef } from 'react';
import Layout from './components/Layout';
import POSView from './components/POSView';
import EventPOSView from './components/EventPOSView';
import InventoryView from './components/InventoryView';
import QueueView from './components/QueueView';
import AuthView from './components/AuthView';
import InsightsView from './components/InsightsView';
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
  deleteProductFromCloud,
  updateStaffProfile
} from './services/firebase';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [eventConfig, setEventConfig] = useState<EventConfig>({ id: 'event_mode', remainingCups: 0, maxCups: 0, isActive: false });
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Profile Edit Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isProfileCameraActive, setIsProfileCameraActive] = useState(false);
  const profileVideoRef = useRef<HTMLVideoElement>(null);
  const profileCanvasRef = useRef<HTMLCanvasElement>(null);
  const profileFileInputRef = useRef<HTMLInputElement>(null);

  // History Filters
  const [historyDateFilter, setHistoryDateFilter] = useState<string>('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'normal' | 'event'>('all');
  const [historySearchTerm, setHistorySearchTerm] = useState<string>('');
  const [showArchived, setShowArchived] = useState(false);

  // Persistent Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (!currentUser) {
        setProducts([]);
        setOrders([]);
        setCart([]);
        setCustomerName('');
        setEventConfig({ id: 'event_mode', remainingCups: 0, maxCups: 0, isActive: false });
        setActiveView('pos');
      }
      
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync with Firebase Cloud
  useEffect(() => {
    if (!user) return;

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
      if (db) saveProductToCloud(updated);
    }
  };

  const releaseStock = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const updated = { ...product, stock: product.stock + quantity };
      if (db) saveProductToCloud(updated);
    }
  };

  const handleCheckout = (items: CartItem[], name: string) => {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
    const orderType: 'normal' | 'event' = activeView === 'event' ? 'event' : 'normal';
    
    // Identity logic: Use Nickname (displayName) if set, otherwise Email
    const userDisplayName = auth.currentUser?.displayName;
    const userEmail = auth.currentUser?.email;
    const identifier = userDisplayName && userDisplayName.trim() !== '' ? userDisplayName : (userEmail || 'Unknown');

    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      customerName: name,
      items,
      total,
      timestamp: Date.now(),
      status: 'queue',
      type: orderType,
      createdBy: identifier
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
      // Identity logic: Use Nickname (displayName) if set, otherwise Email
      const userDisplayName = auth.currentUser?.displayName;
      const userEmail = auth.currentUser?.email;
      const identifier = userDisplayName && userDisplayName.trim() !== '' ? userDisplayName : (userEmail || 'Unknown');

      saveOrderToCloud({ 
        ...order, 
        status: 'done',
        completedBy: identifier
      });
    }
  };

  const handleArchiveOrder = (orderId: string, archive: boolean) => {
    const order = orders.find(o => o.id === orderId);
    if (order && db) {
      saveOrderToCloud({ ...order, archived: archive });
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

  // Profile Modal Logic
  const openProfileModal = () => {
    setProfileName(auth.currentUser?.displayName || '');
    setProfileImage(auth.currentUser?.photoURL || '');
    setIsProfileModalOpen(true);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileSaving(true);
    try {
      if (auth.currentUser) {
        await updateStaffProfile(profileName, profileImage);
        // Reload the user to ensure auth.currentUser has the latest data
        await auth.currentUser.reload();
        // Update local state to trigger UI refresh
        setUser({ ...auth.currentUser } as User);
      }
      setIsProfileModalOpen(false);
    } catch (err) {
      console.error("Profile Save Error:", err);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsProfileSaving(false);
    }
  };

  const startProfileCamera = async () => {
    setIsProfileCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: false 
      });
      if (profileVideoRef.current) {
        profileVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setIsProfileCameraActive(false);
    }
  };

  const stopProfileCamera = () => {
    if (profileVideoRef.current && profileVideoRef.current.srcObject) {
      const tracks = (profileVideoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      profileVideoRef.current.srcObject = null;
    }
    setIsProfileCameraActive(false);
  };

  const captureProfilePhoto = () => {
    if (profileVideoRef.current && profileCanvasRef.current) {
      const video = profileVideoRef.current;
      const canvas = profileCanvasRef.current;
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const rawData = canvas.toDataURL('image/jpeg', 0.7);
      setProfileImage(rawData);
      stopProfileCamera();
    }
  };

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredHistoryOrders = useMemo(() => {
    return orders.filter(o => {
      if (o.status !== 'done') return false;
      
      // Filter by Archive State
      const isArchived = o.archived === true;
      if (showArchived !== isArchived) return false;

      const effectiveType = o.type || 'normal';
      if (historyTypeFilter !== 'all' && effectiveType !== historyTypeFilter) return false;
      
      if (historySearchTerm) {
        const term = historySearchTerm.toLowerCase();
        const guestMatch = o.customerName.toLowerCase().includes(term);
        const placedMatch = o.createdBy?.toLowerCase().includes(term);
        const completedMatch = o.completedBy?.toLowerCase().includes(term);
        
        if (!guestMatch && !placedMatch && !completedMatch) {
          return false;
        }
      }

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
  }, [orders, historyDateFilter, historyTypeFilter, historySearchTerm, showArchived]);

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

  if (!user) {
    return <AuthView user={user} />;
  }

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#fbfcfd]">
        <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
        <p className="brand-font font-bold text-emerald-900 animate-pulse">Syncing Cofitibs Cloud...</p>
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
      case 'insights':
        return <InsightsView products={products} orders={orders} />;
      case 'history':
        return (
          <div className="h-full flex flex-col p-4 md:p-8 bg-[#fbfcfd] overflow-hidden">
            <div className="mb-8 shrink-0">
               <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                 <div>
                   <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-2xl font-black text-emerald-900 brand-font tracking-tight">
                        {showArchived ? 'Old History (Archive)' : 'Recent History'}
                      </h2>
                      <button 
                        onClick={() => setShowArchived(!showArchived)}
                        className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 ${showArchived ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-600 text-white shadow-rose-200'}`}
                      >
                        {showArchived ? 'Switch to Recent' : 'Switch to Archive'}
                      </button>
                   </div>
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
                    <div className="relative flex items-center min-w-[140px] md:min-w-[200px]">
                      <i className="fas fa-search absolute left-3 text-[10px] text-slate-300 pointer-events-none"></i>
                      <input 
                        type="text" 
                        placeholder="Search Guest or Staff..."
                        value={historySearchTerm}
                        onChange={(e) => setHistorySearchTerm(e.target.value)}
                        className="pl-8 pr-3 py-1.5 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase outline-none w-full focus:ring-1 focus:ring-emerald-500/20"
                      />
                    </div>
                    
                    <div className="w-px h-6 bg-slate-100 hidden sm:block"></div>
                    
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
                    {(historyDateFilter || historyTypeFilter !== 'all' || historySearchTerm) && (
                      <button 
                        onClick={() => { 
                          setHistoryDateFilter(''); 
                          setHistoryTypeFilter('all'); 
                          setHistorySearchTerm(''); 
                        }}
                        className="w-7 h-7 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-50"
                        title="Clear all filters"
                      >
                        <i className="fas fa-xmark text-xs"></i>
                      </button>
                    )}
                 </div>
               </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 custom-scrollbar">
              {filteredHistoryOrders.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-300">
                  <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-4">
                    <i className="fas fa-magnifying-glass text-2xl"></i>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest">No matching history found</p>
                </div>
              ) : filteredHistoryOrders.map(order => (
                <div key={order.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 group relative">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${order.type === 'event' ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'}`}>
                         <i className={`fas ${order.type === 'event' ? 'fa-calendar-star' : 'fa-check'} text-lg`}></i>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-slate-900 text-lg leading-none">{order.customerName}</div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${order.type === 'event' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {order.type === 'event' ? 'Event' : 'Normal'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                          {new Date(order.timestamp).toLocaleDateString()} • {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <div className="md:text-right shrink-0 flex items-center gap-4">
                       <div className="hidden md:block">
                          <p className="text-2xl font-black text-emerald-900 leading-none">₱{order.total.toLocaleString()}</p>
                          <p className="text-[8px] font-black uppercase tracking-widest text-slate-300 mt-1">Ref #{order.id}</p>
                       </div>
                       <div className="flex flex-col gap-1">
                          <button 
                            onClick={() => handleArchiveOrder(order.id, !showArchived)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${showArchived ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'}`}
                            title={showArchived ? "Restore to Recent" : "Move to Archive"}
                          >
                             <i className={`fas ${showArchived ? 'fa-rotate-left' : 'fa-box-archive'}`}></i>
                          </button>
                       </div>
                    </div>
                  </div>

                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                    <p className="text-xs text-slate-600 font-medium italic">
                      {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                        <i className="fas fa-user-pen text-[10px]"></i>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Placed By</span>
                        <span className="text-[10px] font-bold text-slate-700">{order.createdBy || 'Unknown Staff'}</span>
                      </div>
                    </div>
                    {order.completedBy && (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                          <i className="fas fa-user-check text-[10px]"></i>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Completed By</span>
                          <span className="text-[10px] font-bold text-emerald-700">{order.completedBy || 'Unknown Staff'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="md:hidden mt-2 flex items-center justify-between">
                     <p className="text-xl font-black text-emerald-900">₱{order.total.toLocaleString()}</p>
                     <p className="text-[8px] font-black uppercase tracking-widest text-slate-300">Ref #{order.id}</p>
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
    <Layout activeView={activeView} setView={setActiveView} onOpenProfile={openProfileModal}>
      {renderContent()}

      {/* Profile Edit Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => { stopProfileCamera(); setIsProfileModalOpen(false); }}></div>
          <div className="relative bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl animate-in zoom-in duration-200 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-2xl font-black text-emerald-900 brand-font">Staff Profile</h3>
               <button onClick={() => { stopProfileCamera(); setIsProfileModalOpen(false); }} className="text-slate-400 hover:text-rose-500 transition-colors">
                  <i className="fas fa-times text-xl"></i>
               </button>
            </div>

            <form onSubmit={handleProfileSave} className="space-y-6">
               {/* Profile Image Section */}
               <div className="flex flex-col items-center gap-4">
                  <div className="relative w-32 h-32 group">
                     <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-xl">
                        {isProfileCameraActive ? (
                           <video ref={profileVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        ) : (
                           profileImage ? (
                              <img src={profileImage} className="w-full h-full object-cover" />
                           ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                 <i className="fas fa-user text-4xl"></i>
                              </div>
                           )
                        )}
                     </div>
                     
                     {!isProfileCameraActive && (
                        <div className="absolute inset-0 bg-emerald-900/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                           <button type="button" onClick={startProfileCamera} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-lg active:scale-95 transition-transform">
                              <i className="fas fa-camera text-sm"></i>
                           </button>
                           <button type="button" onClick={() => profileFileInputRef.current?.click()} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-lg active:scale-95 transition-transform">
                              <i className="fas fa-upload text-sm"></i>
                           </button>
                        </div>
                     )}

                     {isProfileCameraActive && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                           <button type="button" onClick={captureProfilePhoto} className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                              <i className="fas fa-check text-xs"></i>
                           </button>
                           <button type="button" onClick={stopProfileCamera} className="w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                              <i className="fas fa-times text-xs"></i>
                           </button>
                        </div>
                     )}
                  </div>
                  <input type="file" ref={profileFileInputRef} className="hidden" accept="image/*" onChange={handleProfileFileChange} />
                  <canvas ref={profileCanvasRef} className="hidden" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Update Profile Picture</p>
               </div>

               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Nickname / Display Name</label>
                  <input 
                    type="text" 
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Enter nickname"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                  />
               </div>

               <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isProfileSaving}
                    className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    {isProfileSaving ? (
                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                       <>
                         Save Changes
                         <i className="fas fa-check"></i>
                       </>
                    )}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;