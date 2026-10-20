// Calendar dates use UTC arithmetic; business 'today' is always India time.
export function rentalToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
export function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export function anniversary(start, year) {
  if (!validDate(start)) throw new Error('A valid start date is required.');
  const [, month, day] = start.split('-').map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return new Date(Date.UTC(year, month - 1, Math.min(day, last))).toISOString().slice(0, 10);
}
export function agreementEnd(start) {
  const next = anniversary(start, Number(start.slice(0, 4)) + 1);
  return new Date(Date.parse(next) - 86400000).toISOString().slice(0, 10);
}
export function rentalAlerts(agreements, today = rentalToday()) {
  const alerts = [];
  for (const a of agreements) {
    if (a.move_out_date) {
      alerts.push({ id: `${a.id}:vacant`, agreementId: a.id, date: a.move_out_date, type: 'Move-out recorded', text: `${a.property_id} · ${a.tenant_name} moved out. Property marked available on ${a.move_out_date}.` });
      continue;
    }
    const days = (Date.parse(a.end_date) - Date.parse(today)) / 86400000;
    const expiryId = a.current_start_date && a.current_start_date !== a.start_date ? `${a.id}:expiry:${a.end_date}` : `${a.id}:expiry`;
    if (days <= a.reminder_days) alerts.push({ id: expiryId, agreementId: a.id, date: a.end_date, type: days < 0 ? 'Agreement expired' : 'Agreement expiring', text: `${a.property_id} · ${a.tenant_name}: agreement ends ${a.end_date}. ${days < 0 ? 'Still occupied — follow up with tenant.' : `${days} days remaining.`}` });
    // Keep each anniversary as its own event, including anniversaries missed while offline.
    for (let year = Number(a.start_date.slice(0, 4)) + 1; year <= Number(today.slice(0, 4)); year++) {
      const date = anniversary(a.start_date, year);
      if (date <= today) alerts.push({ id: `${a.id}:anniversary:${year}`, agreementId: a.id, date, type: 'Yearly anniversary', text: `${a.property_id} · ${a.tenant_name}: rental anniversary ${date}. Tenant is still recorded as occupying the property.` });
    }
  }
  return alerts.sort((a, b) => b.date.localeCompare(a.date));
}
