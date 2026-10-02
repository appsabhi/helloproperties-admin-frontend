import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2, MapPin, Search } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const libraries = ['places'];

const containerStyle = {
  width: '100%',
  height: '100%'
};

export default function MapPickerModal({ isOpen, onClose, onConfirm, initialCenter = [11.2587, 75.7804] }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY", 
    libraries
  });

  const [map, setMap] = useState(null);
  
  // Transform initialCenter [lat, lng] to Google Maps {lat, lng}
  const defaultCenter = { lat: initialCenter[0], lng: initialCenter[1] };
  
  const [selectedPos, setSelectedPos] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [locationDetails, setLocationDetails] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // New Places API state
  const [placesLib, setPlacesLib] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);

  useEffect(() => {
    if (isLoaded && window.google && !placesLib) {
      window.google.maps.importLibrary("places")
        .then((lib) => {
          setPlacesLib(lib);
          setSessionToken(new lib.AutocompleteSessionToken());
        })
        .catch(err => console.error("Error loading places library:", err));
    }
  }, [isLoaded, placesLib]);
  
  const searchWrapperRef = useRef(null);

  const onLoad = useCallback(function callback(mapInstance) {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setSelectedPos(null);
      setLocationDetails(null);
      setIsLoading(false);
      setSearchQuery('');
      setSuggestions([]);
      setIsDropdownOpen(false);
      setMapCenter(defaultCenter);
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

  // Real-time location search using Google Places Autocomplete Data API (New)
  useEffect(() => {
    if (!placesLib || !sessionToken) return;
    
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const handler = setTimeout(async () => {
      setIsSearching(true);
      try {
        const request = {
          input: searchQuery,
          includedRegionCodes: ["IN"], // Restrict to India
          sessionToken: sessionToken,
        };
        
        const { suggestions: apiSuggestions } = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        
        if (apiSuggestions && apiSuggestions.length > 0) {
          setSuggestions(apiSuggestions.map(s => ({
            suggestionObj: s,
            place_id: s.placePrediction.placeId,
            main_text: s.placePrediction.mainText.text,
            secondary_text: s.placePrediction.secondaryText ? s.placePrediction.secondaryText.text : ''
          })));
          setIsDropdownOpen(true);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error("Google Places API (New) Error:", err);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery, placesLib, sessionToken]);

  const handleSelectSuggestion = async (item) => {
    setIsDropdownOpen(false);
    setSearchQuery(item.main_text);
    setIsLoading(true);

    if (!map || !placesLib) {
      setIsLoading(false);
      return;
    }

    try {
      const place = item.suggestionObj.placePrediction.toPlace();
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location', 'addressComponents']
      });

      if (place.location) {
        const lat = place.location.lat();
        const lng = place.location.lng();
        
        map.panTo(place.location);
        map.setZoom(15);
        
        setSelectedPos({ lat, lng });
        
        // Extract address components
        let district = '';
        let state = 'Kerala';
        let locality = item.main_text;

        if (place.addressComponents) {
          place.addressComponents.forEach(component => {
            if (component.types.includes('administrative_area_level_3') || component.types.includes('administrative_area_level_2')) {
              district = component.longText;
            }
            if (component.types.includes('administrative_area_level_1')) {
              state = component.longText;
            }
          });
        }

        setLocationDetails({
          locality,
          district: district.replace(/district/i, '').trim(),
          state,
          latitude: lat,
          longitude: lng
        });

        // Reset session token for the next search
        setSessionToken(new placesLib.AutocompleteSessionToken());
      }
    } catch (err) {
      console.error("Google Places API Details Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    
    setSelectedPos({ lat, lng });
    setIsLoading(true);
    setLocationDetails(null);

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      setIsLoading(false);
      if (status === 'OK' && results[0]) {
        const place = results[0];
        let district = '';
        let state = 'Kerala';
        let locality = '';

        place.address_components.forEach(component => {
          if (component.types.includes('locality') || component.types.includes('sublocality')) {
            if (!locality) locality = component.long_name;
          }
          if (component.types.includes('administrative_area_level_3') || component.types.includes('administrative_area_level_2')) {
            district = component.long_name;
          }
          if (component.types.includes('administrative_area_level_1')) {
            state = component.long_name;
          }
        });

        if (!locality) locality = place.formatted_address.split(',')[0];

        setLocationDetails({
          locality,
          district: district.replace(/district/i, '').trim(),
          state,
          latitude: lat,
          longitude: lng
        });
        setSearchQuery(locality);
      }
    });
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
          {!isLoaded ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-50">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-[#B0004F]" />
                <span className="text-[13px] font-medium text-slate-600">Loading Maps...</span>
              </div>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={mapCenter}
              zoom={7}
              onLoad={onLoad}
              onUnmount={onUnmount}
              onClick={handleMapClick}
              options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
              }}
            >
              {selectedPos && <Marker position={selectedPos} />}
            </GoogleMap>
          )}

          {/* Search Bar Overlay */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-11/12 sm:w-[400px] z-[10]" ref={searchWrapperRef}>
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
                className="w-full pl-11 pr-10 py-3.5 text-[13px] text-slate-800 bg-white border-none focus:outline-none focus:ring-2 focus:ring-[#B0004F]/20"
              />
            
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSuggestions([]);
                    setIsDropdownOpen(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {isDropdownOpen && suggestions.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-100 max-h-[300px] overflow-y-auto z-[1000] flex flex-col">
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Places</span>
                </div>
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[#FFF1F6] border-b last:border-b-0 border-slate-50 transition-colors group"
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-[#B0004F]/10 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#B0004F] transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-slate-800 leading-tight mb-0.5 truncate group-hover:text-[#B0004F] transition-colors">
                        {item.main_text}
                      </div>
                      <div className="text-[11.5px] text-slate-500 leading-snug line-clamp-2">
                        {item.secondary_text}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {/* No Results Fallback */}
            {isDropdownOpen && suggestions.length === 0 && !isSearching && searchQuery.trim().length >= 2 && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-[1000] text-center">
                <span className="text-[13px] font-semibold text-slate-600 block mb-1">No places found</span>
                <span className="text-[11px] text-slate-400 block">Try a different search term or click anywhere on the map to drop a pin.</span>
              </div>
            )}

          </div>

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-[10]">
              <Loader2 className="w-4 h-4 animate-spin text-[#B0004F]" />
              <span className="text-[12px] font-medium text-slate-700">Identifying location...</span>
            </div>
          )}

          {/* Confirmation Overlay */}
          {locationDetails && !isLoading && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white p-4 rounded-xl shadow-xl border border-slate-100 w-11/12 sm:w-[400px] z-[10] transition-all">
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
