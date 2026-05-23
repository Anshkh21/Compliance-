import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  Briefcase, 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface PolicyGeneratorProps {
  userToken: string;
}

const AVAILABLE_POLICIES = [
  { id: 'privacy', name: 'Privacy Policy', desc: 'Required by Meta, Google, GDPR, and CCPA.' },
  { id: 'terms', name: 'Terms & Conditions', desc: 'Sets platform usage rules and limits liabilities.' },
  { id: 'refund', name: 'Refund Policy', desc: 'Required by payment processors and billing systems.' },
  { id: 'shipping', name: 'Shipping Policy', desc: 'Outlines standard fulfillment schedules.' },
  { id: 'subscription', name: 'Subscription Terms', desc: 'Discloses auto-renew terms to prevent deceptive billing flags.' },
  { id: 'cookie', name: 'Cookie Policy', desc: 'Identifies analytical tracking tags used.' },
  { id: 'earnings', name: 'Earnings Disclaimer', desc: 'Required for financial, coaching, or trading copy.' },
  { id: 'health', name: 'Health Disclaimer', desc: 'Required for dietary supplements, fitness, or cosmetics.' },
  { id: 'affiliate', name: 'Affiliate Disclosure', desc: 'Declares commercial relationships in compliance with FTC.' },
  { id: 'gdpr', name: 'GDPR Compliance Page', desc: 'Data privacy disclosures for European audiences.' },
  { id: 'ccpa', name: 'CCPA Compliance Page', desc: 'Data privacy disclosures for California audiences.' }
];

