import React, { useState } from 'react';
import { Lock, Mail, RefreshCw, KeyRound, AlertTriangle } from 'lucide-react';
import { User } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
  onBackToMarketing: () => void;
}

export default function AuthScreen({ onAuthSuccess, onBackToMarketing }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('admin@compliance.os');
  const [password, setPassword] = useState('password123'); // Default demo account
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setIsLoading(true);
    setErrorMsg(null);

    const url = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Store Bearer token (using user.id for mock auth session)
      localStorage.setItem('compliance_auth_token', data.id);
      localStorage.setItem('compliance_username', data.username);
      
      onAuthSuccess({ id: data.id, username: data.username });
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection failure');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070a] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0c0c0f] border border-white/10 p-6 sm:p-8 rounded-2xl shadow-2xl flex flex-col gap-6 text-left">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div 
            onClick={onBackToMarketing}
            className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/20 text-sm mx-auto cursor-pointer"
          >
            C
          </div>
          <h2 className="text-xl font-extrabold text-white">
            {isLogin ? 'Enter Compliance.OS' : 'Create Sandbox Account'}
          </h2>
          <p className="text-xs text-slate-400">
            {isLogin ? 'Access your automated scanners and legal dashboard.' : 'Start scanning and generating legal policies.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-2">
            <label className="block text-[10px] font-mono uppercase text-slate-400 tracking-wider">
              Workspace Email
            </label>
            <div className="flex rounded-lg overflow-hidden border border-white/10 bg-black/40 focus-within:border-indigo-600 transition-all">
              <div className="flex items-center justify-center px-3 bg-white/5 text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="name@company.com"
                className="flex-1 bg-transparent px-3 py-2 text-xs text-slate-200 focus:outline-none placeholder-slate-600 font-mono"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-mono uppercase text-slate-400 tracking-wider">
              Password
            </label>
            <div className="flex rounded-lg overflow-hidden border border-white/10 bg-black/40 focus-within:border-indigo-600 transition-all">
              <div className="flex items-center justify-center px-3 bg-white/5 text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 bg-transparent px-3 py-2 text-xs text-slate-200 focus:outline-none placeholder-slate-600"
                required
              />
            </div>
          </div>

          {/* Demo account note */}
          {isLogin && username === 'admin@compliance.os' && (
            <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg flex gap-2 items-start text-[10.5px] text-indigo-400">
              <KeyRound className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <strong>Demo Coordinates Loaded:</strong> Press submit to log in with our preconfigured administrator dashboard.
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-500/5 border border-red-500/20 text-red-400 text-xs rounded-lg flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <strong>Login Error:</strong> {errorMsg}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/15"
          >
            {isLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>
        </form>

        {/* Toggle link */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="hover:text-indigo-400 underline cursor-pointer"
          >
            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
          </button>
          
          <button 
            onClick={onBackToMarketing} 
            className="hover:text-white cursor-pointer font-medium"
          >
            ← Back to Site
          </button>
        </div>

      </div>
    </div>
  );
}
