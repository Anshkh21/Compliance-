import { useState, useEffect } from 'react';
import { 
  Shield, 
  Sparkles, 
  Globe, 
  FileText, 
  Sliders, 
  Plus, 
  ArrowRight, 
  Lock, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight,
  User as UserIcon,
  LayoutDashboard,
  Terminal,
  Layers,
  FileCheck
} from 'lucide-react';

import { User, LandingPage } from './types';
import MarketingHome from './marketing/MarketingHome';
import AboutUs from './marketing/AboutUs';
import ContactUs from './marketing/ContactUs';
import FAQ from './marketing/FAQ';
import LegalPages from './marketing/LegalPages';
import AuthScreen from './dashboard/AuthScreen';
import Overview from './dashboard/Overview';
import AdScanner from './scanner/AdScanner';
import PageBuilder from './builder/PageBuilder';
import PolicyGenerator from './generator/PolicyGenerator';

export default function App() {
  // Routing: 'marketing' | 'about' | 'contact' | 'faq' | 'legal' | 'auth' | 'workspace'
  const [currentRoute, setCurrentRouteRaw] = useState<'marketing' | 'about' | 'contact' | 'faq' | 'legal' | 'auth' | 'workspace'>(() => {
    return (localStorage.getItem('compliance_route') as any) || 'marketing';
  });
  
  // Workspace Tab: 'overview' | 'scanner' | 'builder' | 'generator'
  const [workspaceTab, setWorkspaceTabRaw] = useState<'overview' | 'scanner' | 'builder' | 'generator'>(() => {
    return (localStorage.getItem('compliance_tab') as any) || 'overview';
  });

  // Wrappers that also persist to localStorage
  const setCurrentRoute = (route: typeof currentRoute) => {
    localStorage.setItem('compliance_route', route);
    setCurrentRouteRaw(route);
  };
  const setWorkspaceTab = (tab: typeof workspaceTab) => {
    localStorage.setItem('compliance_tab', tab);
    setWorkspaceTabRaw(tab);
  };
  
  // States for sub-routing options
  const [legalPagesTab, setLegalPagesTab] = useState('privacy');
  const [selectedPageForBuilder, setSelectedPageForBuilder] = useState<LandingPage | null>(null);
  
  // Authentication states
  const [userToken, setUserToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  
  // Mobile responsive nav toggles
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize Auth state from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('compliance_auth_token');
    const storedUser = localStorage.getItem('compliance_username');
    if (token) {
      setUserToken(token);
      setUsername(storedUser || 'User');
    } else {
      // No auth token — reset route to marketing to avoid blank workspace
      setCurrentRouteRaw('marketing');
      localStorage.removeItem('compliance_route');
      localStorage.removeItem('compliance_tab');
    }
  }, []);


  const handleLaunchWorkspace = () => {
    const token = localStorage.getItem('compliance_auth_token');
    if (token) {
      setCurrentRoute('workspace');
      setWorkspaceTab('overview');
    } else {
      setCurrentRoute('auth');
    }
    setMobileMenuOpen(false);
  };

  const handleAuthSuccess = (user: User) => {
    setUserToken(user.id);
    setUsername(user.username);
    setCurrentRoute('workspace');
    setWorkspaceTab('overview');
  };

  const handleLogout = () => {
    localStorage.removeItem('compliance_auth_token');
    localStorage.removeItem('compliance_username');
    localStorage.removeItem('compliance_route');
    localStorage.removeItem('compliance_tab');
    localStorage.removeItem('compliance_last_report');
    setUserToken(null);
    setUsername(null);
    setCurrentRouteRaw('marketing');
  };

  const handleGlobalNavigation = (tab: string) => {
    setMobileMenuOpen(false);
    setSelectedPageForBuilder(null);
    
    // Check legal page tabs
    if (tab.startsWith('legal-')) {
      const pageId = tab.substring(6);
      setLegalPagesTab(pageId);
      setCurrentRoute('legal');
      return;
    }

    switch (tab) {
      case 'home':
      case 'marketing':
        setCurrentRoute('marketing');
        break;
      case 'about':
        setCurrentRoute('about');
        break;
      case 'contact':
        setCurrentRoute('contact');
        break;
      case 'faq':
        setCurrentRoute('faq');
        break;
      case 'scanner':
        if (userToken) {
          setCurrentRoute('workspace');
          setWorkspaceTab('scanner');
        } else {
          setCurrentRoute('auth');
        }
        break;
      case 'builder':
        if (userToken) {
          setCurrentRoute('workspace');
          setWorkspaceTab('builder');
        } else {
          setCurrentRoute('auth');
        }
        break;
      case 'generator':
        if (userToken) {
          setCurrentRoute('workspace');
          setWorkspaceTab('generator');
        } else {
          setCurrentRoute('auth');
        }
        break;
      default:
        setCurrentRoute('marketing');
    }
  };

  const handleEditPage = (page: LandingPage) => {
    setSelectedPageForBuilder(page);
    setWorkspaceTab('builder');
  };

  // Render Page Content based on route
  const renderRouteContent = () => {
    switch (currentRoute) {
      case 'marketing':
        return (
          <MarketingHome 
            onLaunchWorkspace={handleLaunchWorkspace} 
            onNavigateToTab={handleGlobalNavigation} 
          />
        );
      case 'about':
        return <AboutUs />;
      case 'contact':
        return <ContactUs />;
      case 'faq':
        return <FAQ />;
      case 'legal':
        return <LegalPages initialTab={legalPagesTab} />;
      case 'auth':
        return (
          <AuthScreen 
            onAuthSuccess={handleAuthSuccess} 
            onBackToMarketing={() => setCurrentRoute('marketing')} 
          />
        );
      case 'workspace':
        if (!userToken) {
          return (
            <AuthScreen 
              onAuthSuccess={handleAuthSuccess} 
              onBackToMarketing={() => setCurrentRoute('marketing')} 
            />
          );
        }
        return renderWorkspaceContent();
      default:
        return (
          <MarketingHome 
            onLaunchWorkspace={handleLaunchWorkspace} 
            onNavigateToTab={handleGlobalNavigation} 
          />
        );
    }
  };

  // Render Sub-Views inside authenticated Workspace
  const renderWorkspaceContent = () => {
    switch (workspaceTab) {
      case 'overview':
        return (
          <Overview 
            userToken={userToken || ''} 
            onNavigateToTab={(tab) => setWorkspaceTab(tab as any)} 
            onEditPage={handleEditPage} 
          />
        );
      case 'scanner':
        return <AdScanner userToken={userToken || ''} />;
      case 'builder':
        return (
          <PageBuilder 
            userToken={userToken || ''} 
            initialPageToLoad={selectedPageForBuilder} 
          />
        );
      case 'generator':
        return <PolicyGenerator userToken={userToken || ''} />;
      default:
        return (
          <Overview 
            userToken={userToken || ''} 
            onNavigateToTab={(tab) => setWorkspaceTab(tab as any)} 
            onEditPage={handleEditPage} 
          />
        );
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#07070a] text-slate-200 font-sans flex flex-col overflow-x-hidden selection:bg-indigo-650/40">
      
      {/* PUBLIC MARKETING NAVIGATION HEADER */}
      {currentRoute !== 'workspace' && currentRoute !== 'auth' && (
        <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-black/60 border-b border-white/5 select-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            
            {/* Logo */}
            <div 
              onClick={() => setCurrentRoute('marketing')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white shadow-lg shadow-indigo-600/20 text-sm group-hover:scale-105 transition-all">
                C
              </div>
              <div className="flex flex-col text-left">
                <h1 className="font-extrabold text-sm tracking-wider text-white">COMPLIANCE.OS</h1>
                <span className="text-[9px] text-indigo-400 font-mono tracking-widest uppercase">safe-advertising</span>
              </div>
            </div>

            {/* Desktop Links */}
            <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400">
              <button 
                onClick={() => handleGlobalNavigation('marketing')}
                className={`hover:text-white transition-all cursor-pointer ${currentRoute === 'marketing' ? 'text-white font-bold' : ''}`}
              >
                Home
              </button>
              <button 
                onClick={() => handleGlobalNavigation('about')}
                className={`hover:text-white transition-all cursor-pointer ${currentRoute === 'about' ? 'text-white font-bold' : ''}`}
              >
                About
              </button>
              <button 
                onClick={() => handleGlobalNavigation('faq')}
                className={`hover:text-white transition-all cursor-pointer ${currentRoute === 'faq' ? 'text-white font-bold' : ''}`}
              >
                FAQ
              </button>
              <button 
                onClick={() => handleGlobalNavigation('contact')}
                className={`hover:text-white transition-all cursor-pointer ${currentRoute === 'contact' ? 'text-white font-bold' : ''}`}
              >
                Contact
              </button>
              <button 
                onClick={() => handleGlobalNavigation('legal-privacy')}
                className={`hover:text-white transition-all cursor-pointer ${currentRoute === 'legal' ? 'text-white font-bold' : ''}`}
              >
                Policies
              </button>
            </nav>

            {/* CTAs */}
            <div className="hidden md:flex items-center gap-4">
              {userToken ? (
                <button
                  onClick={handleLaunchWorkspace}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  Workspace Dashboard
                </button>
              ) : (
                <button
                  onClick={() => setCurrentRoute('auth')}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg border border-white/10 transition-all cursor-pointer"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Mobile Menu Trigger */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

          {/* Mobile Dropdown Panel */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/5 bg-[#0a0a0d] p-4 flex flex-col gap-4 text-left select-none animate-in fade-in slide-in-from-top-3">
              <button onClick={() => handleGlobalNavigation('marketing')} className="text-xs font-semibold text-slate-400 hover:text-white py-1">Home</button>
              <button onClick={() => handleGlobalNavigation('about')} className="text-xs font-semibold text-slate-400 hover:text-white py-1">About Us</button>
              <button onClick={() => handleGlobalNavigation('faq')} className="text-xs font-semibold text-slate-400 hover:text-white py-1">FAQ</button>
              <button onClick={() => handleGlobalNavigation('contact')} className="text-xs font-semibold text-slate-400 hover:text-white py-1">Contact Support</button>
              <button onClick={() => handleGlobalNavigation('legal-privacy')} className="text-xs font-semibold text-slate-400 hover:text-white py-1">Legal Policies</button>
              
              <div className="h-[1px] bg-white/5"></div>
              
              {userToken ? (
                <button
                  onClick={handleLaunchWorkspace}
                  className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg text-center"
                >
                  Workspace Dashboard
                </button>
              ) : (
                <button
                  onClick={() => {
                    setCurrentRoute('auth');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 bg-white/5 text-white text-xs font-bold rounded-lg text-center border border-white/10"
                >
                  Sign In
                </button>
              )}
            </div>
          )}
        </header>
      )}

      {/* AUTHENTICATED WORKSPACE WORKSPACE SHELL */}
      {currentRoute === 'workspace' && (
        <div className="flex-1 flex flex-col md:flex-row h-screen overflow-hidden">
          
          {/* LEFT DESKTOP WORKSPACE SIDEBAR */}
          <aside className="hidden md:flex w-64 border-r border-white/5 bg-[#0b0b0e] flex-col justify-between shrink-0 select-none text-left">
            <div className="p-5 flex flex-col gap-6">
              
              {/* App Logo */}
              <div 
                onClick={() => setCurrentRoute('marketing')}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white shadow-lg shadow-indigo-600/20 text-xs">C</div>
                <div className="flex flex-col">
                  <h2 className="font-extrabold text-xs tracking-wider text-white">COMPLIANCE.OS</h2>
                  <span className="text-[8.5px] text-slate-500 font-mono tracking-widest uppercase">workspace v1.8</span>
                </div>
              </div>

              {/* Workspace Navigation Links */}
              <nav className="space-y-1">
                <button
                  onClick={() => setWorkspaceTab('overview')}
                  className={`w-full px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-all border ${
                    workspaceTab === 'overview'
                      ? 'bg-indigo-600/10 border-indigo-600/20 text-indigo-400'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Workspace Overview</span>
                </button>

                <button
                  onClick={() => setWorkspaceTab('scanner')}
                  className={`w-full px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-all border ${
                    workspaceTab === 'scanner'
                      ? 'bg-indigo-600/10 border-indigo-600/20 text-indigo-400'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Terminal className="w-4 h-4" />
                  <span>Compliance Scanner</span>
                </button>

                <button
                  onClick={() => setWorkspaceTab('builder')}
                  className={`w-full px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-all border ${
                    workspaceTab === 'builder'
                      ? 'bg-indigo-600/10 border-indigo-600/20 text-indigo-400'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Landing Page Builder</span>
                </button>

                <button
                  onClick={() => setWorkspaceTab('generator')}
                  className={`w-full px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2.5 transition-all border ${
                    workspaceTab === 'generator'
                      ? 'bg-indigo-655 border-indigo-600/20 text-indigo-400'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Policy Generator</span>
                </button>
              </nav>

            </div>

            {/* Profile & Logout bottom panel */}
            <div className="p-4 border-t border-white/5 bg-black/20 flex flex-col gap-3">
              <div className="flex items-center gap-3 select-text">
                <div className="w-7 h-7 rounded-full bg-indigo-650/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-[10.5px] font-bold text-white truncate">{username}</span>
                  <span className="block text-[8.5px] font-mono text-slate-500">PRO MEMBERSHIP</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentRoute('marketing')}
                  className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-400 hover:text-white rounded border border-white/10 text-center transition-all cursor-pointer"
                >
                  Exit Workspace
                </button>
                
                <button
                  onClick={handleLogout}
                  className="px-2 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded border border-red-500/25 transition-all cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </aside>

          {/* MOBILE WORKSPACE TOP NAVIGATION HEADER */}
          <div className="md:hidden bg-[#0c0c0f] border-b border-white/5 px-4 h-14 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center font-bold text-white text-[10px]">C</div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white">COMPLIANCE.OS</span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={workspaceTab}
                onChange={(e) => setWorkspaceTab(e.target.value as any)}
                className="bg-black/60 border border-white/15 px-2.5 py-1 text-[11px] text-slate-350 rounded focus:outline-none"
              >
                <option value="overview">Overview</option>
                <option value="scanner">Scanner</option>
                <option value="builder">Page Builder</option>
                <option value="generator">Policy Gen</option>
              </select>

              <button
                onClick={handleLogout}
                className="p-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ACTIVE WORKSPACE CONTENT DISPLAY */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {renderWorkspaceContent()}
          </main>

        </div>
      )}

      {/* RENDER PUBLIC ROUTE CONTENT (Home, About, Legal, etc.) */}
      {currentRoute !== 'workspace' && (
        <main className="flex-1 flex flex-col">
          {renderRouteContent()}
        </main>
      )}

    </div>
  );
}
