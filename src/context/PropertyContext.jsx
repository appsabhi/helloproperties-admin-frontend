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
    areaUnit: p.areaUnit || p.area_unit,
    expectedPrice: Number(p.expectedPrice || p.expected_price || 0),
    expectedPriceUnit: p.expectedPriceUnit || p.expected_price_unit || p.priceUnit || p.price_unit,
    monthlyRent: Number(p.monthlyRent || p.monthly_rent || 0),
    monthlyRentUnit: p.monthlyRentUnit || p.monthly_rent_unit,
    securityDeposit: Number(p.securityDeposit || p.security_deposit || 0),
    securityDepositUnit: p.securityDepositUnit || p.security_deposit_unit,
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
    requiredAreaUnit: r.requiredAreaUnit || r.required_area_unit,
    budget: Number(r.budget || 0),
    budgetUnit: r.budgetUnit || r.budget_unit || r.priceUnit || r.price_unit,
    maximumMonthlyRent: Number(r.maximumMonthlyRent || r.maximum_monthly_rent || 0),
    maximumMonthlyRentUnit: r.maximumMonthlyRentUnit || r.maximum_monthly_rent_unit,
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
          setProperties(prev => prev.map(p => (p.id === id || p.propertyId === id || p._id === id || String(p.id) === String(id)) ? { ...p, ...formatted } : p));
          return { success: true, data: formatted };
        } else {
          const localUpdated = { ...updatedData, id, propertyId: id };
          setProperties(prev => prev.map(p => (p.id === id || p.propertyId === id || p._id === id || String(p.id) === String(id)) ? { ...p, ...localUpdated } : p));
          return { success: true, data: localUpdated };
        }
      } catch (err) {
        console.error('Failed to update property on API:', err.message);
        const localUpdated = { ...updatedData, id, propertyId: id };
        setProperties(prev => prev.map(p => (p.id === id || p.propertyId === id || p._id === id || String(p.id) === String(id)) ? { ...p, ...localUpdated } : p));
        return { success: true, data: localUpdated };
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
          setProperties(prev => prev.filter(p => p.id !== id && p.propertyId !== id));
          return { success: true };
        }
      } catch (err) {
        console.error('Failed to delete property from API:', err.message);
        setProperties(prev => prev.filter(p => p.id !== id && p.propertyId !== id));
        return { success: true };
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
          setRequirements(prev => prev.map(r => (r.id === id || r.requirementId === id || r._id === id || String(r.id) === String(id)) ? { ...r, ...formatted } : r));
          return { success: true, data: formatted, matches: resData.matches || [] };
        } else {
          const localUpdated = { ...updatedData, id, requirementId: id };
          setRequirements(prev => prev.map(r => (r.id === id || r.requirementId === id || r._id === id || String(r.id) === String(id)) ? { ...r, ...localUpdated } : r));
          return { success: true, data: localUpdated };
        }
      } catch (err) {
        console.error('Failed to update buy requirement on API:', err.message);
        const localUpdated = { ...updatedData, id, requirementId: id };
        setRequirements(prev => prev.map(r => (r.id === id || r.requirementId === id || r._id === id || String(r.id) === String(id)) ? { ...r, ...localUpdated } : r));
        return { success: true, data: localUpdated };
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

  // ═══════════════════════════════════════════════════════════════════════════
  // EXCEL / CSV BULK IMPORT & REVERT ENGINE
  // ═══════════════════════════════════════════════════════════════════════════

  const [importHistory, setImportHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('hp_import_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('hp_import_history', JSON.stringify(importHistory));
    } catch (e) {}
  }, [importHistory]);

  const bulkAddItems = useCallback((newProperties = [], newRequirements = [], fileName = 'Imported_Data.xlsx') => {
    const batchId = `batch_${Date.now()}`;
    const importedAt = new Date().toISOString();

    const taggedProps = newProperties.map((p, idx) => ({
      ...formatBackendProperty(p),
      id: p.id || `prop-bulk-${Date.now()}-${idx}`,
      importBatchId: batchId,
      importedAt
    }));

    const taggedReqs = newRequirements.map((r, idx) => ({
      ...formatBackendRequirement(r),
      id: r.id || `req-bulk-${Date.now()}-${idx}`,
      importBatchId: batchId,
      importedAt
    }));

    if (taggedProps.length > 0) {
      setProperties(prev => [...taggedProps, ...prev]);
    }
    if (taggedReqs.length > 0) {
      setRequirements(prev => [...taggedReqs, ...prev]);
    }

    const batchMeta = {
      batchId,
      importedAt,
      fileName,
      salePropsCount: taggedProps.filter(p => (p.listingType || '').toLowerCase() === 'sale').length,
      rentPropsCount: taggedProps.filter(p => (p.listingType || '').toLowerCase() === 'rent').length,
      buyReqsCount: taggedReqs.filter(r => (r.requirementType || '').toLowerCase() === 'buy').length,
      rentReqsCount: taggedReqs.filter(r => (r.requirementType || '').toLowerCase() === 'rent').length,
      totalItems: taggedProps.length + taggedReqs.length
    };

    setImportHistory(prev => [batchMeta, ...prev]);
    return batchMeta;
  }, []);

  const revertImportBatch = useCallback((batchId) => {
    setProperties(prev => prev.filter(p => p.importBatchId !== batchId));
    setRequirements(prev => prev.filter(r => r.importBatchId !== batchId));
    setImportHistory(prev => prev.filter(b => b.batchId !== batchId));
    return { success: true };
  }, []);

  // Conversion factors to square feet
  const AREA_UNIT_TO_SQFT = {
    'sq ft': 1, 'sqft': 1, 'sft': 1, 'square feet': 1, 'square foot': 1, 'sf': 1,
    'sq m': 10.764, 'sqm': 10.764, 'square meter': 10.764, 'square meters': 10.764, 'square metre': 10.764,
    'acre': 43560, 'acres': 43560,
    'cent': 435.6, 'cents': 435.6,
    'guntha': 1089, 'gunthas': 1089, 'guntas': 1089, 'gunta': 1089,
    'kanal': 5445, 'kanals': 5445,
    'marla': 272.25, 'marlas': 272.25,
    'bigha': 27000, 'bighas': 27000,
    'hectare': 107639, 'hectares': 107639, 'ha': 107639,
    'ground': 2400, 'grounds': 2400,
    'perch': 272.25, 'perches': 272.25,
    'are': 1076.39, 'ares': 1076.39,
  };

  /**
   * Parse a single area string like "2400 sq ft", "1.5 acres", "60 cents" into square feet.
   * Returns null if unparseable.
   */
  const parseAreaToSqFt = (areaStr) => {
    if (!areaStr || typeof areaStr !== 'string') return null;
    const cleaned = areaStr.toLowerCase().replace(/,/g, '').trim();

    // Try matching number + unit pattern
    for (const [unit, factor] of Object.entries(AREA_UNIT_TO_SQFT)) {
      // Match patterns like "2400 sq ft", "1.5acres", "60 cents", etc.
      const regex = new RegExp(`([\\d.]+)\\s*${unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
      const match = cleaned.match(regex);
      if (match) {
        const num = parseFloat(match[1]);
        if (!isNaN(num) && num > 0) return num * factor;
      }
    }

    // Fallback: if it's just a number, assume sq ft
    const plainNum = parseFloat(cleaned);
    if (!isNaN(plainNum) && plainNum > 0 && /^\d+\.?\d*$/.test(cleaned)) {
      return plainNum;
    }

    return null;
  };

  /**
   * Parse buyer's required area which may be a range ("5-15 Acres", "Min 5000 sq ft", "2000-3000 sq ft")
   * Returns { min: sqft|null, max: sqft|null }
   */
  const parseAreaRange = (areaStr) => {
    if (!areaStr || typeof areaStr !== 'string') return { min: null, max: null };
    const cleaned = areaStr.toLowerCase().replace(/,/g, '').trim();

    // Detect unit used in the string
    let detectedUnit = 'sq ft';
    let detectedFactor = 1;
    for (const [unit, factor] of Object.entries(AREA_UNIT_TO_SQFT)) {
      if (cleaned.includes(unit)) {
        detectedUnit = unit;
        detectedFactor = factor;
        break;
      }
    }

    // Pattern: "5-15 Acres" or "2000 - 3000 sq ft"
    const rangeMatch = cleaned.match(/([\d.]+)\s*[-–to]+\s*([\d.]+)/);
    if (rangeMatch) {
      const v1 = parseFloat(rangeMatch[1]);
      const v2 = parseFloat(rangeMatch[2]);
      if (!isNaN(v1) && !isNaN(v2)) {
        return { min: Math.min(v1, v2) * detectedFactor, max: Math.max(v1, v2) * detectedFactor };
      }
    }

    // Pattern: "Min 5000 sq ft" or "minimum 2 acres"
    const minMatch = cleaned.match(/min(?:imum)?\s*([\d.]+)/);
    if (minMatch) {
      const v = parseFloat(minMatch[1]);
      if (!isNaN(v)) return { min: v * detectedFactor, max: null };
    }

    // Pattern: "Max 3000 sq ft" or "upto 5 acres"
    const maxMatch = cleaned.match(/(?:max(?:imum)?|upto|up\s*to)\s*([\d.]+)/);
    if (maxMatch) {
      const v = parseFloat(maxMatch[1]);
      if (!isNaN(v)) return { min: null, max: v * detectedFactor };
    }

    // Single value fallback
    const singleVal = parseAreaToSqFt(cleaned);
    if (singleVal !== null) {
      return { min: singleVal, max: singleVal };
    }

    return { min: null, max: null };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // FUZZY LOCALITY MATCHING — Token-based comparison
  // ═══════════════════════════════════════════════════════════════════════════

  const LOCALITY_STOPWORDS = new Set([
    'near', 'road', 'rd', 'street', 'st', 'junction', 'jn', 'opp', 'opposite',
    'main', 'side', 'area', 'dist', 'district', 'bypass', 'highway', 'hwy', 'colony',
    'nagar', 'city', 'town', 'cross', 'plot', 'no', 'number', 'floor', 'lane', 'gate'
  ]);

  const extractLocalityPlaces = (locStr, distStr) => {
    if (!locStr || typeof locStr !== 'string') return [];
    const dLower = (distStr || '').toLowerCase().trim();
    return locStr
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .filter(p => {
        const pLower = p.toLowerCase();
        return pLower.length > 0 && pLower !== dLower;
      });
  };

  const tokenize = (str, distStr) => {
    if (!str) return [];
    const dLower = (distStr || '').toLowerCase().trim();
    return str
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 1 && !LOCALITY_STOPWORDS.has(t) && t !== dLower);
  };

  const computeLocalityScore = (loc1, loc2, dist1, dist2) => {
    const places1 = extractLocalityPlaces(loc1, dist1);
    const places2 = extractLocalityPlaces(loc2, dist2);

    if (places1.length === 0 || places2.length === 0) {
      return { score: 0, detail: 'Locality info missing', isOverlap: true, isMissing: true };
    }

    let maxLocScore = 0;
    let bestLocDetail = 'No locality overlap';

    for (const p1 of places1) {
      for (const p2 of places2) {
        const t1 = tokenize(p1, dist1);
        const t2 = tokenize(p2, dist2);
        const str1 = p1.toLowerCase();
        const str2 = p2.toLowerCase();

        if (str1 && str2 && (str1 === str2 || (str1.length >= 3 && str2.length >= 3 && (str1.includes(str2) || str2.includes(str1))))) {
          return { score: 20, detail: `Exact place match: "${p1}"`, isOverlap: true };
        }

        if (t1.length > 0 && t2.length > 0) {
          const common = t1.filter(token => t2.some(t => t === token || (t.length >= 4 && token.length >= 4 && (t.includes(token) || token.includes(t)))));
          const ratio = common.length / Math.max(t1.length, t2.length);

          if (ratio >= 0.5 && maxLocScore < 18) {
            maxLocScore = 18;
            bestLocDetail = `Strong locality overlap: ${common.join(', ')}`;
          } else if (common.length > 0 && maxLocScore < 12) {
            maxLocScore = 12;
            bestLocDetail = `Partial locality overlap: ${common.join(', ')}`;
          }
        }
      }
    }

    if (maxLocScore > 0) return { score: maxLocScore, detail: bestLocDetail, isOverlap: true };

    return { score: 0, detail: 'No locality overlap', isOverlap: false };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // UNIFIED MATCH SCORER — Single function used by both directions
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Compute match score between a property and a buyer requirement.
   * Returns { matchScore, matchReasons } or null if hard-filtered out.
   */
  const computeMatchScore = (prop, req) => {
    const matchReasons = [];

    // ── Hard Filter 1: Transaction Type ──
    const propIsRent = (prop.listingType || 'Sale').toLowerCase() === 'rent';
    const reqIsRent = (req.requirementType || 'Buy').toLowerCase() === 'rent';
    if (propIsRent !== reqIsRent) return null;

    // ── Hard Filter 2: State Validation ──
    const propState = (prop.state || '').toLowerCase().trim();
    const reqState = (req.state || '').toLowerCase().trim();
    if (propState && reqState && propState !== reqState) return null;

    // ── Hard Filter 3: District MUST match ──
    const propDist = (prop.district || '').toLowerCase().trim();
    const reqDist = (req.district || '').toLowerCase().trim();
    let districtScore = 0;
    let districtDetail = '';
    if (propDist && reqDist && propDist === reqDist) {
      districtScore = 25;
      districtDetail = `${prop.district} ✓`;
    } else if (propDist && reqDist) {
      // Different districts → hard reject
      return null;
    } else {
      // One or both missing district — allow but with partial score
      districtScore = 15;
      districtDetail = 'All Districts search';
    }
    matchReasons.push({ factor: 'District', score: districtScore, maxScore: 25, detail: districtDetail });

    // ── Hard Filter 4: Matching Locality MUST overlap if specified ──
    const propLoc = prop.location || '';
    const reqLoc = req.preferredLocation || '';
    const localityResult = computeLocalityScore(propLoc, reqLoc, prop.district, req.district);

    if (localityResult.isOverlap === false) {
      // Both property & buyer specified locality, but zero locality overlap → Hard Reject
      return null;
    }
    matchReasons.push({ factor: 'Locality', score: localityResult.score, maxScore: 20, detail: localityResult.detail });

    // ── Hard Filter 5: Property Type Compatibility (Multi-type support) ──
    const getTypeList = (target) => {
      if (Array.isArray(target?.propertyTypes) && target.propertyTypes.length > 0) return target.propertyTypes;
      if (typeof target?.propertyType === 'string' && target.propertyType) {
        return target.propertyType.split(',').map(s => s.trim()).filter(Boolean);
      }
      return [];
    };

    const propTypes = getTypeList(prop).map(s => s.toLowerCase());
    const reqTypes = getTypeList(req).map(s => s.toLowerCase());

    let typeScore = 0;
    let typeDetail = '';

    if (propTypes.length === 0 || reqTypes.length === 0) {
      typeScore = 25; // All categories matched if left empty
      typeDetail = 'All property categories';
    } else {
      const hasExactMatch = propTypes.some(pt => reqTypes.some(rt => pt === rt));
      if (hasExactMatch) {
        typeScore = 25;
        typeDetail = `Exact match (${propTypes.join(', ')})`;
      } else {
        const plotTypes = ['plot/land', 'commercial plot', 'residential plot', 'industrial plot'];
        const bothPlots = propTypes.some(pt => plotTypes.includes(pt)) && reqTypes.some(rt => plotTypes.includes(rt));
        const landTypes = ['agricultural land', 'plot/land'];
        const bothLand = propTypes.some(pt => landTypes.includes(pt)) && reqTypes.some(rt => landTypes.includes(rt));

        if (bothPlots) {
          typeScore = 15;
          typeDetail = `Similar plot types`;
        } else if (bothLand) {
          typeScore = 12;
          typeDetail = `Related land types`;
        } else {
          return null; // completely incompatible types -> hard reject
        }
      }
    }
    matchReasons.push({ factor: 'Property Type', score: typeScore, maxScore: 25, detail: typeDetail });

    // ── Factor 4: Budget / Price Match (15 pts — supports Min & Max Price Ranges) ──
    const minP = Number(prop.minPrice || req.minPrice || 0);
    const maxP = Number(prop.maxPrice || req.maxPrice || 0);
    const budget = Number(reqIsRent ? (req.maximumMonthlyRent || req.budget || 0) : (req.budget || 0));
    const price = Number(propIsRent ? (prop.monthlyRent || prop.expectedPrice || 0) : (prop.expectedPrice || 0));

    let budgetScore = 0;
    let budgetDetail = '';

    const formatP = (v) => {
      if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
      if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
      if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
      return `₹${v}`;
    };

    if (minP > 0 || maxP > 0) {
      const targetP = price || budget;
      const lower = minP || 0;
      const upper = maxP || Infinity;

      if (targetP >= lower && targetP <= upper) {
        budgetScore = 15;
        budgetDetail = `${formatP(targetP)} within ${formatP(lower)} - ${maxP ? formatP(upper) : 'above'} range`;
      } else if (targetP > upper && targetP <= upper * 1.15) {
        budgetScore = 10;
        budgetDetail = `${formatP(targetP)} slightly above max range`;
      } else if (targetP < lower && targetP >= lower * 0.85) {
        budgetScore = 10;
        budgetDetail = `${formatP(targetP)} slightly below min range`;
      } else {
        budgetScore = 0;
        budgetDetail = `${formatP(targetP)} outside specified price range`;
      }
    } else if (budget > 0 && price > 0) {
      const ratio = price / budget;
      if (ratio <= 1.0) {
        budgetScore = 15;
        budgetDetail = `${formatP(price)} within ${formatP(budget)} budget`;
      } else if (ratio <= 1.10) {
        budgetScore = 10;
        budgetDetail = `${formatP(price)} slightly over ${formatP(budget)} (+${Math.round((ratio - 1) * 100)}%)`;
      } else if (ratio <= 1.25) {
        budgetScore = 5;
        budgetDetail = `${formatP(price)} over ${formatP(budget)} (+${Math.round((ratio - 1) * 100)}%)`;
      } else {
        budgetScore = 0;
        budgetDetail = `${formatP(price)} exceeds ${formatP(budget)}`;
      }
    } else {
      budgetScore = 15;
      budgetDetail = 'Any budget';
    }
    matchReasons.push({ factor: 'Budget', score: budgetScore, maxScore: 15, detail: budgetDetail });

    // ── Factor 5: Area Fit (15 pts) ──
    const propAreaSqFt = parseAreaToSqFt(prop.area);
    const reqAreaRange = parseAreaRange(req.requiredArea);
    let areaScore = 0;
    let areaDetail = '';

    if (propAreaSqFt !== null && (reqAreaRange.min !== null || reqAreaRange.max !== null)) {
      const formatArea = (sqft) => {
        if (sqft >= 43560) return `${(sqft / 43560).toFixed(1)} acres`;
        if (sqft >= 435.6) return `${Math.round(sqft)} sq ft`;
        return `${sqft} sq ft`;
      };

      if (reqAreaRange.min !== null && reqAreaRange.max !== null && reqAreaRange.min !== reqAreaRange.max) {
        if (propAreaSqFt >= reqAreaRange.min && propAreaSqFt <= reqAreaRange.max) {
          areaScore = 15;
          areaDetail = `${formatArea(propAreaSqFt)} within ${formatArea(reqAreaRange.min)}-${formatArea(reqAreaRange.max)} range`;
        } else {
          const rangeCenter = (reqAreaRange.min + reqAreaRange.max) / 2;
          const rangeSpan = reqAreaRange.max - reqAreaRange.min;
          const deviation = Math.abs(propAreaSqFt - rangeCenter) / (rangeSpan / 2);
          if (deviation <= 1.2) {
            areaScore = 8;
            areaDetail = `${formatArea(propAreaSqFt)} near ${formatArea(reqAreaRange.min)}-${formatArea(reqAreaRange.max)} range`;
          } else if (deviation <= 1.5) {
            areaScore = 3;
            areaDetail = `${formatArea(propAreaSqFt)} outside range`;
          } else {
            areaDetail = `${formatArea(propAreaSqFt)} far from range`;
          }
        }
      } else {
        const targetArea = reqAreaRange.min || reqAreaRange.max;
        if (targetArea) {
          const ratio = propAreaSqFt / targetArea;
          if (ratio >= 0.8 && ratio <= 1.2) {
            areaScore = 15;
            areaDetail = `${formatArea(propAreaSqFt)} ≈ ${formatArea(targetArea)} (±20%)`;
          } else if (ratio >= 0.6 && ratio <= 1.4) {
            areaScore = 8;
            areaDetail = `${formatArea(propAreaSqFt)} close to ${formatArea(targetArea)}`;
          } else if (ratio >= 0.4 && ratio <= 1.6) {
            areaScore = 3;
            areaDetail = `${formatArea(propAreaSqFt)} differs from ${formatArea(targetArea)}`;
          } else {
            areaDetail = `${formatArea(propAreaSqFt)} far from ${formatArea(targetArea)}`;
          }
        }
      }
    } else {
      areaScore = 15;
      areaDetail = 'Any area';
    }
    matchReasons.push({ factor: 'Area', score: areaScore, maxScore: 15, detail: areaDetail });

    // ── Final Score ──
    const totalScore = Math.min(100, Math.max(0,
      districtScore + localityResult.score + typeScore + budgetScore + areaScore
    ));

    // Quality Tier classification
    let matchQuality = 'Good Match';
    if (totalScore >= 90) matchQuality = '90%+ Top Choice Match';
    else if (totalScore >= 75) matchQuality = 'Strong Match';

    return { matchScore: totalScore, matchQuality, matchReasons };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MATCH LOOKUP — Find matching buyers for a property (and vice versa)
  // ═══════════════════════════════════════════════════════════════════════════

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

    return requirements.map(req => {
      const result = computeMatchScore(prop, req);
      if (!result) return null;
      return { ...req, matchScore: result.matchScore, matchQuality: result.matchQuality, matchReasons: result.matchReasons };
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

    return properties.map(prop => {
      const result = computeMatchScore(prop, req);
      if (!result) return null;
      return { ...prop, matchScore: result.matchScore, matchQuality: result.matchQuality, matchReasons: result.matchReasons };
    }).filter(item => item !== null && item.matchScore >= 60).sort((a, b) => b.matchScore - a.matchScore);
  }, [properties, requirements]);

  // Sanitize and filter match results strictly (ensuring backend responses don't include cross-state/district items)
  const sanitizeMatches = useCallback((target, list) => {
    if (!Array.isArray(list) || !target) return list || [];
    const targetDist = (target.district || '').toLowerCase().trim();
    const targetState = (target.state || '').toLowerCase().trim();
    const targetLoc = (target.location || target.preferredLocation || '').toLowerCase().trim();
    const targetIsRent = (target.listingType || target.requirementType || '').toLowerCase() === 'rent';

    return list.filter(item => {
      // 1. Hard filter: Transaction type (Rent with Rent, Sale with Buy)
      const itemIsRent = (item.listingType || item.requirementType || '').toLowerCase() === 'rent';
      if (targetIsRent !== itemIsRent) return false;

      // 2. Hard filter: State must match
      const itemState = (item.state || '').toLowerCase().trim();
      if (targetState && itemState && targetState !== itemState) return false;

      // 3. Hard filter: District matching
      const itemDist = (item.district || '').toLowerCase().trim();
      const itemLoc = (item.location || item.preferredLocation || '').toLowerCase().trim();

      if (targetDist && itemDist && targetDist !== itemDist) {
        return false; // Disqualify cross-district items (e.g. Kannur for Palakkad)
      }

      // 4. Hard filter: Locality matching if both specify locality
      if (targetLoc && itemLoc) {
        const locRes = computeLocalityScore(targetLoc, itemLoc, targetDist, itemDist);
        if (locRes.isOverlap === false) return false;
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
      computeMatchScore,
      computePropertyMatchesLocally,
      computeRequirementMatchesLocally,
      importHistory,
      bulkAddItems,
      revertImportBatch
    }}>
      {children}
    </PropertyContext.Provider>
  );
};

export const usePropertyContext = () => React.useContext(PropertyContext);


