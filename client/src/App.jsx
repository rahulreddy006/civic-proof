import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Upload,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Activity,
  Clock,
  FileText,
  Image as ImageIcon,
  Copy,
  Check,
  X,
  Send,
  Sparkles
} from 'lucide-react';

export default function App() {
  // Backend health state
  const [health, setHealth] = useState({
    loading: true,
    online: false,
    hasApiKey: false,
    model: 'gemma-4-26b-a4b-it',
    error: null
  });

  // Upload & Smoke test state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorFeedback, setErrorFeedback] = useState(null);
  const [smokeTestResult, setSmokeTestResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Model connectivity ping state
  const [pingState, setPingState] = useState({
    loading: false,
    result: null,
    error: null
  });

  const fileInputRef = useRef(null);

  // Fetch backend health on mount
  useEffect(() => {
    fetchHealth();
  }, []);

  // Revoke object URL on file change / unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const fetchHealth = async () => {
    setHealth(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch('/api/health');
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
        error: 'Unable to reach backend at http://localhost:5000'
      });
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    setErrorFeedback(null);
    setSmokeTestResult(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorFeedback(`Invalid file format: ${file.type}. Please select a JPEG, PNG, or WebP image.`);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorFeedback(`File is too large (${(file.size / (1024 * 1024)).toFixed(2)} MB). Max limit is 5 MB.`);
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleClearImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setSmokeTestResult(null);
    setErrorFeedback(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Run the Gemma 4 Smoke Test with real image
  const handleRunSmokeTest = async (e) => {
    if (e) e.preventDefault();
    if (!selectedFile) {
      setErrorFeedback('Please select an image first.');
      return;
    }

    setIsSubmitting(true);
    setErrorFeedback(null);
    setSmokeTestResult(null);

    const formData = new FormData();
    formData.append('image', selectedFile);
    if (customPrompt.trim()) {
      formData.append('prompt', customPrompt.trim());
    }

    try {
      const res = await fetch('/api/gemma-smoke-test', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (!res.ok || data.status === 'error') {
        const msg = data.error?.message || `Server returned error status ${res.status}`;
        throw new Error(msg);
      }

      setSmokeTestResult(data.data);
    } catch (err) {
      setErrorFeedback(err.message || 'An unexpected error occurred while executing the smoke test.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Test model connectivity
  const handleCheckConnectivity = async () => {
    setPingState({ loading: true, result: null, error: null });
    try {
      const res = await fetch('/api/health/model-check', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || data.status === 'error') {
        throw new Error(data.error?.message || 'Model connectivity check failed.');
      }
      setPingState({ loading: false, result: data.data, error: null });
    } catch (err) {
      setPingState({ loading: false, result: null, error: err.message });
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 antialiased flex flex-col">
      {/* Top Navigation / Brand Header */}
      <header className="border-b border-slate-800 bg-[#0d1322]/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-xl tracking-tight text-white">CivicProof</h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Phase 1 Foundation
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Evidence that speaks for your neighbourhood
              </p>
            </div>
          </div>

          {/* System Status Indicators */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
              <span className="text-slate-400">Backend:</span>
              {health.loading ? (
                <span className="text-amber-400 flex items-center gap-1 font-mono">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Checking
                </span>
              ) : health.online ? (
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1 font-medium">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Offline
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 font-mono">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-300">{health.model}</span>
            </div>

            <button
              onClick={fetchHealth}
              title="Refresh health status"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Project Context & Purpose Banner */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              About CivicProof
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Civic complaints are sometimes marked resolved while the underlying issue remains visible.
              CivicProof is a citizen-side evidence review assistant that connects an original report photograph,
              a closure notice, and a current-condition photograph into a factual, transparent follow-up report.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span><strong>Phase 1 Scope:</strong> Technical foundation & Real Gemma 4 API image verification</span>
              <span>•</span>
              <span><strong>AI Backend:</strong> Google Gen AI SDK (@google/genai)</span>
            </div>
          </div>
        </section>

        {/* Global Error Banner */}
        {health.error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="font-medium">Backend Connection Error</p>
              <p className="text-xs text-rose-300/80 mt-1">{health.error}</p>
            </div>
          </div>
        )}

        {/* Model Connectivity Ping (Optional quick check) */}
        <section className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              API Connectivity Status
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Test direct communication with the configured Gemma 4 model via the server-side Gemini API.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {pingState.result && (
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                <Check className="w-3.5 h-3.5" /> Verified ({pingState.result.latencyMs}ms)
              </span>
            )}
            {pingState.error && (
              <span className="text-xs text-rose-400 font-mono flex items-center gap-1 bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20">
                <AlertCircle className="w-3.5 h-3.5" /> Error
              </span>
            )}
            <button
              onClick={handleCheckConnectivity}
              disabled={pingState.loading || !health.online}
              className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {pingState.loading && <RefreshCw className="w-3 h-3 animate-spin" />}
              {pingState.loading ? 'Pinging API...' : 'Ping Gemma API'}
            </button>
          </div>
        </section>

        {/* Phase 1 Deliverable: Real Image-Input Smoke Test */}
        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800/80 pb-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-400" />
                Gemma 4 Image Smoke Test
              </h3>
              <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/60">
                POST /api/gemma-smoke-test
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Upload a test image (e.g. road pothole, streetlight, garbage overflow, or civic issue) to verify that the real Gemma 4 multimodal model processes it.
            </p>
          </div>

          <form onSubmit={handleRunSmokeTest} className="space-y-5">
            {/* Image Dropzone / Picker */}
            {!selectedFile ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 hover:bg-slate-800/40 transition-colors rounded-xl p-8 text-center cursor-pointer group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
                <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-slate-200">
                  Click to select or drag and drop a test image
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports JPEG, PNG, and WebP (up to 5 MB)
                </p>
              </div>
            ) : (
              /* Selected Image Preview */
              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-32 h-32 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center relative">
                  <img
                    src={previewUrl}
                    alt="Uploaded test sample"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-1 text-left w-full sm:w-auto">
                  <p className="text-sm font-medium text-white truncate">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400 font-mono">
                    {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type}
                  </p>
                  <p className="text-xs text-emerald-400 flex items-center gap-1 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Gemma 4 processing
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearImage}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-slate-800 hover:border-rose-500/20 transition self-start sm:self-center"
                >
                  <span className="flex items-center gap-1.5">
                    <X className="w-3.5 h-3.5" /> Remove
                  </span>
                </button>
              </div>
            )}

            {/* Optional Custom Prompt */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Model Prompt <span className="text-slate-500 font-normal">(optional — default safe prompt provided)</span>
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe this test image in detail and identify visible objects and conditions without guessing or assuming facts."
                rows={2}
                maxLength={1000}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm text-slate-200 placeholder-slate-500 resize-none"
              />
            </div>

            {/* Submit / Trigger Button */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Endpoint: <code className="text-slate-400 font-mono">POST /api/gemma-smoke-test</code>
              </span>
              <button
                type="submit"
                disabled={!selectedFile || isSubmitting || !health.online}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-medium text-sm rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing with Gemma 4...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Run Gemma 4 Smoke Test</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error Feedback Display */}
          {errorFeedback && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-semibold">Smoke Test Error</p>
                <p className="text-xs text-rose-300/90 mt-1">{errorFeedback}</p>
              </div>
            </div>
          )}

          {/* Live Gemma 4 Model Response Display */}
          {smokeTestResult && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <h4 className="text-sm font-semibold text-white">
                    Live Gemma 4 Model Response
                  </h4>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="font-mono flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {smokeTestResult.latencyMs}ms
                  </span>
                  <button
                    onClick={() => handleCopy(smokeTestResult.response)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Metadata strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-slate-400">
                <div>
                  <span className="text-slate-500">Model:</span> <span className="text-indigo-300">{smokeTestResult.model}</span>
                </div>
                <div>
                  <span className="text-slate-500">Timestamp:</span> <span className="text-slate-300">{smokeTestResult.timestamp}</span>
                </div>
              </div>

              {/* Model Output Body */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm whitespace-pre-wrap leading-relaxed font-sans shadow-inner">
                {smokeTestResult.response}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        CivicProof — Phase 1: Repository Audit, Foundation & Real Gemma 4 API Connection
      </footer>
    </div>
  );
}
