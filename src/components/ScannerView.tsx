import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  FileSpreadsheet,
  Check,
  AlertCircle,
  RefreshCw,
  Trash2,
  Plus,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Zap,
  Image as ImageIcon,
  DollarSign,
  Tag,
  Calendar,
  Store,
  CreditCard,
  FileText,
} from 'lucide-react';
import { ParsedReceiptData, ParsedReceiptItem, SpreadsheetInfo } from '../types';
import { SAMPLE_RECEIPTS, SampleReceipt } from '../data/sampleReceipts';

interface ScannerViewProps {
  spreadsheet: SpreadsheetInfo | null;
  onSyncReceiptToSheet: (receipt: ParsedReceiptData) => Promise<boolean>;
  onOpenSpreadsheetModal: () => void;
  onNavigateToDashboard: () => void;
  isSignedIn: boolean;
  onSignIn: () => void;
}

const CATEGORIES = [
  'Meals & Dining',
  'Travel & Transportation',
  'Office Supplies',
  'Software & SaaS',
  'Utilities & Bills',
  'Marketing & Ads',
  'Client Entertainment',
  'Facilities & Rent',
  'Professional Services',
  'Other Expenses',
];

const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'PHP', symbol: '₱' },
  { code: 'CAD', symbol: 'CA$' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'JPY', symbol: '¥' },
  { code: 'SGD', symbol: 'S$' },
];

