
import React, { useState } from 'react';
import { Flame, Coins, ShieldCheck, ChevronRight, ChevronDown } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../utils/translations';

interface OnboardingProps {
  onFinish: () => void;
  lang: Language;
  setLang: (lang: Language) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onFinish, lang, setLang }) => {
  const [slide, setSlide] = useState(0);
  const t = translations[lang].onboarding;

  const slides = [
    {
      id: 0,
      icon: <Flame size={64} className="text-primary" fill="currentColor" />,
      title: t.slide1Title,
      desc: t.slide1Desc,
      color: "bg-red-50"
    },
    {
      id: 1,
      icon: <Coins size={64} className="text-yellow-500" fill="currentColor" />,
      title: t.slide2Title,
      desc: t.slide2Desc,
      color: "bg-yellow-50"
    },
    {
      id: 2,
      icon: <ShieldCheck size={64} className="text-green-500" />,
      title: t.slide3Title,
      desc: t.slide3Desc,
      color: "bg-green-50"
    }
  ];

  const handleNext = () => {
    if (slide < slides.length - 1) {
      setSlide(s => s + 1);
    } else {
      onFinish();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white relative overflow-hidden">
      {/* Language Selector */}
      <div className="absolute top-4 left-4 z-20">
        <div className="relative">
            <select 
                value={lang}
                onChange={(e) => setLang(e.target.value as Language)}
                className="appearance-none bg-gray-50 border border-gray-200 text-gray-500 py-1 pl-3 pr-8 rounded-full text-xs font-bold outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer hover:bg-gray-100 transition-colors uppercase"
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

      {/* Skip Button */}
      <div className="absolute top-4 right-4 z-20">
        <button 
          onClick={onFinish}
          className="text-gray-400 font-semibold text-sm hover:text-gray-600 px-3 py-1"
        >
          {t.skip}
        </button>
      </div>

      {/* Slides Area */}
      <div className="flex-1 relative">
        {slides.map((s, index) => (
          <div 
            key={s.id}
            className={`absolute inset-0 flex flex-col items-center justify-center p-8 transition-transform duration-500 ease-in-out ${
              index === slide ? 'translate-x-0 opacity-100' : 
              index < slide ? '-translate-x-full opacity-0' : 'translate-x-full opacity-0'
            }`}
          >
            <div className={`w-32 h-32 rounded-full ${s.color} flex items-center justify-center mb-8 animate-pulse-fast`}>
              {s.icon}
            </div>
            <h2 className="text-3xl font-black text-gray-900 text-center mb-4 tracking-tight">{s.title}</h2>
            <p className="text-gray-500 text-center leading-relaxed text-lg max-w-xs">
              {s.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="px-8 pb-12 pt-4">
        {/* Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, i) => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all duration-300 ${
                i === slide ? 'w-8 bg-primary' : 'w-2 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Button */}
        <button 
          onClick={handleNext}
          className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-4 rounded-full shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg"
        >
          {slide === slides.length - 1 ? t.start : t.next}
          {slide !== slides.length - 1 && <ChevronRight size={20} />}
        </button>
      </div>
    </div>
  );
};
