import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  CheckCircle, 
  AlertCircle,
  Percent,
  Layers,
  IndianRupee,
  Boxes,
  RefreshCw
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Products() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === 'ADMIN';

  // Catalog State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockStatus, setStockStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 8;

  // Modals State
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [notification, setNotification] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category_id: '',
    cost_price: '',
    selling_price: '',
    current_stock: '0',
    min_stock_threshold: '5'
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Add Category Modal inside Product Form
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // 1. Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 on new search
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // 2. Fetch Categories
  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.data?.success && res.data?.categories) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.warn('[PRODUCTS]: Could not fetch categories from server.');
      setCategories([
        { category_id: 1, name: 'Beverages' },
        { category_id: 2, name: 'Packaged Foods' },
        { category_id: 3, name: 'Personal Care' },
      ]);
    }
  };

  // 3. Fetch Products with Filters & Pagination
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: debouncedSearch,
        category_id: selectedCategory,
        stock_status: stockStatus
      });

      const res = await api.get(`/products?${params.toString()}`);
      if (res.data?.success) {
        setProducts(res.data.products || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.totalCount || 0);
      }
    } catch (err) {
      console.warn('[PRODUCTS]: Database offline. Using seed catalog fallback.');
      setProducts([
        { product_id: 1, category_id: 1, category_name: 'Beverages', sku: 'BEV-COLA-500', name: 'Sparkling Classic Cola 500ml', cost_price: 0.75, selling_price: 1.50, current_stock: 60, min_stock_threshold: 15 },
        { product_id: 2, category_id: 1, category_name: 'Beverages', sku: 'BEV-OJ-1L', name: '100% Pure Orange Juice 1L', cost_price: 1.80, selling_price: 3.25, current_stock: 9, min_stock_threshold: 10 },
        { product_id: 3, category_id: 2, category_name: 'Packaged Foods', sku: 'SNK-CHIP-BBQ', name: 'Smoked BBQ Kettle Potato Chips 150g', cost_price: 1.10, selling_price: 2.40, current_stock: 45, min_stock_threshold: 12 },
        { product_id: 4, category_id: 2, category_name: 'Packaged Foods', sku: 'SNK-COOK-OAT', name: 'Oatmeal Raisin Baked Cookies 200g', cost_price: 1.50, selling_price: 3.00, current_stock: 6, min_stock_threshold: 8 },
        { product_id: 5, category_id: 3, category_name: 'Personal Care', sku: 'PC-SOAP-ALOE', name: 'Moisturizing Aloe Vera Bar Soap 125g', cost_price: 0.90, selling_price: 2.00, current_stock: 0, min_stock_threshold: 10 },
      ]);
      setTotalPages(1);
      setTotalCount(5);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, debouncedSearch, selectedCategory, stockStatus]);

  // Open Modal for Add
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      sku: '',
      name: '',
      category_id: categories[0]?.category_id?.toString() || '1',
      cost_price: '',
      selling_price: '',
      current_stock: '10',
      min_stock_threshold: '5'
    });
    setFormError('');
    setShowAddEditModal(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setFormData({
      sku: p.sku,
      name: p.name,
      category_id: p.category_id?.toString() || '',
      cost_price: p.cost_price?.toString() || '',
      selling_price: p.selling_price?.toString() || '',
      current_stock: p.current_stock?.toString() || '0',
      min_stock_threshold: p.min_stock_threshold?.toString() || '5'
    });
    setFormError('');
    setShowAddEditModal(true);
  };

  // Inline Margin Calculation
  const costNum = parseFloat(formData.cost_price) || 0;
  const sellingNum = parseFloat(formData.selling_price) || 0;
  const profitNum = sellingNum - costNum;
  const marginPercent = sellingNum > 0 ? ((profitNum / sellingNum) * 100).toFixed(1) : '0.0';

  // Submit Handler for Add / Edit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      if (editingProduct) {
        // Update product
        await api.put(`/products/${editingProduct.product_id}`, {
          name: formData.name,
          category_id: parseInt(formData.category_id, 10),
          cost_price: parseFloat(formData.cost_price),
          selling_price: parseFloat(formData.selling_price),
          min_stock_threshold: parseInt(formData.min_stock_threshold, 10)
        });
        showToast(`Product '${formData.name}' updated successfully.`);
      } else {
        // Create product
        await api.post('/products', {
          sku: formData.sku,
          name: formData.name,
          category_id: parseInt(formData.category_id, 10),
          cost_price: parseFloat(formData.cost_price),
          selling_price: parseFloat(formData.selling_price),
          current_stock: parseInt(formData.current_stock, 10),
          min_stock_threshold: parseInt(formData.min_stock_threshold, 10)
        });
        showToast(`Product '${formData.name}' created successfully with audit ledger entry.`);
      }

      setShowAddEditModal(false);
      fetchProducts();
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Soft Delete Handler
  const confirmSoftDelete = async () => {
    if (!deletingProduct) return;
    try {
      await api.delete(`/products/${deletingProduct.product_id}`);
      showToast(`Product '${deletingProduct.name}' archived.`);
      setShowDeleteModal(false);
      setDeletingProduct(null);
      fetchProducts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to archive product.');
      setShowDeleteModal(false);
    }
  };

  // Quick Add Category
  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const res = await api.post('/categories', { name: newCatName.trim() });
      if (res.data?.success && res.data?.category) {
        setCategories(prev => [...prev, res.data.category]);
        setFormData(prev => ({ ...prev, category_id: res.data.category.category_id.toString() }));
        setNewCatName('');
        setShowNewCatInput(false);
        showToast(`Category '${res.data.category.name}' created.`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating category');
    }
  };

  const showToast = (msg) => {
    toast.success(msg);
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs shadow-2xl backdrop-blur-md animate-fadeIn">
          <CheckCircle size={17} className="text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* 1. Header & Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Package className="text-indigo-400" size={24} />
            Product Catalog & Inventory
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage SKU specifications, category assignments, profit margins, and inventory safety thresholds.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/25 transition self-start md:self-auto"
          >
            <Plus size={16} />
            <span>+ Add Product</span>
          </button>
        )}
      </div>

      {/* 2. Search & Filtering Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search Input (Debounced) */}
        <div className="sm:col-span-6 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by SKU, barcode, or product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>

        {/* Category Dropdown */}
        <div className="sm:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.name} {c.product_count !== undefined ? `(${c.product_count})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Filter Dropdown */}
        <div className="sm:col-span-3">
          <select
            value={stockStatus}
            onChange={(e) => {
              setStockStatus(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Stock Statuses</option>
            <option value="low">Low Stock (≤ Threshold)</option>
            <option value="out">Out of Stock (0 Units)</option>
          </select>
        </div>
      </div>

      {/* 3. Products Data Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/60 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">SKU</th>
              <th className="py-3 px-4">Product Name</th>
              <th className="py-3 px-4">Category</th>
              {isAdmin && <th className="py-3 px-4 text-right">Cost Price</th>}
              <th className="py-3 px-4 text-right">Selling Price</th>
              <th className="py-3 px-4 text-center">Stock Level</th>
              {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td colSpan={isAdmin ? 7 : 5} className="py-3.5 px-4">
                    <div className="h-6 bg-slate-800/50 rounded-lg animate-pulse" />
                  </td>
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 5} className="py-12 text-center text-slate-400">
                  <Package size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="font-semibold text-slate-300">No products match your search or filters.</p>
                  <p className="text-[11px] text-slate-500 mt-1">Try resetting the search keyword or selecting "All Categories".</p>
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const stock = Number(p.current_stock);
                const min = Number(p.min_stock_threshold);

                // Stock Badge Rules: Green > 20, Yellow 1-19, Red = 0
                let stockBadgeClass = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
                let stockLabel = `${stock} in stock`;

                if (stock === 0) {
                  stockBadgeClass = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
                  stockLabel = 'Out of Stock (0)';
                } else if (stock <= 19) {
                  stockBadgeClass = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
                  stockLabel = stock <= min ? `${stock} (Low Alert)` : `${stock} units`;
                }

                return (
                  <tr key={p.product_id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-mono font-semibold text-indigo-300">
                      {p.sku}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-100">
                      {p.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {p.category_name || 'Uncategorized'}
                    </td>
                    {isAdmin && (
                      <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                        ₹{Number(p.cost_price).toFixed(2)}
                      </td>
                    )}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      ₹{Number(p.selling_price).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${stockBadgeClass}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {stockLabel}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition"
                            title="Edit Product"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingProduct(p);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Soft Delete Product"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="p-3.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="text-slate-200 font-semibold">{products.length}</span> of <span className="text-slate-200 font-semibold">{totalCount}</span> products
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition"
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-semibold text-slate-300 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition"
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Modal Form (Add / Edit Product with Inline Margin Calculation) */}
      {showAddEditModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Package size={18} className="text-indigo-400" />
                {editingProduct ? 'Edit Product Specifications' : 'Register New Inventory Product'}
              </h3>
              <button
                onClick={() => setShowAddEditModal(false)}
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

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {/* SKU & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    SKU Code {!editingProduct && <span className="text-rose-400">*</span>}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingProduct)}
                    placeholder="e.g. BEV-COLA-500"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono disabled:opacity-50 focus:outline-none focus:border-indigo-500"
                  />
                  {editingProduct && <p className="text-[10px] text-slate-500 mt-0.5">SKU code cannot be altered</p>}
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Product Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sparkling Classic Cola 500ml"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Category Select + Quick Add */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-300">
                    Category <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewCatInput(!showNewCatInput)}
                    className="text-indigo-400 hover:text-indigo-300 text-[11px] font-semibold"
                  >
                    {showNewCatInput ? 'Cancel' : '+ New Category'}
                  </button>
                </div>

                {showNewCatInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="New category name..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select a Category</option>
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Cost Price & Selling Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Cost Price (₹) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.75"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Selling Price (₹) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="1.50"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Inline Margin Calculation Card */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Percent size={16} className="text-indigo-400" />
                  <div>
                    <span className="font-semibold text-slate-300 block text-[11px]">Calculated Margin</span>
                    <span className="text-[10px] text-slate-500">
                      Profit per unit: <b className="text-slate-300">₹{profitNum.toFixed(2)}</b>
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-base font-extrabold font-mono ${
                    parseFloat(marginPercent) >= 25
                      ? 'text-emerald-400'
                      : parseFloat(marginPercent) > 0
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}>
                    {marginPercent}%
                  </span>
                  <p className="text-[10px] text-slate-500">Gross Margin</p>
                </div>
              </div>

              {/* Initial Stock (Only for Add) & Minimum Threshold */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {!editingProduct && (
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">
                      Initial Stock Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="10"
                      value={formData.current_stock}
                      onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-0.5">Generates audit ledger entry</p>
                  </div>
                )}

                <div className={editingProduct ? 'sm:col-span-2' : ''}>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Min Stock Alert Threshold
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="5"
                    value={formData.min_stock_threshold}
                    onChange={(e) => setFormData({ ...formData, min_stock_threshold: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">Triggers amber dashboard alert when stock drops below this</p>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? 'Saving...' : editingProduct ? 'Save Updates' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Confirmation Modal (Soft Delete Warning) */}
      {showDeleteModal && deletingProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-white">
                Archive Product "{deletingProduct.name}"?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This will perform a <span className="text-amber-400 font-semibold">soft delete</span> by setting <code className="text-indigo-300 font-mono">is_active = FALSE</code>.
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 text-left space-y-1">
                <p className="text-emerald-400 font-semibold">Protected Relational Invariants:</p>
                <p>• Historical sale records and invoices remain 100% intact.</p>
                <p>• Stock transactions ledger history is preserved.</p>
                <p>• Product will be removed from POS checkout suggestions.</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingProduct(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSoftDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30"
              >
                Confirm Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
