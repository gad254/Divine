import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, Star, RefreshCw, RotateCcw } from 'lucide-react';
import { Card } from '../components/Card';
import { UserProfile, Language } from '../types';
import { generateProfiles } from '../services/geminiService';
import { translations } from '../utils/translations';
import { ReportModal } from '../components/ReportModal';

interface HomeProps {
  deck: UserProfile[];
  setDeck: React.Dispatch<React.SetStateAction<UserProfile[]>>;
  onSwipeLeft: (profile: UserProfile) => void;
  onSwipeRight: (profile: UserProfile) => void;
  onUndo: () => void;
  canUndo: boolean;
  lang: Language;
}

export const Home: React.FC<HomeProps> = ({ deck, setDeck, onSwipeLeft, onSwipeRight, onUndo, canUndo, lang }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingProfile, setReportingProfile] = useState<UserProfile | null>(null);
  
  // Swipe Logic State
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);
  const dragStartX = useRef(0);

  const t = translations[lang].home;

  useEffect(() => {
    // Only load more if deck is empty AND not currently loading
    if (deck && deck.length === 0 && !isLoading) {
      loadMoreProfiles();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck?.length]); // Safe check for deck length

  const loadMoreProfiles = async () => {
    setIsLoading(true);
    const newProfiles = await generateProfiles(5);
    setDeck(prev => [...(prev || []), ...newProfiles]);
    setIsLoading(false);
  };

  const completeSwipe = (direction: 'left' | 'right') => {
    if (animatingOut || !deck || deck.length === 0) return;
    
    setAnimatingOut(true);
    // Move card far off screen based on direction
    const endX = direction === 'right' ? 1000 : -1000;
    setDragX(endX);

    setTimeout(() => {
        if (deck.length > 0) {
            const currentProfile = deck[0];
            // Remove card from deck
            setDeck(prev => prev.slice(1));
            
            // Trigger app-level logic
            if (direction === 'left') onSwipeLeft(currentProfile);
            else onSwipeRight(currentProfile);
        }
        
        // Reset state for the next card
        setDragX(0);
        setAnimatingOut(false);
    }, 300); // Wait for transition duration
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (animatingOut || !deck || deck.length === 0) return;
    setIsDragging(true);
    dragStartX.current = e.clientX;
    // Capture pointer to track gestures outside the element
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - dragStartX.current;
    setDragX(delta);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.currentTarget as Element).releasePointerCapture(e.pointerId);

    const threshold = 100; // Pixels to trigger a swipe
    if (Math.abs(dragX) > threshold) {
        completeSwipe(dragX > 0 ? 'right' : 'left');
    } else {
        setDragX(0); // Snap back to center
    }
  };

  const handleReport = () => {
      if (deck && deck.length > 0) {
          setReportingProfile(deck[0]);
          setShowReportModal(true);
      }
  };

  // Safe check if deck is undefined or empty
  if (!deck || deck.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg relative z-10 animate-bounce">
             <img src="https://picsum.photos/100/100" className="rounded-full w-20 h-20 object-cover opacity-50" alt="loader" />
          </div>
        </div>
        <h3 className="mt-8 text-xl font-bold text-gray-800">{t.finding}</h3>
        <p className="text-gray-500 mt-2">{t.wait}</p>
      </div>
    );
  }

  // Calculated styles for the active card
  const rotation = dragX * 0.05;
  const activeCardStyle = {
      transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
      transition: isDragging ? 'none' : 'transform 0.3s ease-out',
      cursor: isDragging ? 'grabbing' : 'grab',
      touchAction: 'none' as const, // Prevents scrolling while dragging
  };

  return (
    <div className="relative w-full h-full flex flex-col pt-4 pb-24 px-4 overflow-hidden bg-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-2 md:mb-4 px-2 shrink-0 h-10">
         <div className="flex items-center gap-1">
            <span className="text-2xl font-bold text-primary">Divine</span>
            <span className="text-xs font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded-full">{t.gold}</span>
         </div>
         <button onClick={loadMoreProfiles} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
             <RefreshCw size={20} />
         </button>
      </div>

      {/* Card Stack */}
      <div className="flex-1 relative w-full mb-4 md:mb-6 min-h-0">
          {/* Background Card Effect */}
          {deck.length > 1 && (
            <div className="absolute top-0 left-0 right-0 bottom-0 scale-[0.95] translate-y-3 opacity-60 z-0 transition-all duration-300">
                <Card profile={deck[1]} onReport={() => {}} />
            </div>
          )}
          
          {/* Active Card */}
          {deck.length > 0 && (
            <div 
                className="absolute inset-0 z-10 will-change-transform"
                style={activeCardStyle}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                <Card profile={deck[0]} onReport={handleReport} />
                
                {/* Visual Indicators (Stamps) */}
                {dragX > 60 && (
                    <div className="absolute top-8 left-8 border-4 border-green-500 text-green-500 rounded-lg px-4 py-2 font-black text-4xl -rotate-12 opacity-80 pointer-events-none bg-white/20 backdrop-blur-sm z-50">
                        LIKE
                    </div>
                )}
                {dragX < -60 && (
                    <div className="absolute top-8 right-8 border-4 border-red-500 text-red-500 rounded-lg px-4 py-2 font-black text-4xl rotate-12 opacity-80 pointer-events-none bg-white/20 backdrop-blur-sm z-50">
                        NOPE
                    </div>
                )}
            </div>
          )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center items-center gap-3 md:gap-4 h-16 md:h-20 relative z-20 shrink-0">
        
        {/* Undo Button */}
        <button 
          onClick={onUndo}
          disabled={!canUndo || animatingOut}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-yellow-500 hover:scale-110 transition-all disabled:opacity-50 disabled:hover:scale-100"
          title={t.undo}
        >
          <RotateCcw size={18} md:size={20} strokeWidth={2.5} />
        </button>

        <button 
          onClick={() => completeSwipe('left')}
          disabled={animatingOut}
          className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-red-500 hover:bg-red-50 hover:scale-110 transition-all disabled:opacity-50 disabled:hover:scale-100"
          title={t.passed}
        >
          <X size={24} md:size={32} strokeWidth={2.5} />
        </button>

        <button 
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-blue-400 hover:scale-110 transition-all"
        >
          <Star size={18} md:size={20} strokeWidth={2.5} />
        </button>

        <button 
          onClick={() => completeSwipe('right')}
          disabled={animatingOut}
          className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-primary to-secondary shadow-lg shadow-primary/30 flex items-center justify-center text-white hover:scale-110 transition-all disabled:opacity-50 disabled:hover:scale-100"
          title={t.liked}
        >
          <Heart size={24} md:size={32} fill="currentColor" />
        </button>
      </div>

      {showReportModal && reportingProfile && (
        <ReportModal 
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            profileName={reportingProfile.name}
            reportedUserId={reportingProfile.id}
            lang={lang}
        />
      )}
    </div>
  );
};