import test from 'node:test';
import assert from 'node:assert/strict';
import { selectReminders } from '../src/utils/rentalReminders.js';
import { rentalRequest } from '../src/utils/rentalApi.js';

const agreements = [{ id: 7, tenant_name: 'Anita', title: 'Lake House', property_id: 'HP-R009' }];
const alerts = [{ id: '7:expiry', agreementId: 7, type: 'Agreement expiring', date: '2026-10-16' }, { id: '7:anniversary:2026', agreementId: 7, type: 'Yearly anniversary', date: '2026-10-17' }];
test('reminder filters join actual records without creating or duplicating events', () => {
  assert.equal(selectReminders(alerts, agreements, []).length, 2);
  for (const search of ['anita', 'LAKE', 'hp-r009', 'RA-7']) assert.equal(selectReminders(alerts, agreements, [], { search }).length, 2);
  assert.equal(selectReminders(alerts, agreements, [], { search: 'missing' }).length, 0);
  assert.equal(selectReminders(alerts, agreements, ['7:expiry'], { status: 'read' })[0].id, '7:expiry');
  assert.equal(selectReminders(alerts, agreements, ['7:expiry'], { status: 'unread', type: 'Annual Anniversary' })[0].id, '7:anniversary:2026');
  assert.equal(selectReminders(alerts, agreements, [], { type: 'Move-Out' }).length, 0);
  assert.deepEqual(selectReminders([], agreements, []), []);
});
test('read and unread actions preserve the existing POST /read contract', async () => {
  for (const read of [true, false]) {
    await rentalRequest('/api', '/read', { method: 'POST', body: { eventId: '7:expiry', read } }, async (url, options) => {
      assert.equal(url, '/api/rentals/read');
      assert.equal(options.method, 'POST');
      assert.deepEqual(JSON.parse(options.body), { eventId: '7:expiry', read });
      return { ok: true, json: async () => ({ success: true }) };
    });
  }
});
