import { Shield, Sparkles, CheckCircle, XCircle, AlertTriangle, FileText, Plus, ArrowRight, Trash2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { ScanReport, LandingPage } from '../types';

interface OverviewProps {
  userToken: string;
  onNavigateToTab: (tab: string) => void;
  onEditPage: (page: LandingPage) => void;
}

export default function Overview({ userToken, onNavigateToTab, onEditPage }: OverviewProps) {
  const [scanHistory, setScanHistory] = useState<ScanReport[]>([]);
  const [savedPages, setSavedPages] = useState<LandingPage[]>([]);
  const [contactInquiries, setContactInquiries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [userToken]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${userToken}` };
      
      const scansRes = await fetch('/api/scans', { headers });
      const pagesRes = await fetch('/api/builder/pages', { headers });
      
      if (scansRes.ok) setScanHistory(await scansRes.json());
      if (pagesRes.ok) setSavedPages(await pagesRes.json());
      
      // If admin, fetch recent contact inquiries for display
      const username = localStorage.getItem('compliance_username') || '';
      if (username.toLowerCase().includes('admin')) {
        const msgRes = await fetch('/api/contact/messages', { headers }); // We'll add this endpoint to list for admin
        if (msgRes.ok) setContactInquiries(await msgRes.json());
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePage = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this page?')) return;
    try {
      const response = await fetch(`/api/builder/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      if (response.ok) {
        setSavedPages(savedPages.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Calculate global compliance averages
  const overallComplianceScore = scanHistory.length > 0 
    ? Math.round(scanHistory.reduce((acc, s) => acc + s.approvalScore, 0) / scanHistory.length)
    : 85;

  const getRiskStatus = (score: number) => {
    if (score < 40) return { label: "High Risk", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" };
    if (score < 75) return { label: "Moderate Risk", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" };
    return { label: "Low Risk", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
  };

  const riskStatus = getRiskStatus(overallComplianceScore);

  // Network scores
  const getNetworkScore = (channel: string) => {
    const channelScans = scanHistory.filter(s => s.channel === channel);
    return channelScans.length > 0 
      ? Math.round(channelScans.reduce((acc, s) => acc + s.approvalScore, 0) / channelScans.length)
      : 80; // Default placeholder for display
  };

  const networks = [
    { name: 'Meta Ads', key: 'Meta', score: getNetworkScore('Meta') },
    { name: 'Google Ads', key: 'Google', score: getNetworkScore('Google') },
    { name: 'TikTok Ads', key: 'TikTok', score: getNetworkScore('TikTok') },
    { name: 'Snapchat Ads', key: 'Snapchat', score: getNetworkScore('Snapchat') }
  ];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#111114]">
        <div className="text-center text-xs text-slate-400 space-y-2">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <span>Loading Dashboard metrics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#0e0e11] text-left space-y-6">
      
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Workspace Overview</h2>
          <p className="text-xs text-slate-400">Review compliance audits and monitor live page risk allocations.</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => onNavigateToTab('scanner')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>New Scan</span>
          </button>
          
          <button 
            onClick={() => onNavigateToTab('builder')}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Page</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        
        {/* Overall Score */}
        <div className="bg-[#121216] border border-white/5 p-5 rounded-2xl md:col-span-2 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">COMPLIANCE INDEX</span>
              <strong className="text-2xl font-black text-white mt-1.5 block">Overall Score</strong>
            </div>
            
            <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase ${riskStatus.bg} ${riskStatus.color} ${riskStatus.border}`}>
              {riskStatus.label}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <span className={`text-4xl font-black ${overallComplianceScore < 40 ? 'text-red-500' : overallComplianceScore < 75 ? 'text-amber-500' : 'text-emerald-400 font-extrabold'}`}>
              {overallComplianceScore}%
            </span>
            <div className="flex-1 bg-slate-800 h-2.5 rounded-full overflow-hidden block relative">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${overallComplianceScore < 40 ? 'bg-red-500' : overallComplianceScore < 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${overallComplianceScore}%` }}
              ></div>
            </div>
          </div>
          
          <p className="text-[10.5px] text-slate-400 mt-3 border-t border-white/5 pt-2.5 leading-normal">
            Based on {scanHistory.length} campaign scans. Resolve active critical flags in reports to boost approval odds.
          </p>
        </div>

        {/* Network Scores Grid */}
        <div className="md:col-span-3 grid grid-cols-2 gap-4">
          {networks.map((net) => {
            const netStatus = getRiskStatus(net.score);
            return (
              <div key={net.key} className="bg-[#121216] border border-white/5 p-4 rounded-xl flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white">{net.name}</span>
                  <span className={`text-xs font-mono font-bold ${netStatus.color}`}>{net.score}/100</span>
                </div>
                <div className="w-full bg-slate-800/60 h-1.5 rounded-full overflow-hidden mt-3 relative">
                  <div 
                    className={`h-full rounded-full ${net.score < 40 ? 'bg-red-500' : net.score < 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${net.score}%` }}
                  ></div>
                </div>
                <span className="text-[9.5px] text-slate-500 mt-2 block font-mono">
                  Status: <strong className={netStatus.color}>{netStatus.label}</strong>
                </span>
              </div>
            );
          })}
        </div>

      </div>

      {/* Saved Landing Pages & Scan History Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Landing Page Builder Projects */}
        <div className="bg-[#121216] border border-white/5 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Compliance Builder Pages</span>
            </h3>
            
            <button 
              onClick={() => onNavigateToTab('builder')}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold hover:underline cursor-pointer"
            >
              Launch Builder
            </button>
          </div>

          {savedPages.length === 0 ? (
            <div className="p-8 text-center bg-black/10 border border-white/5 border-dashed rounded-xl">
              <p className="text-xs text-slate-400 font-sans">No landing pages built yet.</p>
              <button
                onClick={() => onNavigateToTab('builder')}
                className="mt-3 px-3.5 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded text-xs font-bold cursor-pointer"
              >
                Create First Compliant Page
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {savedPages.map((page) => (
                <div
                  key={page.id}
                  onClick={() => onEditPage(page)}
                  className="p-3 bg-[#0a0a0d] border border-white/5 hover:border-indigo-500/30 rounded-lg flex items-center justify-between cursor-pointer transition-all hover:bg-indigo-950/5"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-white block leading-snug">{page.title}</span>
                    <span className="text-[10px] text-slate-500 block">
                      Saved: {new Date(page.timestamp || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-[9.5px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono border border-emerald-500/20">
                      Approved Template
                    </span>
                    <button
                      onClick={(e) => handleDeletePage(page.id || '', e)}
                      className="p-1 text-slate-500 hover:text-red-500 transition-all cursor-pointer"
                      title="Delete Page"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Scan History */}
        <div className="bg-[#121216] border border-white/5 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Recent Scan History</span>
            </h3>
            
            <button 
              onClick={() => onNavigateToTab('scanner')}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold hover:underline cursor-pointer"
            >
              Auditor Screen
            </button>
          </div>

          {scanHistory.length === 0 ? (
            <div className="p-8 text-center bg-black/10 border border-white/5 border-dashed rounded-xl">
              <p className="text-xs text-slate-400 font-sans">No scans run yet.</p>
              <button
                onClick={() => onNavigateToTab('scanner')}
                className="mt-3 px-3.5 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded text-xs font-bold cursor-pointer"
              >
                Scan First Asset
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {scanHistory.map((scan) => {
                const scanStatus = getRiskStatus(scan.approvalScore);
                return (
                  <div
                    key={scan.id}
                    className="p-3 bg-[#0a0a0d] border border-white/5 rounded-lg flex items-center justify-between"
                  >
                    <div className="space-y-1 select-text">
                      <span className="text-xs font-semibold text-white block leading-snug truncate max-w-[200px]">
                        {scan.url || 'Creative Copy Draft Scan'}
                      </span>
                      <div className="flex gap-2 text-[9.5px] text-slate-500">
                        <span>Channel: <strong>{scan.channel}</strong></span>
                        <span>•</span>
                        <span>{new Date(scan.timestamp || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${scanStatus.bg} ${scanStatus.color} border ${scanStatus.border}`}>
                        {scan.approvalScore}/100
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Admin Information logs (Displays if admin coordinates are verified) */}
      {contactInquiries.length > 0 && (
        <div className="bg-[#121216] border border-white/5 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2.5">
            Admin Panel: Customer Support Tickets
          </h3>
          
          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
            {contactInquiries.map((inq) => (
              <div key={inq.id} className="p-3 bg-black/40 border border-white/5 rounded-lg text-xs leading-normal select-text">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-bold text-indigo-400">{inq.name} ({inq.email})</span>
                  <span className="text-[10px] text-slate-500 font-mono">{new Date(inq.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-slate-300 italic">"{inq.message}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
