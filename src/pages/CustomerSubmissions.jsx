import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { Home, KeyRound, Users, Search, RefreshCw, ArrowUpRight, ChevronLeft, ChevronRight, X, Check, MessageSquare, RotateCcw, Inbox, MapPin, Image as ImageIcon, History, UserRound, Building2, AlertCircle, Loader2 } from 'lucide-react';
import './CustomerSubmissions.css';
import { PropertyContext } from '../context/PropertyContext';
import { loadSubmissionPage, reviewAndRefresh } from '../utils/submissionWorkflow';

const API = (import.meta.env.VITE_API_BASE_URL || (['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://localhost:5000/api' : 'https://helloproperties-backend.vercel.app/api')).replace(/\/$/, '');
const titles = { sale: 'Sale properties', rent: 'Rental properties', buyer: 'Buyer requirements' };
const tabIcons = { sale: Home, rent: KeyRound, buyer: Users };
const button = 'submission-button';
// Temporarily hide change requests and reopening while preserving their workflow.
const SHOW_EXTENDED_REVIEW_ACTIONS = false;
const colors = { pending: 'bg-amber-100 text-amber-900', approved: 'bg-green-100 text-green-900', rejected: 'bg-red-100 text-red-900', changes_requested: 'bg-blue-100 text-blue-900' };
const date = value => value ? new Date(value).toLocaleString() : '—';
const label = value => value.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ');
async function request(path, options = {}) {
  const token = localStorage.getItem('hp_auth_token');
  const response = await fetch(`${API}/submissions/${path}`, { ...options, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || result.error || 'Request failed');
  return result;
}
function Badge({ status }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize whitespace-nowrap ${colors[status] || 'bg-slate-100 text-slate-700'}`}><span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />{label(status)}</span>;
}
function SubmissionNotice({ message, warning = false, onDismiss }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return <div role="alert" aria-atomic="true" className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-xl ${warning ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-red-300 bg-red-50 text-red-900'}`}>
    <AlertCircle size={22} className="mt-0.5 shrink-0" aria-hidden="true" />
    <div className="min-w-0 flex-1"><p className="text-sm font-bold">{warning ? 'Review saved with a warning' : 'Unable to complete action'}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{message}</p></div>
    <button type="button" aria-label={warning ? 'Dismiss warning' : 'Dismiss error'} onClick={() => { if (onDismiss) onDismiss(); else setDismissed(true); }} className="shrink-0 rounded-md p-1 hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-current"><X size={18} aria-hidden="true" /></button>
  </div>;
}
function Value({ value }) {
  if (value == null || value === '') return <span className="text-slate-400">Not provided</span>;
  if (Array.isArray(value)) return value.length ? <div className="space-y-3">{value.map((item, i) => <div key={i} className={typeof item === 'object' ? 'rounded-lg bg-slate-50 p-3' : ''}><Value value={item} /></div>)}</div> : <span className="text-slate-400">Not provided</span>;
  if (typeof value === 'object') return <div className="space-y-2">{Object.entries(value).map(([key, item]) => <div key={key}><span className="capitalize text-slate-500">{label(key)}: </span><Value value={item} /></div>)}{value.latitude != null && value.longitude != null && <a className="inline-flex items-center gap-1.5 font-semibold text-[#B0004F] hover:underline" href={`https://www.google.com/maps?q=${value.latitude},${value.longitude}`} target="_blank" rel="noreferrer"><MapPin size={14} aria-hidden="true" />View on map <span className="sr-only">(opens in a new tab)</span><ArrowUpRight size={14} aria-hidden="true" /></a>}</div>;
  return <span className="whitespace-pre-wrap break-words">{String(value)}</span>;
}
function DetailSection({ title, icon: Icon, entries }) {
  if (!entries.length) return null;
  return <section className="submission-panel p-5 sm:p-6"><h3 className="mb-5 flex items-center gap-2 text-sm font-bold text-slate-900"><Icon size={17} className="text-[#B0004F]" aria-hidden="true" />{title}</h3><dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">{entries.map(([key, value]) => <div key={key} className={['description', 'location', 'preferredLocations'].includes(key) ? 'min-w-0 sm:col-span-2' : 'min-w-0'}><dt className="mb-1.5 text-xs font-medium capitalize text-slate-500">{label(key)}</dt><dd className="text-sm leading-relaxed text-slate-800"><Value value={value} /></dd></div>)}</dl></section>;
}
function SubmissionMedia({ payload }) {
  const images = payload.images || [];
  const video = payload.videoUrl;
  const playable = video && /\.(mp4|webm|mov)(?:[?#]|$)/i.test(video);
  if (!images.length && !video) return null;
  return <section className="submission-panel p-5 sm:p-6"><h3 className="mb-5 flex items-center gap-2 text-sm font-bold"><ImageIcon size={17} className="text-[#B0004F]" aria-hidden="true" />Photos &amp; video</h3>
    {!!images.length && <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{images.map((url, index) => <a key={url} className="group overflow-hidden rounded-xl border border-slate-200" href={url} target="_blank" rel="noreferrer"><img className="aspect-[4/3] w-full object-cover transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none" src={url} loading="lazy" alt={`Submitted property photo ${index + 1}`} /><span className="flex items-center justify-between bg-white px-3 py-2 text-xs font-medium text-slate-600">Photo {index + 1}<ArrowUpRight size={14} aria-hidden="true" /><span className="sr-only">Open full image in a new tab</span></span></a>)}</div>}
    {video && <div className={images.length ? 'mt-5 border-t border-slate-100 pt-5' : ''}>{playable && <video className="mb-3 max-h-96 w-full rounded-xl bg-slate-950" controls preload="metadata" aria-label="Submitted property video" src={video}>Your browser does not support this video. Use the link below to open it.</video>}<a className="inline-flex items-center gap-2 text-sm font-semibold text-[#B0004F] hover:underline" href={video} target="_blank" rel="noreferrer">Open submitted video<ArrowUpRight size={15} aria-hidden="true" /><span className="sr-only">(opens in a new tab)</span></a></div>}
  </section>;
}
export default function CustomerSubmissions({ type = 'sale' }) {
  const { fetchFromBackend } = useContext(PropertyContext) || {};
  const [status, setStatus] = useState('pending'), [search, setSearch] = useState(''), [page, setPage] = useState(1);
  const [requirementType, setRequirementType] = useState('all');
  const [rows, setRows] = useState([]), [total, setTotal] = useState(0), [selected, setSelected] = useState(null);
  const [reason, setReason] = useState(''), [error, setErrorState] = useState(''), [busy, setBusy] = useState(false), [loading, setLoading] = useState(true);
  const [errorNotice, setErrorNotice] = useState('');
  const setError = useCallback(message => {
    setErrorState(message);
    setErrorNotice(message);
  }, []);
  const [refreshWarnings, setRefreshWarnings] = useState({});
  const warning = Object.keys(refreshWarnings).length
    ? `Review saved successfully. Could not refresh ${Object.entries(refreshWarnings).map(([name, message]) => `${name} (${message})`).join('; ')}. The saved decision remains in effect. Retry by reopening details or reloading the page.`
    : '';
  const generation = useRef(0);
  const detailsRef = useRef(null);
  const scrollToDetails = useRef(false);
  useEffect(() => {
    if (!selected || !scrollToDetails.current || !detailsRef.current) return;
    scrollToDetails.current = false;
    detailsRef.current.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'start'
    });
  }, [selected]);
  const load = useCallback(async () => {
    const version = ++generation.current;
    setLoading(true);
    try {
      const result = await loadSubmissionPage(request, type, { status, search, page, limit: 20, ...(type === 'buyer' ? { requirementType } : {}) });
      if (version === generation.current) {
        setRows(result.data); setTotal(result.total); setPage(result.page); setError('');
        setRefreshWarnings(current => { const next = { ...current }; delete next['submission queue']; return next; });
      }
      return { success: true };
    } catch (e) {
      if (version === generation.current) { setRows([]); setTotal(0); setError(e.message); }
      return { success: false, error: e.message };
    }
    finally { if (version === generation.current) setLoading(false); }
  }, [type, status, search, page, requirementType, setError]);
  useEffect(() => { const counter = generation; load(); return () => { counter.current++; }; }, [load]);
  async function open(id) {
    setBusy(true); setError(''); setSelected(null);
    try {
      scrollToDetails.current = true;
      setSelected((await request(`${type}/${id}`)).data); setReason('');
      setRefreshWarnings(current => { const next = { ...current }; delete next['submission details']; return next; });
    }
    catch (e) { scrollToDetails.current = false; setError(e.message); }
    finally { setBusy(false); }
  }
  async function review(action) {
    if (busy || !selected) return;
    if (action !== 'approve' && !reason.trim()) {
      setError(action === 'reject' ? 'Please enter a rejection reason before rejecting this submission.' : 'Enter a reason before recording this decision.');
      document.getElementById('review-reason')?.focus({ preventScroll: true });
      return;
    }
    setBusy(true); setError('');
    try {
      const outcome = await reviewAndRefresh({
        save: () => request(`${type}/${selected.id}/review`, { method: 'POST', body: JSON.stringify({ action, reason }) }),
        applyDecision: decision => {
          generation.current++; // Invalidate any queue request started before the decision.
          setSelected(decision); setReason('');
          window.dispatchEvent(new Event('hp_submission_reviewed'));
          const removed = status !== 'all' && decision.status !== status;
          setRows(current => removed ? current.filter(row => row.id !== decision.id) : current.map(row => row.id === decision.id ? { ...row, ...decision } : row));
          if (removed && rows.some(row => row.id === decision.id)) setTotal(current => Math.max(0, current - 1));
        },
        refresh: {
          'submission details': async () => { setSelected((await request(`${type}/${selected.id}`)).data); },
          'submission queue': load,
          ...(action === 'approve' ? { 'official lists': async () => {
            if (!fetchFromBackend) throw new Error('List refresh is unavailable');
            const result = await fetchFromBackend();
            if (!result?.success) {
              const failed = Object.entries(result?.results || {}).filter(([, value]) => !value.success).map(([name]) => name);
              throw new Error(`Could not refresh ${failed.join(' and ') || 'official lists'}`);
            }
          } } : {})
        }
      });
      setRefreshWarnings(current => {
        const next = { ...current };
        for (const [name, result] of Object.entries(outcome.results)) {
          if (result.success) delete next[name];
          else next[name] = result.error;
        }
        return next;
      });
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  const entries = selected ? Object.entries(selected.payload) : [];
  const customerKeys = ['fullName', 'phoneNumber', 'email', 'ownerName', 'ownerPhone', 'ownerAddress', 'buyerName', 'buyerPhone', 'buyerAddress'];
  const locationKeys = ['location', 'preferredLocations'];
  const fields = entries.filter(([key, value]) => {
    if ([...customerKeys, ...locationKeys, 'images', 'videoUrl', 'urgencyTimeline'].includes(key)) return false;
    if (type !== 'rent' && ['monthlyRent', 'monthlyRentUnit', 'securityDeposit', 'securityDepositUnit'].includes(key)) return false;
    if (key === 'keywords') {
      return Array.isArray(value)
        ? value.some(keyword => String(keyword ?? '').trim())
        : Boolean(String(value ?? '').trim());
    }
    return true;
  });
  return <section className="submissions-page mx-auto max-w-[1440px] space-y-6 text-slate-800">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#B0004F]"><Inbox size={14} aria-hidden="true" />Customer Submissions</p><h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Submission Management</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Review customer listings and buyer requirements before adding them to official records.</p></div>
      <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600"><span className="h-1.5 w-1.5 rounded-full bg-[#B0004F]" aria-hidden="true" />Admin review</span>
    </header>
    {createPortal(<div className="pointer-events-none fixed right-4 top-[88px] z-[100] flex max-h-[calc(100dvh-104px)] w-[calc(100%-2rem)] max-w-md flex-col gap-3 overflow-y-auto">
      {errorNotice && <SubmissionNotice message={errorNotice} onDismiss={() => setErrorNotice('')} />}
      {warning && <SubmissionNotice key={warning} message={warning} warning />}
    </div>, document.body)}
    <div className="submission-panel overflow-hidden">
      <nav aria-label="Submission types" className="flex overflow-x-auto border-b border-slate-200 px-3 sm:px-5">{Object.entries(titles).map(([key, title]) => { const Icon = tabIcons[key]; return <NavLink className={({ isActive }) => `flex shrink-0 items-center gap-2 border-b-2 px-4 py-4 text-sm font-semibold transition-colors ${isActive ? 'border-[#B0004F] text-[#B0004F] bg-[#FFF7FA]' : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`} key={key} to={`/submissions/${key}`}><Icon size={16} aria-hidden="true" />{title}</NavLink>; })}</nav>
      <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-4 sm:p-5">
        <label className="block w-full text-xs font-semibold text-slate-600 sm:w-44">Status<select className="submission-input mt-2 capitalize" value={status} disabled={busy} onChange={e => { setStatus(e.target.value); setPage(1); }}>{['pending', 'approved', 'rejected', 'changes_requested', 'all'].map(s => <option key={s} value={s}>{label(s)}</option>)}</select></label>
        {type === 'buyer' && <label className="block w-full text-xs font-semibold text-slate-600 sm:w-44">Requirement type<select className="submission-input mt-2" value={requirementType} disabled={busy} onChange={e => { setRequirementType(e.target.value); setPage(1); setSelected(null); }}><option value="all">All requirements</option><option value="Buy">Buy requirements</option><option value="Rent">Rent requirements</option></select></label>}
        <label className="block min-w-0 flex-1 basis-60 text-xs font-semibold text-slate-600">Search submissions<div className="relative mt-2"><Search size={17} className="pointer-events-none absolute left-3 top-3 text-slate-400" aria-hidden="true" /><input className="submission-input pl-10" placeholder="Search name, phone, title or district..." value={search} disabled={busy} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div></label>
        <button className={button} onClick={load} disabled={loading || busy}><RefreshCw size={16} className={loading ? 'animate-spin motion-reduce:animate-none' : ''} aria-hidden="true" />Refresh</button>
      </div>
      <div className="flex items-center justify-between gap-3 px-5 py-4"><h2 className="text-sm font-bold">{titles[type]}</h2><span className="text-xs text-slate-500" role="status">{loading ? 'Loading submissions...' : error ? 'Queue may be out of date' : `${total} ${total === 1 ? 'submission' : 'submissions'} matching filters`}</span></div>
      <div className="overflow-x-auto" role="region" aria-label="Submission queue" tabIndex={0}><table className="w-full min-w-[780px] text-left text-sm" aria-busy={loading}><caption className="sr-only">{titles[type]}: {label(status)} status</caption><thead className="border-y border-slate-100 bg-slate-50 text-xs text-slate-500"><tr>{['Submission', 'Customer', 'Status', 'Submitted', 'Review'].map(v => <th scope="col" className="px-5 py-3 font-semibold" key={v}>{v}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">
        {loading ? <tr><td colSpan={5} className="p-12 text-center text-slate-500"><Loader2 size={22} className="mx-auto mb-3 animate-spin motion-reduce:animate-none text-[#B0004F]" aria-hidden="true" />Loading submissions...</td></tr> : rows.length ? rows.map(row => <tr className={`transition-colors hover:bg-[#FFF9FB] ${selected?.id === row.id ? 'bg-[#FFF7FA]' : ''}`} key={row.id}><td className="max-w-sm px-5 py-5"><p className="font-semibold leading-6 text-slate-900">{row.title}</p><p className="mt-1 break-all font-mono text-[11px] text-slate-500">{row.id}</p></td><td className="px-5 py-5 font-medium">{row.customer_name}</td><td className="px-5 py-5"><Badge status={row.status} /></td><td className="px-5 py-5 text-xs leading-5 text-slate-500">{date(row.submitted_at)}</td><td className="px-5 py-5"><button disabled={busy} className="submission-button submission-detail-button" aria-label={`View details for ${row.title}`} onClick={() => open(row.id)}>View details<ArrowUpRight size={14} aria-hidden="true" /></button></td></tr>) : <tr><td colSpan={5} className="px-5 py-14 text-center"><span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF1F6] text-[#B0004F]"><Inbox size={23} aria-hidden="true" /></span><p className="font-semibold text-slate-900">{error ? 'Queue unavailable' : 'No submissions found'}</p><p className="mt-2 text-sm text-slate-500">{error ? 'Please refresh to try loading submissions again.' : 'No submissions match these filters. Try another status or search.'}</p></td></tr>}
      </tbody></table></div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4"><span className="text-xs text-slate-500">Page <span className="font-semibold text-slate-800">{page}</span>{!loading && !error && <> of {Math.max(1, Math.ceil(total / 20))}</>}</span><div className="flex gap-2"><button className={button} disabled={page === 1 || loading || busy} onClick={() => setPage(p => p - 1)}><ChevronLeft size={15} aria-hidden="true" />Previous</button><button className={button} disabled={page * 20 >= total || loading || busy} onClick={() => setPage(p => p + 1)}>Next<ChevronRight size={15} aria-hidden="true" /></button></div></div>
    </div>
    {selected && <section ref={detailsRef} aria-label="Submission details" className="submission-details space-y-5">
      <header className="submission-panel flex flex-wrap items-start justify-between gap-4 border-l-4 border-l-[#B0004F] p-5 sm:p-6"><div className="min-w-0 flex-1"><div className="mb-3 flex flex-wrap items-center gap-3"><h2 className="text-lg font-bold text-slate-950">Submission details</h2><Badge status={selected.status} /></div><p className="break-words text-sm font-semibold">{selected.payload.propertyTitle || selected.payload.requirementTitle}</p><p className="mt-1 break-all font-mono text-xs text-slate-500">Reference: {selected.id}</p><p className="mt-3 text-xs leading-6 text-slate-500">Submitted {date(selected.submitted_at)}<span className="mx-2" aria-hidden="true">&middot;</span>Reviewed {date(selected.reviewed_at)}</p>{selected.official_reference && <p className="mt-3 break-all text-xs font-medium text-green-800">Official record: {selected.official_reference}</p>}</div><button className={button} disabled={busy} onClick={() => setSelected(null)}><X size={15} aria-hidden="true" />Close details</button></header>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5"><DetailSection title="Customer information" icon={UserRound} entries={entries.filter(([key]) => customerKeys.includes(key))} /><DetailSection title={type === 'buyer' ? 'Requirement details' : 'Property details'} icon={Building2} entries={fields} /><DetailSection title="Location information" icon={MapPin} entries={entries.filter(([key]) => locationKeys.includes(key))} /><SubmissionMedia payload={selected.payload} /></div>
        <aside className="min-w-0 space-y-5">
          {(selected.status === 'pending' || (SHOW_EXTENDED_REVIEW_ACTIONS && selected.status !== 'approved')) && <section className="submission-panel p-5"><h3 className="text-sm font-bold">Review decision</h3><p className="mt-2 text-xs leading-5 text-slate-500">Verify the submitted details before recording your decision.</p><label className="mt-5 block text-xs font-semibold text-slate-700" htmlFor="review-reason">{SHOW_EXTENDED_REVIEW_ACTIONS ? 'Review reason' : 'Rejection reason'}</label><textarea id="review-reason" className="submission-input mt-2 min-h-28 resize-y py-3" maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} aria-describedby="review-reason-hint" placeholder="Enter a reason for rejecting this submission..." /><p id="review-reason-hint" className="mt-2 text-xs leading-5 text-slate-500">{SHOW_EXTENDED_REVIEW_ACTIONS ? 'Required for rejection, change requests or reopening.' : 'Required when rejecting a submission.'} Maximum 2,000 characters.</p><div className="mt-5 space-y-2">{(selected.status === 'pending' ? [['approve', 'Approve and create official record', Check], ['request_changes', 'Request changes', MessageSquare], ['reject', 'Reject submission', X]] : [['reopen', 'Reopen for review', RotateCcw]]).filter(([action]) => SHOW_EXTENDED_REVIEW_ACTIONS || action === 'approve' || action === 'reject').map(([action, text, Icon]) => <button className={`submission-button w-full ${action === 'approve' ? 'submission-approve' : action === 'reject' ? 'submission-reject' : 'submission-changes'}`} key={action} disabled={busy} onClick={() => review(action)}><Icon size={16} aria-hidden="true" />{busy ? 'Saving...' : text}</button>)}</div>{SHOW_EXTENDED_REVIEW_ACTIONS && <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">For corrections, contact the customer using the details provided and ask them to submit the corrected form. Reopen only when the original details are valid.</p>}</section>}
          <section className="submission-panel p-5"><h3 className="mb-4 flex items-center gap-2 text-sm font-bold"><History size={17} className="text-[#B0004F]" aria-hidden="true" />Review history</h3>{selected.history == null ? <p className="text-xs leading-6 text-slate-500">Review saved. Reload submission details to view updated history.</p> : selected.history.length ? <ol className="space-y-5">{selected.history.map(item => <li className="border-l-2 border-slate-200 pl-4" key={item.id}><p className="text-xs font-semibold capitalize leading-6">{label(item.from_status)} &rarr; {label(item.to_status)}</p><p className="mt-1 text-xs text-slate-600">{item.reviewer_name}</p><p className="mt-1 text-[11px] text-slate-500">{date(item.created_at)}</p>{item.reason && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{item.reason}</p>}</li>)}</ol> : <p className="text-xs leading-6 text-slate-500">No decisions recorded yet.</p>}</section>
        </aside>
      </div>
    </section>}
  </section>;
}
