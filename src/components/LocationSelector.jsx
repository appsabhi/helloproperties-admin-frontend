import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, ChevronDown, Loader2, Compass, CheckCircle2 } from 'lucide-react';
import { ALL_INDIAN_STATES, getDistrictsForState, INDIA_LOCATION_DATA } from '../data/indiaLocationData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : 'https://helloproperties-admin-backend.vercel.app/api'
);

// Client-side fallback dictionary for instant offline lookup
const CLIENT_LOCATION_LOOKUP = {
  'thondayad': { district: 'Kozhikode', state: 'Kerala' },
  'thondayadu': { district: 'Kozhikode', state: 'Kerala' },
  'mavoor': { district: 'Kozhikode', state: 'Kerala' },
  'palayam': { district: 'Kozhikode', state: 'Kerala' },
  'calicut': { district: 'Kozhikode', state: 'Kerala' },
  'kozhikode': { district: 'Kozhikode', state: 'Kerala' },
  'kakkanad': { district: 'Ernakulam', state: 'Kerala' },
  'edappally': { district: 'Ernakulam', state: 'Kerala' },
  'aluva': { district: 'Ernakulam', state: 'Kerala' },
  'vyttila': { district: 'Ernakulam', state: 'Kerala' },
  'kochi': { district: 'Ernakulam', state: 'Kerala' },
  'cochin': { district: 'Ernakulam', state: 'Kerala' },
  'kowdiar': { district: 'Thiruvananthapuram', state: 'Kerala' },
  'technopark': { district: 'Thiruvananthapuram', state: 'Kerala' },
  'kazhakkoottam': { district: 'Thiruvananthapuram', state: 'Kerala' },
  'trivandrum': { district: 'Thiruvananthapuram', state: 'Kerala' },
  'swaraj round': { district: 'Thrissur', state: 'Kerala' },
  'puzhakkal': { district: 'Thrissur', state: 'Kerala' },
  'trichur': { district: 'Thrissur', state: 'Kerala' },
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
  isEdit = false
}) {
  const locationValue = formData[locationFieldName] || '';
  const districtValue = formData.district || '';
  const stateValue = formData.state || '';

  const [query, setQuery] = useState(locationValue);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [availableDistricts, setAvailableDistricts] = useState([]);

  const wrapperRef = useRef(null);

  // Sync internal query when prop changes externally
  useEffect(() => {
    setQuery(formData[locationFieldName] || '');
  }, [formData[locationFieldName]]);

  // Sync district options based on current State
  useEffect(() => {
    const districts = getDistrictsForState(stateValue);
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

  // Live Location Search (Backend API + Client-side Fallback)
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const handler = setTimeout(async () => {
      setIsLoading(true);
      const q = query.trim().toLowerCase();
      let fetchedMatches = [];

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
        console.warn('API location search error, using client-side lookup:', err.message);
      }

      // If backend search returned empty, perform live Nominatim Kerala search from client
      if (fetchedMatches.length === 0 && q.length >= 2) {
        try {
          const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ', Kerala, India')}&countrycodes=in&format=json&addressdetails=1&limit=6`);
          if (nomRes.ok) {
            const nomData = await nomRes.json();
            if (Array.isArray(nomData)) {
              for (const item of nomData) {
                const addr = item.address || {};
                const rawState = addr.state || '';
                const displayName = item.display_name || '';

                if (rawState.toLowerCase().includes('kerala') || displayName.toLowerCase().includes('kerala')) {
                  const rawDistrict = addr.state_district || addr.county || addr.city || addr.district || addr.town || addr.suburb || '';
                  const name = item.name || (displayName ? displayName.split(',')[0].trim() : query.trim());
                  const districtName = rawDistrict.replace(/district/i, '').trim() || 'Kozhikode';

                  fetchedMatches.push({
                    locality: name,
                    district: districtName,
                    state: 'Kerala'
                  });
                }
              }
            }
          }
        } catch (nomClientErr) {
          // Client fallback to dictionary
          const normQ = q.replace(/[^a-z0-9]/g, '');
          for (const [key, info] of Object.entries(CLIENT_LOCATION_LOOKUP)) {
            const normKey = key.replace(/[^a-z0-9]/g, '');
            if (normKey.includes(normQ) || normQ.includes(normKey)) {
              fetchedMatches.push({
                locality: query.trim(),
                district: info.district,
                state: info.state
              });
              break;
            }
          }
        }
      }

      setSuggestions(fetchedMatches);
      setIsLoading(false);
      setIsOpen(true);
    }, 250);

    return () => clearTimeout(handler);
  }, [query]);

  // Select a suggestion -> Auto-fill Locality, District & State
  const handleSelectSuggestion = (item) => {
    const selectedLocality = item.locality || query;
    const selectedDistrict = item.district || districtValue;
    const selectedState = item.state || stateValue;

    setQuery(selectedLocality);
    setIsOpen(false);

    onChange({
      [locationFieldName]: selectedLocality,
      district: selectedDistrict,
      state: selectedState
    });
  };

  // Custom locality fallback -> Auto-detect District & State if possible
  const handleCustomLocation = () => {
    const customText = query.trim();
    const qNorm = customText.toLowerCase().replace(/[^a-z0-9]/g, '');

    let detectedDistrict = districtValue;
    let detectedState = stateValue;

    // Smart auto-detect
    for (const [key, info] of Object.entries(CLIENT_LOCATION_LOOKUP)) {
      const normKey = key.replace(/[^a-z0-9]/g, '');
      if (normKey.includes(qNorm) || qNorm.includes(normKey)) {
        detectedDistrict = info.district;
        detectedState = info.state;
        break;
      }
    }

    setIsOpen(false);

    onChange({
      [locationFieldName]: customText,
      ...(detectedDistrict ? { district: detectedDistrict } : {}),
      ...(detectedState ? { state: detectedState } : {})
    });
  };

  // State Change handler -> Update districts list
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
        handleCustomLocation();
      } else if (suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0]);
      } else {
        handleCustomLocation();
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

      {/* Locality autocomplete — floating label */}
      <div className="relative" ref={wrapperRef}>
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
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              onChange(locationFieldName, val);
              setIsOpen(true);
              setHighlightedIndex(-1);
            }}
            onFocus={() => { if (query.trim().length >= 2) setIsOpen(true); }}
            onKeyDown={handleKeyDown}
            placeholder=" "
            className={`w-full pl-10 pr-4 pt-6 pb-2 rounded-xl text-[13.5px] text-slate-800 bg-[#F4F4F6] border-b focus:outline-none transition-colors duration-150 peer ${
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
                No suggestions. Select district &amp; state below.
              </div>
            ) : null}
            <button
              type="button"
              onClick={handleCustomLocation}
              onMouseEnter={() => setHighlightedIndex(suggestions.length)}
              className={`w-full text-left px-4 py-2 text-[12px] text-[#B0004F] font-medium flex items-center gap-2 border-t border-slate-100 cursor-pointer transition-colors ${
                highlightedIndex === suggestions.length ? "bg-[#FFF1F6]" : "hover:bg-slate-50"
              }`}
            >
              <Compass className="w-3 h-3 flex-shrink-0" />
              <span>Use "{query.trim()}" as locality</span>
            </button>
          </div>
        )}
      </div>

      {/* District & State — two columns, filled style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      </div>
    </div>
  );
}
