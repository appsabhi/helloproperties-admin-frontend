import test from 'node:test';
import assert from 'node:assert/strict';
import { rentalRequest } from '../src/utils/rentalApi.js';
test('rental mutations use authenticated API contract and preserve version', async () => {
  let captured;
  const result = await rentalRequest('https://example.test/api/', '/12/renew', { method: 'POST', token: 'test-token', body: { version: 2, startDate: '2026-10-17' } }, async (url, options) => {
    captured = { url, options }; return { ok: true, status: 200, json: async () => ({ success: true }) };
  });
  assert.equal(result.success, true);
  assert.equal(captured.url, 'https://example.test/api/rentals/12/renew');
  assert.equal(captured.options.credentials, 'include');
  assert.equal(captured.options.headers.Authorization, 'Bearer test-token');
  assert.equal(JSON.parse(captured.options.body).version, 2);
});
test('failed reads, conflicts, sessions and malformed responses never succeed silently', async () => {
  for (const status of [401,403,409,500]) {
    await assert.rejects(rentalRequest('/api', '/read', { method: 'POST', body: { eventId: '1:expiry' } }, async () => ({ ok: false, status, json: async () => ({ message: 'Conflict from backend' }) })), e => e.status === status && !!e.message);
  }
  await assert.rejects(rentalRequest('/api', '', {}, async () => ({ ok: true, status: 200, json: async () => { throw new Error('HTML'); } })), /unavailable/);
  await assert.rejects(rentalRequest('/api', '', {}, async () => { throw new TypeError('Network unavailable'); }), /Network/);
});
