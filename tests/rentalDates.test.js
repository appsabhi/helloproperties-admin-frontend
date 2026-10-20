import test from 'node:test';
import assert from 'node:assert/strict';
import { agreementEnd, anniversary, rentalAlerts, rentalToday, validDate } from '../src/utils/rentalDates.js';
const rental = { id: 1, property_id: 'HP-R001', tenant_name: 'Customer', start_date: '2026-10-17', end_date: '2027-10-16', reminder_days: 30, move_out_date: null };
test('annual agreement uses inclusive end date', () => {
  assert.equal(agreementEnd('2026-10-17'), '2027-10-16');
  assert.equal(agreementEnd('2026-12-31'), '2027-12-30');
  assert.equal(agreementEnd('2024-02-29'), '2025-02-27');
  assert.equal(anniversary('2024-02-29', 2028), '2028-02-29');
  assert.equal(validDate('2026-02-30'), false);
});
test('reminder starts exactly 30 days before inclusive expiry', () => {
  assert.equal(rentalAlerts([rental], '2027-09-15').length, 0);
  assert.equal(rentalAlerts([rental], '2027-09-16')[0].type, 'Agreement expiring');
  assert.equal(rentalAlerts([rental], '2027-10-16')[0].type, 'Agreement expiring');
});
test('continuing tenant gets a distinct anniversary event every year without drift', () => {
  assert.equal(rentalAlerts([rental], '2027-10-17').length, 2);
  const alerts = rentalAlerts([rental], '2029-10-17');
  assert.deepEqual(alerts.filter(a => a.type === 'Yearly anniversary').map(a => a.date), ['2029-10-17','2028-10-17','2027-10-17']);
  assert.equal(new Set(alerts.map(a => a.id)).size, 4);
});
test('move-out stops expiry and anniversary alerts, leaving vacancy event', () => {
  const alerts = rentalAlerts([{ ...rental, move_out_date: '2027-10-18' }], '2029-10-17');
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].type, 'Move-out recorded');
});
test('India date changes independently of browser timezone', () => {
  assert.equal(rentalToday(new Date('2026-10-16T18:30:00Z')), '2026-10-17');
});
