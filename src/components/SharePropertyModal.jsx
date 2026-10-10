import React, { useState } from 'react';
import { Share2, Check, MessageCircle, ExternalLink, Video } from 'lucide-react';
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

export const encodeId = (str) => Array.from(String(str)).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');

export function parsePropertyMedia(property) {
  const backendBase = (import.meta.env.VITE_API_BASE_URL || 'https://helloproperties-backend.vercel.app/api').replace(/\/api$/, '');

  const rawImg = property?.imageUrl || property?.image_url || property?.images;
  let images = [];
  if (Array.isArray(rawImg)) {
    images = rawImg;
  } else if (typeof rawImg === 'string') {
    images = rawImg.split(',').map(s => s.trim()).filter(Boolean);
  }
  const cleanImages = images
    .filter(u => typeof u === 'string' && !u.startsWith('blob:') && u !== 'null' && u !== 'undefined')
    .map(u => u.startsWith('/uploads/') ? `${backendBase}${u}` : u);

  const rawVid = property?.videoUrl || property?.video || property?.video_url;
  let videos = [];
  if (Array.isArray(rawVid)) {
    videos = rawVid;
  } else if (typeof rawVid === 'string') {
    videos = rawVid.split(',').map(s => s.trim()).filter(Boolean);
  }
  const cleanVideos = videos
    .filter(u => typeof u === 'string' && !u.startsWith('blob:') && u !== 'null' && u !== 'undefined')
    .map(u => u.startsWith('/uploads/') ? `${backendBase}${u}` : u);

  const realImages = cleanImages.filter(u => !u.includes('images.unsplash.com'));
  const primaryImage = realImages[0] || cleanImages[0] || null;

  return {
    images: cleanImages,
    realImages,
    primaryImage,
    videos: cleanVideos,
    hasRealImage: realImages.length > 0,
    hasVideo: cleanVideos.length > 0
  };
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

  const { realImages, hasVideo } = parsePropertyMedia(property);

  const propId = property.id || property.propertyId || property._id;
  const maskedId = encodeId(propId);
  const baseUrl = import.meta.env.VITE_PUBLIC_SHARE_URL || import.meta.env.VITE_PUBLIC_VIEWER_URL || window.location.origin;
  const publicShareUrl = `${baseUrl}/p/${maskedId}`;

  const messageLines = [
    `Hello! 👋`,
    ``,
    `Here are the property details matching your requirement:`,
    ``,
    `🏡 Property Type: ${property.propertyType || 'Plot/Land'}`,
    `📍 District: ${property.district || '—'}`,
    `📐 Area: ${formatDisplayArea(property.area)}`,
    ...priceLines
  ];

  if (hasVideo) {
    messageLines.push(`🎬 Video Tour: Included in link`);
  }
  if (realImages.length > 1) {
    messageLines.push(`📸 Photos: ${realImages.length} Property Images Available`);
  }

  messageLines.push(
    ``,
    `🔗 View Full Property Details & Media:`,
    `${publicShareUrl}`,
    ``,
    `Please let us know if you would like to arrange a site visit.`,
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

  const { primaryImage, hasVideo, realImages } = parsePropertyMedia(property);
  const whatsappUrl = buildWhatsAppShareUrl(property, buyer?.phoneNumber || buyer?.buyerPhone);

  const handleCopyText = () => {
    const text = buildCleanWhatsAppText(property);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleOpenWhatsApp = () => {
    openWhatsAppShareWindow(whatsappUrl);
  };

  const propId = property.id || property.propertyId || property._id;
  const baseUrl = import.meta.env.VITE_PUBLIC_SHARE_URL || import.meta.env.VITE_PUBLIC_VIEWER_URL || window.location.origin;
  const shareLink = `${baseUrl}/p/${encodeId(propId)}`;

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
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Send on WhatsApp</span>
          </button>
          <button
            onClick={handleCopyText}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Copied Details!' : 'Copy Details'}</span>
          </button>
        </div>
      }
    >
      {/* Customer-Facing Shared Details Preview */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
          Customer-Facing Details Preview
        </span>

        {primaryImage ? (
          <div className="relative h-44 w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-900">
            <img
              src={primaryImage}
              alt={property.title || 'Property Image'}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80';
              }}
            />
            {hasVideo && (
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1 shadow">
                <Video className="w-3 h-3 text-[#B0004F]" />
                <span>+ Video Tour</span>
              </div>
            )}
            {realImages.length > 1 && (
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold shadow">
                {realImages.length} Photos
              </div>
            )}
          </div>
        ) : hasVideo ? (
          <div className="h-44 w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-900 flex flex-col items-center justify-center text-white space-y-2">
            <Video className="w-8 h-8 text-[#B0004F]" />
            <span className="text-xs font-semibold">Video Tour Included</span>
          </div>
        ) : null}

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
          <a 
            href={shareLink}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-mono text-blue-600 hover:text-blue-800 hover:underline truncate flex-1 font-medium cursor-pointer"
          >
            {shareLink}
          </a>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(shareLink);
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
