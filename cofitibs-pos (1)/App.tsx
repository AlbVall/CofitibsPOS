import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import POSView from './components/POSView';
import InventoryView from './components/InventoryView';
import QueueView from './components/QueueView';
import { Product, Order, CartItem, View } from './types';
import { 
  db, 
  listenToOrders, 
  listenToProducts, 
  saveOrderToCloud, 
  saveProductToCloud,
  deleteProductFromCloud
} from './services/firebase';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  
  // Persistent Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');

  // Sync with Firebase Cloud or Local Storage
  useEffect(() => {
    let unsubscribeOrders = () => {};
    let unsubscribeProducts = () => {};

    if (db) {
      unsubscribeOrders = listenToOrders((newOrders) => {
        setOrders(newOrders);
        setIsCloudSynced(true);
        setIsLoading(false);
      });

      unsubscribeProducts = listenToProducts((newProducts) => {
        setProducts(newProducts);
        setIsLoading(false);
      });
    } else {
      const savedProducts = localStorage.getItem('bb_pos_products');
      const savedOrders = localStorage.getItem('bb_pos_orders');
      
      if (savedProducts) setProducts(JSON.parse(savedProducts));
      else setProducts([]);

      if (savedOrders) setOrders(JSON.parse(savedOrders));
      
      setIsLoading(false);
      setIsCloudSynced(false);
    }

    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
    };
  }, []);

  const reserveStock = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const updated = { ...product, stock: Math.max(0, product.stock - quantity) };
      if (db) {
        saveProductToCloud(updated);
      } else {
        const newProducts = products.map(p => p.id === productId ? updated : p);
        setProducts(newProducts);
        localStorage.setItem('bb_pos_products', JSON.stringify(newProducts));
      }
    }
  };

  const releaseStock = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const updated = { ...product, stock: product.stock + quantity };
      if (db) {
        saveProductToCloud(updated);
      } else {
        const newProducts = products.map(p => p.id === productId ? updated : p);
        setProducts(newProducts);
        localStorage.setItem('bb_pos_products', JSON.stringify(newProducts));
      }
    }
  };

  const handleCheckout = (items: CartItem[], name: string) => {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      customerName: name,
      items,
      total,
      timestamp: Date.now(),
      status: 'queue'
    };

    if (db) {
      saveOrderToCloud(newOrder);
    } else {
      const newOrders = [newOrder, ...orders];
      setOrders(newOrders);
      localStorage.setItem('bb_pos_orders', JSON.stringify(newOrders));
    }
    
    // Clear cart and customer name on checkout
    setCart([]);
    setCustomerName('');
    setActiveView('queue');
  };

  const handleCompleteOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      if (db) {
        saveOrderToCloud({ ...order, status: 'done' });
      } else {
        const newOrders = orders.map(o => o.id === orderId ? { ...o, status: 'done' as const } : o);
        setOrders(newOrders);
        localStorage.setItem('bb_pos_orders', JSON.stringify(newOrders));
      }
    }
  };

  const handleUpdateStock = (id: string, newStock: number) => {
    const product = products.find(p => p.id === id);
    if (product) {
      const updated = { ...product, stock: newStock };
      if (db) {
        saveProductToCloud(updated);
      } else {
        const newProducts = products.map(p => p.id === id ? updated : p);
        setProducts(newProducts);
        localStorage.setItem('bb_pos_products', JSON.stringify(newProducts));
      }
    }
  };

  const handleAddProduct = (product: Product) => {
    if (db) {
      saveProductToCloud(product);
    } else {
      const newProducts = [...products, product];
      setProducts(newProducts);
      localStorage.setItem('bb_pos_products', JSON.stringify(newProducts));
    }
  };

  const handleEditProduct = (updatedProduct: Product) => {
    if (db) {
      saveProductToCloud(updatedProduct);
    } else {
      const newProducts = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
      setProducts(newProducts);
      localStorage.setItem('bb_pos_products', JSON.stringify(newProducts));
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to permanently delete this item from the catalog?')) {
      if (db) {
        await deleteProductFromCloud(id);
      } else {
        const newProducts = products.filter(p => p.id !== id);
        setProducts(newProducts);
        localStorage.setItem('bb_pos_products', JSON.stringify(newProducts));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#fbfcfd]">
        <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
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
      case 'inventory':
        return <InventoryView products={products} onUpdateStock={handleUpdateStock} onAddProduct={handleAddProduct} onEditProduct={handleEditProduct} onDeleteProduct={handleDeleteProduct} />;
      case 'queue':
        return <QueueView orders={orders.filter(o => o.status === 'queue')} onComplete={handleCompleteOrder} />;
      case 'history':
        const doneOrders = orders.filter(o => o.status === 'done');
        const totalSales = doneOrders.reduce((sum, o) => sum + o.total, 0);
        return (
          <div className="h-full flex flex-col p-4 md:p-8 bg-[#fbfcfd] overflow-hidden">
            <div className="mb-6 md:mb-10 shrink-0">
               <h2 className="text-2xl md:text-3xl font-bold text-emerald-900 tracking-tight brand-font">Order History</h2>
               <div className="mt-4 flex flex-wrap gap-4">
                  <div className="bg-emerald-600 text-white px-6 py-4 rounded-3xl shadow-md min-w-[160px]">
                     <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Total Sales</p>
                     <p className="text-xl md:text-2xl font-bold">₱{totalSales.toLocaleString()}</p>
                  </div>
                  <div className="bg-white border border-slate-100 px-6 py-4 rounded-3xl shadow-sm min-w-[160px]">
                     <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Fulfilled</p>
                     <p className="text-xl md:text-2xl font-bold text-slate-800">{doneOrders.length}</p>
                  </div>
               </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 custom-scrollbar">
              {doneOrders.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-slate-300">
                  <i className="fas fa-history text-3xl mb-2"></i>
                  <p className="text-xs font-bold uppercase">No records found</p>
                </div>
              ) : doneOrders.map(order => (
                <div key={order.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                       <i className="fas fa-check text-sm"></i>
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{order.customerName}</div>
                      <div className="text-[10px] text-slate-400">{new Date(order.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 line-clamp-1 italic">
                      {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </p>
                  </div>
                  <div className="md:text-right shrink-0">
                     <p className="text-lg font-bold text-emerald-900">₱{order.total.toLocaleString()}</p>
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
      <div className="fixed bottom-4 right-4 z-[60] flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur rounded-full border border-slate-100 shadow-sm">
        <div className={`w-2 h-2 rounded-full ${isCloudSynced ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          {isCloudSynced ? 'Cloud Synced' : 'Local Mode'}
        </span>
      </div>
    </Layout>
  );
};

export default App;