import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TRANSACTION_TYPES,
  PURCHASE_STAGES,
  RENTAL_STAGES,
  getValidStagesForTransaction,
  isStageCompatible,
  getDefaultEventTypeForStage,
  formatActivityDateTime,
  trackingRequest,
  fetchLinkedProperties,
  linkPropertyToRequirement,
  fetchPropertyActivities,
  recordPropertyActivity,
  unlinkPropertyFromRequirement
} from '../src/utils/buyerTrackingApi.js';

test('transaction stages and compatibility validation', () => {
  const purchaseStages = getValidStagesForTransaction(TRANSACTION_TYPES.PURCHASE);
  assert.ok(purchaseStages.includes('Purchase Completed'));
  assert.ok(!purchaseStages.includes('Rental Confirmed / Move-in Completed'));
  assert.ok(purchaseStages.includes('Cancelled / Deal Lost'));

  const rentalStages = getValidStagesForTransaction(TRANSACTION_TYPES.RENTAL);
  assert.ok(rentalStages.includes('Rental Confirmed / Move-in Completed'));
  assert.ok(!rentalStages.includes('Purchase Completed'));
  assert.ok(rentalStages.includes('Cancelled / Deal Lost'));

  assert.equal(isStageCompatible(TRANSACTION_TYPES.PURCHASE, 'Purchase Completed'), true);
  assert.equal(isStageCompatible(TRANSACTION_TYPES.PURCHASE, 'Rental Confirmed / Move-in Completed'), false);
  assert.equal(isStageCompatible(TRANSACTION_TYPES.RENTAL, 'Rental Confirmed / Move-in Completed'), true);
  assert.equal(isStageCompatible(TRANSACTION_TYPES.RENTAL, 'Purchase Completed'), false);
  assert.equal(isStageCompatible(TRANSACTION_TYPES.PURCHASE, 'Visit Scheduled'), true);
  assert.equal(isStageCompatible(TRANSACTION_TYPES.RENTAL, 'Visit Scheduled'), true);
});

test('default event type mapping', () => {
  assert.equal(getDefaultEventTypeForStage('Property Selected'), 'PROPERTY_SELECTED');
  assert.equal(getDefaultEventTypeForStage('Enquiry Received'), 'ENQUIRY_RECEIVED');
  assert.equal(getDefaultEventTypeForStage('Visit Scheduled'), 'VISIT_SCHEDULED');
  assert.equal(getDefaultEventTypeForStage('Visit Completed'), 'VISIT_COMPLETED');
  assert.equal(getDefaultEventTypeForStage('Negotiation / Offer'), 'NEGOTIATION_OFFER');
  assert.equal(getDefaultEventTypeForStage('Booking Confirmed'), 'BOOKING_CONFIRMED');
  assert.equal(getDefaultEventTypeForStage('Purchase Completed'), 'PURCHASE_COMPLETED');
  assert.equal(getDefaultEventTypeForStage('Rental Confirmed / Move-in Completed'), 'RENTAL_CONFIRMED');
  assert.equal(getDefaultEventTypeForStage('Cancelled / Deal Lost'), 'DEAL_CANCELLED');
  assert.equal(getDefaultEventTypeForStage('Custom State'), 'STAGE_UPDATED');
});

test('formatActivityDateTime formats in India time safely', () => {
  assert.equal(formatActivityDateTime(''), 'Not recorded');
  assert.equal(formatActivityDateTime(null), 'Not recorded');
  assert.equal(formatActivityDateTime('invalid-date'), 'Invalid date');

  // Verify India time conversion (UTC+5:30)
  const utcDate = '2026-10-23T12:00:00Z';
  const formatted = formatActivityDateTime(utcDate);
  // 12:00 UTC is 17:30 (5:30 pm) in India
  assert.match(formatted, /23/);
  assert.match(formatted, /Oct/i);
  assert.match(formatted, /2026/);
  assert.match(formatted, /5:30/i);
  assert.match(formatted, /pm/i);
});

test('fetchLinkedProperties makes authenticated GET request to contract endpoint', async () => {
  let captured = null;
  const mockFetcher = async (url, options) => {
    captured = { url, options };
    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        count: 1,
        data: [{ id: 10, propertyId: 1, transactionType: 'Purchase', currentStage: 'Visit Scheduled' }]
      })
    };
  };

  const res = await fetchLinkedProperties(
    'https://example.test/api',
    'HP-B001',
    { token: 'secret-token' },
    mockFetcher
  );

  assert.equal(res.success, true);
  assert.equal(res.count, 1);
  assert.equal(captured.url, 'https://example.test/api/buy-requirements/HP-B001/properties');
  assert.equal(captured.options.method, 'GET');
  assert.equal(captured.options.headers.Authorization, 'Bearer secret-token');
});

