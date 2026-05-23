import { useState, useEffect, useRef } from 'react';
import { Globe, FileText, Sparkles, RefreshCw, Sliders, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { EnterpriseScanReport, ScanPhaseEvent } from '../types';
import ReportView from './ReportView';

interface AdScannerProps {
  userToken: string;
}

interface PhaseState {
  phase: number;
  name: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  data?: any;
  message?: string;
}

const PHASE_DEFINITIONS: Omit<PhaseState, 'status'>[] = [
  { phase: 1,  name: 'Website Discovery' },
  { phase: 4,  name: 'Policy Knowledge Base' },
  { phase: 2,  name: 'Business & Product Intelligence' },
  { phase: 6,  name: 'Claim Extraction & Policy Matching' },
  { phase: 8,  name: 'Image Analysis' },
  { phase: 10, name: 'Trust & Legitimacy Audit' },
  { phase: 11, name: 'Dark Pattern Detection' },
  { phase: 14, name: 'Risk Score Calculation' },
];

export default function AdScanner({ userToken }: AdScannerProps) {
  const [urlInput, setUrlInput] = useState('');
  const [creativeText, setCreativeText] = useState('');
  const [activeScanTab, setActiveScanTab] = useState<'url' | 'creative'>('url');

  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [phases, setPhases] = useState<PhaseState[]>(PHASE_DEFINITIONS.map(p => ({ ...p, status: 'pending' })));

  const [report, setReport] = useState<EnterpriseScanReport | null>(() => {
    try {
      const saved = localStorage.getItem('compliance_last_report');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.approvalScore !== undefined) { localStorage.removeItem('compliance_last_report'); return null; }
        return parsed;
      }
    } catch { }
    return null;
  });

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (report) localStorage.setItem('compliance_last_report', JSON.stringify(report));
  }, [report]);

  function resetPhases() {
    setPhases(PHASE_DEFINITIONS.map(p => ({ ...p, status: 'pending' })));
  }

  function updatePhase(phase: number, update: Partial<PhaseState>) {
    setPhases(prev => prev.map(p => p.phase === phase ? { ...p, ...update } : p));
  }

  const runEnterpriseScan = async () => {
    const input = activeScanTab === 'url' ? urlInput.trim() : creativeText.trim();
    if (!input) return;

    setIsScanning(true);
    setScanError(null);
    setReport(null);
    resetPhases();
    localStorage.removeItem('compliance_last_report');

    abortRef.current = new AbortController();

    try {
      const response = await fetch('/api/compliance/scan-enterprise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          url: activeScanTab === 'url' ? urlInput : '',
          creativeText: activeScanTab === 'creative' ? creativeText : '',
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        if (response.status === 409) {
          throw new Error('⚠️ A scan is already running for your account. Please wait for it to complete.');
        }
        if (response.status === 429) {
          const hoursInfo = errData.resets_in_hours != null ? ` Resets in ~${errData.resets_in_hours}h.` : '';
          const limitInfo = errData.limit != null ? ` (limit: ${errData.used}/${errData.limit} scans today)` : '';
          throw new Error(`Daily scan limit reached${limitInfo}.${hoursInfo} Set DAILY_SCAN_LIMIT in .env to increase it.`);
        }
        throw new Error(errData.error || `Server error ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event: ScanPhaseEvent = JSON.parse(line);
            handleStreamEvent(event);
          } catch (_) { /* partial JSON, ignore */ }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setScanError(err.message || 'Scan failed. Please try again.');
      }
    } finally {
      setIsScanning(false);
    }
  };

  function handleStreamEvent(event: ScanPhaseEvent) {
    if (event.type === 'phase' && event.phase !== undefined) {
      updatePhase(event.phase, {
        status: event.status as any,
        data: event.data,
        message: event.message,
      });
    } else if (event.type === 'complete' && event.report) {
      setReport(event.report);
    } else if (event.type === 'error') {
      setScanError(event.message || 'Scan error occurred.');
    }
  }

  const cancelScan = () => {
    abortRef.current?.abort();
    setIsScanning(false);
    setScanError('Scan cancelled.');
  };

  const clearReport = () => {
    setReport(null);
    setScanError(null);
    resetPhases();
    localStorage.removeItem('compliance_last_report');
  };

  const completedPhases = phases.filter(p => p.status === 'complete').length;
  const progressPct = isScanning ? Math.round((completedPhases / PHASE_DEFINITIONS.length) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#111114]">

      {/* SCAN CONFIG BAR */}
      <section className="p-4 bg-[#0d0d10] border-b border-white/5 flex flex-col gap-4 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Compliance Intelligence</span>
            <div className="flex rounded-lg bg-black/45 p-1 border border-white/5">
              <button
                onClick={() => setActiveScanTab('url')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${activeScanTab === 'url' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                URL Audit
              </button>
              <button
                onClick={() => setActiveScanTab('creative')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${activeScanTab === 'creative' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Copy Audit
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
              15-PHASE ENTERPRISE ENGINE
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3">
          {activeScanTab === 'url' ? (
            <div className="flex-1 flex rounded-lg overflow-hidden border border-white/10 bg-black/40 focus-within:border-indigo-600 transition-all">
              <div className="flex items-center justify-center px-4 bg-white/5 text-slate-400">
                <Globe className="w-4 h-4" />
              </div>
              <input
                type="url"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !isScanning && runEnterpriseScan()}
                placeholder="https://example.com — full multi-page audit"
                className="flex-1 bg-transparent px-4 py-2.5 text-xs text-slate-200 focus:outline-none placeholder-slate-600 font-mono"
              />
            </div>
          ) : (
            <div className="flex-1 flex rounded-lg overflow-hidden border border-white/10 bg-black/40 focus-within:border-indigo-600 transition-all">
              <div className="flex items-center justify-center px-4 bg-white/5 text-slate-400">
                <FileText className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={creativeText}
                onChange={e => setCreativeText(e.target.value)}
                placeholder="Paste ad headlines, body copy, or creative descriptions..."
                className="flex-1 bg-transparent px-4 py-2.5 text-xs text-slate-200 focus:outline-none placeholder-slate-600"
              />
            </div>
          )}

          <button
            disabled={isScanning}
            onClick={runEnterpriseScan}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 cursor-pointer"
          >
            {isScanning ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Scanning...</span></>
            ) : (
              <><Sparkles className="w-3.5 h-3.5 animate-pulse" /><span>Run Enterprise Audit</span></>
            )}
          </button>

          {report && !isScanning && (
            <button
              onClick={clearReport}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-bold rounded-lg border border-white/10 flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-hidden relative">

        {/* PHASE PROGRESS OVERLAY */}
        {isScanning && (
          <div className="absolute inset-0 z-30 bg-[#0c0c0f]/95 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="max-w-lg w-full bg-[#121216] border border-white/10 p-6 rounded-2xl shadow-2xl flex flex-col gap-5 text-left">

              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white">Enterprise Compliance Intelligence</h4>
                  <p className="text-slate-400 text-xs">Running 15-phase audit — simulating platform reviewer logic</p>
                </div>
                <button onClick={cancelScan} className="text-[10px] text-slate-500 hover:text-red-400 transition-colors cursor-pointer px-2 py-1 rounded border border-white/5 hover:border-red-500/30">
                  Cancel
                </button>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1.5">
                  <span className="font-mono">{completedPhases}/{PHASE_DEFINITIONS.length} phases complete</span>
                  <span className="font-mono">{progressPct}%</span>
                </div>
                <div className="w-full bg-slate-800/60 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Phase list */}
              <div className="flex flex-col gap-1.5">
                {phases.map(p => (
                  <div key={p.phase} className="flex items-center gap-3 py-1">
                    <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                      {p.status === 'complete' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : p.status === 'running' ? (
                        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                      ) : p.status === 'failed' ? (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-slate-700" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-[11px] font-semibold ${
                        p.status === 'complete' ? 'text-emerald-400' :
                        p.status === 'running' ? 'text-indigo-300' :
                        p.status === 'failed' ? 'text-red-400' : 'text-slate-600'
                      }`}>
                        Phase {p.phase} — {p.name}
                      </span>
                      {p.status === 'running' && p.message && (
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{p.message}</p>
                      )}
                      {p.status === 'complete' && p.data && (
                        <p className="text-[10px] text-emerald-600 mt-0.5">
                          {Object.entries(p.data).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(' · ')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* ERROR DISPLAY */}
        {scanError && !isScanning && (
          <div className="absolute inset-0 z-30 bg-black/85 flex items-center justify-center p-6">
            <div className="max-w-sm w-full bg-[#121216] border border-red-500/20 p-6 rounded-2xl text-center flex flex-col gap-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto">
                <Sliders className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Audit Disrupted</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{scanError}</p>
              <button
                onClick={runEnterpriseScan}
                className="mt-2 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-bold rounded-lg border border-red-500/20 cursor-pointer"
              >
                Retry Audit
              </button>
            </div>
          </div>
        )}

        {/* REPORT */}
        {report && !isScanning && (
          <ReportView
            report={report}
            activeScanTab={activeScanTab}
            urlInput={urlInput}
            creativeText={creativeText}
          />
        )}

        {/* EMPTY STATE */}
        {!report && !isScanning && !scanError && (
          <div className="flex-1 flex items-center justify-center h-full p-8">
            <div className="text-center max-w-md flex flex-col items-center gap-5">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base mb-2">Enterprise Compliance Audit</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Enter a website URL to run a full 15-phase intelligence audit: multi-page crawl, policy knowledge base matching, claim extraction, image analysis, dark pattern detection, trust audit, and weighted risk scoring.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full text-left">
                {['Multi-page crawler (12 pages)', 'Live policy KB (48+ rules)', 'Claim vs policy matching', 'Dark pattern detection', 'Weighted risk scoring', 'Evidence-based reporting'].map(f => (
                  <div key={f} className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="text-[10px] text-slate-400">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
