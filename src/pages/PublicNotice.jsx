import React from 'react';
import logo from '../assets/HELLO PROPERTIES LOGO.png';
import { Building2, MessageCircle } from 'lucide-react';

export default function PublicNotice() {
  const handleWhatsAppContact = () => {
    const text = encodeURIComponent("Hello HelloProperties! 👋\n\nI am looking for property details. Please assist me. Thank you!");
    window.open(`https://web.whatsapp.com/send?phone=919605182753&text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 font-sans text-slate-800 selection:bg-[#B0004F] selection:text-white">
      <div className="bg-white p-8 rounded-2xl border border-slate-200/90 shadow-xl max-w-md w-full text-center space-y-5 animate-fade-in">
        <img 
          src={logo} 
          alt="HelloProperties Logo" 
          className="h-12 mx-auto object-contain" 
        />
        
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Property Link Required</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            To view full property details, location, and images, please use the specific property link shared with you.
          </p>
        </div>

        <div className="pt-2 space-y-3">
          <button
            onClick={handleWhatsAppContact}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Contact HelloProperties on WhatsApp</span>
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
          © {new Date().getFullYear()} HelloProperties. All rights reserved.
        </div>
      </div>
    </div>
  );
}
