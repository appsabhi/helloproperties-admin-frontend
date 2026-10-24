// Buyer Requirement Property Tracking and Customer Journey API Client & Utilities

export const TRANSACTION_TYPES = Object.freeze({
  PURCHASE: 'Purchase',
  RENTAL: 'Rental'
});

export const COMMON_STAGES = Object.freeze([
  'Property Selected',
  'Enquiry Received',
  'Visit Scheduled',
  'Visit Completed',
  'Negotiation / Offer',
  'Booking Confirmed'
]);

export const PURCHASE_STAGES = Object.freeze([
  ...COMMON_STAGES,
  'Purchase Completed',
  'Cancelled / Deal Lost'
]);

export const RENTAL_STAGES = Object.freeze([
  ...COMMON_STAGES,
  'Rental Confirmed / Move-in Completed',
  'Cancelled / Deal Lost'
]);

export const ALL_STAGES = Object.freeze([
  'Property Selected',
  'Enquiry Received',
  'Visit Scheduled',
  'Visit Completed',
  'Negotiation / Offer',
  'Booking Confirmed',
  'Purchase Completed',
  'Rental Confirmed / Move-in Completed',
  'Cancelled / Deal Lost'
]);

export const EVENT_TYPES = Object.freeze([
  { value: 'STAGE_UPDATED', label: 'Stage Update' },
  { value: 'PROPERTY_SELECTED', label: 'Property Selected' },
  { value: 'ENQUIRY_RECEIVED', label: 'Enquiry Received' },
  { value: 'VISIT_SCHEDULED', label: 'Visit Scheduled' },
  { value: 'VISIT_COMPLETED', label: 'Visit Completed' },
  { value: 'NEGOTIATION_OFFER', label: 'Negotiation / Offer' },
  { value: 'BOOKING_CONFIRMED', label: 'Booking Confirmed' },
  { value: 'PURCHASE_COMPLETED', label: 'Purchase Completed' },
  { value: 'RENTAL_CONFIRMED', label: 'Rental Confirmed' },
  { value: 'NOTE_ADDED', label: 'Note / Observation' },
  { value: 'DEAL_CANCELLED', label: 'Deal Cancelled' }
]);

export function getApiBaseUrl() {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000/api';
  }
  return 'https://helloproperties-backend.vercel.app/api';
}

export function getAuthToken() {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('hp_auth_token') || null;
  }
  return null;
}

export function getValidStagesForTransaction(transactionType) {
  if (transactionType === TRANSACTION_TYPES.RENTAL) {
    return [...RENTAL_STAGES];
  }
  return [...PURCHASE_STAGES];
}

export function isStageCompatible(transactionType, stage) {
  if (!stage) return true;
  if (transactionType === TRANSACTION_TYPES.PURCHASE && stage === 'Rental Confirmed / Move-in Completed') {
    return false;
  }
  if (transactionType === TRANSACTION_TYPES.RENTAL && stage === 'Purchase Completed') {
    return false;
  }
  return ALL_STAGES.includes(stage);
}

export function getDefaultEventTypeForStage(stage) {
  switch (stage) {
    case 'Property Selected': return 'PROPERTY_SELECTED';
    case 'Enquiry Received': return 'ENQUIRY_RECEIVED';
    case 'Visit Scheduled': return 'VISIT_SCHEDULED';
    case 'Visit Completed': return 'VISIT_COMPLETED';
    case 'Negotiation / Offer': return 'NEGOTIATION_OFFER';
    case 'Booking Confirmed': return 'BOOKING_CONFIRMED';
    case 'Purchase Completed': return 'PURCHASE_COMPLETED';
    case 'Rental Confirmed / Move-in Completed': return 'RENTAL_CONFIRMED';
    case 'Cancelled / Deal Lost': return 'DEAL_CANCELLED';
    default: return 'STAGE_UPDATED';
  }
}

export function formatActivityDateTime(dateString) {
  if (!dateString) return 'Not recorded';
  const parsed = Date.parse(dateString);
  if (!Number.isFinite(parsed)) return 'Invalid date';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    }).format(new Date(parsed));
  } catch {
    return new Date(parsed).toLocaleString('en-IN');
  }
}

export function getStageBadgeConfig(stage) {
  switch (stage) {
    case 'Property Selected':
      return {
        bg: 'bg-sky-50',
        text: 'text-sky-700',
        border: 'border-sky-200',
        dot: 'bg-sky-500',
        label: 'Property Selected'
      };
    case 'Enquiry Received':
      return {
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        border: 'border-indigo-200',
        dot: 'bg-indigo-500',
        label: 'Enquiry Received'
      };
    case 'Visit Scheduled':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
        label: 'Visit Scheduled'
      };
    case 'Visit Completed':
      return {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
        dot: 'bg-orange-500',
        label: 'Visit Completed'
      };
    case 'Negotiation / Offer':
      return {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
        dot: 'bg-purple-500',
        label: 'Negotiation / Offer'
      };
    case 'Booking Confirmed':
      return {
        bg: 'bg-teal-50',
        text: 'text-teal-700',
        border: 'border-teal-200',
        dot: 'bg-teal-500',
        label: 'Booking Confirmed'
      };
    case 'Purchase Completed':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
        label: 'Purchase Completed'
      };
    case 'Rental Confirmed / Move-in Completed':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
        label: 'Rental Confirmed'
      };
    case 'Cancelled / Deal Lost':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        dot: 'bg-rose-500',
        label: 'Cancelled / Lost'
      };
    default:
      return {
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
        label: stage || 'Unknown Stage'
      };
  }
}