test('linkPropertyToRequirement validates compatibility and sends POST contract', async () => {
  let captured = null;
  const mockFetcher = async (url, options) => {
    captured = { url, options };
    return {
      ok: true,
      status: 201,
      json: async () => ({ success: true, message: 'Property successfully linked to buyer requirement' })
    };
  };

  // Rejects client-side if stage incompatible with transaction type
  await assert.rejects(
    () => linkPropertyToRequirement(
      'https://example.test/api',
      1,
      { propertyId: 2, transactionType: 'Rental', initialStage: 'Purchase Completed' },
      {},
      mockFetcher
    ),
    (err) => err.status === 400 && /not compatible/.test(err.message)
  );

  const res = await linkPropertyToRequirement(
    'https://example.test/api',
    'HP-B001',
    { propertyId: 2, transactionType: 'Rental', initialStage: 'Property Selected', notes: 'Interested in rental' },
    { token: 'token-abc' },
    mockFetcher
  );

  assert.equal(res.success, true);
  assert.equal(captured.url, 'https://example.test/api/buy-requirements/HP-B001/properties');
  assert.equal(captured.options.method, 'POST');
  const body = JSON.parse(captured.options.body);
  assert.equal(body.propertyId, 2);
  assert.equal(body.transactionType, 'Rental');
  assert.equal(body.initialStage, 'Property Selected');
  assert.equal(body.notes, 'Interested in rental');
});

test('recordPropertyActivity enforces cancellationReason and sends POST contract', async () => {
  let captured = null;
  const mockFetcher = async (url, options) => {
    captured = { url, options };
    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true, message: 'Customer journey activity recorded' })
    };
  };

  // Rejects client-side if cancellationReason is empty when stage is Cancelled
  await assert.rejects(
    () => recordPropertyActivity(
      'https://example.test/api',
      'HP-B001',
      3,
      { stage: 'Cancelled / Deal Lost', cancellationReason: '   ' },
      {},
      mockFetcher
    ),
    (err) => err.status === 400 && /cancellation reason is required/i.test(err.message)
  );

  // Successfully records cancellation with reason
  const res = await recordPropertyActivity(
    'https://example.test/api',
    'HP-B001',
    3,
    {
      stage: 'Cancelled / Deal Lost',
      cancellationReason: 'Buyer chose another locality',
      notes: 'Deal closed without conversion'
    },
    { token: 'token-123' },
    mockFetcher
  );

  assert.equal(res.success, true);
  assert.equal(captured.url, 'https://example.test/api/buy-requirements/HP-B001/properties/3/activities');
  assert.equal(captured.options.method, 'POST');
  const body = JSON.parse(captured.options.body);
  assert.equal(body.stage, 'Cancelled / Deal Lost');
  assert.equal(body.eventType, 'DEAL_CANCELLED');
  assert.equal(body.cancellationReason, 'Buyer chose another locality');
  assert.equal(body.notes, 'Deal closed without conversion');
});

test('fetchPropertyActivities and unlinkProperty endpoints', async () => {
  let historyCaptured = null;
  let unlinkCaptured = null;

  const mockFetcher = async (url, options) => {
    if (options.method === 'GET') {
      historyCaptured = { url, options };
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            link: { id: 1, currentStage: 'Visit Completed' },
            timeline: [{ id: 1, stage: 'Property Selected' }, { id: 2, stage: 'Visit Completed' }]
          }
        })
      };
    }
    if (options.method === 'DELETE') {
      unlinkCaptured = { url, options };
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, message: 'Property unlinked' })
      };
    }
    throw new Error('Unexpected method');
  };

  const activities = await fetchPropertyActivities(
    'https://example.test/api',
    'HP-B001',
    5,
    { token: 'tok' },
    mockFetcher
  );
  assert.equal(activities.success, true);
  assert.equal(activities.data.timeline.length, 2);
  assert.equal(historyCaptured.url, 'https://example.test/api/buy-requirements/HP-B001/properties/5/activities');

  const unlinked = await unlinkPropertyFromRequirement(
    'https://example.test/api',
    'HP-B001',
    5,
    { token: 'tok' },
    mockFetcher
  );
  assert.equal(unlinked.success, true);
  assert.equal(unlinkCaptured.url, 'https://example.test/api/buy-requirements/HP-B001/properties/5');
  assert.equal(unlinkCaptured.options.method, 'DELETE');
});

test('API error handling with standard HTTP status preservation', async () => {
  for (const status of [400, 401, 403, 404, 409, 500]) {
    const mockFetcher = async () => ({
      ok: false,
      status,
      json: async () => ({ success: false, message: `Custom error message for ${status}` })
    });

    await assert.rejects(
      () => trackingRequest('https://example.test/api', '/buy-requirements/1/properties', {}, mockFetcher),
      (err) => err.status === status && err.message.length > 0
    );
  }
});
