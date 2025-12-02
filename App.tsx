import React, { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import { Home } from './pages/Home';
import { Matches } from './pages/Matches';
import { Chat } from './pages/Chat';
import { Navigation } from './components/Navigation';
import { Store } from './pages/Store';
import { ProfilePage } from './pages/Profile';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { AppScreen, UserProfile, Match, Message, Language } from './types';
import { supabase } from './services/supabaseClient';

const SplashScreen: React.FC = () => (
  <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-tr from-[#FF4458] to-[#FE3C72] text-white">
    <div className="animate-pulse flex flex-col items-center">
      <div className="p-6 bg-white/20 rounded-full backdrop-blur-md shadow-xl mb-6 ring-4 ring-white/10">
        <Flame size={64} fill="currentColor" className="text-white drop-shadow-md" />
      </div>
      <h1 className="text-6xl font-black tracking-tighter drop-shadow-lg">Divine</h1>
      <p className="text-sm font-bold opacity-80 tracking-[0.3em] uppercase mt-4 text-white/90">Find your match</p>
    </div>
    <div className="absolute bottom-10 flex flex-col items-center gap-2 opacity-60">
      <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [screen, setScreen] = useState<AppScreen>(AppScreen.LOGIN);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [deck, setDeck] = useState<UserProfile[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>('en');

  // Swipe Undo State
  const [lastSwipe, setLastSwipe] = useState<{ profile: UserProfile, matchId?: string } | null>(null);

  // Request Notification Permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Supabase Auth & Profile Loading
  useEffect(() => {
    const fetchProfile = async (userId: string, email?: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (data) {
          setUser({
            id: data.id,
            name: data.name || 'New User',
            age: data.age || 18,
            bio: data.bio || '',
            location: data.location || '',
            job: data.job || '',
            interests: data.interests || [],
            imageSeed: data.image_seed || Math.floor(Math.random() * 1000),
            photos: data.photos || [],
            distance: 0,
            isVerified: data.is_verified,
            coins: data.coins ?? 100,
            isBoostActive: data.is_boost_active,
            boostEndTime: data.boost_end_time ? Number(data.boost_end_time) : undefined
          });
          setScreen(AppScreen.SWIPE);
        } else {
          // Profile doesn't exist (likely first time OAuth login)
          // Create default profile
          const newProfile = {
            id: userId,
            name: email ? email.split('@')[0] : 'New User',
            age: 21,
            bio: 'Just joined Divine!',
            location: '',
            job: '',
            photos: [],
            interests: [],
            image_seed: Math.floor(Math.random() * 1000),
            coins: 100,
            is_verified: false
          };

          const { error: insertError } = await supabase
            .from('profiles')
            .insert([newProfile]);

          if (!insertError) {
             // Retry fetch
             fetchProfile(userId);
          } else {
             console.error("Failed to create default profile:", insertError);
          }
        }
      } catch (err) {
        console.error("Unexpected error fetching profile:", err);
      }
    };

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setScreen(AppScreen.LOGIN);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await fetchProfile(session.user.id, session.user.email);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setScreen(AppScreen.LOGIN);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Update Profile in Supabase
  const handleUpdateUser = async (updatedUser: UserProfile) => {
    setUser(updatedUser); // Optimistic update
    
    const { error } = await supabase
      .from('profiles')
      .update({
        bio: updatedUser.bio,
        age: updatedUser.age,
        location: updatedUser.location,
        interests: updatedUser.interests,
        photos: updatedUser.photos,
        coins: updatedUser.coins,
        is_boost_active: updatedUser.isBoostActive,
        boost_end_time: updatedUser.boostEndTime
      })
      .eq('id', updatedUser.id);

    if (error) {
      console.error("Error saving profile:", error);
      // Optional: Revert local state if needed
    }
  };

  // Splash Screen Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Load matches demo
  useEffect(() => {
    if (matches.length > 0) return;
    if (!user) return; // Only load demo matches if user is logged in
    
    const demoMatches: Match[] = [
      {
        id: 'm1',
        profile: {
          id: 'demo1',
          name: 'Jessica',
          age: 24,
          bio: 'Love hiking and dogs!',
          location: 'SF',
          job: 'Teacher',
          interests: ['Hiking'],
          imageSeed: 202,
          photos: [{ id: 'dp1', url: 'https://picsum.photos/seed/202/600/800' }],
          distance: 5,
          isVerified: true,
          coins: 0
        },
        timestamp: Date.now() - 100000,
        unreadCount: 1,
        lastMessage: "Hey! Nice photos :)"
      }
    ];
    setMatches(demoMatches);
    setMessages({
        'm1': [{ id: 'msg1', senderId: 'demo1', text: "Hey! Nice photos :)", timestamp: Date.now() - 100000 }]
    });
  }, [matches.length, user]);

  // Check for boost expiration
  useEffect(() => {
    if (user?.isBoostActive && user?.boostEndTime) {
      const remaining = user.boostEndTime - Date.now();
      if (remaining <= 0) {
        handleUpdateUser({ ...user, isBoostActive: false, boostEndTime: undefined });
      } else {
        const timer = setTimeout(() => {
          handleUpdateUser({ ...user, isBoostActive: false, boostEndTime: undefined });
        }, remaining);
        return () => clearTimeout(timer);
      }
    }
  }, [user?.isBoostActive, user?.boostEndTime]);

  const handleSwipeRight = (profile: UserProfile) => {
    const isMatch = Math.random() > 0.4;
    let matchId: string | undefined;
    
    if (isMatch) {
      matchId = Math.random().toString(36).substr(2, 9);
      const newMatch: Match = {
        id: matchId,
        profile: profile,
        timestamp: Date.now(),
        unreadCount: 0,
        lastMessage: undefined
      };
      setMatches(prev => [newMatch, ...prev]);
      alert(`It's a match with ${profile.name}!`);
    }
    setLastSwipe({ profile, matchId });
  };

  const handleSwipeLeft = (profile: UserProfile) => {
    console.log("Passed on", profile.name);
    setLastSwipe({ profile });
  };

  const handleUndo = () => {
    if (!lastSwipe) return;
    
    // Restore card to deck
    setDeck(prev => [lastSwipe.profile, ...prev]);
    
    // Remove match if it existed
    if (lastSwipe.matchId) {
        setMatches(prev => prev.filter(m => m.id !== lastSwipe.matchId));
        // Remove messages for this match
        setMessages(prev => {
            const newMsgs = { ...prev };
            delete newMsgs[lastSwipe.matchId!];
            return newMsgs;
        });
    }
    
    setLastSwipe(null);
  };

  const handleSelectMatch = (matchId: string) => {
    setActiveMatchId(matchId);
    setScreen(AppScreen.CHAT);
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, unreadCount: 0 } : m));
  };

  const handleSendMessage = (matchId: string, text: string, senderId: string) => {
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId,
      text,
      timestamp: Date.now()
    };

    setMessages(prev => ({
      ...prev,
      [matchId]: [...(prev[matchId] || []), newMessage]
    }));

    setMatches(prev => prev.map(m => 
      m.id === matchId 
      ? { ...m, lastMessage: text, timestamp: Date.now() } 
      : m
    ));

    // Push Notification Logic
    if (senderId !== 'user') {
      const match = matches.find(m => m.id === matchId);
      const matchName = match?.profile.name || 'Divine Match';

      // Only notify if permissions granted AND (app is hidden OR user is on different screen/chat)
      if ('Notification' in window && Notification.permission === 'granted') {
        if (document.hidden || screen !== AppScreen.CHAT || activeMatchId !== matchId) {
          try {
            new Notification(`Message from ${matchName}`, {
              body: text,
              icon: match?.profile.photos?.[0]?.url || 'https://picsum.photos/100/100', // Use match photo or default
              silent: false,
            });
          } catch (e) {
            console.error("Notification failed", e);
          }
        }
      }
    }
  };

  const handleBuyBoost = () => {
    if (!user) return;
    if (user.coins >= 150) {
      handleUpdateUser({
        ...user,
        coins: user.coins - 150,
        isBoostActive: true,
        boostEndTime: Date.now() + 30 * 60 * 1000 // 30 minutes
      });
    }
  };

  const handleAddCoins = () => {
    if (!user) return;
    handleUpdateUser({
        ...user,
        coins: user.coins + 50
    });
    alert("You watched an ad and earned 50 coins!");
  };

  const renderScreen = () => {
    switch (screen) {
      case AppScreen.LOGIN:
        return <Login onLogin={() => {}} onNavigateSignup={() => setScreen(AppScreen.SIGNUP)} lang={lang} />;
      case AppScreen.SIGNUP:
        return <Signup onSignup={() => {}} onNavigateLogin={() => setScreen(AppScreen.LOGIN)} lang={lang} />;
      case AppScreen.SWIPE:
        return <Home 
          deck={deck} 
          setDeck={setDeck} 
          onSwipeLeft={handleSwipeLeft} 
          onSwipeRight={handleSwipeRight} 
          onUndo={handleUndo}
          canUndo={!!lastSwipe}
          lang={lang} 
        />;
      case AppScreen.MATCHES:
        return <Matches matches={matches} onSelectMatch={handleSelectMatch} lang={lang} />;
      case AppScreen.CHAT:
        if (!activeMatchId) return <Matches matches={matches} onSelectMatch={handleSelectMatch} lang={lang} />;
        const match = matches.find(m => m.id === activeMatchId);
        if (!match) return <Matches matches={matches} onSelectMatch={handleSelectMatch} lang={lang} />;
        return (
          <Chat 
            match={match} 
            messages={messages[activeMatchId] || []} 
            onBack={() => setScreen(AppScreen.MATCHES)}
            onSendMessage={handleSendMessage}
          />
        );
      case AppScreen.STORE:
        return user ? (
          <Store 
            coins={user.coins} 
            isBoostActive={!!user.isBoostActive}
            boostEndTime={user.boostEndTime}
            onBuyBoost={handleBuyBoost}
            onAddCoins={handleAddCoins}
            lang={lang}
          />
        ) : null;
      case AppScreen.PROFILE:
        return user ? <ProfilePage user={user} onUpdateUser={handleUpdateUser} lang={lang} setLang={setLang} /> : null;
      default:
        return <Home 
          deck={deck} 
          setDeck={setDeck} 
          onSwipeLeft={handleSwipeLeft} 
          onSwipeRight={handleSwipeRight} 
          onUndo={handleUndo}
          canUndo={!!lastSwipe}
          lang={lang} 
        />;
    }
  };

  const totalUnread = matches.reduce((acc, m) => acc + m.unreadCount, 0);
  const showNav = screen !== AppScreen.CHAT && screen !== AppScreen.LOGIN && screen !== AppScreen.SIGNUP && user !== null;

  return (
    <div className="fixed inset-0 bg-gray-100 flex items-center justify-center font-sans text-gray-900 overflow-hidden">
      {/* App Container - Responsive */}
      {/* 
          Mobile: Full width/height, no rounding
          Desktop: Fixed width/height relative to viewport, rounded, shadowed
      */}
      <div className="w-full h-full md:w-[400px] md:h-[90vh] md:max-h-[900px] bg-white md:rounded-3xl shadow-2xl overflow-hidden relative flex flex-col border-gray-200 md:border">
        
        {/* Main Screen Content */}
        <main className="flex-1 relative overflow-hidden flex flex-col">
          {renderScreen()}
        </main>
        
        {/* Navigation Bar */}
        {showNav && (
          <Navigation 
            currentScreen={screen} 
            setScreen={setScreen} 
            unreadCount={totalUnread} 
            lang={lang}
          />
        )}

        {/* Splash Screen Overlay */}
        {showSplash && <SplashScreen />}
      </div>
    </div>
  );
};

export default App;