import React, { useState } from 'react';
import { Share2, Check, MessageCircle, ExternalLink } from 'lucide-react';
import Modal from './Modal';

function formatDisplayArea(areaStr) {
  if (!areaStr) return '—';
  const s = String(areaStr).trim();
  if (s === '—' || s === 'Any Area') return s;

  const numMatch = s.match(/^([\d.,]+)/);
  if (!numMatch) return s;

  const num = numMatch[1];
  const rest = s.slice(numMatch[0].length).trim();
  if (!rest) return num;

  const recognizedUnits = [
    '5+ BHK', '4+ BHK', '4 BHK', '3 BHK', '2 BHK', '1 BHK',
    'Sq. Meter', 'Sq. Yard', 'Sq. Ft.', 'House', 'Month',
    'Cent', 'Acre', 'BHK'
  ];

  let lastMatchUnit = null;
  let maxIdx = -1;

  for (const u of recognizedUnits) {
    const idx = rest.toLowerCase().lastIndexOf(u.toLowerCase());
    if (idx > maxIdx) {
      maxIdx = idx;
      lastMatchUnit = u;
    }
  }

  if (lastMatchUnit) {
    return `${num} ${lastMatchUnit}`;
  }

  return `${num} ${rest}`;
}

export function buildCleanWhatsAppText(property) {
  const isRent = property?.listingType === 'Rent';
  const priceLines = [];

  if (isRent) {
    const formattedRent = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(property.monthlyRent || 0);

    priceLines.push(`💰 Rent: ${formattedRent}`);
  } else {
    const formattedPrice = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(property.expectedPrice || property.price || 0);

    priceLines.push(`💰 Price: ${formattedPrice}`);
  }

  const validImageUrl = (property?.imageUrl && typeof property.imageUrl === 'string' && !property.imageUrl.startsWith('blob:'))
    ? property.imageUrl.trim()
    : null;

  const propId = property.id || property.propertyId || property._id;
  const baseUrl = import.meta.env.VITE_PUBLIC_VIEWER_URL || window.location.origin;
  const publicShareUrl = `${baseUrl}/p/${propId}`;

  const messageLines = [
    `Hello! 👋`,
    ``,
    `Here are the property details matching your requirement:`,
    ``,
    `🏡 Property Type: ${property.propertyType || 'Plot/Land'}`,
    `📍 District: ${property.district || '—'}`,
    `📐 Area: ${formatDisplayArea(property.area)}`,
    ...priceLines,
    ``,
    `🔗 View Full Product Details Online:`,
    `${publicShareUrl}`
  ];

  messageLines.push(
    ``,
    `Please let us know if you are interested.`,
    ``,
    `Regards,`,
    `HelloProperties`
  );

  return messageLines.join('\n');
}

export function buildWhatsAppShareUrl(property, buyerPhone) {
  const cleanPhone = buyerPhone ? String(buyerPhone).replace(/\D/g, '') : '';
  const fullText = buildCleanWhatsAppText(property);
  const encodedText = encodeURIComponent(fullText);

  if (cleanPhone) {
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    return `https://web.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodedText}`;
  }
  return `https://web.whatsapp.com/send?text=${encodedText}`;
}

let globalWhatsAppWindowRef = null;

export function openWhatsAppShareWindow(url) {
  const windowName = 'helloproperties-whatsapp';
  try {
    globalWhatsAppWindowRef = window.open(url, windowName);
    if (globalWhatsAppWindowRef && globalWhatsAppWindowRef.focus) {
      globalWhatsAppWindowRef.focus();
    }
  } catch (e) {
    console.warn('Error opening/reusing named WhatsApp window:', e);
  }

  return globalWhatsAppWindowRef;
}

export default function SharePropertyModal({ property, buyer, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!property) return null;

  const isRent = property?.listingType === 'Rent';
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(property.expectedPrice || property.price || 0);

  const formattedRent = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(property.monthlyRent || 0);

  const whatsappUrl = buildWhatsAppShareUrl(property, buyer?.phoneNumber || buyer?.buyerPhone);
  const validImageUrl = (property?.imageUrl && typeof property.imageUrl === 'string' && !property.imageUrl.startsWith('blob:'))
    ? property.imageUrl.trim()
    : null;

  const handleCopyText = () => {
    const text = buildCleanWhatsAppText(property);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleOpenWhatsApp = () => {
    openWhatsAppShareWindow(whatsappUrl);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Share Property"
      subtitle="Share customer-facing property details via WhatsApp or public link"
      icon={Share2}
      size="md"
      footer={
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <button
            onClick={handleOpenWhatsApp}
            className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Open in WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-80" />
          </button>
          <button
            onClick={handleCopyText}
            className="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : null}
            <span>{copied ? 'Copied!' : 'Copy Message'}</span>
          </button>
        </div>
      }
    >
      {/* Customer-Facing Shared Details Preview */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
          Customer-Facing Details Preview
        </span>

        {validImageUrl && (
          <div className="h-44 w-full rounded-lg overflow-hidden border border-slate-200 bg-white">
            <img
              src={validImageUrl}
              alt={property.title || 'Property Image'}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80';
              }}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 pt-1">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Property Type</span>
            <span className="font-bold text-slate-900">{property.propertyType || 'Plot/Land'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">District</span>
            <span className="font-bold text-slate-900">{property.district || '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Area</span>
            <span className="font-bold text-slate-900">{formatDisplayArea(property.area)}</span>
          </div>
          {isRent ? (
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Rent</span>
              <span className="font-extrabold text-[#C4005A]">{formattedRent}</span>
            </div>
          ) : (
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Price</span>
              <span className="font-extrabold text-[#C4005A]">{formattedPrice}</span>
            </div>
          )}
        </div>
      </div>

      {/* Public Share Link Card Box */}
      <div className="pt-2 border-t border-slate-100 space-y-1.5">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Public Shareable Product Link</span>
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <span className="text-xs font-mono text-slate-700 truncate flex-1 select-all font-medium">
            {`${import.meta.env.VITE_PUBLIC_VIEWER_URL || window.location.origin}/p/${property.id || property.propertyId || property._id}`}
          </span>
          <button
            type="button"
            onClick={() => {
              const link = `${import.meta.env.VITE_PUBLIC_VIEWER_URL || window.location.origin}/p/${property.id || property.propertyId || property._id}`;
              navigator.clipboard.writeText(link);
              setCopied(true);
              setTimeout(() => setCopied(false), 3000);
            }}
            className="px-2.5 py-1 bg-[#B0004F] hover:bg-[#8A003E] text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer shrink-0"
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
