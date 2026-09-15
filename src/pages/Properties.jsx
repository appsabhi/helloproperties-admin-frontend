import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PropertyContext } from '../context/PropertyContext';
import { AuthContext } from '../context/AuthContext';
import { sellPropertySchema, buyRequirementSchema } from '../schemas/formSchemas';
import SchemaForm from '../components/SchemaForm';
import LocationSelector from '../components/LocationSelector';
import SharePropertyModal from '../components/SharePropertyModal';
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
  Calendar
} from 'lucide-react';

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
    setSharingTarget(null);
    setViewingDetailTarget(null);
    setSearchQuery('');
    setStatusFilter('');
  }, [location.pathname]);

  const [searchQuery, setSearchQuery] = useState('');
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

  // Property Sharing State ({ property: object, buyer: object })
  const [sharingTarget, setSharingTarget] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price || 0);
  };

  // Statuses list
  const propertyStatuses = ['Available', 'Under Negotiation', 'Sold', 'Inactive'];
  const requirementStatuses = ['Active', 'Fulfilled', 'Suspended'];
  const propertyTypes = ['Plot/Land', 'Agricultural Land', 'Commercial Plot', 'Residential Plot', 'House/Villa', 'Industrial Plot'];

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
    const formattedData = {
      ...formData,
      expectedPrice: Number(formData.expectedPrice),
      imageUrl: formData.imageUrl || ''
    };
    const res = await addProperty(formattedData);
    setIsSubmittingAddProp(false);

    if (res) {
      setAddPropertyResult(res);
      showToast('Property created successfully in PostgreSQL database!');
    }
  };

  // Handle Add Requirement Submission
  const handleAddRequirementSubmit = async (formData) => {
    setIsSubmittingAddReq(true);
    const formattedData = {
      ...formData,
      budget: Number(formData.budget)
    };
    const res = await addRequirement(formattedData);
    setIsSubmittingAddReq(false);

    if (res) {
      setAddRequirementResult(res);
      showToast('Buyer requirement created successfully in PostgreSQL database!');
    }
  };

  // Open Edit Property Modal
  const handleOpenEditProperty = (prop) => {
    setEditingProperty(prop);
    setEditPropForm({
      title: prop.title || '',
      propertyType: prop.propertyType || 'Plot/Land',
      location: prop.location || '',
      district: prop.district || '',
      state: prop.state || '',
      area: prop.area || '',
      expectedPrice: prop.expectedPrice !== undefined ? prop.expectedPrice : '',
      description: prop.description || '',
      ownerName: prop.ownerName || '',
      phoneNumber: prop.phoneNumber || prop.ownerPhone || '',
      ownerAddress: prop.ownerAddress || '',
      status: prop.status || 'Available',
      imageUrl: prop.imageUrl || ''
    });
    setEditPropError(null);
  };

  // Save Edit Property
  const handleSaveEditProperty = async (e) => {
    e.preventDefault();
    if (!editingProperty) return;

    setIsSubmittingEditProp(true);
    setEditPropError(null);

    const res = await updateProperty(editingProperty.id, editPropForm);
    setIsSubmittingEditProp(false);

    if (res && res.success) {
      setEditingProperty(null);
      showToast('Property updated successfully!', 'success');
    } else {
      setEditPropError(res?.error || 'Failed to update property. Please try again.');
    }
  };

  // Open Edit Requirement Modal
  const handleOpenEditRequirement = (req) => {
    setEditingRequirement(req);
    setEditReqForm({
      requirementTitle: req.requirementTitle || '',
      propertyType: req.propertyType || 'Plot/Land',
      preferredLocation: req.preferredLocation || '',
      district: req.district || '',
      state: req.state || '',
      requiredArea: req.requiredArea || '',
      budget: req.budget !== undefined ? req.budget : '',
      description: req.description || '',
      buyerName: req.buyerName || '',
      phoneNumber: req.phoneNumber || req.buyerPhone || '',
      buyerAddress: req.buyerAddress || '',
      status: req.status || 'Active'
    });
    setEditReqError(null);
  };

  // Save Edit Requirement
  const handleSaveEditRequirement = async (e) => {
    e.preventDefault();
    if (!editingRequirement) return;

    setIsSubmittingEditReq(true);
    setEditReqError(null);

    const res = await updateRequirement(editingRequirement.id, editReqForm);
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

  // Open Matches Modal
  const handleOpenMatches = async (type, item) => {
    setActiveMatchTarget({ type, data: item });
    setExpandedBreakdowns({});
    
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
        {view === 'list' && (activeTab === 'listings' ? (
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
        ))}
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

                    <div className="flex items-center gap-1.5 justify-start sm:justify-end">
                      <button
                        onClick={() => setViewingDetailTarget({ type: 'property', item: prop })}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 transition-all cursor-pointer"
                        title="View full property details in popup"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>View Details</span>
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
                        {req.propertyType}
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                        {req.requirementType === 'Rent' ? 'Max Rent' : 'Budget'}
                      </span>
                      <span className="font-extrabold text-base sm:text-[17px] text-slate-900 tracking-tight block">
                        {req.requirementType === 'Rent' 
                          ? formatPrice(req.maximumMonthlyRent)
                          : formatPrice(req.budget)}
                        {req.requirementType === 'Rent' && <span className="text-xs font-normal text-slate-400 ml-0.5">/mo</span>}
                      </span>
                    </div>
                  </div>

                  {/* Location Chip */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 max-w-full">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{req.preferredLocation}, {req.district}{req.state ? `, ${req.state}` : ''}</span>
                    </div>
                  </div>
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200/80 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 sm:px-7 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  (viewingDetailTarget.item.requirementType === 'Rent' || viewingDetailTarget.item.listingType === 'Rent')
                    ? 'bg-violet-50 text-violet-700 border border-violet-100'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                }`}>
                  {viewingDetailTarget.type === 'property'
                    ? (viewingDetailTarget.item.listingType || 'Sale')
                    : (viewingDetailTarget.item.requirementType === 'Rent' ? 'Rent Requirement' : 'Buy Requirement')}
                </span>
                <span className="text-xs text-slate-300">/</span>
                <span className="text-xs font-semibold text-slate-700">{viewingDetailTarget.item.propertyType}</span>
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
              <button 
                onClick={() => setViewingDetailTarget(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 sm:p-7 overflow-y-auto space-y-5 flex-1 font-sans">
              {/* Image banner for property */}
              {viewingDetailTarget.type === 'property' && viewingDetailTarget.item.imageUrl && (
                <div className="h-56 sm:h-64 w-full rounded-xl overflow-hidden bg-slate-100 relative shadow-inner">
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

              {/* Title & Financials */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    {viewingDetailTarget.type === 'property' 
                      ? viewingDetailTarget.item.title
                      : (viewingDetailTarget.item.requirementTitle || `${viewingDetailTarget.item.propertyType} Requirement`)}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {viewingDetailTarget.type === 'property'
                        ? `${viewingDetailTarget.item.location}, ${viewingDetailTarget.item.district}${viewingDetailTarget.item.state ? `, ${viewingDetailTarget.item.state}` : ''}`
                        : `${viewingDetailTarget.item.preferredLocation}, ${viewingDetailTarget.item.district}${viewingDetailTarget.item.state ? `, ${viewingDetailTarget.item.state}` : ''}`}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl text-left sm:text-right shrink-0">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    {viewingDetailTarget.item.listingType === 'Rent' || viewingDetailTarget.item.requirementType === 'Rent'
                      ? 'Monthly Rent'
                      : 'Price / Budget'}
                  </span>
                  <span className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight block">
                    {viewingDetailTarget.type === 'property'
                      ? (viewingDetailTarget.item.listingType === 'Rent'
                          ? `${formatPrice(viewingDetailTarget.item.monthlyRent)}/mo`
                          : formatPrice(viewingDetailTarget.item.expectedPrice))
                      : (viewingDetailTarget.item.requirementType === 'Rent'
                          ? `${formatPrice(viewingDetailTarget.item.maximumMonthlyRent)}/mo`
                          : formatPrice(viewingDetailTarget.item.budget))}
                  </span>
                  {Number(viewingDetailTarget.item.securityDeposit) > 0 && (
                    <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                      Deposit: {formatPrice(viewingDetailTarget.item.securityDeposit)}
                    </span>
                  )}
                </div>
              </div>

              {/* Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider block">Property Type</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 block">{viewingDetailTarget.item.propertyType}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider block">
                    {viewingDetailTarget.type === 'property' ? 'Area / Size' : 'Required Area'}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 block">
                    {viewingDetailTarget.type === 'property' 
                      ? (viewingDetailTarget.item.area || '—') 
                      : (viewingDetailTarget.item.requiredArea || 'Any Area')}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider block">Location / City</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 block truncate">
                    {viewingDetailTarget.type === 'property' ? viewingDetailTarget.item.location : viewingDetailTarget.item.preferredLocation}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider block">District</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 block">{viewingDetailTarget.item.district || '—'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider block">State</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 block">{viewingDetailTarget.item.state || '—'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider block">Registered Date</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 block">
                    {viewingDetailTarget.item.createdAt 
                      ? new Date(viewingDetailTarget.item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'Recently'}
                  </span>
                </div>
              </div>

              {/* Description & Remarks */}
              {viewingDetailTarget.item.description && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Description & Remarks</h4>
                  <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-wrap">
                    {viewingDetailTarget.item.description}
                  </p>
                </div>
              )}

              {/* Owner / Buyer Contact Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {viewingDetailTarget.type === 'property' ? 'Property Owner Details' : 'Buyer Contact Details'}
                </h4>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white text-slate-800 flex items-center justify-center font-bold text-sm shadow-xs border border-slate-200 shrink-0">
                      {(viewingDetailTarget.type === 'property' ? viewingDetailTarget.item.ownerName : viewingDetailTarget.item.buyerName)?.[0]?.toUpperCase() || 'C'}
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900">
                        {viewingDetailTarget.type === 'property' ? viewingDetailTarget.item.ownerName : viewingDetailTarget.item.buyerName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {viewingDetailTarget.item.phoneNumber}
                      </p>
                      {(viewingDetailTarget.item.ownerAddress || viewingDetailTarget.item.buyerAddress) && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Address: {viewingDetailTarget.item.ownerAddress || viewingDetailTarget.item.buyerAddress}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a 
                      href={`tel:${viewingDetailTarget.item.phoneNumber}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-xs font-semibold transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>Call</span>
                    </a>
                    {viewingDetailTarget.item.phoneNumber && (
                      <a 
                        href={`https://wa.me/${viewingDetailTarget.item.phoneNumber.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white text-xs font-semibold transition-all"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
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
                <button
                  onClick={() => setViewingDetailTarget(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROPERTY MODAL */}
      {editingProperty && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200/80 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 sm:px-8 border-b border-slate-100 flex items-center justify-between bg-white">
              <div>
                <h3 className="font-bold text-lg sm:text-xl text-slate-900 tracking-tight">Edit Property</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Update listing details, pricing, location, or contact information.</p>
              </div>
              <button 
                onClick={() => setEditingProperty(null)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProperty} className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 font-sans">
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
                  <input
                    type="text"
                    required
                    value={editPropForm.area}
                    onChange={(e) => setEditPropForm({ ...editPropForm, area: e.target.value })}
                    className="w-full px-4 h-[52px] border border-slate-200 rounded-[10px] text-sm sm:text-base bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F]"
                  />
                </div>

                {editPropForm.listingType === 'Rent' ? (
                  <>
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[14px] font-medium text-slate-800 flex items-center">
                        Monthly Rent (₹) <span className="text-[#B0004F] ml-1 font-bold">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={editPropForm.monthlyRent}
                        onChange={(e) => setEditPropForm({ ...editPropForm, monthlyRent: e.target.value })}
                        className="w-full px-4 h-[52px] border border-slate-200 rounded-[10px] text-sm sm:text-base bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F]"
                      />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[14px] font-medium text-slate-800 flex items-center">
                        Security Deposit (₹) <span className="text-[#B0004F] ml-1 font-bold">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={editPropForm.securityDeposit}
                        onChange={(e) => setEditPropForm({ ...editPropForm, securityDeposit: e.target.value })}
                        className="w-full px-4 h-[52px] border border-slate-200 rounded-[10px] text-sm sm:text-base bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F]"
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[14px] font-medium text-slate-800 flex items-center">
                      Expected Price (₹) <span className="text-[#B0004F] ml-1 font-bold">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editPropForm.expectedPrice}
                      onChange={(e) => setEditPropForm({ ...editPropForm, expectedPrice: e.target.value })}
                      className="w-full px-4 h-[52px] border border-slate-200 rounded-[10px] text-sm sm:text-base bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F]"
                    />
                  </div>
                )}

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[14px] font-medium text-slate-800 flex items-center">
                    Owner Name <span className="text-[#B0004F] ml-1 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editPropForm.ownerName}
                    onChange={(e) => setEditPropForm({ ...editPropForm, ownerName: e.target.value })}
                    className="w-full px-4 h-[52px] border border-slate-200 rounded-[10px] text-sm sm:text-base bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F]"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[14px] font-medium text-slate-800 flex items-center">
                    Owner Phone <span className="text-[#B0004F] ml-1 font-bold">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={editPropForm.phoneNumber}
                    onChange={(e) => setEditPropForm({ ...editPropForm, phoneNumber: e.target.value })}
                    className="w-full px-4 h-[52px] border border-slate-200 rounded-[10px] text-sm sm:text-base bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F]"
                  />
                </div>

                <div className="md:col-span-2 flex flex-col space-y-1.5">
                  <label className="text-[14px] font-medium text-slate-800">Description</label>
                  <textarea
                    rows={3}
                    value={editPropForm.description}
                    onChange={(e) => setEditPropForm({ ...editPropForm, description: e.target.value })}
                    className="w-full p-3.5 border border-slate-200 rounded-[10px] text-sm sm:text-base bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F]"
                  />
                </div>

                <div className="md:col-span-2 flex flex-col space-y-1.5">
                  <label className="text-[14px] font-medium text-slate-800">Property Image URL</label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input
                      type="text"
                      value={editPropForm.imageUrl}
                      onChange={(e) => setEditPropForm({ ...editPropForm, imageUrl: e.target.value })}
                      className="flex-1 px-4 h-[52px] border border-slate-200 rounded-[10px] text-sm sm:text-base bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F]"
                    />
                    <label className="h-[52px] px-5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-[10px] text-sm font-semibold text-slate-700 flex items-center justify-center space-x-2 cursor-pointer transition-colors whitespace-nowrap">
                      <Upload className="w-4 h-4 text-slate-600" />
                      <span>Upload File</span>
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
          </div>
        </div>
      )}

      {/* EDIT REQUIREMENT MODAL */}
      {editingRequirement && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200/80 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 sm:px-8 border-b border-slate-100 flex items-center justify-between bg-white">
              <div>
                <h3 className="font-bold text-lg sm:text-xl text-slate-900 tracking-tight">Edit Buyer Requirement</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Update buyer criteria, budget, location preferences, or contact information.</p>
              </div>
              <button 
                onClick={() => setEditingRequirement(null)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditRequirement} className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 font-sans">
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
                  isEdit={true}
                />

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[14px] font-medium text-slate-800 flex items-center">
                    Required Area <span className="text-[#B0004F] ml-1 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editReqForm.requiredArea}
                    onChange={(e) => setEditReqForm({ ...editReqForm, requiredArea: e.target.value })}
                    className="w-full px-4 h-[52px] border border-slate-200 rounded-[10px] text-sm sm:text-base bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F]"
                  />
                </div>

                {editReqForm.requirementType === 'Rent' ? (
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[14px] font-medium text-slate-800 flex items-center">
                      Maximum Monthly Rent (₹) <span className="text-[#B0004F] ml-1 font-bold">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editReqForm.maximumMonthlyRent}
                      onChange={(e) => setEditReqForm({ ...editReqForm, maximumMonthlyRent: e.target.value })}
                      className="w-full px-4 h-[52px] border border-slate-200 rounded-[10px] text-sm sm:text-base bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F]"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[14px] font-medium text-slate-800 flex items-center">
                      Max Purchase Budget (₹) <span className="text-[#B0004F] ml-1 font-bold">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editReqForm.budget}
                      onChange={(e) => setEditReqForm({ ...editReqForm, budget: e.target.value })}
                      className="w-full px-4 h-[52px] border border-slate-200 rounded-[10px] text-sm sm:text-base bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F]"
                    />
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
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  Delete {deletingTarget.type === 'property' ? 'Property' : 'Buyer Requirement'}
                </h3>
                <p className="text-xs text-slate-500">This action will remove the record from PostgreSQL.</p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {deleteError}
              </div>
            )}

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 space-y-1">
              <p className="text-sm font-semibold text-slate-800">
                Are you sure you want to delete this {deletingTarget.type}?
              </p>
              <p className="text-xs font-bold text-slate-900 pt-1">
                {deletingTarget.type === 'property' ? deletingTarget.item.title : `${deletingTarget.item.buyerName}'s Requirement`}
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
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
          </div>
        </div>
      )}

      {/* MATCHES MODAL */}
      {activeMatchTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-[#B0004F]" />
                  <h3 className="font-bold text-lg text-slate-900">
                    {activeMatchTarget.type === 'property' 
                      ? (activeMatchTarget.data?.listingType === 'Rent' ? 'Matching Rent Customers' : 'Matching Buy Customers')
                      : 'Matching Properties'
                    }
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeMatchTarget.type === 'property' 
                    ? `Customers looking for properties like "${activeMatchTarget.data.title}"`
                    : `Available properties matching criteria for "${activeMatchTarget.data.buyerName}"`
                  }
                </p>
              </div>
              <button 
                onClick={() => setActiveMatchTarget(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {isLoadingMatches ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-3 border-[#B0004F] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-600 text-sm font-medium">Finding 2-Way Matches...</p>
                  <p className="text-xs text-slate-400">Comparing district, locality, type, budget & area</p>
                </div>
              ) : matchResults.length === 0 ? (
                <div className="py-12 text-center border border-slate-200 border-dashed rounded-xl bg-slate-50 space-y-2">
                  <p className="text-sm font-semibold text-slate-700">No matches found above the 55% threshold.</p>
                  <p className="text-xs text-slate-500">As new {activeMatchTarget.type === 'property' ? 'requirements' : 'properties'} are added, matching results update automatically.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {matchResults.map((matchItem, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-slate-300 transition-all duration-200 space-y-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                              (matchItem.requirementType === 'Rent' || matchItem.listingType === 'Rent')
                                ? 'bg-violet-50 text-violet-700 border border-violet-100'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            }`}>
                              {matchItem.requirementType 
                                ? (matchItem.requirementType === 'Rent' ? 'Rent Customer' : 'Buy Customer') 
                                : (matchItem.listingType || 'Sale')}
                            </span>
                            <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                              {matchItem.matchScore}% Match
                            </span>
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

                      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 font-medium text-slate-700">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{activeMatchTarget.type === 'property' ? matchItem.buyerName : matchItem.ownerName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{matchItem.phoneNumber}</span>
                          </div>
                        </div>

                        {/* Optional Property Sharing Action */}
                        {isPropertySharingEnabled && (
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
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setActiveMatchTarget(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHARE PROPERTY MODAL (OPTIONAL FEATURE) */}
      {sharingTarget && (
        <SharePropertyModal
          property={sharingTarget.property}
          buyer={sharingTarget.buyer}
          onClose={() => setSharingTarget(null)}
        />
      )}
    </div>
  );
}
