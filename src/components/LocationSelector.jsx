import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, ChevronDown, Loader2, Compass, CheckCircle2, X } from 'lucide-react';
import { ALL_INDIAN_STATES, getDistrictsForState, INDIA_LOCATION_DATA } from '../data/indiaLocationData';
import MapPickerModal from './MapPickerModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : 'https://helloproperties-admin-backend.vercel.app/api'
);

// Client-side fallback dictionary for instant offline lookup & common localities
const CLIENT_LOCATION_LOOKUP = {
  // Kozhikode District
  'engapuzha': { district: 'Kozhikode', state: 'Kerala' },
  'kodencherry': { district: 'Kozhikode', state: 'Kerala' },
  'kunnamangalam': { district: 'Kozhikode', state: 'Kerala' },
  'palazhi': { district: 'Kozhikode', state: 'Kerala' },
  'palazhy': { district: 'Kozhikode', state: 'Kerala' },
  'thondayad bypass': { district: 'Kozhikode', state: 'Kerala' },
  'hilite mall': { district: 'Kozhikode', state: 'Kerala' },
  'mukkam': { district: 'Kozhikode', state: 'Kerala' },
  'mavoor': { district: 'Kozhikode', state: 'Kerala' },
  'thondayad': { district: 'Kozhikode', state: 'Kerala' },
  'thondayadu': { district: 'Kozhikode', state: 'Kerala' },
  'palayam': { district: 'Kozhikode', state: 'Kerala' },
  'feroke': { district: 'Kozhikode', state: 'Kerala' },
  'ramanattukara': { district: 'Kozhikode', state: 'Kerala' },
  'elathur': { district: 'Kozhikode', state: 'Kerala' },
  'pantheeramkavu': { district: 'Kozhikode', state: 'Kerala' },
  'balussery': { district: 'Kozhikode', state: 'Kerala' },
  'koyilandy': { district: 'Kozhikode', state: 'Kerala' },
  'vadakara': { district: 'Kozhikode', state: 'Kerala' },
  'beypore': { district: 'Kozhikode', state: 'Kerala' },
  'medical college': { district: 'Kozhikode', state: 'Kerala' },
  'chevayur': { district: 'Kozhikode', state: 'Kerala' },
  'west hill': { district: 'Kozhikode', state: 'Kerala' },
  'mankavu': { district: 'Kozhikode', state: 'Kerala' },
  'calicut': { district: 'Kozhikode', state: 'Kerala' },
  'kozhikode': { district: 'Kozhikode', state: 'Kerala' },

  // Palakkad District
  'kanjikode': { district: 'Palakkad', state: 'Kerala' },
  'ottapalam': { district: 'Palakkad', state: 'Kerala' },
  'cherpulassery': { district: 'Palakkad', state: 'Kerala' },
  'pattambi': { district: 'Palakkad', state: 'Kerala' },
  'chittur': { district: 'Palakkad', state: 'Kerala' },
  'mannarkkad': { district: 'Palakkad', state: 'Kerala' },
  'alathur': { district: 'Palakkad', state: 'Kerala' },
  'nemmara': { district: 'Palakkad', state: 'Kerala' },
  'stadium bye pass': { district: 'Palakkad', state: 'Kerala' },
  'pudussery': { district: 'Palakkad', state: 'Kerala' },
  'walayar': { district: 'Palakkad', state: 'Kerala' },
  'palakkad': { district: 'Palakkad', state: 'Kerala' },

  // Malappuram District
  'manjeri': { district: 'Malappuram', state: 'Kerala' },
  'perinthalmanna': { district: 'Malappuram', state: 'Kerala' },
  'tirur': { district: 'Malappuram', state: 'Kerala' },
  'ponnani': { district: 'Malappuram', state: 'Kerala' },
  'kottakkal': { district: 'Malappuram', state: 'Kerala' },
  'nilambur': { district: 'Malappuram', state: 'Kerala' },
  'kondotty': { district: 'Malappuram', state: 'Kerala' },
  'malappuram': { district: 'Malappuram', state: 'Kerala' },
  'changaramkulam': { district: 'Malappuram', state: 'Kerala' },
  'valanchery': { district: 'Malappuram', state: 'Kerala' },

  // Ernakulam District
  'kakkanad': { district: 'Ernakulam', state: 'Kerala' },
  'edappally': { district: 'Ernakulam', state: 'Kerala' },
  'aluva': { district: 'Ernakulam', state: 'Kerala' },
  'vyttila': { district: 'Ernakulam', state: 'Kerala' },
  'kalamassery': { district: 'Ernakulam', state: 'Kerala' },
  'fort kochi': { district: 'Ernakulam', state: 'Kerala' },
  'tripunithura': { district: 'Ernakulam', state: 'Kerala' },
  'palarivattom': { district: 'Ernakulam', state: 'Kerala' },
  'marine drive': { district: 'Ernakulam', state: 'Kerala' },
  'mg road': { district: 'Ernakulam', state: 'Kerala' },
  'kadavanthra': { district: 'Ernakulam', state: 'Kerala' },
  'kochi': { district: 'Ernakulam', state: 'Kerala' },
  'cochin': { district: 'Ernakulam', state: 'Kerala' },

  // Thrissur District
  'swaraj round': { district: 'Thrissur', state: 'Kerala' },
  'puzhakkal': { district: 'Thrissur', state: 'Kerala' },
  'guruvayur': { district: 'Thrissur', state: 'Kerala' },
  'chalakudy': { district: 'Thrissur', state: 'Kerala' },
  'kodungallur': { district: 'Thrissur', state: 'Kerala' },
  'irinjalakuda': { district: 'Thrissur', state: 'Kerala' },
  'mannuthy': { district: 'Thrissur', state: 'Kerala' },
  'trichur': { district: 'Thrissur', state: 'Kerala' },

  // Thiruvananthapuram District
  'kowdiar': { district: 'Thiruvananthapuram', state: 'Kerala' },
  'technopark': { district: 'Thiruvananthapuram', state: 'Kerala' },
  'kazhakkoottam': { district: 'Thiruvananthapuram', state: 'Kerala' },
  'vellayambalam': { district: 'Thiruvananthapuram', state: 'Kerala' },
  'pattom': { district: 'Thiruvananthapuram', state: 'Kerala' },
  'east fort': { district: 'Thiruvananthapuram', state: 'Kerala' },
  'sasthamangalam': { district: 'Thiruvananthapuram', state: 'Kerala' },
  'poojappura': { district: 'Thiruvananthapuram', state: 'Kerala' },
  'neyyattinkara': { district: 'Thiruvananthapuram', state: 'Kerala' },
  'trivandrum': { district: 'Thiruvananthapuram', state: 'Kerala' },

  // Wayanad District
  'kalpetta': { district: 'Wayanad', state: 'Kerala' },
  'sulthan bathery': { district: 'Wayanad', state: 'Kerala' },
  'mananthavady': { district: 'Wayanad', state: 'Kerala' },
  'meppadi': { district: 'Wayanad', state: 'Kerala' },
  'vythiri': { district: 'Wayanad', state: 'Kerala' },

  // Kottayam District
  'kottayam': { district: 'Kottayam', state: 'Kerala' },
  'changanassery': { district: 'Kottayam', state: 'Kerala' },
  'pala': { district: 'Kottayam', state: 'Kerala' },
  'kanjirappally': { district: 'Kottayam', state: 'Kerala' },
  'ettumanoor': { district: 'Kottayam', state: 'Kerala' },

  // Kannur District
  'kannur': { district: 'Kannur', state: 'Kerala' },
  'thalassery': { district: 'Kannur', state: 'Kerala' },
  'payyanur': { district: 'Kannur', state: 'Kerala' },
  'mattannur': { district: 'Kannur', state: 'Kerala' },
  'taliparamba': { district: 'Kannur', state: 'Kerala' },

  // Other Major Cities
  'velachery': { district: 'Chennai', state: 'Tamil Nadu' },
  'anna nagar': { district: 'Chennai', state: 'Tamil Nadu' },
  'whitefield': { district: 'Bengaluru Urban', state: 'Karnataka' },
  'koramangala': { district: 'Bengaluru Urban', state: 'Karnataka' },
  'indiranagar': { district: 'Bengaluru Urban', state: 'Karnataka' },
  'gachibowli': { district: 'Hyderabad', state: 'Telangana' },
  'bandra': { district: 'Mumbai City', state: 'Maharashtra' },
  'andheri': { district: 'Mumbai Suburban', state: 'Maharashtra' }
};

