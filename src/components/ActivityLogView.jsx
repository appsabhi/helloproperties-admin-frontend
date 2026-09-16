import React, { useState, useContext, useMemo } from 'react';
import { ActivityContext } from '../context/ActivityContext';
import { 
  Activity, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  User, 
  Shield, 
  Clock, 
  Calendar, 
  Tag, 
  CheckCircle2, 
  Building2, 
  Users as UsersIcon, 
  KeyRound, 
  FileSpreadsheet, 
  RefreshCw,
  X,
  AlertTriangle
} from 'lucide-react';

export default function ActivityLogView({ compact = false, limit = null }) {
  const { activities, clearActivities, exportActivitiesCSV } = useContext(ActivityContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [userFilter, setUserFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Extract unique users for filter dropdown
  const uniqueUsers = useMemo(() => {
    const map = new Map();
    activities.forEach(log => {
      if (log.user?.username) {
        map.set(log.user.username, log.user.fullName || log.user.username);
      }
    });
    return Array.from(map.entries()).map(([username, fullName]) => ({ username, fullName }));
  }, [activities]);

  // Total Portal Users computation
  const totalUsersCount = useMemo(() => {
    try {
      const saved = localStorage.getItem('hp_users_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.length;
        }
      }
    } catch (e) {}
    return Math.max(uniqueUsers.length, 2);
  }, [uniqueUsers]);

  // Helper for relative time
  const getRelativeTime = (isoString) => {
    try {
      const now = new Date();
      const past = new Date(isoString);
      const diffInSeconds = Math.floor((now - past) / 1000);

      if (diffInSeconds < 60) return 'Just now';
      const mins = Math.floor(diffInSeconds / 60);
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 30) return `${days}d ago`;
      return past.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  // Filtered activity logs
  const filteredActivities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const now = new Date();

    let result = activities.filter(log => {
      // Search Query
      const matchSearch = !query ||
        (log.user?.fullName && log.user.fullName.toLowerCase().includes(query)) ||
        (log.user?.username && log.user.username.toLowerCase().includes(query)) ||
        (log.actionLabel && log.actionLabel.toLowerCase().includes(query)) ||
        (log.details && log.details.toLowerCase().includes(query)) ||
        (log.category && log.category.toLowerCase().includes(query)) ||
        (log.targetId && log.targetId.toLowerCase().includes(query));

      // Category
      const matchCategory = categoryFilter === 'All' || log.category === categoryFilter;

      // User
      const matchUser = userFilter === 'All' || log.user?.username === userFilter;

      // Date Range
      let matchDate = true;
      if (dateFilter !== 'All') {
        const logDate = new Date(log.timestamp);
        if (dateFilter === 'Today') {
          matchDate = logDate.toDateString() === now.toDateString();
        } else if (dateFilter === '7Days') {
          matchDate = (now - logDate) <= (7 * 24 * 60 * 60 * 1000);
        } else if (dateFilter === '30Days') {
          matchDate = (now - logDate) <= (30 * 24 * 60 * 60 * 1000);
        }
      }

      return matchSearch && matchCategory && matchUser && matchDate;
    });

    if (limit && typeof limit === 'number') {
      return result.slice(0, limit);
    }

    return result;
  }, [activities, searchQuery, categoryFilter, userFilter, dateFilter, limit]);

  // Statistics
  const todayCount = useMemo(() => {
    const todayStr = new Date().toDateString();
    return activities.filter(a => new Date(a.timestamp).toDateString() === todayStr).length;
  }, [activities]);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Properties':
        return <Building2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'Buyer Requirements':
        return <UsersIcon className="w-3.5 h-3.5 text-purple-600" />;
      case 'User Management':
        return <Shield className="w-3.5 h-3.5 text-amber-600" />;
      case 'Authentication':
        return <KeyRound className="w-3.5 h-3.5 text-blue-600" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const getBadgeStyle = (badgeColor) => {
    switch (badgeColor) {
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'purple':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'amber':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'red':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'blue':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-[#C4005A]" />
            <h4 className="font-bold text-slate-900 text-sm">Recent User Activity</h4>
          </div>
          <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-[#FFF1F6] text-[#C4005A]">
            {activities.length} Events Logged
          </span>
        </div>

        {filteredActivities.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No recent activity recorded.</p>
        ) : (
          <div className="space-y-2.5">
            {filteredActivities.map((log) => (
              <div key={log.id} className="flex items-start space-x-3 text-xs p-2.5 rounded-lg bg-slate-50/70 hover:bg-slate-100/70 transition-colors border border-slate-100">
                <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center border border-slate-200 text-[#C4005A] font-bold text-3xs flex-shrink-0 shadow-2xs">
                  {log.user?.fullName ? log.user.fullName.substring(0, 2).toUpperCase() : 'US'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-slate-900 truncate">
                      {log.user?.fullName} <span className="font-normal text-slate-400">({log.user?.role})</span>
                    </span>
                    <span className="text-3xs text-slate-400 flex-shrink-0">{getRelativeTime(log.timestamp)}</span>
                  </div>
                  <p className="text-slate-600 mt-0.5 line-clamp-1 font-medium">{log.details}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-[#171717]">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Activities</span>
            <p className="text-2xl font-bold text-slate-900 leading-tight mt-0.5">{activities.length}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Logged Today</span>
            <p className="text-2xl font-bold text-slate-900 leading-tight mt-0.5">{todayCount}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-[#FFF1F6] text-[#C4005A]">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Users</span>
            <p className="text-2xl font-bold text-slate-900 leading-tight mt-0.5">{uniqueUsers.length}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
            <UsersIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Toolbar: Search, Filters, Export, Clear */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activity by user, action, property title, or details..."
              className="w-full pl-9 pr-8 py-2 border border-[#E8E8E8] rounded-lg text-xs bg-white text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#C4005A]/10 focus:border-[#C4005A]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Export & Clear Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={exportActivitiesCSV}
              disabled={activities.length === 0}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Export Log to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={activities.length === 0}
              className="px-3 py-2 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Clear Log History"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Log</span>
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          {/* Category Filter */}
          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs">
            <Filter className="w-3 h-3 text-slate-400" />
            <span className="text-2xs font-bold text-slate-500 uppercase">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Properties">Properties</option>
              <option value="Buyer Requirements">Buyer Requirements</option>
              <option value="User Management">User Management</option>
              <option value="Authentication">Authentication</option>
            </select>
          </div>

          {/* User Filter */}
          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs">
            <User className="w-3 h-3 text-slate-400" />
            <span className="text-2xs font-bold text-slate-500 uppercase">User:</span>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="All">All Users</option>
              {uniqueUsers.map(u => (
                <option key={u.username} value={u.username}>{u.fullName} (@{u.username})</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span className="text-2xs font-bold text-slate-500 uppercase">Period:</span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="All">All Time</option>
              <option value="Today">Today Only</option>
              <option value="7Days">Last 7 Days</option>
              <option value="30Days">Last 30 Days</option>
            </select>
          </div>

          {/* Reset Filters button */}
          {(searchQuery || categoryFilter !== 'All' || userFilter !== 'All' || dateFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('All');
                setUserFilter('All');
                setDateFilter('All');
              }}
              className="px-2 py-1 text-2xs font-bold text-[#C4005A] hover:bg-[#FFF1F6] rounded transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredActivities.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-3">
            <Activity className="w-10 h-10 text-slate-300" />
            <p className="font-semibold text-slate-700">No activity logs found matching your criteria.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('All');
                setUserFilter('All');
                setDateFilter('All');
              }}
              className="px-4 py-2 bg-[#FFF1F6] text-[#C4005A] rounded-lg text-xs font-semibold cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3.5">WHEN (Timestamp)</th>
                  <th className="px-6 py-3.5">WHO (User)</th>
                  <th className="px-6 py-3.5">WHICH (Action & Details)</th>
                  <th className="px-6 py-3.5">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredActivities.map((log) => {
                  const relativeTime = getRelativeTime(log.timestamp);
                  const formattedDate = new Date(log.timestamp).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* WHEN */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">{formattedDate}</span>
                            <span className="text-3xs font-semibold text-[#C4005A]">{relativeTime}</span>
                          </div>
                        </div>
                      </td>

                      {/* WHO */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-[#FFF1F6] flex items-center justify-center text-[#C4005A] font-bold text-xs border border-[#C4005A]/20 flex-shrink-0">
                            {log.user?.fullName ? log.user.fullName.substring(0, 2).toUpperCase() : 'AD'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">{log.user?.fullName || 'User'}</span>
                            <div className="flex items-center space-x-1.5 mt-0.5">
                              <span className="text-3xs text-slate-400">@{log.user?.username || 'user'}</span>
                              <span className={`text-4xs font-extrabold px-1.5 py-0.2 rounded uppercase ${
                                log.user?.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {log.user?.role || 'Staff'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* WHICH */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-3xs font-bold border uppercase tracking-wider ${getBadgeStyle(log.badgeColor)}`}>
                              {log.actionLabel || log.action}
                            </span>
                            {log.targetId && (
                              <span className="text-3xs text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                ID: {log.targetId}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-800 font-semibold text-xs leading-snug">{log.details}</p>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          {getCategoryIcon(log.category)}
                          <span className="text-xs font-semibold text-slate-700">{log.category}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Clear Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 space-y-4 border border-slate-200 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-base">Clear Activity History?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to wipe all logged user activity records? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearActivities();
                  setShowClearConfirm(false);
                }}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
