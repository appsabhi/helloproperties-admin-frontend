export const reminderTypes = {
  'Agreement expiring': 'Expiring Soon',
  'Agreement expired': 'Expired',
  'Yearly anniversary': 'Annual Anniversary',
  'Move-out recorded': 'Move-Out'
};

// Join API notifications to their agreement; never create additional events.
export function selectReminders(alerts, agreements, readIds, { search = '', status = 'all', type = '' } = {}) {
  const lookup = new Map(agreements.map(a => [String(a.id), a]));
  const read = new Set(readIds);
  const query = search.trim().toLowerCase();
  return alerts.map(event => ({ ...event, agreement: lookup.get(String(event.agreementId)), label: reminderTypes[event.type] || event.type, isRead: read.has(event.id) }))
    .filter(event => (!type || event.label === type) && (status === 'all' || (status === 'read' ? event.isRead : !event.isRead)) &&
      (!query || [event.agreement?.tenant_name, event.agreement?.title, event.agreement?.property_id, `RA-${event.agreementId}`].some(value => String(value || '').toLowerCase().includes(query))));
}
