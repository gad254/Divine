
import React from 'react';
import { Flame, MessageCircle, User, ShoppingBag } from 'lucide-react';
import { AppScreen, Language } from '../types';
import { translations } from '../utils/translations';

interface NavigationProps {
  currentScreen: AppScreen;
  setScreen: (screen: AppScreen) => void;
  unreadCount: number;
  lang: Language;
}

export const Navigation: React.FC<NavigationProps> = ({ currentScreen, setScreen, unreadCount, lang }) => {
  const t = translations[lang].nav;
  
  const navItems = [
    { id: AppScreen.SWIPE, icon: Flame, label: t.divine },
    { id: AppScreen.MATCHES, icon: MessageCircle, label: t.matches, badge: unreadCount },
    { id: AppScreen.STORE, icon: ShoppingBag, label: t.boost },
    { id: AppScreen.PROFILE, icon: User, label: t.profile },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe pt-2 px-6 h-20 shadow-lg z-50">
      <div className="flex justify-between items-center max-w-md mx-auto h-full pb-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setScreen(item.id)}
            className={`flex flex-col items-center justify-center w-16 h-14 space-y-1 transition-colors relative ${
              currentScreen === item.id ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <item.icon size={currentScreen === item.id ? 28 : 24} strokeWidth={currentScreen === item.id ? 2.5 : 2} />
            {item.badge ? (
              <span className="absolute top-0 right-2 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-white">
                {item.badge}
              </span>
            ) : null}
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
