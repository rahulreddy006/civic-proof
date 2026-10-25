import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Upload,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Clock,
  FileText,
  Image as ImageIcon,
  Copy,
  Check,
  X,
  Send,
  Sparkles,
  HelpCircle,
  Info,
  ArrowRight,
  RotateCcw,
  Edit3,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3 MB
const MAX_TOTAL_SIZE = 9 * 1024 * 1024; // 9 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Base URL for API requests: in production (Vercel) this points to Render backend;
// in development (or if unset), defaults to empty string so relative paths work with Vite proxy.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export default function App() {
  // System Health
  const [health, setHealth] = useState({
    loading: true,
    online: false,
    hasApiKey: false,
    model: 'gemma-4-26b-a4b-it',
    error: null
  });

  // Evidence Inputs State
  const [evidence, setEvidence] = useState({
    originalImage: null,
    closureEvidence: null,
    currentImage: null
  });

  // Image Object URL Previews
  const [previews, setPreviews] = useState({
    originalImage: null,
    closureEvidence: null,
    currentImage: null
  });

  // Validation Errors per Field
  const [fieldErrors, setFieldErrors] = useState({
    originalImage: null,
    closureEvidence: null,
    currentImage: null
  });

  // Closure Context Text
  const [closureText, setClosureText] = useState('');

  // Analysis / Request State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Editable Follow-Up Message State
  const [editableMessage, setEditableMessage] = useState('');

  // Copy Feedback
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // File Input Refs for Triggering Picker
  const originalInputRef = useRef(null);
  const closureInputRef = useRef(null);
  const currentInputRef = useRef(null);

  // Fetch backend health on mount
  useEffect(() => {
    checkHealth();
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(previews).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  const checkHealth = async () => {
    setHealth(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/api/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHealth({
        loading: false,
        online: true,
        hasApiKey: Boolean(data.hasApiKey),
        model: data.model || 'gemma-4-26b-a4b-it',
        error: null
      });
    } catch (err) {
      setHealth({
        loading: false,
        online: false,
        hasApiKey: false,
        model: 'gemma-4-26b-a4b-it',
        error: 'Backend is offline or unreachable at http://localhost:5000'
      });
    }
  };

  // Format bytes to human readable string
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Handle File Selection
  const handleFileChange = (field, file) => {
    if (!file) return;

    // Reset error for this field
    setFieldErrors(prev => ({ ...prev, [field]: null }));
    setGlobalError(null);

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: `Invalid format (${file.type || 'unknown'}). Only JPEG, PNG, and WebP are allowed.`
      }));
      return;
    }

    // Validate individual file size
    if (file.size > MAX_IMAGE_SIZE) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: `File exceeds 3 MB limit (${formatFileSize(file.size)}). Please choose a smaller image.`
      }));
      return;
    }

    // Check total combined size
    const currentTotal = Object.entries(evidence).reduce((acc, [k, f]) => {
      if (k === field) return acc + file.size;
      return acc + (f ? f.size : 0);
    }, 0);

    if (currentTotal > MAX_TOTAL_SIZE) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: `Total evidence size (${formatFileSize(currentTotal)}) would exceed the 9 MB combined limit.`
      }));
      return;
    }

    // Revoke previous preview URL for this field if present
    if (previews[field]) {
      URL.revokeObjectURL(previews[field]);
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviews(prev => ({ ...prev, [field]: objectUrl }));
    setEvidence(prev => ({ ...prev, [field]: file }));
  };

  // Remove File
  const handleRemoveFile = (field) => {
    if (previews[field]) {
      URL.revokeObjectURL(previews[field]);
    }
    setPreviews(prev => ({ ...prev, [field]: null }));
    setEvidence(prev => ({ ...prev, [field]: null }));
    setFieldErrors(prev => ({ ...prev, [field]: null }));

    // Reset corresponding input element
    if (field === 'originalImage' && originalInputRef.current) originalInputRef.current.value = '';
    if (field === 'closureEvidence' && closureInputRef.current) closureInputRef.current.value = '';
    if (field === 'currentImage' && currentInputRef.current) currentInputRef.current.value = '';
  };

  // Drag and Drop helpers
  const handleDrop = (field, e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(field, file);
  };

  const handleDragOver = (e) => e.preventDefault();

  // Readiness calculation
  const isReady = Boolean(
    evidence.originalImage &&
    evidence.closureEvidence &&
    evidence.currentImage &&
    !fieldErrors.originalImage &&
    !fieldErrors.closureEvidence &&
    !fieldErrors.currentImage
  );

  // Submit Evidence for Analysis
  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!isReady || isAnalyzing) return;

    setIsAnalyzing(true);
    setGlobalError(null);

    const formData = new FormData();
    formData.append('originalImage', evidence.originalImage);
    formData.append('closureEvidence', evidence.closureEvidence);
    formData.append('currentImage', evidence.currentImage);
    if (closureText.trim()) {
      formData.append('closureText', closureText.trim());
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/analyze-civic-evidence`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (!res.ok || data.status === 'error') {
        const errorMsg = data.error?.message || `Server returned error status ${res.status}`;
        throw new Error(errorMsg);
      }

      setAnalysisResult(data.data);
      setEditableMessage(data.data.suggestedFollowUp || '');
      // Scroll to results
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setGlobalError(err.message || 'An unexpected error occurred during evidence analysis. Please check your network or try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset entire review
  const handleReset = () => {
    Object.values(previews).forEach(url => {
      if (url) URL.revokeObjectURL(url);
    });
    setEvidence({ originalImage: null, closureEvidence: null, currentImage: null });
    setPreviews({ originalImage: null, closureEvidence: null, currentImage: null });
    setFieldErrors({ originalImage: null, closureEvidence: null, currentImage: null });
    setClosureText('');
    setAnalysisResult(null);
    setEditableMessage('');
    setGlobalError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Copy Follow-up Message
  const handleCopyMessage = () => {
    if (!editableMessage) return;
    navigator.clipboard.writeText(editableMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  // Copy Full Evidence Summary Report
  const handleCopySummary = () => {
    if (!analysisResult) return;
    const report = [
      `CIVICPROOF EVIDENCE REVIEW REPORT`,
      `Generated: ${new Date().toLocaleString()}`,
      `AI Model: ${analysisResult.model || health.model}`,
      `--------------------------------------------------`,
      `ASSESSMENT STATUS: ${analysisResult.status.toUpperCase()}`,
      `SUMMARY: ${analysisResult.summary}`,
      ``,
      `1. ORIGINAL REPORT OBSERVATIONS:`,
      ...analysisResult.originalObservations.map(o => `  • ${o}`),
      ``,
      `2. CLOSURE CLAIM DETAILS:`,
      `  ${analysisResult.closureClaim}`,
      ``,
      `3. CURRENT CONDITION OBSERVATIONS:`,
      ...analysisResult.currentObservations.map(o => `  • ${o}`),
      ``,
      `4. EVIDENCE COMPARISON:`,
      `  ${analysisResult.evidenceComparison}`,
      ``,
      `5. UNCERTAINTIES & LIMITATIONS:`,
      ...analysisResult.uncertainties.map(u => `  • Uncertainty: ${u}`),
      ...analysisResult.limitations.map(l => `  • Limitation: ${l}`),
      ``,
      `6. SUGGESTED FOLLOW-UP MESSAGE:`,
      editableMessage || analysisResult.suggestedFollowUp,
      `--------------------------------------------------`,
      `Note: This advisory review is based strictly on citizen-provided visual evidence and closure notes.`
    ].join('\n');

    navigator.clipboard.writeText(report);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  // Helper for Status Badge Display
  const getStatusConfig = (status) => {
    switch (status) {
      case 'still_visible':
        return {
          label: 'Still Visible',
          badgeClass: 'bg-amber-50 text-amber-900 border-amber-300',
          icon: AlertCircle,
          iconColor: 'text-amber-600',
          description: 'The reported civic concern appears to remain visible in the current evidence.'
        };
      case 'partly_resolved':
        return {
          label: 'Partly Resolved',
          badgeClass: 'bg-teal-50 text-teal-900 border-teal-300',
          icon: Clock,
          iconColor: 'text-teal-600',
          description: 'The concern appears to have improved, but a relevant portion remains visible.'
        };
      case 'appears_resolved':
        return {
          label: 'Appears Resolved',
          badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-300',
          icon: CheckCircle2,
          iconColor: 'text-emerald-600',
          description: 'The original visible concern does not appear to remain in the supplied current evidence.'
        };
      case 'inconclusive':
      default:
        return {
          label: 'Inconclusive',
          badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
          icon: HelpCircle,
          iconColor: 'text-slate-600',
          description: 'The available evidence does not support a reliable comparison (e.g. angle differences or missing context).'
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-700 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">CivicProof</span>
                <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  Citizen Review
                </span>
              </div>
              <p className="text-xs text-slate-500">Evidence that speaks for your neighbourhood</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-600 font-mono">
              <Cpu className="w-3.5 h-3.5 text-teal-700" />
              <span>{health.model}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs">
              <span className={`w-2 h-2 rounded-full ${health.online ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className="text-slate-600">{health.online ? 'Service Active' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        {/* Hero & Intro Section */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="max-w-3xl space-y-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Help make your civic complaint evidence clear.
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">
              Bring together the original issue, the closure message, and the current condition.
              Prepare your evidence for a clear, factual follow-up.
            </p>

            <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="font-bold text-teal-700">1.</span>
                <span>Original complaint photo</span>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="font-bold text-teal-700">2.</span>
                <span>Closure notice screenshot</span>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="font-bold text-teal-700">3.</span>
                <span>Current condition photo</span>
              </div>
            </div>

            {/* Privacy notice */}
            <div className="pt-2 flex items-center gap-2 text-xs text-slate-500">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                <strong>Privacy notice:</strong> Uploaded images are transmitted to the server-side Gemma AI model for analysis and are not retained permanently.
              </span>
            </div>
          </div>
        </section>

        {/* Global Error Banner */}
        {globalError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Analysis Request Error</p>
              <p className="text-xs text-rose-700">{globalError}</p>
            </div>
          </div>
        )}

        {/* Upload Form Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Upload Evidence</h2>
              <p className="text-xs text-slate-500">
                Provide all three evidence items below. JPEG, PNG, or WebP up to 3 MB each.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                isReady
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {isReady ? 'Ready for Analysis' : '3 Images Required'}
              </span>
            </div>
          </div>

          {/* Three Evidence Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Input A: Original Issue Photo */}
            <div className={`bg-white rounded-xl border p-4 flex flex-col justify-between transition-all ${
              fieldErrors.originalImage ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200 shadow-xs'
            }`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    Input A
                  </span>
                  {evidence.originalImage && (
                    <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Added
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-slate-900">Original issue</h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Upload the photograph that shows the issue when it was first reported.
                  </p>
                </div>

                {/* Dropzone or Preview */}
                {!previews.originalImage ? (
                  <div
                    onDrop={(e) => handleDrop('originalImage', e)}
                    onDragOver={handleDragOver}
                    onClick={() => originalInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-teal-500 hover:bg-teal-50/20 transition-all rounded-lg p-6 text-center cursor-pointer flex flex-col items-center justify-center min-h-[140px]"
                  >
                    <input
                      ref={originalInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handleFileChange('originalImage', e.target.files?.[0])}
                    />
                    <Upload className="w-6 h-6 text-slate-400 mb-2" />
                    <span className="text-xs font-medium text-slate-700">Click or drop image</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">JPEG, PNG, WebP (max 3 MB)</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="h-36 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center relative group">
                      <img
                        src={previews.originalImage}
                        alt="Original report"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                      <span className="truncate max-w-[150px] font-medium">{evidence.originalImage?.name}</span>
                      <span className="text-slate-400 font-mono">{formatFileSize(evidence.originalImage?.size)}</span>
                    </div>
                  </div>
                )}

                {fieldErrors.originalImage && (
                  <p className="text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.originalImage}</span>
                  </p>
                )}
              </div>

              {previews.originalImage && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => originalInputRef.current?.click()}
                    className="text-xs text-slate-600 hover:text-teal-700 font-medium py-1 px-2 rounded hover:bg-slate-100 transition"
                  >
                    Replace
                  </button>
                  <input
                    ref={originalInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handleFileChange('originalImage', e.target.files?.[0])}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFile('originalImage')}
                    className="text-xs text-rose-600 hover:text-rose-800 font-medium py-1 px-2 rounded hover:bg-rose-50 transition"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Input B: Closure Evidence */}
            <div className={`bg-white rounded-xl border p-4 flex flex-col justify-between transition-all ${
              fieldErrors.closureEvidence ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200 shadow-xs'
            }`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    Input B
                  </span>
                  {evidence.closureEvidence && (
                    <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Added
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-slate-900">Closure evidence</h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Upload the closure notification or screenshot showing the reported status.
                  </p>
                </div>

                {/* Dropzone or Preview */}
                {!previews.closureEvidence ? (
                  <div
                    onDrop={(e) => handleDrop('closureEvidence', e)}
                    onDragOver={handleDragOver}
                    onClick={() => closureInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-teal-500 hover:bg-teal-50/20 transition-all rounded-lg p-6 text-center cursor-pointer flex flex-col items-center justify-center min-h-[140px]"
                  >
                    <input
                      ref={closureInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handleFileChange('closureEvidence', e.target.files?.[0])}
                    />
                    <Upload className="w-6 h-6 text-slate-400 mb-2" />
                    <span className="text-xs font-medium text-slate-700">Click or drop screenshot</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">JPEG, PNG, WebP (max 3 MB)</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="h-36 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center relative group">
                      <img
                        src={previews.closureEvidence}
                        alt="Closure notification"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                      <span className="truncate max-w-[150px] font-medium">{evidence.closureEvidence?.name}</span>
                      <span className="text-slate-400 font-mono">{formatFileSize(evidence.closureEvidence?.size)}</span>
                    </div>
                  </div>
                )}

                {fieldErrors.closureEvidence && (
                  <p className="text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.closureEvidence}</span>
                  </p>
                )}
              </div>

              {previews.closureEvidence && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => closureInputRef.current?.click()}
                    className="text-xs text-slate-600 hover:text-teal-700 font-medium py-1 px-2 rounded hover:bg-slate-100 transition"
                  >
                    Replace
                  </button>
                  <input
                    ref={closureInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handleFileChange('closureEvidence', e.target.files?.[0])}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFile('closureEvidence')}
                    className="text-xs text-rose-600 hover:text-rose-800 font-medium py-1 px-2 rounded hover:bg-rose-50 transition"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Input C: Current Condition */}
            <div className={`bg-white rounded-xl border p-4 flex flex-col justify-between transition-all ${
              fieldErrors.currentImage ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200 shadow-xs'
            }`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    Input C
                  </span>
                  {evidence.currentImage && (
                    <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Added
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-slate-900">Current condition</h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Upload a recent photograph showing the issue as it appears now.
                  </p>
                </div>

                {/* Dropzone or Preview */}
                {!previews.currentImage ? (
                  <div
                    onDrop={(e) => handleDrop('currentImage', e)}
                    onDragOver={handleDragOver}
                    onClick={() => currentInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-teal-500 hover:bg-teal-50/20 transition-all rounded-lg p-6 text-center cursor-pointer flex flex-col items-center justify-center min-h-[140px]"
                  >
                    <input
                      ref={currentInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handleFileChange('currentImage', e.target.files?.[0])}
                    />
                    <Upload className="w-6 h-6 text-slate-400 mb-2" />
                    <span className="text-xs font-medium text-slate-700">Click or drop photo</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">JPEG, PNG, WebP (max 3 MB)</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="h-36 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center relative group">
                      <img
                        src={previews.currentImage}
                        alt="Current condition"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                      <span className="truncate max-w-[150px] font-medium">{evidence.currentImage?.name}</span>
                      <span className="text-slate-400 font-mono">{formatFileSize(evidence.currentImage?.size)}</span>
                    </div>
                  </div>
                )}

                {fieldErrors.currentImage && (
                  <p className="text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.currentImage}</span>
                  </p>
                )}
              </div>

              {previews.currentImage && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => currentInputRef.current?.click()}
                    className="text-xs text-slate-600 hover:text-teal-700 font-medium py-1 px-2 rounded hover:bg-slate-100 transition"
                  >
                    Replace
                  </button>
                  <input
                    ref={currentInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handleFileChange('currentImage', e.target.files?.[0])}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFile('currentImage')}
                    className="text-xs text-rose-600 hover:text-rose-800 font-medium py-1 px-2 rounded hover:bg-rose-50 transition"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Optional Closure Note Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="closureNote" className="text-xs font-semibold text-slate-800">
                Closure note (optional)
              </label>
              <span className={`text-[11px] font-mono ${
                closureText.length > 900 ? 'text-amber-600 font-bold' : 'text-slate-400'
              }`}>
                {closureText.length} / 1000
              </span>
            </div>
            <textarea
              id="closureNote"
              value={closureText}
              onChange={(e) => setClosureText(e.target.value.slice(0, 1000))}
              placeholder="Describe what the closure message says or add relevant context..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none text-sm text-slate-800 placeholder-slate-400 resize-none transition bg-slate-50/50"
            />
            <p className="text-[11px] text-slate-400">
              User-provided note. Treated as context, not independently verified official records.
            </p>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="text-xs text-slate-500">
              {isReady ? (
                <span className="text-teal-700 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  All 3 required evidence items are attached and valid.
                </span>
              ) : (
                <span>Please attach all 3 evidence images to enable analysis.</span>
              )}
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!isReady || isAnalyzing || !health.online}
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-teal-700 hover:bg-teal-800 active:bg-teal-900 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing with Gemma 4...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Analyze Evidence</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Results Section */}
        {analysisResult && (
          <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8 animate-fadeIn">
            {/* Header: Status and Explanation */}
            {(() => {
              const statusCfg = getStatusConfig(analysisResult.status);
              const StatusIcon = statusCfg.icon;
              return (
                <div className="border-b border-slate-200 pb-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Assessment Result
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-400 flex items-center gap-3">
                      <span>Model: {analysisResult.model}</span>
                      <span>•</span>
                      <span>Latency: {analysisResult.latencyMs}ms</span>
                    </div>
                  </div>

                  {/* Controlled Status Banner */}
                  <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${statusCfg.badgeClass}`}>
                    <StatusIcon className={`w-6 h-6 shrink-0 mt-0.5 ${statusCfg.iconColor}`} />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold tracking-tight">
                          {statusCfg.label}
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm leading-relaxed opacity-90">
                        {statusCfg.description}
                      </p>
                    </div>
                  </div>

                  {/* Summary Statement */}
                  <div className="pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Summary</h4>
                    <p className="text-sm text-slate-800 leading-relaxed font-medium">
                      {analysisResult.summary}
                    </p>
                  </div>

                  {/* Advisory Notice */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>AI-assisted evidence review based strictly on user-supplied photographs. Not official verification or proof of misconduct.</span>
                  </div>
                </div>
              );
            })()}

            {/* Evidence Comparison Grid */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                Evidence Observations & Comparison
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Original Observations Card */}
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-800">Original issue</span>
                    {previews.originalImage && (
                      <img
                        src={previews.originalImage}
                        alt="Original"
                        className="w-8 h-8 rounded object-cover border border-slate-200"
                      />
                    )}
                  </div>
                  <div className="text-xs text-slate-700 space-y-1.5 leading-relaxed">
                    {analysisResult.originalObservations?.map((obs, i) => (
                      <p key={i} className="flex items-start gap-1.5">
                        <span className="text-teal-700 font-bold">•</span>
                        <span>{obs}</span>
                      </p>
                    ))}
                  </div>
                </div>

                {/* Closure Claim Card */}
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-800">Closure claim</span>
                    {previews.closureEvidence && (
                      <img
                        src={previews.closureEvidence}
                        alt="Closure"
                        className="w-8 h-8 rounded object-cover border border-slate-200"
                      />
                    )}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed italic">
                    "{analysisResult.closureClaim}"
                  </p>
                </div>

                {/* Current Observations Card */}
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-800">Current condition</span>
                    {previews.currentImage && (
                      <img
                        src={previews.currentImage}
                        alt="Current"
                        className="w-8 h-8 rounded object-cover border border-slate-200"
                      />
                    )}
                  </div>
                  <div className="text-xs text-slate-700 space-y-1.5 leading-relaxed">
                    {analysisResult.currentObservations?.map((obs, i) => (
                      <p key={i} className="flex items-start gap-1.5">
                        <span className="text-teal-700 font-bold">•</span>
                        <span>{obs}</span>
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Evidence Comparison Narrative */}
              <div className="p-4 rounded-lg bg-teal-50/50 border border-teal-200/60 space-y-1.5">
                <span className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                  Comparative Analysis
                </span>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                  {analysisResult.evidenceComparison}
                </p>
              </div>
            </div>

            {/* Uncertainty and Limitations */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-slate-500" />
                Uncertainty & Limitations
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Observations not established:</span>
                  <ul className="space-y-1 list-disc list-inside">
                    {analysisResult.uncertainties?.map((u, i) => (
                      <li key={i}>{u}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">Operational constraints:</span>
                  <ul className="space-y-1 list-disc list-inside">
                    {analysisResult.limitations?.map((l, i) => (
                      <li key={i}>{l}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Editable Follow-Up Message Card */}
            <div className="border border-slate-200 rounded-lg p-5 space-y-3 bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-teal-700" />
                    Editable Follow-Up Message
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review and edit this factual message before submitting to official channels.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="self-start sm:self-auto px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md border border-slate-300 transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedMessage ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied to Clipboard</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Message</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                value={editableMessage}
                onChange={(e) => setEditableMessage(e.target.value)}
                rows={4}
                className="w-full p-3 text-xs sm:text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-md focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none resize-y leading-relaxed font-sans"
              />
            </div>

            {/* Action Bar */}
            <div className="border-t border-slate-200 pt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="px-4 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-300 transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSummary ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Summary Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>Copy Full Evidence Report</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                  className="px-3.5 py-2 text-xs text-slate-600 hover:text-teal-700 font-medium rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  Modify Evidence
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-xs font-medium bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg border border-teal-200 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Start New Review</span>
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-5xl mx-auto px-4 space-y-1">
          <p className="font-medium text-slate-700">CivicProof — Citizen Complaint Evidence Reviewer</p>
          <p className="text-slate-400">
            Powered by Gemma 4 via Google Gen AI SDK. Advisory civic tool for residents.
          </p>
        </div>
      </footer>
    </div>
  );
}