export default function LocationSelector({
  formData = {},
  onChange,
  errors = {},
  locationFieldName = 'location', // 'location' for Property, 'preferredLocation' for Requirement
  allowMultiple = false,
  isEdit = false
}) {
  const locationValue = formData[locationFieldName] || '';
  const districtValue = formData.district || '';
  const stateValue = formData.state || 'Kerala';

  const [query, setQuery] = useState(allowMultiple ? '' : locationValue);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [availableDistricts, setAvailableDistricts] = useState([]);

  const wrapperRef = useRef(null);

  // Sync internal query when prop changes externally
  useEffect(() => {
    if (!allowMultiple) {
      setQuery(formData[locationFieldName] || '');
    }
  }, [formData[locationFieldName], allowMultiple]);

  // Sync district options based on current State
  useEffect(() => {
    const districts = getDistrictsForState(stateValue || 'Kerala');
    setAvailableDistricts(districts);
  }, [stateValue]);

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live Location Search (Backend API + Instant Client-side Lookup + OpenStreetMap Fallback)
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const handler = setTimeout(async () => {
      setIsLoading(true);
      const q = query.trim().toLowerCase();
      const normQ = q.replace(/[^a-z0-9]/g, '');
      let fetchedMatches = [];

      // 1. Check instant client-side lookup dictionary first
      const localMatches = [];
      for (const [key, info] of Object.entries(CLIENT_LOCATION_LOOKUP)) {
        const normKey = key.replace(/[^a-z0-9]/g, '');
        if (normKey.includes(normQ) || normQ.includes(normKey)) {
          const formattedLocality = key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          localMatches.push({
            locality: formattedLocality,
            district: info.district,
            state: info.state
          });
        }
      }

      // 2. Query backend API if available
      try {
        const token = localStorage.getItem('hp_auth_token') || localStorage.getItem('auth_token');
        const res = await fetch(`${API_BASE_URL}/locations/search?q=${encodeURIComponent(q)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include'
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            fetchedMatches = json.data;
          }
        }
      } catch (err) {
        // API fallback
      }

      // Combine matches (prioritizing API and local matches)
      const combinedMap = new Map();
      [...fetchedMatches, ...localMatches].forEach(item => {
        const key = `${(item.locality || '').toLowerCase()}_${(item.district || '').toLowerCase()}`;
        if (!combinedMap.has(key)) {
          combinedMap.set(key, item);
        }
      });
      let results = Array.from(combinedMap.values());

      setSuggestions(results);
      setIsLoading(false);
      setIsOpen(true);
    }, 200);

    return () => clearTimeout(handler);
  }, [query, stateValue, districtValue]);

  // Select a suggestion -> Auto-fill Locality, District, State & Coords
  const handleSelectSuggestion = (item) => {
    const selectedLocality = item.locality || query;
    const selectedDistrict = item.district || districtValue;
    const selectedState = item.state || stateValue || 'Kerala';
    const lat = item.latitude || null;
    const lon = item.longitude || null;

    if (allowMultiple) {
      const currentLocs = formData[locationFieldName] ? String(formData[locationFieldName]).split(',').map(s => s.trim()).filter(Boolean) : [];
      const currentCoords = Array.isArray(formData.preferred_coordinates) ? [...formData.preferred_coordinates] : [];
      
      if (!currentLocs.includes(selectedLocality)) {
        currentLocs.push(selectedLocality);
        currentCoords.push({
           locality: selectedLocality,
           district: selectedDistrict,
           state: selectedState,
           latitude: lat,
           longitude: lon
        });
      }
      onChange({
        [locationFieldName]: currentLocs.join(', '),
        preferred_coordinates: currentCoords,
        district: selectedDistrict,
        state: selectedState
      });
      setQuery('');
      setIsOpen(false);
    } else {
      setQuery(selectedLocality);
      setIsOpen(false);
      onChange({
        [locationFieldName]: selectedLocality,
        district: selectedDistrict,
        state: selectedState,
        latitude: lat,
        longitude: lon
      });
    }
  };

  const handleMapConfirm = (details) => {
    handleSelectSuggestion(details);
    setIsMapModalOpen(false);
  };

  // State Change handler -> Update districts list & reset district if invalid
  const handleStateChange = (e) => {
    const newState = e.target.value;
    const districts = getDistrictsForState(newState);
    setAvailableDistricts(districts);

    onChange({
      state: newState,
      district: districts.includes(districtValue) ? districtValue : (districts[0] || '')
    });
  };

  // District Change handler -> Auto-detect State if empty
  const handleDistrictChange = (e) => {
    const selectedDistrict = e.target.value;
    let detectedState = stateValue;

    if (selectedDistrict && (!detectedState || !getDistrictsForState(detectedState).includes(selectedDistrict))) {
      for (const [st, distList] of Object.entries(INDIA_LOCATION_DATA)) {
        if (distList.includes(selectedDistrict)) {
          detectedState = st;
          break;
        }
      }
    }

    onChange({
      district: selectedDistrict,
      ...(detectedState ? { state: detectedState } : {})
    });
  };

  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Keyboard navigation handler
  const handleKeyDown = (e) => {
    if (!isOpen || (suggestions.length === 0 && !query.trim())) return;

    const totalOptions = suggestions.length + 1; // suggestions + custom location button

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % totalOptions);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + totalOptions) % totalOptions);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[highlightedIndex]);
      } else if (highlightedIndex === suggestions.length) {
        setIsMapModalOpen(true);
      } else if (suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0]);
      } else {
        setIsMapModalOpen(true);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const locationError = errors[locationFieldName];
  const districtError = errors.district;
  const stateError = errors.state;

  return (
    <div className="sm:col-span-2 space-y-4 pt-1">
      {/* Section header — matches SchemaForm style */}
      <div className="flex items-center gap-3 mt-2 mb-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#B0004F]/50 whitespace-nowrap">Location</span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>

      {/* Locality autocomplete — floating label (TOP) */}
      <div className="relative" ref={wrapperRef}>
        {allowMultiple && formData[locationFieldName] && (
          <div className="flex flex-wrap gap-2 mb-2">
            {String(formData[locationFieldName]).split(',').map(s => s.trim()).filter(Boolean).map((loc, idx) => (
              <span key={idx} className="flex items-center gap-1.5 bg-[#FFF1F6] text-[#B0004F] px-3 py-1.5 rounded-full text-[12px] font-semibold border border-[#B0004F]/20 shadow-sm">
                {loc}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentLocs = String(formData[locationFieldName]).split(',').map(s => s.trim()).filter(Boolean);
                    const newLocs = currentLocs.filter(l => l !== loc);
                    const currentCoords = Array.isArray(formData.preferred_coordinates) ? [...formData.preferred_coordinates] : [];
                    const newCoords = currentCoords.filter(c => c.locality !== loc);
                    onChange({ [locationFieldName]: newLocs.join(', '), preferred_coordinates: newCoords });
                  }}
                  className="hover:bg-[#B0004F]/20 rounded-full p-0.5 transition-colors cursor-pointer text-[#B0004F]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="relative">
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B0004F] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
          ) : (
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
          )}
          <input
            type="text"
            id="location-input"
            value={query}
            readOnly
            onClick={(e) => {
              e.preventDefault();
              setIsMapModalOpen(true);
            }}
            onFocus={(e) => {
              e.preventDefault();
              setIsMapModalOpen(true);
            }}
            placeholder=" "
            className={`w-full pl-10 pr-4 pt-6 pb-2 rounded-xl text-[13.5px] text-slate-800 bg-[#F4F4F6] border-b focus:outline-none transition-colors duration-150 peer cursor-pointer ${
              locationError
                ? "border-red-400"
                : "border-transparent focus:border-slate-300"
            }`}
          />
          <label
            htmlFor="location-input"
            className="absolute left-10 top-4 text-[13px] text-slate-400 pointer-events-none transition-all duration-200
              peer-placeholder-shown:top-4 peer-placeholder-shown:text-[13px] peer-placeholder-shown:text-slate-400
              peer-focus:top-2 peer-focus:text-[10.5px] peer-focus:text-[#B0004F] peer-focus:font-semibold
              peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[10.5px] peer-[:not(:placeholder-shown)]:text-slate-400 peer-[:not(:placeholder-shown)]:font-semibold"
          >
            {locationFieldName === "preferredLocation" ? "Preferred Locality / Area" : "Property Locality / Area"}<span className="text-[#B0004F] ml-0.5">*</span>
          </label>
        </div>

        {locationError && (
          <span className="text-[11px] text-red-500 px-1 mt-0.5 block">{locationError}</span>
        )}

        {/* Suggestions dropdown */}
        {isOpen && query.trim().length >= 2 && (
          <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 max-h-52 overflow-y-auto">
            {suggestions.length > 0 ? (
              suggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 cursor-pointer transition-colors ${
                    highlightedIndex === idx ? "bg-[#FFF1F6]" : "hover:bg-slate-50"
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-[#B0004F] flex-shrink-0" />
                  <div>
                    <div className="text-[13px] font-medium text-slate-800">{item.locality || query}</div>
                    <div className="text-[11px] text-slate-400">{item.district} · {item.state}</div>
                  </div>
                </button>
              ))
            ) : !isLoading ? (
              <div className="px-4 py-3 text-[12px] text-slate-400 text-center">
                No automatic suggestions. Select State &amp; District below.
              </div>
            ) : null}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setIsMapModalOpen(true);
              }}
              onClick={(e) => {
                e.preventDefault();
                setIsMapModalOpen(true);
              }}
              onMouseEnter={() => setHighlightedIndex(suggestions.length)}
              className={`w-full text-left px-4 py-3 text-[12px] text-[#B0004F] font-medium flex items-center gap-2 border-t border-slate-100 cursor-pointer transition-colors ${
                highlightedIndex === suggestions.length ? "bg-[#FFF1F6]" : "hover:bg-slate-50"
              }`}
            >
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span>Select Location on Map</span>
            </button>
          </div>
        )}
      </div>

      {/* State & District — two columns below Locality */}
      {!(allowMultiple && formData[locationFieldName] && String(formData[locationFieldName]).trim().length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Column 1: State */}
          <div className="flex flex-col gap-1">
            <div className="relative">
            <select
              id="state-select"
              value={stateValue}
              onChange={handleStateChange}
              className={`w-full px-4 pt-6 pb-2 rounded-xl text-[13.5px] text-slate-800 bg-[#F4F4F6] border-b appearance-none pr-9 focus:outline-none transition-colors duration-150 cursor-pointer ${
                stateError ? "border-red-400" : "border-transparent focus:border-slate-300"
              }`}
            >
              <option value=""></option>
              {ALL_INDIAN_STATES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
            <label
              htmlFor="state-select"
              className={`absolute left-4 pointer-events-none transition-all duration-200 ${
                stateValue
                  ? "top-2 text-[10.5px] text-slate-400 font-semibold"
                  : "top-4 text-[13px] text-slate-400"
              }`}
            >
              State / UT<span className="text-[#B0004F] ml-0.5">*</span>
            </label>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          {stateError && <span className="text-[11px] text-red-500 px-1">{stateError}</span>}
        </div>

        {/* Column 2: District */}
        <div className="flex flex-col gap-1">
          <div className="relative">
            <select
              id="district-select"
              value={districtValue}
              onChange={handleDistrictChange}
              className={`w-full px-4 pt-6 pb-2 rounded-xl text-[13.5px] text-slate-800 bg-[#F4F4F6] border-b appearance-none pr-9 focus:outline-none transition-colors duration-150 cursor-pointer ${
                districtError ? "border-red-400" : "border-transparent focus:border-slate-300"
              }`}
            >
              <option value=""></option>
              {availableDistricts.map((dst) => (
                <option key={dst} value={dst}>{dst}</option>
              ))}
            </select>
            <label
              htmlFor="district-select"
              className={`absolute left-4 pointer-events-none transition-all duration-200 ${
                districtValue
                  ? "top-2 text-[10.5px] text-slate-400 font-semibold"
                  : "top-4 text-[13px] text-slate-400"
              }`}
            >
              District<span className="text-[#B0004F] ml-0.5">*</span>
            </label>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          {districtError && <span className="text-[11px] text-red-500 px-1">{districtError}</span>}
        </div>
      </div>
      )}
      
      <MapPickerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        onConfirm={handleMapConfirm}
      />
     
    </div>
  );
}
