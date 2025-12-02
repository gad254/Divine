import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { translations } from '../utils/translations';
import { Language } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileName: string;
  reportedUserId: string;
  lang: Language;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, profileName, reportedUserId, lang }) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Basic translations for the modal content if not fully covered in utils
  const t = {
      title: translations[lang].auth.createTitle ? 'Report User' : 'Signaler', // Fallback or use specific keys if added
      ...translations[lang].home // Assuming report keys might be here or just hardcode for safety if keys missing
  };

  const reportReasons = [
      "Fake Profile",
      "Inappropriate Content",
      "Harassment",
      "Scam / Spam",
      "Underage",
      "Other"
  ];

  const handleSubmit = async () => {
      if (!reason) return;
      setIsSubmitting(true);
      
      try {
          const { error } = await supabase
              .from('reports')
              .insert([
                  {
                      reported_id: reportedUserId,
                      reason: reason,
                      status: 'pending'
                  }
              ]);
          
          if (error) throw error;
          
          setIsSuccess(true);
          setTimeout(() => {
              onClose();
              setIsSuccess(false);
              setReason('');
          }, 2000);
      } catch (error) {
          console.error("Error reporting user:", error);
          alert("Failed to submit report. Please try again.");
      } finally {
          setIsSubmitting(false);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 animate-fade-in">
        <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            {isSuccess ? (
                <div className="p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-500">
                        <CheckCircle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Report Submitted</h3>
                    <p className="text-gray-500 text-sm">Thank you for keeping our community safe. We will review this report.</p>
                </div>
            ) : (
                <>
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <AlertTriangle size={18} className="text-red-500" />
                            Report {profileName}
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-6">
                        <p className="text-sm text-gray-500 mb-4">
                            Please select a reason for reporting this user. This is anonymous.
                        </p>
                        
                        <div className="space-y-2 mb-6">
                            {reportReasons.map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setReason(r)}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                        reason === r 
                                        ? 'bg-red-50 text-red-600 border border-red-200 shadow-sm' 
                                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-transparent'
                                    }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={!reason || isSubmitting}
                            className={`w-full py-3.5 rounded-full font-bold text-white shadow-md transition-all ${
                                !reason || isSubmitting
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-red-500 hover:bg-red-600 active:scale-95'
                            }`}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                </>
            )}
        </div>
    </div>
  );
};