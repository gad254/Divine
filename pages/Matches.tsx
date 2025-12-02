import React from 'react';
import { Search } from 'lucide-react';
import { Match, Language } from '../types';
import { translations } from '../utils/translations';

interface MatchesProps {
  matches: Match[];
  onSelectMatch: (matchId: string) => void;
  lang: Language;
}

export const Matches: React.FC<MatchesProps> = ({ matches, onSelectMatch, lang }) => {
  const sortedMatches = [...matches].sort((a, b) => b.timestamp - a.timestamp);
  const t = translations[lang].matches;

  const getAvatar = (match: Match) => {
      return match.profile.photos && match.profile.photos.length > 0
        ? match.profile.photos[0].url
        : `https://picsum.photos/seed/${match.profile.imageSeed}/150/150`;
  };

  return (
    <div className="flex flex-col h-full bg-white pb-24">
      {/* Header */}
      <div className="px-6 pt-6 pb-2 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
      </div>

      {/* Search */}
      <div className="px-6 py-2 shrink-0">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder={t.search}
                className="w-full bg-gray-100 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
        </div>
      </div>

      {/* New Matches Row */}
      <div className="mt-4 px-6 shrink-0">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{t.new}</h2>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
           <div className="flex flex-col items-center space-y-1 min-w-[70px]">
                <div className="w-[70px] h-[70px] rounded-full border-2 border-dashed border-primary flex items-center justify-center bg-primary/10">
                   <span className="text-2xl">🔥</span>
                </div>
                <span className="text-xs font-semibold text-gray-800">{t.likes}</span>
           </div>
           {sortedMatches.map(match => (
               <button 
                key={match.id} 
                onClick={() => onSelectMatch(match.id)}
                className="flex flex-col items-center space-y-1 min-w-[70px]"
               >
                   <div className="relative">
                        <img 
                            src={getAvatar(match)} 
                            className="w-[70px] h-[70px] rounded-full object-cover border-2 border-white shadow-md"
                            alt={match.profile.name}
                        />
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                   </div>
                   <span className="text-xs font-medium text-gray-700 truncate w-full text-center">{match.profile.name}</span>
               </button>
           ))}
        </div>
      </div>

      {/* Messages List - Scrollable */}
      <div className="flex-1 mt-6 px-6 overflow-y-auto">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 sticky top-0 bg-white py-1">{t.messages}</h2>
        <div className="space-y-4 pb-4">
            {sortedMatches.length === 0 ? (
                <div className="text-center text-gray-400 py-10">
                    <p>{t.noMsg}</p>
                </div>
            ) : (
                sortedMatches.map(match => (
                    <button 
                        key={match.id} 
                        onClick={() => onSelectMatch(match.id)}
                        className="w-full flex items-center gap-4"
                    >
                        <img 
                            src={getAvatar(match)} 
                            className="w-16 h-16 rounded-full object-cover border border-gray-100"
                            alt={match.profile.name}
                        />
                        <div className="flex-1 min-w-0 text-left">
                            <div className="flex justify-between items-baseline mb-0.5">
                                <h3 className="font-semibold text-gray-900">{match.profile.name}</h3>
                                {match.unreadCount > 0 && (
                                     <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                        {match.unreadCount}
                                     </span>
                                )}
                            </div>
                            <p className={`text-sm truncate ${match.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                {match.lastMessage || t.matched}
                            </p>
                        </div>
                    </button>
                ))
            )}
        </div>
      </div>
    </div>
  );
};