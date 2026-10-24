import React from 'react';
import { Package, Plus, Search, Filter, AlertCircle } from 'lucide-react';

export default function ProductsPage() {
  const seedProducts = [
    { sku: 'BEV-COLA-500', name: 'Sparkling Classic Cola 500ml', category: 'Beverages', cost: '₹0.75', price: '₹1.50', stock: 60, min: 15 },
    { sku: 'BEV-OJ-1L', name: '100% Pure Orange Juice 1L', category: 'Beverages', cost: '₹1.80', price: '₹3.25', stock: 30, min: 10 },
    { sku: 'SNK-CHIP-BBQ', name: 'Smoked BBQ Kettle Potato Chips 150g', category: 'Packaged Foods', cost: '₹1.10', price: '₹2.40', stock: 45, min: 12 },
    { sku: 'SNK-COOK-OAT', name: 'Oatmeal Raisin Baked Cookies 200g', category: 'Packaged Foods', cost: '₹1.50', price: '₹3.00', stock: 25, min: 8 },
    { sku: 'PC-SOAP-ALOE', name: 'Moisturizing Aloe Vera Bar Soap 125g', category: 'Personal Care', cost: '₹0.90', price: '₹2.00', stock: 40, min: 10 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="text-indigo-400" size={22} />
            Products & Inventory Catalog
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage SKU tracking, cost basis, selling prices, and minimum stock alerts.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition self-start sm:self-auto">
          <Plus size={16} /> Add New Product
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by SKU, product name, or barcode..."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center gap-1.5 hover:bg-slate-800 transition">
            <Filter size={14} /> All Categories
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/60 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">SKU</th>
              <th className="py-3 px-4">Product Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 text-right">Cost Price</th>
              <th className="py-3 px-4 text-right">Selling Price</th>
              <th className="py-3 px-4 text-center">Current Stock</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {seedProducts.map((p, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30 transition">
                <td className="py-3.5 px-4 font-mono text-indigo-300 font-medium">{p.sku}</td>
                <td className="py-3.5 px-4 font-medium">{p.name}</td>
                <td className="py-3.5 px-4 text-slate-400">{p.category}</td>
                <td className="py-3.5 px-4 text-right text-slate-400">{p.cost}</td>
                <td className="py-3.5 px-4 text-right font-semibold text-emerald-400">{p.price}</td>
                <td className="py-3.5 px-4 text-center font-bold">{p.stock}</td>
                <td className="py-3.5 px-4 text-center">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    In Stock
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
