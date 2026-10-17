import React, { useContext, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, RefreshCw, KeyRound } from 'lucide-react';
import { RentalContext } from '../context/RentalContext';
import { PropertyContext } from '../context/PropertyContext';
import Modal from '../components/Modal';
import RentalDeleteDialog from '../components/RentalDeleteDialog';
import { agreementEnd, validDate } from '../utils/rentalDates';
import { agreementId, agreementStatus, displayDate, nextReminder, rentLabel, selectAgreements, shiftDate, validateRentalForm } from '../utils/rentalView';

const field = 'mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm focus:border-[#C4005A] focus:outline-none focus:ring-2 focus:ring-pink-100';
const primary = 'inline-flex items-center justify-center gap-2 rounded-lg bg-[#C4005A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#B0004F] disabled:opacity-50';
const secondary = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50';
const statusColors = { Active: 'bg-emerald-50 text-emerald-700', 'Expiring Soon': 'bg-amber-50 text-amber-800', Expired: 'bg-red-50 text-red-700', Completed: 'bg-slate-100 text-slate-600', Voided: 'bg-slate-100 text-slate-600' };
const titles = { create: 'Create rental agreement', edit: 'Edit agreement', renew: 'Confirm agreement renewal', 'move-out': 'Confirm Move-Out', details: 'Agreement details' };
function Badge({ agreement, today }) {
  const status = agreementStatus(agreement, today);
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusColors[status]}`}>{status}</span>;
}
function Detail({ label, children }) { return <div><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm font-medium">{children}</dd></div>; }

export default function RentalAgreements() {
  const { agreements, alerts, readIds, error, loading, syncing, refresh, request, today, capabilities, canManage } = useContext(RentalContext);
  const { properties, fetchFromBackend } = useContext(PropertyContext);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('expiry-asc');
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const [localDialog, setDialog] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const linkedId = searchParams.get('agreement');
  const linkedAgreement = agreements.find(a => String(a.id) === linkedId);
  const dialog = localDialog || (linkedAgreement ? { mode: 'details', id: linkedAgreement.id, version: linkedAgreement.version } : null);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const [message, setMessage] = useState('');
  const [failure, setFailure] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [propertyWarning, setPropertyWarning] = useState('');
  const selected = agreements.find(a => a.id === dialog?.id);
  const available = properties.filter(p => p.listingType === 'Rent' && ['Available', 'Rented', 'Under Negotiation'].includes(p.status) && !agreements.some(a => String(a.property_db_id) === String(p.id) && !a.move_out_date && !a.voided_at));
  const result = selectAgreements(agreements, { search, status, sort, page }, today);
  const stale = selected && dialog?.version !== selected.version;
  const blocked = busy || loading || !!error || !canManage;
  const close = () => { if (!saving.current) { setDialog(null); setDialogError(''); if (linkedId) setSearchParams(prev => { const next = new URLSearchParams(prev); next.delete('agreement'); return next; }, { replace: true }); } };

  function open(mode, agreement) {
    setDialog({ mode, id: agreement?.id, version: agreement?.version }); setErrors({}); setDialogError('');
    setForm({ propertyId: agreement?.property_db_id || '', tenantName: agreement?.tenant_name || '', tenantPhone: agreement?.tenant_phone || '',
      startDate: mode === 'renew' ? shiftDate(agreement.end_date, 1) : agreement?.current_start_date || agreement?.start_date || today,
      reminderDays: agreement?.reminder_days || 30, rentAmount: agreement?.rent_amount ?? '', moveOutDate: today, notes: '' });
  }
  async function syncProperties() {
    try {
      const outcome = await fetchFromBackend();
      setPropertyWarning(outcome?.success ? '' : 'Property data could not be refreshed. Retry property sync.');
    } catch { setPropertyWarning('Property data could not be refreshed. Retry property sync.'); }
  }
  async function submit(e) {
    e.preventDefault();
    if (saving.current || blocked) return;
    if (stale) { setDialogError('This agreement changed. Reload the latest details before saving.'); return; }
    const validation = validateRentalForm(form, dialog.mode, today, selected);
    setErrors(validation);
    if (Object.keys(validation).length) return;
    saving.current = true; setBusy(true); setDialogError(''); setFailure(''); setMessage('');
    const mode = dialog.mode;
    try {
      let body = { tenantName: form.tenantName.trim(), tenantPhone: form.tenantPhone.trim(), reminderDays: Number(form.reminderDays), version: dialog.version };
      if (capabilities.rentAmount) body.rentAmount = form.rentAmount === '' ? null : Number(form.rentAmount);
      if (mode === 'create') body = { ...body, propertyId: form.propertyId, startDate: form.startDate };
      if (mode === 'renew') body.startDate = form.startDate;
      if (mode === 'move-out') body = { moveOutDate: form.moveOutDate, version: dialog.version, ...(capabilities.moveOutNotes ? { notes: form.notes.trim() } : {}) };
      await request(mode === 'create' ? '' : `/${selected.id}/${mode}`, 'POST', body);
      setDialog(null);
      setMessage(mode === 'move-out' ? 'Move-out confirmed by the server.' : mode === 'renew' ? 'Renewal saved. Previous agreement periods remain in history.' : mode === 'edit' ? 'Agreement changes saved.' : 'Agreement created. The property is marked Rented.');
      await Promise.allSettled([refresh(), syncProperties()]);
    } catch (err) {
      setDialogError(err.message);
      if (err.status === 409) await refresh();
    } finally { saving.current = false; setBusy(false); }
  }
  const change = e => { const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value })); setErrors(prev => ({ ...prev, [name]: '' })); };
  const inputProps = name => ({ name, id: `rental-${name}`, value: form[name] ?? '', onChange: change, className: field, 'aria-invalid': !!errors[name], 'aria-describedby': errors[name] ? `error-${name}` : undefined });
  const fieldError = name => errors[name] && <span id={`error-${name}`} className="mt-1 block text-xs text-red-700">{errors[name]}</span>;
  const canRenew = a => capabilities.renew && a.end_date < today;

  if (!canManage && !loading) return <div role="alert" className="rounded-xl border bg-white p-6">{error || 'Rental agreement management is restricted to authorized Admin and Staff accounts.'}</div>;
  return <div className="space-y-6 text-[#171717]">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold">Rental Agreements</h1><p className="mt-1 text-sm text-slate-500">Manage annual agreements, reminders, and confirmed move-outs.</p></div><div className="flex gap-2"><button onClick={refresh} disabled={syncing} className={secondary} aria-label="Refresh agreements"><RefreshCw size={17} className={syncing ? 'animate-spin' : ''} /></button><button onClick={() => open('create')} disabled={blocked} className={primary}><Plus size={17} />New agreement</button></div></div>
    {(error || failure) && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{failure || error} {error && 'Displayed records may be out of date.'} <button disabled={syncing} onClick={() => { setFailure(''); refresh(); }} className="font-semibold underline">Retry</button></div>}
    {linkedId && !loading && !error && !linkedAgreement && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm">The requested rental agreement is unavailable.</p>}
    {propertyWarning && <div role="alert" className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">{propertyWarning} <button onClick={syncProperties} className="underline">Retry property sync</button></div>}
    {message && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}
    {!loading && !error && !capabilities.renew && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">This server supports creation and move-out. Deploy the rental history API and migration to enable editing, renewals, and rent amounts.</p>}
    <section aria-label="Agreement filters" className="grid gap-3 rounded-xl border border-[#E8E8E8] bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-xs font-semibold sm:col-span-2">Search agreements<div className="relative"><Search className="absolute left-3 top-4 text-slate-400" size={16} /><input className={`${field} pl-9`} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Tenant, property, or RA-ID" /></div></label>
      <label className="text-xs font-semibold">Agreement status<select className={field} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">All statuses</option>{Object.keys(statusColors).map(value => <option key={value}>{value}</option>)}</select></label>
      <label className="text-xs font-semibold">Sort by<select className={field} value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}><option value="expiry-asc">Expiry: earliest first</option><option value="expiry-desc">Expiry: latest first</option><option value="created-desc">Created: newest first</option><option value="created-asc">Created: oldest first</option></select></label>
    </section>
    <section aria-label="Agreements" aria-busy={loading}>
      {loading ? <p role="status" className="rounded-xl border bg-white p-10 text-center text-slate-500">Loading rental agreements…</p> : result.rows.length ? <>
        <div className="grid gap-4 xl:grid-cols-2">{result.rows.map(a => <article key={a.id} className="rounded-xl border border-[#E8E8E8] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold text-slate-500">{agreementId(a)} · {a.property_id}</p><Link to={`/properties/${a.property_db_id}`} className="mt-1 block break-words font-bold text-[#C4005A]">{a.title || a.property_id}</Link></div><Badge agreement={a} today={today} /></div>
          <dl className="mt-5 grid grid-cols-2 gap-4"><Detail label="Tenant">{a.tenant_name}</Detail><Detail label="Contact">{a.tenant_phone || 'Not recorded'}</Detail><Detail label="Current period start">{displayDate(a.current_start_date || a.start_date)}</Detail><Detail label="Expiry date">{displayDate(a.end_date)}</Detail><Detail label="Agreement rent">{rentLabel(a)}</Detail><Detail label="Next reminder">{nextReminder(a, today)}</Detail></dl>
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t pt-4"><button onClick={() => open('details', a)} className={secondary}>View details</button>{!a.move_out_date && !a.voided_at && <><button onClick={() => open('edit', a)} disabled={blocked || !capabilities.edit} className={secondary}>Edit</button><button onClick={() => open('renew', a)} disabled={blocked || !canRenew(a)} title={a.end_date >= today ? 'Renewal becomes available after this period ends' : undefined} className={secondary}>Renew</button><button onClick={() => open('move-out', a)} disabled={blocked} className="px-2 py-2 text-sm font-semibold text-[#C4005A] disabled:opacity-50">Confirm Move-Out</button></>}{capabilities.deleteAgreement && !a.voided_at && <button onClick={() => setDeleteTarget(a)} disabled={blocked} className="px-2 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">Delete Agreement</button>}</div>
        </article>)}</div>
        <nav aria-label="Agreement pagination" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600"><p>{result.total} agreements · Page {result.page} of {result.pages}</p><div className="flex gap-2"><button disabled={result.page === 1} onClick={() => setPage(result.page - 1)} className={secondary}>Previous</button><button disabled={result.page === result.pages} onClick={() => setPage(result.page + 1)} className={secondary}>Next</button></div></nav>
      </> : !error && <div className="rounded-xl border bg-white p-10 text-center"><KeyRound className="mx-auto mb-3 text-[#C4005A]" /><h2 className="font-semibold">{agreements.length ? 'No agreements match these filters' : 'No rental agreements yet'}</h2><p className="mt-2 text-sm text-slate-500">{agreements.length ? 'Try another tenant, property, or status.' : 'Create an agreement to start tracking tenants and expiry reminders.'}</p></div>}
    </section>
    {dialog && !deleteTarget && <Modal title={titles[dialog.mode]} subtitle={selected ? `${agreementId(selected)} · ${selected.property_id}` : 'One occupied agreement per rental property'} icon={KeyRound} size="xl" onClose={busy ? undefined : close} closeOnEscape={!busy} closeOnOverlayClick={!busy}>
      {dialog.mode === 'details' && selected ? <>
        <Badge agreement={selected} today={today} /><dl className="grid grid-cols-2 gap-4"><Detail label="Property"><Link to={`/properties/${selected.property_db_id}`} className="text-[#C4005A] underline">{selected.title || selected.property_id}</Link></Detail><Detail label="Current property status">{selected.property_status || 'Not provided by server'}</Detail><Detail label="Tenant">{selected.tenant_name}</Detail><Detail label="Contact">{selected.tenant_phone || 'Not recorded'}</Detail><Detail label="Original occupancy start">{displayDate(selected.start_date)}</Detail><Detail label="Current period">{displayDate(selected.current_start_date || selected.start_date)} – {displayDate(selected.end_date)}</Detail><Detail label="Agreement rent">{rentLabel(selected)}</Detail><Detail label="Reminder lead time">{selected.reminder_days} days</Detail><Detail label="Created">{displayDate(selected.created_at)}</Detail><Detail label="Next reminder">{nextReminder(selected, today)}</Detail></dl>
        {capabilities.deleteAgreement && !selected.voided_at && <button onClick={() => setDeleteTarget(selected)} disabled={blocked} className="rounded-lg border border-red-300 px-4 py-2 font-semibold text-red-700">Delete Agreement</button>}
        <h3 className="border-t pt-4 font-bold">Agreement history</h3><ol className="space-y-3 text-sm"><li className="rounded-lg bg-slate-50 p-3">Original occupancy began {displayDate(selected.start_date)}. {selected.created_by && `Recorded by ${selected.created_by}.`}</li>{(selected.history || []).map((event, index) => <li key={index} className="rounded-lg border p-3"><p className="font-semibold">{event.type}</p><p className="text-xs text-slate-500">{displayDate(event.date)} · {event.by}</p>{event.before && <p className="mt-2">Previous: {displayDate(event.before.startDate)} – {displayDate(event.before.endDate)} · {event.before.tenantName} · {rentLabel({ rent_amount: event.before.rentAmount })} · {event.before.reminderDays}-day reminder</p>}{event.after && <p className="mt-1">Saved: {displayDate(event.after.startDate)} – {displayDate(event.after.endDate)} · {event.after.tenantName} · {rentLabel({ rent_amount: event.after.rentAmount })} · {event.after.reminderDays}-day reminder</p>}{event.moveOutDate && <p className="mt-2">Actual move-out: {displayDate(event.moveOutDate)}</p>}{event.notes && <p className="mt-2 whitespace-pre-wrap break-words">{event.notes}</p>}</li>)}{selected.move_out_date && !(selected.history || []).some(e => e.moveOutDate) && <li>Move-out confirmed for {displayDate(selected.move_out_date)}.</li>}</ol>
        <h3 className="border-t pt-4 font-bold">Reminder events</h3>{alerts.filter(event => event.agreementId === selected.id).map(event => <p key={event.id} className="text-sm">{event.type} · {displayDate(event.date)} · {readIds.includes(event.id) ? 'Read' : 'Unread'}</p>)}{!alerts.some(event => event.agreementId === selected.id) && <p className="text-sm text-slate-500">No current reminder events. Previous periods are retained in the agreement history above.</p>}
      </> : <form onSubmit={submit} noValidate className="space-y-4">
        {(dialogError || stale || error) && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{dialogError || (stale ? 'This agreement was updated elsewhere. Reload before saving.' : error)} {selected && <button type="button" disabled={busy} onClick={() => open(dialog.mode, selected)} className="underline">Reload latest details</button>}</div>}
        {dialog.mode === 'move-out' ? <><p className="text-sm">Confirm that <strong>{selected?.tenant_name}</strong> has left <strong>{selected?.property_id}</strong>. The server will complete this tenancy and release the property only if no conflicting occupancy remains. Expiry alone does not free the property.</p><label className="block text-sm font-medium">Actual move-out date<input type="date" min={selected?.current_start_date || selected?.start_date} max={today} {...inputProps('moveOutDate')} />{fieldError('moveOutDate')}</label>{capabilities.moveOutNotes && <label className="block text-sm font-medium">Move-out notes (optional)<textarea rows={3} maxLength={2000} {...inputProps('notes')} /></label>}</> : <div className="grid gap-4 sm:grid-cols-2">
          {dialog.mode === 'create' && <label className="text-sm font-medium sm:col-span-2">Rental property<select {...inputProps('propertyId')}><option value="">Select property</option>{available.map(p => <option key={p.id} value={p.id}>{p.propertyId} — {p.title}</option>)}</select>{fieldError('propertyId')}{!available.length && <span className="mt-1 block text-xs text-slate-500">No eligible rental properties. Add a rental property or <button type="button" onClick={syncProperties} className="underline">refresh property data</button>.</span>}</label>}
          {dialog.mode !== 'renew' && <><label className="text-sm font-medium">Tenant name<input maxLength={150} {...inputProps('tenantName')} />{fieldError('tenantName')}</label><label className="text-sm font-medium">Tenant contact<input type="tel" maxLength={50} {...inputProps('tenantPhone')} /></label></>}
          {dialog.mode !== 'edit' && <><label className="text-sm font-medium">{dialog.mode === 'renew' ? 'Renewal start date' : 'Agreement start date'}<input type="date" min="1900-01-01" max={today} readOnly={dialog.mode === 'renew'} {...inputProps('startDate')} />{fieldError('startDate')}</label><label className="text-sm font-medium">Agreement expiry date<input readOnly value={validDate(form.startDate) ? agreementEnd(form.startDate) : ''} className={`${field} bg-slate-50`} /></label></>}
          {capabilities.rentAmount && <label className="text-sm font-medium">Monthly agreement rent (₹, optional)<input type="number" min="0" max="1000000000000" step="0.01" {...inputProps('rentAmount')} />{fieldError('rentAmount')}</label>}
          <label className="text-sm font-medium">Remind before expiry<select {...inputProps('reminderDays')}>{[7, 15, 30, 60, 90].map(n => <option key={n} value={n}>{n} days</option>)}</select>{fieldError('reminderDays')}</label>
          <p className="text-xs leading-relaxed text-slate-500 sm:col-span-2">{dialog.mode === 'renew' ? 'Confirm the next annual period for this continuing tenant. Earlier periods remain in history. Record each elapsed renewal separately.' : dialog.mode === 'edit' ? 'Tenant, rent, and reminder changes are recorded in history. Use Renew to record the next agreement period.' : 'The annual agreement ends one day before the next anniversary. Save only an actual tenancy.'} Anniversary reminders stay on the original occupancy date; 29 February uses 28 February in non-leap years.</p>
        </div>}
        <div className="flex flex-wrap justify-end gap-3 border-t pt-4"><button type="button" disabled={busy} onClick={close} className={secondary}>Cancel</button><button disabled={blocked || stale} className={primary}>{busy ? 'Saving…' : dialog.mode === 'move-out' ? 'Confirm Move-Out' : dialog.mode === 'renew' ? 'Confirm renewal' : dialog.mode === 'edit' ? 'Save changes' : 'Create agreement'}</button></div>
      </form>}
    </Modal>}
    {deleteTarget && <RentalDeleteDialog agreement={deleteTarget} currentVersion={agreements.find(a => a.id === deleteTarget.id)?.version} request={request} onClose={() => setDeleteTarget(null)} onConflict={refresh} onSuccess={text => { setDeleteTarget(null); close(); setMessage(text); void Promise.allSettled([refresh(), syncProperties()]); }} />}
  </div>;
}
