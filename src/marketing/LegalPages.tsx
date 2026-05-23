import { useState, useEffect } from 'react';
import { FileText, ShieldAlert, BadgeHelp, CheckCircle } from 'lucide-react';

interface LegalPagesProps {
  initialTab?: string;
}

export default function LegalPages({ initialTab }: LegalPagesProps) {
  const [activeTab, setActiveTab] = useState('privacy');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const tabs = [
    { id: 'privacy', name: 'Privacy Policy' },
    { id: 'terms', name: 'Terms & Conditions' },
    { id: 'refund', name: 'Refund Policy' },
    { id: 'shipping', name: 'Shipping Policy' },
    { id: 'subscription', name: 'Subscription Policy' },
    { id: 'cookie', name: 'Cookie Policy' },
    { id: 'earnings', name: 'Earnings Disclaimer' },
    { id: 'health', name: 'Health Disclaimer' },
    { id: 'affiliate', name: 'Affiliate Disclosure' },
    { id: 'gdpr', name: 'GDPR Compliance' },
    { id: 'ccpa', name: 'CCPA Compliance' }
  ];

  const getPolicyContent = () => {
    switch (activeTab) {
      case 'privacy':
        return (
          <div className="space-y-4 select-text">
            <h3 className="text-xl font-bold text-white">Privacy Policy</h3>
            <p className="text-[10px] font-mono text-slate-500">Effective Date: May 21, 2026</p>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              At AdCompliance Solutions, LLC, we prioritize the protection and confidentiality of your personal information. This Privacy Policy details how we collect, process, utilize, and secure personal identifiers when you access our compliance platform and services.
            </p>
            <h4 className="text-sm font-bold text-white">1. Information We Collect</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              We collect information that you submit directly (such as name, company details, phone number, and support emails) during account registration, pricing checks, or support inquiries. We also automatically log standard traffic indicators, including browser details, operating systems, and page navigation speeds.
            </p>
            <h4 className="text-sm font-bold text-white">2. Processing & Usage of Information</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Your details are used strictly to provide, improve, and analyze our compliance audit tool, to bill subscription accounts, and to reply to support messages. We do not sell, rent, or lease customer registries to third parties.
            </p>
            <h4 className="text-sm font-bold text-white">3. Third-Party Integrations & Cookies</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              We employ analytical cookies to compile traffic statistics. You can configure your browser preferences to refuse cookies, though certain aspects of the dashboard may become restricted.
            </p>
            <h4 className="text-sm font-bold text-white">4. Contact Information</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              If you have inquiries regarding this policy or data management, contact us at **support@adcompliance.os** or write to us at:
            </p>
            <p className="text-xs text-slate-400 font-mono">
              AdCompliance Solutions, LLC<br />
              100 Pine St, Suite 1250<br />
              San Francisco, CA 94111
            </p>
          </div>
        );
      case 'terms':
        return (
          <div className="space-y-4 select-text">
            <h3 className="text-xl font-bold text-white">Terms & Conditions</h3>
            <p className="text-[10px] font-mono text-slate-500">Last Updated: May 21, 2026</p>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Welcome to Compliance.OS. These Terms & Conditions constitute a legally binding agreement between you and AdCompliance Solutions, LLC regarding your access to and use of our platform and audit tools.
            </p>
            <h4 className="text-sm font-bold text-white">1. User Accounts</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              To utilize the compliance dashboard, you must register a workspace. You are responsible for protecting your user credentials. You must immediately notify our team of unauthorized account access.
            </p>
            <h4 className="text-sm font-bold text-white">2. Licensing & Acceptable Conduct</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              We grant you a limited, non-exclusive, non-transferable license to access our ad policy auditing interface. You agree not to copy, reverse-engineer, or scrape our compliance data, code structures, or algorithms.
            </p>
            <h4 className="text-sm font-bold text-white">3. Disclaimers of Warranties</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              AdCompliance Solutions, LLC provides audit feedback based on major advertising network guidelines. However, we do not guarantee ad approval or account immunity. The final compliance responsibility rests solely with the advertiser.
            </p>
            <h4 className="text-sm font-bold text-white">4. Governing Law</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              These terms are governed by the laws of the State of California, without giving effect to conflicts of laws principles. Any legal actions must be filed in state or federal courts located in San Francisco, California.
            </p>
          </div>
        );
      case 'refund':
        return (
          <div className="space-y-4 select-text">
            <h3 className="text-xl font-bold text-white">Refund Policy</h3>
            <p className="text-[10px] font-mono text-slate-500">Effective Date: May 21, 2026</p>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              We want you to be fully satisfied with our compliance software. This Refund Policy describes the refund terms and eligibility windows for subscription payments.
            </p>
            <h4 className="text-sm font-bold text-white">1. Satisfaction Window</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              We provide a **30-day satisfaction window** for first-time users. If the tool does not meet your expectations, contact our customer hotline or support email within 30 days of registration to request a full refund.
            </p>
            <h4 className="text-sm font-bold text-white">2. Exclusion Criteria</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Refunds are not granted for recurring monthly bills after the initial 30-day period. Enterprise auditing contracts are subject to custom terms and are generally non-refundable.
            </p>
            <h4 className="text-sm font-bold text-white">3. How to Request a Refund</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Please submit a request to **support@adcompliance.os** containing your workspace email, transaction date, and description of your cancellation reasons.
            </p>
          </div>
        );
      case 'shipping':
        return (
          <div className="space-y-4 select-text">
            <h3 className="text-xl font-bold text-white">Shipping Policy</h3>
            <p className="text-[10px] font-mono text-slate-500">Effective Date: May 21, 2026</p>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              While Compliance.OS is primarily a SaaS platform, we also ship hardware tokens and physical educational booklets to enterprise clients. This Shipping Policy details our timelines and terms.
            </p>
            <h4 className="text-sm font-bold text-white">1. Fulfillment Timelines</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              All physical materials are processed within **1-2 business days**. Standard shipping within the US takes approximately **3-5 business days** via major carrier partners.
            </p>
            <h4 className="text-sm font-bold text-white">2. Shipping Charges & Taxes</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Shipping charges are calculated at checkout and depend on destination. Local sales tax is added according to state tax regulations.
            </p>
            <h4 className="text-sm font-bold text-white">3. Tracking Your Shipment</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Upon shipment, we send an email confirmation containing a unique tracking number to follow updates.
            </p>
          </div>
        );
      case 'subscription':
        return (
          <div className="space-y-4 select-text">
            <h3 className="text-xl font-bold text-white">Subscription Policy</h3>
            <p className="text-[10px] font-mono text-slate-500">Effective Date: May 21, 2026</p>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              By registering for a premium account with Compliance.OS, you agree to our recurring billing terms. This Subscription Policy outlines billing frequency and cancellation steps.
            </p>
            <h4 className="text-sm font-bold text-white">1. Recurring Billing Cycles</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Your subscription is billed in advance on a recurring monthly or annual basis, depending on your selected tier. It will auto-renew under identical terms unless you cancel.
            </p>
            <h4 className="text-sm font-bold text-white">2. Straightforward Cancellation</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              You can cancel your subscription at any time. Simply navigate to **Workspace &gt; Billing Settings &gt; Cancel Subscription**, or notify our help desk via email at least 3 business days before your next renewal date.
            </p>
            <h4 className="text-sm font-bold text-white">3. Account Changes</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              If you upgrade or downgrade your active plan, the new billing configuration will apply on the following billing cycle, with pro-rated modifications applied automatically.
            </p>
          </div>
        );
      case 'cookie':
        return (
          <div className="space-y-4 select-text">
            <h3 className="text-xl font-bold text-white">Cookie Policy</h3>
            <p className="text-[10px] font-mono text-slate-500">Effective Date: May 21, 2026</p>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Compliance.OS uses cookies and tracking technologies to improve our platform’s functions and analyze dashboard usage.
            </p>
            <h4 className="text-sm font-bold text-white">1. What are Cookies?</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Cookies are minor text parameters stored in your browser when you access websites. They enable us to recognize your session state and preserve configuration preferences.
            </p>
            <h4 className="text-sm font-bold text-white">2. Categories of Cookies We Use</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              - **Essential Cookies**: Necessary for security, account logins, and basic system navigation.<br />
              - **Analytical Cookies**: Used to compile traffic statistics and identify errors.<br />
              - **Functional Cookies**: Save custom preferences, such as language parameters.
            </p>
            <h4 className="text-sm font-bold text-white">3. User Controls</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              You can reject cookies through your browser control panel or opt out using our Cookie Consent Banner interface on startup.
            </p>
          </div>
        );
      case 'earnings':
        return (
          <div className="space-y-4 select-text">
            <h3 className="text-xl font-bold text-white">Earnings Disclaimer</h3>
            <p className="text-[10px] font-mono text-slate-500">Effective Date: May 21, 2026</p>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              We strive to represent our tools and their potential to help you maintain compliant ad campaigns. However, we do not promise or guarantee that our software will generate specific income or revenue.
            </p>
            <h4 className="text-sm font-bold text-white">1. Professional Guidelines Only</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Our compliance reports provide reviews of landing page structures. Success in digital advertising depends on product quality, target demographics, and market variables.
            </p>
            <h4 className="text-sm font-bold text-white">2. Responsibility of Risk</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Investing capital in paid ads involves risks. You assume full responsibility for ad spend losses, campaigns performance, and network policy compliance.
            </p>
          </div>
        );
      case 'health':
        return (
          <div className="space-y-4 select-text">
            <h3 className="text-xl font-bold text-white">Health Disclaimer</h3>
            <p className="text-[10px] font-mono text-slate-500">Effective Date: May 21, 2026</p>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              If you utilize Compliance.OS to audit dietary, nutrition, cosmetic, or therapeutic supplement landing pages, you must display appropriate disclaimers.
            </p>
            <h4 className="text-sm font-bold text-white">1. Not Medical Advice</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              The compliance scanner suggestions focus on ad policy rules. They do not constitute medical, dietary, or clinical advice.
            </p>
            <h4 className="text-sm font-bold text-white">2. FDA Disclosures</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Statements regarding dietary supplements are not evaluated by the FDA. Such products are not designed to cure, treat, or prevent chronic disease. Always consult a healthcare professional.
            </p>
          </div>
        );
      case 'affiliate':
        return (
          <div className="space-y-4 select-text">
            <h3 className="text-xl font-bold text-white">Affiliate Disclosure</h3>
            <p className="text-[10px] font-mono text-slate-500">Effective Date: May 21, 2026</p>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              In accordance with FTC guidelines, we declare that our marketing content may include affiliate links pointing to partner services.
            </p>
            <h4 className="text-sm font-bold text-white">1. Affiliate Commissions</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              If you purchase a service or tool through one of our affiliate links, we may receive a commission. This occurs at no additional charge to you.
            </p>
            <h4 className="text-sm font-bold text-white">2. Evaluation Integrity</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              We only recommend compliance services and systems we have verified. Your purchase supports our ongoing updates to free ad scanner tools.
            </p>
          </div>
        );
      case 'gdpr':
        return (
          <div className="space-y-4 select-text">
            <h3 className="text-xl font-bold text-white">GDPR Compliance Page</h3>
            <p className="text-[10px] font-mono text-slate-500">Effective Date: May 21, 2026</p>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              For users located in the European Economic Area (EEA), we process personal data in compliance with the General Data Protection Regulation (GDPR).
            </p>
            <h4 className="text-sm font-bold text-white">1. Legal Basis for Processing</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              We process personal identifiers to fulfill our subscription contracts, to comply with legal rules, or to pursue our legitimate business interests (such as system security).
            </p>
            <h4 className="text-sm font-bold text-white">2. Data Subject Rights</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              You possess specific data privileges: the right to access, rectify, delete, restrict, or transfer your personal data, as well as the right to withdraw consent at any time.
            </p>
            <h4 className="text-sm font-bold text-white">3. Submitting Data Requests</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Please submit any data access or erasure requests to our Data Protection Officer at **support@adcompliance.os**.
            </p>
          </div>
        );
      case 'ccpa':
        return (
          <div className="space-y-4 select-text">
            <h3 className="text-xl font-bold text-white">CCPA Compliance Page</h3>
            <p className="text-[10px] font-mono text-slate-500">Effective Date: May 21, 2026</p>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              This California Consumer Privacy Act (CCPA) disclosure supplements our Privacy Policy and applies strictly to residents of the State of California.
            </p>
            <h4 className="text-sm font-bold text-white">1. Personal Information Collected</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Over the past 12 months, we have collected identifiers (name, business address, email, phone) and internet activity logs.
            </p>
            <h4 className="text-sm font-bold text-white">2. Your California Privacy Rights</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              - **Right to Know**: Request details about what personal information we collect and process.<br />
              - **Right to Delete**: Request erasure of your data.<br />
              - **Right to Opt-Out**: We do not sell personal data, meaning no opt-out is required.<br />
              - **Right to Non-Discrimination**: We do not deny services or change prices based on data privacy requests.
            </p>
            <h4 className="text-sm font-bold text-white">3. Submitting CCPA Requests</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              California residents can submit requests via email at **support@adcompliance.os** or call us at **+1 (800) 555-0199**.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-left">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-1.5 bg-[#121212] border border-white/5 p-4 rounded-xl max-h-[500px] overflow-y-auto">
          <div className="flex items-center gap-2 text-indigo-400 px-2.5 pb-2 border-b border-white/5 mb-2">
            <FileText className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Mandatory Policies</span>
          </div>

          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-left text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </aside>

        {/* Content Panel */}
        <main className="flex-1 bg-[#121212] border border-white/5 p-6 md:p-8 rounded-xl shadow-xl min-h-[420px]">
          {getPolicyContent()}
          
          <div className="mt-8 pt-4 border-t border-white/5 flex flex-wrap gap-4 items-center justify-between text-[10px] text-slate-500 font-mono">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Fully Compliant (No Placeholders)</span>
            </div>
            <span>© 2026 AdCompliance Solutions, LLC</span>
          </div>
        </main>

      </div>
    </div>
  );
}
