import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Inbox, X } from 'lucide-react';
import { loadSubmissionNotifications } from '../utils/submissionNotifications';

const API = (import.meta.env.VITE_API_BASE_URL || (['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://localhost:5000/api' : 'https://helloproperties-backend.vercel.app/api')).replace(/\/$/, '');
const labels = { sale: 'Sale properties', rent: 'Rental properties', buyer: 'Buyer requirements' };

export default function SubmissionNotifications({ user }) {
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const refreshRef = useRef(null);
  const storageKey = `hp_submission_notifications_seen_${user.userId || user.id || user.username}`;
  const [seen, setSeen] = useState(() => {
    try { return Number(localStorage.getItem(storageKey)) || 0; } catch { return 0; }
  });
  const root = useRef(null);
  const bell = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    let fetching = false;
    async function refresh() {
      if (document.hidden || fetching) return;
      fetching = true;
      setLoading(true);
      try {
        const token = localStorage.getItem('hp_auth_token');
        const data = await loadSubmissionNotifications(API, {
          credentials: 'include', signal: controller.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }, user.role);
        if (!controller.signal.aborted) { setGroups(data); setError(''); }
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof TypeError ? 'Cannot reach the notification server. Check your connection and retry.' : e.message);
      } finally {
        fetching = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    refreshRef.current = refresh;
    refresh();
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('hp_submission_reviewed', refresh);
    return () => {
      controller.abort();
      refreshRef.current = null;
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('hp_submission_reviewed', refresh);
    };
  }, [user.role]);

  useEffect(() => {
    if (!open) return;
    const dismiss = e => { if (!root.current?.contains(e.target)) setOpen(false); };
    const escape = e => { if (e.key === 'Escape') { setOpen(false); bell.current?.focus(); } };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  const latest = Math.max(0, ...(groups || []).map(group => Date.parse(group.latest_submitted_at) || 0));
  const unread = latest > seen;
  const total = (groups || []).reduce((sum, group) => sum + Number(group.total), 0);
  function toggle() {
    if (!open && groups) {
      setSeen(latest);
      try { localStorage.setItem(storageKey, String(latest)); } catch { /* Reminders still work without storage. */ }
    }
    setOpen(value => !value);
  }

  return <div className="relative" ref={root}>
    <button ref={bell} type="button" onClick={toggle} aria-label={`Notifications: ${total} submissions awaiting review${error ? ', count may be out of date' : ''}`} aria-expanded={open} aria-controls="submission-notifications" className={`relative p-2 rounded-full cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-[#C4005A] ${unread || open ? 'bg-[#FFF1F6] text-[#C4005A]' : 'text-[#6B6B6B] hover:bg-[#FFF1F6] hover:text-[#C4005A]'}`}>
      <Bell className="w-5 h-5" aria-hidden="true" />
      {total > 0 && <span aria-hidden="true" className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold leading-none text-white ring-2 ring-white">{total > 99 ? '99+' : total}</span>}
    </button>
    <span className="sr-only" role="status">{unread ? 'New customer submissions are waiting for review.' : ''}</span>
    {open && <section id="submission-notifications" aria-label="Submission notifications" className="fixed left-4 right-4 top-20 z-30 flex max-h-[calc(100dvh-6rem)] flex-col rounded-xl border border-slate-200 bg-white shadow-xl text-slate-900 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-4 sm:w-[480px] sm:max-w-[calc(100vw-2rem)]">
      <span aria-hidden="true" className="absolute -top-2 right-3 hidden h-4 w-4 rotate-45 border-l border-t border-slate-200 bg-white sm:block" />
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-5 py-5">
        <h2 className="text-xl font-bold">Notifications</h2>
        <button type="button" aria-label="Close notifications" onClick={() => { setOpen(false); bell.current?.focus(); }} className="rounded-md p-1 text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-[#C4005A]"><X size={24} aria-hidden="true" /></button>
      </div>
      <div className="min-h-0 overflow-y-auto rounded-b-xl bg-slate-50">
        <p className="px-5 py-3 text-sm font-semibold">{groups ? `${total} pending ${total === 1 ? 'submission' : 'submissions'}${error ? ' (last successful check)' : ''}` : error ? 'Submission reminders unavailable' : 'Checking for new submissions...'}</p>
        {error && <div className="mx-4 mb-4 rounded-lg border border-red-200 bg-red-50 p-4"><p role="alert" className="text-sm text-red-700">{error}</p><button type="button" disabled={loading} onClick={() => refreshRef.current?.()} className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">{loading ? 'Retrying...' : 'Retry'}</button></div>}
        {total > 0 && <div className="mx-3 mb-3 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {groups?.filter(group => Number(group.total) > 0).map(group => <article key={group.type} className="p-5">
            <span className="inline-flex items-center gap-2 rounded bg-[#FFE5EF] px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-[#B0004F]"><Inbox size={16} aria-hidden="true" />Awaiting review</span>
            <h3 className="mt-3 text-base font-bold">{labels[group.type]}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">{group.total} customer {Number(group.total) === 1 ? 'submission is' : 'submissions are'} waiting for admin review.</p>
            {group.latest_submitted_at && <p className="mt-2 text-xs text-slate-500">Latest received: {new Date(group.latest_submitted_at).toLocaleString()}</p>}
            {user.role === 'Admin' && <Link to={`/submissions/${group.type}`} onClick={() => setOpen(false)} className="mt-4 inline-block rounded text-sm font-semibold text-[#B0004F] underline underline-offset-4 hover:text-[#900041]">Review submissions</Link>}
          </article>)}
        </div>}
        {groups && total === 0 && <div className="px-5 py-8 text-center"><Inbox className="mx-auto mb-3 h-8 w-8 text-slate-400" aria-hidden="true" /><p className="text-sm text-slate-600">No submissions awaiting review.</p></div>}
        {user.role !== 'Admin' && <p className="border-t border-slate-200 px-5 py-4 text-xs text-slate-500">An administrator will review these submissions.</p>}
      </div>
    </section>}
  </div>;
}