export default function PolicyGenerator({ userToken }: PolicyGeneratorProps) {
  // Form fields
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [domain, setDomain] = useState("");
  const [jurisdiction, setJurisdiction] = useState("Delaware");
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>(
    AVAILABLE_POLICIES.map(p => p.id)
  );

  // States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<any | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState('privacy');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const togglePolicy = (id: string) => {
    if (selectedPolicies.includes(id)) {
      setSelectedPolicies(selectedPolicies.filter(p => p !== id));
    } else {
      setSelectedPolicies([...selectedPolicies, id]);
    }
  };

  const handleSelectAll = () => {
    setSelectedPolicies(AVAILABLE_POLICIES.map(p => p.id));
  };

  const handleSelectNone = () => {
    setSelectedPolicies([]);
  };

  // Generate templates locally
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !companyAddress || !supportEmail || !supportPhone || !domain) {
      alert("Please fill in all required business information fields.");
      return;
    }

    setIsGenerating(true);
    // Mimic API lag
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const response = await fetch('/api/policies/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          companyName,
          companyAddress,
          supportEmail,
          supportPhone,
          selectedPolicies
        })
      });

      if (!response.ok) {
        throw new Error();
      }

      // Generate texts
      const resultData = generatePolicyTexts();
      setGeneratedData(resultData);
      
      // Select first generated policy as active tab
      const firstTab = selectedPolicies.find(id => resultData[id]) || 'privacy';
      setActivePreviewTab(firstTab);
    } catch (err) {
      console.error(err);
      // fallback local render anyway
      const resultData = generatePolicyTexts();
      setGeneratedData(resultData);
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePolicyTexts = () => {
    const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const formattedDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').toLowerCase();
    
    return {
      privacy: `PRIVACY POLICY
Effective Date: ${today}

At ${companyName}, accessible from https://${formattedDomain}, we prioritize the protection and confidentiality of your personal information. This Privacy Policy details how we collect, process, utilize, and secure personal identifiers when you access our website and purchase our services.

1. INFORMATION WE COLLECT
We collect information that you submit directly (such as name, company details, phone number, and support emails) during account registration, order placement, or customer support inquiries. We also automatically log standard traffic indicators, including browser details, operating systems, and page navigation metrics.

2. PROCESSING & USAGE OF INFORMATION
Your details are used strictly to provide, improve, and analyze our products, to process subscription billing accounts, and to reply to support messages. We do not sell, rent, or lease customer registries to third parties.

3. THIRD-PARTY INTEGRATIONS & COOKIES
We employ analytical cookies to compile traffic statistics and understand user behavior. You can configure your browser preferences to refuse cookies, though certain aspects of the website may become restricted.

4. JURISDICTION & GOVERNING LAW
This Privacy Policy is governed by the laws of the State of ${jurisdiction}.

5. CONTACT INFORMATION
If you have inquiries regarding this policy or data management, contact us at:
Email: ${supportEmail}
Phone: ${supportPhone}
Address:
${companyAddress}`,

      terms: `TERMS & CONDITIONS
Last Updated: ${today}

Welcome to ${companyName}. These Terms & Conditions constitute a legally binding agreement between you and ${companyName} regarding your access to and use of our platform, website, and products.

1. USER ACCOUNTS
To utilize our services, you may be required to register a user account. You are responsible for protecting your user credentials. You must immediately notify our team of unauthorized account access.

2. LICENSING & ACCEPTABLE CONDUCT
We grant you a limited, non-exclusive, non-transferable license to access our platform. You agree not to copy, reverse-engineer, or scrape our data, code structures, or assets.

3. DISCLAIMERS OF WARRANTIES
${companyName} provides its services on an "as is" and "as available" basis. We do not guarantee specific outcomes, revenue targets, or absolute system uptime. The final responsibility for implementing compliance recommendations rests solely with the user.

4. GOVERNING LAW & JURISDICTION
These terms are governed by the laws of the State of ${jurisdiction}, without giving effect to conflicts of laws principles. Any legal actions must be filed in state or federal courts located in the State of ${jurisdiction}.

5. CONTACT US
For any questions regarding these Terms, please contact us:
Email: ${supportEmail}
Phone: ${supportPhone}
Address:
${companyAddress}`,

      refund: `REFUND & RETURN POLICY
Effective Date: ${today}

We want you to be fully satisfied with your purchase. This Refund Policy describes the refund terms and eligibility windows for payments made to ${companyName}.

1. SATISFACTION WINDOW
We provide a 30-day satisfaction window for first-time purchases. If our products or services do not meet your expectations, contact our customer support team within 30 days of purchase to request a full refund.

2. EXCLUSION CRITERIA
Refunds are not granted for recurring subscription fees billed after the initial 30-day period. Custom enterprise contracts are subject to individual written terms and are generally non-refundable.

3. HOW TO REQUEST A REFUND
Please submit a request to ${supportEmail} containing your workspace email, transaction date, and description of your cancellation reasons. You can also contact our support team at ${supportPhone}.

4. SHIPPING & PROCESSING
Approved refunds will be processed and credited back to the original method of payment within 5 to 10 business days.`,

      shipping: `SHIPPING & FULFILLMENT POLICY
Effective Date: ${today}

This Shipping Policy details our timelines and terms for any physical materials, tokens, or guides dispatched by ${companyName}.

1. FULFILLMENT TIMELINES
All physical materials are processed and prepared for shipping within 1-2 business days. Standard shipping within the United States takes approximately 3-5 business days via major carrier partners.

2. SHIPPING CHARGES & TAXES
Shipping charges are calculated at checkout and depend on destination. Local sales tax is added according to state tax regulations.

3. TRACKING YOUR SHIPMENT
Upon shipment, we send an email confirmation containing a unique tracking number to follow updates.

4. CONTACT SUPPORT
If you have any questions about your order, please email ${supportEmail} or call ${supportPhone}.`,

      subscription: `SUBSCRIPTION BILLING POLICY
Effective Date: ${today}

By registering for a recurring account with ${companyName}, you agree to our recurring billing terms. This Subscription Policy outlines billing frequency and cancellation steps.

1. RECURRING BILLING CYCLES
Your subscription is billed in advance on a recurring monthly or annual basis, depending on your selected tier. It will auto-renew under identical terms unless you cancel.

2. STRAIGHTFORWARD CANCELLATION
You can cancel your subscription at any time. Simply navigate to your Account Billing Settings and select Cancel Subscription, or notify our help desk via email at ${supportEmail} at least 3 business days before your next renewal date.

3. ACCOUNT CHANGES
If you upgrade or downgrade your active plan, the new billing configuration will apply on the following billing cycle, with pro-rated modifications applied automatically.`,

      cookie: `COOKIE DISCLOSURE POLICY
Effective Date: ${today}

${companyName} uses cookies and tracking technologies to improve our platform’s functions, analyze website traffic, and deliver personalized experiences.

1. WHAT ARE COOKIES?
Cookies are minor text parameters stored in your browser when you access websites. They enable us to recognize your session state and preserve configuration preferences.

2. CATEGORIES OF COOKIES WE USE
- Essential Cookies: Necessary for security, account logins, and basic system navigation.
- Analytical Cookies: Used to compile traffic statistics and identify errors.
- Functional Cookies: Save custom preferences, such as language parameters.

3. USER CONTROLS
You can reject cookies through your browser control panel or opt out using our Cookie Consent Banner interface on startup. Rejecting cookies may affect website functionality.`,

      earnings: `EARNINGS DISCLAIMER
Effective Date: ${today}

We strive to represent our tools, training, and resources accurately. However, ${companyName} does not promise, represent, or guarantee that you will earn any specific income or revenue by using our software.

1. PROFESSIONAL GUIDELINES ONLY
Our compliance reports and materials provide reviews of landing page structures. Success in digital advertising depends on product quality, target demographics, marketing budget, and various external market variables.

2. RESPONSIBILITY OF RISK
Investing capital in paid ads involves risk. You assume full responsibility for ad spend losses, campaign performance, and compliance flags. Past performance is no guarantee of future results.`,

      health: `HEALTH DISCLAIMER
Effective Date: ${today}

This Health Disclaimer applies to all informational resources, guidelines, and compliance suggestions provided by ${companyName} regarding dietary, cosmetic, or therapeutic products.

1. NOT MEDICAL ADVICE
The compliance scanner suggestions focus on ad policy rules. They do not constitute medical, dietary, or clinical advice. Always check with your healthcare provider before shifting health supplement plans.

2. FDA DISCLOSURES
Statements regarding dietary supplements or wellness products have not been evaluated by the Food and Drug Administration (FDA). These items are not designed to diagnose, cure, treat, or prevent any chronic clinical conditions.`,

      affiliate: `AFFILIATE DISCLOSURE
Effective Date: ${today}

In accordance with FTC guidelines, ${companyName} declares that our marketing content may include affiliate links pointing to third-party services and tools.

1. AFFILIATE COMMISSIONS
If you purchase a service or tool through one of our affiliate links, we may receive a commission. This occurs at no additional charge to you.

2. EVALUATION INTEGRITY
We only recommend compliance services and systems we have verified. Your purchase supports our ongoing updates to free ad scanner tools.`,

      gdpr: `GDPR COMPLIANCE PAGE
Effective Date: ${today}

For users located in the European Economic Area (EEA), we process personal data in compliance with the General Data Protection Regulation (GDPR).

1. LEGAL BASIS FOR PROCESSING
We process personal identifiers to fulfill our contracts, comply with legal rules, or to pursue our legitimate business interests (such as system security).

2. DATA SUBJECT RIGHTS
You possess specific data privileges under GDPR:
- Right to Access: Request details on data collected.
- Right to Rectification: Correct inaccurate details.
- Right to Erasure: Request data deletion.
- Right to Restrict Processing: Limit how we use your data.
- Right to Withdraw Consent: Revoke permissions anytime.

3. SUBMITTING DATA REQUESTS
Please submit any data access or erasure requests to our Data Protection Officer at: ${supportEmail}.`,

      ccpa: `CCPA COMPLIANCE PAGE
Effective Date: ${today}

This California Consumer Privacy Act (CCPA) disclosure supplements our Privacy Policy and applies strictly to residents of the State of California.

1. PERSONAL INFORMATION COLLECTED
Over the past 12 months, we have collected identifiers (name, business address, email, phone) and internet activity logs. We do not sell personal data, meaning no opt-out is required.

2. YOUR CALIFORNIA PRIVACY RIGHTS
- Right to Know: Request details about what personal information we collect and process.
- Right to Delete: Request erasure of your data.
- Right to Non-Discrimination: We do not deny services or change prices based on data privacy requests.

3. CCPA REQUESTS
California residents can submit requests via email at ${supportEmail} or call us at ${supportPhone}.`
    };
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadPolicyFile = (id: string, name: string, text: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`;
    link.click();
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#111114]">
      
      {/* HEADER */}
      <header className="px-6 py-4 bg-[#0d0d10] border-b border-white/5 flex items-center justify-between z-10 shrink-0 select-none text-left">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Legal Policy Generator</h2>
            <p className="text-[10px] text-slate-500">Draft ad-compliant legal policies with actual corporate details</p>
          </div>
        </div>
      </header>

      {/* DUAL WORKSPACE */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT FORM COLUMN */}
        <aside className="w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-white/5 bg-[#0e0e11] overflow-y-auto p-5 shrink-0 text-left select-none">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Business Information</h3>
          
          <form onSubmit={handleGenerate} className="space-y-4">
            
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono text-slate-550 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                <span>Company Legal Name *</span>
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. NovaPeak Nutrition, LLC"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono text-slate-550 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                <span>Corporate Physical Address *</span>
              </label>
              <input
                type="text"
                required
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                placeholder="e.g. 1209 North Orange St, Wilmington, DE 19801"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-slate-550 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Support Email *</span>
                </label>
                <input
                  type="email"
                  required
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="support@domain.com"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-slate-550 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Support Phone *</span>
                </label>
                <input
                  type="text"
                  required
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  placeholder="+1 (800) 555-0199"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-slate-550 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Website Domain *</span>
                </label>
                <input
                  type="text"
                  required
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="getnovapeaknutrition.com"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-slate-550 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-500" />
                  <span>State Jurisdiction *</span>
                </label>
                <input
                  type="text"
                  required
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  placeholder="Delaware"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                />
              </div>
            </div>

            <div className="h-[1px] bg-white/5 my-4"></div>

            {/* POLICY CHOICE LIST */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Select Policies</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono transition-all cursor-pointer"
                  >
                    All
                  </button>
                  <span className="text-[10px] text-slate-600 font-mono">|</span>
                  <button
                    type="button"
                    onClick={handleSelectNone}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono transition-all cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {AVAILABLE_POLICIES.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => togglePolicy(p.id)}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex items-start gap-3 ${
                      selectedPolicies.includes(p.id)
                        ? 'bg-indigo-600/5 border-indigo-600/30'
                        : 'bg-black/20 border-white/5 hover:bg-black/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPolicies.includes(p.id)}
                      onChange={() => {}} // handled by parent div click
                      className="w-3.5 h-3.5 mt-0.5 pointer-events-none accent-indigo-600"
                    />
                    <div className="flex-1">
                      <span className="text-xs font-bold text-slate-250 block">{p.name}</span>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">{p.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating || selectedPolicies.length === 0}
              className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 disabled:text-slate-500 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Drafting Legal Content...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span>Generate policies ({selectedPolicies.length})</span>
                </>
              )}
            </button>
          </form>
        </aside>

        {/* RIGHT PREVIEW COLUMN */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#0c0c0f]">
          {generatedData ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* TAB CONTROLS */}
              <div className="px-5 py-3 border-b border-white/5 bg-[#101014] flex flex-wrap gap-1.5 shrink-0 select-none text-left">
                {AVAILABLE_POLICIES.filter(p => selectedPolicies.includes(p.id)).map(p => (
                  <button
                    key={p.id}
                    onClick={() => setActivePreviewTab(p.id)}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                      activePreviewTab === p.id
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200 bg-white/5'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>

              {/* RENDER ACTIVE TAB POLICY */}
              {AVAILABLE_POLICIES.filter(p => selectedPolicies.includes(p.id) && activePreviewTab === p.id).map(p => {
                const text = generatedData[p.id] || "";
                return (
                  <div key={p.id} className="flex-1 flex flex-col overflow-hidden text-left">
                    
                    {/* TOOLS */}
                    <div className="px-6 py-3 bg-[#111116] border-b border-white/5 flex items-center justify-between shrink-0 select-none">
                      <div className="flex items-center gap-2 text-indigo-400">
                        <FileText className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">{p.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(p.id, text)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold rounded-lg border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          {copiedId === p.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy to Clipboard</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => downloadPolicyFile(p.id, p.name, text)}
                          className="px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 border border-indigo-600/25 hover:border-indigo-600/40 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download TXT</span>
                        </button>
                      </div>
                    </div>

                    {/* POLICY TEXT DISPLAY */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 select-text">
                      <pre className="text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed max-w-3xl">
                        {text}
                      </pre>
                    </div>

                  </div>
                );
              })}

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-slate-450 mb-4 animate-pulse">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-white">No Policy Generated Yet</h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1.5 leading-relaxed">
                Provide your corporate coordinates on the left panel, choose policy scopes, and click generate to build compliant website documents.
              </p>
            </div>
          )}
        </main>

      </div>

    </div>
  );
}
