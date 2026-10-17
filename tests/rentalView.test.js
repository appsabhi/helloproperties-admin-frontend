import test from 'node:test';
import assert from 'node:assert/strict';
import { agreementStatus, nextReminder, selectAgreements, rentalSummary, validateRentalForm, displayDate } from '../src/utils/rentalView.js';
import { rentalAlerts } from '../src/utils/rentalDates.js';
const base = { id: 1, property_id: 'HP-R001', title: 'Lake house', tenant_name: 'Anita', start_date: '2025-10-17', end_date: '2026-10-16', reminder_days: 30, created_at: '2025-10-10' };
test('history timestamps display in India time while calendar dates stay unchanged', () => {
  assert.equal(displayDate('2026-10-16T18:30:00Z'), '17 Oct 2026');
  assert.equal(displayDate('2026-10-16'), '16 Oct 2026');
});
test('status and summary boundaries never infer move-out from expiry', () => {
  assert.equal(agreementStatus(base, '2026-09-15'), 'Active');
  assert.equal(agreementStatus(base, '2026-09-16'), 'Expiring Soon');
  assert.equal(agreementStatus(base, '2026-10-16'), 'Expiring Soon');
  assert.equal(agreementStatus(base, '2026-10-17'), 'Expired');
  assert.equal(agreementStatus({ ...base, move_out_date: '2026-10-16' }, '2026-10-17'), 'Completed');
  assert.deepEqual(rentalSummary([base], '2026-10-17').map(s => s.value), [0, 0, 1, 0]);
  assert.equal(nextReminder(base, '2026-09-15'), 'Expiry · 16 Sept 2026');
});
test('search, filters, stable sorting and pagination handle shrinking results', () => {
  const rows = Array.from({ length: 25 }, (_, i) => ({ ...base, id: i + 1, created_at: `2025-10-${String(i + 1).padStart(2, '0')}` }));
  for (const search of ['anita', 'LAKE', 'hp-r001']) assert.equal(selectAgreements(rows, { search }, '2026-10-16').total, 25);
  assert.equal(selectAgreements(rows, { search: 'RA-25' }, '2026-10-16').rows[0].id, 25);
  assert.equal(selectAgreements(rows, { sort: 'created-desc' }, '2026-10-16').rows[0].id, 25);
  assert.equal(selectAgreements(rows, { page: 3 }, '2026-10-16').rows.length, 1);
  assert.equal(selectAgreements(rows, { page: 3, search: 'RA-25' }, '2026-10-16').page, 1);
  assert.equal(selectAgreements(rows, { status: 'Completed' }, '2026-10-16').total, 0);
});
test('form validation rejects invalid dates, blank tenants and premature renewal', () => {
  const form = { propertyId: 1, tenantName: '  ', rentAmount: -1, reminderDays: 30, startDate: '2026-02-30' };
  assert.deepEqual(Object.keys(validateRentalForm(form, 'create', '2026-10-16')).sort(), ['rentAmount','startDate','tenantName']);
  assert.ok(validateRentalForm({ ...form, startDate: '2026-10-17' }, 'renew', '2026-10-16', base).startDate);
  assert.ok(validateRentalForm({ moveOutDate: '2025-10-16' }, 'move-out', '2026-10-16', base).moveOutDate);
});
test('renewal has a new expiry event but original anniversary identity', () => {
  const renewed = { ...base, current_start_date: '2026-10-17', end_date: '2027-10-16' };
  const alerts = rentalAlerts([renewed], '2027-10-17');
  assert.ok(alerts.some(a => a.id === '1:expiry:2027-10-16'));
  assert.ok(alerts.some(a => a.id === '1:anniversary:2026'));
  assert.equal(new Set(alerts.map(a => a.id)).size, alerts.length);
});
