import React from 'react';
import { ShoppingBag, Plus, Calendar, FileText } from 'lucide-react';

export default function PurchasesPage() {
  const purchases = [
    { id: 'PO-2026-001', supplier: 'Apex FMCG Distributors', ref: 'INV-7842', total: '₹850.00', status: 'PAID', date: '2026-10-21' },
    { id: 'PO-2026-002', supplier: 'Sunrise Dairy Co.', ref: 'INV-9021', total: '₹420.50', status: 'PAID', date: '2026-10-22' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="text-indigo-400" size={22} />
            Purchases & Supplier Intake
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Log inventory restocks from vendors and update cost averages with ACID guarantees.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition self-start sm:self-auto">
          <Plus size={16} /> New Purchase Order
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/60 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">PO Reference</th>
              <th className="py-3 px-4">Supplier</th>
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Total Amount</th>
              <th className="py-3 px-4 text-center">Payment Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {purchases.map((p, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30 transition">
                <td className="py-3.5 px-4 font-mono text-indigo-300 font-medium">{p.id}</td>
                <td className="py-3.5 px-4 font-medium">{p.supplier}</td>
                <td className="py-3.5 px-4 text-slate-400">{p.ref}</td>
                <td className="py-3.5 px-4 text-slate-400">{p.date}</td>
                <td className="py-3.5 px-4 text-right font-bold text-slate-100">{p.total}</td>
                <td className="py-3.5 px-4 text-center">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {p.status}
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
