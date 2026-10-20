import React, { useContext, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, RefreshCw } from 'lucide-react';
import { RentalContext } from '../context/RentalContext';
import { displayDate } from '../utils/rentalView';
import { reminderTypes, selectReminders } from '../utils/rentalReminders';

const field = 'mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-100';
export default function RentalReminders() {
  const { agreements, alerts, unread, readIds, loading, syncing, error, refresh, markRead, canManage, capabilities, remindersAvailable } = useContext(RentalContext);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('');
  const [busy, setBusy] = useState(null);
  const pending = useRef(false);
  const [failure, setFailure] = useState('');
  const [message, setMessage] = useState('');
  const rows = selectReminders(alerts, agreements, readIds, { search, status, type });
  async function toggleRead(event) {
    if (pending.current || error || !canManage) return;
    pending.current = true; setBusy(event.id); setFailure(''); setMessage('');
    try {
      await markRead(event.id, !event.isRead);
      setMessage(`Reminder marked ${event.isRead ? 'unread' : 'read'}.`);
    } catch (e) { setFailure(e.message); }
    finally { pending.current = false; setBusy(null); }
  }
  if (!canManage && !loading) return <div role="alert" className="rounded-xl border bg-white p-6">{error || 'Rental reminders are restricted to authorized Admin and Staff accounts.'}</div>;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Rental Reminders</h1><p className="mt-1 text-sm text-slate-500">Review expiry, anniversary and move-out reminders.{!loading && !error && remindersAvailable && ` ${unread.length} unread.`}</p></div><button onClick={refresh} disabled={syncing || busy !== null} className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"><RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />Refresh</button></div>
    {(error || failure) && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{failure || error}{error && ' Displayed reminders may be out of date.'} <button disabled={syncing || busy !== null} className="underline" onClick={() => { setFailure(''); refresh(); }}>Retry</button></div>}
    {message && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
    {!loading && !error && !remindersAvailable && <div role="alert" className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">Rental reminders are unavailable from this server. Deploy the rental API that returns notifications in GET /api/rentals, then retry. <button className="underline" onClick={refresh} disabled={syncing}>Retry</button></div>}
    <section aria-label="Reminder filters" className="grid gap-3 rounded-xl border border-[#E8E8E8] bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-xs font-semibold sm:col-span-2">Search reminders<input className={field} placeholder="Tenant, property, or RA-ID" value={search} onChange={e => setSearch(e.target.value)} /></label>
      <label className="text-xs font-semibold">Read status<select className={field} value={status} onChange={e => setStatus(e.target.value)}><option value="all">All</option><option value="unread">Unread</option><option value="read">Read</option></select></label>
      <label className="text-xs font-semibold">Reminder type<select className={field} value={type} onChange={e => setType(e.target.value)}><option value="">All types</option>{Object.values(reminderTypes).map(label => <option key={label}>{label}</option>)}</select></label>
    </section>
    <section aria-label="Rental reminder list" aria-busy={loading} className="space-y-3">
      {loading ? <p role="status" className="rounded-xl border bg-white p-10 text-center text-slate-500">Loading rental reminders…</p> : rows.map(event => <article key={event.id} className={`rounded-xl border p-5 ${event.isRead ? 'border-slate-200 bg-white' : 'border-pink-200 bg-[#FFF1F6]'}`}>
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-bold"><Bell size={17} className="text-[#C4005A]" />{event.label}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${event.isRead ? 'bg-slate-100 text-slate-600' : 'bg-pink-100 text-[#C4005A]'}`}>{event.isRead ? 'Read' : 'Unread'}</span></div>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm lg:grid-cols-3">
          <div><dt className="text-xs text-slate-500">Tenant</dt><dd className="mt-1 break-words font-medium">{event.agreement?.tenant_name || 'Not provided'}</dd></div>
          <div><dt className="text-xs text-slate-500">Property</dt><dd className="mt-1 break-words font-medium">{event.agreement?.title || event.agreement?.property_id || 'Not provided'}{event.agreement?.title && event.agreement?.property_id && <span className="block text-xs text-slate-500">{event.agreement.property_id}</span>}</dd></div>
          <div><dt className="text-xs text-slate-500">Agreement</dt><dd className="mt-1 font-medium">RA-{event.agreementId}</dd></div>
          <div><dt className="text-xs text-slate-500">{event.label === 'Annual Anniversary' ? 'Anniversary date' : event.label === 'Move-Out' ? 'Move-out date' : 'Expiry date'}</dt><dd className="mt-1 font-medium">{displayDate(event.date)}</dd></div>
          <div><dt className="text-xs text-slate-500">Notification created</dt><dd className="mt-1 font-medium">{event.created_at || event.createdAt ? displayDate(event.created_at || event.createdAt) : 'Not provided by server'}</dd></div>
        </dl>
        <p className="mt-4 text-sm text-slate-600">{event.text}</p>
        <div className="mt-4 flex flex-wrap gap-4">{(!event.isRead || capabilities.unread) && <button disabled={busy !== null || !!error} onClick={() => toggleRead(event)} className="text-sm font-semibold text-[#C4005A] disabled:opacity-50">{busy === event.id ? 'Saving…' : event.isRead ? 'Mark as Unread' : 'Mark as Read'}</button>}{event.agreement ? <Link to={`/rentals?agreement=${encodeURIComponent(event.agreementId)}`} className="text-sm font-semibold underline">Open agreement details</Link> : <span className="text-xs text-slate-500">Related agreement unavailable</span>}</div>
      </article>)}
      {!loading && !error && remindersAvailable && !rows.length && <div className="rounded-xl border bg-white p-10 text-center"><Bell className="mx-auto mb-3 text-[#C4005A]" /><h2 className="font-semibold">{alerts.length ? 'No reminders match these filters' : 'No rental reminders yet'}</h2></div>}
    </section>
  </div>;
}
