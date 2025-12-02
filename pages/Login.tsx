
import React, { useState } from 'react';
import { Flame, Mail, Lock, AlertCircle } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../utils/translations';
import { supabase } from '../services/supabaseClient';

interface LoginProps {
  onLogin: () => void;
  onNavigateSignup: () => void;
  lang: Language;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onNavigateSignup, lang }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const t = translations[lang].auth;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      // onLogin is handled by App.tsx via onAuthStateChange
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'facebook' | 'not_supported') => {
      if (provider === 'not_supported') {
          alert("This provider is not configured in this demo.");
          return;
      }
      try {
          const { error } = await supabase.auth.signInWithOAuth({
              provider: provider,
          });
          if (error) throw error;
      } catch (err: any) {
          setError(err.message);
      }
  };

  return (
    <div className="min-h-full bg-white flex flex-col px-8 pt-12 pb-8">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-12">
        <div className="w-16 h-16 bg-gradient-to-tr from-primary to-secondary rounded-full flex items-center justify-center text-white shadow-lg mb-4">
          <Flame size={32} fill="currentColor" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Divine</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.welcome}</h2>
        <p className="text-gray-500 mb-8">{t.subtitle}</p>
        
        {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">{t.email}</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-full py-3.5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                placeholder="name@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">{t.password}</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-full py-3.5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-4 rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all mt-6 ${loading ? 'opacity-70 cursor-wait' : ''}`}
          >
            {loading ? '...' : t.login}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">{t.continueWith}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {/* Google */}
          <button
            onClick={() => handleOAuthLogin('google')}
            className="aspect-square bg-white border border-gray-200 rounded-2xl flex items-center justify-center hover:bg-gray-50 hover:scale-105 transition-all shadow-sm"
            aria-label="Sign in with Google"
          >
             <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26-.19-.58z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          </button>

          {/* Facebook */}
          <button
            onClick={() => handleOAuthLogin('facebook')}
            className="aspect-square bg-[#1877F2] rounded-2xl flex items-center justify-center hover:opacity-90 hover:scale-105 transition-all shadow-sm text-white"
            aria-label="Sign in with Facebook"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </button>

          {/* Instagram */}
          <button
            onClick={() => handleOAuthLogin('not_supported')}
            className="aspect-square bg-gradient-to-tr from-[#FD1D1D] via-[#E1306C] to-[#C13584] rounded-2xl flex items-center justify-center hover:opacity-90 hover:scale-105 transition-all shadow-sm text-white"
            aria-label="Sign in with Instagram"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </button>

          {/* TikTok */}
          <button
            onClick={() => handleOAuthLogin('not_supported')}
            className="aspect-square bg-black rounded-2xl flex items-center justify-center hover:opacity-80 hover:scale-105 transition-all shadow-sm text-white"
            aria-label="Sign in with TikTok"
          >
             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
             </svg>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-gray-500">
          {t.noAccount}{' '}
          <button onClick={onNavigateSignup} className="text-primary font-bold hover:underline">
            {t.signup}
          </button>
        </p>
      </div>
    </div>
  );
};