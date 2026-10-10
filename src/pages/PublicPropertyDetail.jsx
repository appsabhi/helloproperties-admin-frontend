import React, { useState, useEffect, useContext, useMemo } from 'react';
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
  Play,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Image as ImageIcon
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

function parseMediaList(raw) {
  if (!raw) return [];
  let items = [];
  if (Array.isArray(raw)) {
    items = raw;
  } else if (typeof raw === 'string') {
    items = raw.split(',').map(s => s.trim()).filter(Boolean);
  }
  const backendBase = (import.meta.env.VITE_API_BASE_URL || 'https://helloproperties-backend.vercel.app/api').replace(/\/api$/, '');

  return items
    .filter(u => typeof u === 'string' && !u.startsWith('blob:') && u !== 'null' && u !== 'undefined' && u !== '')
    .map(u => {
      if (u.startsWith('/uploads/')) {
        return `${backendBase}${u}`;
      }
      return u;
    });
}

const isRealImage = (url) => {
  return url && typeof url === 'string' && !url.includes('images.unsplash.com');
};

export default function PublicPropertyDetail() {
  const { id } = useParams();
  const { properties, isApiLoading } = useContext(PropertyContext);
  
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Gallery & Media State
  const [activeMediaType, setActiveMediaType] = useState('image'); // 'image' | 'video'
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

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
      (String(p.id) === String(decodedId) || 
      String(p.propertyId) === String(decodedId) || 
      String(p._id) === String(decodedId)) &&
      p.status !== 'Inactive'
    );

    if (found) {
      setProperty(found);
      setLoading(false);
    } else {
      if (isApiLoading) {
        // Wait for PropertyContext to finish its initial data fetch
        return;
      }
      
      const timer = setTimeout(() => {
        // 2. Fetch directly from backend public endpoint
        let baseUrl = 'https://helloproperties-backend.vercel.app/api';
        if (typeof window !== 'undefined') {
          const hostname = window.location.hostname;
          if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
            baseUrl = `http://${hostname}:5000/api`;
          }
        }
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || baseUrl;

        fetch(`${API_BASE_URL}/properties/${decodedId}`)
          .then(res => res.json())
          .then(data => {
            const propData = data.property || data.data || data;
            if ((data.success || propData) && propData && propData.status !== 'Inactive') {
              setProperty(propData);
            }
          })
          .catch(err => console.warn('Public property fetch error:', err))
          .finally(() => setLoading(false));
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [id, properties, isApiLoading]);

  // Media Parsing
  const allImages = useMemo(() => parseMediaList(property?.imageUrl || property?.image_url || property?.images), [property]);
  const realImages = useMemo(() => allImages.filter(isRealImage), [allImages]);
  const displayImages = useMemo(() => {
    if (realImages.length > 0) return realImages;
    if (allImages.length > 0) return allImages;
    return ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80'];
  }, [realImages, allImages]);

  const allVideos = useMemo(() => parseMediaList(property?.videoUrl || property?.video || property?.video_url), [property]);

  // Set default media type when property loads:
  // If property has videos and no real custom photos, default to video
  useEffect(() => {
    if (property) {
      if (realImages.length === 0 && allVideos.length > 0) {
        setActiveMediaType('video');
        setActiveMediaIndex(0);
      } else {
        setActiveMediaType('image');
        setActiveMediaIndex(0);
      }
    }
  }, [property, realImages.length, allVideos.length]);

  // Lightbox Keyboard Navigation
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowRight') {
        setActiveMediaIndex((prev) => (prev + 1) % displayImages.length);
      }
      if (e.key === 'ArrowLeft') {
        setActiveMediaIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, displayImages.length]);

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
    const whatsappUrl = `https://web.whatsapp.com/send?phone=917907898072&text=${encoded}`;
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white p-8 rounded-2xl border border-slate-200/90 shadow-xl max-w-md w-full text-center space-y-4">
          <img src={logo} alt="HelloProperties Logo" className="h-10 mx-auto object-contain" />
          <h2 className="text-lg font-bold text-slate-900">Property Listing Not Found</h2>
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

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 antialiased selection:bg-[#B0004F] selection:text-white py-6 sm:py-10">
      {/* Lightbox Fullscreen Image Viewer Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center animate-fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between text-white z-20 bg-gradient-to-b from-black/80 to-transparent">
            <span className="text-xs sm:text-sm font-semibold tracking-wide">
              {property.title || 'Property Photos'} ({activeMediaIndex + 1} / {displayImages.length})
            </span>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Close Fullscreen"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Fullscreen Image */}
          <div 
            className="relative max-w-6xl max-h-[85vh] w-full p-4 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={displayImages[activeMediaIndex]}
              alt="Property Fullscreen View"
              className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl select-none"
            />

            {displayImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMediaIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
                  }}
                  className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-lg"
                  title="Previous Image"
                >
                  <ChevronLeft className="w-7 h-7" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMediaIndex((prev) => (prev + 1) % displayImages.length);
                  }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-lg"
                  title="Next Image"
                >
                  <ChevronRight className="w-7 h-7" />
                </button>
              </>
            )}
          </div>

          {/* Lightbox Bottom Thumbnail Strip */}
          {displayImages.length > 1 && (
            <div 
              className="absolute bottom-4 left-0 right-0 px-4 flex items-center justify-center gap-2 overflow-x-auto z-20"
              onClick={(e) => e.stopPropagation()}
            >
              {displayImages.map((imgUrl, idx) => (
                <button
                  key={`lightbox-thumb-${idx}`}
                  type="button"
                  onClick={() => setActiveMediaIndex(idx)}
                  className={`h-12 w-16 rounded-md overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    activeMediaIndex === idx ? 'border-[#B0004F] scale-110' : 'border-white/30 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* Main Property Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden animate-fade-in">
          
          {/* Hero Media Container */}
          <div className="relative w-full bg-slate-950 overflow-hidden group">
            {activeMediaType === 'image' ? (
              <div className="relative h-64 sm:h-[420px] w-full flex items-center justify-center bg-slate-950">
                <img
                  src={displayImages[activeMediaIndex] || displayImages[0]}
                  alt={property.title || 'Property Image'}
                  className="w-full h-full object-cover cursor-pointer select-none transition-transform duration-500 hover:scale-[1.02]"
                  onClick={() => setIsLightboxOpen(true)}
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent pointer-events-none" />

                {/* Prev / Next buttons for images if > 1 */}
                {displayImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMediaIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-xs transition-all shadow-lg cursor-pointer"
                      title="Previous Image"
                    >
                      <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMediaIndex((prev) => (prev + 1) % displayImages.length);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-xs transition-all shadow-lg cursor-pointer"
                      title="Next Image"
                    >
                      <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </>
                )}

                {/* Expand / Fullscreen button */}
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 shadow-md transition-all cursor-pointer z-10"
                  title="View Fullscreen"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Fullscreen</span>
                </button>
              </div>
            ) : (
              /* Video Hero Player */
              <div className="relative h-64 sm:h-[420px] w-full bg-slate-950 flex items-center justify-center">
                {(() => {
                  const currentVid = allVideos[activeMediaIndex] || allVideos[0];
                  if (!currentVid) return null;
                  if (currentVid.includes('youtu') || currentVid.includes('embed') || currentVid.includes('instagram.com')) {
                    const embedUrl = currentVid.includes('instagram.com')
                      ? (currentVid.split('?')[0].endsWith('/') ? currentVid.split('?')[0] + 'embed/' : currentVid.split('?')[0] + '/embed/')
                      : currentVid.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/');
                    return (
                      <iframe
                        src={embedUrl}
                        title="Property Video Tour"
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    );
                  }
                  return (
                    <video
                      src={currentVid}
                      controls
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain bg-black"
                    />
                  );
                })()}

                {/* Switcher if multiple videos */}
                {allVideos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActiveMediaIndex((prev) => (prev - 1 + allVideos.length) % allVideos.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-xs transition-all shadow-lg cursor-pointer"
                      title="Previous Video"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMediaIndex((prev) => (prev + 1) % allVideos.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-xs transition-all shadow-lg cursor-pointer"
                      title="Next Video"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Media Selector Switcher (Photos / Videos) */}
            {allVideos.length > 0 && realImages.length > 0 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center bg-black/70 backdrop-blur-md p-1 rounded-full border border-white/20 shadow-lg z-10">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMediaType('image');
                    setActiveMediaIndex(0);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeMediaType === 'image'
                      ? 'bg-[#B0004F] text-white shadow'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Photos ({displayImages.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMediaType('video');
                    setActiveMediaIndex(0);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeMediaType === 'video'
                      ? 'bg-[#B0004F] text-white shadow'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Videos ({allVideos.length})</span>
                </button>
              </div>
            )}

            {/* Status & Listing Badges */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10 pointer-events-none">
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

            {/* Title & Location Overlay */}
            <div className="absolute bottom-4 left-4 right-4 text-white space-y-1 pointer-events-none z-10">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold drop-shadow-md truncate">
                  {property.title || `${property.propertyType} in ${property.district || 'Kerala'}`}
                </h2>
                {activeMediaType === 'image' && displayImages.length > 1 && (
                  <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold shrink-0">
                    {activeMediaIndex + 1} / {displayImages.length}
                  </span>
                )}
                {activeMediaType === 'video' && allVideos.length > 1 && (
                  <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold shrink-0">
                    Video {activeMediaIndex + 1} / {allVideos.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-200 font-medium">
                <MapPin className="w-4 h-4 text-[#E0006C] shrink-0" />
                <span>{property.location ? `${property.location}, ` : ''}{property.district || 'Kerala'}</span>
              </div>
            </div>
          </div>

          {/* Media Thumbnails Strip */}
          {(displayImages.length > 1 || allVideos.length > 0) && (
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-thin">
              {/* Photo Thumbnails */}
              {displayImages.map((imgUrl, idx) => (
                <button
                  key={`thumb-img-${idx}`}
                  type="button"
                  onClick={() => {
                    setActiveMediaType('image');
                    setActiveMediaIndex(idx);
                  }}
                  className={`relative h-16 w-24 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    activeMediaType === 'image' && activeMediaIndex === idx
                      ? 'border-[#B0004F] ring-2 ring-[#B0004F]/50 scale-105'
                      : 'border-slate-700 opacity-60 hover:opacity-100 hover:border-slate-500'
                  }`}
                  title={`View photo ${idx + 1}`}
                >
                  <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}

              {/* Video Thumbnails */}
              {allVideos.map((vidUrl, idx) => (
                <button
                  key={`thumb-vid-${idx}`}
                  type="button"
                  onClick={() => {
                    setActiveMediaType('video');
                    setActiveMediaIndex(idx);
                  }}
                  className={`relative h-16 w-24 shrink-0 rounded-lg overflow-hidden border-2 bg-slate-950 flex items-center justify-center transition-all cursor-pointer ${
                    activeMediaType === 'video' && activeMediaIndex === idx
                      ? 'border-[#B0004F] ring-2 ring-[#B0004F]/50 scale-105'
                      : 'border-slate-700 opacity-70 hover:opacity-100 hover:border-slate-500'
                  }`}
                  title={`Watch video ${idx + 1}`}
                >
                  <div className="w-7 h-7 rounded-full bg-[#B0004F] text-white flex items-center justify-center shadow">
                    <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                  </div>
                  <span className="absolute bottom-1 right-1 px-1 bg-black/80 text-[9px] text-white rounded font-mono font-bold">
                    VIDEO
                  </span>
                </button>
              ))}
            </div>
          )}

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
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
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

            {/* Dedicated Property Video Tour Section */}
            {allVideos.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-[#B0004F]" />
                  <span>Property Video Tour{allVideos.length > 1 ? `s (${allVideos.length})` : ''}</span>
                </h4>
                <div className={`grid grid-cols-1 ${allVideos.length > 1 ? 'sm:grid-cols-2' : ''} gap-4`}>
                  {allVideos.map((vUrl, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 shadow-md overflow-hidden h-[360px] sm:h-[400px] w-full mx-auto flex items-center justify-center">
                      {vUrl.includes('youtu') || vUrl.includes('embed') || vUrl.includes('instagram.com') ? (
                        <iframe
                          src={vUrl.includes('instagram.com') ? (vUrl.split('?')[0].endsWith('/') ? vUrl.split('?')[0] + 'embed/' : vUrl.split('?')[0] + '/embed/') : vUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                          title={`Property Video Tour ${idx + 1}`}
                          className="w-full h-full rounded-xl border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          src={vUrl}
                          preload="metadata"
                          controls
                          playsInline
                          className="w-full h-full rounded-xl object-contain bg-black"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Share & Copy Link Quick Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#B0004F]" />
            <span>Share this exact property listing with friends or family</span>
          </div>
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Link Copied!' : 'Copy Property Link'}</span>
          </button>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 py-4">
          © {new Date().getFullYear()} HelloProperties. All rights reserved.
        </footer>
      </main>
    </div>
  );
}
