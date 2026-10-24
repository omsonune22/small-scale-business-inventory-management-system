import React from 'react';
import { Truck, Plus, Mail, Phone, MapPin } from 'lucide-react';

export default function SuppliersPage() {
  const suppliers = [
    { name: 'Apex FMCG Distributors', contact: 'Robert Vance', phone: '+1 (555) 234-5678', email: 'orders@apexfmcg.com', address: '104 Industrial Parkway' },
    { name: 'Sunrise Dairy Co.', contact: 'Elena Rostova', phone: '+1 (555) 876-5432', email: 'supply@sunrisedairy.com', address: '42 Green Valley Rd' },
    { name: 'Global Refreshments Ltd.', contact: 'Marcus Sterling', phone: '+1 (555) 345-6789', email: 'contact@globalrefresh.com', address: '88 Harbor Boulevard' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="text-indigo-400" size={22} />
            Suppliers & Vendors Directory
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage commercial relationships, procurement contracts, and supplier contacts.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition self-start sm:self-auto">
          <Plus size={16} /> Add Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {suppliers.map((s, idx) => (
          <div key={idx} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 hover:border-slate-700 transition">
            <h3 className="text-sm font-bold text-white">{s.name}</h3>
            <p className="text-xs text-slate-300 font-medium">Contact: {s.contact}</p>
            <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <p className="flex items-center gap-2"><Phone size={13} className="text-indigo-400" /> {s.phone}</p>
              <p className="flex items-center gap-2"><Mail size={13} className="text-indigo-400" /> {s.email}</p>
              <p className="flex items-center gap-2"><MapPin size={13} className="text-indigo-400" /> {s.address}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
