import { Shield, Target, Users, BookOpen } from 'lucide-react';

export default function AboutUs() {
  const values = [
    {
      icon: <Shield className="w-5 h-5 text-indigo-400" />,
      title: "Trust First",
      description: "We help brands establish long-term ad-account credibility, moving away from short-term deceptive tricks that result in suspensions."
    },
    {
      icon: <Target className="w-5 h-5 text-emerald-400" />,
      title: "Real-time Precision",
      description: "Our AI model adapts instantly to updated ad-network guidelines, flagging policy infractions dynamically before review queues scan them."
    },
    {
      icon: <Users className="w-5 h-5 text-amber-400" />,
      title: "Consumer Protection",
      description: "We verify billing transparency, subscription disclosures, and legal page compliance to shield consumers from opaque checkouts."
    }
  ];

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-left space-y-12">
      
      {/* Title */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Our Story</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl tracking-tight">
          About Compliance.OS
        </h2>
        <p className="mt-4 max-w-2xl mx-auto text-sm text-slate-400">
          Empowering marketers to build transparent, highly-converting, and fully policy-compliant advertising assets.
        </p>
      </div>

      {/* Main Grid Story */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-[#121212] border border-white/5 p-6 md:p-8 rounded-2xl">
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Our Mission</h3>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Compliance.OS was founded in 2026 by a team of ad policy auditors, legal analysts, and software engineers. We noticed that high-quality brands often had their advertising campaigns flagged or accounts disabled due to minor compliance mistakes, such as missing disclaimer text, broken links, or bracketed template pages.
          </p>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            By embedding ad guidelines and legal standards directly into our scanning and building workflows, we help brands increase ad approvals and foster long-term customer trust.
          </p>
        </div>
        
        {/* Compliance metrics showcase box */}
        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-5 space-y-4 font-mono">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-[10px] text-slate-400">AUDITED LANDING PAGES</span>
            <span className="text-xs font-bold text-emerald-400">48,200+</span>
          </div>
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-[10px] text-slate-400">AD NETWORKS COMPARED</span>
            <span className="text-xs font-bold text-indigo-400">Meta, Google, TikTok, Snapchat</span>
          </div>
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-[10px] text-slate-400">SUSPENSION RATE REDUCTION</span>
            <span className="text-xs font-bold text-amber-500">92.4% Average</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400">FTC & FDA COMPLIANCE ALIGNMENT</span>
            <span className="text-xs font-bold text-white">100% Fully Verified</span>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-white text-center">Core Foundations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {values.map((val, idx) => (
            <div key={idx} className="border border-white/5 bg-[#121212] p-5 rounded-xl space-y-3 flex flex-col items-start hover:border-white/10 transition-all">
              <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                {val.icon}
              </div>
              <h4 className="text-sm font-bold text-white">{val.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">{val.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team Profile */}
      <div className="p-6 border border-white/5 bg-[#121212] rounded-xl text-center">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Corporate Identity</h3>
        <p className="text-xs text-slate-400 leading-normal max-w-xl mx-auto font-sans">
          Compliance.OS is operated by **AdCompliance Solutions, LLC**, a registered business entity. We are committed to transparency, displaying our corporate details, and assisting advertisers globally.
        </p>
      </div>

    </div>
  );
}
