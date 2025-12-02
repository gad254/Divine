
import React from 'react';
import { MapPin, Briefcase, BadgeCheck } from 'lucide-react';
import { UserProfile } from '../types';

interface CardProps {
  profile: UserProfile;
}

export const Card: React.FC<CardProps> = ({ profile }) => {
  const mainPhoto = profile.photos && profile.photos.length > 0 
    ? profile.photos[0].url 
    : `https://picsum.photos/seed/${profile.imageSeed}/600/800`;

  return (
    <div className="relative w-full h-full bg-white rounded-3xl overflow-hidden shadow-xl select-none">
      {/* Main Image */}
      <img
        src={mainPhoto}
        alt={profile.name}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 pointer-events-none" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white pointer-events-none">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-3xl font-bold">{profile.name}, {profile.age}</h2>
          {profile.isVerified && <BadgeCheck className="text-blue-400 fill-white" size={24} />}
        </div>
        
        <div className="flex items-center gap-4 text-sm font-medium mb-3 opacity-90">
          <div className="flex items-center gap-1">
            <MapPin size={16} />
            <span>{profile.distance} miles away</span>
          </div>
          {profile.job && (
            <div className="flex items-center gap-1">
              <Briefcase size={16} />
              <span>{profile.job}</span>
            </div>
          )}
        </div>

        <p className="text-base leading-relaxed mb-4 line-clamp-3 text-gray-100">
          {profile.bio}
        </p>

        <div className="flex flex-wrap gap-2">
          {profile.interests.map((interest, idx) => (
            <span 
              key={idx}
              className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold tracking-wide"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
