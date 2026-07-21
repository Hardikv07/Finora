import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  RotateCcw,
  RefreshCw,
  Wallet,
  PieChart,
  Receipt,
  ArrowRight,
  Tag,
  Clock,
  Repeat,
  Bell,
  ChevronRight,
  ScanLine,
} from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useFinanceData } from '../../hooks/useFinanceData';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../../constants/categories';
import { apiService } from '../../services/api';

/* ─── helpers ──────────────────────────────────────────────── */

/**
 * Regex-based bill data extractor — works on any text string.
 */
const extractBillData = (textContent) => {
  const extracted = {};

  // Amount
  const amountPatterns = [
    /(?:total|amount|grand\s*total|net\s*(?:amount|payable)|balance\s*due|you\s*pay|bill\s*amount|payable)[:\s]*[₹$€£]?\s*([\d,]+\.?\d*)/i,
    /[₹$€£]\s*([\d,]+\.?\d*)/,
    /(?:Rs\.?|INR|USD|EUR)\s*([\d,]+\.?\d*)/i,
  ];
  for (const p of amountPatterns) {
    const m = textContent.match(p);
    if (m) { extracted.amount = m[1].replace(/,/g, ''); break; }
  }

  // Date — handles DD/MM/YYYY, YYYY-MM-DD, DD/MM/YY (2-digit year common in Indian receipts)
  // Patterns ordered so the "Date:" label prefix wins over bare numbers
  const rawDatePatterns = [
    /(?:date|dated|bill\s*date|invoice\s*date)[:\s]+(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/i,
    /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/,
    /\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/,
    /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})\b/,
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(\d{1,2}),?\s*(\d{4})/i,
  ];
  for (const p of rawDatePatterns) {
    const m = textContent.match(p);
    if (!m) continue;
    try {
      const full = m[0];
      const digits = full.match(/(\d+)[\/.\-](\d+)[\/.\-](\d+)/);
      if (digits) {
        let [, a, b, c] = digits;
        if (c.length === 2) {
          const yy = parseInt(c, 10);
          c = String(yy < 50 ? 2000 + yy : 1900 + yy);
        }
        // Prefer DD/MM/YYYY (most common in India)
        const ddmm = new Date(`${c}-${b.padStart(2,'0')}-${a.padStart(2,'0')}`);
        if (!isNaN(ddmm.getTime()) && ddmm.getFullYear() >= 2000 && ddmm.getFullYear() <= 2035) {
          extracted.date = ddmm.toISOString().split('T')[0];
          break;
        }
      } else {
        const parsed = new Date(full);
        if (!isNaN(parsed.getTime())) { extracted.date = parsed.toISOString().split('T')[0]; break; }
      }
    } catch { /* skip */ }
  }

  // Merchant — take the FIRST non-empty line with letters (business names sit at the top).
  // Split on newlines so we never cross into the second line.
  const textLines = textContent
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length >= 3 && /[A-Za-z]/.test(l) && !/^\d+$/.test(l));
  if (textLines.length > 0) {
    extracted.merchant = textLines[0]
      .replace(/[^A-Za-z0-9 &.'\-()/]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .substring(0, 50);
  } else {
    // Fallback: first alpha sequence on any single line (literal space, not \s)
    const m = textContent.match(/^([A-Za-z][A-Za-z0-9 &.'\-]{2,40})/m);
    if (m) extracted.merchant = m[1].trim().substring(0, 50);
  }

  // Category — checked in priority order; first match wins.
  // Indian food vocabulary added; Housing & Rent made very specific to avoid false positives.
  const categoryKeywords = {
    'Food & Dining': [
      // Indian food items (show up in OCR'd menu lines)
      'dosa', 'idli', 'vada', 'biryani', 'thali', 'paratha', 'naan', 'roti',
      'paneer', 'curry', 'samosa', 'chaat', 'pav bhaji', 'chole', 'rajma',
      'khichdi', 'sabzi', 'halwa', 'mithai', 'rava', 'uttapam', 'appam',
      'cheese toast', 'burger', 'pizza', 'pasta', 'sandwich',
      // Business type keywords
      'restaurant', 'delicacies', 'kitchen', 'dhaba', 'canteen', 'mess',
      'bakery', 'cafe', 'eatery', 'tiffin', 'snacks', 'food court',
      'pure veg', 'take away', 'takeaway', 'parcel',
      // GST codes that almost exclusively appear on restaurant receipts
      'fssai', 'sgst', 'cgst',
      // Popular food delivery / brands
      'swiggy', 'zomato', 'starbucks', 'dominos', 'mcdonalds', 'kfc',
      'subway', 'haldirams', 'barbeque', 'dunzo',
    ],
    'Utilities & Bills': [
      'electricity', 'internet bill', 'broadband', 'wifi', 'mobile recharge',
      'recharge', 'tata power', 'jio', 'airtel', 'bsnl', 'vodafone',
      'msedcl', 'bescom', 'torrent power', 'adani electricity',
    ],
    'Shopping': [
      'amazon', 'flipkart', 'myntra', 'nykaa', 'ajio',
      'supermarket', 'grocery', 'mart', 'bazaar', 'retail',
      'dmart', 'reliance fresh', 'big basket', 'jiomart',
    ],
    'Transportation': [
      'uber', 'ola', 'rapido', 'fuel', 'petrol', 'diesel', 'cab', 'taxi',
      'metro card', 'parking', 'irctc', 'railway', 'bus ticket', 'toll',
    ],
    'Healthcare & Fitness': [
      'hospital', 'pharmacy', 'medical', 'doctor', 'clinic', 'medicine',
      'gym', 'apollo', 'medplus', 'fortis', 'dispensary',
    ],
    'Entertainment': [
      'netflix', 'spotify', 'amazon prime', 'hotstar', 'disney',
      'movie', 'cinema', 'pvr', 'inox', 'game', 'subscription',
    ],
    'Education': [
      'course fee', 'tuition', 'school fee', 'college fee', 'udemy',
      'academy', 'institute fee', 'coaching',
    ],
    'Travel & Vacations': [
      'hotel', 'flight', 'airline', 'airbnb', 'makemytrip',
      'oyo', 'goibibo', 'cleartrip', 'resort', 'lodge',
    ],
    // Very specific phrases to avoid false positives on restaurant bills
    'Housing & Rent': [
      'rent receipt', 'monthly rent', 'lease agreement', 'housing society',
      'maintenance charges', 'flat rent', 'society dues',
    ],
  };
  const lowerText = textContent.toLowerCase();
  for (const [cat, kws] of Object.entries(categoryKeywords)) {
    if (kws.some(kw => lowerText.includes(kw))) { extracted.category = cat; break; }
  }

  return extracted;
};

/**
 * Auto-detect if a bill is likely recurring (utility, subscription, rent, etc.)
 */
const RECURRING_KEYWORDS = ['electricity', 'internet', 'broadband', 'rent', 'lease', 'mobile', 'recharge',
  'subscription', 'water', 'gas', 'insurance', 'jio', 'airtel', 'tata power', 'bsnl', 'netflix',
  'spotify', 'amazon prime', 'hotstar', 'maintenance', 'society'];

const detectRecurring = (text) =>
  RECURRING_KEYWORDS.some(kw => text.toLowerCase().includes(kw));

/**
 * Map expense category to Bill model category enum.
 */
const mapToBillCategory = (expenseCat = '') => {
  const m = {
    'Utilities & Bills':    'Electricity',
    'Housing & Rent':       'Rent',
    'Entertainment':        'Subscription',
    'Healthcare & Fitness': 'Insurance',
    'Transportation':       'Other',
    'Food & Dining':        'Other',
    'Shopping':             'Other',
    'Education':            'Other',
    'Travel & Vacations':   'Other',
  };
  return m[expenseCat] || 'Other';
};

/* ─── component ─────────────────────────────────────────────── */

const BillImportModal = ({ isOpen, onClose }) => {
  const { wallets, budgets, addTransaction, addRecurring, addBill } = useFinanceData();
  const fileInputRef = useRef(null);

  // Stage: 'upload' | 'scanning' | 'confirm'
  const [stage, setStage] = useState('upload');
  const [file, setFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [fileTextContent, setFileTextContent] = useState('');
  const [extractedData, setExtractedData] = useState({});
  const [isDragging, setIsDragging] = useState(false);

  // OCR progress state
  const [ocrStatus, setOcrStatus] = useState('');
  const [ocrProgress, setOcrProgress] = useState(0);

  // Form data
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

  // Options — what else to create
  const [isRecurring, setIsRecurring] = useState(false);
  const [trackAsBill, setTrackAsBill] = useState(false);
  const [billDueDate, setBillDueDate] = useState('');

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null); // { transaction, recurring, bill }

  // Reset
  const resetModal = useCallback(() => {
    setStage('upload');
    setFile(null);
    setFilePreviewUrl(null);
    setFileType(null);
    setFileTextContent('');
    setExtractedData({});
    setIsDragging(false);
    setOcrStatus('');
    setOcrProgress(0);
    setIsRecurring(false);
    setTrackAsBill(false);
    setBillDueDate('');
    setSubmitResult(null);
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
  }, [wallets]);

  const handleClose = () => { resetModal(); onClose(); };

  // ── Process uploaded file ───────────────────────────────────
  const processFile = useCallback(async (selectedFile) => {
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setFilePreviewUrl(url);

    const mime = selectedFile.type;
    if (mime.startsWith('image/')) setFileType('image');
    else if (mime === 'application/pdf') setFileType('pdf');
    else if (mime.startsWith('text/') || mime === 'application/json') setFileType('text');
    else setFileType('other');

    setStage('scanning');
    setOcrProgress(0);
    setOcrStatus('Preparing scanner…');

    let textContent = selectedFile.name; // fallback

    try {
      if (mime.startsWith('image/')) {
        // Real OCR via Tesseract.js
        setOcrStatus('Loading OCR engine…');
        const Tesseract = await import('tesseract.js');
        setOcrStatus('Recognizing text from image…');
        const result = await Tesseract.recognize(selectedFile, 'eng', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100));
              setOcrStatus(`Recognizing text… ${Math.round(m.progress * 100)}%`);
            } else if (m.status === 'loading tesseract core') {
              setOcrStatus('Loading OCR engine…');
            } else if (m.status === 'initializing api') {
              setOcrStatus('Initializing OCR…');
            }
          },
        });
        textContent = result.data.text || selectedFile.name;
        setOcrStatus('Text extracted!');
        setOcrProgress(100);
      } else if (mime.startsWith('text/') || mime === 'application/json') {
        setOcrStatus('Reading file…');
        await new Promise(r => setTimeout(r, 400));
        textContent = await selectedFile.text();
        setOcrProgress(100);
        setOcrStatus('File parsed!');
      } else if (mime === 'application/pdf') {
        setOcrStatus('Reading PDF metadata…');
        await new Promise(r => setTimeout(r, 600));
        setOcrProgress(100);
        setOcrStatus('PDF scanned (using filename hints)');
      }
    } catch (err) {
      console.warn('OCR failed, using filename fallback:', err);
      setOcrStatus('Extraction complete (limited data)');
      setOcrProgress(100);
    }

    setFileTextContent(textContent);

    // Small pause so user sees 100%
    await new Promise(r => setTimeout(r, 500));
    setOcrStatus('Analyzing bill data…');
    await new Promise(r => setTimeout(r, 300));

    const combined = textContent + ' ' + selectedFile.name;
    const extracted = extractBillData(combined);
    setExtractedData(extracted);

    // Auto-detect recurring
    const autoRecurring = detectRecurring(combined);
    setIsRecurring(autoRecurring);

    // Pre-fill form
    setFormData(prev => ({
      ...prev,
      merchant: extracted.merchant || prev.merchant,
      amount:   extracted.amount   || prev.amount,
      category: extracted.category || prev.category,
      date:     extracted.date     || prev.date,
      walletId: wallets[0]?._id   || '',
      notes: `Imported from bill: ${selectedFile.name}`,
    }));

    setStage('confirm');
  }, [wallets]);

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const handleDragOver  = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop      = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  // ── Submit: create Transaction + optionally Recurring + Bill ─
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.merchant?.trim())    newErrors.merchant = 'Merchant name is required.';
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0)
      newErrors.amount = 'Enter a valid positive amount.';
    if (!formData.walletId)            newErrors.walletId = 'Please select a wallet.';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setIsSubmitting(true);
    const result = {};
    try {
      let uploadedReceiptUrl = null;
      let uploadedReceiptId = null;

      // Upload file to Cloudinary via backend parse endpoint
      if (file) {
        const parsed = await apiService.parseBillFile(file);
        if (parsed && parsed.receiptUrl) {
          uploadedReceiptUrl = parsed.receiptUrl;
          uploadedReceiptId = parsed.receiptPublicId;
        }
      }

      // 1. Transaction (always)
      const tx = await addTransaction({
        type: 'expense',
        merchant: formData.merchant,
        amount: Number(formData.amount),
        category: formData.category,
        walletId: formData.walletId,
        paymentMethod: formData.paymentMethod,
        date: formData.date,
        notes: formData.notes,
        tags: formData.tags
          ? ['imported-bill', ...formData.tags.split(',').map(t => t.trim())]
          : ['imported-bill'],
        hasReceipt: true,
        receiptUrl: uploadedReceiptUrl,
        receiptPublicId: uploadedReceiptId,
      });
      result.transaction = tx;

      // 2. Recurring entry (if opted in)
      if (isRecurring) {
        const rec = await addRecurring({
          title:      formData.merchant,
          amount:     Number(formData.amount),
          category:   formData.category,
          frequency:  'Monthly',
          nextDate:   formData.date,
          walletId:   formData.walletId,
          notes:      `Auto-created from bill import: ${file?.name}`,
          autoProcess: false,
          type: 'expense',
        });
        result.recurring = rec;
      }

      // 3. Bill reminder (if opted in)
      if (trackAsBill) {
        const bl = await addBill({
          title:                formData.merchant,
          category:             mapToBillCategory(formData.category),
          billerNameOrProvider: formData.merchant,
          amount:               Number(formData.amount),
          dueDate:              billDueDate || formData.date,
          repeatMonthly:        isRecurring,
          notes:                formData.notes,
          status:               'PAID', // importing an already-paid bill
          attachedInvoiceUrl:   filePreviewUrl || null,
        });
        result.bill = bl;
      }

      setSubmitResult(result);
    } catch (err) {
      console.error('Bill import error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Which budget would be impacted?
  const matchedBudget = budgets.find(b =>
    b.category?.toLowerCase() === formData.category?.toLowerCase()
  );
  const selectedWallet = wallets.find(w => w._id === formData.walletId);

  const getFileIcon = () =>
    fileType === 'image' ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />;

  /* ── Success screen ── */
  if (submitResult) {
    const items = [
      { icon: Receipt, label: 'Transaction recorded', detail: `₹${formData.amount} • ${formData.category}`, color: 'emerald' },
      selectedWallet && { icon: Wallet, label: 'Wallet balance updated', detail: selectedWallet.name, color: 'blue' },
      matchedBudget  && { icon: PieChart, label: 'Budget spending updated', detail: `${formData.category} budget`, color: 'violet' },
      submitResult.recurring && { icon: Repeat, label: 'Recurring entry created', detail: `Monthly • ${formData.merchant}`, color: 'orange' },
      submitResult.bill      && { icon: Bell,   label: 'Bill reminder created', detail: `Next due: ${billDueDate || formData.date}`, color: 'rose' },
    ].filter(Boolean);

    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Bill Imported!" subtitle="All relevant sections have been updated" maxWidth="max-w-lg">
        <div className="space-y-5">
          {/* Animated tick */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-200"
                 style={{ animation: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Reflection list */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reflected across the app</p>
            {items.map(({ icon: Icon, label, detail, color }, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-3.5 rounded-xl bg-${color}-50 border border-${color}-100`}
                style={{ animation: `fadeSlideIn 0.35s ${i * 80}ms both ease` }}
              >
                <div className={`w-8 h-8 rounded-lg bg-${color}-100 flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 text-${color}-600`} />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold text-${color}-800`}>{label}</p>
                  <p className={`text-xs text-${color}-600`}>{detail}</p>
                </div>
                <CheckCircle2 className={`w-4 h-4 text-${color}-500 ml-auto shrink-0`} />
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={resetModal} className="flex-1">
              Import Another Bill
            </Button>
            <Button variant="primary" onClick={handleClose} className="flex-1">
              Done
            </Button>
          </div>
        </div>
        <style>{`
          @keyframes popIn { from { opacity:0; transform:scale(0.5); } to { opacity:1; transform:scale(1); } }
          @keyframes fadeSlideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        `}</style>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Bill & Add Expense"
      subtitle="Upload a receipt or bill — we'll extract data and sync it across your app"
      maxWidth="max-w-3xl"
    >
      {/* ── STAGE 1: Upload ─────────────────────────────────── */}
      {stage === 'upload' && (
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
                isDragging ? 'bg-indigo-100 text-indigo-600 scale-110' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'
              }`}>
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-800">
                  {isDragging ? 'Drop your bill here!' : 'Drag & drop your bill or click to browse'}
                </p>
                <p className="text-xs text-slate-500 mt-1.5">Supports JPG, PNG, PDF, and text files — Max 10 MB</p>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">📷 Images</span>
                <span className="px-3 py-1.5 rounded-lg bg-rose-50   text-rose-700   text-xs font-semibold border border-rose-100">📄 PDFs</span>
                <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">📝 Text Files</span>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*,.pdf,.txt,.csv,.json" onChange={handleFileSelect} className="hidden" />
          </div>

          {/* What gets updated info */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Receipt, title: 'Transaction', desc: 'Expense logged automatically', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
              { icon: Wallet,  title: 'Wallet Balance', desc: 'Deducted from linked wallet', color: 'bg-blue-50 text-blue-700 border-blue-100' },
              { icon: PieChart, title: 'Budget Spend', desc: 'Category budget auto-updated', color: 'bg-violet-50 text-violet-700 border-violet-100' },
              { icon: Repeat,  title: 'Recurring (opt-in)', desc: 'Mark as monthly bill', color: 'bg-orange-50 text-orange-700 border-orange-100' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className={`flex items-center gap-3 p-3 rounded-xl border ${color}`}>
                <Icon className="w-4 h-4 shrink-0" />
                <div>
                  <p className="text-xs font-bold">{title}</p>
                  <p className="text-[10px] opacity-75">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950">
            <ScanLine className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <strong>Smart OCR Scanner:</strong> For image bills, we run Optical Character Recognition to read the actual text — extracting merchant, amount, date, and category automatically.
            </div>
          </div>
        </div>
      )}

      {/* ── STAGE 2: Scanning ────────────────────────────────── */}
      {stage === 'scanning' && (
        <div className="flex flex-col items-center justify-center gap-6 py-12">
          {/* Animated scan icon */}
          <div className="relative w-24 h-24">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
              {fileType === 'image' ? <ImageIcon className="w-10 h-10 text-indigo-400" /> : <FileText className="w-10 h-10 text-indigo-400" />}
            </div>
            {/* Scanning beam */}
            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                 style={{ top: `${ocrProgress}%`, transition: 'top 0.3s ease' }} />
          </div>

          <div className="text-center space-y-1">
            <p className="text-base font-bold text-slate-800">{ocrStatus || 'Analyzing bill…'}</p>
            <p className="text-xs text-slate-500">{file?.name}</p>
          </div>

          {/* Progress bar */}
          <div className="w-64 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${ocrProgress}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">{ocrProgress}% complete</p>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>
              {fileType === 'image'
                ? 'Running OCR on your bill image…'
                : fileType === 'pdf'
                  ? 'Parsing PDF metadata…'
                  : 'Extracting text data…'}
            </span>
          </div>
        </div>
      )}

      {/* ── STAGE 3: Confirm ─────────────────────────────────── */}
      {stage === 'confirm' && (
        <div className="space-y-5">
          {/* Extraction confidence banner */}
          <div className={`flex items-center gap-3 p-3.5 rounded-xl border text-xs font-medium ${
            Object.keys(extractedData).length >= 2
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            {Object.keys(extractedData).length >= 2
              ? <><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Auto-detected <strong>{Object.keys(extractedData).length}</strong> fields. Review and adjust below before saving.</span></>
              : <><AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Limited data detected. Please fill in the expense details manually.</span></>
            }
            <button
              type="button"
              onClick={() => { setFile(null); setStage('upload'); resetModal(); }}
              className="ml-auto flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Re-upload
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* ── Left: Bill Preview ── */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
              <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center gap-2 min-w-0">
                {getFileIcon()}
                <span className="text-xs font-bold text-slate-800 truncate flex-1">{file?.name}</span>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">{(file?.size / 1024).toFixed(1)} KB</span>
              </div>
              <div className="p-4 flex items-center justify-center min-h-[260px] max-h-[360px] overflow-auto">
                {fileType === 'image' && filePreviewUrl && (
                  <img src={filePreviewUrl} alt="Bill preview" className="max-w-full max-h-[340px] rounded-xl shadow-md object-contain" />
                )}
                {fileType === 'pdf' && (
                  <div className="flex flex-col items-center gap-3 text-slate-500">
                    <FileText className="w-16 h-16 text-rose-400" />
                    <p className="text-xs font-semibold text-slate-700">{file?.name}</p>
                    <a href={filePreviewUrl} target="_blank" rel="noopener noreferrer"
                       className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100 hover:bg-indigo-100 transition-colors">
                      <Eye className="w-3.5 h-3.5" /> Open PDF in New Tab
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
                    <p className="text-xs font-medium">Preview not available.</p>
                  </div>
                )}
              </div>

              {/* Data Reflection Preview */}
              <div className="px-4 pb-4 space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Will update these sections:</p>
                <div className="space-y-1.5">
                  <ReflectionBadge icon={Receipt}  label="Transactions" detail={`₹${formData.amount || '—'} expense recorded`}  color="emerald" />
                  {selectedWallet && <ReflectionBadge icon={Wallet}   label="Wallet Balance" detail={`${selectedWallet.name} balance decreases`} color="blue" />}
                  {matchedBudget  && <ReflectionBadge icon={PieChart} label="Budget Spending" detail={`${formData.category} budget updated`}       color="violet" />}
                  {isRecurring    && <ReflectionBadge icon={Repeat}   label="Recurring"      detail={`Monthly ${formData.merchant} entry`}          color="orange" />}
                  {trackAsBill    && <ReflectionBadge icon={Bell}     label="Bill Reminders" detail={`Due ${billDueDate || formData.date}`}          color="rose" />}
                </div>
              </div>
            </div>

            {/* ── Right: Form ── */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Expense Details
              </p>

              {/* Merchant */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Merchant / Vendor <span className="text-red-500">*</span>
                </label>
                <input type="text" name="merchant" value={formData.merchant} onChange={handleChange}
                  placeholder="e.g. Tata Power, Zomato, Amazon" className="input-field" />
                {errors.merchant && <p className="text-xs text-red-500 mt-1 font-medium">{errors.merchant}</p>}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Bill Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input type="number" step="any" name="amount" value={formData.amount} onChange={handleChange}
                  placeholder="0.00" className="input-field text-lg font-bold" />
                {errors.amount && <p className="text-xs text-red-500 mt-1 font-medium">{errors.amount}</p>}
              </div>

              {/* Category & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Category</label>
                  <select name="category" value={formData.category} onChange={handleChange} className="input-field cursor-pointer text-xs">
                    {EXPENSE_CATEGORIES.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Bill Date</label>
                  <input type="date" name="date" value={formData.date} onChange={handleChange} className="input-field text-xs" />
                </div>
              </div>

              {/* Wallet & Payment Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Pay From Wallet <span className="text-red-500">*</span>
                  </label>
                  <select name="walletId" value={formData.walletId} onChange={handleChange} className="input-field cursor-pointer text-xs">
                    <option value="">— Select wallet —</option>
                    {wallets.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                  </select>
                  {errors.walletId && <p className="text-xs text-red-500 mt-1 font-medium">{errors.walletId}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Payment Method</label>
                  <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="input-field cursor-pointer text-xs">
                    {PAYMENT_METHODS.map(pm => <option key={pm.id} value={pm.name}>{pm.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Notes</label>
                <input type="text" name="notes" value={formData.notes} onChange={handleChange} className="input-field text-xs" />
              </div>

              {/* ── Extra Reflections Section ── */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-600" /> Also reflect to…
                </p>

                {/* Recurring toggle */}
                <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  isRecurring ? 'bg-orange-50 border-orange-300' : 'bg-slate-50 border-slate-200 hover:border-orange-200'
                }`}>
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={e => setIsRecurring(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-orange-500 border-slate-300 focus:ring-orange-500 cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Repeat className="w-3.5 h-3.5 text-orange-600" />
                      <p className="text-xs font-bold text-orange-800">Add as Monthly Recurring Bill</p>
                      {isRecurring && <span className="text-[9px] px-1.5 py-0.5 bg-orange-200 text-orange-700 rounded-full font-bold">AUTO-DETECTED</span>}
                    </div>
                    <p className="text-[11px] text-orange-600 mt-0.5">Creates a recurring entry in the Recurring section for this monthly bill</p>
                  </div>
                </label>

                {/* Bill reminder toggle */}
                <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  trackAsBill ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-slate-200 hover:border-rose-200'
                }`}>
                  <input
                    type="checkbox"
                    checked={trackAsBill}
                    onChange={e => setTrackAsBill(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-rose-500 border-slate-300 focus:ring-rose-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-rose-600" />
                      <p className="text-xs font-bold text-rose-800">Track as Bill Reminder</p>
                    </div>
                    <p className="text-[11px] text-rose-600 mt-0.5">Creates a bill record with due date for future tracking</p>
                    {trackAsBill && (
                      <div className="mt-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-rose-700 mb-1 block">Next Due Date</label>
                        <input
                          type="date"
                          value={billDueDate}
                          onChange={e => setBillDueDate(e.target.value)}
                          className="input-field text-xs py-1.5"
                          onClick={e => e.preventDefault()}
                        />
                      </div>
                    )}
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <Button variant="secondary" type="button" onClick={handleClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={isSubmitting}>
                  {isSubmitting ? 'Saving…' : 'Confirm & Sync All'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes popIn { from { opacity:0; transform:scale(0.5); } to { opacity:1; transform:scale(1); } }
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </Modal>
  );
};

/* ─── tiny helper component ─────────────────────────────────── */
const ReflectionBadge = ({ icon: Icon, label, detail, color }) => (
  <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-${color}-50 border border-${color}-100`}>
    <Icon className={`w-3 h-3 text-${color}-600 shrink-0`} />
    <span className={`text-[10px] font-semibold text-${color}-800`}>{label}:</span>
    <span className={`text-[10px] text-${color}-600 truncate`}>{detail}</span>
  </div>
);

export default BillImportModal;
