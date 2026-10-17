import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from './AuthContext';
import { rentalToday } from '../utils/rentalDates';
import { rentalRequest } from '../utils/rentalApi';

export const RentalContext = createContext();
const API = (import.meta.env.VITE_API_BASE_URL || (['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://localhost:5000/api' : 'https://helloproperties-backend.vercel.app/api')).replace(/\/$/, '');
export function RentalProvider({ children }) {
  const { user, checkAuthStatus } = useContext(AuthContext);
  const canManage = ['Admin', 'Staff'].includes(user?.role);
  const authRef = useRef(checkAuthStatus);
  authRef.current = checkAuthStatus;
  const identityRef = useRef('');
  identityRef.current = `${user?.userId || user?.id || user?.username || ''}:${user?.role || ''}`;
  const [agreements, setAgreements] = useState([]);
  const [readIds, setReadIds] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState(rentalToday);
  const [serverAlerts, setServerAlerts] = useState(null);
  const [capabilities, setCapabilities] = useState({});
  const [syncing, setSyncing] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const refreshSequence = useRef(0);
  const request = useCallback(async (path, method = 'GET', body) => {
    const identity = identityRef.current;
    const token = localStorage.getItem('hp_auth_token');
    try {
      const result = await rentalRequest(API, path, { method, body, token });
      if (identity !== identityRef.current) throw new Error('The signed-in account changed. Please retry.');
      return result;
    }
    catch (e) {
      if (identity !== identityRef.current) throw e;
      if (e.status === 401) void authRef.current();
      if (e.status === 401 || e.status === 403) { setAgreements([]); setReadIds([]); setServerAlerts([]); setCapabilities({}); setForbidden(true); }
      throw e;
    }
  }, []);
  const refresh = useCallback(async () => {
    if (!user || !['Admin', 'Staff'].includes(user.role)) return;
    const sequence = ++refreshSequence.current;
    setSyncing(true);
    try {
      const result = await request('');
      if (sequence !== refreshSequence.current) return;
      if (!Array.isArray(result.data) || !Array.isArray(result.readIds)) throw new Error('Invalid rental response. Please retry.');
      setAgreements(result.data); setReadIds(result.readIds); setError(''); setToday(result.today || rentalToday());
      setServerAlerts(Array.isArray(result.alerts) ? result.alerts : null); setCapabilities(result.capabilities || {}); setForbidden(false);
      return true;
    } catch (e) { if (sequence === refreshSequence.current) setError(e.message); return false; }
    finally { if (sequence === refreshSequence.current) { setLoading(false); setSyncing(false); } }
  }, [request, user]);
  useEffect(() => {
    setAgreements([]); setReadIds([]); setServerAlerts(null); setCapabilities({}); setForbidden(false); setError(''); setLoading(true);
    if (!canManage) { setLoading(false); return; }
    refresh();
    const timer = setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    const invalidatePendingRefresh = () => { refreshSequence.current += 1; };
    return () => { invalidatePendingRefresh(); clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [refresh, canManage]);
  // Reminders must come from the API; an older server is an explicit dependency.
  const remindersAvailable = serverAlerts !== null;
  const alerts = serverAlerts ?? [];
  const unread = alerts.filter(a => !readIds.includes(a.id));
  async function markRead(id, read = true) {
    await request('/read', 'POST', { eventId: id, read });
    ++refreshSequence.current;
    setSyncing(false);
    setReadIds(prev => read ? [...new Set([...prev, id])] : prev.filter(value => value !== id));
    await refresh();
  }
  return <RentalContext.Provider value={{ agreements, alerts, unread, readIds, error, loading, syncing, refresh, request, markRead, today, capabilities, remindersAvailable, canManage: canManage && !forbidden }}>{children}</RentalContext.Provider>;
}
