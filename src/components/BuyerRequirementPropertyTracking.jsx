import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Plus,
  RotateCw,
  Tag,
  ExternalLink,
  User,
  FileText,
  Trash2,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Link as LinkIcon,
  Check,
  Search,
  Key
} from 'lucide-react';
import {
  TRANSACTION_TYPES,
  getValidStagesForTransaction,
  isStageCompatible,
  getDefaultEventTypeForStage,
  formatActivityDateTime,
  getStageBadgeConfig,
  fetchLinkedProperties,
  linkPropertyToRequirement,
  fetchPropertyActivities,
  recordPropertyActivity,
  unlinkPropertyFromRequirement,
  getApiBaseUrl,
  getAuthToken
} from '../utils/buyerTrackingApi';

export default function BuyerRequirementPropertyTracking({
  requirement,
  properties = [],
  user,
  showToast,
  onNavigateToProperty,
  initialLinkedProperties = null,
  initialSelectedPropertyId = null,
  initialTimelineData = null
}) {
  const requirementId = requirement?.id || requirement?.requirementId;
  const isRentalRequirement = requirement?.requirementType === 'Rent';
  const canManage = Boolean(user && ['Admin', 'Staff'].includes(user.role));

  // Main state
  const [linkedProperties, setLinkedProperties] = useState(initialLinkedProperties || []);
  const [isLoadingProps, setIsLoadingProps] = useState(!initialLinkedProperties);
  const [propsError, setPropsError] = useState(null);

  // Selected property for timeline view (defaults to first linked property)
  const [selectedPropertyId, setSelectedPropertyId] = useState(() => {
    if (initialSelectedPropertyId !== null && initialSelectedPropertyId !== undefined) {
      return initialSelectedPropertyId;
    }
    if (initialLinkedProperties && initialLinkedProperties.length > 0) {
      return initialLinkedProperties[0].propertyId || initialLinkedProperties[0].id;
    }
    return null;
  });

  // Timeline state for selected property
  const [timelineData, setTimelineData] = useState(initialTimelineData || { link: null, timeline: [] });
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [timelineError, setTimelineError] = useState(null);

  // Modals state
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isUnlinkModalOpen, setIsUnlinkModalOpen] = useState(false);
  const [targetPropertyForActivity, setTargetPropertyForActivity] = useState(null);
  const [targetPropertyForUnlink, setTargetPropertyForUnlink] = useState(null);

  // Link property form state
  const [linkForm, setLinkForm] = useState({
    propertyId: '',
    transactionType: isRentalRequirement ? TRANSACTION_TYPES.RENTAL : TRANSACTION_TYPES.PURCHASE,
    initialStage: 'Property Selected',
    notes: ''
  });
  const [isSubmittingLink, setIsSubmittingLink] = useState(false);
  const [linkError, setLinkError] = useState(null);
  const [propertySearchQuery, setPropertySearchQuery] = useState('');

  // Record activity form state
  const [activityForm, setActivityForm] = useState({
    stage: 'Property Selected',
    eventType: 'STAGE_UPDATED',
    title: '',
    notes: '',
    cancellationReason: ''
  });
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);
  const [activityError, setActivityError] = useState(null);

  // Unlink submitting state
  const [isSubmittingUnlink, setIsSubmittingUnlink] = useState(false);
  const [unlinkError, setUnlinkError] = useState(null);

  // Load linked properties
  const loadLinkedProperties = useCallback(async (autoSelectFirst = true) => {
    if (!requirementId) return;
    setIsLoadingProps(true);
    setPropsError(null);
    try {
      const res = await fetchLinkedProperties(getApiBaseUrl(), requirementId);
      const list = Array.isArray(res.data) ? res.data : [];
      setLinkedProperties(list);

      // Auto-select selected property
      setSelectedPropertyId(prev => {
        if (prev && list.some(item => (item.propertyId === prev || item.id === prev))) {
          return prev;
        }
        return list.length > 0 ? (list[0].propertyId || list[0].id) : null;
      });
    } catch (err) {
      console.error('Failed to load linked properties:', err);
      setPropsError(err.message || 'Unable to load linked properties for this requirement.');
    } finally {
      setIsLoadingProps(false);
    }
  }, [requirementId]);

  useEffect(() => {
    if (initialLinkedProperties) return;
    loadLinkedProperties();
  }, [loadLinkedProperties, initialLinkedProperties]);

  // Load timeline for selected property
  const loadTimeline = useCallback(async (propId) => {
    if (!requirementId || !propId) {
      setTimelineData({ link: null, timeline: [] });
      return;
    }
    setIsLoadingTimeline(true);
    setTimelineError(null);
    try {
      const res = await fetchPropertyActivities(getApiBaseUrl(), requirementId, propId);
      setTimelineData(res.data || { link: null, timeline: [] });
    } catch (err) {
      console.error('Failed to load activity timeline:', err);
      setTimelineError(err.message || 'Unable to load activity timeline for this property.');
    } finally {
      setIsLoadingTimeline(false);
    }
  }, [requirementId]);

  useEffect(() => {
    if (selectedPropertyId) {
      if (initialTimelineData && selectedPropertyId === initialSelectedPropertyId) return;
      loadTimeline(selectedPropertyId);
    } else {
      setTimelineData({ link: null, timeline: [] });
    }
  }, [selectedPropertyId, loadTimeline, initialTimelineData, initialSelectedPropertyId]);

  // Filter available properties for linking modal
  const alreadyLinkedPropertyIds = useMemo(() => {
    const ids = new Set();
    linkedProperties.forEach(p => {
      if (p.propertyId) ids.add(String(p.propertyId));
      if (p.id) ids.add(String(p.id));
      if (p.propertyCode) ids.add(String(p.propertyCode).toLowerCase());
    });
    return ids;
  }, [linkedProperties]);

  const availableProperties = useMemo(() => {
    const q = propertySearchQuery.trim().toLowerCase();
    return properties.filter(p => {
      if (alreadyLinkedPropertyIds.has(String(p.id)) || alreadyLinkedPropertyIds.has(String(p.propertyId).toLowerCase())) {
        return false;
      }
      if (!q) return true;
      return (
        (p.propertyId && p.propertyId.toLowerCase().includes(q)) ||
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.location && p.location.toLowerCase().includes(q)) ||
        (p.district && p.district.toLowerCase().includes(q)) ||
        (p.propertyType && p.propertyType.toLowerCase().includes(q))
      );
    });
  }, [properties, alreadyLinkedPropertyIds, propertySearchQuery]);

  // Open Link Modal
  const handleOpenLinkModal = () => {
    const defaultType = isRentalRequirement ? TRANSACTION_TYPES.RENTAL : TRANSACTION_TYPES.PURCHASE;
    setLinkForm({
      propertyId: '',
      transactionType: defaultType,
      initialStage: 'Property Selected',
      notes: ''
    });
    setLinkError(null);
    setPropertySearchQuery('');
    setIsLinkModalOpen(true);
  };

  // Property selection in Link Modal
  const handleSelectPropertyToLink = (prop) => {
    const inferredType = prop.listingType === 'Rent' ? TRANSACTION_TYPES.RENTAL : TRANSACTION_TYPES.PURCHASE;
    setLinkForm(prev => ({
      ...prev,
      propertyId: prop.id,
      transactionType: inferredType,
      initialStage: 'Property Selected'
    }));
  };

  // Submit Link Property
  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    if (!linkForm.propertyId) {
      setLinkError('Please select a property to link.');
      return;
    }
    setIsSubmittingLink(true);
    setLinkError(null);
    try {
      await linkPropertyToRequirement(getApiBaseUrl(), requirementId, {
        propertyId: Number(linkForm.propertyId),
        transactionType: linkForm.transactionType,
        initialStage: linkForm.initialStage,
        notes: linkForm.notes.trim() || undefined
      });

      showToast?.('Property successfully linked to buyer requirement!', 'success');
      setIsLinkModalOpen(false);
      await loadLinkedProperties();
      setSelectedPropertyId(Number(linkForm.propertyId));
    } catch (err) {
      console.error('Link property failed:', err);
      setLinkError(err.message || 'Failed to link property. Please try again.');
    } finally {
      setIsSubmittingLink(false);
    }
  };

  // Open Record Activity Modal
  const handleOpenActivityModal = (prop) => {
    const currentProp = prop || linkedProperties.find(p => p.propertyId === selectedPropertyId || p.id === selectedPropertyId);
    if (!currentProp) return;
    setTargetPropertyForActivity(currentProp);

    const validStages = getValidStagesForTransaction(currentProp.transactionType);
    const initialStage = validStages.includes(currentProp.currentStage)
      ? currentProp.currentStage
      : validStages[0];

    setActivityForm({
      stage: initialStage,
      eventType: getDefaultEventTypeForStage(initialStage),
      title: `Update: ${initialStage}`,
      notes: '',
      cancellationReason: ''
    });
    setActivityError(null);
    setIsActivityModalOpen(true);
  };

  // Handle stage change in Activity Modal
  const handleActivityStageChange = (newStage) => {
    const isCancelled = newStage === 'Cancelled / Deal Lost';
    const eventType = getDefaultEventTypeForStage(newStage);
    setActivityForm(prev => ({
      ...prev,
      stage: newStage,
      eventType,
      title: isCancelled ? 'Deal Cancelled / Lost' : `Stage updated to ${newStage}`,
      cancellationReason: isCancelled ? prev.cancellationReason : ''
    }));
  };

  // Submit Record Activity
  const handleActivitySubmit = async (e) => {
    e.preventDefault();
    if (!targetPropertyForActivity) return;

    if (activityForm.stage === 'Cancelled / Deal Lost' && !activityForm.cancellationReason.trim()) {
      setActivityError('Cancellation reason is required when marking a transaction as cancelled.');
      return;
    }

    setIsSubmittingActivity(true);
    setActivityError(null);
    try {
      const propId = targetPropertyForActivity.propertyId || targetPropertyForActivity.id;
      await recordPropertyActivity(getApiBaseUrl(), requirementId, propId, {
        stage: activityForm.stage,
        eventType: activityForm.eventType,
        title: activityForm.title.trim() || undefined,
        notes: activityForm.notes.trim() || undefined,
        cancellationReason: activityForm.stage === 'Cancelled / Deal Lost' ? activityForm.cancellationReason.trim() : undefined,
        transactionType: targetPropertyForActivity.transactionType
      });

      showToast?.('Customer journey activity successfully recorded!', 'success');
      setIsActivityModalOpen(false);
      await loadLinkedProperties(false);
      await loadTimeline(propId);
    } catch (err) {
      console.error('Record activity failed:', err);
      setActivityError(err.message || 'Failed to record customer journey activity.');
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  // Open Unlink Confirmation Modal
  const handleOpenUnlinkModal = (prop) => {
    setTargetPropertyForUnlink(prop);
    setUnlinkError(null);
    setIsUnlinkModalOpen(true);
  };

  // Submit Unlink
  const handleUnlinkSubmit = async () => {
    if (!targetPropertyForUnlink) return;
    setIsSubmittingUnlink(true);
    setUnlinkError(null);
    try {
      const propId = targetPropertyForUnlink.propertyId || targetPropertyForUnlink.id;
      await unlinkPropertyFromRequirement(getApiBaseUrl(), requirementId, propId);

      showToast?.('Property unlinked successfully.', 'success');
      setIsUnlinkModalOpen(false);
      setTargetPropertyForUnlink(null);
      await loadLinkedProperties();
    } catch (err) {
      console.error('Unlink failed:', err);
      setUnlinkError(err.message || 'Unable to unlink property. Properties with customer history cannot be removed.');
    } finally {
      setIsSubmittingUnlink(false);
    }
  };

  const activeSelectedProperty = useMemo(() => {
    if (!selectedPropertyId) return null;
    return linkedProperties.find(p => p.propertyId === selectedPropertyId || p.id === selectedPropertyId) || null;
  }, [linkedProperties, selectedPropertyId]);

  return (
    <div className="space-y-6 pt-2">
      {/* ── SECTION HEADER & STATS ── */}
      <div className="bg-slate-50/70 rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B0004F]/10 flex items-center justify-center shrink-0">
              <CompassIcon className="w-5 h-5 text-[#B0004F]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Linked Properties & Customer Journey
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#B0004F]/10 text-[#B0004F] border border-[#B0004F]/20">
                  {linkedProperties.length} {linkedProperties.length === 1 ? 'Property' : 'Properties'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Track customer interactions, inspection visits, counter-offers, and outcomes for this buyer.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => loadLinkedProperties()}
              disabled={isLoadingProps}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
              title="Refresh tracking data"
            >
              <RotateCw className={`w-4 h-4 ${isLoadingProps ? 'animate-spin text-[#B0004F]' : ''}`} />
            </button>

            {canManage && (
              <button
                type="button"
                onClick={handleOpenLinkModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#B0004F] hover:bg-[#920042] text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Link Property</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── ERROR ALERT ── */}
      {propsError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{propsError}</span>
          </div>
          <button
            type="button"
            onClick={() => loadLinkedProperties()}
            className="px-2.5 py-1 bg-white border border-red-200 text-red-700 rounded-lg text-[11px] font-bold hover:bg-red-50 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── LOADING SKELETON ── */}
      {isLoadingProps && linkedProperties.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(n => (
            <div key={n} className="p-4 bg-white rounded-2xl border border-slate-100 animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-slate-200 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-200 rounded-md w-1/2" />
                </div>
              </div>
              <div className="h-6 bg-slate-100 rounded-full w-1/3" />
            </div>
          ))}
        </div>
      )}

      {/* ── EMPTY STATE ── */}
      {!isLoadingProps && linkedProperties.length === 0 && !propsError && (
        <div className="bg-slate-50/50 rounded-2xl p-8 sm:p-12 text-center border-2 border-dashed border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">No properties linked yet</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              Link properties that match this buyer requirement to log enquiry dates, scheduled visits, price negotiations, and final decisions.
            </p>
          </div>
          {canManage && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleOpenLinkModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#B0004F] hover:bg-[#920042] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Link First Property</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── LINKED PROPERTIES CARDS ── */}
      {linkedProperties.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Linked Inventory ({linkedProperties.length})
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">
              Click a property card to view its journey.
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {linkedProperties.map(item => {
              const propId = item.propertyId || item.id;
              const isSelected = selectedPropertyId === propId;
              const stageConfig = getStageBadgeConfig(item.currentStage);
              const isRental = item.transactionType === TRANSACTION_TYPES.RENTAL;

              return (
                <div
                  key={item.linkId || item.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={`Select ${item.title || item.propertyCode || 'property'} to view activity timeline`}
                  onClick={() => setSelectedPropertyId(propId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedPropertyId(propId);
                    }
                  }}
                  className={`rounded-2xl p-4 sm:p-5 border transition-all duration-150 ease-in-out cursor-pointer relative focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B0004F] focus-visible:ring-offset-2 ${
                    isSelected
                      ? 'border-[#B0004F] ring-2 ring-[#B0004F]/10 bg-[#B0004F]/[0.02] shadow-sm'
                      : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/70 hover:shadow-xs'
                  }`}
                >
                  {/* Top bar: Property ID + Transaction Type Badge + Journey Stage */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-900 text-white tracking-wider">
                        {item.propertyCode || `HP-${item.propertyId}`}
                      </span>

                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isRental
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {item.transactionType}
                      </span>
                    </div>

                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${stageConfig.bg} ${stageConfig.text} ${stageConfig.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${stageConfig.dot}`} />
                      <span>{item.currentStage}</span>
                    </span>
                  </div>

                  {/* Property Info Row */}
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                      {item.imageUrl && !item.imageUrl.includes('null') ? (
                        <img
                          src={item.imageUrl.split(',')[0]}
                          alt={item.title || 'Property'}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Building2 className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-bold text-slate-900 truncate">
                        {item.title || 'Untitled Property'}
                      </h5>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {item.location}{item.district ? `, ${item.district}` : ''}
                      </p>

                      <div className="mt-2 flex items-center gap-3 text-xs">
                        <span className="font-bold text-slate-900">
                          {isRental
                            ? (item.monthlyRent ? `₹${Number(item.monthlyRent).toLocaleString('en-IN')}/mo` : 'Rent on request')
                            : (item.expectedPrice ? `₹${Number(item.expectedPrice).toLocaleString('en-IN')}` : 'Price on request')}
                        </span>
                        {item.propertyType && (
                          <span className="text-slate-400 text-[11px]">
                            • {item.propertyType}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cancellation Reason alert if cancelled */}
                  {item.isCancelled && item.cancellationReason && (
                    <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="leading-snug">
                        <strong className="font-bold">Cancellation Reason: </strong>
                        <span>{item.cancellationReason}</span>
                      </div>
                    </div>
                  )}

                  {/* Latest Activity snippet */}
                  {item.latestActivity && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5 truncate">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {item.latestActivity.title || item.latestActivity.stage} • {item.latestActivity.actorName}
                        </span>
                      </div>
                      <span className="shrink-0 text-slate-400 text-[10px]">
                        {formatActivityDateTime(item.latestActivity.createdAt)}
                      </span>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-h-[26px]">
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#B0004F]/10 text-[#B0004F] border border-[#B0004F]/20">
                          <Check className="w-3 h-3 text-[#B0004F]" />
                          <span>Timeline selected</span>
                        </span>
                      )}
                    </div>

                    <div
                      className="flex items-center gap-1.5 ml-auto"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      {onNavigateToProperty && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToProperty(propId);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="View property details"
                          aria-label="View property details"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {canManage && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenActivityModal(item);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            <FileText className="w-3 h-3 text-slate-600" />
                            <span>Update Stage</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenUnlinkModal(item);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Unlink property"
                            aria-label="Unlink property"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CHRONOLOGICAL ACTIVITY TIMELINE ── */}
      {activeSelectedProperty && (
        <div className="bg-slate-50/70 rounded-2xl p-5 sm:p-7 border border-slate-200 space-y-6">
          {/* Timeline Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white">
                  {activeSelectedProperty.propertyCode || `HP-${activeSelectedProperty.propertyId}`}
                </span>
                <h4 className="text-sm font-bold text-slate-900">
                  Customer Journey Timeline: {activeSelectedProperty.title || 'Selected Property'}
                </h4>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Full chronological record of stage updates, visits, negotiations, offers, and remarks.
              </p>
            </div>

            {canManage && (
              <button
                type="button"
                onClick={() => handleOpenActivityModal(activeSelectedProperty)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Activity</span>
              </button>
            )}
          </div>

          {/* Timeline Loading / Error / Content */}
          {isLoadingTimeline ? (
            <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RotateCw className="w-4 h-4 animate-spin text-[#B0004F]" />
              <span>Loading customer journey timeline...</span>
            </div>
          ) : timelineError ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between gap-3">
              <span>{timelineError}</span>
              <button
                type="button"
                onClick={() => loadTimeline(selectedPropertyId)}
                className="px-2.5 py-1 bg-white border border-red-200 text-red-700 rounded-lg text-[11px] font-bold"
              >
                Retry
              </button>
            </div>
          ) : timelineData.timeline.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No activity logs recorded yet for this property.
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {timelineData.timeline.map((act, index) => {
                const stageConfig = getStageBadgeConfig(act.stage);
                const isCancelled = act.stage === 'Cancelled / Deal Lost' || act.eventType === 'DEAL_CANCELLED';
                const isFinalSuccess = act.stage === 'Purchase Completed' || act.stage === 'Rental Confirmed / Move-in Completed';

                return (
                  <div key={act.id || index} className="relative group">
                    {/* Bullet marker */}
                    <div className={`absolute -left-6 sm:-left-8 top-1 w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 bg-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-110 ${
                      isCancelled
                        ? 'border-rose-500 text-rose-600'
                        : isFinalSuccess
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-[#B0004F] text-[#B0004F]'
                    }`}>
                      {isCancelled ? (
                        <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      ) : isFinalSuccess ? (
                        <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      ) : (
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#B0004F]" />
                      )}
                    </div>

                    {/* Timeline Event Card */}
                    <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${stageConfig.bg} ${stageConfig.text} ${stageConfig.border}`}>
                            {act.stage}
                          </span>
                          <h5 className="text-xs sm:text-sm font-bold text-slate-900">
                            {act.title}
                          </h5>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>{formatActivityDateTime(act.createdAt)}</span>
                        </div>
                      </div>

                      {/* Notes / remarks */}
                      {act.notes && (
                        <p className="text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100 whitespace-pre-wrap leading-relaxed">
                          {act.notes}
                        </p>
                      )}

                      {/* Cancellation reason if present */}
                      {act.cancellationReason && (
                        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <div className="leading-snug">
                            <strong className="font-bold">Cancellation Reason: </strong>
                            <span>{act.cancellationReason}</span>
                          </div>
                        </div>
                      )}

                      {/* Actor info footer */}
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1">
                        <User className="w-3 h-3" />
                        <span>Logged by <strong className="text-slate-700">{act.actorName || 'Staff'}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: LINK PROPERTY ── */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#B0004F]/10 flex items-center justify-center text-[#B0004F]">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Link Property to Buyer</h4>
                  <p className="text-[11px] text-slate-500">Attach inventory to track customer decisions and journey</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleLinkSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {linkError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{linkError}</span>
                </div>
              )}

              {/* Property Search & Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Select Property <span className="text-[#B0004F]">*</span>
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by code (e.g. HP-001), title, or location..."
                    value={propertySearchQuery}
                    onChange={(e) => setPropertySearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B0004F]/20 focus:border-[#B0004F]"
                  />
                </div>

                {/* Available Properties List */}
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 mt-2">
                  {availableProperties.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No matching unlinked properties found.
                    </div>
                  ) : (
                    availableProperties.map(p => {
                      const isSelected = String(linkForm.propertyId) === String(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleSelectPropertyToLink(p)}
                          className={`p-2.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#B0004F]/5 text-[#B0004F]' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{p.propertyId}</span>
                              <span className="text-slate-400">•</span>
                              <span className="truncate font-medium">{p.title}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">
                              {p.location}, {p.district} · {p.listingType}
                            </p>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#B0004F] shrink-0" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Transaction Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Transaction Type <span className="text-[#B0004F]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[TRANSACTION_TYPES.PURCHASE, TRANSACTION_TYPES.RENTAL].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setLinkForm(prev => ({
                        ...prev,
                        transactionType: type,
                        initialStage: isStageCompatible(type, prev.initialStage) ? prev.initialStage : 'Property Selected'
                      }))}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        linkForm.transactionType === type
                          ? 'border-[#B0004F] bg-[#B0004F]/5 text-[#B0004F]'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Initial Stage */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Initial Journey Stage
                </label>
                <select
                  value={linkForm.initialStage}
                  onChange={(e) => setLinkForm({ ...linkForm, initialStage: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B0004F]/20 focus:border-[#B0004F]"
                >
                  {getValidStagesForTransaction(linkForm.transactionType).map(stage => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>

              {/* Initial Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Initial Remarks / Customer Interest Note
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Client requested details on floor plan and parking availability..."
                  value={linkForm.notes}
                  onChange={(e) => setLinkForm({ ...linkForm, notes: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B0004F]/20 focus:border-[#B0004F]"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  disabled={isSubmittingLink}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLink || !linkForm.propertyId}
                  className="px-4 py-2 bg-[#B0004F] hover:bg-[#920042] disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingLink && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmittingLink ? 'Linking...' : 'Link Property'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: UPDATE STAGE & RECORD ACTIVITY ── */}
      {isActivityModalOpen && targetPropertyForActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Record Customer Activity</h4>
                  <p className="text-[11px] text-slate-500">
                    {targetPropertyForActivity.propertyCode || `HP-${targetPropertyForActivity.propertyId}`} · {targetPropertyForActivity.transactionType}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsActivityModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleActivitySubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {activityError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{activityError}</span>
                </div>
              )}

              {/* Stage selector (constrained to valid stages for this transaction type) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Target Journey Stage <span className="text-[#B0004F]">*</span>
                </label>
                <select
                  value={activityForm.stage}
                  onChange={(e) => handleActivityStageChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B0004F]/20 focus:border-[#B0004F]"
                >
                  {getValidStagesForTransaction(targetPropertyForActivity.transactionType).map(stage => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Activity Summary / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Site Visit Completed with buyer and family"
                  value={activityForm.title}
                  onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B0004F]/20 focus:border-[#B0004F]"
                />
              </div>

              {/* Notes / Feedback */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Customer Observations & Staff Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Add detailed feedback, counter-offer amounts, follow-up expectations..."
                  value={activityForm.notes}
                  onChange={(e) => setActivityForm({ ...activityForm, notes: e.target.value })}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B0004F]/20 focus:border-[#B0004F]"
                />
              </div>

              {/* Cancellation Reason (MANDATORY if stage is Cancelled / Deal Lost) */}
              {activityForm.stage === 'Cancelled / Deal Lost' && (
                <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1.5">
                  <label className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Cancellation Reason <span className="text-rose-600">* Required</span></span>
                  </label>
                  <p className="text-[11px] text-rose-700">
                    Why was this deal lost? This reason is immutably preserved in the audit log. The property status will not be modified.
                  </p>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Budget mismatch, buyer chose property in another district, seller rejected counter-offer..."
                    value={activityForm.cancellationReason}
                    onChange={(e) => setActivityForm({ ...activityForm, cancellationReason: e.target.value })}
                    className="w-full p-2.5 text-xs border border-rose-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-500"
                  />
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(false)}
                  disabled={isSubmittingActivity}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingActivity}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingActivity && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmittingActivity ? 'Saving...' : 'Record Activity'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: UNLINK PROPERTY CONFIRMATION ── */}
      {isUnlinkModalOpen && targetPropertyForUnlink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Unlink Property?</h4>
                <p className="text-[11px] text-slate-500">Remove link between this requirement and property</p>
              </div>
            </div>

            <div className="p-5 space-y-3">
              {unlinkError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {unlinkError}
                </div>
              )}

              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to unlink <strong>{targetPropertyForUnlink.propertyCode || `Property #${targetPropertyForUnlink.propertyId}`}</strong>?
              </p>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
                <strong>Audit Protection:</strong> If any customer interaction or activity beyond initial intake has been recorded, the backend will prevent unlinking to preserve the transaction history.
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsUnlinkModalOpen(false)}
                disabled={isSubmittingUnlink}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUnlinkSubmit}
                disabled={isSubmittingUnlink}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isSubmittingUnlink && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isSubmittingUnlink ? 'Unlinking...' : 'Confirm Unlink'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compass Icon component fallback
function CompassIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}
