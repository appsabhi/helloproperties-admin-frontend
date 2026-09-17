import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from './AuthContext';

export const ActivityContext = createContext();

const STORAGE_KEY = 'hp_activity_logs';
const MAX_LOGS = 500;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : 'https://helloproperties-backend.vercel.app/api'
);

const getAuthHeaders = () => {
  const token = localStorage.getItem('hp_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export function ActivityProvider({ children }) {
  const { user, isAuthenticated } = useContext(AuthContext) || {};

  const [totalCount, setTotalCount] = useState(null);
  const [todayCount, setTodayCount] = useState(null);
  const [activeUsersCount, setActiveUsersCount] = useState(null);

  const [activities, setActivities] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse activity logs from localStorage:', e.message);
    }
    return [];
  });

  // Main activity logger method
  const logActivity = useCallback(({
    category = 'System',
    action = 'GENERIC',
    actionLabel = 'Activity Logged',
    details = '',
    targetId = '',
    badgeColor = 'blue',
    userOverride = null
  }) => {
    // Attempt to resolve active user identity
    let activeUser = userOverride || user;

    if (!activeUser) {
      try {
        const storedAuthUser = localStorage.getItem('hp_auth_user');
        if (storedAuthUser) {
          activeUser = JSON.parse(storedAuthUser);
        }
      } catch (e) {}
    }

    const resolvedUsername = activeUser?.username || activeUser?.userId || 'admin';
    const resolvedFullName = activeUser?.fullName || activeUser?.name || activeUser?.username || resolvedUsername;
    const resolvedRole = activeUser?.role || 'Admin';

    const currentTimestamp = new Date().toISOString();
    const newLog = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: currentTimestamp,
      user: {
        username: resolvedUsername,
        fullName: resolvedFullName,
        role: resolvedRole
      },
      category,
      action,
      actionLabel,
      details,
      targetId: String(targetId || ''),
      badgeColor
    };

    setActivities(prev => [newLog, ...prev].slice(0, MAX_LOGS));

    // Post to backend server asynchronously
    fetch(`${API_BASE_URL}/activity-logs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(newLog)
    }).catch(() => {});

    return newLog;
  }, [user]);

  // Sync activity logs with backend server database
  const syncWithBackend = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/activity-logs`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (res.ok) {
        const resData = await res.json();
        if (resData.success) {
          if (typeof resData.totalCount === 'number') {
            setTotalCount(resData.totalCount);
          }
          if (typeof resData.todayCount === 'number') {
            setTodayCount(resData.todayCount);
          }
          if (typeof resData.activeUsersCount === 'number') {
            setActiveUsersCount(resData.activeUsersCount);
          }

          if (Array.isArray(resData.data) && resData.data.length > 0) {
            setActivities(prev => {
              const map = new Map();
              resData.data.forEach(item => {
                const userObj = item.user || {};
                const username = userObj.username || item.username || item.user_id || item.userId || 'admin';
                const fullName = userObj.fullName || userObj.full_name || item.full_name || item.fullName || item.name || username;
                const role = userObj.role || item.role || 'Admin';

                const normalized = {
                  ...item,
                  id: item.id || item._id,
                  user: { username, fullName, role },
                  actionLabel: item.actionLabel || item.action_label || item.action || 'Activity Logged',
                  targetId: String(item.targetId || item.target_id || '')
                };
                map.set(normalized.id, normalized);
              });
              prev.forEach(item => {
                if (!map.has(item.id)) map.set(item.id, item);
              });
              const merged = Array.from(map.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
              return merged.slice(0, MAX_LOGS);
            });
          }
        }
      }
    } catch (err) {
      // Graceful fallback to local storage
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    } catch (e) {
      console.warn('Failed to persist activity logs:', e.message);
    }
  }, [activities]);

  // Listen for storage events for real-time cross-tab / window sync
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const remoteLogs = JSON.parse(e.newValue);
          if (Array.isArray(remoteLogs)) {
            setActivities(remoteLogs);
          }
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Listen for custom hp_log_activity events dispatched across contexts
  useEffect(() => {
    const handleCustomLog = (e) => {
      if (e.detail) {
        logActivity(e.detail);
      }
    };
    window.addEventListener('hp_log_activity', handleCustomLog);
    return () => window.removeEventListener('hp_log_activity', handleCustomLog);
  }, [logActivity]);

  useEffect(() => {
    syncWithBackend();
    const interval = setInterval(syncWithBackend, 15000); // Poll backend every 15s for multi-device sync
    return () => clearInterval(interval);
  }, [syncWithBackend]);

  // Automatically record active session for current user on mount / auth change
  useEffect(() => {
    if (isAuthenticated && user?.username) {
      const sessionKey = `hp_session_logged_${user.username}`;
      const hasLoggedSession = sessionStorage.getItem(sessionKey);
      if (!hasLoggedSession) {
        sessionStorage.setItem(sessionKey, 'true');
        logActivity({
          category: 'Authentication',
          action: 'USER_LOGIN',
          actionLabel: 'User Logged In',
          details: `Active user session for ${user.fullName || user.username} (${user.role || 'Staff'})`,
          targetId: 'session-auth',
          badgeColor: 'blue',
          userOverride: user
        });
      }
    }
  }, [isAuthenticated, user, logActivity]);

  // Clear activity logs
  const clearActivities = useCallback(() => {
    setActivities([]);
    setTotalCount(0);
    setTodayCount(0);
    setActiveUsersCount(0);
    try {
      localStorage.removeItem(STORAGE_KEY);
      fetch(`${API_BASE_URL}/activity-logs`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      }).catch(() => {});
    } catch (e) {}
  }, []);

  // Export activities to CSV format
  const exportActivitiesCSV = useCallback(() => {
    if (activities.length === 0) return false;

    const headers = ['Timestamp', 'Date & Time', 'Full Name', 'Username', 'Role', 'Category', 'Action', 'Details', 'Target ID'];
    const csvRows = [headers.join(',')];

    activities.forEach(log => {
      const formattedDate = new Date(log.timestamp).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const row = [
        `"${log.timestamp}"`,
        `"${formattedDate}"`,
        `"${(log.user?.fullName || '').replace(/"/g, '""')}"`,
        `"${(log.user?.username || '').replace(/"/g, '""')}"`,
        `"${(log.user?.role || '').replace(/"/g, '""')}"`,
        `"${(log.category || '').replace(/"/g, '""')}"`,
        `"${(log.actionLabel || log.action || '').replace(/"/g, '""')}"`,
        `"${(log.details || '').replace(/"/g, '""')}"`,
        `"${(log.targetId || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `HelloProperties_User_Activity_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }, [activities]);

  return (
    <ActivityContext.Provider
      value={{
        activities,
        totalCount,
        todayCount,
        activeUsersCount,
        logActivity,
        clearActivities,
        exportActivitiesCSV,
        syncWithBackend
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
}

