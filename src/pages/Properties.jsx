import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PropertyContext } from '../context/PropertyContext';
import { AuthContext } from '../context/AuthContext';
import { sellPropertySchema, buyRequirementSchema } from '../schemas/formSchemas';
import SchemaForm from '../components/SchemaForm';
import LocationSelector from '../components/LocationSelector';
import SharePropertyModal from '../components/SharePropertyModal';
import Modal from '../components/Modal';
import { 
  MapPin, 
  Ruler, 
  Phone, 
  User, 
  Search, 
  Tag,
  Edit3,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Upload,
  Sparkles,
  PlusCircle,
  ArrowRight,
  ArrowLeft,
  Share2,
  ChevronDown,
  ChevronUp,
  Eye,
  Building2,
  Calendar,
  FileSpreadsheet,
  SlidersHorizontal,
  RotateCcw,
  Filter
} from 'lucide-react';
import ExcelImportModal from '../components/ExcelImportModal';

export default function Properties() {
  const { user } = useContext(AuthContext);
  const { 
    properties, 
    requirements, 
    addProperty,
    addRequirement,
    updateProperty,
    deleteProperty,
    updateRequirement,
    deleteRequirement,
    updatePropertyStatus, 
    updateRequirementStatus,
    isPropertySharingEnabled,
    getPropertyMatches,
    getRequirementMatches,
    computeMatchScore,
    computePropertyMatchesLocally,
    computeRequirementMatchesLocally
  } = useContext(PropertyContext);

  const location = useLocation();
  const navigate = useNavigate();

  // Active tab state: 'listings' | 'requirements'
  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname === '/properties/requirements' || location.pathname === '/properties/buy') {
      return 'requirements';
    }
    return 'listings';
  });

  // Inline view state: 'list' | 'addProperty' | 'addRequirement'
  const [view, setView] = useState('list');

  // Full Details Popup Modal State: { type: 'property' | 'requirement', item: any }
  const [viewingDetailTarget, setViewingDetailTarget] = useState(null);

  useEffect(() => {
    if (location.pathname === '/properties/requirements' || location.pathname === '/properties/buy') {
      setActiveTab('requirements');
    } else {
      setActiveTab('listings');
    }

    // Reset all open modal/form states when navigating between tabs or sections
    setView('list');
    setIsAddPropertyOpen(false);
    setAddPropertyResult(null);
    setIsAddRequirementOpen(false);
    setAddRequirementResult(null);
    setEditingProperty(null);
    setEditingRequirement(null);
    setDeletingTarget(null);
    setActiveMatchTarget(null);
    setExpandedBreakdowns({});
    setMatchFilter('all');
    setSharingTarget(null);
    setViewingDetailTarget(null);
    
    const currentParams = new URLSearchParams(location.search);
    const q = currentParams.get('search') || '';
    setSearchQuery(q);
    
    setStatusFilter('');
  }, [location.pathname, location.search]);

  const [searchQuery, setSearchQuery] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('search') || '';
  });
  const [statusFilter, setStatusFilter] = useState('');

  // Expandable cards state: { [id]: boolean }
  const [expandedCards, setExpandedCards] = useState({});
  const toggleCardExpanded = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Toast notification state
  const [toast, setToast] = useState(null);

  // Add Property Modal State
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [addPropertyResult, setAddPropertyResult] = useState(null);
  const [isSubmittingAddProp, setIsSubmittingAddProp] = useState(false);

  // Add Requirement Modal State
  const [isAddRequirementOpen, setIsAddRequirementOpen] = useState(false);
  const [addRequirementResult, setAddRequirementResult] = useState(null);
  const [isSubmittingAddReq, setIsSubmittingAddReq] = useState(false);

  // Edit Property Modal State
  const [editingProperty, setEditingProperty] = useState(null);
  const [editPropForm, setEditPropForm] = useState({
    title: '',
    listingType: 'Sale',
    propertyType: 'Plot/Land',
    location: '',
    district: '',
    state: '',
    area: '',
    expectedPrice: '',
    monthlyRent: '',
    securityDeposit: '',
    description: '',
    ownerName: '',
    phoneNumber: '',
    ownerAddress: '',
    imageUrl: ''
  });
  const [editPropError, setEditPropError] = useState(null);
  const [isSubmittingEditProp, setIsSubmittingEditProp] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [videoLoadError, setVideoLoadError] = useState(false);

  // Edit Requirement Modal State
  const [editingRequirement, setEditingRequirement] = useState(null);
  const [editReqForm, setEditReqForm] = useState({
    requirementTitle: '',
    requirementType: 'Buy',
    propertyType: 'Plot/Land',
    preferredLocation: '',
    district: '',
    state: '',
    requiredArea: '',
    budget: '',
    maximumMonthlyRent: '',
    description: '',
    buyerName: '',
    phoneNumber: '',
    buyerAddress: ''
  });
  const [editReqError, setEditReqError] = useState(null);
  const [isSubmittingEditReq, setIsSubmittingEditReq] = useState(false);

  // Delete Confirmation State
  const [deletingTarget, setDeletingTarget] = useState(null); // { type: 'property' | 'requirement', item: object }
  const [deleteError, setDeleteError] = useState(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Matches Modal State
  const [activeMatchTarget, setActiveMatchTarget] = useState(null);
  const [matchResults, setMatchResults] = useState([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [expandedBreakdowns, setExpandedBreakdowns] = useState({});
  const [matchFilter, setMatchFilter] = useState('all'); // 'all' | 'top'
  const [isManualFilterOpen, setIsManualFilterOpen] = useState(false);
  const [manualFilterForm, setManualFilterForm] = useState({
    listingType: 'Sale',
    district: '',
    location: '',
    propertyType: '',
    price: '',
    area: '',
    minScore: 60
  });
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Property Sharing State ({ property: object, buyer: object })
  const [sharingTarget, setSharingTarget] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const parsePriceWithUnit = (val, unit, areaStr = '1') => {
    const num = Number(val || 0);
    if (isNaN(num) || num <= 0) return 0;
    
    const unitLower = String(unit || '').toLowerCase();
    
    let basePrice = num;
    if (unitLower.includes('crore')) basePrice = num * 10000000;
    else if (unitLower.includes('lakh')) basePrice = num * 100000;
    else if (unitLower.includes('thousand')) basePrice = num * 1000;

    return basePrice;
  };

  const parseDepositVal = (val, unit, rentVal = 0) => {
    const num = Number(val || 0);
    if (isNaN(num) || num <= 0) return 0;
    if (unit === 'Months') {
      const rent = Number(rentVal || 0);
      return rent > 0 ? num * rent : num;
    }
    return num;
  };

  const parseAreaWithUnit = (val, unit) => {
    if (!val) return '';
    const strVal = String(val).trim();
    const numMatch = strVal.match(/^([\d.,\s]+)/);
    const numPart = numMatch ? numMatch[1].trim() : strVal;
    if (unit && unit !== '—' && unit !== 'Any Area') {
      const cleanUnit = unit.replace(/^\/\s*/, '');
      return `${numPart} ${cleanUnit}`;
    }
    return strVal;
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return '—';
    const num = Number(price);
    if (isNaN(num)) return price;
    if (num >= 10000000) {
      const v = num / 10000000;
      return `₹${v % 1 === 0 ? v : v.toFixed(2)} Crore`;
    }
    if (num >= 100000) {
      const v = num / 100000;
      return `₹${v % 1 === 0 ? v : v.toFixed(2)} Lakh`;
    }
    if (num >= 1000) {
      const v = num / 1000;
      return `₹${v % 1 === 0 ? v : v.toFixed(2)} Thousand`;
    }
    return `₹${num}`;
  };

  const formatDisplayArea = (areaStr, areaUnitStr) => {
    if (!areaStr) return '—';
    let s = String(areaStr).trim();
    if (s === '—' || s === 'Any Area') return s;

    if (areaUnitStr && areaUnitStr !== '—' && areaUnitStr !== 'Any Area') {
      const cleanUnit = String(areaUnitStr).trim().replace(/^\/\s*/, '');
      if (!s.toLowerCase().includes(cleanUnit.toLowerCase())) {
        s = `${s} ${cleanUnit}`;
      }
    }

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
  };

  const cleanUnitName = (str) => {
    if (!str) return '';
    let s = String(str).trim().replace(/^\/\s*/, '');
    if (s.toLowerCase() === 'all properties') return 'All Properties';

    const recognizedUnits = [
      '5+ BHK', '4+ BHK', '4 BHK', '3 BHK', '2 BHK', '1 BHK',
      'Sq. Meter', 'Sq. Yard', 'Sq. Ft.', 'House', 'Month',
      'Cent', 'Acre', 'BHK'
    ];

    let lastMatchUnit = null;
    let maxIdx = -1;

    for (const u of recognizedUnits) {
      const idx = s.toLowerCase().lastIndexOf(u.toLowerCase());
      if (idx > maxIdx) {
        maxIdx = idx;
        lastMatchUnit = u;
      }
    }

    if (lastMatchUnit) {
      return lastMatchUnit;
    }

    return s;
  };

  const getItemUnitText = (item, type) => {
    if (!item) return '';
    const isProp = type === 'property';
    const isRent = isProp ? item.listingType === 'Rent' : item.requirementType === 'Rent';

    let unit = isProp
      ? (isRent ? item.monthlyRentUnit : item.expectedPriceUnit)
      : (isRent ? item.maximumMonthlyRentUnit : item.budgetUnit);

    if (!unit) {
      if (isRent) {
        unit = '/ Month';
      } else {
        let areaUnitStr = isProp ? item.areaUnit : item.requiredAreaUnit;
        if (!areaUnitStr) {
          const areaVal = String((isProp ? item.area : item.requiredArea) || '').trim();
          const match = areaVal.match(/^[0-9.,\s]*(.+)$/);
          if (match && match[1]) {
            const extracted = match[1].trim();
            if (extracted && extracted !== '—' && extracted !== 'Any Area') {
              areaUnitStr = extracted;
            }
          }
        }
        if (areaUnitStr && areaUnitStr !== '—' && areaUnitStr !== 'Any Area') {
          unit = `/ ${areaUnitStr.replace(/^\/\s*/, '')}`;
        } else {
          unit = 'All Properties';
        }
      }
    }

    if (unit === 'All Properties') {
      return 'All Properties';
    }

    const cleaned = cleanUnitName(unit);
    if (!cleaned) return '';
    if (cleaned === 'All Properties') return 'All Properties';
    return `/ ${cleaned}`;
  };

  // Statuses list
  const propertyStatuses = ['Available', 'Under Negotiation', 'Sold', 'Inactive'];
  const requirementStatuses = ['Active', 'Fulfilled', 'Suspended'];
  const propertyTypes = ['Plot/Land', 'House/Villa', 'Apartment/Flat', 'Residential Plot', 'Commercial Plot', 'Agricultural Land', 'Industrial Plot'];

  // Filtering listings
  const filteredProperties = properties.filter(prop => {
    const matchesSearch = (prop.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (prop.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (prop.district || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (prop.state || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (prop.ownerName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? prop.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  // Filtering requirements
  const filteredRequirements = requirements.filter(req => {
    const matchesSearch = (req.preferredLocation || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (req.district || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (req.state || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (req.buyerName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? req.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  // Handle Add Property Submission
  const handleAddPropertySubmit = async (formData) => {
    setIsSubmittingAddProp(true);
    try {
      const formattedData = {
        ...formData,
        area: parseAreaWithUnit(formData.area, formData.areaUnit || 'Cent'),
        expectedPrice: parsePriceWithUnit(formData.expectedPrice, formData.expectedPriceUnit || '/ Cent', formData.area),
        monthlyRent: parsePriceWithUnit(formData.monthlyRent, formData.monthlyRentUnit || '/ Month', formData.area),
        securityDeposit: parseDepositVal(formData.securityDeposit, formData.securityDepositUnit, formData.monthlyRent),
        imageUrl: formData.imageUrl || ''
      };
      const res = await addProperty(formattedData);

      if (res && res.success) {
        setAddPropertyResult(res);
        showToast('Property created successfully in PostgreSQL database!');
      } else {
        showToast(res?.error || 'Failed to create property. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Error submitting property:', err);
      showToast(err.message || 'An error occurred while saving the property.', 'error');
    } finally {
      setIsSubmittingAddProp(false);
    }
  };

  // Handle Add Requirement Submission
  const handleAddRequirementSubmit = async (formData) => {
    setIsSubmittingAddReq(true);
    try {
      const formattedData = {
        ...formData,
        requiredArea: parseAreaWithUnit(formData.requiredArea, formData.requiredAreaUnit || 'Cent'),
        budget: parsePriceWithUnit(formData.budget, formData.budgetUnit || '/ Cent', formData.requiredArea),
        maximumMonthlyRent: parsePriceWithUnit(formData.maximumMonthlyRent, formData.maximumMonthlyRentUnit || '/ Month', formData.requiredArea)
      };
      const res = await addRequirement(formattedData);

      if (res && res.success) {
        setAddRequirementResult(res);
        showToast('Buyer requirement created successfully in PostgreSQL database!');
      } else {
        showToast(res?.error || 'Failed to create buyer requirement. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Error submitting requirement:', err);
      showToast(err.message || 'An error occurred while saving the requirement.', 'error');
    } finally {
      setIsSubmittingAddReq(false);
    }
  };


  // Open Edit Property Modal
  const handleOpenEditProperty = (prop) => {
    setEditingProperty(prop);

    let areaVal = prop.area || '';
    let areaUnitVal = 'Cent';
    if (areaVal) {
      const match = String(areaVal).match(/^([\d.]+)\s*(.*)$/);
      if (match) {
        areaVal = match[1];
        if (match[2]) areaUnitVal = match[2].trim();
      }
    }

    let priceVal = prop.expectedPrice !== undefined ? prop.expectedPrice : '';
    let priceUnitVal = prop.expectedPriceUnit || `/${areaUnitVal}`;

    let rentVal = prop.monthlyRent !== undefined ? prop.monthlyRent : '';
    let rentUnitVal = prop.monthlyRentUnit || '/ Month';

    setEditPropForm({
      title: prop.title || '',
      propertyType: prop.propertyType || 'Plot/Land',
      location: prop.location || '',
      district: prop.district || '',
      state: prop.state || '',
      area: areaVal,
      areaUnit: areaUnitVal,
      expectedPrice: priceVal,
      expectedPriceUnit: priceUnitVal,
      monthlyRent: rentVal,
      monthlyRentUnit: rentUnitVal,
      securityDeposit: prop.securityDeposit || '',
      securityDepositUnit: 'Thousand',
      description: prop.description || '',
      keywords: Array.isArray(prop.keywords) ? prop.keywords : [],
      ownerName: prop.ownerName || '',
      phoneNumber: prop.phoneNumber || prop.ownerPhone || '',
      ownerAddress: prop.ownerAddress || '',
      status: prop.status || 'Available',
      imageUrl: prop.imageUrl || '',
      videoUrl: prop.videoUrl || prop.video_url || prop.video || '',
      video: prop.videoUrl || prop.video_url || prop.video || '',
      listingType: prop.listingType || 'Sale'
    });
    setEditPropError(null);
  };

  // Save Edit Property
  const handleSaveEditProperty = async (e) => {
    e.preventDefault();
    if (!editingProperty) return;

    setIsSubmittingEditProp(true);
    setEditPropError(null);

    try {
      const formattedPayload = {
        ...editPropForm,
        videoUrl: editPropForm.videoUrl || editPropForm.video || '',
        video: editPropForm.videoUrl || editPropForm.video || '',
        area: parseAreaWithUnit(editPropForm.area, editPropForm.areaUnit || 'Cent'),
        expectedPrice: parsePriceWithUnit(editPropForm.expectedPrice, editPropForm.expectedPriceUnit || '/ Cent'),
        monthlyRent: parsePriceWithUnit(editPropForm.monthlyRent, editPropForm.monthlyRentUnit || '/ Month'),
        securityDeposit: parseDepositVal(editPropForm.securityDeposit, editPropForm.securityDepositUnit, editPropForm.monthlyRent)
      };

      const res = await updateProperty(editingProperty.id, formattedPayload);

      if (res && res.success) {
        setEditingProperty(null);
        showToast('Property updated successfully!', 'success');
      } else {
        setEditPropError(res?.error || 'Failed to update property. Please try again.');
      }
    } catch (err) {
      console.error('Error updating property:', err);
      setEditPropError(err.message || 'An error occurred while updating the property.');
    } finally {
      setIsSubmittingEditProp(false);
    }
  };

  // Open Edit Requirement Modal
  const handleOpenEditRequirement = (req) => {
    setEditingRequirement(req);

    let reqAreaVal = req.requiredArea || '';
    let reqAreaUnitVal = 'Cent';
    if (reqAreaVal) {
      const match = String(reqAreaVal).match(/^([\d.]+)\s*(.*)$/);
      if (match) {
        reqAreaVal = match[1];
        if (match[2]) reqAreaUnitVal = match[2].trim();
      }
    }

    let budgetVal = req.budget !== undefined ? req.budget : '';
    let budgetUnitVal = req.budgetUnit || `/${reqAreaUnitVal}`;
    let maxRentUnitVal = req.maximumMonthlyRentUnit || '/ Month';

    setEditReqForm({
      requirementTitle: req.requirementTitle || '',
      propertyType: req.propertyType || 'Plot/Land',
      preferredLocation: req.preferredLocation || '',
      district: req.district || '',
      state: req.state || '',
      requiredArea: reqAreaVal,
      requiredAreaUnit: reqAreaUnitVal,
      budget: budgetVal,
      budgetUnit: budgetUnitVal,
      maximumMonthlyRent: req.maximumMonthlyRent || '',
      maximumMonthlyRentUnit: maxRentUnitVal,
      description: req.description || '',
      buyerName: req.buyerName || '',
      phoneNumber: req.phoneNumber || req.buyerPhone || '',
      buyerAddress: req.buyerAddress || '',
      status: req.status || 'Active',
      requirementType: req.requirementType || 'Buy'
    });
    setEditReqError(null);
  };

  // Save Edit Requirement
  const handleSaveEditRequirement = async (e) => {
    e.preventDefault();
    if (!editingRequirement) return;

    setIsSubmittingEditReq(true);
    setEditReqError(null);

    const formattedPayload = {
      ...editReqForm,
      requiredArea: parseAreaWithUnit(editReqForm.requiredArea, editReqForm.requiredAreaUnit || 'Cent'),
      budget: parsePriceWithUnit(editReqForm.budget, editReqForm.budgetUnit || '/ Cent'),
      maximumMonthlyRent: parsePriceWithUnit(editReqForm.maximumMonthlyRent, editReqForm.maximumMonthlyRentUnit || '/ Month')
    };

    const res = await updateRequirement(editingRequirement.id, formattedPayload);
    setIsSubmittingEditReq(false);

    if (res && res.success) {
      setEditingRequirement(null);
      showToast('Buyer requirement updated successfully!', 'success');
    } else {
      setEditReqError(res?.error || 'Failed to update requirement. Please try again.');
    }
  };

  // Confirm Delete Action
  const handleConfirmDelete = async () => {
    if (!deletingTarget) return;
    if (user?.role !== 'Admin') {
      setDeleteError('Access denied. Staff members cannot delete records.');
      return;
    }

    setIsSubmittingDelete(true);
    setDeleteError(null);

    let res;
    if (deletingTarget.type === 'property') {
      res = await deleteProperty(deletingTarget.item.id);
    } else {
      res = await deleteRequirement(deletingTarget.item.id);
    }
    setIsSubmittingDelete(false);

    if (res && res.success) {
      setDeletingTarget(null);
      showToast(`${deletingTarget.type === 'property' ? 'Property' : 'Buyer requirement'} deleted successfully!`, 'success');
    } else {
      setDeleteError(res?.error || 'Failed to delete record. Please try again.');
    }
  };

  // Apply manual criteria filter to find matching buyers / properties with high accuracy
  const handleApplyManualFilter = (customForm) => {
    if (!activeMatchTarget) return;
    const isPropTarget = activeMatchTarget.type === 'property';
    const isRent = customForm.listingType === 'Rent';

    const areaCombined = customForm.area ? `${customForm.area} ${customForm.areaUnit || 'Cent'}` : '';

    if (isPropTarget) {
      // Searching for matching requirements (buyers)
      const mockProp = {
        listingType: customForm.listingType,
        district: customForm.district,
        location: customForm.location,
        propertyType: customForm.propertyType,
        expectedPrice: isRent ? 0 : Number(customForm.price || 0),
        monthlyRent: isRent ? Number(customForm.price || 0) : 0,
        area: areaCombined,
        state: activeMatchTarget.data?.state || 'Kerala'
      };

      const matches = requirements.map(req => {
        const result = computeMatchScore ? computeMatchScore(mockProp, req) : null;
        if (!result) return null;
        return {
          ...req,
          matchScore: result.matchScore,
          matchQuality: result.matchQuality,
          matchReasons: result.matchReasons
        };
      }).filter(item => item !== null && item.matchScore >= Number(customForm.minScore || 50))
        .sort((a, b) => b.matchScore - a.matchScore);

      setMatchResults(matches);
    } else {
      // Searching for matching properties
      const mockReq = {
        requirementType: customForm.listingType,
        district: customForm.district,
        preferredLocation: customForm.location,
        propertyType: customForm.propertyType,
        budget: isRent ? 0 : Number(customForm.price || 0),
        maximumMonthlyRent: isRent ? Number(customForm.price || 0) : 0,
        requiredArea: areaCombined,
        state: activeMatchTarget.data?.state || 'Kerala'
      };

      const matches = properties.map(prop => {
        const result = computeMatchScore ? computeMatchScore(prop, mockReq) : null;
        if (!result) return null;
        return {
          ...prop,
          matchScore: result.matchScore,
          matchQuality: result.matchQuality,
          matchReasons: result.matchReasons
        };
      }).filter(item => item !== null && item.matchScore >= Number(customForm.minScore || 50))
        .sort((a, b) => b.matchScore - a.matchScore);

      setMatchResults(matches);
    }
  };

  const handleOpenSmartMatchSearch = () => {
    const defaultProp = {
      title: 'Custom Criteria Search',
      listingType: 'Sale',
      district: 'Palakkad',
      location: '',
      propertyType: 'Plot/Land',
      expectedPrice: '',
      area: ''
    };
    const defaultForm = {
      listingType: 'Sale',
      district: 'Palakkad',
      location: '',
      propertyType: 'Plot/Land',
      price: '',
      area: '',
      areaUnit: 'Cent',
      minScore: 50
    };
    setActiveMatchTarget({ type: 'property', data: defaultProp, isManualSearch: true });
    setExpandedBreakdowns({});
    setMatchFilter('all');
    setIsManualFilterOpen(true);
    setManualFilterForm(defaultForm);

    const isRent = defaultForm.listingType === 'Rent';
    const mockProp = {
      listingType: defaultForm.listingType,
      district: defaultForm.district,
      location: defaultForm.location,
      propertyType: defaultForm.propertyType,
      expectedPrice: 0,
      monthlyRent: 0,
      area: '',
      state: 'Kerala'
    };
    const matches = requirements.map(req => {
      const result = computeMatchScore ? computeMatchScore(mockProp, req) : null;
      if (!result) return null;
      return {
        ...req,
        matchScore: result.matchScore,
        matchQuality: result.matchQuality,
        matchReasons: result.matchReasons
      };
    }).filter(item => item !== null && item.matchScore >= Number(defaultForm.minScore || 50))
      .sort((a, b) => b.matchScore - a.matchScore);

    setMatchResults(matches);
    setIsLoadingMatches(false);
  };

  // Open Matches Modal
  const handleOpenMatches = async (type, item) => {
    setActiveMatchTarget({ type, data: item });
    setExpandedBreakdowns({});
    setMatchFilter('all');
    setIsManualFilterOpen(false);

    const isRent = ((item?.listingType || item?.requirementType) || '').toLowerCase() === 'rent';
    const priceVal = item?.expectedPrice || item?.monthlyRent || item?.budget || item?.maximumMonthlyRent || '';
    const initFilter = {
      listingType: isRent ? 'Rent' : 'Sale',
      district: item?.district || '',
      location: item?.location || item?.preferredLocation || '',
      propertyType: item?.propertyType || '',
      price: priceVal || '',
      area: item?.area || item?.requiredArea || '',
      areaUnit: 'Cent',
      minScore: 50
    };
    setManualFilterForm(initFilter);

    // 1. Instantly calculate and display matches with 0ms delay directly from item
    const instantMatches = type === 'property'
      ? (computePropertyMatchesLocally ? computePropertyMatchesLocally(item) : [])
      : (computeRequirementMatchesLocally ? computeRequirementMatchesLocally(item) : []);

    setMatchResults(instantMatches || []);
    setIsLoadingMatches(false);

    // 2. Fetch from backend in background without locking modal
    try {
      let results = [];
      if (type === 'property') {
        results = await getPropertyMatches(item.id || item.propertyId || item._id, item);
      } else {
        results = await getRequirementMatches(item.id || item.requirementId || item._id, item);
      }
      if (results && results.length > 0) {
        setMatchResults(results);
      }
    } catch (err) {
      console.warn('Matching check error:', err);
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setEditPropForm(prev => ({ ...prev, imageUrl: previewUrl, imageFile: file }));
    }
  };

  const handleVideoFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setEditPropForm(prev => ({ ...prev, videoUrl: previewUrl, video: previewUrl, videoFile: file }));
    }
  };

  return (
    <div className="space-y-6 font-sans relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center space-x-3 text-sm font-medium transition-all ${
          toast.type === 'error' 
            ? 'bg-red-50 border-red-200 text-red-800' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
          <button 
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-[24px] font-bold text-slate-900 tracking-tight">
            {activeTab === 'listings' ? 'Property Listings' : 'Buyer Requirements'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {activeTab === 'listings' 
              ? 'Manage all registered seller lands and properties in PostgreSQL.' 
              : 'Manage client buying criteria and search requirements.'
            }
          </p>
        </div>

        {/* Primary Action Button */}
        {view === 'list' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenSmartMatchSearch}
              className="inline-flex items-center justify-center space-x-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Smart Match Finder</span>
            </button>
            <button
              onClick={async () => {
                if (!window.confirm("Delete ALL old Excel data?")) return;
                try {
                  const items = properties.filter(p => p.importBatchId || (p.description && p.description.includes('Broker Details')));
                  for (const p of items) await deleteProperty(p.id);
                  const reqs = requirements.filter(r => r.importBatchId || (r.description && r.description.includes('Broker Details')));
                  for (const r of reqs) await deleteRequirement(r.id);
                  showToast(`Wiped ${items.length + reqs.length} excel records!`);
                } catch(e) {}
              }}
              className="inline-flex items-center justify-center space-x-2 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer"
            >
              <span>WIPE OLD EXCEL DATA</span>
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center justify-center space-x-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Import Excel / CSV</span>
            </button>
            {activeTab === 'listings' ? (
              <button
                onClick={() => { setView('addProperty'); setAddPropertyResult(null); }}
                className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-[#B0004F] hover:bg-[#C4005A] active:bg-[#80003C] text-white rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add New Property</span>
              </button>
            ) : (
              <button
                onClick={() => { setView('addRequirement'); setAddRequirementResult(null); }}
                className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-[#B0004F] hover:bg-[#C4005A] active:bg-[#80003C] text-white rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Buyer Requirement</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filters Panel — only on list view */}
      {view === 'list' && (
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'listings' ? 'Search by title, location, owner...' : 'Search requirements, buyer, location...'}
            className="w-full pl-9 pr-4 py-2 border border-[#E8E8E8] rounded-lg text-sm bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F] transition-colors"
          />
        </div>

        {/* Status Filter */}
        <div className="relative w-full md:w-48">
          <Tag className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-[#E8E8E8] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F] transition-colors cursor-pointer"
          >
            <option value="">All Statuses</option>
            {activeTab === 'listings' ? (
              propertyStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))
            ) : (
              requirementStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))
            )}
          </select>
        </div>
      </div>
      )}

      {/* ── INLINE ADD FORM VIEW ── */}
      {view === 'addProperty' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden animate-fade-in">
          {/* Form header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
            <button
              type="button"
              onClick={() => { setView('list'); setAddPropertyResult(null); }}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              title="Back to listings"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h3 className="font-bold text-[15px] text-slate-900">Register New Property</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Fill in the details below to add a property listing.</p>
            </div>
          </div>

          <div className="px-6 py-6">
            {addPropertyResult ? (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-5 flex flex-col items-center justify-center text-center space-y-1.5">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  <h3 className="font-bold text-base text-slate-900">Property Registered Successfully!</h3>
                  <p className="text-xs text-slate-500">Saved to database and visible in Property Listings.</p>
                </div>
                {addPropertyResult.matches && addPropertyResult.matches.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Sparkles className="w-4 h-4 text-[#B0004F]" />
                      <h4 className="font-bold text-slate-900 text-sm">Matching Buyers</h4>
                      <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FFF1F6] text-[#B0004F] border border-[#B0004F]/20">
                        {addPropertyResult.matches.length} Found
                      </span>
                    </div>
                    {addPropertyResult.matches.map((m, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">{m.matchScore}% Match</span>
                          <span className="font-bold text-[#B0004F] text-xs">{formatPrice(m.budget)}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800">{m.propertyType} — {m.preferredLocation}, {m.district}</p>
                        <p className="text-xs text-slate-500">{m.buyerName} · {m.phoneNumber}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => { setView('list'); setAddPropertyResult(null); }}
                    className="h-9 px-6 bg-[#B0004F] hover:bg-[#9A0044] text-white text-xs font-semibold rounded-full shadow-sm transition-all cursor-pointer"
                  >
                    Done — Back to Listings
                  </button>
                </div>
              </div>
            ) : (
              <SchemaForm
                schema={sellPropertySchema}
                onSubmit={handleAddPropertySubmit}
                onCancel={() => { setView('list'); setAddPropertyResult(null); }}
                submitLabel={isSubmittingAddProp ? 'Saving...' : 'Register Property'}
              />
            )}
          </div>
        </div>
      )}

      {view === 'addRequirement' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden animate-fade-in">
          {/* Form header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
            <button
              type="button"
              onClick={() => { setView('list'); setAddRequirementResult(null); }}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              title="Back to requirements"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h3 className="font-bold text-[15px] text-slate-900">Register Buyer Requirement</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Fill in the buyer's needs to register a search requirement.</p>
            </div>
          </div>

          <div className="px-6 py-6">
            {addRequirementResult ? (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-5 flex flex-col items-center justify-center text-center space-y-1.5">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  <h3 className="font-bold text-base text-slate-900">Requirement Saved Successfully!</h3>
                  <p className="text-xs text-slate-500">Saved to database and visible in Buyer Requirements.</p>
                </div>
                {addRequirementResult.matches && addRequirementResult.matches.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Sparkles className="w-4 h-4 text-[#B0004F]" />
                      <h4 className="font-bold text-slate-900 text-sm">Matching Properties</h4>
                      <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FFF1F6] text-[#B0004F] border border-[#B0004F]/20">
                        {addRequirementResult.matches.length} Found
                      </span>
                    </div>
                    {addRequirementResult.matches.map((m, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">{m.matchScore}% Match</span>
                          <span className="font-bold text-[#B0004F] text-xs">{formatPrice(m.expectedPrice)}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800">{m.title}</p>
                        <p className="text-xs text-slate-500">{m.location}, {m.district} · {m.ownerName} · {m.phoneNumber}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => { setView('list'); setAddRequirementResult(null); }}
                    className="h-9 px-6 bg-[#B0004F] hover:bg-[#9A0044] text-white text-xs font-semibold rounded-full shadow-sm transition-all cursor-pointer"
                  >
                    Done — Back to Requirements
                  </button>
                </div>
              </div>
            ) : (
              <SchemaForm
                schema={buyRequirementSchema}
                onSubmit={handleAddRequirementSubmit}
                onCancel={() => { setView('list'); setAddRequirementResult(null); }}
                submitLabel={isSubmittingAddReq ? 'Saving...' : 'Register Requirement'}
              />
            )}
          </div>
        </div>
      )}

      {/* ── GRID LIST ── only shown on list view */}
      {view === 'list' && (<>
      {activeTab === 'listings' ? (
        filteredProperties.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 border-dashed text-slate-400">
            No properties match your active search filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredProperties.map(prop => (
              <div key={prop.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.08)] hover:border-slate-300/80 transition-all duration-200 overflow-hidden flex flex-col group">
                {/* Image */}
                <div 
                  onClick={() => setViewingDetailTarget({ type: 'property', item: prop })}
                  className="h-44 w-full relative bg-slate-100 overflow-hidden flex-shrink-0 cursor-pointer"
                  title="Click to view full property details"
                >
                  <img 
                    src={prop.imageUrl} 
                    alt={prop.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
                  
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="bg-white/90 backdrop-blur-md text-slate-800 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-xs">
                      {prop.propertyType}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs ${
                      prop.listingType === 'Rent'
                        ? 'bg-violet-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}>
                      {prop.listingType || 'Sale'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 
                        onClick={() => setViewingDetailTarget({ type: 'property', item: prop })}
                        className="font-bold text-base sm:text-[17px] text-slate-900 leading-snug flex-1 min-w-0 hover:text-[#B0004F] transition-colors cursor-pointer"
                        title="Click to view full property details"
                      >
                        {prop.title}
                      </h3>
                      <div className="text-right shrink-0">
                        {prop.listingType === 'Rent' ? (
                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Rent</span>
                            <span className="font-extrabold text-base sm:text-[17px] text-slate-900 tracking-tight block">
                              {formatPrice(prop.monthlyRent)}
                              <span className="text-xs font-normal text-slate-400 ml-0.5">/mo</span>
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Price</span>
                            <span className="font-extrabold text-base sm:text-[17px] text-slate-900 tracking-tight block">
                              {formatPrice(prop.expectedPrice)}
                              <span className="text-xs font-normal text-slate-500 ml-0.5">
                                {prop.expectedPriceUnit && prop.expectedPriceUnit !== 'All Properties' ? prop.expectedPriceUnit : ''}
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Location Chip */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 max-w-full">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{prop.location}, {prop.district}{prop.state ? `, ${prop.state}` : ''}</span>
                      </div>
                    </div>

                    {prop.description && (
                      <div className="pt-2 text-[13px] text-slate-500 line-clamp-2 leading-relaxed">
                        {prop.description}
                      </div>
                    )}
                  </div>

                  {/* Bottom Action / Status Bar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center space-x-2 shrink-0">
                      {user?.role === 'Admin' ? (
                        <select
                          value={prop.status}
                          onChange={(e) => updatePropertyStatus(prop.id, e.target.value)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border focus:outline-none transition-colors cursor-pointer ${
                            prop.status === 'Available' ? 'bg-emerald-50/80 border-emerald-200/80 text-emerald-700' :
                            prop.status === 'Under Negotiation' ? 'bg-amber-50/80 border-amber-200/80 text-amber-700' :
                            prop.status === 'Sold' ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-red-50/80 border-red-200/80 text-red-700'
                          }`}
                        >
                          {propertyStatuses.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                          prop.status === 'Available' ? 'bg-emerald-50/80 border-emerald-200/80 text-emerald-700' :
                          prop.status === 'Under Negotiation' ? 'bg-amber-50/80 border-amber-200/80 text-amber-700' :
                          prop.status === 'Sold' ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-red-50/80 border-red-200/80 text-red-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            prop.status === 'Available' ? 'bg-emerald-500' :
                            prop.status === 'Under Negotiation' ? 'bg-amber-500' :
                            prop.status === 'Sold' ? 'bg-slate-400' : 'bg-red-500'
                          }`} />
                          <span>{prop.status}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 justify-start sm:justify-end flex-wrap">
                      <button
                        onClick={() => setViewingDetailTarget({ type: 'property', item: prop })}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 transition-all cursor-pointer"
                        title="View full property details in popup"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>View Details</span>
                      </button>

                      <button
                        onClick={() => setSharingTarget({ property: prop, buyer: null })}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200/60 transition-all cursor-pointer"
                        title="Get & Share Public Link via WhatsApp or Copy"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share Link</span>
                      </button>
                      
                      <button
                        onClick={() => handleOpenMatches('property', prop)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-[#B0004F] hover:bg-[#B0004F] hover:text-white transition-all cursor-pointer"
                        title="View Matching Buyers"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Matching Buyers</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        filteredRequirements.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 border-dashed text-slate-400">
            No buyer requirements match your active search filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredRequirements.map(req => (
              <div key={req.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.08)] hover:border-slate-300/80 transition-all duration-200 p-5 sm:p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Card Header: Type Badge, Property Type & Budget */}
                  <div className="flex items-center justify-between gap-3">
                    <div 
                      onClick={() => setViewingDetailTarget({ type: 'requirement', item: req })}
                      className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                      title="Click to view full requirement details"
                    >
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        req.requirementType === 'Rent'
                          ? 'bg-violet-50 text-violet-700 border border-violet-100'
                          : 'bg-rose-50 text-[#B0004F] border border-rose-100'
                      }`}>
                        {req.requirementType === 'Rent' ? 'Rent' : 'Buy'}
                      </span>
                      <h3 className="font-bold text-base sm:text-[17px] text-slate-900 tracking-tight truncate hover:text-[#B0004F] transition-colors">
                        {req.buyerName || req.requirementTitle || req.propertyType}
                      </h3>
                      {req.buyerName && (
                        <span className="text-sm font-medium text-slate-500 truncate">
                          ({req.propertyType})
                        </span>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                        {req.requirementType === 'Rent' ? 'Max Rent' : 'Budget'}
                      </span>
                      <span className="font-extrabold text-base sm:text-[17px] text-slate-900 tracking-tight block">
                        {req.requirementType === 'Rent' 
                          ? formatPrice(req.maximumMonthlyRent)
                          : formatPrice(req.budget)}
                        <span className="text-xs font-normal text-slate-500 ml-0.5">
                          {req.requirementType === 'Rent' 
                            ? (req.maximumMonthlyRentUnit && req.maximumMonthlyRentUnit !== 'All Properties' ? req.maximumMonthlyRentUnit : '')
                            : (req.budgetUnit && req.budgetUnit !== 'All Properties' ? req.budgetUnit : '')}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Tags / Chips Row */}
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 max-w-full">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{req.preferredLocation}, {req.district}{req.state ? `, ${req.state}` : ''}</span>
                    </div>
                    {req.requiredArea && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 max-w-full">
                        <Ruler className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{req.requiredArea} {req.requiredAreaUnit}</span>
                      </div>
                    )}
                  </div>

                  {req.description && (
                    <div className="pt-2 text-[13px] text-slate-500 line-clamp-2 leading-relaxed">
                      {req.description}
                    </div>
                  )}
                </div>

                {/* Bottom Action / Status Bar */}
                <div className="pt-3 mt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center space-x-2 shrink-0">
                    {user?.role === 'Admin' ? (
                      <select
                        value={req.status}
                        onChange={(e) => updateRequirementStatus(req.id, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border focus:outline-none transition-colors cursor-pointer ${
                          req.status === 'Active' ? 'bg-emerald-50/80 border-emerald-200/80 text-emerald-700' :
                          req.status === 'Fulfilled' ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-red-50/80 border-red-200/80 text-red-700'
                        }`}
                      >
                        {requirementStatuses.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                        req.status === 'Active' ? 'bg-emerald-50/80 border-emerald-200/80 text-emerald-700' :
                        req.status === 'Fulfilled' ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-red-50/80 border-red-200/80 text-red-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          req.status === 'Active' ? 'bg-emerald-500' :
                          req.status === 'Fulfilled' ? 'bg-slate-400' : 'bg-red-500'
                        }`} />
                        <span>{req.status}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 justify-start sm:justify-end">
                    <button
                      onClick={() => setViewingDetailTarget({ type: 'requirement', item: req })}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 transition-all cursor-pointer"
                      title="View full requirement details in popup"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>View Details</span>
                    </button>

                    <button
                      onClick={() => handleOpenMatches('requirement', req)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-[#B0004F] hover:bg-[#B0004F] hover:text-white transition-all cursor-pointer"
                      title="View Matching Properties"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Matching Properties</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ADD PROPERTY MODAL — replaced by inline view */}
      </>)}

      {/* FULL DETAILS POPUP MODAL */}
      {viewingDetailTarget && (
        <Modal
          isOpen={!!viewingDetailTarget}
          onClose={() => setViewingDetailTarget(null)}
          title={viewingDetailTarget.type === 'property'
            ? viewingDetailTarget.item.title
            : (viewingDetailTarget.item.requirementTitle || `${viewingDetailTarget.item.propertyType} Requirement`)}
          subtitle={viewingDetailTarget.type === 'property'
            ? `${viewingDetailTarget.item.location}, ${viewingDetailTarget.item.district}${viewingDetailTarget.item.state ? `, ${viewingDetailTarget.item.state}` : ''}`
            : `${viewingDetailTarget.item.preferredLocation}, ${viewingDetailTarget.item.district}${viewingDetailTarget.item.state ? `, ${viewingDetailTarget.item.state}` : ''}`}
          icon={Building2}
          badge={
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                (viewingDetailTarget.item.requirementType === 'Rent' || viewingDetailTarget.item.listingType === 'Rent')
                  ? 'bg-violet-50 text-violet-700 border border-violet-100'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              }`}>
                {viewingDetailTarget.type === 'property'
                  ? (viewingDetailTarget.item.listingType || 'Sale')
                  : (viewingDetailTarget.item.requirementType === 'Rent' ? 'Rent Requirement' : 'Buy Requirement')}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${
                viewingDetailTarget.item.status === 'Available' || viewingDetailTarget.item.status === 'Active'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : viewingDetailTarget.item.status === 'Under Negotiation'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {viewingDetailTarget.item.status}
              </span>
            </div>
          }
          size="xl"
          footer={
            <div className="flex flex-wrap items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const target = viewingDetailTarget;
                    setViewingDetailTarget(null);
                    handleOpenMatches(target.type, target.item);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-rose-50 text-[#B0004F] hover:bg-[#B0004F] hover:text-white transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{viewingDetailTarget.type === 'property' ? 'View Matching Buyers' : 'View Matching Properties'}</span>
                </button>

                {viewingDetailTarget.type === 'property' && (
                  <button
                    onClick={() => {
                      const propObj = viewingDetailTarget.item;
                      setViewingDetailTarget(null);
                      setSharingTarget({ property: propObj, buyer: null });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200/80 transition-all cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Public Link</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const target = viewingDetailTarget;
                    setViewingDetailTarget(null);
                    if (target.type === 'property') {
                      handleOpenEditProperty(target.item);
                    } else {
                      handleOpenEditRequirement(target.item);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                {user?.role === 'Admin' && (
                  <button
                    onClick={() => {
                      const target = viewingDetailTarget;
                      setViewingDetailTarget(null);
                      setDeletingTarget({ type: target.type, item: target.item });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
                <button
                  onClick={() => setViewingDetailTarget(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          }
        >
          {/* Media Container: Image or Video */}
          {viewingDetailTarget.type === 'property' && (
            <div className="space-y-3">
              {viewingDetailTarget.item.imageUrl && (
                <div className="h-48 sm:h-56 max-h-[30vh] w-full rounded-xl overflow-hidden bg-slate-100 relative shadow-inner">
                  <img 
                    src={viewingDetailTarget.item.imageUrl} 
                    alt={viewingDetailTarget.item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                </div>
              )}

              {/* Video Player in Popup */}
              {viewingDetailTarget.item.videoUrl && (
                <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md">
                  {viewingDetailTarget.item.videoUrl.includes('youtu') || viewingDetailTarget.item.videoUrl.includes('embed') ? (
                    <iframe
                      src={viewingDetailTarget.item.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                      title="Property Video"
                      className="w-full h-44 rounded-xl border-0"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={viewingDetailTarget.item.videoUrl}
                      controls
                      className="w-full max-h-44 object-cover rounded-xl"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Title & Financials */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="min-w-0 flex-1">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {viewingDetailTarget.type === 'property' 
                  ? viewingDetailTarget.item.title
                  : (viewingDetailTarget.item.requirementTitle || `${viewingDetailTarget.item.propertyType} Requirement`)}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {viewingDetailTarget.type === 'property'
                    ? `${viewingDetailTarget.item.location}, ${viewingDetailTarget.item.district}${viewingDetailTarget.item.state ? `, ${viewingDetailTarget.item.state}` : ''}`
                    : `${viewingDetailTarget.item.preferredLocation}, ${viewingDetailTarget.item.district}${viewingDetailTarget.item.state ? `, ${viewingDetailTarget.item.state}` : ''}`}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 px-3.5 py-2 rounded-xl text-left sm:text-right shrink-0">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                {viewingDetailTarget.item.listingType === 'Rent' || viewingDetailTarget.item.requirementType === 'Rent'
                  ? 'Rent'
                  : 'Price / Budget'}
              </span>
              <span className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight block">
                {viewingDetailTarget.type === 'property'
                  ? (viewingDetailTarget.item.listingType === 'Rent'
                      ? formatPrice(viewingDetailTarget.item.monthlyRent)
                      : formatPrice(viewingDetailTarget.item.expectedPrice))
                  : (viewingDetailTarget.item.requirementType === 'Rent'
                      ? formatPrice(viewingDetailTarget.item.maximumMonthlyRent)
                      : formatPrice(viewingDetailTarget.item.budget))}
              </span>
              {getItemUnitText(viewingDetailTarget.item, viewingDetailTarget.type) && (
                <span className="text-[10.5px] font-bold text-[#B0004F] bg-[#B0004F]/10 px-2 py-0.5 rounded-md inline-block mt-0.5">
                  {getItemUnitText(viewingDetailTarget.item, viewingDetailTarget.type)}
                </span>
              )}
            </div>
          </div>

          {/* Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Property Type</span>
              <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">{viewingDetailTarget.item.propertyType}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                {viewingDetailTarget.type === 'property' ? 'Area / Size' : 'Required Area'}
              </span>
              <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">
                {viewingDetailTarget.type === 'property' 
                  ? formatDisplayArea(viewingDetailTarget.item.area) 
                  : formatDisplayArea(viewingDetailTarget.item.requiredArea)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Location / City</span>
              <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">
                {viewingDetailTarget.type === 'property' ? viewingDetailTarget.item.location : viewingDetailTarget.item.preferredLocation}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">District</span>
              <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">{viewingDetailTarget.item.district || '—'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">State</span>
              <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">{viewingDetailTarget.item.state || '—'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Registered Date</span>
              <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">
                {viewingDetailTarget.item.createdAt 
                  ? new Date(viewingDetailTarget.item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'Recently'}
              </span>
            </div>
          </div>

          {/* Keywords Section */}
          {Array.isArray(viewingDetailTarget.item.keywords) && viewingDetailTarget.item.keywords.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">Property Keywords</h4>
              <div className="flex flex-wrap gap-1.5">
                {viewingDetailTarget.item.keywords.map((kw, kIdx) => (
                  <span key={kIdx} className="px-2.5 py-1 rounded-lg bg-rose-50 text-[#B0004F] border border-rose-100/80 text-xs font-semibold">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description & Remarks */}
          {viewingDetailTarget.item.description && (
            <div className="space-y-1.5">
              <h4 className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">Description & Remarks</h4>
              <p className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-wrap">
                {viewingDetailTarget.item.description}
              </p>
            </div>
          )}


          {/* Hello Properties Contact Details Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5">
            <h4 className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
              Hello Properties Support
            </h4>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#B0004F] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                  HP
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Hello Properties Support
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    +91 98765 43210
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a 
                  href="tel:9876543210"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-xs font-semibold transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>Call</span>
                </a>
                <a 
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white text-xs font-semibold transition-all"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* EDIT PROPERTY MODAL */}
      {editingProperty && (
        <Modal
          isOpen={!!editingProperty}
          onClose={() => setEditingProperty(null)}
          title="Edit Property"
          subtitle="Update listing details, pricing, location, or contact information."
          icon={Edit3}
          size="2xl"
        >
          <form onSubmit={handleSaveEditProperty} className="space-y-6 font-sans">
            {editPropError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{editPropError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              <div className="flex flex-col space-y-1.5">
                <label className="text-[14px] font-medium text-slate-800 flex items-center">
                  Listing Type <span className="text-[#B0004F] ml-1 font-bold">*</span>
                </label>
                <select
                  value={editPropForm.listingType}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditPropForm(prev => ({
                      ...prev,
                      listingType: val,
                      ...(val === 'Sale' ? { monthlyRent: '', securityDeposit: '' } : { expectedPrice: '' })
                    }));
                  }}
                  className="w-full px-4 h-[52px] border border-slate-200 rounded-[10px] text-sm sm:text-base bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F] cursor-pointer"
                >
                  <option value="Sale">Sale</option>
                  <option value="Rent">Rent</option>
                </select>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[14px] font-medium text-slate-800 flex items-center">
                  Property Type <span className="text-[#B0004F] ml-1 font-bold">*</span>
                </label>
                <select
                  value={editPropForm.propertyType}
                  onChange={(e) => setEditPropForm({ ...editPropForm, propertyType: e.target.value })}
                  className="w-full px-4 h-[52px] border border-slate-200 rounded-[10px] text-sm sm:text-base bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F] cursor-pointer"
                >
                  {propertyTypes.map(pt => (
                    <option key={pt} value={pt}>{pt}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 flex flex-col space-y-1.5">
                <label className="text-[14px] font-medium text-slate-800 flex items-center">
                  Property Title <span className="text-[#B0004F] ml-1 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editPropForm.title}
                  onChange={(e) => setEditPropForm({ ...editPropForm, title: e.target.value })}
                  className="w-full px-4 h-[52px] border border-slate-200 rounded-[10px] text-sm sm:text-base bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F]"
                />
              </div>

              <LocationSelector
                formData={editPropForm}
                onChange={(fieldOrObj, val) => {
                  setEditPropForm(prev => {
                    if (typeof fieldOrObj === 'object' && fieldOrObj !== null) {
                      return { ...prev, ...fieldOrObj };
                    }
                    return { ...prev, [fieldOrObj]: val };
                  });
                }}
                locationFieldName="location"
                isEdit={true}
              />

              <div className="flex flex-col space-y-1.5">
                <label className="text-[14px] font-medium text-slate-800 flex items-center">
                  Area <span className="text-[#B0004F] ml-1 font-bold">*</span>
                </label>
                <div className="relative flex items-center h-[52px] border border-slate-200 rounded-[10px] bg-white focus-within:ring-2 focus-within:ring-[#B0004F]/10 focus-within:border-[#B0004F] transition-all">
                  <input
                    type="text"
                    required
                    value={editPropForm.area}
                    onChange={(e) => setEditPropForm({ ...editPropForm, area: e.target.value })}
                    placeholder="e.g. 45"
                    className="flex-1 min-w-0 h-full px-4 text-sm sm:text-base bg-transparent text-slate-800 focus:outline-none"
                  />
                  <div className="h-6 w-px bg-slate-200 shrink-0" />
                  <div className="relative w-[105px] shrink-0 h-full flex items-center">
                    <select
                      value={editPropForm.areaUnit || 'Cent'}
                      onChange={(e) => {
                        const val = e.target.value;
                        const cleanUnit = String(val).replace(/^\/\s*/, '').trim();
                        setEditPropForm({ 
                          ...editPropForm, 
                          areaUnit: val,
                          expectedPriceUnit: `/ ${cleanUnit}`,
                          monthlyRentUnit: `/ ${cleanUnit}`
                        });
                      }}
                      className="w-full h-full pl-3 pr-7 text-sm font-medium text-slate-700 bg-transparent appearance-none focus:outline-none cursor-pointer"
                    >
                      <option value="Cent">Cent</option>
                      <option value="Sq. Ft.">Sq. Ft.</option>
                      <option value="Acre">Acre</option>
                      <option value="BHK">BHK</option>
                      <option value="1 BHK">1 BHK</option>
                      <option value="2 BHK">2 BHK</option>
                      <option value="3 BHK">3 BHK</option>
                      <option value="4 BHK">4 BHK</option>
                      <option value="5+ BHK">5+ BHK</option>
                      <option value="Sq. Meter">Sq. Meter</option>
                      <option value="Sq. Yard">Sq. Yard</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {editPropForm.listingType === 'Rent' ? (
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[14px] font-medium text-slate-800 flex items-center">
                    Rent (₹) <span className="text-[#B0004F] ml-1 font-bold">*</span>
                  </label>
                  <div className="relative flex items-center h-[52px] border border-slate-200 rounded-[10px] bg-white focus-within:ring-2 focus-within:ring-[#B0004F]/10 focus-within:border-[#B0004F] transition-all">
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={editPropForm.monthlyRent}
                      onChange={(e) => setEditPropForm({ ...editPropForm, monthlyRent: e.target.value })}
                      placeholder="e.g. 18000"
                      className="flex-1 min-w-0 h-full px-4 text-sm sm:text-base bg-transparent text-slate-800 focus:outline-none"
                    />
                    <div className="h-6 w-px bg-slate-200 shrink-0" />
                    <div className="relative w-[115px] shrink-0 h-full flex items-center">
                      <select
                        value={editPropForm.monthlyRentUnit || '/ Month'}
                        onChange={(e) => setEditPropForm({ ...editPropForm, monthlyRentUnit: e.target.value })}
                        className="w-full h-full pl-3 pr-7 text-sm font-medium text-slate-700 bg-transparent appearance-none focus:outline-none cursor-pointer"
                      >
                        <option value="/ Month">/ Month</option>
                        <option value="All Properties">All Properties</option>
                        <option value="/ Sq. Ft.">/ Sq. Ft.</option>
                        <option value="/ Cent">/ Cent</option>
                        <option value="/ Acre">/ Acre</option>
                        <option value="/ BHK">/ BHK</option>
                        <option value="/ House">/ House</option>
                        <option value="/ Sq. Meter">/ Sq. Meter</option>
                        <option value="/ Sq. Yard">/ Sq. Yard</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[14px] font-medium text-slate-800 flex items-center">
                    Expected Price (₹) <span className="text-[#B0004F] ml-1 font-bold">*</span>
                  </label>
                  <div className="relative flex items-center h-[52px] border border-slate-200 rounded-[10px] bg-white focus-within:ring-2 focus-within:ring-[#B0004F]/10 focus-within:border-[#B0004F] transition-all">
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={editPropForm.expectedPrice}
                      onChange={(e) => setEditPropForm({ ...editPropForm, expectedPrice: e.target.value })}
                      placeholder="e.g. 5000000"
                      className="flex-1 min-w-0 h-full px-4 text-sm sm:text-base bg-transparent text-slate-800 focus:outline-none"
                    />
                    <div className="h-6 w-px bg-slate-200 shrink-0" />
                    <div className="relative w-[105px] shrink-0 h-full flex items-center">
                      <select
                        value={editPropForm.expectedPriceUnit || `/ ${editPropForm.areaUnit || 'Cent'}`}
                        onChange={(e) => setEditPropForm({ ...editPropForm, expectedPriceUnit: e.target.value })}
                        className="w-full h-full pl-3 pr-7 text-sm font-medium text-slate-700 bg-transparent appearance-none focus:outline-none cursor-pointer"
                      >
                        <option value="/ Cent">/ Cent</option>
                        <option value="/ Sq. Ft.">/ Sq. Ft.</option>
                        <option value="/ Acre">/ Acre</option>
                        <option value="All Properties">All Properties</option>
                        <option value="/ Month">/ Month</option>
                        <option value="/ BHK">/ BHK</option>
                        <option value="/ House">/ House</option>
                        <option value="/ Sq. Meter">/ Sq. Meter</option>
                        <option value="/ Sq. Yard">/ Sq. Yard</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}

              {/* Image URL / Upload Image */}
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[13.5px] font-semibold text-slate-800 flex items-center">
                    Image URL / Upload Image
                  </label>
                  {editPropForm.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setEditPropForm(prev => ({ ...prev, imageUrl: '', imageFile: null }))}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Image</span>
                    </button>
                  )}
                </div>

                {editPropForm.imageUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center gap-3 p-3">
                    <div className="relative w-full sm:w-36 h-28 shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200/80 shadow-xs">
                      {imageLoadError ? (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-slate-100 text-slate-400">
                          <ImagePlus className="w-6 h-6 mb-1 text-slate-300" />
                          <span className="text-[11px] font-medium text-slate-500">Preview unavailable</span>
                        </div>
                      ) : (
                        <img
                          src={editPropForm.imageUrl}
                          alt="Property Preview"
                          className="w-full h-full object-cover"
                          onError={() => setImageLoadError(true)}
                          onLoad={() => setImageLoadError(false)}
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 w-full flex flex-col gap-2">
                      <input
                        type="text"
                        value={editPropForm.imageUrl}
                        onChange={(e) => {
                          setImageLoadError(false);
                          setEditPropForm({ ...editPropForm, imageUrl: e.target.value });
                        }}
                        placeholder="https://..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#B0004F]"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400 truncate">
                          {editPropForm.imageFile ? editPropForm.imageFile.name : 'Image URL linked'}
                        </span>
                        <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0">
                          <Upload className="w-3.5 h-3.5 text-slate-600" />
                          <span>Replace</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input
                      type="text"
                      value={editPropForm.imageUrl || ''}
                      onChange={(e) => {
                        setImageLoadError(false);
                        setEditPropForm({ ...editPropForm, imageUrl: e.target.value });
                      }}
                      placeholder="Paste Image URL (https://...)"
                      className="flex-1 px-4 h-[52px] border border-slate-200 rounded-[10px] text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F]"
                    />
                    <label className="h-[52px] px-4 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-[10px] text-xs font-semibold text-slate-700 flex items-center justify-center space-x-2 cursor-pointer transition-colors whitespace-nowrap shrink-0">
                      <Upload className="w-4 h-4 text-slate-600" />
                      <span>Upload Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Video URL / Upload Video */}
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[13.5px] font-semibold text-slate-800 flex items-center">
                    Video URL / Upload Video
                  </label>
                  {(editPropForm.videoUrl || editPropForm.video) && (
                    <button
                      type="button"
                      onClick={() => setEditPropForm(prev => ({ ...prev, videoUrl: '', video: '', videoFile: null }))}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Video</span>
                    </button>
                  )}
                </div>

                {(editPropForm.videoUrl || editPropForm.video) ? (
                  <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center gap-3 p-3">
                    <div className="relative w-full sm:w-44 h-32 shrink-0 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shadow-xs flex items-center justify-center">
                      {videoLoadError ? (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-slate-900 text-slate-400">
                          <Film className="w-6 h-6 mb-1 text-slate-500" />
                          <span className="text-[11px] font-medium text-slate-400">Preview unavailable</span>
                        </div>
                      ) : (() => {
                        const vUrl = editPropForm.videoUrl || editPropForm.video || '';
                        if (vUrl.includes('youtu') || vUrl.includes('embed')) {
                          return (
                            <iframe
                              src={vUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                              title="Video Preview"
                              className="w-full h-full rounded-lg border-0"
                              allowFullScreen
                              onError={() => setVideoLoadError(true)}
                            />
                          );
                        }
                        return (
                          <video
                            src={vUrl}
                            controls
                            className="w-full h-full object-cover rounded-lg"
                            onError={() => setVideoLoadError(true)}
                            onLoadedData={() => setVideoLoadError(false)}
                          />
                        );
                      })()}
                    </div>

                    <div className="flex-1 min-w-0 w-full flex flex-col gap-2">
                      <input
                        type="text"
                        value={editPropForm.videoUrl || editPropForm.video || ''}
                        onChange={(e) => {
                          setVideoLoadError(false);
                          setEditPropForm({ ...editPropForm, videoUrl: e.target.value, video: e.target.value });
                        }}
                        placeholder="YouTube link or video URL..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#B0004F]"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400 truncate">
                          {editPropForm.videoFile ? editPropForm.videoFile.name : 'Video URL linked'}
                        </span>
                        <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0">
                          <Upload className="w-3.5 h-3.5 text-slate-600" />
                          <span>Replace</span>
                          <input
                            type="file"
                            accept="video/*"
                            onChange={handleVideoFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input
                      type="text"
                      value={editPropForm.videoUrl || editPropForm.video || ''}
                      onChange={(e) => {
                        setVideoLoadError(false);
                        setEditPropForm({ ...editPropForm, videoUrl: e.target.value, video: e.target.value });
                      }}
                      placeholder="YouTube link or Video URL (https://...)"
                      className="flex-1 px-4 h-[52px] border border-slate-200 rounded-[10px] text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F]"
                    />
                    <label className="h-[52px] px-4 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-[10px] text-xs font-semibold text-slate-700 flex items-center justify-center space-x-2 cursor-pointer transition-colors whitespace-nowrap shrink-0">
                      <Upload className="w-4 h-4 text-slate-600" />
                      <span>Upload Video</span>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingProperty(null)}
                disabled={isSubmittingEditProp}
                className="w-full sm:w-auto h-[52px] px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-[10px] transition-all cursor-pointer flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingEditProp}
                className="w-full sm:w-auto h-[52px] px-7 bg-[#B0004F] hover:bg-[#C4005A] text-white text-sm font-semibold rounded-[10px] shadow-sm transition-all cursor-pointer flex items-center justify-center"
              >
                {isSubmittingEditProp ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* EDIT REQUIREMENT MODAL */}
      {editingRequirement && (
        <Modal
          isOpen={!!editingRequirement}
          onClose={() => setEditingRequirement(null)}
          title="Edit Buyer Requirement"
          subtitle="Update buyer criteria, budget, location preferences, or contact information."
          icon={Edit3}
          size="2xl"
        >
          <form onSubmit={handleSaveEditRequirement} className="space-y-6 font-sans">
            {editReqError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{editReqError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              <div className="flex flex-col space-y-1.5">
                <label className="text-[14px] font-medium text-slate-800 flex items-center">
                  Requirement Type <span className="text-[#B0004F] ml-1 font-bold">*</span>
                </label>
                <select
                  value={editReqForm.requirementType}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditReqForm(prev => ({
                      ...prev,
                      requirementType: val,
                      ...(val === 'Buy' ? { maximumMonthlyRent: '' } : { budget: '' })
                    }));
                  }}
                  className="w-full px-4 h-[52px] border border-slate-200 rounded-[10px] text-sm sm:text-base bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F] cursor-pointer"
                >
                  <option value="Buy">Buy</option>
                  <option value="Rent">Rent</option>
                </select>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[14px] font-medium text-slate-800 flex items-center">
                  Buyer Name <span className="text-[#B0004F] ml-1 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editReqForm.buyerName}
                  onChange={(e) => setEditReqForm({ ...editReqForm, buyerName: e.target.value })}
                  className="w-full px-4 h-[52px] border border-slate-200 rounded-[10px] text-sm sm:text-base bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F]"
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[14px] font-medium text-slate-800 flex items-center">
                  Buyer Phone <span className="text-[#B0004F] ml-1 font-bold">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={editReqForm.phoneNumber}
                  onChange={(e) => setEditReqForm({ ...editReqForm, phoneNumber: e.target.value })}
                  className="w-full px-4 h-[52px] border border-slate-200 rounded-[10px] text-sm sm:text-base bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F]"
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[14px] font-medium text-slate-800 flex items-center">
                  Property Type <span className="text-[#B0004F] ml-1 font-bold">*</span>
                </label>
                <select
                  value={editReqForm.propertyType}
                  onChange={(e) => setEditReqForm({ ...editReqForm, propertyType: e.target.value })}
                  className="w-full px-4 h-[52px] border border-slate-200 rounded-[10px] text-sm sm:text-base bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F] cursor-pointer"
                >
                  {propertyTypes.map(pt => (
                    <option key={pt} value={pt}>{pt}</option>
                  ))}
                </select>
              </div>

              <LocationSelector
                formData={editReqForm}
                onChange={(fieldOrObj, val) => {
                  setEditReqForm(prev => {
                    if (typeof fieldOrObj === 'object' && fieldOrObj !== null) {
                      return { ...prev, ...fieldOrObj };
                    }
                    return { ...prev, [fieldOrObj]: val };
                  });
                }}
                locationFieldName="preferredLocation"
                allowMultiple={true}
                isEdit={true}
              />

              <div className="flex flex-col space-y-1.5">
                <label className="text-[14px] font-medium text-slate-800 flex items-center">
                  Required Area <span className="text-[#B0004F] ml-1 font-bold">*</span>
                </label>
                <div className="relative flex items-center h-[52px] border border-slate-200 rounded-[10px] bg-white focus-within:ring-2 focus-within:ring-[#B0004F]/10 focus-within:border-[#B0004F] transition-all">
                  <input
                    type="text"
                    required
                    value={editReqForm.requiredArea}
                    onChange={(e) => setEditReqForm({ ...editReqForm, requiredArea: e.target.value })}
                    placeholder="e.g. 50"
                    className="flex-1 min-w-0 h-full px-4 text-sm sm:text-base bg-transparent text-slate-800 focus:outline-none"
                  />
                  <div className="h-6 w-px bg-slate-200 shrink-0" />
                  <div className="relative w-[105px] shrink-0 h-full flex items-center">
                    <select
                      value={editReqForm.requiredAreaUnit || 'Cent'}
                      onChange={(e) => {
                        const val = e.target.value;
                        const cleanUnit = String(val).replace(/^\/\s*/, '').trim();
                        setEditReqForm({ 
                          ...editReqForm, 
                          requiredAreaUnit: val,
                          budgetUnit: `/ ${cleanUnit}`,
                          maximumMonthlyRentUnit: `/ ${cleanUnit}`
                        });
                      }}
                      className="w-full h-full pl-3 pr-7 text-sm font-medium text-slate-700 bg-transparent appearance-none focus:outline-none cursor-pointer"
                    >
                      <option value="Cent">Cent</option>
                      <option value="Sq. Ft.">Sq. Ft.</option>
                      <option value="Acre">Acre</option>
                      <option value="BHK">BHK</option>
                      <option value="1 BHK">1 BHK</option>
                      <option value="2 BHK">2 BHK</option>
                      <option value="3 BHK">3 BHK</option>
                      <option value="4 BHK">4 BHK</option>
                      <option value="5+ BHK">5+ BHK</option>
                      <option value="Sq. Meter">Sq. Meter</option>
                      <option value="Sq. Yard">Sq. Yard</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {editReqForm.requirementType === 'Rent' ? (
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[14px] font-medium text-slate-800 flex items-center">
                    Max Rent (₹) <span className="text-[#B0004F] ml-1 font-bold">*</span>
                  </label>
                  <div className="relative flex items-center h-[52px] border border-slate-200 rounded-[10px] bg-white focus-within:ring-2 focus-within:ring-[#B0004F]/10 focus-within:border-[#B0004F] transition-all">
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={editReqForm.maximumMonthlyRent}
                      onChange={(e) => setEditReqForm({ ...editReqForm, maximumMonthlyRent: e.target.value })}
                      placeholder="e.g. 20000"
                      className="flex-1 min-w-0 h-full px-4 text-sm sm:text-base bg-transparent text-slate-800 focus:outline-none"
                    />
                    <div className="h-6 w-px bg-slate-200 shrink-0" />
                    <div className="relative w-[115px] shrink-0 h-full flex items-center">
                      <select
                        value={editReqForm.maximumMonthlyRentUnit || '/ Month'}
                        onChange={(e) => setEditReqForm({ ...editReqForm, maximumMonthlyRentUnit: e.target.value })}
                        className="w-full h-full pl-3 pr-7 text-sm font-medium text-slate-700 bg-transparent appearance-none focus:outline-none cursor-pointer"
                      >
                        <option value="/ Month">/ Month</option>
                        <option value="All Properties">All Properties</option>
                        <option value="/ Sq. Ft.">/ Sq. Ft.</option>
                        <option value="/ Cent">/ Cent</option>
                        <option value="/ Acre">/ Acre</option>
                        <option value="/ BHK">/ BHK</option>
                        <option value="/ House">/ House</option>
                        <option value="/ Sq. Meter">/ Sq. Meter</option>
                        <option value="/ Sq. Yard">/ Sq. Yard</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[14px] font-medium text-slate-800 flex items-center">
                    Max Purchase Budget (₹) <span className="text-[#B0004F] ml-1 font-bold">*</span>
                  </label>
                  <div className="relative flex items-center h-[52px] border border-slate-200 rounded-[10px] bg-white focus-within:ring-2 focus-within:ring-[#B0004F]/10 focus-within:border-[#B0004F] transition-all">
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={editReqForm.budget}
                      onChange={(e) => setEditReqForm({ ...editReqForm, budget: e.target.value })}
                      placeholder="e.g. 75"
                      className="flex-1 min-w-0 h-full px-4 text-sm sm:text-base bg-transparent text-slate-800 focus:outline-none"
                    />
                    <div className="h-6 w-px bg-slate-200 shrink-0" />
                    <div className="relative w-[115px] shrink-0 h-full flex items-center">
                      <select
                        value={editReqForm.budgetUnit || `/ ${editReqForm.requiredAreaUnit || 'Cent'}`}
                        onChange={(e) => setEditReqForm({ ...editReqForm, budgetUnit: e.target.value })}
                        className="w-full h-full pl-3 pr-7 text-sm font-medium text-slate-700 bg-transparent appearance-none focus:outline-none cursor-pointer"
                      >
                        <option value="/ Cent">/ Cent</option>
                        <option value="/ Sq. Ft.">/ Sq. Ft.</option>
                        <option value="/ Acre">/ Acre</option>
                        <option value="All Properties">All Properties</option>
                        <option value="/ Month">/ Month</option>
                        <option value="/ BHK">/ BHK</option>
                        <option value="/ House">/ House</option>
                        <option value="/ Sq. Meter">/ Sq. Meter</option>
                        <option value="/ Sq. Yard">/ Sq. Yard</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}

              <div className="md:col-span-2 flex flex-col space-y-1.5">
                <label className="text-[14px] font-medium text-slate-800">Description / Remarks</label>
                <textarea
                  rows={3}
                  value={editReqForm.description}
                  onChange={(e) => setEditReqForm({ ...editReqForm, description: e.target.value })}
                  className="w-full p-3.5 border border-slate-200 rounded-[10px] text-sm sm:text-base bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F]"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingRequirement(null)}
                disabled={isSubmittingEditReq}
                className="w-full sm:w-auto h-[52px] px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-[10px] transition-all cursor-pointer flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingEditReq}
                className="w-full sm:w-auto h-[52px] px-7 bg-[#B0004F] hover:bg-[#C4005A] text-white text-sm font-semibold rounded-[10px] shadow-sm transition-all cursor-pointer flex items-center justify-center"
              >
                {isSubmittingEditReq ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingTarget && (
        <Modal
          isOpen={!!deletingTarget}
          onClose={() => setDeletingTarget(null)}
          title={`Delete ${deletingTarget.type === 'property' ? 'Property' : 'Buyer Requirement'}`}
          subtitle="This action will remove the record from PostgreSQL database."
          icon={AlertCircle}
          size="sm"
          footer={
            <div className="flex items-center justify-end space-x-3 w-full">
              <button
                type="button"
                onClick={() => setDeletingTarget(null)}
                disabled={isSubmittingDelete}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmittingDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                {isSubmittingDelete ? 'Deleting...' : 'Delete Record'}
              </button>
            </div>
          }
        >
          <div className="space-y-3 font-sans">
            {deleteError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {deleteError}
              </div>
            )}

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
              <p className="text-sm font-semibold text-slate-800">
                Are you sure you want to delete this {deletingTarget.type}?
              </p>
              <p className="text-xs font-bold text-slate-900 pt-1">
                {deletingTarget.type === 'property' ? deletingTarget.item.title : `${deletingTarget.item.buyerName}'s Requirement`}
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* MATCHES MODAL */}
      {activeMatchTarget && (
        <Modal
          isOpen={!!activeMatchTarget}
          onClose={() => setActiveMatchTarget(null)}
          title={
            activeMatchTarget.type === 'property' 
              ? (activeMatchTarget.data?.listingType === 'Rent' ? 'Matching Rent Customers' : 'Matching Buy Customers')
              : 'Matching Properties'
          }
          subtitle={
            activeMatchTarget.type === 'property' 
              ? `Customers looking for properties like "${activeMatchTarget.data.title}"`
              : `Available properties matching requirement criteria`
          }
          icon={Sparkles}
          size="2xl"
          footer={
            <div className="flex items-center justify-end w-full">
              <button
                onClick={() => setActiveMatchTarget(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          }
        >
          <div className="space-y-4 font-sans">
            {/* Top Matches & Manual Filter Toggle Bar */}
            {!isLoadingMatches && (
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMatchFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      matchFilter === 'all'
                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    All Matches ({matchResults.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatchFilter('top')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      matchFilter === 'top'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    <span>🎯 90%+ Top Choice Only</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      matchFilter === 'top' ? 'bg-emerald-700 text-white' : 'bg-emerald-200 text-emerald-800'
                    }`}>
                      {matchResults.filter(m => m.matchScore >= 90).length}
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsManualFilterOpen(!isManualFilterOpen)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isManualFilterOpen
                      ? 'bg-[#B0004F] text-white shadow-sm'
                      : 'text-slate-700 bg-slate-200/70 hover:bg-slate-200'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{isManualFilterOpen ? 'Hide Custom Filter' : 'Adjust Criteria / Manual Filter'}</span>
                </button>
              </div>
            )}

            {/* Manual Criteria Filter Form Box */}
            {isManualFilterOpen && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 animate-fade-in shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <SlidersHorizontal className="w-4 h-4 text-[#B0004F]" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Filter Matches by Property Details
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleApplyManualFilter(manualFilterForm)}
                      className="px-3.5 py-1.5 bg-[#B0004F] hover:bg-[#8A003E] text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Apply Filter</span>
                    </button>
                    {!activeMatchTarget.isManualSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          const isRent = ((activeMatchTarget.data?.listingType || activeMatchTarget.data?.requirementType) || '').toLowerCase() === 'rent';
                          const priceVal = activeMatchTarget.data?.expectedPrice || activeMatchTarget.data?.monthlyRent || activeMatchTarget.data?.budget || activeMatchTarget.data?.maximumMonthlyRent || '';
                          const resetForm = {
                            listingType: isRent ? 'Rent' : 'Sale',
                            district: activeMatchTarget.data?.district || '',
                            location: activeMatchTarget.data?.location || activeMatchTarget.data?.preferredLocation || '',
                            propertyType: activeMatchTarget.data?.propertyType || '',
                            price: priceVal || '',
                            area: activeMatchTarget.data?.area || activeMatchTarget.data?.requiredArea || '',
                            areaUnit: 'Cent',
                            minScore: 50
                          };
                          setManualFilterForm(resetForm);
                          handleApplyManualFilter(resetForm);
                        }}
                        className="text-[11px] font-semibold text-slate-500 hover:text-[#B0004F] cursor-pointer flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Details</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Transaction Type */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                      Listing Type
                    </label>
                    <select
                      value={manualFilterForm.listingType}
                      onChange={(e) => {
                        const updated = { ...manualFilterForm, listingType: e.target.value };
                        setManualFilterForm(updated);
                        handleApplyManualFilter(updated);
                      }}
                      className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:border-[#B0004F]"
                    >
                      <option value="Sale">Sale / Buy</option>
                      <option value="Rent">Rent</option>
                    </select>
                  </div>

                  {/* District */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">District</label>
                    <select
                      value={manualFilterForm.district}
                      onChange={(e) => {
                        const updated = { ...manualFilterForm, district: e.target.value };
                        setManualFilterForm(updated);
                        handleApplyManualFilter(updated);
                      }}
                      className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:border-[#B0004F]"
                    >
                      <option value="">All / Select District</option>
                      <option value="Palakkad">Palakkad</option>
                      <option value="Malappuram">Malappuram</option>
                      <option value="Ernakulam">Ernakulam</option>
                      <option value="Thrissur">Thrissur</option>
                      <option value="Kozhikode">Kozhikode</option>
                      <option value="Kannur">Kannur</option>
                      <option value="Thiruvananthapuram">Thiruvananthapuram</option>
                      <option value="Kottayam">Kottayam</option>
                      <option value="Wayanad">Wayanad</option>
                      <option value="Idukki">Idukki</option>
                      <option value="Alappuzha">Alappuzha</option>
                      <option value="Kollam">Kollam</option>
                      <option value="Pathanamthitta">Pathanamthitta</option>
                      <option value="Kasaragod">Kasaragod</option>
                    </select>
                  </div>

                  {/* Property Type */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Property Type</label>
                    <select
                      value={manualFilterForm.propertyType}
                      onChange={(e) => {
                        const updated = { ...manualFilterForm, propertyType: e.target.value };
                        setManualFilterForm(updated);
                        handleApplyManualFilter(updated);
                      }}
                      className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:border-[#B0004F]"
                    >
                      <option value="">All Property Types</option>
                      <option value="Plot/Land">Plot/Land</option>
                      <option value="House/Villa">House/Villa</option>
                      <option value="Apartment/Flat">Apartment/Flat</option>
                      <option value="Residential Plot">Residential Plot</option>
                      <option value="Commercial Plot">Commercial Plot</option>
                      <option value="Agricultural Land">Agricultural Land</option>
                      <option value="Industrial Plot">Industrial Plot</option>
                    </select>
                  </div>

                  {/* Location / Locality */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Location / Locality</label>
                    <input
                      type="text"
                      placeholder="e.g. Kanjikode, Stadium Bye Pass"
                      value={manualFilterForm.location}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyManualFilter(manualFilterForm)}
                      onChange={(e) => {
                        const updated = { ...manualFilterForm, location: e.target.value };
                        setManualFilterForm(updated);
                      }}
                      className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:border-[#B0004F]"
                    />
                  </div>

                  {/* Price / Budget */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                      {manualFilterForm.listingType === 'Rent' ? 'Rent (₹/mo)' : 'Price / Budget (₹)'}
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 5000000"
                      value={manualFilterForm.price}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyManualFilter(manualFilterForm)}
                      onChange={(e) => {
                        const updated = { ...manualFilterForm, price: e.target.value };
                        setManualFilterForm(updated);
                      }}
                      className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:border-[#B0004F]"
                    />
                  </div>

                  {/* Area / Size */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Area / Size</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="e.g. 10 or 2000"
                        value={manualFilterForm.area}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyManualFilter(manualFilterForm)}
                        onChange={(e) => {
                          const updated = { ...manualFilterForm, area: e.target.value };
                          setManualFilterForm(updated);
                        }}
                        className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800 focus:outline-none focus:border-[#B0004F]"
                      />
                      <select
                        value={manualFilterForm.areaUnit}
                        onChange={(e) => {
                          const updated = { ...manualFilterForm, areaUnit: e.target.value };
                          setManualFilterForm(updated);
                          handleApplyManualFilter(updated);
                        }}
                        className="w-[90px] text-xs font-semibold bg-white border border-slate-200 rounded-lg px-1.5 py-2 text-slate-800 focus:outline-none focus:border-[#B0004F]"
                      >
                        <option value="Cent">Cent</option>
                        <option value="Sq. Ft.">Sq. Ft.</option>
                        <option value="Acre">Acre</option>
                        <option value="Sq. Meter">Sq. Meter</option>
                        <option value="Sq. Yard">Sq. Yard</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between pt-2.5 border-t border-slate-200/60 gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-semibold text-slate-500">Min Accuracy Score:</span>
                    <select
                      value={manualFilterForm.minScore}
                      onChange={(e) => {
                        const updated = { ...manualFilterForm, minScore: Number(e.target.value) };
                        setManualFilterForm(updated);
                        handleApplyManualFilter(updated);
                      }}
                      className="text-xs font-bold bg-white border border-slate-200 rounded-md px-2 py-1 text-slate-700 focus:outline-none focus:border-[#B0004F]"
                    >
                      <option value={50}>50% (Recommended)</option>
                      <option value={60}>60% (Strict Matches)</option>
                      <option value={40}>40% (Broad Search)</option>
                      <option value={0}>0% (All Items)</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-[11px] font-bold text-[#B0004F]">
                      {matchResults.length} {activeMatchTarget.type === 'property' ? 'matching buyers' : 'matching properties'} found
                    </span>
                    <button
                      type="button"
                      onClick={() => handleApplyManualFilter(manualFilterForm)}
                      className="px-4 py-1.5 bg-[#B0004F] hover:bg-[#8A003E] text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Apply Filter</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isLoadingMatches ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-3 border-[#B0004F] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-600 text-sm font-medium">Finding High-Accuracy Matches...</p>
                <p className="text-xs text-slate-400">Comparing district, locality, type, budget & area</p>
              </div>
            ) : matchResults.length === 0 ? (
              <div className="py-10 text-center border border-slate-200 border-dashed rounded-xl bg-slate-50 space-y-3 px-4">
                <p className="text-sm font-semibold text-slate-700">No matches found above the {manualFilterForm.minScore || 60}% threshold.</p>
                <p className="text-xs text-slate-500">Adjust the location, property type, budget, or accuracy threshold manually to find matching {activeMatchTarget.type === 'property' ? 'customers' : 'properties'}.</p>
                {!isManualFilterOpen && (
                  <button
                    type="button"
                    onClick={() => setIsManualFilterOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#B0004F] hover:bg-[#8A003E] text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>Adjust Match Criteria & Search</span>
                  </button>
                )}
              </div>
            ) : matchFilter === 'top' && matchResults.filter(m => m.matchScore >= 90).length === 0 ? (
              <div className="py-10 text-center border border-emerald-100 rounded-xl bg-emerald-50/50 space-y-2">
                <p className="text-sm font-semibold text-slate-800">No 90%+ Top Choice matches found yet.</p>
                <p className="text-xs text-slate-500">Switch to "All Matches" to see strong matches between 60% and 89%.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(matchFilter === 'top' ? matchResults.filter(m => m.matchScore >= 90) : matchResults).map((matchItem, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-slate-300 transition-all duration-200 space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            (matchItem.requirementType === 'Rent' || matchItem.listingType === 'Rent')
                              ? 'bg-violet-50 text-violet-700 border border-violet-100'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            {matchItem.requirementType 
                              ? (matchItem.requirementType === 'Rent' ? 'Rent Customer' : 'Buy Customer') 
                              : (matchItem.listingType || 'Sale')}
                          </span>

                          {/* Match Quality Badge */}
                          {matchItem.matchScore >= 90 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-sm">
                              <span>🎯 90%+ Top Choice</span>
                              <span className="text-[10px] text-emerald-800 bg-emerald-200/60 px-1 rounded">({matchItem.matchScore}%)</span>
                            </span>
                          ) : matchItem.matchScore >= 75 ? (
                            <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              ⭐ Strong Match ({matchItem.matchScore}%)
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {matchItem.matchScore}% Match
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-900 text-base mt-1.5 truncate">
                          {activeMatchTarget.type === 'property' 
                            ? (matchItem.propertyType || matchItem.requirementTitle || 'Requirement') 
                            : matchItem.title}
                        </h4>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                          {activeMatchTarget.type === 'property' 
                            ? (matchItem.requirementType === 'Rent' ? 'Max Rent' : 'Budget')
                            : (matchItem.listingType === 'Rent' ? 'Rent' : 'Price')}
                        </span>
                        <span className="font-extrabold text-slate-900 text-base">
                          {formatPrice(
                            activeMatchTarget.type === 'property'
                              ? (matchItem.requirementType === 'Rent' ? matchItem.maximumMonthlyRent : matchItem.budget)
                              : (matchItem.listingType === 'Rent' ? matchItem.monthlyRent : matchItem.expectedPrice)
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {activeMatchTarget.type === 'property' ? `${matchItem.preferredLocation}, ${matchItem.district}` : `${matchItem.location}, ${matchItem.district}`}
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600">
                        <Ruler className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {activeMatchTarget.type === 'property' ? (matchItem.requiredArea || 'Any Area') : (matchItem.area || '—')}
                        </span>
                      </div>
                    </div>

                    {matchItem.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{matchItem.description}</p>
                    )}

                    {/* Match Breakdown Toggle */}
                    {matchItem.matchReasons && matchItem.matchReasons.length > 0 && (
                      <div className="border-t border-slate-100 pt-2">
                        <button
                          type="button"
                          onClick={() => setExpandedBreakdowns(prev => ({ ...prev, [idx]: !prev[idx] }))}
                          className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-[#B0004F] transition-colors cursor-pointer group w-full"
                        >
                          {expandedBreakdowns[idx] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          <span>Match Breakdown</span>
                          <div className="flex-1 h-px bg-slate-100 ml-2" />
                        </button>
                        {expandedBreakdowns[idx] && (
                          <div className="mt-2.5 space-y-2 animate-fade-in">
                            {matchItem.matchReasons.map((reason, rIdx) => {
                              const pct = reason.maxScore > 0 ? Math.round((reason.score / reason.maxScore) * 100) : 0;
                              const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : pct > 0 ? 'bg-orange-400' : 'bg-slate-200';
                              const textColor = pct >= 80 ? 'text-emerald-700' : pct >= 50 ? 'text-amber-700' : pct > 0 ? 'text-orange-600' : 'text-slate-400';
                              return (
                                <div key={rIdx} className="flex items-center gap-3">
                                  <div className="w-[85px] shrink-0 text-right">
                                    <span className={`text-[10.5px] font-bold ${textColor}`}>{reason.factor}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${barColor} transition-all duration-500`}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  </div>
                                  <div className="w-[38px] text-right shrink-0">
                                    <span className={`text-[10px] font-bold ${textColor}`}>{reason.score}/{reason.maxScore}</span>
                                  </div>
                                  <div className="hidden sm:block min-w-0 max-w-[180px]">
                                    <span className="text-[10px] text-slate-400 truncate block">{reason.detail}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Customer contact details hidden */}
                    {isPropertySharingEnabled && (
                      <div className="flex items-center justify-end border-t border-slate-100 pt-3 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            const propObj = activeMatchTarget.type === 'property' ? activeMatchTarget.data : matchItem;
                            const buyerObj = activeMatchTarget.type === 'property' ? matchItem : activeMatchTarget.data;
                            setSharingTarget({ property: propObj, buyer: buyerObj });
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200/80 transition-all cursor-pointer"
                          title="Share customer-facing property details via WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Share Property</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* SHARE PROPERTY MODAL (OPTIONAL FEATURE) */}
      {sharingTarget && (
        <SharePropertyModal
          property={sharingTarget.property}
          buyer={sharingTarget.buyer}
          onClose={() => setSharingTarget(null)}
        />
      )}

      {/* EXCEL / CSV BULK IMPORT MODAL */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={(batch) => showToast(`Successfully imported ${batch.totalItems} records from ${batch.fileName}`, 'success')}
      />
    </div>
  );
}
