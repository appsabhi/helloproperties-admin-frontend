import React, { useState } from 'react';
import { Plus, Check } from 'lucide-react';

export const DESCRIPTION_KEYWORDS = [
  "Tar Road Frontage",
  "Clear Title Deed",
  "Well Water Available",
  "Electricity Available",
  "Near Highway / Bypass",
  "Corner Plot",
  "Peaceful Residential Area",
  "Commercial Potential",
  "Bank Loan Approved",
  "Price Negotiable",
  "Compound Wall Built",
  "Immediate Possession",
  "Ready to Build",
  "Car Parking Space",
  "Gated Community"
];

export default function PropertyKeywordsSelector({ keywords = [], description = "", onChange }) {
  const [customKeywords, setCustomKeywords] = useState([]);
  const [newKeywordInput, setNewKeywordInput] = useState("");

  const currentKeywords = Array.isArray(keywords) ? keywords : [];

  const toggleKeyword = (kwToToggle) => {
    if (!kwToToggle || typeof kwToToggle !== 'string') return;
    const trimmed = kwToToggle.trim();
    if (!trimmed) return;

    const lowerTarget = trimmed.toLowerCase();
    const exists = currentKeywords.some(k => k && k.toLowerCase() === lowerTarget);
    let nextKeywords = [];
    let nextDescription = description || "";

    if (exists) {
      nextKeywords = currentKeywords.filter(k => k && k.toLowerCase() !== lowerTarget);
      
      // Remove from description
      const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:,\\s*)?${escapeRegExp(trimmed)}(?:\\s*,)?`, 'gi');
      
      nextDescription = nextDescription.replace(regex, (match) => {
          if (match.startsWith(',') && match.endsWith(',')) return ', ';
          return '';
      }).trim();
      nextDescription = nextDescription.replace(/^,\s*/, '').replace(/,\s*$/, '');
    } else {
      nextKeywords = [...currentKeywords, trimmed];
      
      // Append to description
      let newDesc = nextDescription.trim();
      if (newDesc) {
        if (!newDesc.endsWith(',')) newDesc += ', ';
        else newDesc += ' ';
      }
      newDesc += trimmed;
      nextDescription = newDesc;
    }

    if (onChange) {
      onChange({ keywords: nextKeywords, description: nextDescription });
    }
  };

  const handleAddCustomKeyword = () => {
    const trimmed = newKeywordInput.trim();
    if (!trimmed) return;

    if (!customKeywords.some(k => k.toLowerCase() === trimmed.toLowerCase())) {
      setCustomKeywords(prev => [...prev, trimmed]);
    }

    if (!currentKeywords.some(k => k && k.toLowerCase() === trimmed.toLowerCase())) {
      toggleKeyword(trimmed);
    }

    setNewKeywordInput("");
  };

  return (
    <div className="flex flex-col gap-2 bg-[#F8F9FA] p-3 rounded-xl border border-slate-200/70 mt-2">
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
          Quick Property Keywords (Click to add/remove)
        </span>
        {currentKeywords.length > 0 && (
          <button
            type="button"
            onClick={() => onChange && onChange({ keywords: [], description: "" })}
            className="text-[10.5px] font-semibold text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
          >
            Clear Keywords ({currentKeywords.length})
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {Array.from(new Set([...DESCRIPTION_KEYWORDS, ...customKeywords])).map((kw) => {
          const isSelected = currentKeywords.some(k => k && k.toLowerCase() === kw.toLowerCase());

          return (
            <button
              key={kw}
              type="button"
              onClick={() => toggleKeyword(kw)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11.5px] font-medium transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#B0004F] text-white shadow-xs font-semibold"
                  : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-800 border border-slate-200/80"
              }`}
            >
              {isSelected ? (
                <Check className="w-3 h-3 text-white" />
              ) : (
                <Plus className="w-3 h-3 text-slate-400" />
              )}
              <span>{kw}</span>
            </button>
          );
        })}
      </div>

      {/* Add Custom Keyword Input Bar */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-200/70 mt-1">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Add your own keywords (e.g. Near InfoPark)..."
            value={newKeywordInput}
            onChange={(e) => setNewKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustomKeyword();
              }
            }}
            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[12px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#B0004F] transition-all"
          />
        </div>
        <button
          type="button"
          onClick={handleAddCustomKeyword}
          className="px-3 py-1.5 text-[11.5px] font-semibold text-white bg-[#B0004F] hover:bg-[#9A0044] rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Keyword</span>
        </button>
      </div>
    </div>
  );
}
