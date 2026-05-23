import { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Save, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  RotateCcw,
  Sliders,
  HelpCircle,
  Eye,
  FileText,
  FileCheck,
  ChevronDown
} from 'lucide-react';
import { LandingPage, LandingPageState } from '../types';

interface PageBuilderProps {
  userToken: string;
  initialPageToLoad?: LandingPage | null;
}

const DEFAULT_SECTIONS: LandingPageState['elements'] = [
  {
    id: 'sec_header',
    type: 'header',
    title: 'Header Navigation',
    content: 'Welcome to [BRAND NAME] - Premium Wellness Solutions',
    originalContent: 'Welcome to [BRAND NAME] - Premium Wellness Solutions',
    compliantContent: 'Welcome to NovaPeak Nutrition - Premium Wellness Solutions',
    status: 'warning',
    issueDetails: 'Contains unreplaced template placeholder "[BRAND NAME]". All placeholders must be replaced with active business identities.',
    options: {}
  },
  {
    id: 'sec_hero',
    type: 'hero',
    title: 'Hero Banner Headline & Copy',
    content: 'Melt Away Excess Pounds, Fast! Our new formula will cure your diabetes and manage blood pressure naturally in just 7 days.',
    originalContent: 'Melt Away Excess Pounds, Fast! Our new formula will cure your diabetes and manage blood pressure naturally in just 7 days.',
    compliantContent: 'Support Healthy Weight Management Goals. Our advanced formula helps maintain healthy metabolic rates and blood sugar levels already within the normal range.',
    status: 'critical',
    issueDetails: 'Contains direct medical cure claims ("cure your diabetes", "manage blood pressure") and aggressive weight loss claims ("melt away excess pounds, fast"). Meta, Google, and TikTok ad algorithms block these direct disease treatment claims.',
    options: {}
  },
  {
    id: 'sec_benefits',
    type: 'benefits',
    title: 'Product Benefits List',
    content: '100% Guaranteed Weight Loss. Safely dissolves fat cells. Regulates cardiovascular systems with zero side effects.',
    originalContent: '100% Guaranteed Weight Loss. Safely dissolves fat cells. Regulates cardiovascular systems with zero side effects.',
    compliantContent: 'Supports energy levels and daily metabolism. Formulated with antioxidants to complement balanced dietary routines. Crucial support for active lifestyle plans.',
    status: 'critical',
    issueDetails: 'Directly promises biological function alterations ("dissolves fat cells", "regulates cardiovascular systems") and uses absolute guarantees ("100% Guaranteed Weight Loss"). These statements trigger immediate misleading practices policy reviews.',
    options: {}
  },
  {
    id: 'sec_testimonial',
    type: 'testimonial',
    title: 'Customer Testimonial',
    content: '"I dropped 25 lbs in 2 weeks and completely reversed my A1C levels! No diet or exercise needed." - Verified Buyer',
    originalContent: '"I dropped 25 lbs in 2 weeks and completely reversed my A1C levels! No diet or exercise needed." - Verified Buyer',
    compliantContent: '"This product has been a great addition to my healthy morning routine. I feel more energetic and active." - Sarah K. (Note: results may vary based on diet and exercise)',
    status: 'critical',
    issueDetails: 'Testimonials making extreme medical claims ("reversed my A1C", "no diet or exercise needed") violate FTC endorsement standards and ad network policies. Requires balanced disclaimers indicating results depend on personal routines.',
    options: {}
  },
  {
    id: 'sec_urgency',
    type: 'urgency',
    title: 'Urgency & Scarcity Banner',
    content: 'WARNING: Only 5 spots left today, May 21! Act now before our stock is completely sold out forever.',
    originalContent: 'WARNING: Only 5 spots left today, May 21! Act now before our stock is completely sold out forever.',
    compliantContent: 'We strive to process orders daily and keep our warehouse stocked to meet demand. Thank you for your support.',
    status: 'warning',
    issueDetails: 'Uses high-pressure dynamic urgency banners asserting physical supply limits tied directly to today\'s date. Major ad networks flag these as deceptive and misleading marketing tricks.',
    options: {
      fakeCountdown: true,
      fakeStock: true,
      fakeViewers: false
    }
  },
  {
    id: 'sec_pricing',
    type: 'pricing',
    title: 'Pricing & Subscription Options',
    content: '$39 per bottle. (Billed as a recurring subscription every 30 days unless canceled)',
    originalContent: '$39 per bottle. (Billed as a recurring subscription every 30 days unless canceled)',
    compliantContent: '$39 per bottle. Auto-ship subscription delivers fresh supplies every 30 days. Cancel easily anytime via support email or telephone with zero penalty.',
    status: 'compliant',
    options: {}
  },
  {
    id: 'sec_disclaimer',
    type: 'disclaimer',
    title: 'FDA / FTC Legal Disclaimer',
    content: '[Placeholder Disclaimer - Not Yet Configured]',
    originalContent: '[Placeholder Disclaimer - Not Yet Configured]',
    compliantContent: 'These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease. Always check with your medical advisor before altering your supplement routine.',
    status: 'warning',
    issueDetails: 'Missing or placeholder FDA/FTC medical disclaimer. Consumer health products require prominent disclosures stating that statements are not evaluated by the FDA.',
    options: {}
  },
  {
    id: 'sec_footer',
    type: 'footer',
    title: 'Footer Links & Business Legitimacy',
    content: '© 2026 [BRAND NAME]. Support: support@brandname.com | Address: 123 Mock Street, Suite A, Wilmington, DE',
    originalContent: '© 2026 [BRAND NAME]. Support: support@brandname.com | Address: 123 Mock Street, Suite A, Wilmington, DE',
    compliantContent: '© 2026 NovaPeak Nutrition Solutions, LLC. Support: support@getnovapeaknutrition.com | Phone: +1 (800) 349-8134 | Address: 1209 North Orange St, Wilmington, DE 19801',
    status: 'warning',
    issueDetails: 'Contains mock placeholder emails ("support@brandname.com") and placeholder brand tags. Requires valid local corporate addresses and customer service lines for payment/ad network approval.',
    options: {}
  }
];

