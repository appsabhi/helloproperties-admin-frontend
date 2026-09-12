import React, { useContext } from 'react';
import { PropertyContext } from '../context/PropertyContext';
import { Loader2 } from 'lucide-react';

export default function MinimalLoader() {
  const { isApiLoading, apiLoadingMessage } = useContext(PropertyContext) || {};

  if (!isApiLoading) return null;

  return (
    <>
      {/* Top slim loading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[100] h-[3px] bg-[#FFF1F6] overflow-hidden pointer-events-none">
        <div className="h-full bg-gradient-to-r from-[#C4005A] via-pink-400 to-[#C4005A] w-full animate-pulse transition-all duration-300" />
      </div>

      {/* Floating minimal loading pill */}
      <div className="fixed bottom-5 right-5 z-[99] flex items-center space-x-2.5 px-3.5 py-2 bg-slate-900/90 text-white rounded-full shadow-lg backdrop-blur-xs text-xs font-medium border border-slate-700/50 animate-fade-in pointer-events-none">
        <Loader2 className="w-3.5 h-3.5 text-[#FF69B4] animate-spin flex-shrink-0" />
        <span className="truncate max-w-[180px] text-slate-200">
          {apiLoadingMessage || 'Loading...'}
        </span>
      </div>
    </>
  );
}
