import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, 
  Plus, 
  Search, 
  Edit3, 
  Phone, 
  Mail, 
  MapPin, 
  ShoppingBag, 
  X, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Suppliers() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: ''
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/suppliers');
      if (res.data?.success && res.data?.suppliers) {
        setSuppliers(res.data.suppliers);
      }
    } catch (err) {
      console.warn('[SUPPLIERS]: Backend error, using fallback suppliers.');
      setSuppliers([
        { supplier_id: 1, company_name: 'Apex FMCG Distributors', contact_person: 'Robert Vance', phone: '+1 (555) 234-5678', email: 'orders@apexfmcg.com', address: '104 Industrial Parkway, Sector 4', total_purchases: 5 },
        { supplier_id: 2, company_name: 'Sunrise Dairy Co.', contact_person: 'Elena Rostova', phone: '+1 (555) 876-5432', email: 'supply@sunrisedairy.com', address: '42 Green Valley Rd, Farm Zone', total_purchases: 3 },
        { supplier_id: 3, company_name: 'Global Refreshments Ltd.', contact_person: 'Marcus Sterling', phone: '+1 (555) 345-6789', email: 'contact@globalrefresh.com', address: '88 Harbor Boulevard, Port District', total_purchases: 2 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({ company_name: '', contact_person: '', phone: '', email: '', address: '' });
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEdit = (s) => {
    setEditingSupplier(s);
    setFormData({
      company_name: s.company_name || '',
      contact_person: s.contact_person || '',
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || ''
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      if (editingSupplier) {
        await api.put(`/suppliers/${editingSupplier.supplier_id}`, formData);
        showToast(`Supplier '${formData.company_name}' updated.`);
      } else {
        await api.post('/suppliers', formData);
        showToast(`Supplier '${formData.company_name}' registered.`);
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filtered = suppliers.filter(s => {
    const q = searchTerm.toLowerCase();
    return s.company_name.toLowerCase().includes(q) ||
           (s.contact_person && s.contact_person.toLowerCase().includes(q)) ||
           (s.email && s.email.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs shadow-2xl backdrop-blur-md animate-fadeIn">
          <CheckCircle size={17} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Truck className="text-indigo-400" size={24} />
            Supplier Directory & Vendor Accounts
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage commercial distributor relationships, procurement contacts, and purchase histories.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchSuppliers}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Refresh Suppliers"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>

          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/25 transition"
            >
              <Plus size={16} />
              <span>+ Add Supplier</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Search Bar */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search suppliers by name, contact person, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
        />
      </div>

      {/* 3. Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <Truck size={32} className="mx-auto mb-2 opacity-50" />
            <p className="font-semibold text-slate-300">No suppliers found.</p>
            <p className="text-[11px] text-slate-500 mt-1">Try adjusting your search keyword.</p>
          </div>
        ) : (
          filtered.map((s) => (
            <div 
              key={s.supplier_id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4 shadow-lg shadow-black/20"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <h2 className="text-base font-bold text-white tracking-tight">{s.company_name}</h2>
                    <p className="text-xs text-indigo-400 font-medium">Rep: {s.contact_person || 'General Sales'}</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition"
                      title="Edit Supplier"
                    >
                      <Edit3 size={15} />
                    </button>
                  )}
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                  <p className="flex items-center gap-2.5 truncate">
                    <Phone size={14} className="text-slate-500 shrink-0" />
                    <span className="text-slate-300 font-mono">{s.phone || 'N/A'}</span>
                  </p>
                  <p className="flex items-center gap-2.5 truncate">
                    <Mail size={14} className="text-slate-500 shrink-0" />
                    <span className="text-slate-300 font-mono">{s.email || 'N/A'}</span>
                  </p>
                  <p className="flex items-center gap-2.5 truncate">
                    <MapPin size={14} className="text-slate-500 shrink-0" />
                    <span className="text-slate-300 truncate">{s.address || 'Address on file'}</span>
                  </p>
                </div>
              </div>

              {/* Action: View Purchase History */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 font-medium">
                  {s.total_purchases || 0} Purchase Orders
                </span>
                <button
                  onClick={() => navigate(`/purchases?supplier_id=${s.supplier_id}`)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition"
                >
                  <ShoppingBag size={13} />
                  <span>View PO History</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. Modal to Create / Edit Supplier */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Truck size={18} className="text-indigo-400" />
                {editingSupplier ? 'Update Supplier Profile' : 'Register New Vendor / Supplier'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Company Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex FMCG Distributors"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g. Robert Vance"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 234-5678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="orders@vendor.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Facility / Warehouse Address</label>
                <textarea
                  rows="2"
                  placeholder="104 Industrial Parkway, Sector 4..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? 'Saving...' : editingSupplier ? 'Save Changes' : 'Create Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