export default function PageBuilder({ userToken }: PageBuilderProps) {
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState("Compliant Supplement Landing Page");
  const [elements, setElements] = useState<LandingPageState['elements']>(DEFAULT_SECTIONS);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(DEFAULT_SECTIONS[1].id);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showSavedList, setShowSavedList] = useState(false);

  // Widget settings managed globally
  const [fakeCountdown, setFakeCountdown] = useState(true);
  const [fakeStock, setFakeStock] = useState(true);
  const [fakeViewers, setFakeViewers] = useState(false);

  // Load saved pages on mount
  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/builder/pages', {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPages(data);
      }
    } catch (err) {
      console.error('Failed to load builder pages:', err);
    }
  };

  // Perform Real-Time Compliance Auditing on client-side state
  const complianceReport = useMemo(() => {
    let score = 95;
    const items = elements.map(el => {
      let status: 'compliant' | 'warning' | 'critical' = 'compliant';
      let issueDetails = '';
      const text = el.content.toLowerCase();

      // Rule 1: Disease curing / clinical claims (Critical)
      const hasCure = /cure|heal|treat|disease|diabetes|hypertension|blood pressure|a1c/i.test(text);
      if (hasCure && el.type !== 'disclaimer') {
        status = 'critical';
        issueDetails = 'Prohibited direct medical claim. Dietary supplements cannot promise to cure, treat, heal, or manage chronic health conditions (e.g. diabetes, blood pressure).';
        score -= 15;
      }

      // Rule 2: Unrealistic rapid weight loss / physical changes (Critical / Warning)
      const hasMelt = /melt|drop.*lbs|lose.*lbs.*weeks|fast.*pounds|dissolve.*fat/i.test(text);
      if (hasMelt && status !== 'critical') {
        status = 'critical';
        issueDetails = 'Aggressive weight-loss speed claim detected. Promising rapid weight reduction ("melt pounds fast") or fat-dissolving guarantees violates ad policies.';
        score -= 12;
      }

      // Rule 3: Guarantees and absolute claims (Warning / Critical)
      const hasGuarantee = /100% guaranteed|guaranteed weight loss|zero side effects|no diet or exercise/i.test(text);
      if (hasGuarantee && status === 'compliant') {
        status = 'warning';
        issueDetails = 'Uses absolute guarantees or misleading assurances ("100% guarantee", "no diet or exercise needed"). Soften claims to reflect supportive attributes.';
        score -= 8;
      }

      // Rule 4: Placeholders and unreplaced brackets (Warning)
      const hasPlaceholders = /\[brand name\]|\[company name\]|placeholder|brandname|support@brandname\.com/i.test(text);
      if (hasPlaceholders && status === 'compliant') {
        status = 'warning';
        issueDetails = 'Contains unreplaced template placeholders. All bracketed markers and support addresses must represent authentic operating coordinates.';
        score -= 7;
      }

      // Rule 5: Missing Disclaimer checks
      if (el.type === 'disclaimer' && (text.includes('placeholder') || !text.includes('evaluate') || !text.includes('diagnose'))) {
        status = 'warning';
        issueDetails = 'Missing or incomplete FDA/FTC medical disclaimer structure. Ensure standard evaluate/diagnose terminology is present.';
        score -= 10;
      }

      // Special urgency rules based on widgets
      if (el.type === 'urgency') {
        const hasDateUrgency = /today|spots left|expires|midnight/i.test(text);
        if ((fakeCountdown || fakeStock || fakeViewers || hasDateUrgency) && status === 'compliant') {
          status = 'warning';
          issueDetails = 'Urgency element uses dynamic limits or active artificial timers. Deceptive urgency tactics are flagged by crawler algorithms.';
          if (fakeCountdown) score -= 6;
          if (fakeStock) score -= 6;
          if (fakeViewers) score -= 6;
        }
      }

      return {
        ...el,
        status,
        issueDetails
      };
    });

    // Clamp score
    score = Math.max(15, score);
    
    return {
      score,
      elements: items
    };
  }, [elements, fakeCountdown, fakeStock, fakeViewers]);

  // Sync compliance scores back into elements for rendering
  const auditedElements = complianceReport.elements;

  // Handle live edit changes
  const handleContentChange = (id: string, newContent: string) => {
    setElements(prev => prev.map(el => {
      if (el.id === id) {
        return { ...el, content: newContent };
      }
      return el;
    }));
  };

  // Inline Quick Patch
  const applyPatch = (id: string) => {
    setElements(prev => prev.map(el => {
      if (el.id === id) {
        return { 
          ...el, 
          content: el.compliantContent || el.content 
        };
      }
      return el;
    }));
  };

  // Revert Patch
  const revertPatch = (id: string) => {
    setElements(prev => prev.map(el => {
      if (el.id === id) {
        return { 
          ...el, 
          content: el.originalContent || el.content 
        };
      }
      return el;
    }));
  };

  // Save current design
  const handleSavePage = async () => {
    setSaveStatus('saving');
    try {
      const payload: LandingPage = {
        id: selectedPageId || undefined,
        title: pageTitle,
        pageState: { elements: auditedElements }
      };

      const res = await fetch('/api/builder/save', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedPage = await res.json();
        setSelectedPageId(savedPage.id);
        setSaveStatus('saved');
        fetchPages(); // refresh pages list
        setTimeout(() => setSaveStatus('idle'), 2500);
      } else {
        throw new Error();
      }
    } catch (err) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2500);
    }
  };

  // Load a page
  const loadPage = (page: LandingPage) => {
    setSelectedPageId(page.id || null);
    setPageTitle(page.title);
    setElements(page.pageState.elements);
    setShowSavedList(false);
  };

  // Start fresh template
  const resetToDefaultTemplate = () => {
    setSelectedPageId(null);
    setPageTitle("Compliant Supplement Landing Page");
    setElements(DEFAULT_SECTIONS);
    setFakeCountdown(true);
    setFakeStock(true);
    setFakeViewers(false);
  };

  // Download HTML page
  const downloadHTML = () => {
    const pageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-55 text-gray-800 antialiased font-sans">
  <div class="max-w-3xl mx-auto py-12 px-6">
    <!-- Header -->
    <header class="border-b pb-4 mb-8 flex justify-between items-center">
      <h1 class="text-xl font-bold text-indigo-700">${auditedElements.find(e => e.id === 'sec_header')?.content}</h1>
    </header>

    <!-- Main -->
    <main class="space-y-10">
      <section class="text-center py-6">
        <h2 class="text-3xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
          ${auditedElements.find(e => e.id === 'sec_hero')?.content}
        </h2>
      </section>

      <!-- Benefits -->
      <section class="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100">
        <h3 class="text-lg font-bold text-indigo-900 mb-3">Key Supportive Values</h3>
        <p class="whitespace-pre-line text-indigo-955 text-sm font-medium leading-relaxed">
          ${auditedElements.find(e => e.id === 'sec_benefits')?.content}
        </p>
      </section>

      <!-- Testimonial -->
      <section class="italic border-l-4 border-indigo-600 pl-4 py-2 my-6 text-gray-650">
        ${auditedElements.find(e => e.id === 'sec_testimonial')?.content}
      </section>

      <!-- Pricing -->
      <section class="bg-white border rounded-xl p-6 shadow-sm flex flex-col items-center">
        <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">Pricing Strategy</span>
        <h4 class="text-2xl font-bold text-gray-900 mt-2">
          ${auditedElements.find(e => e.id === 'sec_pricing')?.content}
        </h4>
      </section>

      <!-- Scarcity banner if toggled compliantly -->
      <section class="bg-amber-50 border border-amber-200 p-4 rounded-lg text-center text-sm text-amber-800">
        ${auditedElements.find(e => e.id === 'sec_urgency')?.content}
      </section>
    </main>

    <!-- Footer & Disclaimer -->
    <footer class="mt-16 border-t pt-8 text-xs text-gray-500 space-y-6">
      <div class="bg-gray-100 p-4 rounded border">
        <p class="leading-relaxed">
          ${auditedElements.find(e => e.id === 'sec_disclaimer')?.content}
        </p>
      </div>
      <p class="text-center">
        ${auditedElements.find(e => e.id === 'sec_footer')?.content}
      </p>
    </footer>
  </div>
</body>
</html>`;

    const blob = new Blob([pageHtml], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${pageTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-audit.html`;
    link.click();
  };

  const selectedElement = auditedElements.find(el => el.id === selectedElementId);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#111114]">
      
      {/* BUILDER HEADER */}
      <header className="px-6 py-4 bg-[#0d0d10] border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 select-none text-left">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1 max-w-sm">
            <input
              type="text"
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-indigo-500 px-1 py-0.5 text-sm font-bold text-white focus:outline-none w-full"
              placeholder="Landing Page Title..."
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* LOAD DROPDOWN */}
          <div className="relative">
            <button
              onClick={() => setShowSavedList(!showSavedList)}
              className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-slate-300 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer font-medium"
            >
              <span>Load Page ({pages.length})</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showSavedList && (
              <div className="absolute right-0 mt-1 w-64 bg-[#18181c] border border-white/10 rounded-xl shadow-2xl z-50 p-2 text-left">
                <span className="text-[10px] text-slate-500 font-mono block px-2.5 py-1.5 border-b border-white/5 uppercase">Saved Layouts</span>
                {pages.length === 0 ? (
                  <span className="text-xs text-slate-500 block px-2.5 py-3">No saved pages yet.</span>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-1 py-1.5">
                    {pages.map(p => (
                      <button
                        key={p.id}
                        onClick={() => loadPage(p)}
                        className="w-full px-2.5 py-2 hover:bg-white/5 text-left text-xs rounded-lg text-slate-350 hover:text-white transition-all flex items-center gap-2 border border-transparent hover:border-white/5"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate flex-1">{p.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={resetToDefaultTemplate}
            className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-slate-300 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={downloadHTML}
            className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-slate-300 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer font-medium"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Export HTML</span>
          </button>

          <button
            disabled={saveStatus === 'saving'}
            onClick={handleSavePage}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Page'}
            </span>
          </button>
        </div>
      </header>

      {/* DUAL COLUMN WORKSPACE */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT COMPLIANCE SIDEBAR */}
        <aside className="w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-white/5 bg-[#0e0e11] flex flex-col overflow-y-auto shrink-0 select-none text-left">
          
          {/* COMPLIANCE SCORE CARD */}
          <div className="p-5 border-b border-white/5 bg-gradient-to-br from-indigo-950/20 to-transparent flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Compliance Audit</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                complianceReport.score >= 90 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                complianceReport.score >= 70 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {complianceReport.score >= 90 ? 'High Approval' : complianceReport.score >= 70 ? 'Medium Risk' : 'Suspension Risk'}
              </span>
            </div>

            <div className="flex items-center gap-4 py-2">
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center rounded-full bg-black/40 border border-white/5">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-white/5"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={175.92}
                    strokeDashoffset={175.92 - (175.92 * complianceReport.score) / 100}
                    className={`transition-all duration-1000 ${
                      complianceReport.score >= 90 ? 'text-emerald-400' : 
                      complianceReport.score >= 70 ? 'text-amber-400' : 
                      'text-red-500'
                    }`}
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-xl font-extrabold text-white">{complianceReport.score}</span>
                  <span className="text-[10px] text-slate-400 block font-mono">/100</span>
                </div>
              </div>
              
              <div className="flex-1">
                <h4 className="text-xs font-bold text-white">Interactive Landing Page score</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed mt-1">
                  We run ad-network crawler checks against titles, disclaimers, billing schedules, and claims. Patch violations to increase approval odds.
                </p>
              </div>
            </div>
          </div>

          {/* ACTIVE AD WIDGET CONTROLS */}
          <div className="p-5 border-b border-white/5 flex flex-col gap-4">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Urgency & Urgency Widgets</span>
            <div className="space-y-3.5">
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-200">Fake Urgency Countdown</span>
                  <span className="text-[10px] text-slate-500">Auto-expires offering a false deadline timer.</span>
                </div>
                <input
                  type="checkbox"
                  checked={fakeCountdown}
                  onChange={(e) => setFakeCountdown(e.target.checked)}
                  className="w-4 h-4 bg-black border-white/10 rounded accent-indigo-600 focus:outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-200">Fake Stock / Supply Counter</span>
                  <span className="text-[10px] text-slate-500">Displays static low stock values dynamically.</span>
                </div>
                <input
                  type="checkbox"
                  checked={fakeStock}
                  onChange={(e) => setFakeStock(e.target.checked)}
                  className="w-4 h-4 bg-black border-white/10 rounded accent-indigo-600 focus:outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-200">Fake Live Viewers Count</span>
                  <span className="text-[10px] text-slate-500">Shows fake visitor figures (e.g. '27 others viewing').</span>
                </div>
                <input
                  type="checkbox"
                  checked={fakeViewers}
                  onChange={(e) => setFakeViewers(e.target.checked)}
                  className="w-4 h-4 bg-black border-white/10 rounded accent-indigo-600 focus:outline-none cursor-pointer"
                />
              </div>

            </div>
          </div>

          {/* ELEMENT LIST NAVIGATION */}
          <div className="flex-1 p-4">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest px-2 block mb-3">Landing page elements</span>
            <div className="space-y-1">
              {auditedElements.map(el => {
                const isSelected = el.id === selectedElementId;
                const hasCritical = el.status === 'critical';
                const hasWarning = el.status === 'warning';
                
                return (
                  <button
                    key={el.id}
                    onClick={() => setSelectedElementId(el.id)}
                    className={`w-full px-3 py-2.5 rounded-xl text-left text-xs transition-all flex items-center gap-3 border ${
                      isSelected 
                        ? 'bg-indigo-600/10 border-indigo-600/35 text-white' 
                        : 'bg-white/3 border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <div className="shrink-0">
                      {hasCritical ? (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      ) : hasWarning ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`block font-bold truncate ${isSelected ? 'text-indigo-400' : 'text-slate-355'}`}>{el.title}</span>
                      <span className="block text-[10px] text-slate-500 truncate mt-0.5">{el.content}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </aside>

        {/* RIGHT EDITOR & PREVIEW PANELS */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#121216]">
          
          {/* TOP INLINE EDITOR PANEL */}
          {selectedElement && (
            <div className="p-5 bg-[#0f0f13] border-b border-white/5 shrink-0 text-left">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-white">Element Editor: {selectedElement.title}</h3>
                </div>

                <div className="flex gap-2">
                  {selectedElement.status !== 'compliant' && (
                    <button
                      onClick={() => applyPatch(selectedElement.id)}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-md flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Apply Safe Copy</span>
                    </button>
                  )}
                  {selectedElement.content !== selectedElement.originalContent && (
                    <button
                      onClick={() => revertPatch(selectedElement.id)}
                      className="px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[10px] rounded-md transition-all cursor-pointer"
                      title="Revert to Original Text"
                    >
                      Revert
                    </button>
                  )}
                </div>
              </div>

              {/* EDITOR FIELD */}
              <div className="flex flex-col gap-3">
                <textarea
                  value={selectedElement.content}
                  onChange={(e) => handleContentChange(selectedElement.id, e.target.value)}
                  rows={2}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans leading-relaxed resize-none"
                  placeholder="Type section layout copywriting copy..."
                />

                {/* COMPLIANCE ALERT MESSAGE WITHIN THE EDITOR */}
                {selectedElement.status !== 'compliant' && (
                  <div className={`p-3 rounded-xl border flex gap-3 ${
                    selectedElement.status === 'critical' 
                      ? 'bg-red-500/5 border-red-500/20 text-red-400' 
                      : 'bg-amber-500/5 border-amber-500/20 text-amber-400'
                  }`}>
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1 text-[11px] leading-relaxed">
                      <span className="font-bold block">Ad Policy Conflict Detected</span>
                      <p className="mt-0.5 text-slate-400">{selectedElement.issueDetails}</p>
                      
                      <div className="mt-2.5 p-2 bg-black/45 rounded-lg border border-white/5 font-mono text-[10px] text-slate-300">
                        <span className="font-bold block uppercase tracking-wider text-indigo-400 text-[9px] mb-1">Recommended compliant copy:</span>
                        {selectedElement.compliantContent}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LOWER WORKSPACE LIVE HTML PAGE PREVIEW */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0d] flex justify-center">
            
            <div className="w-full max-w-2xl bg-white text-slate-800 rounded-2xl shadow-2xl border border-white/5 overflow-hidden flex flex-col select-text text-left font-sans">
              
              {/* BROWSER TOP BAR MOCKUP */}
              <div className="bg-slate-100 px-4 py-2 flex items-center gap-2 border-b">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-350"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-350"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-350"></div>
                </div>
                <div className="flex-1 max-w-sm bg-white border rounded text-[10px] text-slate-500 px-2 py-0.5 mx-auto font-mono text-center truncate">
                  https://compliance-os.dev/builder/live-page-sandbox
                </div>
              </div>

              {/* LIVE CONTENT RENDER */}
              <div className="p-8 space-y-10 flex-1 bg-white min-h-[500px]">
                
                {/* 1. HEADER */}
                <header className="border-b pb-4 flex justify-between items-center">
                  <div className="font-extrabold text-sm text-indigo-650 tracking-wider">
                    {auditedElements.find(e => e.id === 'sec_header')?.content}
                  </div>
                  <div className="flex gap-4 text-xs font-semibold text-slate-500">
                    <span>Products</span>
                    <span>Reviews</span>
                    <span>FAQ</span>
                  </div>
                </header>

                {/* 2. HERO */}
                <section className="text-center py-6">
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    {auditedElements.find(e => e.id === 'sec_hero')?.content}
                  </h2>
                  <div className="mt-5 flex justify-center">
                    <button className="bg-indigo-600 text-white font-bold text-xs px-6 py-2.5 rounded-lg shadow-md shadow-indigo-600/10">
                      Claim Your Bottle Now
                    </button>
                  </div>
                </section>

                {/* 3. BENEFITS */}
                <section className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100">
                  <h3 className="text-sm font-bold text-indigo-900 mb-2 uppercase tracking-wide">Product Benefits</h3>
                  <p className="text-xs text-indigo-950 font-medium leading-relaxed whitespace-pre-line">
                    {auditedElements.find(e => e.id === 'sec_benefits')?.content}
                  </p>
                </section>

                {/* 4. TESTIMONIAL */}
                <section className="bg-slate-50 p-5 rounded-xl border italic text-xs text-slate-600 relative">
                  <span className="text-2xl text-slate-300 font-serif absolute -top-2 left-2">“</span>
                  <div className="pl-4">
                    {auditedElements.find(e => e.id === 'sec_testimonial')?.content}
                  </div>
                </section>

                {/* 5. URGENCY WIDGETS DISPLAY */}
                <section className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-center text-xs text-amber-800 space-y-2">
                  <p className="font-semibold">{auditedElements.find(e => e.id === 'sec_urgency')?.content}</p>
                  
                  {/* Dynamic widgets simulation */}
                  <div className="flex justify-center items-center gap-6 mt-3 text-[10px] text-amber-900">
                    {fakeCountdown && (
                      <div className="bg-amber-100 border border-amber-200/50 px-2 py-1 rounded flex items-center gap-1 font-mono">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                        <span>OFFER ENDS IN: 14m 58s</span>
                      </div>
                    )}
                    {fakeStock && (
                      <div className="bg-amber-100 border border-amber-200/50 px-2 py-1 rounded flex items-center gap-1 font-mono font-bold">
                        <span>ONLY 3 BOTTLES LEFT</span>
                      </div>
                    )}
                    {fakeViewers && (
                      <div className="bg-amber-100 border border-amber-200/50 px-2 py-1 rounded flex items-center gap-1 font-mono">
                        <span>27 PEOPLE VIEWING RIGHT NOW</span>
                      </div>
                    )}
                  </div>
                </section>

                {/* 6. PRICING */}
                <section className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50 flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Special Billing Offer</span>
                  <h4 className="text-xl font-extrabold text-slate-900">
                    {auditedElements.find(e => e.id === 'sec_pricing')?.content}
                  </h4>
                  <p className="text-[10px] text-slate-500">Fully transparent terms. Standard refund policies apply.</p>
                </section>

                {/* 7. DISCLAIMER */}
                <section className="bg-slate-100/70 p-4 rounded border text-[10px] text-slate-500 leading-relaxed">
                  {auditedElements.find(e => e.id === 'sec_disclaimer')?.content}
                </section>

                {/* 8. FOOTER */}
                <footer className="border-t pt-6 text-[10px] text-slate-400 text-center space-y-2">
                  <p>{auditedElements.find(e => e.id === 'sec_footer')?.content}</p>
                </footer>

              </div>
            </div>

          </div>

        </main>

      </div>

    </div>
  );
}
