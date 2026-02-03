
import React, { useMemo, useState, useEffect } from 'react';
import { Product, Order } from '../types';
import { getInventoryInsights } from '../services/geminiService';

interface InsightsViewProps {
  products: Product[];
  orders: Order[];
}

interface AIInsight {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
}

const InsightsView: React.FC<InsightsViewProps> = ({ products, orders }) => {
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    const fetchInsights = async () => {
      if (products.length > 0) {
        setLoadingAI(true);
        const data = await getInventoryInsights(products, orders);
        setAiInsights(data.insights || []);
        setLoadingAI(false);
      }
    };
    fetchInsights();
  }, [products.length, orders.length]);

  const analytics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const productSales: Record<string, { name: string; qty: number; revenue: number; image: string }> = {};
    const categorySales: Record<string, number> = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.id]) {
          productSales[item.id] = { name: item.name, qty: 0, revenue: 0, image: item.image };
        }
        productSales[item.id].qty += item.quantity;
        productSales[item.id].revenue += item.quantity * item.price;
        categorySales[item.category] = (categorySales[item.category] || 0) + (item.quantity * item.price);
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const sortedCategories = Object.entries(categorySales)
      .sort((a, b) => b[1] - a[1]);

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      topProducts,
      sortedCategories,
      maxProductQty: topProducts.length > 0 ? topProducts[0].qty : 1
    };
  }, [orders]);

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 bg-[#fbfcfd] custom-scrollbar">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-emerald-900 tracking-tight brand-font">Business Dashboard</h2>
        <p className="text-slate-500 mt-1 font-medium">Monitoring Bark & Brew performance.</p>
      </div>

      {/* AI Business Advisor Section */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100">
            <i className="fas fa-robot text-white"></i>
          </div>
          <h3 className="text-xl font-bold text-emerald-900 brand-font">AI Business Advisor</h3>
          {loadingAI && <div className="ml-2 w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {aiInsights.length > 0 ? aiInsights.map((insight, idx) => (
            <div key={idx} className={`p-6 rounded-[2rem] border transition-all hover:shadow-lg ${
              insight.priority === 'high' ? 'bg-amber-50 border-amber-100' : 
              insight.priority === 'medium' ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  insight.priority === 'high' ? 'bg-amber-500 text-white' : 
                  insight.priority === 'medium' ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'
                }`}>
                  <i className={`fas ${insight.icon || 'fa-lightbulb'}`}></i>
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                  insight.priority === 'high' ? 'bg-amber-100 text-amber-700' : 
                  insight.priority === 'medium' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  {insight.priority} Priority
                </span>
              </div>
              <h4 className="font-bold text-slate-800 mb-2 leading-tight">{insight.title}</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{insight.description}</p>
            </div>
          )) : !loadingAI && (
             <div className="col-span-full py-10 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
                <p className="text-slate-400 font-medium italic">Waiting for more data to generate insights...</p>
             </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
            <i className="fas fa-coins text-xl"></i>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Total Revenue</p>
          <p className="text-3xl font-black text-slate-900">₱{analytics.totalRevenue.toLocaleString()}</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <i className="fas fa-shopping-bag text-xl"></i>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Total Orders</p>
          <p className="text-3xl font-black text-slate-900">{analytics.totalOrders}</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
            <i className="fas fa-chart-pie text-xl"></i>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Avg. Ticket</p>
          <p className="text-3xl font-black text-slate-900">₱{analytics.avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-emerald-900 brand-font">Best Sellers</h3>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">By Volume</span>
          </div>
          <div className="space-y-6">
            {analytics.topProducts.length > 0 ? analytics.topProducts.map((product, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={product.image} className="w-10 h-10 rounded-xl object-cover" />
                    <span className="font-bold text-sm text-slate-700">{product.name}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400">{product.qty} sold</span>
                </div>
                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${(product.qty / analytics.maxProductQty) * 100}%` }}
                  ></div>
                </div>
              </div>
            )) : (
              <p className="text-center py-10 text-slate-400 italic text-sm">No sales data available yet.</p>
            )}
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold brand-font text-emerald-400">Category Sales</h3>
              <i className="fas fa-layer-group text-slate-700"></i>
            </div>
            <div className="space-y-5">
              {analytics.sortedCategories.length > 0 ? analytics.sortedCategories.map(([cat, val], idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                  <span className="text-sm font-semibold">{cat}</span>
                  <span className="font-bold text-emerald-400">₱{val.toLocaleString()}</span>
                </div>
              )) : (
                <p className="text-center py-10 text-slate-500 italic text-sm">Waiting for first transaction.</p>
              )}
            </div>
          </div>
          <i className="fas fa-chart-line absolute -bottom-10 -right-10 text-[12rem] text-slate-800/30 -rotate-12 pointer-events-none"></i>
        </div>
      </div>
    </div>
  );
};

export default InsightsView;
