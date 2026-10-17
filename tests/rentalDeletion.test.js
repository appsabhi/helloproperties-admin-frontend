import test from 'node:test';
import assert from 'node:assert/strict';
import { deletionPresentation, validateDeletionReason, submitRentalDeletion } from '../src/utils/rentalDeletion.js';
import { agreementStatus, nextReminder, rentalSummary } from '../src/utils/rentalView.js';

test('delete confirmation blocks unsafe or unknown eligibility and explains retained dependencies', () => {
  assert.equal(deletionPresentation({}).blocked, true);
  assert.equal(deletionPresentation({ deletion: { mode: 'blocked', message: 'Confirm move-out first.' } }).message, 'Confirm move-out first.');
  assert.equal(deletionPresentation({ deletion: { mode: 'void', message: 'History will be preserved.' } }).blocked, false);
  assert.ok(validateDeletionReason(' '));
  assert.ok(validateDeletionReason('x'.repeat(2001)));
});
test('void uses version and reason, and rejects conflicts or unconfirmed outcomes without success', async () => {
  const agreement = { id: 7, version: 3 };
  let captured;
  const success = await submitRentalDeletion(async (...args) => { captured = args; return { success: true, data: { outcome: 'voided' } }; }, agreement, ' Duplicate record ');
  assert.deepEqual(captured, ['/7/delete', 'POST', { version: 3, reason: 'Duplicate record' }]);
  assert.match(success.message, /preserved/);
  for (const status of [401, 403, 409, 500]) await assert.rejects(submitRentalDeletion(async () => { throw Object.assign(new Error('Blocked by protected occupancy'), { status }); }, agreement, 'Duplicate record'), e => e.status === status);
  await assert.rejects(submitRentalDeletion(async () => ({ success: false }), agreement, 'Duplicate record'), /did not confirm/);
  await assert.rejects(submitRentalDeletion(async () => ({ success: true }), agreement, 'Duplicate record'), /did not confirm/);
});
test('voided records never appear as active or generate a next reminder', () => {
  const agreement = { id: 7, voided_at: '2026-10-17', end_date: '2027-10-16' };
  assert.equal(agreementStatus(agreement, '2026-10-17'), 'Voided');
  assert.equal(nextReminder(agreement, '2026-10-17'), 'None ? voided');
  assert.deepEqual(rentalSummary([agreement], '2026-10-17').map(s => s.value), [0, 0, 0, 0]);
});
