import React, { createContext, useState, useEffect, useCallback } from 'react';

export const PropertyContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : 'https://helloproperties-admin-backend.vercel.app/api'
);

const getAuthHeaders = () => {
  const token = localStorage.getItem('hp_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const PropertyProvider = ({ children }) => {
  const [properties, setProperties] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [apiLoadingCount, setApiLoadingCount] = useState(0);
  const [apiLoadingMessage, setApiLoadingMessage] = useState('');

  // Optional / Toggleable Property Sharing Feature state
  const [isPropertySharingEnabled, setIsPropertySharingEnabled] = useState(() => {
    return localStorage.getItem('hp_enable_property_sharing') === 'true';
  });

  const togglePropertySharing = (enabled) => {
    setIsPropertySharingEnabled(enabled);
    localStorage.setItem('hp_enable_property_sharing', enabled ? 'true' : 'false');
  };

  const isApiLoading = apiLoadingCount > 0;

  const trackApiCall = useCallback(async (asyncFn, message = 'Syncing...') => {
    setApiLoadingCount(prev => prev + 1);
    setApiLoadingMessage(message);
    try {
      return await asyncFn();
    } finally {
      setApiLoadingCount(prev => {
        const next = Math.max(0, prev - 1);
        if (next === 0) setApiLoadingMessage('');
        return next;
      });
    }
  }, []);

  const resolveImageUrl = (url) => {
    if (!url || typeof url !== 'string' || url.startsWith('blob:')) {
      return 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80';
    }
    if (url.startsWith('/uploads/')) {
      const backendBase = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
      return `${backendBase}${url}`;
    }
    return url;
  };

  const uploadImageFile = async (file) => {
    if (!file || !(file instanceof File || file instanceof Blob)) {
      return null;
    }
    try {
      const formData = new FormData();
      formData.append('image', file);

      const token = localStorage.getItem('hp_auth_token');

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.success && resData.imageUrl) {
          return resData.imageUrl;
        }
      }
    } catch (err) {
      console.error('Failed to upload image file to server:', err);
    }
    return null;
  };

  // Normalize backend item to frontend format
  const formatBackendProperty = (p) => ({
    id: p._id || p.id || p.propertyId || `prop-${Date.now()}`,
    propertyId: p.propertyId || 'HP-S000',
    title: p.title,
    listingType: p.listingType || p.listing_type || 'Sale',
    propertyType: p.propertyType || p.property_type || 'Plot/Land',
    location: p.location,
    district: p.district,
    state: p.state || '',
    area: p.area,
    expectedPrice: Number(p.expectedPrice || p.expected_price || 0),
    monthlyRent: Number(p.monthlyRent || p.monthly_rent || 0),
    securityDeposit: Number(p.securityDeposit || p.security_deposit || 0),
    description: p.description || '',
    ownerName: p.ownerName || p.owner_name,
    phoneNumber: p.ownerPhone || p.phoneNumber || p.owner_phone || '',
    ownerPhone: p.ownerPhone || p.phoneNumber || p.owner_phone || '',
    ownerAddress: p.ownerAddress || p.owner_address || '',
    imageUrl: resolveImageUrl(p.imageUrl || p.image_url || (p.images && p.images[0])),
    status: p.status || 'Available',
    createdAt: p.createdAt || p.created_at || new Date().toISOString()
  });

  const formatBackendRequirement = (r) => ({
    id: r._id || r.id || r.requirementId || `req-${Date.now()}`,
    requirementId: r.requirementId || 'HP-B000',
    requirementTitle: r.requirementTitle || r.requirement_title,
    requirementType: r.requirementType || r.requirement_type || 'Buy',
    propertyType: r.propertyType || r.property_type || 'Plot/Land',
    preferredLocation: r.preferredLocation || r.preferred_location,
    district: r.district,
    state: r.state || '',
    requiredArea: r.requiredArea || r.required_area,
    budget: Number(r.budget || 0),
    maximumMonthlyRent: Number(r.maximumMonthlyRent || r.maximum_monthly_rent || 0),
    description: r.description || '',
    buyerName: r.buyerName || r.buyer_name,
    phoneNumber: r.buyerPhone || r.phoneNumber || r.buyer_phone || '',
    buyerPhone: r.buyerPhone || r.phoneNumber || r.buyer_phone || '',
    buyerAddress: r.buyerAddress || r.buyer_address || '',
    status: r.status || 'Active',
    createdAt: r.createdAt || r.created_at || new Date().toISOString()
  });

  // Fetch properties & buy requirements from API
  const fetchFromBackend = useCallback(async () => {
    return trackApiCall(async () => {
      try {
        const [propRes, reqRes] = await Promise.all([
          fetch(`${API_BASE_URL}/properties`, { headers: getAuthHeaders(), credentials: 'include' }),
          fetch(`${API_BASE_URL}/buy-requirements`, { headers: getAuthHeaders(), credentials: 'include' })
        ]);

        if (propRes.ok && reqRes.ok) {
          const propData = await propRes.json();
          const reqData = await reqRes.json();

          if (propData.success && Array.isArray(propData.data)) {
            setProperties(propData.data.map(formatBackendProperty));
          } else {
            setProperties([]);
          }

          if (reqData.success && Array.isArray(reqData.data)) {
            setRequirements(reqData.data.map(formatBackendRequirement));
          } else {
            setRequirements([]);
          }

          setIsBackendConnected(true);
        } else {
          setIsBackendConnected(false);
        }
      } catch (error) {
        console.warn('Backend API unavailable:', error.message);
        setIsBackendConnected(false);
      }
    }, 'Syncing database...');
  }, [trackApiCall]);

  useEffect(() => {
    fetchFromBackend();
  }, [fetchFromBackend]);

  // Add Property (React -> POST /api/properties -> PostgreSQL)
  const addProperty = async (propertyData) => {
    return trackApiCall(async () => {
      let finalImageUrl = propertyData.imageUrl || '';

      // If an image File object was passed, upload it first to backend server
      const imageFileObj = propertyData.imageFile || (propertyData.images instanceof File ? propertyData.images : null);
      if (imageFileObj) {
        const uploadedUrl = await uploadImageFile(imageFileObj);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      }

      if (finalImageUrl && finalImageUrl.startsWith('blob:')) {
        finalImageUrl = '';
      }

      const listingType = propertyData.listingType || 'Sale';

      const payload = {
        title: propertyData.title,
        listingType: listingType,
        propertyType: propertyData.propertyType || 'Plot/Land',
        location: propertyData.location,
        district: propertyData.district,
        state: propertyData.state || '',
        area: propertyData.area,
        expectedPrice: listingType === 'Sale' ? Number(propertyData.expectedPrice || 0) : 0,
        monthlyRent: listingType === 'Rent' ? Number(propertyData.monthlyRent || 0) : 0,
        securityDeposit: listingType === 'Rent' ? Number(propertyData.securityDeposit || 0) : 0,
        description: propertyData.description || '',
        ownerName: propertyData.ownerName,
        ownerPhone: propertyData.phoneNumber || propertyData.ownerPhone || '',
        ownerAddress: propertyData.ownerAddress || '',
        status: propertyData.status || 'Available',
        imageUrl: finalImageUrl || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80'
      };

      try {
        const response = await fetch(`${API_BASE_URL}/properties`, {
          method: 'POST',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify(payload)
        });

        const resData = await response.json();

        if (response.ok && resData.success && resData.data) {
          const formatted = formatBackendProperty(resData.data);
          formatted.matches = resData.matches || [];
          setProperties(prev => [formatted, ...prev]);
          return { success: true, property: formatted, matches: resData.matches || [] };
        } else {
          return { success: false, error: resData.message || 'Failed to save property to database' };
        }
      } catch (err) {
        console.error('Failed to post property to API:', err.message);
        return { success: false, error: err.message || 'Network error saving property' };
      }
    }, 'Creating property...');
  };

  // Add Buy Requirement (React -> POST /api/buy-requirements -> PostgreSQL)
  const addRequirement = async (reqData) => {
    return trackApiCall(async () => {
      const requirementType = reqData.requirementType || 'Buy';

      const payload = {
        requirementTitle: reqData.requirementTitle || `${reqData.buyerName}'s Requirement`,
        requirementType: requirementType,
        propertyType: reqData.propertyType || 'Plot/Land',
        preferredLocation: reqData.preferredLocation,
        district: reqData.district,
        state: reqData.state || '',
        requiredArea: reqData.requiredArea,
        budget: requirementType === 'Buy' ? Number(reqData.budget || 0) : 0,
        maximumMonthlyRent: requirementType === 'Rent' ? Number(reqData.maximumMonthlyRent || 0) : 0,
        description: reqData.description || '',
        buyerName: reqData.buyerName,
        buyerPhone: reqData.phoneNumber || reqData.buyerPhone || '',
        buyerAddress: reqData.buyerAddress || '',
        status: reqData.status || 'Active'
      };

      try {
        const response = await fetch(`${API_BASE_URL}/buy-requirements`, {
          method: 'POST',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify(payload)
        });

        const resData = await response.json();

        if (response.ok && resData.success && resData.data) {
          const formatted = formatBackendRequirement(resData.data);
          formatted.matches = resData.matches || [];
          setRequirements(prev => [formatted, ...prev]);
          return { success: true, requirement: formatted, matches: resData.matches || [] };
        } else {
          return { success: false, error: resData.message || 'Failed to save buy requirement to database' };
        }
      } catch (err) {
        console.error('Failed to post buy requirement to API:', err.message);
        return { success: false, error: err.message || 'Network error saving requirement' };
      }
    }, 'Creating requirement...');
  };

  // Update Property Status (React -> PUT /api/properties/:id -> PostgreSQL)
  const updatePropertyStatus = async (id, newStatus) => {
    return trackApiCall(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify({ status: newStatus })
        });
        if (response.ok) {
          setProperties(prev => prev.map(p => (p.id === id || p.propertyId === id) ? { ...p, status: newStatus } : p));
        }
      } catch (err) {
        console.error('Failed to update property status on API:', err.message);
      }
    }, 'Updating status...');
  };

  // Update Full Property (React -> PUT /api/properties/:id -> PostgreSQL)
  const updateProperty = async (id, updatedData) => {
    return trackApiCall(async () => {
      let finalImageUrl = updatedData.imageUrl;

      // Upload new image file if selected
      if (updatedData.imageFile instanceof File) {
        const uploadedUrl = await uploadImageFile(updatedData.imageFile);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      }

      if (finalImageUrl && finalImageUrl.startsWith('blob:')) {
        finalImageUrl = undefined;
      }

      const listingType = updatedData.listingType || 'Sale';

      const payload = {
        title: updatedData.title,
        listingType: listingType,
        propertyType: updatedData.propertyType || 'Plot/Land',
        location: updatedData.location,
        district: updatedData.district,
        state: updatedData.state || '',
        area: updatedData.area,
        expectedPrice: listingType === 'Sale' ? Number(updatedData.expectedPrice || 0) : 0,
        monthlyRent: listingType === 'Rent' ? Number(updatedData.monthlyRent || 0) : 0,
        securityDeposit: listingType === 'Rent' ? Number(updatedData.securityDeposit || 0) : 0,
        description: updatedData.description || '',
        ownerName: updatedData.ownerName,
        ownerPhone: updatedData.phoneNumber || updatedData.ownerPhone || '',
        phoneNumber: updatedData.phoneNumber || updatedData.ownerPhone || '',
        ownerAddress: updatedData.ownerAddress || '',
        status: updatedData.status || 'Available',
        ...(finalImageUrl !== undefined && { imageUrl: finalImageUrl })
      };

      try {
        const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify(payload)
        });

        const resData = await response.json();

        if (response.ok && resData.success) {
          const formatted = formatBackendProperty(resData.data);
          setProperties(prev => prev.map(p => (p.id === id || p.propertyId === id || p.id === formatted.id) ? formatted : p));
          return { success: true, data: formatted };
        } else {
          return { success: false, error: resData.message || 'Failed to update property.' };
        }
      } catch (err) {
        console.error('Failed to update property on API:', err.message);
        return { success: false, error: err.message || 'Network error updating property.' };
      }
    }, 'Updating property...');
  };

  // Delete Property (React -> DELETE /api/properties/:id -> PostgreSQL)
  const deleteProperty = async (id) => {
    return trackApiCall(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
          credentials: 'include'
        });

        const resData = await response.json();

        if (response.ok && resData.success) {
          setProperties(prev => prev.filter(p => p.id !== id && p.propertyId !== id));
          return { success: true };
        } else {
          return { success: false, error: resData.message || 'Failed to delete property.' };
        }
      } catch (err) {
        console.error('Failed to delete property from API:', err.message);
        return { success: false, error: err.message || 'Network error deleting property.' };
      }
    }, 'Deleting property...');
  };

  // Update Buy Requirement Status (React -> PUT /api/buy-requirements/:id -> PostgreSQL)
  const updateRequirementStatus = async (id, newStatus) => {
    return trackApiCall(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/buy-requirements/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify({ status: newStatus })
        });
        if (response.ok) {
          setRequirements(prev => prev.map(r => (r.id === id || r.requirementId === id) ? { ...r, status: newStatus } : r));
        }
      } catch (err) {
        console.error('Failed to update buy requirement status on API:', err.message);
      }
    }, 'Updating status...');
  };

  // Update Full Buy Requirement (React -> PUT /api/buy-requirements/:id -> PostgreSQL)
  const updateRequirement = async (id, updatedData) => {
    return trackApiCall(async () => {
      const requirementType = updatedData.requirementType || 'Buy';

      const payload = {
        requirementTitle: updatedData.requirementTitle || `${updatedData.buyerName}'s Requirement`,
        requirementType: requirementType,
        propertyType: updatedData.propertyType || 'Plot/Land',
        preferredLocation: updatedData.preferredLocation,
        district: updatedData.district,
        state: updatedData.state || '',
        requiredArea: updatedData.requiredArea,
        budget: requirementType === 'Buy' ? Number(updatedData.budget || 0) : 0,
        maximumMonthlyRent: requirementType === 'Rent' ? Number(updatedData.maximumMonthlyRent || 0) : 0,
        description: updatedData.description || '',
        buyerName: updatedData.buyerName,
        buyerPhone: updatedData.phoneNumber || updatedData.buyerPhone || '',
        phoneNumber: updatedData.phoneNumber || updatedData.buyerPhone || '',
        buyerAddress: updatedData.buyerAddress || '',
        status: updatedData.status || 'Active'
      };

      try {
        const response = await fetch(`${API_BASE_URL}/buy-requirements/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify(payload)
        });

        const resData = await response.json();

        if (response.ok && resData.success) {
          const formatted = formatBackendRequirement(resData.data);
          formatted.matches = resData.matches || [];
          setRequirements(prev => prev.map(r => (r.id === id || r.requirementId === id || r.id === formatted.id) ? formatted : r));
          return { success: true, data: formatted, matches: resData.matches || [] };
        } else {
          return { success: false, error: resData.message || 'Failed to update requirement.' };
        }
      } catch (err) {
        console.error('Failed to update buy requirement on API:', err.message);
        return { success: false, error: err.message || 'Network error updating requirement.' };
      }
    }, 'Updating requirement...');
  };

  // Delete Buy Requirement (React -> DELETE /api/buy-requirements/:id -> PostgreSQL)
  const deleteRequirement = async (id) => {
    return trackApiCall(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/buy-requirements/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
          credentials: 'include'
        });

        const resData = await response.json();

        if (response.ok && resData.success) {
          setRequirements(prev => prev.filter(r => r.id !== id && r.requirementId !== id));
          return { success: true };
        } else {
          return { success: false, error: resData.message || 'Failed to delete requirement.' };
        }
      } catch (err) {
        console.error('Failed to delete buy requirement from API:', err.message);
        return { success: false, error: err.message || 'Network error deleting requirement.' };
      }
    }, 'Deleting requirement...');
  };

  // Helper: Client-side 2-way matching calculation (Exact PostgreSQL matching parity)
  const computePropertyMatchesLocally = useCallback((propTarget) => {
    let prop = null;
    if (typeof propTarget === 'object' && propTarget !== null) {
      prop = propTarget;
    } else {
      prop = properties.find(p => 
        String(p.id) === String(propTarget) || 
        String(p.propertyId) === String(propTarget) || 
        String(p._id) === String(propTarget)
      );
    }
    if (!prop) return [];

    const propListingType = (prop.listingType || 'Sale').toLowerCase();
    const isPropRent = propListingType === 'rent';

    return requirements.map(req => {
      // 1. Transaction type hard filter (Rent only with Rent, Sale only with Buy)
      const reqListingType = (req.requirementType || 'Buy').toLowerCase();
      const isReqRent = reqListingType === 'rent';
      if (isPropRent !== isReqRent) {
        return null;
      }

      // 2. Location & District Match (MANDATORY HARD FILTER)
      const reqLoc = (req.preferredLocation || '').toLowerCase().trim();
      const propLoc = (prop.location || '').toLowerCase().trim();
      const reqDist = (req.district || '').toLowerCase().trim();
      const propDist = (prop.district || '').toLowerCase().trim();

      let locScore = 0;
      if (reqDist && propDist && reqDist === propDist) {
        locScore += 30;
      }
      if (reqLoc && propLoc && (propLoc.includes(reqLoc) || reqLoc.includes(propLoc))) {
        locScore += 15;
      } else if (reqLoc && (prop.district || '').toLowerCase().includes(reqLoc)) {
        locScore += 10;
      }

      // Hard filter: If location/district does not match at all, they CANNOT match
      if (locScore === 0) {
        return null;
      }

      let score = 10; // Base transaction eligibility
      score += Math.min(40, locScore);

      // 3. Property type match (30% max)
      const reqPType = (req.propertyType || '').toLowerCase().trim();
      const propPType = (prop.propertyType || '').toLowerCase().trim();
      if (reqPType && propPType) {
        if (reqPType === propPType) {
          score += 30;
        } else if (reqPType.includes('plot') && propPType.includes('plot') && !reqPType.includes('agricultural') && !propPType.includes('agricultural')) {
          score += 15;
        }
      }

      // 4. Budget match (20% max)
      const budget = Number(isReqRent ? (req.maximumMonthlyRent || req.budget || 0) : (req.budget || 0));
      const price = Number(isPropRent ? (prop.monthlyRent || prop.expectedPrice || 0) : (prop.expectedPrice || 0));

      if (budget > 0 && price > 0) {
        if (price <= budget) {
          score += 20;
        } else if (price <= budget * 1.15) {
          score += 12;
        } else if (price <= budget * 1.25) {
          score += 5;
        }
      } else {
        score += 10;
      }

      return {
        ...req,
        matchScore: Math.min(100, Math.max(0, score))
      };
    }).filter(item => item !== null && item.matchScore >= 60).sort((a, b) => b.matchScore - a.matchScore);
  }, [properties, requirements]);

  const computeRequirementMatchesLocally = useCallback((reqTarget) => {
    let req = null;
    if (typeof reqTarget === 'object' && reqTarget !== null) {
      req = reqTarget;
    } else {
      req = requirements.find(r => 
        String(r.id) === String(reqTarget) || 
        String(r.requirementId) === String(reqTarget) || 
        String(r._id) === String(reqTarget)
      );
    }
    if (!req) return [];

    const reqListingType = (req.requirementType || 'Buy').toLowerCase();
    const isReqRent = reqListingType === 'rent';

    return properties.map(prop => {
      // 1. Transaction type hard filter (Rent only with Rent, Sale only with Buy)
      const propListingType = (prop.listingType || 'Sale').toLowerCase();
      const isPropRent = propListingType === 'rent';
      if (isReqRent !== isPropRent) {
        return null;
      }

      // 2. Location & District Match (MANDATORY HARD FILTER)
      const reqLoc = (req.preferredLocation || '').toLowerCase().trim();
      const propLoc = (prop.location || '').toLowerCase().trim();
      const reqDist = (req.district || '').toLowerCase().trim();
      const propDist = (prop.district || '').toLowerCase().trim();

      let locScore = 0;
      if (reqDist && propDist && reqDist === propDist) {
        locScore += 30;
      }
      if (reqLoc && propLoc && (propLoc.includes(reqLoc) || reqLoc.includes(propLoc))) {
        locScore += 15;
      } else if (reqLoc && (prop.district || '').toLowerCase().includes(reqLoc)) {
        locScore += 10;
      }

      // Hard filter: If location/district does not match at all, they CANNOT match
      if (locScore === 0) {
        return null;
      }

      let score = 10; // Base transaction eligibility
      score += Math.min(40, locScore);

      // 3. Property type match (30% max)
      const reqPType = (req.propertyType || '').toLowerCase().trim();
      const propPType = (prop.propertyType || '').toLowerCase().trim();
      if (reqPType && propPType) {
        if (reqPType === propPType) {
          score += 30;
        } else if (reqPType.includes('plot') && propPType.includes('plot') && !reqPType.includes('agricultural') && !propPType.includes('agricultural')) {
          score += 15;
        }
      }

      // 4. Budget match (20% max)
      const budget = Number(isReqRent ? (req.maximumMonthlyRent || req.budget || 0) : (req.budget || 0));
      const price = Number(isPropRent ? (prop.monthlyRent || prop.expectedPrice || 0) : (prop.expectedPrice || 0));

      if (budget > 0 && price > 0) {
        if (price <= budget) {
          score += 20;
        } else if (price <= budget * 1.15) {
          score += 12;
        } else if (price <= budget * 1.25) {
          score += 5;
        }
      } else {
        score += 10;
      }

      return {
        ...prop,
        matchScore: Math.min(100, Math.max(0, score))
      };
    }).filter(item => item !== null && item.matchScore >= 60).sort((a, b) => b.matchScore - a.matchScore);
  }, [properties, requirements]);

  // Sanitize and filter match results strictly (ensuring backend responses don't include cross-district items)
  const sanitizeMatches = useCallback((target, list) => {
    if (!Array.isArray(list) || !target) return list || [];
    const targetDist = (target.district || '').toLowerCase().trim();
    const targetLoc = (target.location || target.preferredLocation || '').toLowerCase().trim();
    const targetIsRent = (target.listingType || target.requirementType || '').toLowerCase() === 'rent';

    return list.filter(item => {
      // 1. Hard filter: Transaction type (Rent with Rent, Sale with Buy)
      const itemIsRent = (item.listingType || item.requirementType || '').toLowerCase() === 'rent';
      if (targetIsRent !== itemIsRent) return false;

      // 2. Hard filter: District / Location matching
      const itemDist = (item.district || '').toLowerCase().trim();
      const itemLoc = (item.location || item.preferredLocation || '').toLowerCase().trim();

      if (targetDist && itemDist && targetDist !== itemDist) {
        if (!targetLoc || !itemLoc || (!itemLoc.includes(targetLoc) && !targetLoc.includes(itemLoc))) {
          return false; // Disqualify cross-district items (e.g. Kannur for Palakkad)
        }
      }

      return (item.matchScore || 0) >= 60;
    });
  }, []);

  // Get Property Matches from API (with fast timeout and local fallback)
  const getPropertyMatches = async (propId, propTarget = null) => {
    const target = propTarget || properties.find(p => p.id === propId || p.propertyId === propId || p._id === propId);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const response = await fetch(`${API_BASE_URL}/properties/${propId}/matches`, {
        headers: getAuthHeaders(),
        credentials: 'include',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const resData = await response.json();
        if (resData.success && Array.isArray(resData.matches) && resData.matches.length > 0) {
          return sanitizeMatches(target, resData.matches);
        }
      }
    } catch (err) {
      // Fall through to local matching
    }
    return computePropertyMatchesLocally(target || propId);
  };

  // Get Requirement Matches from API (with fast timeout and local fallback)
  const getRequirementMatches = async (reqId, reqTarget = null) => {
    const target = reqTarget || requirements.find(r => r.id === reqId || r.requirementId === reqId || r._id === reqId);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const response = await fetch(`${API_BASE_URL}/buy-requirements/${reqId}/matches`, {
        headers: getAuthHeaders(),
        credentials: 'include',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const resData = await response.json();
        if (resData.success && Array.isArray(resData.matches) && resData.matches.length > 0) {
          return sanitizeMatches(target, resData.matches);
        }
      }
    } catch (err) {
      // Fall through to local matching
    }
    return computeRequirementMatchesLocally(target || reqId);
  };

  return (
    <PropertyContext.Provider value={{
      properties,
      requirements,
      isBackendConnected,
      isApiLoading,
      apiLoadingMessage,
      isPropertySharingEnabled,
      togglePropertySharing,
      fetchFromBackend,
      addProperty,
      addRequirement,
      updateProperty,
      deleteProperty,
      updateRequirement,
      deleteRequirement,
      updatePropertyStatus,
      updateRequirementStatus,
      getPropertyMatches,
      getRequirementMatches,
      computePropertyMatchesLocally,
      computeRequirementMatchesLocally
    }}>
      {children}
    </PropertyContext.Provider>
  );
};


