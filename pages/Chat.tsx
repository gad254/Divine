
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, MoreVertical, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import { Match, Message } from '../types';
import { chatWithMatch } from '../services/geminiService';

interface ChatProps {
  match: Match;
  messages: Message[];
  onBack: () => void;
  onSendMessage: (matchId: string, text: string, senderId: string) => void;
}

export const Chat: React.FC<ChatProps> = ({ match, messages, onBack, onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const userMsgText = inputText;
    setInputText('');
    
    // 1. Send user message immediately
    onSendMessage(match.id, userMsgText, 'user');

    // 2. Trigger AI response
    setIsTyping(true);
    
    // Convert current messages to history format for Gemini
    const history = messages.map(m => ({
        role: m.senderId === 'user' ? 'user' : 'model',
        text: m.text
    }));

    // Add current message to history context manually since state might not update instantly in this closure
    const response = await chatWithMatch(userMsgText, match.profile, history);
    
    setIsTyping(false);
    onSendMessage(match.id, response, match.profile.id);
  };

  const avatarUrl = match.profile.photos && match.profile.photos.length > 0
    ? match.profile.photos[0].url
    : `https://picsum.photos/seed/${match.profile.imageSeed}/100/100`;

  return (
    <div className="flex flex-col h-full bg-white relative z-50">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shadow-sm bg-white">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <div className="relative">
            <img 
              src={avatarUrl} 
              className="w-10 h-10 rounded-full object-cover" 
              alt="avatar"
            />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div>
             <h3 className="font-bold text-gray-900 text-sm">{match.profile.name}</h3>
             <div className="flex items-center gap-1 text-xs text-green-600">
                <ShieldCheck size={12} />
                <span>Verified Match</span>
             </div>
          </div>
        </div>
        <button className="text-gray-400">
            <MoreVertical size={24} />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        <div className="text-center text-xs text-gray-400 my-4">
            You matched with {match.profile.name} on {new Date(match.timestamp).toLocaleDateString()}
        </div>
        
        {messages.map((msg) => {
            const isMe = msg.senderId === 'user';
            return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                        isMe 
                        ? 'bg-primary text-white rounded-br-none' 
                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm'
                    }`}>
                        {msg.text}
                    </div>
                </div>
            );
        })}
        {isTyping && (
             <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                </div>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2 pb-safe">
        <button className="p-2 text-gray-400 hover:text-primary transition-colors">
            <ImageIcon size={24} />
        </button>
        <div className="flex-1 relative">
            <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="w-full bg-gray-100 text-gray-900 rounded-full pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
        </div>
        <button 
            onClick={handleSend}
            disabled={!inputText.trim()}
            className={`p-2.5 rounded-full transition-all ${
                inputText.trim() 
                ? 'bg-primary text-white shadow-md hover:scale-105' 
                : 'bg-gray-100 text-gray-400'
            }`}
        >
            <Send size={20} />
        </button>
      </div>
    </div>
  );
};