export async function trackingRequest(
  apiBaseUrl,
  path,
  { method = 'GET', body, token, signal } = {},
  fetcher = fetch
) {
  const cleanBase = (apiBaseUrl || getApiBaseUrl()).replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const authToken = token !== undefined ? token : getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
  };

  const response = await fetcher(`${cleanBase}${cleanPath}`, {
    method,
    headers,
    credentials: 'include',
    signal,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.success) {
    let message = result.message || result.error;
    if (response.status === 401) {
      message = 'Your session has expired. Please sign in again.';
    } else if (response.status === 403) {
      message = 'You do not have permission to perform this property tracking action.';
    } else if (response.status === 409) {
      message = result.message || 'A conflicting property tracking record already exists.';
    } else if (!message) {
      message = `Tracking request failed with status ${response.status}.`;
    }
    const error = new Error(message);
    error.status = response.status;
    error.details = result;
    throw error;
  }

  return result;
}

export async function fetchLinkedProperties(
  apiBaseUrl,
  requirementId,
  options = {},
  fetcher = fetch
) {
  if (!requirementId) throw new Error('requirementId is required to fetch linked properties');
  return trackingRequest(
    apiBaseUrl,
    `/buy-requirements/${encodeURIComponent(requirementId)}/properties`,
    { method: 'GET', ...options },
    fetcher
  );
}

export async function linkPropertyToRequirement(
  apiBaseUrl,
  requirementId,
  { propertyId, transactionType, initialStage, notes } = {},
  options = {},
  fetcher = fetch
) {
  if (!requirementId) throw new Error('requirementId is required');
  if (!propertyId) throw new Error('propertyId is required');

  if (transactionType && initialStage && !isStageCompatible(transactionType, initialStage)) {
    throw Object.assign(
      new Error(`Stage '${initialStage}' is not compatible with transaction type '${transactionType}'`),
      { status: 400 }
    );
  }

  return trackingRequest(
    apiBaseUrl,
    `/buy-requirements/${encodeURIComponent(requirementId)}/properties`,
    {
      method: 'POST',
      body: { propertyId, transactionType, initialStage, notes },
      ...options
    },
    fetcher
  );
}

export async function fetchPropertyActivities(
  apiBaseUrl,
  requirementId,
  propertyId,
  options = {},
  fetcher = fetch
) {
  if (!requirementId) throw new Error('requirementId is required');
  if (!propertyId) throw new Error('propertyId is required');

  return trackingRequest(
    apiBaseUrl,
    `/buy-requirements/${encodeURIComponent(requirementId)}/properties/${encodeURIComponent(propertyId)}/activities`,
    { method: 'GET', ...options },
    fetcher
  );
}

export async function recordPropertyActivity(
  apiBaseUrl,
  requirementId,
  propertyId,
  { stage, eventType, title, notes, cancellationReason, metadata, transactionType } = {},
  options = {},
  fetcher = fetch
) {
  if (!requirementId) throw new Error('requirementId is required');
  if (!propertyId) throw new Error('propertyId is required');

  if (stage === 'Cancelled / Deal Lost' && (!cancellationReason || !String(cancellationReason).trim())) {
    throw Object.assign(
      new Error('Cancellation reason is required when marking a deal as cancelled.'),
      { status: 400 }
    );
  }

  if (transactionType && stage && !isStageCompatible(transactionType, stage)) {
    throw Object.assign(
      new Error(`Stage '${stage}' is not compatible with transaction type '${transactionType}'`),
      { status: 400 }
    );
  }

  return trackingRequest(
    apiBaseUrl,
    `/buy-requirements/${encodeURIComponent(requirementId)}/properties/${encodeURIComponent(propertyId)}/activities`,
    {
      method: 'POST',
      body: {
        stage,
        eventType: eventType || (stage ? getDefaultEventTypeForStage(stage) : 'NOTE_ADDED'),
        title: title || (stage ? `Stage updated to ${stage}` : 'Customer activity recorded'),
        notes: notes || '',
        cancellationReason: cancellationReason || undefined,
        metadata: metadata || {}
      },
      ...options
    },
    fetcher
  );
}

export async function unlinkPropertyFromRequirement(
  apiBaseUrl,
  requirementId,
  propertyId,
  options = {},
  fetcher = fetch
) {
  if (!requirementId) throw new Error('requirementId is required');
  if (!propertyId) throw new Error('propertyId is required');

  return trackingRequest(
    apiBaseUrl,
    `/buy-requirements/${encodeURIComponent(requirementId)}/properties/${encodeURIComponent(propertyId)}`,
    { method: 'DELETE', ...options },
    fetcher
  );
}
