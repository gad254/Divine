import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Camera, Settings, Edit2, Zap, CheckCircle, AlertCircle, Trash2, Star, Plus, X, Check, ChevronLeft, ChevronRight, Globe, ChevronDown, TextQuote, MapPin, Maximize2, Loader2, AlertTriangle, Briefcase } from 'lucide-react';
import { UserProfile, Language, Photo } from '../types';
import { moderateImage } from '../services/geminiService';
import { translations } from '../utils/translations';

interface ProfilePageProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  lang: Language;
  setLang: (lang: Language) => void;
}

interface UploadStatus {
  tempId: string;
  file?: File;
  progress: number;
  status: 'uploading' | 'error' | 'success';
  errorMessage?: string;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdateUser, lang, setLang }) => {
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(user.bio);
  const [ageInput, setAgeInput] = useState(String(user.age));
  const [locationInput, setLocationInput] = useState(user.location);
  const [jobInput, setJobInput] = useState(user.job);
  
  // Upload Queue State
  const [uploadQueue, setUploadQueue] = useState<UploadStatus[]>([]);
  
  // Interest Editing State
  const [isAddingInterest, setIsAddingInterest] = useState(false);
  const [interestInput, setInterestInput] = useState('');

  // Caption Editing State
  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null);
  const [captionInput, setCaptionInput] = useState('');

  // Photo Viewing State (Lightbox)
  const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null);

  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Ref to track latest user state for async operations
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const t = translations[lang].profile;

  // Sync local state if user changes externally
  useEffect(() => {
    if (!isEditingBio) {
        setBioInput(user.bio);
        setAgeInput(String(user.age));
        setLocationInput(user.location);
        setJobInput(user.job);
    }
  }, [user.bio, user.age, user.location, user.job, isEditingBio]);

  // Calculate profile completion
  const completionPercentage = useMemo(() => {
    let score = 0;
    const totalWeight = 100;
    
    if (user.name) score += 10;
    if (user.age) score += 10;
    
    if (user.bio && user.bio.length > 15) score += 20;
    else if (user.bio) score += 10;
    
    if (user.location) score += 10;
    if (user.job) score += 10;
    
    if (user.interests && user.interests.length >= 3) score += 20;
    else if (user.interests && user.interests.length > 0) score += 10;
    
    // Photos bonus
    if (user.photos && user.photos.length >= 3) score += 20;
    else if (user.photos && user.photos.length > 0) score += 10;

    return Math.min(score, totalWeight);
  }, [user]);

  const processUploadQueue = async (queueItem: UploadStatus, file: File) => {
    // Simulate progress
    const progressInterval = setInterval(() => {
        setUploadQueue(prev => prev.map(item => {
            if (item.tempId === queueItem.tempId && item.status === 'uploading') {
                return { ...item, progress: Math.min(item.progress + 10, 90) };
            }
            return item;
        }));
    }, 200);

    try {
        const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        const base64Data = base64.split(',')[1];
        const moderation = await moderateImage(base64Data);

        clearInterval(progressInterval);

        if (moderation.safe) {
            // Success
            const newId = `photo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            const newPhoto: Photo = { id: newId, url: base64 };
            
            // Remove from queue
            setUploadQueue(prev => prev.filter(item => item.tempId !== queueItem.tempId));
            
            // Use userRef.current to get the most up-to-date user object
            // This prevents race conditions if multiple uploads finish close together
            const currentUser = userRef.current;
            onUpdateUser({ 
                ...currentUser, 
                photos: [...currentUser.photos, newPhoto] 
            }); 
        } else {
            // Moderation Failed
            setUploadQueue(prev => prev.map(item => 
                item.tempId === queueItem.tempId 
                ? { ...item, status: 'error', progress: 100, errorMessage: moderation.reason || "Content flagged" } 
                : item
            ));
        }
    } catch (error) {
        clearInterval(progressInterval);
        setUploadQueue(prev => prev.map(item => 
            item.tempId === queueItem.tempId 
            ? { ...item, status: 'error', progress: 100, errorMessage: "Upload failed" } 
            : item
        ));
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray: File[] = Array.from(files);
    const currentCount = user.photos.length;
    const queueCount = uploadQueue.filter(q => q.status === 'uploading').length;
    const availableSlots = 6 - (currentCount + queueCount);

    if (fileArray.length > availableSlots) {
        alert(`You can only upload ${availableSlots} more photo(s).`);
        return;
    }

    // Create queue items
    const newQueueItems: UploadStatus[] = fileArray.map(f => ({
        tempId: Math.random().toString(36),
        file: f,
        progress: 0,
        status: 'uploading'
    }));

    setUploadQueue(prev => [...prev, ...newQueueItems]);

    // Process each
    newQueueItems.forEach((item, index) => {
        processUploadQueue(item, fileArray[index]);
    });

    e.target.value = ''; 
  };

  const handleDismissError = (tempId: string) => {
      setUploadQueue(prev => prev.filter(item => item.tempId !== tempId));
  };

  const handleDeletePhoto = (index: number) => {
      if (user.photos.length <= 1) {
          alert("You must have at least one photo.");
          return;
      }
      const newPhotos = user.photos.filter((_, i) => i !== index);
      onUpdateUser({ ...user, photos: newPhotos });
  };

  const handleSetMainPhoto = (index: number) => {
      if (index === 0) return;
      const newPhotos = [...user.photos];
      const [movedPhoto] = newPhotos.splice(index, 1);
      newPhotos.unshift(movedPhoto);
      onUpdateUser({ ...user, photos: newPhotos });
  };

  const handleMovePhoto = (index: number, direction: 'left' | 'right') => {
      const newPhotos = [...user.photos];
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      
      if (targetIndex < 0 || targetIndex >= newPhotos.length) return;
      
      [newPhotos[index], newPhotos[targetIndex]] = [newPhotos[targetIndex], newPhotos[index]];
      onUpdateUser({ ...user, photos: newPhotos });
  };

  const handleSaveCaption = () => {
    if (!editingCaptionId) return;
    
    const newPhotos = user.photos.map(p => {
        if (p.id === editingCaptionId) {
            return { ...p, caption: captionInput.trim() };
        }
        return p;
    });
    
    onUpdateUser({ ...user, photos: newPhotos });
    setEditingCaptionId(null);
    setCaptionInput('');
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = "move";
      // Firefox requires data to be set
      e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault(); // Necessary to allow dropping
      e.dataTransfer.dropEffect = "move";
      if (dragOverIndex !== index) {
        setDragOverIndex(index);
      }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
      e.preventDefault();
      setDragOverIndex(null);
      if (draggedIndex === null || draggedIndex === dropIndex) return;

      const newPhotos = [...user.photos];
      const [draggedPhoto] = newPhotos.splice(draggedIndex, 1);
      newPhotos.splice(dropIndex, 0, draggedPhoto);
      
      onUpdateUser({ ...user, photos: newPhotos });
      setDraggedIndex(null);
  };

  const handleDragEnd = () => {
      setDraggedIndex(null);
      setDragOverIndex(null);
  };

  const handleSaveProfile = () => {
    const newAge = parseInt(ageInput, 10);
    
    if (isNaN(newAge) || newAge < 18 || newAge > 99) {
        alert(t.invalidAge);
        return;
    }

    onUpdateUser({ 
        ...user, 
        bio: bioInput, 
        age: newAge,
        location: locationInput,
        job: jobInput
    });
    setIsEditingBio(false);
  };

  const handleAddInterest = () => {
    const trimmed = interestInput.trim();
    if (trimmed) {
        // Prevent duplicates (case-insensitive check)
        if (!user.interests.some(i => i.toLowerCase() === trimmed.toLowerCase())) {
            onUpdateUser({
                ...user,
                interests: [...user.interests, trimmed]
            });
        }
    }
    setInterestInput('');
    setIsAddingInterest(false);
  };

  const handleRemoveInterest = (interestToRemove: string) => {
    onUpdateUser({
        ...user,
        interests: user.interests.filter(i => i !== interestToRemove)
    });
  };

  const handleKeyDownInterest = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          handleAddInterest();
      } else if (e.key === 'Escape') {
          setIsAddingInterest(false);
          setInterestInput('');
      }
  };

  const mainPhoto = user.photos && user.photos.length > 0 
    ? user.photos[0].url
    : `https://picsum.photos/seed/${user.imageSeed}/600/600`;
  
  const isGlobalUploading = uploadQueue.some(q => q.status === 'uploading');

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-32 overflow-y-auto">
      {/* Header Image Area */}
      <div className="relative h-64 w-full shrink-0">
         <img 
            src={mainPhoto} 
            className="w-full h-full object-cover"
            alt="My Profile"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
         <div className="absolute bottom-4 left-6 text-white w-full pr-12">
             <div className="flex items-end justify-between">
                 <div>
                     <h1 className="text-3xl font-bold">{user.name}, {user.age}</h1>
                     <div className="flex items-center gap-2 opacity-90 mt-1">
                        <Briefcase size={14} />
                        <p>{user.job || 'No Job Added'}</p>
                        {user.location && (
                            <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm ml-2">
                                <MapPin size={10} />
                                <span>{user.location}</span>
                            </div>
                        )}
                     </div>
                 </div>
                 {user.isBoostActive && (
                     <div className="flex items-center gap-1 bg-purple-600 px-3 py-1 rounded-full animate-pulse shadow-lg mb-1 mr-6">
                        <Zap size={14} fill="currentColor" />
                        <span className="text-xs font-bold uppercase tracking-wide">Boosted</span>
                     </div>
                 )}
             </div>
         </div>
      </div>

      {/* Stats/Action Bar */}
      <div className="flex justify-center -mt-8 relative z-10 gap-6 mb-4">
         <div className="flex flex-col items-center">
            <button className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center text-gray-600 hover:text-primary transition-colors">
                <Settings size={24} />
            </button>
            <span className="text-xs font-semibold text-gray-500 mt-1">{t.settings}</span>
         </div>
         <div className="flex flex-col items-center -mt-4">
             <label className={`w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-secondary shadow-lg flex items-center justify-center text-white cursor-pointer hover:scale-105 transition-transform ${isGlobalUploading ? 'opacity-70 cursor-wait' : ''}`}>
                 {isGlobalUploading ? <Loader2 size={32} className="animate-spin" /> : <Camera size={32} />}
                 <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handlePhotoUpload} 
                    disabled={isGlobalUploading} 
                    multiple
                 />
             </label>
             <span className="text-xs font-semibold text-gray-500 mt-1">{isGlobalUploading ? t.uploading : t.addMedia}</span>
         </div>
         <div className="flex flex-col items-center">
            <button 
                onClick={() => {
                    setBioInput(user.bio);
                    setAgeInput(String(user.age));
                    setLocationInput(user.location);
                    setJobInput(user.job);
                    setIsEditingBio(true);
                }}
                className={`w-14 h-14 rounded-full shadow-md flex items-center justify-center transition-colors ${isEditingBio ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:text-primary'}`}
            >
                <Edit2 size={24} />
            </button>
            <span className="text-xs font-semibold text-gray-500 mt-1">{t.editInfo}</span>
         </div>
      </div>

      {/* Info Section */}
      <div className="px-6 mt-2 space-y-6">
          
          {/* Profile Completion Card */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
             <div className="flex justify-between items-center mb-2">
                 <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    {completionPercentage === 100 ? <CheckCircle size={16} className="text-green-500" /> : <AlertCircle size={16} className="text-orange-500" />}
                    {t.completion}
                 </h3>
                 <span className="text-sm font-bold text-primary">{completionPercentage}%</span>
             </div>
             <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2 overflow-hidden">
                 <div 
                    className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${
                        completionPercentage === 100 ? 'bg-green-500' : 
                        completionPercentage > 50 ? 'bg-primary' : 'bg-orange-400'
                    }`}
                    style={{ width: `${completionPercentage}%` }}
                 ></div>
             </div>
             <p className="text-xs text-gray-500">
                 {completionPercentage === 100 
                    ? t.completionFull 
                    : t.completionMsg}
             </p>
          </div>

          {/* Photos Grid */}
          <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-900">{t.myPhotos}</h3>
                <span className="text-xs text-gray-400">{t.dragReorder} • {user.photos.length}/6</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                  {/* Existing Photos */}
                  {user.photos.map((photo, index) => (
                      <div 
                        key={photo.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setViewingPhoto(photo)}
                        className={`relative aspect-[3/4] group rounded-xl overflow-hidden shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing ${
                            draggedIndex === index 
                                ? 'opacity-40 scale-95 border-2 border-primary border-dashed' 
                                : dragOverIndex === index
                                    ? 'ring-2 ring-primary ring-offset-2 scale-105 z-10'
                                    : 'hover:shadow-md'
                        }`}
                      >
                          <img src={photo.url} className="w-full h-full object-cover pointer-events-none" alt={`User photo ${index + 1}`} />
                          
                          {/* Main Badge */}
                          {index === 0 && (
                              <div className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md z-10 pointer-events-none">
                                  {t.main}
                              </div>
                          )}

                          {/* Caption Indicator */}
                          {photo.caption && (
                             <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm p-1 rounded-full z-10 pointer-events-none">
                                <TextQuote size={10} className="text-white" />
                             </div>
                          )}

                          {/* Overlay Actions */}
                          <div className={`absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 ${draggedIndex !== null ? 'hidden' : ''}`}>
                               <div className="flex justify-end">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeletePhoto(index);
                                        }}
                                        className="p-1.5 bg-white/90 rounded-full text-red-500 hover:bg-white hover:scale-110 transition-all shadow-sm"
                                        title={t.delete}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                               </div>

                               <div className="flex justify-center gap-1.5 items-center flex-wrap">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingCaptionId(photo.id);
                                            setCaptionInput(photo.caption || '');
                                        }}
                                        className={`p-1.5 bg-white/90 rounded-full hover:bg-white transition-all shadow-sm ${photo.caption ? 'text-primary' : 'text-gray-700'}`}
                                        title={t.editCaption}
                                    >
                                        <TextQuote size={14} />
                                    </button>

                                    {index > 0 && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMovePhoto(index, 'left');
                                            }}
                                            className="p-1.5 bg-white/90 rounded-full text-gray-700 hover:bg-white hover:text-primary transition-all shadow-sm"
                                        >
                                            <ChevronLeft size={14} />
                                        </button>
                                    )}
                                    
                                    {index !== 0 && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSetMainPhoto(index);
                                            }}
                                            className="p-1.5 bg-white/90 rounded-full text-gray-700 hover:bg-white hover:text-yellow-500 transition-all shadow-sm"
                                            title={t.makeMain}
                                        >
                                            <Star size={14} />
                                        </button>
                                    )}

                                    {index < user.photos.length - 1 && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMovePhoto(index, 'right');
                                            }}
                                            className="p-1.5 bg-white/90 rounded-full text-gray-700 hover:bg-white hover:text-primary transition-all shadow-sm"
                                        >
                                            <ChevronRight size={14} />
                                        </button>
                                    )}
                               </div>
                          </div>
                      </div>
                  ))}
                  
                  {/* Uploading / Error Items */}
                  {uploadQueue.map((item) => (
                      <div key={item.tempId} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-inner">
                          {item.status === 'error' ? (
                              <div 
                                className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-red-50 cursor-pointer hover:bg-red-100 transition-colors text-center"
                                onClick={() => handleDismissError(item.tempId)}
                              >
                                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mb-2">
                                      <AlertTriangle size={16} className="text-red-500" />
                                  </div>
                                  <span className="text-xs text-red-600 font-bold mb-1">Upload Failed</span>
                                  <span className="text-[10px] text-gray-500 leading-tight line-clamp-2">{item.errorMessage}</span>
                              </div>
                          ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                                  {/* Spinning Loader */}
                                  <Loader2 size={24} className="text-primary animate-spin mb-3" />
                                  
                                  {/* Percentage */}
                                  <span className="text-xs font-bold text-gray-700 mb-1.5">{item.progress}%</span>
                                  
                                  {/* Bar */}
                                  <div className="w-full max-w-[80%] h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-primary transition-all duration-300 ease-out rounded-full" 
                                        style={{ width: `${item.progress}%` }}
                                      ></div>
                                  </div>
                              </div>
                          )}
                      </div>
                  ))}

                  {/* Add Photo Button (if not full) */}
                  {(user.photos.length + uploadQueue.length) < 6 && (
                      <label className="aspect-[3/4] rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-primary hover:text-primary hover:bg-primary/5 transition-all">
                          <Plus size={24} />
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handlePhotoUpload} 
                            disabled={isGlobalUploading} 
                            multiple 
                          />
                      </label>
                  )}
              </div>
          </div>

          {/* About Me Section - Editable */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-gray-900">{t.aboutMe}</h3>
                  {!isEditingBio && (
                      <button 
                        onClick={() => {
                            setBioInput(user.bio);
                            setAgeInput(String(user.age));
                            setLocationInput(user.location);
                            setJobInput(user.job);
                            setIsEditingBio(true);
                        }}
                        className="p-1 text-gray-400 hover:text-primary transition-colors"
                      >
                          <Edit2 size={16} />
                      </button>
                  )}
              </div>
              
              {isEditingBio ? (
                  <div className="animate-slide-up">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">{t.age}</label>
                            <input
                                type="number"
                                value={ageInput}
                                onChange={(e) => setAgeInput(e.target.value)}
                                min="18"
                                max="99"
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 font-medium"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">{t.location}</label>
                            <input
                                type="text"
                                value={locationInput}
                                onChange={(e) => setLocationInput(e.target.value)}
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 font-medium"
                                placeholder="City, Country"
                            />
                          </div>
                      </div>

                      <div className="mb-3">
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">Job Title</label>
                        <input
                            type="text"
                            value={jobInput}
                            onChange={(e) => setJobInput(e.target.value)}
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 font-medium"
                            placeholder="e.g. Designer, Student"
                        />
                      </div>
                      
                      <div className="mb-2">
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1.5">{t.aboutMe}</label>
                        <textarea
                            value={bioInput}
                            onChange={(e) => setBioInput(e.target.value)}
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[120px] resize-none text-gray-700"
                            placeholder={t.bioPlaceholder}
                            maxLength={300}
                        />
                      </div>

                      <div className="flex justify-end gap-3 mt-4">
                          <button 
                            onClick={() => {
                                setIsEditingBio(false);
                                setBioInput(user.bio);
                                setAgeInput(String(user.age));
                                setLocationInput(user.location);
                                setJobInput(user.job);
                            }}
                            className="px-4 py-2 text-xs font-bold text-gray-500 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                          >
                              {t.cancel}
                          </button>
                          <button 
                            onClick={handleSaveProfile}
                            className="px-6 py-2 text-xs font-bold text-white bg-primary rounded-full hover:bg-primary/90 shadow-md transition-all active:scale-95"
                          >
                              {t.save}
                          </button>
                      </div>
                  </div>
              ) : (
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                      {user.bio || <span className="text-gray-400 italic">{t.noBio}</span>}
                  </p>
              )}
          </div>

          {/* Interests Section - Editable */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-3">{t.interests}</h3>
              <div className="flex flex-wrap gap-2">
                  {user.interests.map((tag, i) => (
                      <span key={i} className="pl-3 pr-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold flex items-center gap-1 group hover:bg-gray-200 transition-colors cursor-default">
                          {tag}
                          <button 
                            onClick={() => handleRemoveInterest(tag)}
                            className="p-0.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-white transition-all"
                            title="Remove interest"
                          >
                              <X size={12} />
                          </button>
                      </span>
                  ))}
                  
                  {isAddingInterest ? (
                      <div className="flex items-center gap-1">
                          <input 
                              type="text"
                              value={interestInput}
                              onChange={(e) => setInterestInput(e.target.value)}
                              onKeyDown={handleKeyDownInterest}
                              className="w-24 px-3 py-1 bg-white border border-primary rounded-full text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                              autoFocus
                              placeholder="Type..."
                          />
                          <button 
                              onClick={handleAddInterest}
                              className="p-1 bg-primary text-white rounded-full hover:bg-primary/90"
                          >
                              <Check size={12} />
                          </button>
                          <button 
                              onClick={() => { setIsAddingInterest(false); setInterestInput(''); }}
                              className="p-1 bg-gray-200 text-gray-500 rounded-full hover:bg-gray-300"
                          >
                              <X size={12} />
                          </button>
                      </div>
                  ) : (
                      <button 
                          onClick={() => setIsAddingInterest(true)}
                          className="px-3 py-1 border border-gray-300 text-gray-400 rounded-full text-xs font-semibold hover:border-primary hover:text-primary transition-colors flex items-center gap-1 hover:bg-primary/5"
                      >
                          <Plus size={12} /> {t.add}
                      </button>
                  )}
              </div>
          </div>

          {/* Language Selector */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-900 font-bold">
                  <Globe size={20} className="text-primary" />
                  <span>{t.language}</span>
              </div>
              <div className="relative">
                <select 
                    value={lang}
                    onChange={(e) => setLang(e.target.value as Language)}
                    className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-full text-sm font-medium outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer transition-all hover:bg-gray-100"
                >
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="sw">Kiswahili</option>
                    <option value="ln">Lingala</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <ChevronDown size={14} />
                </div>
              </div>
          </div>

          {/* Footer Info */}
          <div className="flex flex-col items-center justify-center pt-8 pb-4 opacity-40">
              <div className="w-8 h-1 bg-gray-300 rounded-full mb-3"></div>
              <p className="text-[10px] font-bold tracking-widest uppercase">Divine App</p>
              <p className="text-[10px]">{t.version} 1.0.0</p>
          </div>
      </div>

      {/* Caption Edit Modal */}
      {editingCaptionId && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
                  <h3 className="font-bold text-gray-900 mb-4">{t.editCaption}</h3>
                  <textarea
                      value={captionInput}
                      onChange={(e) => setCaptionInput(e.target.value)}
                      className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px] resize-none text-gray-700"
                      placeholder={t.captionPlaceholder}
                      maxLength={100}
                      autoFocus
                  />
                  <div className="flex justify-end gap-3 mt-4">
                      <button 
                        onClick={() => setEditingCaptionId(null)}
                        className="px-4 py-2 text-xs font-bold text-gray-500 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                      >
                          {t.cancel}
                      </button>
                      <button 
                        onClick={handleSaveCaption}
                        className="px-6 py-2 text-xs font-bold text-white bg-primary rounded-full hover:bg-primary/90 shadow-md transition-all active:scale-95"
                      >
                          {t.save}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Photo Lightbox Modal */}
      {viewingPhoto && (
          <div 
            className="fixed inset-0 bg-black z-[100] flex flex-col animate-fade-in"
            onClick={() => setViewingPhoto(null)}
          >
              <button 
                onClick={() => setViewingPhoto(null)}
                className="absolute top-4 right-4 z-[101] p-2 bg-black/50 rounded-full text-white hover:bg-white/20 transition-all"
              >
                  <X size={24} />
              </button>

              <div className="flex-1 flex items-center justify-center p-4">
                  <img 
                    src={viewingPhoto.url} 
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
                    alt="Full size"
                    onClick={(e) => e.stopPropagation()} // Prevent clicking image from closing
                  />
              </div>

              {viewingPhoto.caption && (
                  <div className="p-6 pb-12 bg-gradient-to-t from-black via-black/80 to-transparent text-white text-center absolute bottom-0 left-0 right-0">
                      <p className="text-lg font-medium">{viewingPhoto.caption}</p>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};