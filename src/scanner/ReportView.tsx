import React, { useState, useMemo, ReactNode } from 'react';
import {
  AlertTriangle, CheckCircle, XCircle, ShieldAlert, Sparkles,
  Globe, FileText, Info, Download, Image as ImageIcon,
  ChevronDown, ChevronRight, BarChart3, Shield, Search,
  FileWarning, Eye, Users, TrendingDown, Lock
} from 'lucide-react';
import { EnterpriseScanReport, ImageAnalysis, ClaimViolation, EvidenceItem, RiskBreakdown } from '../types';

interface ReportViewProps {
  report: EnterpriseScanReport;
  activeScanTab: 'url' | 'creative';
  urlInput: string;
  creativeText: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function severityColor(s: string) {
  const u = s?.toUpperCase();
  if (u === 'CRITICAL' || u === 'HIGH') return { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/25' };
  if (u === 'MEDIUM' || u === 'WARNING') return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/25' };
  return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' };
}

function classificationColor(c: string) {
  if (c === 'BLACK_HAT') return 'bg-red-500/20 text-red-400 border-red-500/30';
  if (c === 'GREY_HAT') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
}

function riskLevelColor(r: string) {
  const u = r?.toUpperCase();
  if (u === 'CRITICAL' || u === 'BLOCKED') return 'text-red-500';
  if (u === 'HIGH_RISK' || u === 'HIGH') return 'text-red-400';
  if (u === 'WARNING' || u === 'MEDIUM') return 'text-amber-400';
  if (u === 'LOW_RISK' || u === 'LOW') return 'text-yellow-400';
  return 'text-emerald-400';
}

function scoreBarColor(score: number) {
  if (score > 80) return 'bg-red-500';
  if (score > 60) return 'bg-red-400';
  if (score > 40) return 'bg-amber-500';
  if (score > 20) return 'bg-yellow-500';
  return 'bg-emerald-500';
}

// ─── Sub-components ────────────────────────────────────────────────────────

function CollapsibleSection({ title, icon: Icon, count, defaultOpen = true, colorClass = 'text-slate-300', children }: {
  title: string; icon: any; count?: number; defaultOpen?: boolean; colorClass?: string; children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-[#151515] border border-white/8 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/3 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
          <span className={`text-xs font-bold uppercase tracking-wider ${colorClass}`}>{title}</span>
          {count !== undefined && (
            <span className="ml-1 text-[9px] bg-white/10 px-1.5 py-0.5 rounded font-mono text-slate-400">{count}</span>
          )}
        </div>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
      </button>
      {open && <div className="px-4 pb-4 flex flex-col gap-3">{children}</div>}
    </div>
  );
}

function RiskBreakdownWidget({ breakdown, total, level }: { breakdown: RiskBreakdown; total: number; level: string }) {
  const rows = [
    { label: 'Business Risk', key: 'business_risk', weight: '30%' },
    { label: 'Product Risk', key: 'product_risk', weight: '20%' },
    { label: 'Claim Risk', key: 'claim_risk', weight: '15%' },
    { label: 'Platform Violations', key: 'platform_violations', weight: '15%' },
    { label: 'Trust Deficiencies', key: 'trust_deficiencies', weight: '10%' },
    { label: 'Dark Patterns', key: 'dark_patterns_score', weight: '5%' },
    { label: 'Technical Manipulation', key: 'technical_manipulation', weight: '5%' },
  ] as const;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono text-slate-500 block">WEIGHTED RISK SCORE</span>
          <span className={`text-3xl font-black ${riskLevelColor(level)}`}>{total}</span>
          <span className="text-slate-600 text-xs">/100</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono text-slate-500 block">RISK LEVEL</span>
          <span className={`text-sm font-bold uppercase ${riskLevelColor(level)}`}>{level?.replace('_', ' ')}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {rows.map(row => {
          const val = (breakdown as any)[row.key] as number || 0;
          return (
            <div key={row.key} className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{row.label} <span className="text-slate-600">({row.weight})</span></span>
                <span className={`font-mono font-bold ${val > 60 ? 'text-red-400' : val > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>{val}</span>
              </div>
              <div className="w-full bg-slate-800/60 h-1 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${scoreBarColor(val)}`} style={{ width: `${val}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ClaimViolationCard({ claim }: { claim: ClaimViolation }) {
  const [open, setOpen] = useState(false);
  const sc = severityColor(claim.severity);
  if (!claim.violates) return null;
  return (
    <div className={`rounded-xl border p-3 flex flex-col gap-2 cursor-pointer transition-all ${sc.bg} ${sc.border}`} onClick={() => setOpen(!open)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${sc.bg} ${sc.text} border ${sc.border}`}>{claim.severity}</span>
            <span className="text-[9px] text-slate-500 uppercase font-mono">{claim.claim_type}</span>
          </div>
          <p className="text-xs font-semibold text-slate-200 leading-snug">"{claim.claim}"</p>
        </div>
        <div className="shrink-0 flex flex-wrap gap-1 justify-end">
          {claim.affected_platforms?.map(p => (
            <span key={p} className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 font-mono">{p}</span>
          ))}
        </div>
      </div>
      {open && (
        <div className="border-t border-white/8 pt-2 flex flex-col gap-2">
          {claim.why_it_matters && (
            <div className="bg-black/30 p-2 rounded text-[10px] text-slate-400 leading-relaxed">
              <strong className="text-slate-300 block mb-0.5">Why it matters:</strong>
              {claim.why_it_matters}
            </div>
          )}
          {claim.evidence?.length > 0 && (
            <div className="bg-black/30 p-2 rounded">
              <strong className="text-[9px] text-amber-400 block mb-1">Evidence:</strong>
              {claim.evidence.map((e, i) => (
                <p key={i} className="text-[10px] text-slate-400 italic border-l-2 border-amber-500/30 pl-2 mb-1">"{e}"</p>
              ))}
            </div>
          )}
          {claim.recommended_fix && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 p-2 rounded text-[10px] text-emerald-300">
              <strong className="block mb-0.5">Fix:</strong>{claim.recommended_fix}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EvidenceCard({ item }: { item: EvidenceItem }) {
  const [open, setOpen] = useState(false);
  const sc = severityColor(item.severity);
  return (
    <div className={`rounded-xl border p-3 flex flex-col gap-2 cursor-pointer transition-all hover:border-white/20 bg-[#151515] border-white/8`} onClick={() => setOpen(!open)}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {item.severity === 'CRITICAL' || item.severity === 'HIGH' ? <XCircle className="w-4 h-4 text-red-400" /> :
           item.severity === 'MEDIUM' ? <AlertTriangle className="w-4 h-4 text-amber-400" /> :
           <Info className="w-4 h-4 text-slate-400" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-bold text-slate-200`}>{item.issue}</span>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border ${sc.text} ${sc.bg} ${sc.border}`}>{item.severity}</span>
          </div>
          <div className="flex gap-1 flex-wrap">
            {item.platforms?.map(p => (
              <span key={p} className="text-[8px] px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono">{p}</span>
            ))}
          </div>
        </div>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
      </div>
      {open && (
        <div className="border-t border-white/8 pt-2 flex flex-col gap-2">
          {item.why_it_matters && (
            <div className="bg-black/30 p-2 rounded text-[10px] text-slate-400 leading-relaxed">
              <strong className="text-slate-300 block mb-0.5">Why it matters:</strong>
              {item.why_it_matters}
            </div>
          )}
          {item.evidence?.length > 0 && (
            <div className="bg-black/30 p-2 rounded">
              <strong className="text-[9px] text-amber-400 block mb-1">Evidence:</strong>
              {item.evidence.map((e, i) => (
                <p key={i} className="text-[10px] text-slate-400 italic border-l-2 border-amber-500/30 pl-2 mb-1">"{e}"</p>
              ))}
            </div>
          )}
          {item.recommended_fix && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 p-2 rounded text-[10px] text-emerald-300">
              <strong className="block mb-0.5">Fix:</strong>{item.recommended_fix}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Report View ──────────────────────────────────────────────────────

export default function ReportView({ report, activeScanTab, urlInput, creativeText }: ReportViewProps) {
  const [selectedImage, setSelectedImage] = useState<ImageAnalysis | null>(
    report.images?.[0] ?? null
  );
  const [imageFilter, setImageFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'claims' | 'images' | 'evidence' | 'discovery'>('overview');

  const score = report.risk_score ?? report.website_risk_score ?? 0;
  const level = report.risk_level ?? report.overall_status ?? 'UNKNOWN';

  const siteDomain = useMemo(() => {
    if (!urlInput) return 'AUDITED CONTENT';
    try { return new URL(urlInput).hostname.toUpperCase(); } catch { return urlInput.replace(/https?:\/\/(www\.)?/, '').split('/')[0].toUpperCase(); }
  }, [urlInput]);

  const filteredImages = useMemo(() => {
    if (!report.images) return [];
    if (imageFilter === 'all') return report.images;
    return report.images.filter(img => {
      const s = img.severity?.toUpperCase();
      if (imageFilter === 'high') return s === 'HIGH' || s === 'CRITICAL';
      if (imageFilter === 'medium') return s === 'MEDIUM';
      return s === 'LOW';
    });
  }, [report.images, imageFilter]);

  const activeClaimViolations = useMemo(() => (report.claim_violations || []).filter(c => c.violates), [report]);

  const downloadReport = () => {
    const html = `<!DOCTYPE html><html><head><title>Compliance.OS Enterprise Report</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#1a202c;padding:40px;line-height:1.6;max-width:900px;margin:0 auto}
  h1{font-size:22px;font-weight:900;color:#1a202c;border-bottom:3px solid #4f46e5;padding-bottom:12px}
  h2{font-size:16px;font-weight:700;margin-top:28px;border-bottom:1px solid #e2e8f0;padding-bottom:6px}
  .score{font-size:36px;font-weight:900;color:#4f46e5}
  .badge{display:inline-block;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:700}
  .critical{background:#fee2e2;color:#dc2626}.high{background:#fef3c7;color:#d97706}
  .card{border:1px solid #e2e8f0;padding:14px;border-radius:8px;margin-bottom:12px;background:#fff}
  .red-card{border-left:4px solid #dc2626;background:#fef2f2}
  .green-card{border-left:4px solid #059669;background:#f0fdf4}
  .meta{font-size:11px;color:#718096}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{background:#f7fafc;text-align:left;padding:8px;border-bottom:2px solid #e2e8f0}
  td{padding:8px;border-bottom:1px solid #e2e8f0}
</style></head><body>
<h1>Compliance.OS Enterprise Audit Report</h1>
<div class="meta">Generated: ${new Date().toLocaleString()} | Target: ${urlInput || 'Ad Copy'} | Platform: Meta · Google · TikTok · Snapchat</div>
<div class="score">${score}/100</div>
<p>Risk Level: <strong>${level?.replace('_', ' ')}</strong> | Classification: <strong>${report.website_classification}</strong></p>
<p>${report.summary}</p>
${report.risk_breakdown ? `
<h2>Risk Score Breakdown (Weighted)</h2>
<table><thead><tr><th>Factor</th><th>Weight</th><th>Score</th></tr></thead><tbody>
${[['Business Risk','30%','business_risk'],['Product Risk','20%','product_risk'],['Claim Risk','15%','claim_risk'],['Platform Violations','15%','platform_violations'],['Trust Deficiencies','10%','trust_deficiencies'],['Dark Patterns','5%','dark_patterns_score'],['Technical Manipulation','5%','technical_manipulation']]
  .map(([label,w,k]) => `<tr><td>${label}</td><td>${w}</td><td><strong>${(report.risk_breakdown as any)[k]}</strong></td></tr>`).join('')}
</tbody></table>` : ''}
<h2>Business Intelligence</h2>
<p><strong>Business Type:</strong> ${report.business_model_type} | <strong>Revenue Model:</strong> ${report.revenue_model || 'N/A'}</p>
${activeClaimViolations.length > 0 ? `
<h2>Claim Violations (${activeClaimViolations.length})</h2>
${activeClaimViolations.map(c => `<div class="card red-card"><strong>[${c.severity}] ${c.claim_type}</strong><p>"${c.claim}"</p><p class="meta">Platforms: ${c.affected_platforms?.join(', ')}</p><p>${c.why_it_matters}</p><p><strong>Fix:</strong> ${c.recommended_fix}</p></div>`).join('')}` : ''}
${(report.website_level_issues || []).length > 0 ? `
<h2>Website Issues</h2>
${report.website_level_issues.map(i => `<div class="card red-card"><strong>[${i.severity}] ${i.issue}</strong><p>${i.description}</p><p><strong>Fix:</strong> ${i.remediation}</p></div>`).join('')}` : ''}
<h2>Platform Enforcement Risk</h2>
${report.platform_enforcement_risk ? `<table><thead><tr><th>Platform</th><th>Risk Level</th><th>Likely Action</th></tr></thead><tbody>
${Object.entries(report.platform_enforcement_risk).map(([p,r]) => `<tr><td>${p.toUpperCase()}</td><td>${(r as any).risk_level}</td><td>${(r as any).likely_action}</td></tr>`).join('')}
</tbody></table>` : ''}
${(report.final_recommendations || []).length > 0 ? `<h2>Recommendations</h2><ul>${report.final_recommendations.map(r => `<li>${r}</li>`).join('')}</ul>` : ''}
<p class="meta" style="margin-top:40px;border-top:1px solid #e2e8f0;padding-top:12px">Generated by Compliance.OS Enterprise Intelligence System</p>
</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `compliance_enterprise_report_${Date.now()}.html`;
    a.click();
  };

  const TABS = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'claims', label: `Claims (${activeClaimViolations.length})`, icon: Search },
    { id: 'images', label: `Images (${report.images?.length || 0})`, icon: ImageIcon },
    { id: 'evidence', label: `Evidence (${report.evidence?.length || 0})`, icon: FileWarning },
    { id: 'discovery', label: 'Discovery', icon: Globe },
  ] as const;

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">

      {/* ── LEFT: Main report content ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-[#111114]">

        {/* Tab bar */}
        <div className="sticky top-0 z-10 flex border-b border-white/5 bg-[#0f0f12] overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-3 text-[11px] font-bold shrink-0 transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === tab.id ? 'text-white border-indigo-500 bg-white/3' : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5 flex flex-col gap-4">

          {/* ── OVERVIEW TAB ───────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <>
              {/* Classification + Verdict */}
              {report.website_classification && (
                <div className="bg-[#151515] border border-white/8 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block mb-1">BUSINESS TYPE</span>
                      <span className="text-sm font-bold text-slate-200">{report.business_model_type || 'Unknown'}</span>
                      {report.revenue_model && <span className="text-[10px] text-slate-500 ml-2">· {report.revenue_model}</span>}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-mono block mb-1">CLASSIFICATION</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${classificationColor(report.website_classification)}`}>
                        {report.website_classification.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  {report.final_verdict && (
                    <div className="bg-black/40 p-3 rounded-lg border border-white/5 text-xs text-slate-300 leading-relaxed">
                      <strong className="text-indigo-400 text-[10px] font-mono block mb-1">FINAL VERDICT</strong>
                      {report.final_verdict}
                    </div>
                  )}
                </div>
              )}

              {/* Platform Enforcement Risk */}
              {report.platform_enforcement_risk && (
                <CollapsibleSection title="Platform Enforcement Risk" icon={Shield} colorClass="text-indigo-400">
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(report.platform_enforcement_risk).map(([platform, risk]) => {
                      const r = risk as any;
                      return (
                        <div key={platform} className="bg-black/30 p-3 rounded-lg border border-white/5">
                          <span className="text-[11px] font-bold text-white capitalize block mb-1">{platform}</span>
                          <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded inline-block mb-1 ${
                            r.risk_level === 'HIGH' || r.risk_level === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                            r.risk_level === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                          }`}>{r.risk_level}</span>
                          <p className="text-[10px] text-slate-400 leading-tight">{r.likely_action}</p>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleSection>
              )}

              {/* Signals grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(report.scam_signals?.length ?? 0) > 0 && (
                  <CollapsibleSection title="Scam Signals" icon={ShieldAlert} count={report.scam_signals?.length} colorClass="text-red-400">
                    <div className="flex flex-wrap gap-1.5">
                      {report.scam_signals.map((s, i) => <span key={i} className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] px-2 py-0.5 rounded">{s}</span>)}
                    </div>
                  </CollapsibleSection>
                )}
                {(report.detected_dark_patterns?.length ?? 0) > 0 && (
                  <CollapsibleSection title="Dark Patterns" icon={AlertTriangle} count={report.detected_dark_patterns?.length} colorClass="text-amber-400">
                    <div className="flex flex-wrap gap-1.5">
                      {report.detected_dark_patterns.map((s, i) => <span key={i} className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] px-2 py-0.5 rounded">{s}</span>)}
                    </div>
                  </CollapsibleSection>
                )}
                {(report.policy_evasion_signals?.length ?? 0) > 0 && (
                  <CollapsibleSection title="Evasion Signals" icon={Eye} count={report.policy_evasion_signals?.length} colorClass="text-purple-400">
                    <div className="flex flex-wrap gap-1.5">
                      {report.policy_evasion_signals.map((s, i) => <span key={i} className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] px-2 py-0.5 rounded">{s}</span>)}
                    </div>
                  </CollapsibleSection>
                )}
                {(report.consumer_harm_signals?.length ?? 0) > 0 && (
                  <CollapsibleSection title="Consumer Harm Signals" icon={Users} count={report.consumer_harm_signals?.length} colorClass="text-orange-400">
                    <div className="flex flex-wrap gap-1.5">
                      {report.consumer_harm_signals.map((s, i) => <span key={i} className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[9px] px-2 py-0.5 rounded">{s}</span>)}
                    </div>
                  </CollapsibleSection>
                )}
                {(report.trust_signals?.length ?? 0) > 0 && (
                  <CollapsibleSection title="Trust Signals" icon={CheckCircle} count={report.trust_signals?.length} colorClass="text-emerald-400">
                    <div className="flex flex-wrap gap-1.5">
                      {report.trust_signals.map((s, i) => <span key={i} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded">{s}</span>)}
                    </div>
                  </CollapsibleSection>
                )}
              </div>

              {/* Product classifications */}
              {(report.product_classifications?.length ?? 0) > 0 && (
                <CollapsibleSection title="Product Risk Classification" icon={TrendingDown} count={report.product_classifications?.length} colorClass="text-slate-300">
                  {report.product_classifications.map((prod, idx) => (
                    <div key={idx} className="bg-black/30 p-3 rounded-lg border border-white/5">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <strong className="text-xs text-white block">{prod.product_name}</strong>
                          <span className="text-[10px] text-slate-400">{prod.category}</span>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${classificationColor(prod.classification)}`}>
                          {prod.classification?.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex gap-4 text-[10px]">
                        <div><span className="text-slate-500">Compliance Risk</span><br /><span className="text-slate-300 font-mono">{prod.platform_compliance_risk}</span></div>
                        <div><span className="text-slate-500">Consumer Harm</span><br /><span className="text-slate-300 font-mono">{prod.consumer_harm_risk}</span></div>
                      </div>
                    </div>
                  ))}
                </CollapsibleSection>
              )}

              {/* Website-level issues */}
              {(report.website_level_issues?.length ?? 0) > 0 && (
                <CollapsibleSection title="Website Issues" icon={FileText} count={report.website_level_issues?.length} colorClass="text-slate-300">
                  {report.website_level_issues.map((issue, idx) => {
                    const sc = severityColor(issue.severity);
                    return (
                      <div key={idx} className={`rounded-xl border p-3 flex gap-3 ${sc.bg} ${sc.border}`}>
                        <div className="mt-0.5 shrink-0">
                          {issue.severity === 'CRITICAL' || issue.severity === 'HIGH' ? <XCircle className={`w-4 h-4 ${sc.text}`} /> :
                           issue.severity === 'MEDIUM' ? <AlertTriangle className={`w-4 h-4 ${sc.text}`} /> :
                           <Info className="w-4 h-4 text-slate-400" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-white text-xs">{issue.issue}</span>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-bold border ${sc.text} ${sc.bg} ${sc.border}`}>{issue.severity}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">{issue.description}</p>
                          <div className="bg-white/5 p-2 rounded text-[10px] text-indigo-300">
                            <strong className="text-slate-500">Fix: </strong>{issue.remediation}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CollapsibleSection>
              )}

              {/* Final recommendations */}
              {(report.final_recommendations?.length ?? 0) > 0 && (
                <div className="p-4 border border-indigo-500/20 bg-indigo-500/5 rounded-xl">
                  <h3 className="text-[10px] font-mono font-bold text-indigo-400 mb-2">FINAL RECOMMENDATIONS</h3>
                  <ul className="space-y-1.5">
                    {report.final_recommendations.map((rec, idx) => (
                      <li key={idx} className="text-[11px] text-slate-300 flex gap-2">
                        <span className="text-indigo-500 shrink-0">•</span><span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {/* ── CLAIMS TAB ─────────────────────────────────────────────────── */}
          {activeTab === 'claims' && (
            <>
              {activeClaimViolations.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No claim violations detected</p>
                </div>
              ) : (
                <>
                  <div className="text-[10px] text-slate-500 font-mono px-1">
                    {activeClaimViolations.length} claim violation{activeClaimViolations.length !== 1 ? 's' : ''} found — click any card to expand evidence
                  </div>
                  {activeClaimViolations.map((c, i) => <React.Fragment key={`cv-${i}`}><ClaimViolationCard claim={c} /></React.Fragment>)}
                </>
              )}
              {/* Safe claims */}
              {(report.claim_violations || []).filter(c => !c.violates).length > 0 && (
                <CollapsibleSection title="Compliant Claims" icon={CheckCircle} count={(report.claim_violations || []).filter(c => !c.violates).length} colorClass="text-emerald-400" defaultOpen={false}>
                  {(report.claim_violations || []).filter(c => !c.violates).map((c, i) => (
                    <div key={i} className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-2.5 text-[11px]">
                      <span className="text-emerald-400 font-semibold">"{c.claim}"</span>
                      <span className="text-slate-500 ml-2 text-[10px]">{c.claim_type}</span>
                    </div>
                  ))}
                </CollapsibleSection>
              )}
            </>
          )}

          {/* ── IMAGES TAB ─────────────────────────────────────────────────── */}
          {activeTab === 'images' && (
            <>
              {/* Filter buttons */}
              <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-white/5 w-fit">
                {['all','high','medium','low'].map(f => (
                  <button
                    key={f}
                    onClick={() => setImageFilter(f as any)}
                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-all cursor-pointer ${imageFilter === f ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {f} {f === 'all' && `(${report.images?.length || 0})`}
                  </button>
                ))}
              </div>

              {filteredImages.length === 0 ? (
                <div className="text-center py-12 border border-white/5 rounded-xl">
                  <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-xs">No images match this filter</p>
                </div>
              ) : (
                filteredImages.map((img, i) => {
                  const isSelected = selectedImage?.image_id === img.image_id;
                  const sc = severityColor(img.severity);
                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedImage(isSelected ? null : img)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 ${
                        isSelected ? 'bg-indigo-600/10 border-indigo-500' :
                        img.severity === 'CRITICAL' || img.severity === 'HIGH' ? 'bg-red-500/5 border-red-500/15 hover:border-red-500/30' :
                        'bg-[#151515] border-white/8 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 shrink-0 rounded bg-black border border-white/10 overflow-hidden">
                          {img.image_url && !img.image_url.startsWith('data:') ? (
                            <img src={img.image_url} alt="Analyzed" className="w-full h-full object-cover opacity-80" />
                          ) : <ImageIcon className="w-6 h-6 text-slate-600 m-auto mt-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-white truncate">{img.description || 'Image'}</p>
                          <div className="flex gap-1.5 mt-1 flex-wrap">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border ${sc.text} ${sc.bg} ${sc.border}`}>{img.severity}</span>
                            {!img.safe_for_ads && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 uppercase">NOT SAFE</span>}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="border-t border-white/8 pt-3 flex flex-col gap-2">
                          {img.ocr_text && (
                            <div className="bg-black/40 p-2 rounded border border-white/5">
                              <span className="text-[9px] font-mono text-slate-400 block mb-1">OCR TEXT:</span>
                              <p className="text-[10px] text-slate-300 italic">"{img.ocr_text}"</p>
                            </div>
                          )}
                          {img.policy_violations?.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[9px] font-mono text-red-400 block">VIOLATIONS:</span>
                              {img.policy_violations.map((pv, j) => (
                                <div key={j} className="bg-red-500/5 p-2 rounded border border-red-500/20">
                                  <div className="flex gap-2 mb-1">
                                    <span className="text-[9px] px-1 bg-red-500/20 text-red-400 rounded">{pv.platform}</span>
                                    <span className="text-[10px] font-bold text-slate-200">{pv.policy}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400">{pv.reason}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {img.detected_elements?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              <strong className="text-[9px] text-slate-500 mr-1">Detected:</strong>
                              {img.detected_elements.map((el, j) => <span key={j} className="bg-white/5 text-[9px] px-1.5 py-0.5 rounded text-slate-400">{el}</span>)}
                            </div>
                          )}
                          {img.recommended_action && (
                            <div className="bg-emerald-500/5 p-2 rounded border border-emerald-500/20">
                              <span className="text-[9px] font-mono text-emerald-400 block mb-0.5">REMEDIATION:</span>
                              <p className="text-[10px] text-emerald-300">{img.recommended_action}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* ── EVIDENCE TAB ───────────────────────────────────────────────── */}
          {activeTab === 'evidence' && (
            <>
              {(report.evidence?.length ?? 0) === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No evidence records — site appears compliant</p>
                </div>
              ) : (
                <>
                  <div className="text-[10px] text-slate-500 font-mono px-1">{report.evidence?.length} evidence items — click to expand</div>
                  {report.evidence?.map((item, i) => <React.Fragment key={`ev-${i}`}><EvidenceCard item={item} /></React.Fragment>)}
                </>
              )}
            </>
          )}

          {/* ── DISCOVERY TAB ──────────────────────────────────────────────── */}
          {activeTab === 'discovery' && (
            <>
              {!report.discovery ? (
                <div className="text-center py-12 text-slate-500 text-sm">No discovery data available (copy audit mode)</div>
              ) : (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Pages Crawled', value: report.discovery.pages_count || report.discovery.pages_crawled?.length || 0, color: 'text-indigo-400' },
                      { label: 'Critical Found', value: report.discovery.critical_pages_found?.length || 0, color: 'text-emerald-400' },
                      { label: 'Missing Pages', value: report.discovery.missing_pages?.length || 0, color: 'text-red-400' },
                    ].map(stat => (
                      <div key={stat.label} className="bg-[#151515] border border-white/8 rounded-xl p-3 text-center">
                        <span className={`text-2xl font-black block ${stat.color}`}>{stat.value}</span>
                        <span className="text-[10px] text-slate-500">{stat.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Critical pages found */}
                  {(report.discovery.critical_pages_found?.length ?? 0) > 0 && (
                    <CollapsibleSection title="Critical Pages Found" icon={CheckCircle} count={report.discovery.critical_pages_found?.length} colorClass="text-emerald-400">
                      <div className="flex flex-wrap gap-2">
                        {report.discovery.critical_pages_found?.map(p => (
                          <span key={p} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-3 py-1 rounded-full capitalize">{p}</span>
                        ))}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* Missing pages */}
                  {(report.discovery.missing_pages?.length ?? 0) > 0 && (
                    <CollapsibleSection title="Missing Critical Pages" icon={AlertTriangle} count={report.discovery.missing_pages?.length} colorClass="text-amber-400">
                      <div className="flex flex-wrap gap-2">
                        {report.discovery.missing_pages?.map(p => (
                          <span key={p} className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] px-3 py-1 rounded-full capitalize">{p}</span>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">Missing critical pages reduce trust score and may trigger ad account rejection. Privacy policy and Terms are required by all major ad platforms.</p>
                    </CollapsibleSection>
                  )}

                  {/* Pages crawled */}
                  {(report.discovery.pages_crawled?.length ?? 0) > 0 && (
                    <CollapsibleSection title="Pages Crawled" icon={Globe} count={report.discovery.pages_crawled?.length} colorClass="text-slate-300" defaultOpen={false}>
                      <div className="flex flex-col gap-1.5">
                        {report.discovery.pages_crawled?.map((page, i) => (
                          <div key={i} className={`flex items-center justify-between p-2 rounded-lg border ${page.status === 'success' ? 'bg-white/3 border-white/5' : 'bg-red-500/5 border-red-500/15'}`}>
                            <div className="min-w-0">
                              <span className="text-[10px] font-mono text-slate-300 block truncate">{page.url}</span>
                              <span className="text-[9px] text-slate-500 capitalize">{page.page_type}</span>
                            </div>
                            <span className={`text-[9px] font-bold ml-2 shrink-0 ${page.status === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>{page.status}</span>
                          </div>
                        ))}
                      </div>
                    </CollapsibleSection>
                  )}
                </>
              )}
            </>
          )}

        </div>
      </div>

      {/* ── RIGHT: Score sidebar ──────────────────────────────────────────── */}
      <aside className="w-full lg:w-[360px] bg-[#0c0c0c] flex flex-col border-t lg:border-t-0 lg:border-l border-white/5 overflow-hidden shrink-0">

        {/* Score panel */}
        <div className="p-5 border-b border-white/5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-slate-500 block">TARGET</span>
              <span className="text-xs font-bold text-white font-mono truncate">{siteDomain}</span>
            </div>
            <button
              onClick={downloadReport}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded border border-white/10 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3" /><span>Export</span>
            </button>
          </div>

          {/* Weighted score breakdown */}
          {report.risk_breakdown ? (
            <RiskBreakdownWidget breakdown={report.risk_breakdown} total={score} level={level} />
          ) : (
            <>
              <div className="flex justify-between items-center">
                <span className={`text-4xl font-black ${score > 60 ? 'text-red-400' : score > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>{score}</span>
                <span className={`text-sm font-bold uppercase ${riskLevelColor(level)}`}>{level?.replace('_', ' ')}</span>
              </div>
              <div className="w-full bg-slate-800/60 h-2 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${scoreBarColor(score)}`} style={{ width: `${Math.min(100, score)}%` }} />
              </div>
            </>
          )}

          {/* Trust score */}
          {report.trust_score !== undefined && (
            <div className="flex items-center justify-between bg-black/30 rounded-lg p-2.5 border border-white/5">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px] text-slate-400">Trust Score</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-slate-800/60 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${report.trust_score > 60 ? 'bg-emerald-500' : report.trust_score > 30 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${report.trust_score}%` }} />
                </div>
                <span className={`text-[11px] font-bold font-mono ${report.trust_score > 60 ? 'text-emerald-400' : report.trust_score > 30 ? 'text-amber-400' : 'text-red-400'}`}>
                  {report.trust_score}/100
                </span>
              </div>
            </div>
          )}

          {/* Summary */}
          {report.summary && (
            <p className="text-[11px] text-slate-400 leading-relaxed border-t border-white/5 pt-3">{report.summary}</p>
          )}
        </div>

        {/* Quick stats */}
        <div className="p-4 grid grid-cols-2 gap-2 border-b border-white/5">
          {[
            { label: 'Claim Violations', val: activeClaimViolations.length, color: activeClaimViolations.length > 0 ? 'text-red-400' : 'text-emerald-400' },
            { label: 'Images Analyzed', val: report.images?.length || 0, color: 'text-slate-300' },
            { label: 'Dark Patterns', val: report.detected_dark_patterns?.length || 0, color: report.detected_dark_patterns?.length ? 'text-amber-400' : 'text-emerald-400' },
            { label: 'Evidence Items', val: report.evidence?.length || 0, color: report.evidence?.length ? 'text-red-400' : 'text-emerald-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-black/30 rounded-lg p-2.5 border border-white/5">
              <span className={`text-xl font-black block ${stat.color}`}>{stat.val}</span>
              <span className="text-[9px] text-slate-500">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Platform risk mini-grid */}
        {report.platform_enforcement_risk && (
          <div className="p-4 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Platform Risk</span>
            {Object.entries(report.platform_enforcement_risk).map(([platform, risk]) => {
              const r = risk as any;
              return (
                <div key={platform} className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 capitalize w-20">{platform}</span>
                  <div className="flex-1 mx-2 bg-slate-800/60 h-1 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${
                      r.risk_level === 'HIGH' || r.risk_level === 'CRITICAL' ? 'bg-red-500 w-4/5' :
                      r.risk_level === 'MEDIUM' ? 'bg-amber-500 w-3/5' :
                      r.risk_level === 'LOW' ? 'bg-yellow-500 w-2/5' : 'bg-emerald-500 w-1/5'
                    }`} />
                  </div>
                  <span className={`text-[9px] font-bold font-mono w-16 text-right ${riskLevelColor(r.risk_level)}`}>{r.risk_level}</span>
                </div>
              );
            })}
          </div>
        )}
      </aside>
    </div>
  );
}
