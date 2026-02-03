
import React from 'react';
import { Order } from '../types';

interface QueueViewProps {
  orders: Order[];
  onComplete: (id: string) => void;
}

const QueueView: React.FC<QueueViewProps> = ({ orders, onComplete }) => {
  return (
    <div className="h-full flex flex-col p-4 md:p-8 bg-[#fbfcfd] overflow-hidden">
      <div className="mb-6 md:mb-10 shrink-0">
        <h2 className="text-2xl md:text-3xl font-bold text-emerald-900 tracking-tight brand-font">Order Queue</h2>
        <p className="text-slate-500 mt-1 text-sm md:text-base font-medium">Managing active orders in preparation.</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {orders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <i className="fas fa-mug-hot text-4xl text-slate-300"></i>
            </div>
            <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Queue is empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 pb-20">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 flex flex-col relative overflow-hidden group">
                {/* Status Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-block px-3 py-1 bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-100 mb-2">
                      Preparing
                    </span>
                    <h3 className="text-lg font-black text-slate-800 brand-font">{order.customerName}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">#{order.id} • {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>

                {/* Items List */}
                <div className="flex-1 space-y-3 mb-6 bg-slate-50/50 p-4 rounded-2xl">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 flex items-center justify-center bg-white rounded-lg border border-slate-100 text-[10px] font-black text-emerald-600">
                          {item.quantity}
                        </span>
                        <span className="text-sm font-bold text-slate-700">{item.name}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action */}
                <button 
                  onClick={() => onComplete(order.id)}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2 group/btn active:scale-95"
                >
                  Mark as Done
                  <i className="fas fa-check text-xs group-hover/btn:scale-125 transition-transform"></i>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueView;
