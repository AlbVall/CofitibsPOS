import React, { useState } from 'react';
import { Product, CartItem } from '../types';

interface POSViewProps {
  products: Product[];
  onCheckout: (items: CartItem[], customerName: string) => void;
  onReserve: (productId: string, qty: number) => void;
  onRelease: (productId: string, qty: number) => void;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  customerName: string;
  setCustomerName: React.Dispatch<React.SetStateAction<string>>;
}

const POSView: React.FC<POSViewProps> = ({ 
  products, 
  onCheckout, 
  onReserve, 
  onRelease,
  cart,
  setCart,
  customerName,
  setCustomerName
}) => {
  const [category, setCategory] = useState<string>('All');
  const [showCartMobile, setShowCartMobile] = useState(false);

  const categories = ['All', 'Hot Coffee', 'Iced Coffee', 'Soda', 'Milk Drinks'];
  
  const filteredProducts = category === 'All' 
    ? products 
    : products.filter(p => p.category === category);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    
    // Subtract stock immediately
    onReserve(product.id, 1);

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
    const item = cart.find(i => i.id === id);
    if (!item) return;

    if (delta > 0) {
      // Trying to add more - check available stock from products array
      const product = products.find(p => p.id === id);
      if (!product || product.stock <= 0) return;
      onReserve(id, 1);
    } else {
      // Removing - return stock
      onRelease(id, 1);
    }

    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const clearCart = () => {
    if (cart.length > 0 && confirm('Clear all items?')) {
      // Return all stock
      cart.forEach(item => {
        onRelease(item.id, item.quantity);
      });
      setCart([]);
      setCustomerName('');
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex h-full flex-col lg:flex-row overflow-hidden relative">
      {/* Product Selection Area */}
      <div className={`flex-1 flex flex-col min-w-0 min-h-0 bg-slate-50/50 ${showCartMobile ? 'hidden lg:flex' : 'flex'}`}>
        
        {/* Modern Professional Category Filter */}
        <div className="px-6 py-6 bg-white border-b border-slate-100 shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 border-2 ${
                  category === cat 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100 scale-105' 
                    : 'bg-white text-slate-500 border-slate-100 hover:border-emerald-200 hover:text-emerald-600 hover:bg-emerald-50/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Container */}
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar min-h-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-32 lg:pb-6">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                className={`relative group flex flex-col bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 ${
                  product.stock <= 0 ? 'opacity-60 grayscale cursor-not-allowed' : ''
                }`}
              >
                <div className="aspect-square w-full overflow-hidden relative">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="p-5 flex flex-col flex-1 text-left">
                  <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest mb-1.5">{product.category}</span>
                  <h3 className="font-bold text-slate-800 text-sm leading-snug mb-4 line-clamp-2 h-10">{product.name}</h3>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-lg font-black text-slate-900">₱{product.price.toLocaleString()}</span>
                      <span className="text-[9px] font-bold text-slate-400">Stock: {product.stock}</span>
                    </div>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${product.stock <= 0 ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white group-hover:rotate-90'}`}>
                      <i className="fas fa-plus text-xs"></i>
                    </div>
                  </div>
                </div>
                {product.stock > 0 && product.stock < 10 && (
                   <div className="absolute top-4 left-4 bg-amber-500/90 backdrop-blur-md text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm">Low Stock</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile FAB: View Cart */}
        {cartItemCount > 0 && !showCartMobile && (
          <button
            onClick={() => setShowCartMobile(true)}
            className="lg:hidden fixed bottom-24 right-6 left-6 py-4.5 bg-emerald-600 text-white rounded-3xl font-bold shadow-2xl flex items-center justify-between px-6 z-20 animate-in slide-in-from-bottom duration-300 border-4 border-white"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <i className="fas fa-shopping-basket"></i>
              </div>
              <span className="text-lg">View Order</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="bg-emerald-500 px-3 py-1 rounded-full text-xs font-bold">{cartItemCount}</span>
              <span className="font-black text-xl">₱{total.toLocaleString()}</span>
            </div>
          </button>
        )}
      </div>

      {/* Cart Sidebar / Mobile Overlay */}
      <div className={`w-full lg:w-[420px] bg-white border-l border-slate-200 flex flex-col shrink-0 shadow-2xl relative z-30 transition-transform duration-500 ease-out ${
        showCartMobile ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      } ${showCartMobile ? 'fixed inset-0 lg:static' : 'hidden lg:flex'}`}>
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-4">
            {showCartMobile && (
              <button 
                onClick={() => setShowCartMobile(false)}
                className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 lg:hidden hover:bg-slate-100 transition-colors"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
            )}
            <h2 className="text-2xl font-black text-emerald-900 brand-font tracking-tight">Basket</h2>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar min-h-0">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-6 opacity-40">
              <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center">
                <i className="fas fa-mug-hot text-5xl"></i>
              </div>
              <p className="font-bold text-sm uppercase tracking-widest">Select items to begin</p>
            </div>
          ) : (
            <div className="space-y-8">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-5 group animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-slate-100 shadow-sm">
                    <img src={item.image} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-800 truncate">{item.name}</h4>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">₱{item.price.toLocaleString()} each</p>
                  </div>
                  <div className="flex items-center bg-slate-50 rounded-2xl p-1 border border-slate-100">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-white rounded-xl transition-all"
                    >
                      <i className="fas fa-minus text-[10px]"></i>
                    </button>
                    <span className="w-8 text-center text-sm font-black text-slate-700">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-white rounded-xl transition-all"
                    >
                      <i className="fas fa-plus text-[10px]"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer / Summary with Customer Name */}
        <div className="p-8 bg-slate-50/50 border-t border-slate-100 shrink-0">
          <div className="mb-6">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Customer Identification</label>
            <input 
              type="text" 
              placeholder="Enter name" 
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
            />
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Order Total</span>
              <span className="text-3xl font-black text-emerald-900 leading-none">₱{total.toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={() => {
              if (cart.length > 0 && customerName.trim()) {
                onCheckout(cart, customerName);
                setShowCartMobile(false);
              }
            }}
            disabled={cart.length === 0 || !customerName.trim()}
            className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-emerald-200 transition-all active:scale-[0.98] flex items-center justify-center gap-4 group"
          >
            Send to Queue
            <i className="fas fa-paper-plane text-sm group-hover:translate-x-2 transition-transform"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default POSView;