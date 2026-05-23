import { Shield, Sparkles, Check, ArrowRight, Star, AlertCircle, HelpCircle } from 'lucide-react';
import React, { useState } from 'react';

interface MarketingHomeProps {
  onLaunchWorkspace: () => void;
  onNavigateToTab: (tab: string) => void;
}

export default function MarketingHome({ onLaunchWorkspace, onNavigateToTab }: MarketingHomeProps) {
  const [checkoutStep, setCheckoutStep] = useState<'idle' | 'billing'>('idle');
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const features = [
    {
      title: "Compliance & Risk Prevention",
      description: "Detect fake celebrity endorsements, fabricated testimonials, fake urgency elements, and misleading countdowns instantly."
    },
    {
      title: "Landing Page Policy Scanner",
      description: "Audits DOM trees, text copy, and layouts, assigning real risk scores specific to Meta, Google, TikTok, and Snapchat Ads."
    },
    {
      title: "Interactive Live Builder",
      description: "Build pages with our real-time auditor. Refuses fake widgets and alerts you if non-compliant copy is typed."
    },
    {
      title: "Legal Policy Generator",
      description: "Create fully compliant Privacy Policies, CCPA / GDPR files, and disclosures customized to your corporate registers."
    }
  ];

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutSuccess(true);
    setTimeout(() => {
      setCheckoutSuccess(false);
      setCheckoutStep('idle');
      onLaunchWorkspace(); // Auto-redirect to dashboard upon sign up
    }, 2500);
  };

  return (
    <div className="text-left bg-[#0a0a0a] min-h-screen text-slate-200">
      
      {/* HERO SECTION */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>Ad Suspensions Solved</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-none">
              Build Ad Campaigns <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
                Suspension-Free
              </span>
            </h1>
            
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-lg">
              Pre-audit your landing pages, ad copies, and sales funnels. Automatically identify policies flags for Meta, Google, TikTok, and Snapchat before you submit.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <button
                onClick={onLaunchWorkspace}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                <span>Launch Free Scanner</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => {
                  const pricingEl = document.getElementById('pricing');
                  if (pricingEl) pricingEl.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg border border-white/10 hover:border-white/20 transition-all cursor-pointer"
              >
                View Plans
              </button>
            </div>

            {/* Micro Rating */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                Trusted by 2,500+ growth advertisers
              </span>
            </div>
          </div>

          {/* Interactive preview illustration */}
          <div className="relative border border-white/10 bg-[#0f0f15] p-6 rounded-2xl shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/60"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60"></span>
              </div>
              <span className="text-[9px] font-mono text-indigo-400 uppercase font-bold">compliance.os core scanner</span>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <strong className="text-white">Prohibited Health Claim Detected</strong>
                  <p className="text-slate-400 mt-0.5">"Miracle serum guarantees diabetes treatment in 3 days."</p>
                  <span className="text-indigo-400 block mt-1.5 hover:underline cursor-pointer font-bold">Suggested: "May help maintain normal metabolic health parameters."</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div className="text-xs text-emerald-400">
                  <strong>FDA Disclaimer Status: Valid</strong>
                  <p className="text-slate-400 mt-0.5">Mandatory above-fold statement detected in website footer details.</p>
                </div>
              </div>
            </div>

            <button
              onClick={onLaunchWorkspace}
              className="w-full py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-white text-xs font-bold rounded-lg border border-indigo-500/20 transition-all cursor-pointer text-center"
            >
              Analyze Your Ad Copies Live
            </button>
          </div>
        </div>
      </section>

      {/* PLATFORMS BADGE SECTION */}
      <section className="bg-[#0c0c0c] border-y border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-4">
            Auditing Guidelines Integrated Across Networks
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-sm font-bold text-slate-400">
            <span className="hover:text-white transition-all cursor-default">META ADS (FACEBOOK/IG)</span>
            <span className="hover:text-white transition-all cursor-default">GOOGLE ADS SUITE</span>
            <span className="hover:text-white transition-all cursor-default">TIKTOK MARKETING</span>
            <span className="hover:text-white transition-all cursor-default">SNAPCHAT ADVERTISING</span>
          </div>
        </div>
      </section>

      {/* PRODUCT FEATURES */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">Comprehensive Risk Management</h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
            Audit policies violations, health claims, Urgency patterns, pricing transparencies, and legal items.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => (
            <div key={idx} className="bg-[#121212] border border-white/5 p-5 rounded-xl hover:border-white/10 transition-all space-y-2">
              <h3 className="text-sm font-bold text-white">{feat.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">{feat.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TRANSPARENT PRICING & AUTO-SHIP CHECKOUT */}
      <section id="pricing" className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-12 bg-[#0c0c0c]/50 rounded-3xl border border-white/5">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">Transparent Pricing Tiers</h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
            Full billing transparency. Simple monthly plan structure. Cancellation is easy. No hidden installation fees.
          </p>
        </div>

        {checkoutStep === 'idle' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Free Tier */}
            <div className="bg-[#121212] border border-white/5 p-6 rounded-xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Starter Scan Free</h3>
                <span className="text-2xl font-black text-white block mt-3">$0<span className="text-xs font-normal text-slate-400">/forever</span></span>
                <p className="text-[11px] text-slate-400 mt-2">Basic URL scans using static policy rules.</p>
                
                <ul className="mt-5 space-y-2 text-[11.5px] text-slate-300">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Meta & Google Basics</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Manual Copy Input</li>
                </ul>
              </div>
              
              <button
                onClick={onLaunchWorkspace}
                className="mt-6 w-full py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg border border-white/10 hover:border-white/20 transition-all cursor-pointer"
              >
                Access Free Workspace
              </button>
            </div>

            {/* Premium Tier (Billed subscription, details upfront) */}
            <div className="bg-indigo-950/20 border-2 border-indigo-500/40 p-6 rounded-xl flex flex-col justify-between relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-indigo-600 text-[9px] font-bold uppercase rounded-full tracking-wider text-white">
                RECOMMENDED PLAN
              </span>
              
              <div>
                <h3 className="text-sm font-bold text-white">Pro Compliance Plan</h3>
                <span className="text-2xl font-black text-indigo-400 block mt-3">
                  $49<span className="text-xs font-normal text-slate-400">/month</span>
                </span>
                <p className="text-[11px] text-slate-300 mt-2">
                  Billed monthly auto-recurring. Includes all automated scanners and landing page builder support.
                </p>

                <ul className="mt-5 space-y-2 text-[11.5px] text-slate-300">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Full Gemini API Audit Scan</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Live Interactive LP Builder</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Custom legal Policy Generator</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Meta, Google, TikTok, Snapchat Scans</li>
                </ul>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => setCheckoutStep('billing')}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10"
                >
                  <span>Select Pro Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <span className="text-[9px] block text-center text-slate-400 select-text leading-tight">
                  Cancel anytime via email/settings. 30-day satisfaction refunds. No hidden fees.
                </span>
              </div>
            </div>

            {/* Enterprise Tier */}
            <div className="bg-[#121212] border border-white/5 p-6 rounded-xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Agency Core Suite</h3>
                <span className="text-2xl font-black text-white block mt-3">$199<span className="text-xs font-normal text-slate-400">/month</span></span>
                <p className="text-[11px] text-slate-400 mt-2">Automated volume API scans and multi-user configurations.</p>
                
                <ul className="mt-5 space-y-2 text-[11.5px] text-slate-300">
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Unlimited Team Accounts</li>
                  <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400" /> Custom API Webhook Scanner</li>
                </ul>
              </div>
              
              <button
                onClick={onLaunchWorkspace}
                className="mt-6 w-full py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg border border-white/10 hover:border-white/20 transition-all cursor-pointer"
              >
                Contact Sales
              </button>
            </div>

          </div>
        ) : (
          /* BILLING DISCLOSURE AND CHECKOUT MODAL */
          <div className="max-w-md mx-auto bg-[#121212] border border-white/10 rounded-2xl p-6 relative">
            <h3 className="text-base font-bold text-white mb-2">Secure Checkout Summary</h3>
            <p className="text-[11px] text-slate-400 leading-normal mb-4">
              Review our transparent billing disclosures before entering test checkout parameters.
            </p>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              
              {/* Product breakdown */}
              <div className="bg-black/40 border border-white/5 rounded-lg p-3 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Pro Compliance Subscription Plan</span>
                  <span className="text-white font-bold">$49.00</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>Activation & Setup Charges</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500 border-b border-white/5 pb-2">
                  <span>Sales Tax & Fees</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between items-center pt-1 font-bold text-indigo-400">
                  <span>Total Charges Today</span>
                  <span>$49.00</span>
                </div>
              </div>

              {/* Strict platform rules billing disclosures */}
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-[10px] text-slate-300 leading-normal space-y-1.5">
                <p><strong>* Mandatory Recurring Billing Agreement:</strong></p>
                <p>
                  By completing registration, you agree that you will be billed **$49.00 today** and every **30 days** thereafter. Charges will appear as *AdCompliance Solutions, LLC*.
                </p>
                <p>
                  <strong>Cancellation Window:</strong> You can opt out or terminate renewals at any time by sending a message to support@adcompliance.os or directly using account dashboard metrics.
                </p>
                <p>
                  <strong>Refund Guarantee:</strong> First-time orders are eligible for our 30-day refund window.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-mono uppercase text-slate-400">
                  Registration Email Address
                </label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-600 font-mono"
                  required
                />
              </div>

              {checkoutSuccess ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg text-center">
                  Payment Confirmed! Redirecting to dashboard...
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('idle')}
                    className="w-1/3 py-2 bg-white/5 text-slate-400 hover:text-white rounded-lg border border-white/10 text-xs transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer text-center"
                  >
                    Authorize Subscription
                  </button>
                </div>
              )}
            </form>
          </div>
        )}
      </section>

      {/* CORPORATE FOOTER WITH TRUST SIGNALS AND POLICY LINKS */}
      <footer className="bg-[#09090c] border-t border-white/5 py-12 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-xs select-text">
          
          {/* Brand block */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center font-bold text-white text-[11px]">C</div>
              <span className="font-bold text-white text-sm">COMPLIANCE.OS</span>
            </div>
            <p className="text-slate-400 leading-normal font-sans pr-4">
              Managed by **AdCompliance Solutions, LLC**, a registered company specializing in advertising guidelines validation and marketing transparency tools.
            </p>
            <div className="space-y-1 font-mono text-[10px] text-slate-500">
              <p>Corporate Reg: Del No. 839210-A</p>
              <p>Address: 100 Pine St, Suite 1250, San Francisco, CA 94111</p>
              <p>Support Hotlines: +1 (800) 555-0199 | support@adcompliance.os</p>
            </div>
          </div>

          {/* Site links */}
          <div className="space-y-3">
            <span className="font-mono text-[10px] uppercase text-slate-400 block tracking-wider">Workspace Navigation</span>
            <div className="flex flex-col gap-2 font-medium">
              <button onClick={onLaunchWorkspace} className="text-left text-indigo-400 hover:underline cursor-pointer">Compliance Dashboard</button>
              <button onClick={() => onNavigateToTab('about')} className="text-left text-slate-400 hover:text-white cursor-pointer">About Corporate Profile</button>
              <button onClick={() => onNavigateToTab('contact')} className="text-left text-slate-400 hover:text-white cursor-pointer">Contact Support</button>
              <button onClick={() => onNavigateToTab('faq')} className="text-left text-slate-400 hover:text-white cursor-pointer">Frequently Asked Questions</button>
            </div>
          </div>

          {/* Social links & trust badges */}
          <div className="space-y-3">
            <span className="font-mono text-[10px] uppercase text-slate-400 block tracking-wider">Social Channels</span>
            <div className="flex gap-3 text-slate-400 font-medium">
              <a href="https://twitter.com/compliance_os" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400">Twitter</a>
              <a href="https://linkedin.com/company/compliance_os" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400">LinkedIn</a>
              <a href="https://github.com/compliance_os" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400">GitHub</a>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-slate-500 select-none">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-mono uppercase tracking-wider">Platform safe certified</span>
            </div>
          </div>
        </div>

        {/* 11 MANDATORY LEGAL POLICY LINKS FOR FOOTER */}
        <div className="max-w-6xl mx-auto border-t border-white/5 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[10.5px] text-slate-400 font-medium">
            <button onClick={() => onNavigateToTab('legal-privacy')} className="hover:text-indigo-400 hover:underline cursor-pointer">Privacy Policy</button>
            <button onClick={() => onNavigateToTab('legal-terms')} className="hover:text-indigo-400 hover:underline cursor-pointer">Terms & Conditions</button>
            <button onClick={() => onNavigateToTab('legal-refund')} className="hover:text-indigo-400 hover:underline cursor-pointer">Refund Policy</button>
            <button onClick={() => onNavigateToTab('legal-shipping')} className="hover:text-indigo-400 hover:underline cursor-pointer">Shipping Policy</button>
            <button onClick={() => onNavigateToTab('legal-subscription')} className="hover:text-indigo-400 hover:underline cursor-pointer">Subscription Policy</button>
            <button onClick={() => onNavigateToTab('legal-cookie')} className="hover:text-indigo-400 hover:underline cursor-pointer">Cookie Policy</button>
            <button onClick={() => onNavigateToTab('legal-earnings')} className="hover:text-indigo-400 hover:underline cursor-pointer">Earnings Disclaimer</button>
            <button onClick={() => onNavigateToTab('legal-health')} className="hover:text-indigo-400 hover:underline cursor-pointer">Health Disclaimer</button>
            <button onClick={() => onNavigateToTab('legal-affiliate')} className="hover:text-indigo-400 hover:underline cursor-pointer">Affiliate Disclosure</button>
            <button onClick={() => onNavigateToTab('legal-gdpr')} className="hover:text-indigo-400 hover:underline cursor-pointer">GDPR Compliance</button>
            <button onClick={() => onNavigateToTab('legal-ccpa')} className="hover:text-indigo-400 hover:underline cursor-pointer">CCPA Compliance</button>
          </div>
          
          <div className="text-[10px] text-slate-600 font-mono text-center md:text-right">
            © 2026 AdCompliance Solutions, LLC. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