export const ScannerView: React.FC<ScannerViewProps> = ({
  spreadsheet,
  onSyncReceiptToSheet,
  onOpenSpreadsheetModal,
  onNavigateToDashboard,
  isSignedIn,
  onSignIn,
}) => {
  const [inputMode, setInputMode] = useState<'camera' | 'upload'>('upload');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const [isParsing, setIsParsing] = useState(false);
  const [parsingStage, setParsingStage] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);

  const [activeReceipt, setActiveReceipt] = useState<ParsedReceiptData | null>(null);
  const [receiptImagePreview, setReceiptImagePreview] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [recentScans, setRecentScans] = useState<ParsedReceiptData[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera stream when camera mode is active
  useEffect(() => {
    if (inputMode === 'camera' && cameraActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [inputMode, cameraActive, facingMode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access unavailable or denied. Please use the file upload option or sample receipts.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture frame from live video
  const captureFromVideo = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    stopCamera();
    setCameraActive(false);
    processReceiptImage(dataUrl, 'image/jpeg');
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        processReceiptImage(result, file.type || 'image/jpeg');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Process sample receipt
  const handleSelectSample = (sample: SampleReceipt) => {
    setReceiptImagePreview(sample.svgImage);
    const mockParsed: ParsedReceiptData = {
      id: 'rec_' + Date.now(),
      merchantName: sample.vendor,
      date: sample.date,
      totalAmount: sample.total,
      subtotal: sample.total - sample.tax,
      taxAmount: sample.tax,
      tipAmount: sample.tip,
      currency: sample.currency,
      currencySymbol: sample.currencySymbol,
      paymentMethod: sample.paymentMethod,
      category: sample.category,
      items: sample.items,
      notes: sample.notes,
      invoiceNumber: sample.invoiceNumber,
      confidenceScore: 0.98,
      createdAt: new Date().toISOString(),
      sheetSynced: false,
      receiptImageUrl: sample.svgImage,
    };
    setActiveReceipt(mockParsed);
    setSyncSuccess(false);
    setParseError(null);
  };

  // Send image to backend Gemini parser
  const processReceiptImage = async (base64Data: string, mimeType: string) => {
    setReceiptImagePreview(base64Data);
    setIsParsing(true);
    setParseError(null);
    setSyncSuccess(false);
    setActiveReceipt(null);

    try {
      setParsingStage('Analyzing receipt boundaries and optical characters...');
      await new Promise((r) => setTimeout(r, 600));

      setParsingStage('Extracting merchant, line items, totals, and tax figures...');
      const response = await fetch('/api/parse-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Data, mimeType }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned ${response.statusText}`);
      }

      const res = await response.json();
      if (!res.success || !res.data) {
        throw new Error(res.error || 'Failed to parse receipt data');
      }

      setParsingStage('Classifying expense category and finalizing data...');
      await new Promise((r) => setTimeout(r, 300));

      const parsed: ParsedReceiptData = {
        ...res.data,
        receiptImageUrl: base64Data,
      };

      setActiveReceipt(parsed);
      setRecentScans((prev) => [parsed, ...prev.slice(0, 5)]);
    } catch (err: any) {
      console.error('Receipt parse failed:', err);
      setParseError(err.message || 'Could not parse receipt. Please verify image clarity and try again.');
    } finally {
      setIsParsing(false);
      setParsingStage('');
    }
  };

  // Sync to Google Sheet
  const handleSyncToSheet = async () => {
    if (!activeReceipt) return;
    if (!isSignedIn) {
      onSignIn();
      return;
    }

    setIsSyncing(true);
    try {
      const ok = await onSyncReceiptToSheet(activeReceipt);
      if (ok) {
        setSyncSuccess(true);
        setActiveReceipt((prev) => (prev ? { ...prev, sheetSynced: true } : null));
        setRecentScans((prev) =>
          prev.map((r) => (r.id === activeReceipt.id ? { ...r, sheetSynced: true } : r))
        );
      }
    } catch (err: any) {
      alert(`Sync Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Field updates on active receipt
  const updateField = (field: keyof ParsedReceiptData, val: any) => {
    if (!activeReceipt) return;
    setActiveReceipt({
      ...activeReceipt,
      [field]: val,
    });
  };

  const updateItem = (index: number, key: keyof ParsedReceiptItem, val: any) => {
    if (!activeReceipt) return;
    const newItems = [...activeReceipt.items];
    newItems[index] = {
      ...newItems[index],
      [key]: val,
    };
    // Recalculate item total if quantity or unit price changed
    if (key === 'quantity' || key === 'unitPrice') {
      newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
    }
    setActiveReceipt({
      ...activeReceipt,
      items: newItems,
    });
  };

  const addItem = () => {
    if (!activeReceipt) return;
    setActiveReceipt({
      ...activeReceipt,
      items: [
        ...activeReceipt.items,
        { description: 'New Item', quantity: 1, unitPrice: 0, totalPrice: 0 },
      ],
    });
  };

  const removeItem = (index: number) => {
    if (!activeReceipt) return;
    setActiveReceipt({
      ...activeReceipt,
      items: activeReceipt.items.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Banner: Focused Scanner Interface */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Camera className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Receipt Capture & Instant Sync
            </h2>
          </div>
          <p className="text-sm text-slate-400">
            Snap or upload any receipt, invoice, or voucher. Gemini AI parses the details and logs them straight to your Google Sheet.
          </p>
        </div>

        {/* Google Sheet Sync Target */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {spreadsheet ? (
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-xs">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Logging to Sheet
                </span>
                <span className="font-semibold text-emerald-300 max-w-[180px] truncate block">
                  {spreadsheet.name}
                </span>
              </div>
              {spreadsheet.webViewLink && (
                <a
                  href={spreadsheet.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-slate-400 hover:text-emerald-400 rounded transition-colors"
                  title="Open Sheet in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenSpreadsheetModal}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition-colors flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Connect Google Sheet
            </button>
          )}
        </div>
      </div>

      {/* Main Scanner Section: Left = Input / Camera / Samples | Right = Extracted Review Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Capture Controls & Viewfinder (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Capture Mode Tabs */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Capture Receipt
              </span>
              <div className="flex p-0.5 rounded-lg bg-slate-950 border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setInputMode('upload');
                    stopCamera();
                    setCameraActive(false);
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    inputMode === 'upload'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  File Upload
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInputMode('camera');
                    setCameraActive(true);
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    inputMode === 'camera'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Camera Scan
                </button>
              </div>
            </div>

            {/* Camera Viewfinder Mode */}
            {inputMode === 'camera' && (
              <div className="relative rounded-xl overflow-hidden bg-black border border-slate-700 aspect-[3/4] flex flex-col items-center justify-center">
                {cameraActive && !cameraError ? (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Viewfinder Target Framing Guides */}
                    <div className="absolute inset-8 pointer-events-none border-2 border-dashed border-emerald-400/60 rounded-xl flex flex-col justify-between p-4">
                      <div className="flex justify-between items-start">
                        <div className="w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-sm" />
                        <div className="w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-sm" />
                      </div>

                      {/* Animated Laser Scanning Beam */}
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-pulse" />

                      <div className="flex justify-between items-end">
                        <div className="w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-sm" />
                        <div className="w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-sm" />
                      </div>
                    </div>

                    <div className="absolute bottom-4 left-0 right-0 px-6 flex items-center justify-between z-10">
                      <button
                        type="button"
                        onClick={toggleFacingMode}
                        className="p-3 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 backdrop-blur-md transition-colors"
                        title="Switch Camera"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>

                      {/* Snap Button */}
                      <button
                        type="button"
                        onClick={captureFromVideo}
                        className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 border-4 border-white shadow-xl shadow-emerald-500/40 flex items-center justify-center transition-transform active:scale-95 group"
                      >
                        <Camera className="w-7 h-7 text-slate-950 group-hover:scale-110 transition-transform" />
                      </button>

                      <div className="w-11" />
                    </div>
                  </>
                ) : (
                  <div className="p-6 text-center space-y-3">
                    <Camera className="w-10 h-10 text-slate-500 mx-auto" />
                    <p className="text-xs text-slate-400 max-w-xs">
                      {cameraError || 'Camera inactive. Click below to initialize camera stream.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setCameraActive(true);
                        startCamera();
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 shadow-md transition-colors"
                    >
                      Start Camera Viewfinder
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* File Upload / Drag & Drop Mode */}
            {inputMode === 'upload' && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const result = ev.target?.result as string;
                        if (result) processReceiptImage(result, file.type || 'image/jpeg');
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="border-2 border-dashed border-slate-700 hover:border-emerald-500/80 rounded-xl p-8 text-center cursor-pointer transition-all hover:bg-slate-950/40 group flex flex-col items-center justify-center min-h-[220px]"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform border border-emerald-500/20">
                    <Upload className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-semibold text-slate-200">
                    Click to browse or drop receipt photo
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports JPG, PNG, WEBP, HEIC from phone or desktop
                  </p>
                </div>
              </div>
            )}

            {/* Instant Test Samples Bar */}
            <div className="pt-3 border-t border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-slate-300">Or try a sample receipt:</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_RECEIPTS.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    className="p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 truncate group-hover:text-emerald-300">
                        {sample.title}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        ${sample.total.toFixed(2)}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 truncate block mt-0.5">
                      {sample.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recently Scanned Queue */}
          {recentScans.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Recent Scans in This Session
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {recentScans.length} receipts
                </span>
              </div>

              <div className="space-y-2">
                {recentScans.map((scan) => (
                  <div
                    key={scan.id}
                    onClick={() => {
                      setActiveReceipt(scan);
                      if (scan.receiptImageUrl) setReceiptImagePreview(scan.receiptImageUrl);
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      activeReceipt?.id === scan.id
                        ? 'bg-emerald-950/30 border-emerald-500/50'
                        : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-white truncate">{scan.merchantName}</p>
                      <p className="text-[11px] text-slate-400">{scan.date} • {scan.category}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono font-bold text-white">
                        {scan.currencySymbol}{scan.totalAmount.toFixed(2)}
                      </p>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                          scan.sheetSynced
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {scan.sheetSynced ? 'Synced to Sheet' : 'Pending Sync'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Extraction & Verification Inspector (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Parsing Loading State */}
          {isParsing && (
            <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-8 shadow-xl text-center space-y-6 animate-pulse">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 p-1 flex items-center justify-center">
                  <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-emerald-400 animate-spin" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">
                  Gemini Vision OCR Processing
                </h3>
                <p className="text-sm text-emerald-300 font-medium">
                  {parsingStage}
                </p>
              </div>

              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 animate-pulse w-3/4 rounded-full" />
              </div>
            </div>
          )}

          {/* Parse Error Alert */}
          {parseError && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-rose-200">Receipt Extraction Failed</p>
                <p className="mt-0.5 text-xs text-rose-300/90">{parseError}</p>
              </div>
            </div>
          )}

          {/* Sync Success Celebration Banner */}
          {syncSuccess && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/40 text-emerald-200 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">
                      Logged Successfully to Google Sheet!
                    </h4>
                    <p className="text-xs text-emerald-300">
                      Appended as new row in tab &quot;{spreadsheet?.sheetTitle || 'Expenses'}&quot;
                    </p>
                  </div>
                </div>

                {spreadsheet?.webViewLink && (
                  <a
                    href={spreadsheet.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors shadow-md"
                  >
                    Open in Sheets
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-emerald-500/20 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setActiveReceipt(null);
                    setReceiptImagePreview(null);
                    setSyncSuccess(false);
                  }}
                  className="text-slate-300 hover:text-white underline underline-offset-4"
                >
                  Scan another receipt
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={onNavigateToDashboard}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                >
                  View in Expense Dashboard
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Active Receipt Verification Form */}
          {activeReceipt && !isParsing && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
                    <FileText className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-bold text-white">
                    2. Verify &amp; Edit Parsed Data
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-emerald-400" />
                    {Math.round(activeReceipt.confidenceScore * 100)}% Accuracy
                  </span>
                </div>
              </div>

              {/* Receipt Preview Thumbnail (if available) */}
              {receiptImagePreview && (
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-4">
                  <div className="w-16 h-20 rounded-lg overflow-hidden border border-slate-700 shrink-0 bg-white flex items-center justify-center">
                    <img
                      src={receiptImagePreview}
                      alt="Receipt visual preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 text-xs space-y-1">
                    <p className="font-semibold text-slate-200 truncate">
                      {activeReceipt.merchantName}
                    </p>
                    <p className="text-slate-400">
                      Scanned visual receipt • {activeReceipt.date}
                    </p>
                    <p className="text-[11px] text-emerald-400 font-mono font-bold">
                      Detected Total: {activeReceipt.currencySymbol}
                      {activeReceipt.totalAmount.toFixed(2)} {activeReceipt.currency}
                    </p>
                  </div>
                </div>
              )}

              {/* Editable Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Merchant Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-slate-400" />
                    Merchant / Vendor
                  </label>
                  <input
                    type="text"
                    value={activeReceipt.merchantName}
                    onChange={(e) => updateField('merchantName', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-white font-medium outline-none"
                    placeholder="e.g. Starbucks, Uber, Home Depot"
                  />
                </div>

                {/* Transaction Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={activeReceipt.date}
                    onChange={(e) => updateField('date', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-white font-medium outline-none"
                  />
                </div>

                {/* Total Amount & Currency */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                    Total Amount
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={activeReceipt.currency}
                      onChange={(e) => {
                        const found = CURRENCIES.find((c) => c.code === e.target.value);
                        updateField('currency', e.target.value);
                        if (found) updateField('currencySymbol', found.symbol);
                      }}
                      className="px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 outline-none font-bold"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} ({c.symbol})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      value={activeReceipt.totalAmount}
                      onChange={(e) =>
                        updateField('totalAmount', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-emerald-400 font-mono font-bold outline-none"
                    />
                  </div>
                </div>

                {/* Expense Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    Category
                  </label>
                  <select
                    value={activeReceipt.category}
                    onChange={(e) => updateField('category', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-white font-medium outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tax Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Tax / VAT Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={activeReceipt.taxAmount || 0}
                    onChange={(e) =>
                      updateField('taxAmount', parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-sm text-slate-200 font-mono outline-none"
                  />
                </div>

                {/* Payment Method */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    Payment Method
                  </label>
                  <input
                    type="text"
                    value={activeReceipt.paymentMethod}
                    onChange={(e) => updateField('paymentMethod', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-sm text-slate-200 font-medium outline-none"
                    placeholder="e.g. Visa, Amex, Cash"
                  />
                </div>
              </div>

              {/* Line Items Breakdown */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Itemized Breakdown ({activeReceipt.items.length})
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {activeReceipt.items.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">
                      No line items extracted. You can add items or sync the total amount directly.
                    </p>
                  ) : (
                    activeReceipt.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800/80"
                      >
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(idx, 'quantity', parseInt(e.target.value, 10) || 1)
                          }
                          className="w-12 px-2 py-1 text-center rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white outline-none"
                          title="Qty"
                        />
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(idx, 'description', e.target.value)}
                          className="flex-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white outline-none"
                          placeholder="Item description"
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-slate-500">
                            {activeReceipt.currencySymbol}
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            value={item.totalPrice}
                            onChange={(e) =>
                              updateItem(idx, 'totalPrice', parseFloat(e.target.value) || 0)
                            }
                            className="w-20 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-emerald-400 outline-none font-semibold text-right"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Notes / Invoice Reference */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-slate-400">
                  Notes / Receipt # / Tax Remarks
                </label>
                <input
                  type="text"
                  value={activeReceipt.notes || ''}
                  onChange={(e) => updateField('notes', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 outline-none"
                  placeholder="Optional expense memo, reference code, client name..."
                />
              </div>

              {/* Primary Sync Button */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveReceipt(null);
                    setReceiptImagePreview(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 transition-colors"
                >
                  Discard / Reset
                </button>

                <button
                  type="button"
                  onClick={handleSyncToSheet}
                  disabled={isSyncing}
                  className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Appending to Google Sheet...
                    </>
                  ) : activeReceipt.sheetSynced ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      Re-Sync to Google Sheet
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" />
                      Log to Google Sheet
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Empty State when no receipt is scanned */}
          {!activeReceipt && !isParsing && (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
                <ImageIcon className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-200">
                  Ready to Scan Receipts
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Take a photo with your camera, drop a receipt image, or choose one of the sample receipts to inspect the extraction in real time.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
