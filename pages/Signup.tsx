import React, { useState } from 'react';
import { ArrowLeft, User, Mail, Lock, Calendar, AlertCircle, ChevronDown } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../utils/translations';
import { supabase } from '../services/supabaseClient';

interface SignupProps {
  onSignup: (data: any) => void;
  onNavigateLogin: () => void;
  lang: Language;
  setLang: (lang: Language) => void;
}

export const Signup: React.FC<SignupProps> = ({ onSignup, onNavigateLogin, lang, setLang }) => {
  const t = translations[lang].auth;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    gender: 'female'
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
        const ageInt = parseInt(formData.age);
        if (isNaN(ageInt) || ageInt < 18) {
            throw new Error("You must be at least 18 years old to join.");
        }

        // 1. Create Auth User
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
        });

        if (authError) throw authError;

        if (authData.user) {
            // 2. Create Profile in DB
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: authData.user.id,
                        name: formData.name,
                        age: ageInt,
                        bio: '',
                        photos: [],
                        interests: [],
                        image_seed: Math.floor(Math.random() * 1000),
                        coins: 100 // Welcome bonus
                    }
                ]);
            
            if (profileError) throw profileError;

            // App.tsx auth listener will pick this up
        }

    } catch (err: any) {
        setError(err.message || 'Error creating account');
    } finally {
        setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'facebook' | 'not_supported') => {
      if (provider === 'not_supported') {
          alert("Not configured in this demo.");
          return;
      }
      try {
          const { error } = await supabase.auth.signInWithOAuth({ provider });
          if (error) throw error;
      } catch (err: any) {
          setError(err.message);
      }
  };

  return (
    <div className="h-full bg-white flex flex-col px-6 md:px-8 py-6 md:pt-8 md:pb-8 relative overflow-y-auto">
       {/* Language Selector */}
      <div className="absolute top-6 right-4 md:top-8 md:right-6 z-10">
        <div className="relative">
            <select 
                value={lang}
                onChange={(e) => setLang(e.target.value as Language)}
                className="appearance-none bg-gray-50 border border-gray-200 text-gray-500 py-1.5 pl-3 pr-8 rounded-full text-xs font-bold outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer hover:bg-gray-100 transition-colors uppercase"
            >
                <option value="en">EN</option>
                <option value="fr">FR</option>
                <option value="sw">SW</option>
                <option value="ln">LN</option>
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                 <ChevronDown size={12} />
            </div>
        </div>
      </div>

      {/* Header */}
      <button onClick={onNavigateLogin} className="self-start p-2 -ml-2 text-gray-400 hover:text-gray-600 mb-2 md:mb-4">
        <ArrowLeft size={24} />
      </button>
      
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{t.createTitle}</h1>
        <p className="text-sm md:text-base text-gray-500">{t.createSubtitle}</p>
      </div>

      {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
            </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-center space-y-4 md:space-y-5">
        
        <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">{t.name}</label>
            <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-full py-3.5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-sm md:text-base"
                placeholder="Jane Doe"
                required
                />
            </div>
        </div>

        <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">{t.email}</label>
            <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-full py-3.5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-sm md:text-base"
                placeholder="name@example.com"
                required
                />
            </div>
        </div>

        <div className="flex gap-4">
            <div className="space-y-1 flex-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">{t.age}</label>
                <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                    type="number"
                    min="18"
                    max="99"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-full py-3.5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-sm md:text-base"
                    placeholder="24"
                    required
                    />
                </div>
            </div>
            <div className="space-y-1 flex-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">{t.gender}</label>
                <div className="relative">
                    <select
                        value={formData.gender}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-full py-3.5 px-4 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium appearance-none text-sm md:text-base"
                    >
                        <option value="female">{t.female}</option>
                        <option value="male">{t.male}</option>
                        <option value="other">{t.other}</option>
                    </select>
                </div>
            </div>
        </div>

        <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">{t.password}</label>
            <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-full py-3.5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-sm md:text-base"
                placeholder="••••••••"
                required
                />
            </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3.5 md:py-4 rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all mt-4 md:mt-6 ${loading ? 'opacity-70 cursor-wait' : ''}`}
        >
          {loading ? '...' : t.signup}
        </button>
      </form>

      <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500 text-xs md:text-sm">{t.continueWith}</span>
          </div>
      </div>

      <div className="grid grid-cols-4 gap-3 md:gap-4 shrink-0">
          <button onClick={() => handleOAuthLogin('google')} className="aspect-square bg-white border border-gray-200 rounded-2xl flex items-center justify-center hover:bg-gray-50 hover:scale-105 transition-all shadow-sm">
             <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26-.19-.58z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          </button>
          <button onClick={() => handleOAuthLogin('facebook')} className="aspect-square bg-[#1877F2] rounded-2xl flex items-center justify-center hover:opacity-90 hover:scale-105 transition-all shadow-sm text-white">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </button>
          <button onClick={() => handleOAuthLogin('not_supported')} className="aspect-square bg-gradient-to-tr from-[#FD1D1D] via-[#E1306C] to-[#C13584] rounded-2xl flex items-center justify-center hover:opacity-90 hover:scale-105 transition-all shadow-sm text-white">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
          </button>
          <button onClick={() => handleOAuthLogin('not_supported')} className="aspect-square bg-black rounded-2xl flex items-center justify-center hover:opacity-80 hover:scale-105 transition-all shadow-sm text-white">
             <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
          </button>
      </div>

      <div className="mt-6 text-center shrink-0">
        <p className="text-gray-500 text-sm">
          {t.haveAccount}{' '}
          <button onClick={onNavigateLogin} className="text-primary font-bold hover:underline">
            {t.login}
          </button>
        </p>
      </div>
    </div>
  );
};