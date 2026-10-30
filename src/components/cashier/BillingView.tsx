import React, { useState } from 'react';
import { useEmr } from '../../context/EmrContext';
import { Invoice, PaymentMode, Payment } from '../../types/emr';
import {
  CreditCard,
  Receipt,
  RotateCcw,
  Printer,
  CheckCircle2,
  X,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { getStatusBadgeStyle } from '../../lib/statusStyles';

/**
 * Single local helper for Nigerian Naira currency formatting.
 * Formats numbers as ₦x,xxx and HMO deductions as −₦x,xxx.
 * Stored values in context/state stay strictly numeric.
 */
const formatNaira = (amount: number, isDeduction = false): string => {
  const formatted = `₦${amount.toLocaleString()}`;
  return isDeduction ? `−${formatted}` : formatted;
};

export const BillingView: React.FC = () => {
  const {
    invoices,
    facility,
    processPayment,
    requestRefund,
  } = useEmr();

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(invoices[0]?.id || null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Payment Modal state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState<PaymentMode>('POS/card');
  const [terminalRef, setTerminalRef] = useState('TM-STANBIC-0941');
  const [transferRef, setTransferRef] = useState('');
  const [hmoAuthCode, setHmoAuthCode] = useState('');

  // Receipt Modal state
  const [receiptPayment, setReceiptPayment] = useState<{ payment: Payment; invoice: Invoice } | null>(null);

  // Refund Modal state
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundPaymentId, setRefundPaymentId] = useState('');
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundReason, setRefundReason] = useState('');

  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId) || invoices[0];

  const filteredInvoices = invoices.filter((inv) => {
    const matchesFilter = filterStatus === 'all' || inv.status === filterStatus;
    const matchesSearch =
      inv.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.patientMrn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Filter counts computed dynamically from the full invoice list
  const filterCounts = {
    all: invoices.length,
    Pending: invoices.filter((i) => i.status === 'Pending').length,
    Partial: invoices.filter((i) => i.status === 'Partial').length,
    Paid: invoices.filter((i) => i.status === 'Paid').length,
  };

  const openPaymentModal = (invoice: Invoice) => {
    setSelectedInvoiceId(invoice.id);
    setPayAmount(invoice.balance);
    if (invoice.hmoProvider) {
      setHmoAuthCode(`HYG-AUTH-${Math.floor(Math.random() * 80000 + 10000)}A`);
    }
    setIsPayModalOpen(true);
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || payAmount <= 0) return;

    let ref = `REF-${Date.now().toString().slice(-6)}`;
    if (payMode === 'POS/card') ref = `POS-${terminalRef}-${Date.now().toString().slice(-4)}`;
    else if (payMode === 'Bank transfer') ref = transferRef || `TRF-GTB-${Date.now().toString().slice(-6)}`;
    else if (payMode === 'Online (Paystack)') ref = `PSTK-WEBHOOK-${Date.now().toString().slice(-6)}`;
    else if (payMode === 'HMO/insurance') ref = hmoAuthCode || `HMO-APPV-${Date.now().toString().slice(-6)}`;
    else if (payMode === 'Cash') ref = `CSH-SHIFT-A-${Date.now().toString().slice(-4)}`;

    processPayment(selectedInvoice.id, {
      amount: Number(payAmount),
      mode: payMode,
      reference: ref,
      terminalRef: payMode === 'POS/card' ? terminalRef : undefined,
      transferRef: payMode === 'Bank transfer' ? transferRef : undefined,
      hmoApprovalCode: payMode === 'HMO/insurance' ? hmoAuthCode : undefined,
    });

    setIsPayModalOpen(false);
  };

  const handleRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !refundPaymentId || refundAmount <= 0) return;

    requestRefund(selectedInvoice.id, refundPaymentId, Number(refundAmount), refundReason);
    setIsRefundModalOpen(false);
    setRefundReason('');
  };

  const triggerPrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Billing Counter & Payment Settlement
          </h1>
          <p className="text-xs text-slate-600">
            Step 7: Itemized invoices, multi-channel payment collection (Cash, POS, Paystack, HMO), and receipts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Append-Only Audit Policy Active</span>
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 no-print">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice number, patient name, or MRN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006837]"
          />
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {(['all', 'Pending', 'Partial', 'Paid'] as const).map((st) => {
            const count = filterCounts[st];
            const label = st === 'all' ? `All Invoices (${count})` : `${st} (${count})`;
            const isActive = filterStatus === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#006837] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                } focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006837]`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Invoices list on left (5 cols), Invoice details on right (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 no-print">
        {/* Left Column: Invoices list (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            INVOICES QUEUE ({filteredInvoices.length})
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">No matching invoices</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  No records match your active search or filter selection.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                }}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006837]"
              >
                Clear search & filters
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 lg:max-h-[640px] lg:overflow-y-auto pr-0 lg:pr-1">
              {filteredInvoices.map((inv) => {
                const isSelected = inv.id === selectedInvoice?.id;

                return (
                  <div
                    key={inv.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedInvoiceId(inv.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedInvoiceId(inv.id);
                      }
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006837] ${
                      isSelected
                        ? 'bg-white border-[#006837] ring-1 ring-[#006837]/30 shadow-sm'
                        : 'bg-white border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {inv.patientName}
                        </div>
                        <div className="text-xs font-mono text-slate-600 font-semibold">
                          {inv.invoiceNumber} • {inv.patientMrn}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeStyle(
                          inv.status
                        )}`}
                      >
                        {inv.status}
                      </span>
                    </div>

                    <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-600 text-[10px] font-medium">Total Accrued:</span>
                        <div className="font-bold text-slate-800 tabular-nums">
                          {formatNaira(inv.subtotal)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-600 text-[10px] font-medium">Outstanding Balance:</span>
                        {inv.balance > 0 ? (
                          <div className="font-bold text-rose-700 tabular-nums">
                            {formatNaira(inv.balance)}
                          </div>
                        ) : (
                          <div className="font-semibold text-emerald-800 tabular-nums flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                            <span>Settled (₦0)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {inv.hmoProvider && (
                      <div className="mt-2 text-xs font-medium text-emerald-900 bg-emerald-50 border border-emerald-200 p-1.5 rounded-lg truncate">
                        HMO: {inv.hmoProvider}
                      </div>
                    )}

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500 tabular-nums">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </span>
                      {inv.balance > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openPaymentModal(inv);
                          }}
                          className="px-3 py-1.5 min-h-[44px] sm:min-h-0 rounded-xl bg-[#006837] hover:bg-[#00522c] text-white font-bold text-xs shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006837]"
                        >
                          Collect Payment
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Detailed Itemized Invoice & Payments Breakdown (7 cols) */}
        <div className="lg:col-span-7">
          {selectedInvoice ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#EAF7EE] text-[#006837] flex items-center justify-center font-bold flex-shrink-0">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Invoice: <span className="font-mono">{selectedInvoice.invoiceNumber}</span>
                    </h2>
                    <div className="text-xs text-slate-600">
                      Patient: <strong className="text-slate-800">{selectedInvoice.patientName}</strong>{' '}
                      (<span className="font-mono text-slate-600">{selectedInvoice.patientMrn}</span>)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedInvoice.balance > 0 ? (
                    <button
                      type="button"
                      onClick={() => openPaymentModal(selectedInvoice)}
                      className="px-4 py-2 min-h-[44px] rounded-xl bg-[#006837] hover:bg-[#00522c] text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006837]"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Take Payment</span>
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Settled in Full</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Itemized charges table */}
              <div>
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Itemized Charges Breakdown
                </div>

                {/* Desktop semantic table (lg+) */}
                <div className="hidden lg:block rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th scope="col" className="py-2.5 px-3">Service / Item Description</th>
                        <th scope="col" className="py-2.5 px-3">Category</th>
                        <th scope="col" className="py-2.5 px-3 text-center">Qty</th>
                        <th scope="col" className="py-2.5 px-3 text-right">Price (₦)</th>
                        <th scope="col" className="py-2.5 px-3 text-right">Total (₦)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedInvoice.items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            {item.description}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center tabular-nums text-slate-700">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-right tabular-nums text-slate-600">
                            {item.unitPrice.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums font-bold text-slate-900">
                            {item.total.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile / Tablet cards (< lg) */}
                <div className="block lg:hidden space-y-2">
                  {selectedInvoice.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 min-h-[44px]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-slate-900 text-xs leading-snug">
                          {item.description}
                        </span>
                        <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 flex-shrink-0">
                          {item.category}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                        <span className="text-slate-600">
                          Qty: <strong className="tabular-nums text-slate-800">{item.quantity}</strong> × ₦
                          {item.unitPrice.toLocaleString()}
                        </span>
                        <span className="font-bold text-slate-900 tabular-nums">
                          {formatNaira(item.total)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Totals Calculation Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span className="font-medium">Gross Invoice Total:</span>
                  <span className="tabular-nums font-bold text-slate-900">
                    {formatNaira(selectedInvoice.subtotal)}
                  </span>
                </div>
                {selectedInvoice.hmoCoveredAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span className="font-medium">HMO Insurance Coverage:</span>
                    <span className="tabular-nums font-bold">
                      {formatNaira(selectedInvoice.hmoCoveredAmount, true)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-800 pt-1 border-t border-slate-200">
                  <span className="font-bold">Patient Payable Co-Pay / Fee:</span>
                  <span className="tabular-nums font-bold text-slate-900">
                    {formatNaira(selectedInvoice.patientPayable)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span className="font-medium">Total Settled (Paid to date):</span>
                  <span className="tabular-nums font-bold">
                    {formatNaira(selectedInvoice.paidAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-slate-900 pt-1 border-t border-slate-200 text-sm">
                  <span className="font-bold">Outstanding Balance Due:</span>
                  {selectedInvoice.balance > 0 ? (
                    <span className="tabular-nums font-bold text-rose-700 text-base">
                      {formatNaira(selectedInvoice.balance)}
                    </span>
                  ) : (
                    <span className="tabular-nums font-semibold text-emerald-800 flex items-center gap-1.5 text-xs sm:text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Settled in Full (₦0)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Payments History (Append-Only) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Payments Log (Append-Only Ledger)
                  </div>
                  <span className="text-xs text-slate-500 tabular-nums">
                    {selectedInvoice.payments.length} transactions
                  </span>
                </div>

                {selectedInvoice.payments.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                    No payments posted for this invoice yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedInvoice.payments.map((p) => (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold tabular-nums text-emerald-700 text-sm">
                              {formatNaira(p.amount)}
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 font-semibold px-2 py-0.5 rounded">
                              {p.mode}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 mt-1">
                            Ref: <span className="font-mono">{p.reference}</span> • Cashier:{' '}
                            <strong>{p.cashierName}</strong> •{' '}
                            <span className="tabular-nums">{new Date(p.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => setReceiptPayment({ payment: p, invoice: selectedInvoice })}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 min-h-[36px] sm:min-h-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006837]"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Receipt</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRefundPaymentId(p.id);
                              setRefundAmount(p.amount);
                              setIsRefundModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1 min-h-[36px] sm:min-h-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Refund</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Refunds Record */}
              {selectedInvoice.refunds.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                    Refund Records ({selectedInvoice.refunds.length})
                  </div>
                  {selectedInvoice.refunds.map((ref) => (
                    <div
                      key={ref.id}
                      className="p-3 rounded-xl bg-rose-50/60 border border-rose-200 text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-rose-900 tabular-nums">
                          − {formatNaira(ref.amount)} ({ref.status})
                        </div>
                        <div className="text-xs text-rose-700 mt-0.5">
                          Reason: {ref.reason} • Approved by: {ref.approvedBy}
                        </div>
                      </div>
                      <span className="text-xs tabular-nums text-slate-500">
                        {new Date(ref.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 border border-dashed rounded-2xl bg-white">
              Select an invoice to review itemized billing
            </div>
          )}
        </div>
      </div>

      {/* Payment Entry Modal */}
      {isPayModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pay-modal-title"
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EAF7EE] text-[#006837] flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="pay-modal-title" className="font-bold text-slate-900 text-base">
                    Process Payment Settlement
                  </h3>
                  <p className="text-xs text-slate-500">
                    Append-only payment entry for <span className="font-mono">{selectedInvoice.invoiceNumber}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                aria-label="Close payment modal"
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006837]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="mt-4 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Patient: {selectedInvoice.patientName}</div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Total Due:{' '}
                    <span className="font-bold text-slate-900 tabular-nums">
                      {formatNaira(selectedInvoice.balance)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                    Max Payable
                  </span>
                  <div className="font-bold text-slate-900 tabular-nums text-sm">
                    {formatNaira(selectedInvoice.balance)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Payment Mode *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['POS/card', 'Cash', 'Bank transfer', 'Online (Paystack)', 'HMO/insurance'] as PaymentMode[]).map(
                    (m) => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setPayMode(m)}
                        className={`p-2.5 rounded-xl text-xs font-semibold transition-all border min-h-[44px] flex items-center justify-center text-center ${
                          payMode === m
                            ? 'bg-[#006837] text-white border-[#006837] shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        } focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006837]`}
                      >
                        {m}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Amount to Collect (₦) * (Part payment allowed)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedInvoice.balance}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-bold tabular-nums text-right rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006837]"
                />
              </div>

              {payMode === 'POS/card' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    POS Terminal Identifier (No card numbers stored) *
                  </label>
                  <input
                    type="text"
                    required
                    value={terminalRef}
                    onChange={(e) => setTerminalRef(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#006837]"
                    placeholder="e.g. TM-STANBIC-0941"
                  />
                </div>
              )}

              {payMode === 'Bank transfer' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Bank Transfer Reference / Session ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={transferRef}
                    onChange={(e) => setTransferRef(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#006837]"
                    placeholder="e.g. GTB/TRF/991823901"
                  />
                </div>
              )}

              {payMode === 'HMO/insurance' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    HMO Authorization Approval Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={hmoAuthCode}
                    onChange={(e) => setHmoAuthCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#006837]"
                    placeholder="e.g. HYG-AUTH-88219A"
                  />
                </div>
              )}

              {payMode === 'Online (Paystack)' && (
                <div className="p-4 rounded-xl bg-slate-50 border border-emerald-300 text-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Paystack Secured Health Gateway</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-200">
                      TEST MODE (LIVE SIMULATION)
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1.5">
                      <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                        <span>CARD NUMBER</span>
                        <span className="text-emerald-700 font-bold">VISA / VERVE</span>
                      </div>
                      <div className="font-mono font-bold text-sm text-slate-800 tracking-wider">
                        4084 0840 0840 4084
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-1">
                        <span>EXP: 12/28</span>
                        <span>CVV: 924</span>
                        <span>PIN: 1234</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-emerald-900 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg leading-relaxed flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>
                        Submitting will trigger instant Paystack webhook payload & cryptographically verify HMAC-SHA512 signature.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 min-h-[44px] rounded-xl font-semibold text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 min-h-[44px] rounded-xl bg-[#006837] hover:bg-[#00522c] text-white font-bold text-xs shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006837]"
                >
                  Confirm & Post Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refund Request Modal */}
      {isRefundModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="refund-modal-title"
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95"
          >
            <h3 id="refund-modal-title" className="font-bold text-slate-900 text-base mb-1">
              Issue Payment Refund
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Requires administrative justification and creates an immutable audit trail
            </p>

            <form onSubmit={handleRefundSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Refund Amount (₦)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-bold tabular-nums text-right rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006837]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Refund *</label>
                <textarea
                  rows={3}
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Test cancelled by physician; patient overpaid co-pay..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#006837]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRefundModalOpen(false)}
                  className="px-4 py-2 min-h-[44px] rounded-xl text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
                >
                  Authorize Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Official Hospital Receipt Modal */}
      {receiptPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-modal-title"
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-8 my-8 relative print-only"
          >
            {/* Action Bar (hidden on paper print) */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 no-print">
              <span id="receipt-modal-title" className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Hospital Official Receipt
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={triggerPrintReceipt}
                  className="px-3.5 py-1.5 rounded-xl bg-[#006837] hover:bg-[#00522c] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006837]"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptPayment(null)}
                  aria-label="Close receipt modal"
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006837]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Hospital Receipt Layout */}
            <div className="space-y-6 text-slate-900">
              {/* Receipt Header */}
              <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900">
                <div className="text-xl font-black uppercase tracking-tight text-slate-900">
                  {facility.name}
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  {facility.address} • Tel: {facility.phone}
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  Tenant Code: {facility.code} • NDPA Certified Healthcare Facility
                </div>
                <div className="mt-2 inline-block px-3 py-1 bg-slate-100 font-extrabold text-xs uppercase tracking-widest text-slate-800 rounded border border-slate-200">
                  OFFICIAL PAYMENT RECEIPT
                </div>
              </div>

              {/* Meta details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-semibold">Receipt No:</div>
                  <div className="font-bold text-slate-900 font-mono">REC-{receiptPayment.payment.id.toUpperCase()}</div>
                  <div className="text-slate-500 text-[10px] uppercase font-semibold mt-2">Patient Name:</div>
                  <div className="font-bold text-slate-900">{receiptPayment.invoice.patientName}</div>
                  <div className="text-slate-500 text-[10px] uppercase font-semibold mt-2">MRN:</div>
                  <div className="font-bold text-slate-900 font-mono">{receiptPayment.invoice.patientMrn}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-500 text-[10px] uppercase font-semibold">Transaction Date:</div>
                  <div className="font-bold text-slate-900 tabular-nums">
                    {new Date(receiptPayment.payment.timestamp).toLocaleString()}
                  </div>
                  <div className="text-slate-500 text-[10px] uppercase font-semibold mt-2">Payment Mode:</div>
                  <div className="font-bold text-slate-900">{receiptPayment.payment.mode}</div>
                  <div className="text-slate-500 text-[10px] uppercase font-semibold mt-2">Bank / POS Ref:</div>
                  <div className="font-bold text-slate-900 truncate font-mono">{receiptPayment.payment.reference}</div>
                </div>
              </div>

              {/* Items Summary */}
              <div className="border-t border-b border-slate-200 py-3 text-xs">
                <div className="flex justify-between font-bold text-slate-800 pb-1 border-b border-slate-100">
                  <span>Description</span>
                  <span>Amount</span>
                </div>
                <div className="divide-y divide-slate-100 py-1">
                  {receiptPayment.invoice.items.map((it) => (
                    <div key={it.id} className="flex justify-between py-1 text-slate-700">
                      <span>{it.description}</span>
                      <span className="tabular-nums font-medium">{formatNaira(it.total)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amount Paid Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Amount Received in Words / Naira
                </div>
                <div className="text-2xl font-black text-slate-900 tabular-nums">
                  {formatNaira(receiptPayment.payment.amount)}
                </div>
                <div className="text-xs text-slate-600">
                  Invoice <span className="font-mono font-semibold">{receiptPayment.invoice.invoiceNumber}</span> • Remaining Balance:{' '}
                  <span className="tabular-nums font-semibold">{formatNaira(receiptPayment.invoice.balance)}</span>
                </div>
              </div>

              {/* Stamp & Signatures */}
              <div className="pt-6 flex items-end justify-between text-xs text-slate-600">
                <div>
                  <div className="w-28 h-24 border-2 border-dashed border-slate-400 rounded-xl flex flex-col items-center justify-center p-2 text-center text-slate-800">
                    <ShieldCheck className="w-6 h-6 mb-1 text-slate-700" />
                    <span className="text-[9px] font-black uppercase tracking-wider">PAID & CERTIFIED</span>
                    <span className="text-[8px] font-mono text-slate-600">CAREVIA HEALTH</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="border-b border-slate-400 w-36 mb-1" />
                  <div className="font-bold text-slate-800">{receiptPayment.payment.cashierName}</div>
                  <div className="text-[10px] text-slate-500">Authorized Cashier Stamp</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
