import React, { useState } from 'react';
import { ShoppingCart, Search, CreditCard, Banknote, ShieldAlert, Check } from 'lucide-react';

export default function PosSalesPage() {
  const [cart, setCart] = useState([
    { id: 1, name: 'Sparkling Classic Cola 500ml', price: 1.50, qty: 2 },
    { id: 3, name: 'Smoked BBQ Kettle Potato Chips 150g', price: 2.40, qty: 1 }
  ]);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  return (
    <div className="h-[calc(100vh-7.5rem)] flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
      {/* Product Selection Column */}
      <div className="flex-1 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="text-indigo-400" size={22} />
            Point of Sale (POS) Billing
          </h2>
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Row-Locking Active
          </span>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Scan barcode or type product name/SKU..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Tap Catalog</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { id: 1, name: 'Classic Cola', price: '₹1.50', stock: 60 },
              { id: 2, name: 'Orange Juice 1L', price: '₹3.25', stock: 30 },
              { id: 3, name: 'BBQ Chips 150g', price: '₹2.40', stock: 45 },
              { id: 4, name: 'Oat Cookies 200g', price: '₹3.00', stock: 25 },
              { id: 5, name: 'Aloe Bar Soap', price: '₹2.00', stock: 40 },
            ].map((item) => (
              <div 
                key={item.id}
                className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-indigo-500/60 cursor-pointer transition flex flex-col justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{item.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{item.stock} in stock</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">{item.price}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-600/30 text-indigo-300 font-semibold">+ Add</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart & Billing Checkout Column */}
      <div className="w-full lg:w-96 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Current Cart</h3>
            <span className="text-xs text-slate-400">{cart.length} line items</span>
          </div>

          <div className="divide-y divide-slate-800/80 my-3 max-h-60 overflow-y-auto">
            {cart.map((c) => (
              <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-200">{c.name}</p>
                  <p className="text-[11px] text-slate-400">₹{c.price.toFixed(2)} x {c.qty}</p>
                </div>
                <span className="font-bold text-slate-200">₹{(c.price * c.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 pt-3 border-t border-slate-800">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Subtotal</span>
            <span className="text-slate-200 font-medium">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Estimated Tax (5%)</span>
            <span className="text-slate-200 font-medium">₹{tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
            <span>Total Payable</span>
            <span className="text-emerald-400 font-extrabold text-base">₹{total.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition">
              <Banknote size={15} /> Cash
            </button>
            <button className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition">
              <CreditCard size={15} /> Card / UPI
            </button>
          </div>

          <button className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition">
            Complete Checkout & Print Bill
          </button>
        </div>
      </div>
    </div>
  );
}
