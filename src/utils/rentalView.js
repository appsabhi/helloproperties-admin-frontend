import { anniversary, validDate } from './rentalDates.js';

export const daysBetween = (start, end) => Math.round((Date.parse(end) - Date.parse(start)) / 86400000);
export const shiftDate = (date, days) => new Date(Date.parse(date) + days * 86400000).toISOString().slice(0, 10);
export const agreementId = a => `RA-${a.id}`;
export function agreementStatus(a, today) {
  if (a.voided_at) return 'Voided';
  if (a.move_out_date) return 'Completed';
  const days = daysBetween(today, a.end_date);
  return days < 0 ? 'Expired' : days <= 30 ? 'Expiring Soon' : 'Active';
}
export function nextReminder(a, today) {
  if (a.voided_at) return 'None ? voided';
  if (a.move_out_date) return 'None — completed';
  if (a.end_date < today) return 'Overdue — follow up now';
  const expiry = shiftDate(a.end_date, -a.reminder_days);
  let year = Number(today.slice(0, 4));
  let annual = anniversary(a.start_date, year);
  if (annual < today || annual <= a.start_date) annual = anniversary(a.start_date, year + 1);
  if (expiry <= today) return 'Expiry reminder due now';
  return annual < expiry ? `Anniversary · ${displayDate(annual)}` : `Expiry · ${displayDate(expiry)}`;
}
export function displayDate(date) {
  if (!date || !validDate(date.slice(0, 10)) || !Number.isFinite(Date.parse(date))) return 'Not recorded';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: date.length > 10 ? 'Asia/Kolkata' : 'UTC' }).format(new Date(date));
}
export function rentLabel(a) {
  return a.rent_amount === null || a.rent_amount === undefined ? 'Not recorded' : `${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(a.rent_amount))} / month`;
}
export function selectAgreements(agreements, { search = '', status = '', sort = 'expiry-asc', page = 1, pageSize = 12 }, today) {
  const query = search.trim().toLowerCase();
  const rows = agreements.filter(a => (!status || agreementStatus(a, today) === status) && (!query || [a.tenant_name, a.title, a.property_id, agreementId(a)].some(value => String(value || '').toLowerCase().includes(query))));
  rows.sort((a, b) => {
    const key = sort.startsWith('created') ? 'created_at' : 'end_date';
    const comparison = String(a[key] || '').localeCompare(String(b[key] || '')) || Number(a.id) - Number(b.id);
    return sort.endsWith('desc') ? -comparison : comparison;
  });
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), pages);
  return { rows: rows.slice((currentPage - 1) * pageSize, currentPage * pageSize), total: rows.length, pages, page: currentPage };
}
export function rentalSummary(agreements, today) {
  return [
    { label: 'Active agreements', value: agreements.filter(a => !a.voided_at && !a.move_out_date && a.end_date >= today).length },
    { label: 'Expiring within 30 days', value: agreements.filter(a => agreementStatus(a, today) === 'Expiring Soon').length },
    { label: 'Expired · still occupied', value: agreements.filter(a => agreementStatus(a, today) === 'Expired').length },
    { label: 'Move-outs · last 30 days', value: agreements.filter(a => a.move_out_date && daysBetween(a.move_out_date, today) >= 0 && daysBetween(a.move_out_date, today) < 30).length }
  ];
}
export function validateRentalForm(form, mode, today, agreement) {
  const errors = {};
  if (mode === 'create' && !form.propertyId) errors.propertyId = 'Select a rental property.';
  if (['create', 'edit'].includes(mode) && !form.tenantName?.trim()) errors.tenantName = 'Enter the tenant name.';
  if (mode !== 'move-out' && ![7, 15, 30, 60, 90].includes(Number(form.reminderDays))) errors.reminderDays = 'Select a reminder period.';
  if (mode !== 'move-out' && form.rentAmount !== '' && (!Number.isFinite(Number(form.rentAmount)) || Number(form.rentAmount) < 0)) errors.rentAmount = 'Enter a valid monthly rent of zero or more.';
  if (mode === 'create' && (!validDate(form.startDate) || form.startDate < '1900-01-01' || form.startDate > today)) errors.startDate = 'Enter an actual start date on or before today.';
  if (mode === 'renew' && (!validDate(form.startDate) || form.startDate !== shiftDate(agreement.end_date, 1) || form.startDate > today)) errors.startDate = 'Renewal must start the day after the current period ends, on or before today.';
  if (mode === 'move-out' && (!validDate(form.moveOutDate) || form.moveOutDate < (agreement.current_start_date || agreement.start_date) || form.moveOutDate > today)) errors.moveOutDate = 'Choose a date within the current agreement period, on or before today.';
  return errors;
}
