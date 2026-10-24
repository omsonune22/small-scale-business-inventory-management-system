import React from 'react';
import { Printer, CheckCircle, X, Store, Receipt } from 'lucide-react';

export default function ReceiptModal({ sale, onClose, onNewSale }) {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col max-h-[95vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 no-print">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-emerald-400" size={18} />
            <h3 className="text-sm font-bold text-white">Payment Received & Bill Generated</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Printable Thermal Paper Receipt Container */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-950/40">
          <div 
            id="printable-receipt"
            className="bg-white text-slate-900 p-6 rounded-2xl shadow-md font-mono text-xs space-y-4 border border-slate-200"
          >
            {/* Store Branding */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
              <h2 className="text-base font-black tracking-wider uppercase font-sans">RetailPulse Store</h2>
              <p className="text-[11px] text-slate-600 font-sans">104 Commercial Center, Tech Park</p>
              <p className="text-[10px] text-slate-500 font-sans">GSTIN: 27AABCR1234F1Z0 | Tel: +1 555-0199</p>
            </div>

            {/* Invoice Meta */}
            <div className="text-[11px] space-y-1 pb-3 border-b border-dashed border-slate-300">
              <div className="flex justify-between font-bold">
                <span>INVOICE #:</span>
                <span>{sale.invoice_number}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>DATE:</span>
                <span>{new Date(sale.created_at || Date.now()).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>CASHIER:</span>
                <span>{sale.cashier_name || 'Terminal 01'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>CUSTOMER:</span>
                <span>{sale.customer_name || 'Walk-in Customer'}</span>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <div className="flex justify-between font-bold text-[11px] pb-1 border-b border-slate-300">
                <span className="w-6/12">ITEM</span>
                <span className="w-2/12 text-center">QTY</span>
                <span className="w-2/12 text-right">PRICE</span>
                <span className="w-2/12 text-right">TOTAL</span>
              </div>

              <div className="divide-y divide-dashed divide-slate-200 py-1 text-[11px]">
                {sale.items?.map((it, idx) => (
                  <div key={idx} className="py-1.5 flex justify-between items-start">
                    <div className="w-6/12 pr-1">
                      <p className="font-semibold leading-tight">{it.name || it.product_name}</p>
                      <p className="text-[9px] text-slate-500">{it.sku}</p>
                    </div>
                    <span className="w-2/12 text-center font-bold">{it.quantity}</span>
                    <span className="w-2/12 text-right">₹{Number(it.unit_price).toFixed(2)}</span>
                    <span className="w-2/12 text-right font-bold">₹{Number(it.subtotal).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="pt-2 border-t-2 border-slate-900 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>₹{Number(sale.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax (GST 5%):</span>
                <span>+₹{Number(sale.tax_amount).toFixed(2)}</span>
              </div>
              {Number(sale.discount_amount) > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Discount:</span>
                  <span>-₹{Number(sale.discount_amount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black pt-1.5 border-t border-slate-300 text-slate-950">
                <span>FINAL TOTAL:</span>
                <span>₹{Number(sale.final_total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1 font-bold">
                <span>PAYMENT METHOD:</span>
                <span className="uppercase">{sale.payment_method || 'CASH'}</span>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-500 font-sans space-y-0.5">
              <p className="font-semibold text-slate-700">Thank you for shopping with us!</p>
              <p>Keep this receipt for warranty and returns within 14 days.</p>
              <p className="text-[9px] pt-1">*** Software: RetailPulse POS v1.0.0 ***</p>
            </div>
          </div>
        </div>

        {/* Action Buttons (Excluded from print) */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex gap-2.5 no-print">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Printer size={15} />
            <span>Print Receipt</span>
          </button>
          <button
            type="button"
            onClick={onNewSale}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-1.5"
          >
            <Receipt size={15} />
            <span>Start New Sale</span>
          </button>
        </div>
      </div>

      {/* Embedded CSS for Thermal Print Media */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            margin: 0;
            padding: 10px;
            box-shadow: none;
            border: none;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
