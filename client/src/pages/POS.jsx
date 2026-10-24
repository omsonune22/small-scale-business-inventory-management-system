import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Barcode, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Plus, 
  Minus, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  ShieldCheck, 
  Tag, 
  Percent, 
  Package, 
  User,
  Zap,
  RotateCcw
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ReceiptModal from '../components/ReceiptModal';
import ConfirmModal from '../components/ConfirmModal';

export default function POS() {
  const { user } = useAuth();
  const toast = useToast();
  const searchInputRef = useRef(null);

  // Catalog & Category State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Cart State
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // CASH | CARD | UPI
  const [discountAmount, setDiscountAmount] = useState('');

  // Checkout State
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [completedSale, setCompletedSale] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);

  // Fetch Catalog & Categories
  const fetchPOSData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products?limit=100'),
        api.get('/categories')
      ]);

      if (prodRes.data?.success) {
        setProducts(prodRes.data.products || []);
      }
      if (catRes.data?.success) {
        setCategories(catRes.data.categories || []);
      }
    } catch (err) {
      console.warn('[POS]: Offline fallback products loaded.');
      setProducts([
        { product_id: 1, category_id: 1, sku: 'BEV-COLA-500', name: 'Sparkling Classic Cola 500ml', cost_price: 0.75, selling_price: 1.50, current_stock: 60 },
        { product_id: 2, category_id: 1, sku: 'BEV-OJ-1L', name: '100% Pure Orange Juice 1L', cost_price: 1.80, selling_price: 3.25, current_stock: 30 },
        { product_id: 3, category_id: 2, sku: 'SNK-CHIP-BBQ', name: 'Smoked BBQ Kettle Potato Chips 150g', cost_price: 1.10, selling_price: 2.40, current_stock: 45 },
        { product_id: 4, category_id: 2, sku: 'SNK-COOK-OAT', name: 'Oatmeal Raisin Baked Cookies 200g', cost_price: 1.50, selling_price: 3.00, current_stock: 25 },
        { product_id: 5, category_id: 3, sku: 'PC-SOAP-ALOE', name: 'Moisturizing Aloe Vera Bar Soap 125g', cost_price: 0.90, selling_price: 2.00, current_stock: 0 },
      ]);
      setCategories([
        { category_id: 1, name: 'Beverages' },
        { category_id: 2, name: 'Packaged Foods' },
        { category_id: 3, name: 'Personal Care' },
      ]);
    } finally {
      setLoading(false);
      // Autofocus search on load
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  useEffect(() => {
    fetchPOSData();
  }, []);

  // Keyboard shortcut listener: F9 to trigger checkout
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F9') {
        e.preventDefault();
        handleCheckout();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, customerName, paymentMethod, discountAmount]);

  // Handle USB Barcode Scanner Input on Enter key
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = searchTerm.trim().toLowerCase();
      if (!query) return;

      // Look for exact SKU or name match
      const matched = products.find(
        p => p.sku.toLowerCase() === query || p.name.toLowerCase() === query
      );

      if (matched) {
        if (matched.current_stock > 0) {
          addToCart(matched);
          setSearchTerm('');
        } else {
          setCheckoutError(`Product "${matched.name}" is out of stock (0 units).`);
          setTimeout(() => setCheckoutError(''), 4000);
        }
      }
    }
  };

  // Add product to cart
  const addToCart = (product) => {
    setCheckoutError('');
    if (product.current_stock <= 0) return;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(item => item.product_id === product.product_id);
      if (existingIndex > -1) {
        const existing = prevCart[existingIndex];
        if (existing.quantity >= product.current_stock) {
          setCheckoutError(`Cannot add more. Reached max available stock (${product.current_stock}) for ${product.name}`);
          setTimeout(() => setCheckoutError(''), 4000);
          return prevCart;
        }
        const updated = [...prevCart];
        const newQty = existing.quantity + 1;
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          subtotal: Number((newQty * existing.unit_price).toFixed(2))
        };
        toast.success(`Updated ${product.name} quantity to ${newQty}`);
        return updated;
      } else {
        const unitPrice = parseFloat(product.selling_price) || 0;
        toast.success(`Added ${product.name} to cart`);
        return [
          ...prevCart,
          {
            product_id: product.product_id,
            sku: product.sku,
            name: product.name,
            unit_price: unitPrice,
            quantity: 1,
            max_stock: product.current_stock,
            subtotal: unitPrice
          }
        ];
      }
    });
  };

  // Increment item quantity in cart
  const incrementQuantity = (productId) => {
    setCheckoutError('');
    setCart((prev) =>
      prev.map((item) => {
        if (item.product_id === productId) {
          if (item.quantity >= item.max_stock) {
            setCheckoutError(`Maximum available stock reached (${item.max_stock}) for ${item.name}`);
            toast.warning(`Maximum available stock reached (${item.max_stock})`);
            setTimeout(() => setCheckoutError(''), 3000);
            return item;
          }
          const newQty = item.quantity + 1;
          return {
            ...item,
            quantity: newQty,
            subtotal: Number((newQty * item.unit_price).toFixed(2))
          };
        }
        return item;
      })
    );
  };

  // Decrement item quantity in cart
  const decrementQuantity = (productId) => {
    setCheckoutError('');
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product_id === productId) {
            const newQty = item.quantity - 1;
            if (newQty <= 0) {
              toast.info(`Removed ${item.name} from cart`);
              return null;
            }
            return {
              ...item,
              quantity: newQty,
              subtotal: Number((newQty * item.unit_price).toFixed(2))
            };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  // Remove item completely from cart
  const removeFromCart = (productId) => {
    const item = cart.find(i => i.product_id === productId);
    if (item) toast.info(`Removed ${item.name} from cart`);
    setCart((prev) => prev.filter(item => item.product_id !== productId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setDiscountAmount('');
    setCheckoutError('');
    setShowClearModal(false);
    toast.info('Active register cart cleared');
    searchInputRef.current?.focus();
  };

  // Financial Calculations
  const subtotal = cart.reduce((acc, it) => acc + (it.subtotal || 0), 0);
  const taxRate = 0.05; // 5% GST
  const taxAmount = Number((subtotal * taxRate).toFixed(2));
  const rawDiscount = parseFloat(discountAmount) || 0;
  const discount = Math.max(0, Math.min(subtotal + taxAmount, rawDiscount)); // Defensive: cannot exceed total
  const finalTotal = Math.max(0, Number((subtotal + taxAmount - discount).toFixed(2)));

  // Checkout Execution: Triggers ACID Transaction on Server
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setCheckoutError('Cannot checkout an empty cart. Please add products first.');
      toast.warning('Cart is empty. Add products to proceed with checkout.');
      return;
    }

    setIsCheckingOut(true);
    setCheckoutError('');

    try {
      const payload = {
        customer_name: customerName ? customerName.trim() : 'Walk-in Customer',
        payment_method: paymentMethod,
        discount_amount: discount,
        items: cart.map(it => ({
          product_id: it.product_id,
          name: it.name,
          quantity: Math.max(1, it.quantity),
          unit_price: Math.max(0, it.unit_price)
        }))
      };

      const res = await api.post('/sales', payload);

      if (res.data?.success && res.data?.sale) {
        setCompletedSale(res.data.sale);
        toast.success(`Sale completed successfully! Invoice #${res.data.sale.invoice_number}`);
        // Refresh catalog stock counts
        fetchPOSData();
      } else {
        setCheckoutError(res.data?.message || 'Checkout failed.');
        toast.error(res.data?.message || 'Checkout failed.');
      }
    } catch (err) {
      console.error('[POS CHECKOUT ERROR]:', err);
      const msg = err.response?.data?.message || err.message;
      setCheckoutError(msg);
      toast.error(msg);
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Start New Sale (Reset)
  const handleStartNewSale = () => {
    setCompletedSale(null);
    clearCart();
    setCustomerName('Walk-in Customer');
    setPaymentMethod('CASH');
    setTimeout(() => searchInputRef.current?.focus(), 150);
  };

  // Filter Catalog by category and search
  const filteredProducts = products.filter(p => {
    const matchesCat = !selectedCategory || p.category_id?.toString() === selectedCategory.toString();
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-[calc(100vh-6.5rem)] lg:h-[calc(100vh-6.5rem)] flex flex-col lg:flex-row gap-5 max-w-[1600px] mx-auto font-sans">
      {/* 1. LEFT PANE (60%): Catalog & Quick Tap Register */}
      <div className="flex-1 flex flex-col space-y-4 min-w-0 overflow-hidden">
        {/* Top Controls: Search Bar + Barcode Scanner input */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Scan barcode or type SKU/product name... [Enter to add]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-28 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-lg shadow-black/20"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-800 px-2 py-1 rounded-lg">
              <Barcode size={13} className="text-indigo-400" />
              <span>Barcode Ready</span>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === ''
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            All Items
          </button>
          {categories.map((c) => (
            <button
              key={c.category_id}
              onClick={() => setSelectedCategory(c.category_id.toString())}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === c.category_id.toString()
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Product Catalog Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-32 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 bg-slate-900/40 border border-slate-800/60 rounded-3xl">
              <Package size={36} className="mb-2 opacity-50 text-indigo-400" />
              <p className="font-semibold text-slate-300 text-sm">No catalog products match your search</p>
              <p className="text-xs text-slate-500 mt-1">Try another keyword or select "All Items".</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((p) => {
                const stock = Number(p.current_stock);
                const isOutOfStock = stock <= 0;

                return (
                  <div
                    key={p.product_id}
                    onClick={() => !isOutOfStock && addToCart(p)}
                    className={`p-3.5 rounded-2xl border transition flex flex-col justify-between group select-none relative ${
                      isOutOfStock
                        ? 'bg-slate-950/60 border-slate-800/40 opacity-40 cursor-not-allowed'
                        : 'bg-slate-900/90 border-slate-800 hover:border-indigo-500/70 hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer active:scale-[0.98]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="font-mono text-[10px] text-indigo-300 font-semibold truncate max-w-[110px]">
                          {p.sku}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold border ${
                            isOutOfStock
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              : stock <= (p.min_stock_threshold || 5)
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {isOutOfStock ? 'Out of stock' : `${stock} left`}
                        </span>
                      </div>

                      <h3 className="text-xs font-bold text-slate-100 line-clamp-2 leading-tight">
                        {p.name}
                      </h3>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="text-sm font-extrabold text-emerald-400 font-mono">
                        ₹{Number(p.selling_price).toFixed(2)}
                      </span>
                      {!isOutOfStock ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-600/20 text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white transition">
                          + Add
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-rose-400">
                          Unavailable
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. RIGHT PANE (40%): Cart, Customer Details, Calculations & Checkout */}
      <div className="w-full lg:w-[440px] rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between overflow-hidden shadow-2xl relative">
        {/* Cart Top Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-indigo-400" />
              <h2 className="text-sm font-bold text-white">Active Register Cart</h2>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setShowClearModal(true)}
                className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition"
                title="Empty Cart"
              >
                <RotateCcw size={12} />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Customer Name Input */}
          <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Customer Name (e.g. John Doe)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Error Alert Banner */}
        {checkoutError && (
          <div className="m-3 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-shake">
            <AlertCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-tight">{checkoutError}</span>
          </div>
        )}

        {/* Cart Line Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-800/60">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
              <ShoppingCart size={32} className="opacity-40 text-slate-600" />
              <p className="text-xs font-semibold text-slate-400">Cart is empty</p>
              <p className="text-[11px] text-slate-600 max-w-[200px]">
                Click items in the catalog or scan barcodes to begin billing.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product_id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 text-xs">
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="font-semibold text-slate-100 truncate">{item.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    ₹{item.unit_price.toFixed(2)} / unit
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-1.5 py-1">
                  <button
                    onClick={() => decrementQuantity(item.product_id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="font-bold text-slate-100 font-mono px-1.5 min-w-[20px] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => incrementQuantity(item.product_id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {/* Line Total */}
                <div className="text-right min-w-[65px]">
                  <span className="font-mono font-bold text-slate-100">
                    ₹{item.subtotal.toFixed(2)}
                  </span>
                </div>

                {/* Delete line */}
                <button
                  onClick={() => removeFromCart(item.product_id)}
                  className="p-1 text-slate-500 hover:text-rose-400 transition"
                  title="Remove from cart"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Cart Bottom: Discount, Breakdown, Payment Methods & Checkout Button */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 space-y-3">
          {/* Discount Input Box */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Tag size={13} className="text-indigo-400" />
              <span>Discount (₹)</span>
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              className="w-28 text-right bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Totals Breakdown */}
          <div className="space-y-1.5 text-xs text-slate-400 pt-1 border-t border-slate-800/80">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono text-slate-200 font-medium">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (GST 5%):</span>
              <span className="font-mono text-slate-200 font-medium">+₹{taxAmount.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-rose-400">
                <span>Discount Applied:</span>
                <span className="font-mono font-medium">-₹{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-extrabold text-white pt-1.5 border-t border-slate-800">
              <span>Final Grand Total:</span>
              <span className="text-emerald-400 font-black text-lg font-mono">
                ₹{finalTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector: Cash, Card, UPI */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { id: 'CASH', label: 'Cash', icon: Banknote },
              { id: 'CARD', label: 'Card', icon: CreditCard },
              { id: 'UPI', label: 'UPI QR', icon: QrCode },
            ].map((pm) => (
              <button
                key={pm.id}
                type="button"
                onClick={() => setPaymentMethod(pm.id)}
                className={`py-2 px-1 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                  paymentMethod === pm.id
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <pm.icon size={14} />
                <span>{pm.label}</span>
              </button>
            ))}
          </div>

          {/* Large Action Button: Complete Sale & Print [F9] */}
          <button
            type="button"
            onClick={handleCheckout}
            disabled={isCheckingOut || cart.length === 0}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black tracking-wide shadow-xl shadow-emerald-600/25 transition flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            {isCheckingOut ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Executing ACID Row Locking...
              </span>
            ) : (
              <>
                <Zap size={16} className="text-amber-300" />
                <span>Complete Sale & Print [F9]</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. Pop-up Receipt Modal */}
      {completedSale && (
        <ReceiptModal
          sale={completedSale}
          onClose={() => setCompletedSale(null)}
          onNewSale={handleStartNewSale}
        />
      )}

      {/* 4. Clear Cart Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearModal}
        title="Clear Register Cart"
        message={`Are you sure you want to remove all ${cart.length} item(s) from the current sale? This will reset the customer register.`}
        confirmText="Clear Cart"
        confirmVariant="danger"
        onConfirm={clearCart}
        onClose={() => setShowClearModal(false)}
      />
    </div>
  );
}
