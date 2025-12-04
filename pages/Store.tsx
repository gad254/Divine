import React, { useEffect, useState } from 'react';
import { Zap, Crown, PlayCircle, Coins, Clock } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../utils/translations';

interface StoreProps {
  coins: number;
  isBoostActive: boolean;
  boostEndTime?: number;
  onBuyBoost: () => void;
  onAddCoins: () => void;
  lang: Language;
}

export const Store: React.FC<StoreProps> = ({ coins, isBoostActive, boostEndTime, onBuyBoost, onAddCoins, lang }) => {
  const [minutesRemaining, setMinutesRemaining] = useState(0);
  const t = translations[lang].store;

  useEffect(() => {
    const updateTime = () => {
      if (!boostEndTime || !isBoostActive) {
        setMinutesRemaining(0);
        return;
      }
      const diff = boostEndTime - Date.now();
      if (diff <= 0) {
        setMinutesRemaining(0);
      } else {
        setMinutesRemaining(Math.ceil(diff / 60000));
      }
    };

    updateTime(); // Initial call
    const intervalId = setInterval(updateTime, 1000); // Update every second

    return () => clearInterval(intervalId);
  }, [boostEndTime, isBoostActive]);

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-32 overflow-y-auto">
      {/* Header */}
      <div className="bg-white px-6 py-6 shadow-sm mb-6 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-yellow-900">
                    <Coins size={18} fill="currentColor" />
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-semibold">{t.balance}</p>
                    <p className="text-xl font-bold text-gray-900">{coins}</p>
                </div>
            </div>
            <button 
                onClick={onAddCoins}
                className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-bold active:scale-95 transition-transform"
            >
                {t.getCoins}
            </button>
        </div>
      </div>

      {/* Free Coins */}
      <div className="px-4 mb-6">
         <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
             <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <PlayCircle size={24} />
                    <span className="font-bold tracking-wide">{t.watchEarn}</span>
                </div>
                <h3 className="text-2xl font-bold mb-1">{t.freeCoins}</h3>
                <p className="opacity-90 text-sm mb-4">Watch a short video ad to boost your profile for free.</p>
                <button 
                    onClick={onAddCoins}
                    className="bg-white text-indigo-600 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-opacity-90 active:scale-95 transition-all"
                >
                    {t.watchAd}
                </button>
             </div>
             {/* Decorative circles */}
             <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
             <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
         </div>
         <p className="text-xs text-center text-gray-400 mt-2">{t.poweredBy}</p>
      </div>

      {/* Boost Items */}
      <div className="px-4 space-y-4">
        <h2 className="font-bold text-gray-900 ml-2">{t.powerUps}</h2>
        
        {/* Spotlight */}
        <div className={`relative bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm border transition-all ${isBoostActive ? 'border-purple-500 shadow-purple-100 ring-1 ring-purple-100' : 'border-gray-100'}`}>
             
             {isBoostActive && (
                 <div className="absolute -top-3 right-4 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse shadow-sm">
                    <Clock size={10} />
                    {minutesRemaining}m LEFT
                 </div>
             )}

             <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isBoostActive ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600'}`}>
                <Zap size={24} fill="currentColor" />
             </div>
             <div className="flex-1">
                <h3 className="font-bold text-gray-900">{t.spotlight}</h3>
                <p className="text-xs text-gray-500">
                    {isBoostActive ? t.spotlightActive : t.spotlightDesc}
                </p>
             </div>
             <button 
                onClick={onBuyBoost}
                disabled={isBoostActive || coins < 150}
                className={`px-4 py-2 rounded-full border-2 font-bold text-sm transition-all ${
                    isBoostActive 
                    ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                    : coins >= 150
                        ? 'border-purple-600 text-purple-600 hover:bg-purple-50 active:scale-95'
                        : 'border-gray-200 text-gray-300 cursor-not-allowed'
                }`}
             >
                {isBoostActive ? t.active : <span>150 <Coins size={12} className="inline mb-0.5" /></span>}
             </button>
        </div>

        {/* Super Like */}
        <div className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-gray-100 opacity-60">
             <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center">
                <Crown size={24} fill="currentColor" />
             </div>
             <div className="flex-1">
                <h3 className="font-bold text-gray-900">{t.superLike}</h3>
                <p className="text-xs text-gray-500">{t.superLikeDesc}</p>
             </div>
             <button disabled className="px-4 py-2 rounded-full border-2 border-gray-200 text-gray-300 font-bold text-sm cursor-not-allowed">
                300 <Coins size={12} className="inline mb-0.5" />
             </button>
        </div>
      </div>
    </div>
  );
};