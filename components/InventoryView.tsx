import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../types';

interface InventoryViewProps {
  products: Product[];
  onUpdateStock: (id: string, newStock: number) => void;
  onAddProduct: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

const InventoryView: React.FC<InventoryViewProps> = ({ products, onUpdateStock, onAddProduct, onEditProduct, onDeleteProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const PREDEFINED_CATEGORIES = ['Hot Coffee', 'Iced Coffee', 'Soda', 'Milk Drinks'];

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    unitCost: '',
    category: 'Hot Coffee',
    stock: '',
    image: ''
  });

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        price: editingProduct.price.toString(),
        unitCost: (editingProduct.unitCost || 0).toString(),
        category: editingProduct.category,
        stock: editingProduct.stock.toString(),
        image: editingProduct.image
      });
    } else {
      setFormData({ name: '', price: '', unitCost: '', category: 'Hot Coffee', stock: '', image: '' });
    }
    // Reset camera state when modal opens/closes
    return () => stopCamera();
  }, [editingProduct, isModalOpen]);

  // Image Processing Utility
  const processImage = (src: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        // Convert to medium quality JPEG to save space in Firestore
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = src;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await processImage(reader.result as string);
        setFormData(prev => ({ ...prev, image: compressed }));
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setIsCameraActive(false);
      alert("Please allow camera access to take photos.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Capture frame at original video resolution
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const rawData = canvas.toDataURL('image/jpeg');
      setIsProcessing(true);
      const compressed = await processImage(rawData);
      setFormData(prev => ({ ...prev, image: compressed }));
      setIsProcessing(false);
      stopCamera();
    }
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalItems: products.length,
    lowStock: products.filter(p => p.stock > 0 && p.stock < 15).length,
    outOfStock: products.filter(p => p.stock <= 0).length,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productData: Product = {
      id: editingProduct ? editingProduct.id : Math.random().toString(36).substr(2, 9),
      name: formData.name,
      price: parseFloat(formData.price),
      unitCost: parseFloat(formData.unitCost) || 0,
      category: formData.category,
      stock: parseInt(formData.stock) || 0,
      image: formData.image || 'https://via.placeholder.com/200?text=No+Image',
    };
    
    if (editingProduct) {
      onEditProduct(productData);
    } else {
      onAddProduct(productData);
    }
    
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = () => {
    if (editingProduct) {
      onDeleteProduct(editingProduct.id);
      setIsModalOpen(false);
      setEditingProduct(null);
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col bg-[#fbfcfd] relative overflow-hidden">
      <div className="md:p-8 p-4 pb-0 shrink-0">
        <div className="flex items-center justify-between mb-2 md:mb-6">
          <h2 className="text-2xl md:text-4xl font-black text-emerald-900 tracking-tight brand-font">Inventory Management</h2>
          <button 
            onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
            className="md:hidden w-10 h-10 bg-emerald-600 text-white rounded-xl shadow-lg flex items-center justify-center active:scale-90 transition-transform"
          >
            <i className="fas fa-plus"></i>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-4 md:mb-8">
          <div className="relative flex-1 group">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors"></i>
            <input
              type="text"
              placeholder="Filter by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl md:rounded-3xl focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 shadow-sm transition-all text-sm font-medium"
            />
          </div>
          <button 
            onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
            className="hidden md:flex bg-emerald-600 text-white px-8 py-3.5 rounded-3xl font-black text-sm shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all items-center justify-center gap-3 active:scale-95"
          >
            <i className="fas fa-plus"></i>
            New Item
          </button>
        </div>

        <div className="hidden md:grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Catalog Size</p>
            <p className="text-4xl font-black text-slate-900">{stats.totalItems}</p>
          </div>
          <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Low Inventory</p>
            <p className="text-4xl font-black text-amber-500">{stats.lowStock}</p>
          </div>
          <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Depleted</p>
            <p className="text-4xl font-black text-rose-500">{stats.outOfStock}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 px-4 md:px-8 pb-4 overflow-hidden">
        <div className="h-full overflow-y-auto custom-scrollbar md:bg-white md:rounded-[3rem] md:border md:border-slate-200 relative">
          
          <div className="md:hidden grid grid-cols-1 gap-3 pb-4">
            {filtered.map(product => (
              <div key={product.id} className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm flex items-center gap-4 relative overflow-hidden group active:bg-slate-50 transition-colors">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-slate-100 shadow-sm">
                  <img src={product.image} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 pr-10">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${product.stock <= 0 ? 'bg-rose-500' : product.stock < 15 ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{product.category}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm truncate">{product.name}</h3>
                  <div className="flex flex-col">
                    <p className="text-xs font-black text-emerald-800 mt-1">SRP: ₱{product.price.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-slate-400">Cost: ₱{product.unitCost?.toLocaleString() || 0}</p>
                  </div>
                </div>
                
                {/* Mobile Management Action */}
                <div className="absolute top-3 right-3 z-10 flex gap-2">
                  <button 
                    onClick={() => openEditModal(product)} 
                    className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-emerald-600 border border-slate-100 shadow-sm active:scale-90 transition-all"
                  >
                    <i className="fas fa-pen text-[10px]"></i>
                  </button>
                </div>

                <div className="flex flex-col items-center gap-1.5 shrink-0 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                   <button onClick={() => onUpdateStock(product.id, product.stock + 1)} className="w-8 h-8 flex items-center justify-center text-emerald-600 bg-white rounded-xl shadow-sm active:scale-90"><i className="fas fa-plus text-[10px]"></i></button>
                   <span className={`text-[11px] font-black ${product.stock < 15 ? 'text-amber-600' : 'text-slate-600'}`}>{product.stock}</span>
                   <button onClick={() => onUpdateStock(product.id, Math.max(0, product.stock - 1))} className="w-8 h-8 flex items-center justify-center text-slate-400 bg-white rounded-xl shadow-sm active:scale-90"><i className="fas fa-minus text-[10px]"></i></button>
                </div>
              </div>
            ))}
          </div>

          <table className="hidden md:table w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white border-b border-slate-100 z-10">
              <tr>
                <th className="px-10 py-6 font-black text-slate-400 uppercase text-[10px] tracking-widest">Item Description</th>
                <th className="px-10 py-6 font-black text-slate-400 uppercase text-[10px] tracking-widest">Category</th>
                <th className="px-10 py-6 font-black text-slate-400 uppercase text-[10px] tracking-widest text-center">Unit Cost</th>
                <th className="px-10 py-6 font-black text-slate-400 uppercase text-[10px] tracking-widest text-center">Retail Price</th>
                <th className="px-10 py-6 font-black text-slate-400 uppercase text-[10px] tracking-widest">Quantity</th>
                <th className="px-10 py-6 font-black text-slate-400 uppercase text-[10px] tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(product => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-10 py-5 text-sm font-bold text-slate-800"><div className="flex items-center gap-4"><img src={product.image} className="w-12 h-12 rounded-xl object-cover" />{product.name}</div></td>
                  <td className="px-10 py-5"><span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{product.category}</span></td>
                  <td className="px-10 py-5 text-center font-black text-slate-400">₱{product.unitCost?.toLocaleString() || 0}</td>
                  <td className="px-10 py-5 text-center font-black">₱{product.price.toLocaleString()}</td>
                  <td className="px-10 py-5"><div className="flex items-center gap-3"><span className={`w-10 font-black ${product.stock < 15 ? 'text-amber-500' : 'text-slate-700'}`}>{product.stock}</span><div className="h-1.5 w-24 bg-slate-100 rounded-full"><div className="h-full bg-emerald-500 rounded-full" style={{width: `${Math.min(100, product.stock)}%`}}></div></div></div></td>
                  <td className="px-10 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(product)} 
                        className="h-12 px-4 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 transition-all flex items-center justify-center gap-2 font-bold text-xs"
                      >
                        <i className="fas fa-edit"></i>
                        Manage
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-xl md:rounded-[3rem] rounded-t-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-6 md:p-10 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-xl md:text-2xl font-black text-emerald-900 brand-font">{editingProduct ? 'Manage Item' : 'New Catalog Item'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"><i className="fas fa-times"></i></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {/* Enhanced Image Section with Camera */}
              <div className="w-full h-56 relative rounded-3xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-200 group">
                {isCameraActive ? (
                  <div className="w-full h-full relative">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4">
                       <button type="button" onClick={capturePhoto} className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-xl border-4 border-emerald-100 active:scale-90 transition-transform">
                          <i className="fas fa-camera text-xl"></i>
                       </button>
                       <button type="button" onClick={stopCamera} className="w-14 h-14 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-xl active:scale-90 transition-transform">
                          <i className="fas fa-times text-xl"></i>
                       </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    {formData.image ? (
                      <img src={formData.image} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-slate-300">
                        <i className="fas fa-image text-4xl mb-2"></i>
                        <span className="text-[10px] font-black uppercase tracking-widest">No Image Selected</span>
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-emerald-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-[2px]">
                       <button type="button" onClick={startCamera} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-lg active:scale-95 transition-transform">
                          <i className="fas fa-camera"></i>
                       </button>
                       <button type="button" onClick={() => fileInputRef.current?.click()} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-lg active:scale-95 transition-transform">
                          <i className="fas fa-upload"></i>
                       </button>
                    </div>
                  </div>
                )}
                
                {isProcessing && (
                  <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-20">
                    <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <span className="text-[10px] font-black uppercase text-emerald-700">Processing...</span>
                  </div>
                )}
                
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Item Name</label><input required type="text" value={formData.name} onChange={e => setFormData(prev => ({...prev, name: e.target.value}))} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" /></div>
                <div className="col-span-2 md:col-span-1"><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Category</label><select required value={formData.category} onChange={e => setFormData(prev => ({...prev, category: e.target.value}))} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold appearance-none">{PREDEFINED_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div className="col-span-2 md:col-span-1"><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Retail Price (₱)</label><input required type="number" step="0.01" value={formData.price} onChange={e => setFormData(prev => ({...prev, price: e.target.value}))} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" /></div>
                <div className="col-span-2 md:col-span-1"><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Unit Cost (₱)</label><input required type="number" step="0.01" value={formData.unitCost} onChange={e => setFormData(prev => ({...prev, unitCost: e.target.value}))} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold placeholder:text-slate-300" placeholder="0.00" /></div>
                <div className="col-span-2 md:col-span-1"><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Available Quantity</label><input required type="number" value={formData.stock} onChange={e => setFormData(prev => ({...prev, stock: e.target.value}))} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" /></div>
              </div>
              
              <div className="flex flex-col gap-3">
                <button 
                  type="submit" 
                  disabled={isProcessing}
                  className="w-full py-4 bg-emerald-600 disabled:bg-slate-300 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-emerald-100 active:scale-95 transition-transform"
                >
                  {editingProduct ? 'Save Changes' : 'Add to Catalog'}
                </button>
                
                {editingProduct && (
                   <button 
                     type="button" 
                     onClick={handleDelete}
                     className="w-full py-3 bg-rose-50 text-rose-500 rounded-[1.5rem] font-bold text-sm hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
                   >
                     <i className="fas fa-trash-can text-xs"></i>
                     Delete Item Permanently
                   </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryView;