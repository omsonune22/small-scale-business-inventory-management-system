import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Truck, 
  FileText, 
  Calendar, 
  IndianRupee, 
  Layers,
  ShieldCheck
} from 'lucide-react';
import api from '../api/axios';

export default function NewPurchase() {
  const navigate = useNavigate();

  // Reference & General Form State
  const [suppliers, setSuppliers] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [invoiceReference, setInvoiceReference] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('PAID');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Dynamic Line Items State
  const [items, setItems] = useState([
    { product_id: '', quantity: 10, unit_cost: 0, subtotal: 0 }
  ]);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch Suppliers and Active Products on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [supRes, prodRes] = await Promise.all([
          api.get('/suppliers'),
          api.get('/products?limit=100')
        ]);

        if (supRes.data?.success && supRes.data?.suppliers?.length > 0) {
          setSuppliers(supRes.data.suppliers);
          setSupplierId(supRes.data.suppliers[0].supplier_id.toString());
        }

        if (prodRes.data?.success && prodRes.data?.products?.length > 0) {
          setCatalogProducts(prodRes.data.products);
          // Set first item's product_id
          const firstProd = prodRes.data.products[0];
          setItems([
            {
              product_id: firstProd.product_id.toString(),
              quantity: 10,
              unit_cost: firstProd.cost_price || 0,
              subtotal: (firstProd.cost_price || 0) * 10
            }
          ]);
        }
      } catch (err) {
        console.warn('[NEW PURCHASE]: Offline demo mode loaded.');
        setSuppliers([
          { supplier_id: 1, company_name: 'Apex FMCG Distributors' },
          { supplier_id: 2, company_name: 'Sunrise Dairy Co.' },
          { supplier_id: 3, company_name: 'Global Refreshments Ltd.' },
        ]);
        setSupplierId('1');
        setCatalogProducts([
          { product_id: 1, sku: 'BEV-COLA-500', name: 'Sparkling Classic Cola 500ml', cost_price: 0.75 },
          { product_id: 2, sku: 'BEV-OJ-1L', name: '100% Pure Orange Juice 1L', cost_price: 1.80 },
          { product_id: 3, sku: 'SNK-CHIP-BBQ', name: 'Smoked BBQ Kettle Potato Chips 150g', cost_price: 1.10 },
          { product_id: 4, sku: 'SNK-COOK-OAT', name: 'Oatmeal Raisin Baked Cookies 200g', cost_price: 1.50 },
          { product_id: 5, sku: 'PC-SOAP-ALOE', name: 'Moisturizing Aloe Vera Bar Soap 125g', cost_price: 0.90 },
        ]);
        setItems([
          { product_id: '1', quantity: 20, unit_cost: 0.75, subtotal: 15.00 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle Line Item Product Change
  const handleProductChange = (index, prodId) => {
    const selected = catalogProducts.find(p => p.product_id.toString() === prodId.toString());
    const cost = selected ? Number(selected.cost_price) : 0;
    const qty = items[index].quantity || 1;

    const updated = [...items];
    updated[index] = {
      ...updated[index],
      product_id: prodId,
      unit_cost: cost,
      subtotal: Number((qty * cost).toFixed(2))
    };
    setItems(updated);
  };

  // Handle Line Item Quantity Change
  const handleQuantityChange = (index, value) => {
    const qty = Math.max(1, parseInt(value, 10) || 1);
    const updated = [...items];
    const cost = updated[index].unit_cost || 0;
    updated[index].quantity = qty;
    updated[index].subtotal = Number((qty * cost).toFixed(2));
    setItems(updated);
  };

  // Handle Line Item Unit Cost Change
  const handleCostChange = (index, value) => {
    const cost = Math.max(0, parseFloat(value) || 0);
    const updated = [...items];
    const qty = updated[index].quantity || 1;
    updated[index].unit_cost = cost;
    updated[index].subtotal = Number((qty * cost).toFixed(2));
    setItems(updated);
  };

  // Add New Line Item
  const handleAddLine = () => {
    const defaultProd = catalogProducts[0];
    const newProdId = defaultProd ? defaultProd.product_id.toString() : '';
    const newCost = defaultProd ? Number(defaultProd.cost_price) : 0;

    setItems([
      ...items,
      {
        product_id: newProdId,
        quantity: 10,
        unit_cost: newCost,
        subtotal: Number((10 * newCost).toFixed(2))
      }
    ]);
  };

  // Remove Line Item
  const handleRemoveLine = (index) => {
    if (items.length === 1) {
      alert('A purchase order must contain at least one line item.');
      return;
    }
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Calculate Grand Totals
  const grandTotal = items.reduce((acc, it) => acc + (it.subtotal || 0), 0);
  const totalUnits = items.reduce((acc, it) => acc + (parseInt(it.quantity, 10) || 0), 0);

  // Submit Handler: Triggers ACID Transaction on Server
  const handleSubmitPurchase = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!supplierId) {
      setErrorMessage('Please select a supplier.');
      return;
    }
    if (!invoiceReference.trim()) {
      setErrorMessage('Please enter a supplier invoice reference number.');
      return;
    }
    if (items.some(it => !it.product_id || it.quantity <= 0)) {
      setErrorMessage('All line items must have a selected product and quantity greater than zero.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        supplier_id: parseInt(supplierId, 10),
        invoice_reference: invoiceReference.trim(),
        payment_status: paymentStatus,
        purchase_date: purchaseDate,
        notes,
        items: items.map(it => ({
          product_id: parseInt(it.product_id, 10),
          quantity: parseInt(it.quantity, 10),
          unit_cost: parseFloat(it.unit_cost)
        }))
      };

      const res = await api.post('/purchases', payload);

      if (res.data?.success) {
        setSuccessMessage(`Purchase '${invoiceReference}' received! Inventory & Stock Ledger updated atomically.`);
        setTimeout(() => {
          navigate('/purchases');
        }, 1800);
      } else {
        setErrorMessage(res.data?.message || 'Failed to process purchase.');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* 1. Header with Back Button */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/purchases')}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Back to Purchases"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <ShoppingBag className="text-indigo-400" size={24} />
              Stock Inward: New Purchase Order
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Receive inventory, update cost averages, and record double-entry audit ledger.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
          <ShieldCheck size={14} />
          <span>ACID Row-Locking Enforced</span>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs animate-fadeIn">
          <CheckCircle size={17} className="text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs animate-shake">
          <AlertCircle size={17} className="text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmitPurchase} className="space-y-6">
        {/* 2. PO Metadata Box */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <FileText size={15} className="text-indigo-400" />
            General Procurement Metadata
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Supplier Select */}
            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Supplier / Vendor <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {suppliers.map((s) => (
                  <option key={s.supplier_id} value={s.supplier_id}>
                    {s.company_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Invoice Reference */}
            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Supplier Invoice Reference # <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. INV-APEX-9921"
                value={invoiceReference}
                onChange={(e) => setInvoiceReference(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Purchase Date */}
            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Intake Date
              </label>
              <input
                type="date"
                required
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* 3. Dynamic Line Items Builder Table */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl space-y-4 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers size={16} className="text-indigo-400" />
                Line Items Received
              </h2>
              <p className="text-[11px] text-slate-400">Specify inventory units and unit cost basis.</p>
            </div>

            <button
              type="button"
              onClick={handleAddLine}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition"
            >
              <Plus size={14} />
              <span>+ Add Line Item</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 w-5/12">Product Catalog Item</th>
                  <th className="py-2.5 px-3 text-center w-2/12">Quantity</th>
                  <th className="py-2.5 px-3 text-right w-2/12">Unit Cost (₹)</th>
                  <th className="py-2.5 px-3 text-right w-2/12">Subtotal (₹)</th>
                  <th className="py-2.5 px-3 text-center w-1/12">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {items.map((line, index) => (
                  <tr key={index} className="hover:bg-slate-800/20 transition">
                    {/* Product Select */}
                    <td className="py-3 px-3">
                      <select
                        value={line.product_id}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        {catalogProducts.map((p) => (
                          <option key={p.product_id} value={p.product_id}>
                            [{p.sku}] {p.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Quantity Input */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        min="1"
                        required
                        value={line.quantity}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        className="w-24 mx-auto text-center bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-slate-100 font-mono font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </td>

                    {/* Unit Cost Input */}
                    <td className="py-3 px-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={line.unit_cost}
                        onChange={(e) => handleCostChange(index, e.target.value)}
                        className="w-28 ml-auto text-right bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </td>

                    {/* Subtotal Display */}
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-emerald-400">
                      ₹{Number(line.subtotal).toFixed(2)}
                    </td>

                    {/* Remove Action */}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(index)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Remove line"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Footer Summary & Submit Button */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-6 text-xs">
            <div>
              <p className="text-slate-400">Total Line Items</p>
              <p className="text-base font-extrabold text-slate-200 mt-0.5">{items.length}</p>
            </div>
            <div>
              <p className="text-slate-400">Total Physical Units</p>
              <p className="text-base font-extrabold text-indigo-400 mt-0.5">{totalUnits} units</p>
            </div>
            <div>
              <p className="text-slate-400">Calculated Total Cost</p>
              <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                ₹{grandTotal.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/purchases')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
            >
              {isSubmitting ? (
                <span>Executing ACID Transaction...</span>
              ) : (
                <>
                  <CheckCircle size={16} />
                  <span>Receive & Update Stock</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
