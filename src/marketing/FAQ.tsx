import { useState } from 'react';
import { ChevronDown, Shield, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQS: FAQItem[] = [
  {
    category: "General Policy",
    question: "Why do advertising accounts get suspended?",
    answer: "Ad accounts are most commonly suspended due to policy violations detected by automated crawlers. These include deceptive urgenies (fake timers), unsubstantiated medical or financial claims, unverified testimonials, lack of corporate transparency (missing business registrations/contacts), and broken legal policy links in footers."
  },
  {
    category: "Platform Specifics",
    question: "What are the key policy differences between Meta and Google Ads?",
    answer: "Meta Ads focuses heavily on user experience and safety (personal wellness claims, weight-loss products, unacceptable business models, and deceptive landing page redirects). Google Ads emphasizes transparency, brand legitimacy, and user consent, actively scanning for misrepresentation and strict tracking/cookie disclosures."
  },
  {
    category: "Snapchat Policies",
    question: "Does Snapchat have strict age restrictions for health products?",
    answer: "Yes, Snapchat Ads require that all weight-loss, dieting, and body-shaping supplements target audiences aged 18 and older exclusively. They also strictly prohibit sensational titles, extreme body aesthetics, and fake certificates."
  },
  {
    category: "Landing Pages",
    question: "What legal pages are mandatory to link in our footer?",
    answer: "To satisfy payment processors and ad platforms, you must link full, compliant versions of: Privacy Policy, Terms & Conditions, Refund Policy, Shipping Policy, Subscription Policy (if billing is recurring), Cookie Policy, GDPR Page, CCPA Page, and applicable disclaimers (Earnings, Health, Affiliate)."
  },
  {
    category: "AI Auditor",
    question: "How does the AI Compliance Scanner work?",
    answer: "Our scanner acts like ad platform crawler bots. It ingests your landing page DOM or draft copywriting, extracts text and layout triggers, and runs heuristics matching against FTC guidelines and Meta/Google/TikTok/Snapchat policy databases to identify suspension risks before you launch campaigns."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-left">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Frictionless Answers</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl tracking-tight">
          Compliance FAQ
        </h2>
        <p className="mt-4 max-w-2xl mx-auto text-sm text-slate-400">
          Learn about advertising guidelines, suspension risk prevention, and landing page auditing standards.
        </p>
      </div>

      <div className="space-y-4">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`border rounded-xl transition-all ${
                isOpen 
                  ? 'border-indigo-500/30 bg-indigo-950/10' 
                  : 'border-white/5 bg-[#121212] hover:border-white/10'
              }`}
            >
              <button
                onClick={() => toggleFAQ(idx)}
                className="w-full px-5 py-4.5 flex justify-between items-center text-left focus:outline-none cursor-pointer"
              >
                <div className="flex flex-col gap-1 pr-4">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest">
                    {faq.category}
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {faq.question}
                  </span>
                </div>
                <div className={`p-1 bg-white/5 rounded-lg border border-white/5 transition-transform ${isOpen ? 'rotate-180 text-indigo-400 border-indigo-500/20' : 'text-slate-400'}`}>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  isOpen ? 'max-h-60 border-t border-white/5' : 'max-h-0'
                }`}
              >
                <div className="p-5 text-xs text-slate-300 leading-relaxed font-sans">
                  {faq.answer}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* COMPLIANT TRUST BLOCK */}
      <div className="mt-12 p-5 border border-emerald-500/20 bg-emerald-500/5 rounded-xl flex gap-3 items-start">
        <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs">
          <strong className="text-white block mb-0.5">Trust & Integrity Guarantee</strong>
          <p className="text-slate-300 leading-relaxed">
            All compliance recommendations are designed in coordination with recent FTC guides, Meta Ad Policies, and Google Merchant Standards to secure advertising campaigns.
          </p>
        </div>
      </div>
    </div>
  );
}
