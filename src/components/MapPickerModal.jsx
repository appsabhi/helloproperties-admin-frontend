import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, MapPin, Search } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon path issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { animate: true, duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

export default function MapPickerModal({ isOpen, onClose, onConfirm, initialCenter = [11.2587, 75.7804] }) {
  const [selectedPos, setSelectedPos] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [locationDetails, setLocationDetails] = useState(null);
  const [mapCenter, setMapCenter] = useState(initialCenter);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const searchWrapperRef = useRef(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setSelectedPos(null);
      setLocationDetails(null);
      setIsLoading(false);
      setSearchQuery('');
      setSuggestions([]);
      setIsDropdownOpen(false);
      setMapCenter(initialCenter);
    }
  }, [isOpen]);

  // Handle outside click for search dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time location search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const handler = setTimeout(async () => {
      setIsSearching(true);
      const q = searchQuery.trim();
      let results = [];

      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
          typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:5000/api'
            : 'https://helloproperties-admin-backend.vercel.app/api'
        );
        const token = localStorage.getItem('hp_auth_token') || localStorage.getItem('auth_token');
        const res = await fetch(`${API_BASE_URL}/locations/search?q=${encodeURIComponent(q)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include'
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            results = [...json.data];
          }
        }
      } catch (err) {
        console.error("Backend search error:", err);
      }

      // If backend has no results, fallback to Nominatim
      if (results.length === 0) {
        try {
          const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ', India')}&countrycodes=in&format=json&addressdetails=1&limit=6`);
          if (nomRes.ok) {
            const nomData = await nomRes.json();
            if (Array.isArray(nomData)) {
              for (const item of nomData) {
                const addr = item.address || {};
                const rawState = addr.state || 'Kerala';
                const displayName = item.display_name || '';
                const rawDistrict = addr.state_district || addr.county || addr.city || addr.district || addr.town || addr.suburb || '';
                const districtName = rawDistrict.replace(/district/i, '').trim();
                const name = item.name || (displayName ? displayName.split(',')[0].trim() : q);

                results.push({
                  locality: name,
                  district: districtName,
                  state: rawState,
                  latitude: parseFloat(item.lat),
                  longitude: parseFloat(item.lon)
                });
              }
            }
          }
        } catch (nomErr) {
          console.error("Nominatim search error:", nomErr);
        }
      }

      setSuggestions(results);
      setIsSearching(false);
      setIsDropdownOpen(true);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleSelectSuggestion = (item) => {
    setIsDropdownOpen(false);
    setSearchQuery(item.locality || '');

    const lat = parseFloat(item.latitude || item.lat);
    const lon = parseFloat(item.longitude || item.lon || item.lng);

    if (!isNaN(lat) && !isNaN(lon)) {
      setMapCenter([lat, lon]);
      setSelectedPos([lat, lon]);
      setLocationDetails({
        locality: item.locality || '',
        district: item.district || '',
        state: item.state || 'Kerala',
        latitude: lat,
        longitude: lon
      });
    }
  };

  const handleLocationSelect = async (lat, lng) => {
    setSelectedPos([lat, lng]);
    setIsLoading(true);
    setLocationDetails(null);

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`);
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const rawState = addr.state || 'Kerala';
        const rawDistrict = addr.state_district || addr.county || addr.city || addr.district || addr.town || addr.suburb || '';
        const districtName = rawDistrict.replace(/district/i, '').trim();
        const displayName = data.display_name || '';
        
        let locality = addr.neighbourhood || addr.suburb || addr.village || addr.town || addr.city || data.name || (displayName ? displayName.split(',')[0].trim() : '');
        
        setLocationDetails({
          locality,
          district: districtName,
          state: rawState,
          latitude: lat,
          longitude: lng
        });
        setSearchQuery(locality);
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (locationDetails) {
      onConfirm(locationDetails);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl flex flex-col overflow-hidden h-[85vh] sm:h-[80vh] relative">
        
        <div className="px-5 py-4 border-b flex justify-between items-center bg-slate-50 shrink-0">
          <div>
            <h2 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#B0004F]" /> Search & Select Location
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">Search for a location or click anywhere on the map.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 relative">
          <MapContainer center={initialCenter} zoom={7} className="w-full h-full z-0">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onLocationSelect={handleLocationSelect} />
            <MapController center={mapCenter} />
            {selectedPos && <Marker position={selectedPos} />}
          </MapContainer>

          {/* Search Bar Overlay */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-11/12 sm:w-[400px] z-[1000]" ref={searchWrapperRef}>
            <div className="relative shadow-lg rounded-xl overflow-hidden bg-white">
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#B0004F] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              ) : (
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              )}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => { if (searchQuery.trim().length >= 2) setIsDropdownOpen(true); }}
                placeholder="Search location (e.g. Kottaram Road, Mavoor Road)..."
                className="w-full pl-11 pr-4 py-3.5 text-[13px] text-slate-800 bg-white border-none focus:outline-none focus:ring-2 focus:ring-[#B0004F]/20"
              />
            </div>

            {/* Suggestions Dropdown */}
            {isDropdownOpen && suggestions.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto z-[1000]">
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 border-b last:border-b-0 border-slate-50 transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-[#B0004F] flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[13px] font-semibold text-slate-800 leading-tight mb-1">{item.locality}</div>
                      <div className="text-[11px] text-slate-400">{item.district}{item.district && item.state ? ', ' : ''}{item.state}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-[1000]">
              <Loader2 className="w-4 h-4 animate-spin text-[#B0004F]" />
              <span className="text-[12px] font-medium text-slate-700">Identifying location...</span>
            </div>
          )}

          {/* Confirmation Overlay */}
          {locationDetails && !isLoading && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white p-4 rounded-xl shadow-xl border border-slate-100 w-11/12 sm:w-[400px] z-[1000] transition-all">
              <h3 className="text-[14px] font-bold text-slate-800 mb-1">{locationDetails.locality || 'Unknown Area'}</h3>
              <p className="text-[12px] text-slate-500 mb-4">
                {locationDetails.district}{locationDetails.district && locationDetails.state ? ', ' : ''}{locationDetails.state}
              </p>
              <button 
                onClick={handleConfirm}
                className="w-full py-3 bg-[#B0004F] text-white text-[13px] font-bold rounded-lg hover:bg-[#8e003f] transition-all shadow-md active:scale-[0.98]"
              >
                Confirm this Location
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
