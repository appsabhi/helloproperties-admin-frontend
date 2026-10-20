import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('rental page renders real agreement data, states and permission restrictions', async () => {
  // SSR exercises the real JSX without a browser or remote backend.
  globalThis.window = { location: { hostname: 'localhost' } };
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  try {
    const { renderRentalPage, renderRentalDeleteDialog } = await server.ssrLoadModule('/tests/fixtures/rentalPage.jsx');
    assert.match(renderRentalPage(), /No rental agreements yet/);
    assert.match(renderRentalPage({ loading: true }), /Loading rental agreements/);
    assert.match(renderRentalPage({ error: 'Server unavailable' }), /Server unavailable/);
    const denied = renderRentalPage({ canManage: false });
    assert.match(denied, /restricted/);
    assert.doesNotMatch(denied, /New agreement/);
    const agreement = { id: 7, property_db_id: 9, property_id: 'HP-R009', title: 'Lake House', tenant_name: 'Anita', tenant_phone: '1234567890', start_date: '2025-10-17', end_date: '2026-10-16', reminder_days: 30, rent_amount: 18000 };
    const html = renderRentalPage({ agreements: [agreement] });
    const completedForDelete = { ...agreement, version: 3, move_out_date: '2026-10-15', deletion: { mode: 'void', message: 'History and notifications will be preserved.' } };
    const deleteHtml = renderRentalDeleteDialog(completedForDelete);
    for (const value of ['Delete Agreement', 'RA-7', 'Anita', 'Lake House', 'HP-R009', 'Reason (required)', 'History and notifications will be preserved.', 'Void agreement']) assert.ok(deleteHtml.includes(value), value);
    assert.match(renderRentalDeleteDialog({ ...agreement, deletion: { mode: 'blocked', message: 'Confirm genuine move-out first.' } }), /Confirm genuine move-out first/);
    assert.match(renderRentalDeleteDialog(completedForDelete, 4), /agreement changed/);
    assert.match(renderRentalPage({ agreements: [completedForDelete], capabilities: { deleteAgreement: true } }, { path: '/rentals?agreement=7' }), /Delete Agreement/);
    assert.doesNotMatch(renderRentalPage({ agreements: [{ ...completedForDelete, voided_at: '2026-10-17' }], capabilities: { deleteAgreement: true } }), />Delete Agreement</);

    const voidedAgreement = { id: 9, property_db_id: 12, property_id: 'HP-R012', title: 'Mountain Villa', tenant_name: 'Rahul', tenant_phone: '9876543210', start_date: '2025-05-01', end_date: '2026-04-30', reminder_days: 30, rent_amount: 25000, voided_at: '2026-10-18T10:00:00Z', voided_by: 'admin', void_reason: 'Test contract cancelled' };
    const mixedPageHtml = renderRentalPage({ agreements: [agreement, voidedAgreement] });
    assert.ok(mixedPageHtml.includes('RA-7'), 'Active list should include active RA-7');
    assert.ok(!mixedPageHtml.includes('RA-9'), 'Active list should exclude voided RA-9');
    assert.match(mixedPageHtml, /Active Agreements/);
    assert.match(mixedPageHtml, /Voided \/ Archived/);

    const voidedPageHtml = renderRentalPage({ agreements: [agreement, voidedAgreement] }, { path: '/rentals?view=voided' });
    assert.ok(voidedPageHtml.includes('RA-9'), 'Voided view should include RA-9');
    assert.ok(!voidedPageHtml.includes('RA-7'), 'Voided view should exclude active RA-7');
    assert.ok(voidedPageHtml.includes('Voided on'), 'Voided view displays voided timestamp');
    assert.ok(voidedPageHtml.includes('Test contract cancelled'), 'Voided view displays void reason');

    const voidedDetailsHtml = renderRentalPage({ agreements: [agreement, voidedAgreement] }, { path: '/rentals?agreement=9' });
    assert.ok(voidedDetailsHtml.includes('Voided agreement'), 'Details modal displays voided banner');
    assert.ok(voidedDetailsHtml.includes('Test contract cancelled'), 'Details modal displays void reason');
    assert.ok(voidedDetailsHtml.includes('Agreement history'), 'Details modal displays agreement history');

    for (const value of ['RA-7','Lake House','Anita','1234567890','18,000','Expiring Soon','View details','Confirm Move-Out']) assert.ok(html.includes(value), value);
    assert.doesNotMatch(renderRentalPage({ agreements: [{ ...agreement, move_out_date: '2026-10-15' }] }), />Confirm Move-Out</);
    assert.match(renderRentalPage({ capabilities: {} }), /Deploy the rental history API/);
    assert.doesNotMatch(html, /Rental notifications/);
    const event = { id: '7:expiry', agreementId: 7, type: 'Agreement expiring', date: '2026-10-16', text: 'Agreement ends soon.' };
    const reminderData = { agreements: [agreement], alerts: [event], unread: [event] };
    const reminderHtml = renderRentalPage(reminderData, { reminders: true });
    for (const value of ['Rental Reminders', 'Anita', 'Lake House', 'RA-7', 'Expiry date', 'Notification created', 'Not provided by server', 'Mark as Read', '/rentals?agreement=7']) assert.ok(reminderHtml.includes(value), value);
    assert.match(renderRentalPage({ ...reminderData, readIds: ['7:expiry'], unread: [] }, { reminders: true }), /Mark as Unread/);
    assert.match(renderRentalPage({ remindersAvailable: false }, { reminders: true }), /unavailable from this server/);
    assert.match(renderRentalPage({ loading: true }, { reminders: true }), /Loading rental reminders/);
    assert.match(renderRentalPage({ error: 'Reminder API failed' }, { reminders: true }), /Reminder API failed/);
    assert.doesNotMatch(renderRentalPage({ canManage: false }, { reminders: true }), /Mark as Read/);
    const navigation = renderRentalPage(reminderData, { reminders: true, layout: true, path: '/rental-reminders' });
    assert.match(navigation, /aria-label="1 unread rental reminders"/);
    assert.match(navigation, /aria-current="page"[^>]*href="\/rental-reminders"/);
    assert.doesNotMatch(navigation, /aria-current="page"[^>]*href="\/rentals"/);
    const readNavigation = renderRentalPage({ ...reminderData, readIds: ['7:expiry'], unread: [] }, { reminders: true, layout: true, path: '/rental-reminders' });
    assert.doesNotMatch(readNavigation, /aria-label="\d+ unread rental reminders"/);
  } finally { await server.close(); delete globalThis.window; }
});
