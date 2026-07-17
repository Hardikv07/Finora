import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  ZoomIn,
  RotateCcw
} from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useFinanceData } from '../../hooks/useFinanceData';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../../constants/categories';

/**
 * Attempts to extract bill information from text content.
 * Looks for common patterns like amounts, dates, merchant names.
 */
const extractBillData = (textContent) => {
  const extracted = {};

  // Extract amounts — match patterns like ₹1,234.56, Rs. 1234, $45.00, Total: 500
  const amountPatterns = [
    /(?:total|amount|grand\s*total|net\s*(?:amount|payable)|balance\s*due|you\s*pay)[:\s]*[₹$€£]?\s*([\d,]+\.?\d*)/i,
    /[₹$€£]\s*([\d,]+\.?\d*)/,
    /(?:Rs\.?|INR|USD|EUR)\s*([\d,]+\.?\d*)/i,
  ];
  for (const pattern of amountPatterns) {
    const match = textContent.match(pattern);
    if (match) {
      extracted.amount = match[1].replace(/,/g, '');
      break;
    }
  }

  // Extract date — DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, Month DD YYYY
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s*(\d{4})/i,
  ];
  for (const pattern of datePatterns) {
    const match = textContent.match(pattern);
    if (match) {
      try {
        const dateStr = match[0];
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          extracted.date = parsed.toISOString().split('T')[0];
        }
      } catch (e) {
        // fallback: keep raw match
      }
      break;
    }
  }

  // Extract merchant — first line or text before "invoice/bill/receipt"
  const merchantPatterns = [
    /(?:from|merchant|vendor|company|billed\s*by|seller)[:\s]*([A-Za-z0-9\s&.'-]+)/i,
    /^([A-Za-z][A-Za-z0-9\s&.'-]{2,40})/m,
  ];
  for (const pattern of merchantPatterns) {
    const match = textContent.match(pattern);
    if (match) {
      extracted.merchant = match[1].trim().substring(0, 50);
      break;
    }
  }

  // Try to guess category from keywords
  const categoryKeywords = {
    'Food & Dining': ['restaurant', 'food', 'cafe', 'dining', 'swiggy', 'zomato', 'pizza', 'burger', 'coffee', 'starbucks'],
    'Shopping': ['amazon', 'flipkart', 'myntra', 'mall', 'shop', 'store', 'retail', 'purchase'],
    'Utilities & Bills': ['electricity', 'water', 'gas', 'internet', 'broadband', 'wifi', 'mobile', 'recharge', 'bill'],
    'Transportation': ['uber', 'ola', 'fuel', 'petrol', 'diesel', 'cab', 'taxi', 'metro', 'parking'],
    'Healthcare & Fitness': ['hospital', 'pharmacy', 'medical', 'doctor', 'clinic', 'medicine', 'gym', 'health'],
    'Entertainment': ['netflix', 'spotify', 'movie', 'cinema', 'ticket', 'game', 'subscription'],
    'Education': ['course', 'book', 'tuition', 'school', 'college', 'udemy', 'academy'],
    'Travel & Vacations': ['hotel', 'flight', 'booking', 'travel', 'airline', 'airbnb', 'makemytrip'],
    'Housing & Rent': ['rent', 'lease', 'housing', 'apartment', 'maintenance', 'society'],
  };

  const lowerText = textContent.toLowerCase();
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((kw) => lowerText.includes(kw))) {
      extracted.category = category;
      break;
    }
  }

  return extracted;
};

/**
 * Bill Import Modal — Upload bills/receipts and auto-extract expense details
 */
const BillImportModal = ({ isOpen, onClose }) => {
  const { wallets, addTransaction } = useFinanceData();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState('upload'); // 'upload' | 'preview' | 'confirm'
  const [file, setFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [fileType, setFileType] = useState(null); // 'image' | 'pdf' | 'text'
  const [fileTextContent, setFileTextContent] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState({});
  const [isDragging, setIsDragging] = useState(false);

  const [formData, setFormData] = useState({
    merchant: '',
    amount: '',
    category: EXPENSE_CATEGORIES[0]?.name || 'Food & Dining',
    walletId: '',
    paymentMethod: PAYMENT_METHODS[0]?.name || 'UPI / PhonePe',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    tags: 'imported-bill',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetModal = () => {
    setStep('upload');
    setFile(null);
    setFilePreviewUrl(null);
    setFileType(null);
    setFileTextContent('');
    setExtracting(false);
    setExtractedData({});
    setIsDragging(false);
    setFormData({
      merchant: '',
      amount: '',
      category: EXPENSE_CATEGORIES[0]?.name || 'Food & Dining',
      walletId: wallets[0]?._id || '',
      paymentMethod: PAYMENT_METHODS[0]?.name || 'UPI / PhonePe',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      tags: 'imported-bill',
    });
    setErrors({});
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const processFile = useCallback(async (selectedFile) => {
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setFilePreviewUrl(url);

    // Determine file type
    const mime = selectedFile.type;
    if (mime.startsWith('image/')) {
      setFileType('image');
    } else if (mime === 'application/pdf') {
      setFileType('pdf');
    } else if (mime.startsWith('text/') || mime === 'application/json') {
      setFileType('text');
    } else {
      setFileType('other');
    }

    setStep('preview');
    setExtracting(true);

    // Try to read text content for extraction
    let textContent = '';
    try {
      if (mime.startsWith('text/') || mime === 'application/json') {
        textContent = await selectedFile.text();
      } else if (mime.startsWith('image/')) {
        // For images, we can't extract text without OCR — use filename hints
        textContent = selectedFile.name;
      } else if (mime === 'application/pdf') {
        // For PDFs in browser, use filename hints
        textContent = selectedFile.name;
      }
    } catch (e) {
      // Extraction failure is non-critical
    }

    setFileTextContent(textContent);

    // Simulate brief processing delay for UX
    await new Promise((r) => setTimeout(r, 800));

    // Extract data from text content + filename
    const combined = textContent + ' ' + selectedFile.name;
    const extracted = extractBillData(combined);
    setExtractedData(extracted);

    // Pre-fill form with extracted data
    setFormData((prev) => ({
      ...prev,
      merchant: extracted.merchant || prev.merchant,
      amount: extracted.amount || prev.amount,
      category: extracted.category || prev.category,
      date: extracted.date || prev.date,
      walletId: wallets[0]?._id || '',
      notes: `Imported from bill: ${selectedFile.name}`,
    }));

    setExtracting(false);
  }, [wallets]);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) processFile(droppedFile);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.merchant?.trim()) newErrors.merchant = 'Merchant name is required.';
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Enter a valid positive amount.';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await addTransaction({
        type: 'expense',
        merchant: formData.merchant,
        amount: Number(formData.amount),
        category: formData.category,
        walletId: formData.walletId,
        paymentMethod: formData.paymentMethod,
        date: formData.date,
        notes: formData.notes,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()) : ['imported-bill'],
        hasReceipt: true,
      });
      handleClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileIcon = () => {
    if (fileType === 'image') return <ImageIcon className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Bill & Add Expense"
      subtitle="Upload a receipt, invoice, or bill — we'll extract expenses automatically"
      maxWidth="max-w-3xl"
    >
      {/* Step 1: Upload / Drop Zone */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 group ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/80 scale-[1.02]'
                : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/40'
            }`}
          >
            <div className="flex flex-col items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                isDragging
                  ? 'bg-indigo-100 text-indigo-600 scale-110'
                  : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'
              }`}>
                <Upload className="w-7 h-7" />
              </div>

              <div>
                <p className="text-base font-bold text-slate-800">
                  {isDragging ? 'Drop your bill here!' : 'Drag & drop your bill or click to browse'}
                </p>
                <p className="text-xs text-slate-500 mt-1.5">
                  Supports JPG, PNG, PDF, and text files — Max size 10MB
                </p>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <span className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
                  📷 Images
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-100">
                  📄 PDFs
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
                  📝 Text Files
                </span>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.txt,.csv,.json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <strong>Smart Bill Scanner:</strong> Our engine will attempt to auto-detect the merchant name, total amount,
              date, and category from your uploaded bill. You can review and edit before confirming.
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Preview + Form */}
      {step === 'preview' && (
        <div className="space-y-5">
          {/* Extraction progress */}
          {extracting && (
            <div className="flex items-center justify-center gap-3 p-6 rounded-2xl bg-indigo-50 border border-indigo-100 animate-pulse">
              <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
              <span className="text-sm font-semibold text-indigo-800">Analyzing bill content...</span>
            </div>
          )}

          {!extracting && (
            <>
              {/* Extracted Data Confidence Banner */}
              <div className={`flex items-center gap-3 p-3.5 rounded-xl border text-xs font-medium ${
                Object.keys(extractedData).length >= 2
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                {Object.keys(extractedData).length >= 2 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Auto-detected <strong>{Object.keys(extractedData).length}</strong> fields from your bill.
                      Please verify and adjust below before saving.
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Limited auto-detection from this file. Please fill in the expense details manually below.
                    </span>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Bill Preview Panel */}
                <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
                  <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {getFileIcon()}
                      <span className="text-xs font-bold text-slate-800 truncate">{file?.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {(file?.size / 1024).toFixed(1)} KB
                      </span>
                      <button
                        onClick={() => { resetModal(); setStep('upload'); }}
                        className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Remove and re-upload"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 flex items-center justify-center min-h-[260px] max-h-[360px] overflow-auto">
                    {fileType === 'image' && filePreviewUrl && (
                      <img
                        src={filePreviewUrl}
                        alt="Bill preview"
                        className="max-w-full max-h-[340px] rounded-xl shadow-md object-contain"
                      />
                    )}
                    {fileType === 'pdf' && (
                      <div className="flex flex-col items-center gap-3 text-slate-500">
                        <FileText className="w-16 h-16 text-rose-400" />
                        <p className="text-xs font-semibold text-slate-700">{file?.name}</p>
                        <a
                          href={filePreviewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100 hover:bg-indigo-100 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Open PDF in New Tab
                        </a>
                      </div>
                    )}
                    {fileType === 'text' && (
                      <pre className="text-xs text-slate-700 whitespace-pre-wrap bg-white p-4 rounded-xl border border-slate-200 w-full max-h-[320px] overflow-auto font-mono leading-relaxed">
                        {fileTextContent.substring(0, 2000)}
                      </pre>
                    )}
                    {fileType === 'other' && (
                      <div className="flex flex-col items-center gap-3 text-slate-500">
                        <FileText className="w-12 h-12 text-slate-300" />
                        <p className="text-xs font-medium">Preview not available for this file type.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expense Details Form */}
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Expense Details from Bill
                  </p>

                  {/* Merchant */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Merchant / Vendor <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="merchant"
                      value={formData.merchant}
                      onChange={handleChange}
                      placeholder="e.g. Amazon, Zomato, Electric Company"
                      className="input-field"
                    />
                    {errors.merchant && <p className="text-xs text-red-500 mt-1 font-medium">{errors.merchant}</p>}
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Bill Amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="input-field text-lg font-bold"
                    />
                    {errors.amount && <p className="text-xs text-red-500 mt-1 font-medium">{errors.amount}</p>}
                  </div>

                  {/* Category & Date */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Category
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="input-field cursor-pointer text-xs"
                      >
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Bill Date
                      </label>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className="input-field text-xs"
                      />
                    </div>
                  </div>

                  {/* Wallet & Payment Method */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Pay From Wallet
                      </label>
                      <select
                        name="walletId"
                        value={formData.walletId}
                        onChange={handleChange}
                        className="input-field cursor-pointer text-xs"
                      >
                        {wallets.map((w) => (
                          <option key={w._id} value={w._id}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Payment Method
                      </label>
                      <select
                        name="paymentMethod"
                        value={formData.paymentMethod}
                        onChange={handleChange}
                        className="input-field cursor-pointer text-xs"
                      >
                        {PAYMENT_METHODS.map((pm) => (
                          <option key={pm.id} value={pm.name}>{pm.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      className="input-field text-xs"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                    <Button variant="secondary" type="button" onClick={handleClose} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" loading={isSubmitting}>
                      Add as Expense
                    </Button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
};

export default BillImportModal;
