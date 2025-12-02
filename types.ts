
export interface Photo {
  id: string;
  url: string;
  caption?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  bio: string;
  location: string;
  job: string;
  interests: string[];
  imageSeed: number; // For reliable picsum images
  photos: Photo[]; // Array of Photo objects
  distance: number;
  isVerified: boolean;
  isPremium?: boolean; 
  
  // Economy & Boost (Persisted in DB)
  coins: number; 
  isBoostActive?: boolean;
  boostEndTime?: number;
}

export interface Match {
  id: string;
  profile: UserProfile;
  timestamp: number;
  lastMessage?: string;
  unreadCount: number;
}

export interface Message {
  id: string;
  senderId: string; // 'user' or profile.id
  text: string;
  timestamp: number;
  isSystem?: boolean; // For "You matched!" messages
}

export interface AppState {
  currentUser: UserProfile;
  deck: UserProfile[];
  matches: Match[];
  messages: Record<string, Message[]>; // matchId -> messages
  isBoostActive: boolean;
}

export enum AppScreen {
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  SWIPE = 'SWIPE',
  MATCHES = 'MATCHES',
  CHAT = 'CHAT',
  PROFILE = 'PROFILE',
  STORE = 'STORE',
  ONBOARDING = 'ONBOARDING'
}

export type Language = 'en' | 'fr' | 'sw' | 'ln';