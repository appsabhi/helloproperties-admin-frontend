import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { PropertyContext } from '../context/PropertyContext';
import logo from '../assets/HELLO PROPERTIES LOGO.png';
import { 
  Building2, 
  MapPin, 
  Phone, 
  MessageCircle, 
  Share2, 
  Check, 
  Sparkles,
  ShieldCheck,
  Video,
  Play
} from 'lucide-react';

function formatPrice(value, listingType = 'Sale', unit = '') {
  const num = Number(value || 0);
  if (isNaN(num) || num <= 0) return 'Price on Call';

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);

  if (unit && unit !== 'All Properties') {
    return `${formatted} ${unit}`;
  }

  if (listingType === 'Rent') {
    return `${formatted} / Month`;
  }
  return formatted;
}

function formatArea(areaStr) {
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

export default function PublicPropertyDetail() {
  const { id } = useParams();
  const { properties } = useContext(PropertyContext);
  
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setLoading(true);
    const decodeId = (hex) => {
      try {
        return decodeURIComponent('%' + hex.match(/.{1,2}/g).join('%'));
      } catch (e) {
        return hex; // fallback if it's not a valid hex string (e.g. old plain ID)
      }
    };

    let decodedId = id;
    try {
      decodedId = decodeId(id);
    } catch (e) {
      decodedId = id;
    }

    // 1. Check local context properties
    const found = properties.find(p => 
      String(p.id) === String(decodedId) || 
      String(p.propertyId) === String(decodedId) || 
      String(p._id) === String(decodedId)
    );

    if (found) {
      setProperty(found);
      setLoading(false);
    } else {
      // 2. Fetch directly from backend public endpoint
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
        typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ? 'http://localhost:5000/api'
          : 'https://helloproperties-admin-backend.vercel.app/api'
      );

      fetch(`${API_BASE_URL}/properties/${decodedId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.property) {
            setProperty(data.property);
          }
        })
        .catch(err => console.warn('Public property fetch error:', err))
        .finally(() => setLoading(false));
    }
  }, [id, properties]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleWhatsAppInquiry = () => {
    if (!property) return;
    const isRent = property.listingType === 'Rent';
    const priceText = isRent ? formatPrice(property.monthlyRent, 'Rent', property.monthlyRentUnit) : formatPrice(property.expectedPrice, 'Sale', property.expectedPriceUnit);
    
    const text = `Hello HelloProperties! 👋\n\nI am interested in this property listing:\n\n🏡 *${property.title || property.propertyType || 'Property Listing'}*\n📍 Location: ${property.location || ''}, ${property.district || 'Kerala'}\n📐 Area: ${formatArea(property.area)}\n💰 Price: ${priceText}\n\n🔗 Link: ${window.location.href}\n\nPlease share more details and arrange a site visit. Thank you!`;
    
    const encoded = encodeURIComponent(text);
    const whatsappUrl = `https://web.whatsapp.com/send?phone=919876543210&text=${encoded}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-slate-700">
        <div className="w-10 h-10 border-3 border-[#B0004F] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-semibold">Loading Property Details...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-[#B0004F] flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Property Listing Not Found</h2>
          <p className="text-xs text-slate-500">This property listing may have been removed or updated by HelloProperties.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-5 py-2.5 bg-[#B0004F] text-white font-bold text-xs rounded-xl hover:bg-[#8A003E] transition-all cursor-pointer"
          >
            Go to HelloProperties Home
          </button>
        </div>
      </div>
    );
  }

  const isRent = property.listingType === 'Rent';
  const priceDisplay = isRent
    ? formatPrice(property.monthlyRent, 'Rent', property.monthlyRentUnit)
    : formatPrice(property.expectedPrice, 'Sale', property.expectedPriceUnit);

  const imageUrl = (!imageError && property.imageUrl && typeof property.imageUrl === 'string' && !property.imageUrl.startsWith('blob:'))
    ? property.imageUrl
    : 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80';

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 antialiased selection:bg-[#B0004F] selection:text-white py-6 sm:py-10">
      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* Main Property Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden animate-fade-in">
          {/* Hero Image */}
          <div className="relative h-64 sm:h-96 w-full bg-slate-900 overflow-hidden">
            <img
              src={imageUrl}
              alt={property.title || 'Property Image'}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
            
            {/* Listing Type & Status Badges */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md ${
                isRent 
                  ? 'bg-violet-600 text-white' 
                  : 'bg-emerald-600 text-white'
              }`}>
                For {property.listingType || 'Sale'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur-xs text-slate-800 shadow-md">
                {property.propertyType || 'Plot/Land'}
              </span>
              {property.status && property.status !== 'Available' && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md ${
                  property.status === 'Under Negotiation' ? 'bg-amber-500 text-white' :
                  property.status === 'Sold' ? 'bg-slate-700 text-white' :
                  'bg-red-600 text-white'
                }`}>
                  {property.status}
                </span>
              )}
            </div>

            {/* Title & Location overlay on bottom of image */}
            <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
              <h2 className="text-xl sm:text-2xl font-extrabold drop-shadow-md">
                {property.title || `${property.propertyType} in ${property.district || 'Kerala'}`}
              </h2>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-200 font-medium">
                <MapPin className="w-4 h-4 text-[#E0006C] shrink-0" />
                <span>{property.location ? `${property.location}, ` : ''}{property.district || 'Kerala'}</span>
              </div>
            </div>
          </div>

          {/* Price & Primary Highlights Bar */}
          <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                {isRent ? 'Monthly Rent' : 'Asking Price'}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-[#B0004F] tracking-tight mt-0.5">
                {priceDisplay}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleWhatsAppInquiry}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Inquire on WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Product Specifications Grid */}
          <div className="p-6 space-y-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Sparkles className="w-4 h-4 text-[#B0004F]" />
              Property Specifications
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">District</span>
                <span className="text-sm sm:text-base font-extrabold text-slate-800 mt-1 block">{property.district || '—'}</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Locality / Town</span>
                <span className="text-sm sm:text-base font-extrabold text-slate-800 mt-1 block">{property.location || '—'}</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Property Type</span>
                <span className="text-sm sm:text-base font-extrabold text-slate-800 mt-1 block">{property.propertyType || '—'}</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Total Area / Size</span>
                <span className="text-sm sm:text-base font-extrabold text-[#B0004F] mt-1 block">{formatArea(property.area)}</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Listing Type</span>
                <span className="text-sm sm:text-base font-extrabold text-slate-800 mt-1 block">{property.listingType || 'Sale'}</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Verified Status</span>
                <span className="text-xs sm:text-sm font-extrabold text-emerald-700 mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 inline" /> Verified Property
                </span>
              </div>
            </div>

            {/* Description Section */}
            {property.description && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Property Description & Details</h4>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {property.description}
                </div>
              </div>
            )}

            {/* Property Video Tour Section */}
            {(property.video || property.videoUrl) && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-[#B0004F]" />
                  <span>Property Video Tour</span>
                </h4>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 shadow-md overflow-hidden">
                  {typeof (property.video || property.videoUrl) === 'string' && (property.video || property.videoUrl).includes('youtu') ? (
                    <iframe
                      src={(property.video || property.videoUrl).replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                      title="Property Video"
                      className="w-full h-64 sm:h-80 rounded-xl border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={typeof (property.video || property.videoUrl) === 'string' ? (property.video || property.videoUrl) : URL.createObjectURL(property.video || property.videoUrl)}
                      controls
                      className="w-full h-64 sm:h-80 rounded-xl object-cover"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* HelloProperties Official Contact Footer Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="font-bold text-base">Interested in this property?</h4>
              <p className="text-xs text-slate-300">Contact HelloProperties directly for verified site visits, document checks & deal closure.</p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={handleWhatsAppInquiry}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>WhatsApp</span>
              </button>
              <a
                href="tel:+919876543210"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#B0004F] hover:bg-[#C4005A] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Call Us</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-xs text-slate-400 font-medium">
          © {new Date().getFullYear()} HelloProperties Real Estate Portal. All rights reserved.
        </div>
      </main>
    </div>
  );
}
