import React, { useMemo } from 'react';
import { Product, Order } from '../types';

interface InsightsViewProps {
  products: Product[];
  orders: Order[];
}

const InsightsView: React.FC<InsightsViewProps> = ({ products, orders }) => {
  const analytics = useMemo(() => {
    // 1. Exclude archived orders from all computations
    const activeOrders = orders.filter(o => !o.archived);

    // Initialize counters for Normal and Event division
    const stats = {
      total: { revenue: 0, orders: 0, profit: 0 },
      normal: { revenue: 0, orders: 0, profit: 0 },
      event: { revenue: 0, orders: 0, profit: 0 }
    };

    const productSales: Record<string, { name: string; qty: number; revenue: number; profit: number; image: string }> = {};
    const categorySales: Record<string, number> = {};

    activeOrders.forEach(order => {
      const isEvent = order.type === 'event';
      const typeKey = isEvent ? 'event' : 'normal';

      stats.total.revenue += order.total;
      stats.total.orders += 1;
      stats[typeKey].revenue += order.total;
      stats[typeKey].orders += 1;

      order.items.forEach(item => {
        const itemProfit = (item.price - (item.unitCost || 0)) * item.quantity;
        
        stats.total.profit += itemProfit;
        stats[typeKey].profit += itemProfit;

        if (!productSales[item.id]) {
          productSales[item.id] = { name: item.name, qty: 0, revenue: 0, profit: 0, image: item.image };
        }
        productSales[item.id].qty += item.quantity;
        productSales[item.id].revenue += item.quantity * item.price;
        productSales[item.id].profit += itemProfit;
        
        categorySales[item.category] = (categorySales[item.category] || 0) + (item.quantity * item.price);
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const sortedCategories = Object.entries(categorySales)
      .sort((a, b) => b[1] - a[1]);

    return {
      stats,
      topProducts,
      sortedCategories,
      maxProductQty: topProducts.length > 0 ? topProducts[0].qty : 1
    };
  }, [orders]);

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 bg-[#fbfcfd] custom-scrollbar">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-emerald-900 tracking-tight brand-font">Business Dashboard</h2>
        <p className="text-slate-500 mt-1 font-medium">Active performance metrics (Archived orders excluded).</p>
      </div>

      {/* KPI Cards with Normal/Event Division */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Total Revenue Card */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
            <i className="fas fa-coins text-xl"></i>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Active Revenue</p>
          <p className="text-3xl font-black text-slate-900 mb-4">₱{analytics.stats.total.revenue.toLocaleString()}</p>
          
          <div className="space-y-2 border-t border-slate-50 pt-4">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
              <span className="text-slate-400">Normal</span>
              <span className="text-emerald-600">₱{analytics.stats.normal.revenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
              <span className="text-slate-400">Events</span>
              <span className="text-indigo-600">₱{analytics.stats.event.revenue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Est. Profit Card */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
            <i className="fas fa-hand-holding-dollar text-xl"></i>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Est. Gross Profit</p>
          <p className="text-3xl font-black text-rose-600 mb-4">₱{analytics.stats.total.profit.toLocaleString()}</p>
          
          <div className="space-y-2 border-t border-slate-50 pt-4">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
              <span className="text-slate-400">Normal</span>
              <span className="text-rose-500">₱{analytics.stats.normal.profit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
              <span className="text-slate-400">Events</span>
              <span className="text-indigo-500">₱{analytics.stats.event.profit.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Order Count Card */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <i className="fas fa-shopping-bag text-xl"></i>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Total Orders</p>
          <p className="text-3xl font-black text-slate-900 mb-4">{analytics.stats.total.orders}</p>
          
          <div className="space-y-2 border-t border-slate-50 pt-4">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
              <span className="text-slate-400">Normal</span>
              <span className="text-blue-600">{analytics.stats.normal.orders} orders</span>
            </div>
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
              <span className="text-slate-400">Events</span>
              <span className="text-indigo-600">{analytics.stats.event.orders} orders</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Best Sellers */}
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
              <p className="text-center py-10 text-slate-400 italic text-sm">No active sales data yet.</p>
            )}
          </div>
        </div>

        {/* Category Sales */}
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