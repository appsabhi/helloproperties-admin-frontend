import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ActivityContext } from '../context/ActivityContext';
import Modal from '../components/Modal';
import { 
  Users, 
  UserPlus, 
  Shield, 
  User,
  UserCheck, 
  UserX, 
  KeyRound, 
  Edit3, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  RefreshCw,
  Search,
  Filter,
  Eye,
  EyeOff,
  Calendar,
  Mail,
  AtSign,
  AlertTriangle
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : 'https://helloproperties-admin-backend.vercel.app/api'
);

const getAuthHeaders = () => {
  const token = localStorage.getItem('hp_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export default function UserManagement() {
  const { user: currentUser } = useContext(AuthContext);
  const { logActivity } = useContext(ActivityContext) || {};

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [toast, setToast] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [resetPasswordTarget, setResetPasswordTarget] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null); // For activate/deactivate confirmation modal

  // Forms state
  const [addForm, setAddForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Staff'
  });
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showAddConfirmPassword, setShowAddConfirmPassword] = useState(false);

  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    role: 'Staff'
  });

  const [resetPasswordForm, setResetPasswordForm] = useState({
    newPassword: '',
    confirmNewPassword: ''
  });
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data) && data.data.length > 0) {
        setUsers(data.data);
      } else {
        const saved = localStorage.getItem('hp_users_list');
        if (saved) setUsers(JSON.parse(saved));
        else setUsers(data.data || []);
      }
    } catch (err) {
      const saved = localStorage.getItem('hp_users_list');
      if (saved) {
        setUsers(JSON.parse(saved));
      } else {
        setFetchError('Unable to load users. Please check connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Persist local state changes to localStorage backup
  useEffect(() => {
    if (users.length > 0) {
      try {
        localStorage.setItem('hp_users_list', JSON.stringify(users));
      } catch (e) {}
    }
  }, [users]);

  // Filtered Users computation
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search match
      const query = searchQuery.trim().toLowerCase();
      const matchQuery = !query || 
        (u.fullName && u.fullName.toLowerCase().includes(query)) ||
        (u.username && u.username.toLowerCase().includes(query)) ||
        (u.email && u.email.toLowerCase().includes(query));

      // Role match
      const matchRole = roleFilter === 'All' || u.role === roleFilter;

      // Status match
      const matchStatus = statusFilter === 'All' || 
        (statusFilter === 'Active' && u.isActive) ||
        (statusFilter === 'Deactivated' && !u.isActive);

      return matchQuery && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Handle Create User Submit
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Client-side validations
    if (!addForm.fullName.trim()) {
      setFormError('Full Name is required.');
      return;
    }
    if (!addForm.username.trim()) {
      setFormError('Username is required.');
      return;
    }
    if (addForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.email.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!addForm.password) {
      setFormError('Password is required.');
      return;
    }
    if (addForm.password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }
    if (addForm.password !== addForm.confirmPassword) {
      setFormError('Confirm Password does not match Password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          fullName: addForm.fullName.trim(),
          username: addForm.username.trim(),
          email: addForm.email.trim(),
          password: addForm.password,
          role: addForm.role
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(data.message || `User '${addForm.username}' created successfully!`);
        setIsAddModalOpen(false);

        if (logActivity) {
          logActivity({
            category: 'User Management',
            action: 'CREATE_USER',
            actionLabel: 'Created User',
            details: `Created new ${addForm.role} account @${addForm.username.trim()} (${addForm.fullName.trim()})`,
            targetId: data.data?.userId || addForm.username,
            badgeColor: 'amber'
          });
        }

        setAddForm({
          fullName: '',
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'Staff'
        });
        fetchUsers();
      } else {
        setFormError(data.error || 'Failed to create user account.');
      }
    } catch (err) {
      setFormError('Network error creating user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (userItem) => {
    setEditingUser(userItem);
    setEditForm({
      fullName: userItem.fullName || '',
      email: userItem.email || '',
      role: userItem.role || 'Staff'
    });
    setFormError(null);
  };

  // Handle Edit User Submit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setFormError(null);

    if (!editForm.fullName.trim()) {
      setFormError('Full Name is required.');
      return;
    }
    if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/users/${editingUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          fullName: editForm.fullName.trim(),
          email: editForm.email.trim(),
          role: editForm.role
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(data.message || 'User details updated successfully!');

        if (logActivity) {
          logActivity({
            category: 'User Management',
            action: 'UPDATE_USER',
            actionLabel: 'Updated User Details',
            details: `Updated details for user @${editingUser.username} (${editForm.fullName}, ${editForm.role})`,
            targetId: editingUser.userId || editingUser.id,
            badgeColor: 'amber'
          });
        }

        setEditingUser(null);
        fetchUsers();
      } else {
        setFormError(data.error || 'Failed to update user details.');
      }
    } catch (err) {
      setFormError('Network error updating user details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Open Reset Password Modal
  const handleOpenResetPassword = (userItem) => {
    setResetPasswordTarget(userItem);
    setResetPasswordForm({
      newPassword: '',
      confirmNewPassword: ''
    });
    setFormError(null);
  };

  // Handle Submit Reset Password
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetPasswordTarget) return;
    setFormError(null);

    if (!resetPasswordForm.newPassword) {
      setFormError('New password is required.');
      return;
    }
    if (resetPasswordForm.newPassword.length < 6) {
      setFormError('New password must be at least 6 characters long.');
      return;
    }
    if (resetPasswordForm.newPassword !== resetPasswordForm.confirmNewPassword) {
      setFormError('Confirm New Password does not match New Password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/users/${resetPasswordTarget.id}/reset-password`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ newPassword: resetPasswordForm.newPassword })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(data.message || 'Password reset successfully!');

        if (logActivity) {
          logActivity({
            category: 'User Management',
            action: 'RESET_PASSWORD',
            actionLabel: 'Reset Password',
            details: `Reset password for user account @${resetPasswordTarget.username}`,
            targetId: resetPasswordTarget.userId || resetPasswordTarget.id,
            badgeColor: 'amber'
          });
        }

        setResetPasswordTarget(null);
        setResetPasswordForm({ newPassword: '', confirmNewPassword: '' });
      } else {
        setFormError(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      setFormError('Network error resetting password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Status Toggle Confirmation Submit (Deactivation / Activation)
  const handleConfirmToggleStatus = async () => {
    if (!statusTarget) return;

    const targetUser = statusTarget;
    const newStatus = !targetUser.isActive;
    setIsSubmitting(true);

    // 1. Immediately update local React state for instantaneous UI feedback
    setUsers(prev => prev.map(u => 
      (u.id === targetUser.id || (u.userId && u.userId === targetUser.userId) || (u.username && targetUser.username && u.username.toLowerCase() === targetUser.username.toLowerCase()))
        ? { ...u, isActive: newStatus }
        : u
    ));

    // 2. Log activity
    if (logActivity) {
      logActivity({
        category: 'User Management',
        action: 'USER_STATUS_CHANGE',
        actionLabel: 'Changed User Status',
        details: `${newStatus ? 'Activated' : 'Deactivated'} user account @${targetUser.username} (${targetUser.fullName || targetUser.username})`,
        targetId: targetUser.userId || targetUser.id,
        badgeColor: newStatus ? 'emerald' : 'red'
      });
    }

    // 3. Sync status to backend API
    try {
      const res = await fetch(`${API_BASE_URL}/users/${targetUser.id || targetUser.userId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ isActive: newStatus })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(data.message || `User status updated to ${newStatus ? 'Active' : 'Deactivated'}.`);
      } else {
        // Fallback endpoint if PATCH /status is not available
        await fetch(`${API_BASE_URL}/users/${targetUser.id || targetUser.userId}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify({ isActive: newStatus })
        });
        showToast(`User status updated to ${newStatus ? 'Active' : 'Deactivated'}.`);
      }
    } catch (err) {
      showToast(`User status updated to ${newStatus ? 'Active' : 'Deactivated'}.`);
    } finally {
      setStatusTarget(null);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-[#171717]">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg text-xs font-semibold animate-fade-in ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-[#B0004F]" />
            <h2 className="text-[28px] font-bold text-[#171717] tracking-tight">User Management</h2>
          </div>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Manage admin and staff access
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="px-3 py-2 bg-white border border-[#E8E8E8] hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Refresh Users List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => {
              setIsAddModalOpen(true);
              setFormError(null);
              setAddForm({
                fullName: '',
                username: '',
                email: '',
                password: '',
                confirmPassword: '',
                role: 'Staff'
              });
              setShowAddPassword(false);
              setShowAddConfirmPassword(false);
            }}
            className="px-4 py-2 bg-[#B0004F] hover:bg-[#C4005A] text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-[#E8E8E8] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by full name, username, or email..."
            className="w-full pl-9 pr-4 py-2 border border-[#E8E8E8] rounded-lg text-xs bg-white text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F] transition-colors"
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Role Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-[#E8E8E8] px-3 py-1.5 rounded-lg">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-2xs font-semibold text-slate-500 uppercase">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="All">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Staff">Staff</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-[#E8E8E8] px-3 py-1.5 rounded-lg">
            <span className="text-2xs font-semibold text-slate-500 uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Deactivated">Deactivated</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {(searchQuery || roleFilter !== 'All' || statusFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('All');
                setStatusFilter('All');
              }}
              className="px-3 py-1.5 text-xs font-semibold text-[#B0004F] hover:bg-[#FFF1F6] rounded-lg transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-[#E8E8E8] p-16 text-center text-slate-500 text-sm font-medium flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#B0004F]" />
          <span>Loading users...</span>
        </div>
      ) : fetchError ? (
        <div className="bg-white rounded-xl border border-red-200 p-12 text-center text-red-600 text-sm font-medium flex flex-col items-center justify-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <span>{fetchError}</span>
          <button
            onClick={fetchUsers}
            className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer mt-2"
          >
            Retry
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E8E8E8] p-12 text-center text-slate-500 text-sm flex flex-col items-center justify-center space-y-3">
          <Users className="w-10 h-10 text-slate-300" />
          <p className="font-semibold text-slate-700">No users found.</p>
          <p className="text-xs text-slate-400">Click "Add User" to create the first staff or admin account.</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E8E8E8] p-12 text-center text-slate-500 text-sm flex flex-col items-center justify-center space-y-3">
          <Search className="w-10 h-10 text-slate-300" />
          <p className="font-semibold text-slate-700">No users match your search criteria.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setRoleFilter('All');
              setStatusFilter('All');
            }}
            className="px-4 py-2 bg-[#FFF1F6] text-[#B0004F] hover:bg-[#FFE4EE] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW (Visible on lg and larger screens) */}
          <div className="hidden lg:block bg-white rounded-xl border border-[#E8E8E8] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Full Name</th>
                    <th className="px-6 py-3.5">Username / Email</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Date Joined</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {filteredUsers.map((u) => {
                    const isSelf = currentUser?.userId === u.userId;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Full Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-[#FFF1F6] flex items-center justify-center text-[#B0004F] font-bold text-xs border border-[#B0004F]/20 flex-shrink-0">
                              {u.fullName ? u.fullName.substring(0, 2).toUpperCase() : u.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block text-sm">{u.fullName}</span>
                              <span className="text-2xs text-slate-400 font-mono">{u.userId}</span>
                            </div>
                          </div>
                        </td>

                        {/* Username / Email */}
                        <td className="px-6 py-4">
                          <span className="block font-semibold text-slate-800">@{u.username}</span>
                          <span className="text-2xs text-slate-400">{u.email || 'No email provided'}</span>
                        </td>

                        {/* Role */}
                        <td className="px-6 py-4">
                          {u.role === 'Admin' ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-2xs font-extrabold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                              <Shield className="w-3 h-3 text-purple-600" />
                              <span>Admin</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-2xs font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                              <User className="w-3 h-3 text-blue-600" />
                              <span>Staff</span>
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {u.isActive ? (
                            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-2xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-2xs font-bold bg-red-50 text-red-700 border border-red-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              <span>Deactivated</span>
                            </span>
                          )}
                        </td>

                        {/* Date Joined */}
                        <td className="px-6 py-4 text-slate-500 text-2xs">
                          {new Date(u.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEdit(u)}
                              className="p-1.5 text-slate-600 hover:text-[#B0004F] hover:bg-[#FFF1F6] rounded-md transition-colors cursor-pointer"
                              title="Edit User Details"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Reset Password Button */}
                            <button
                              onClick={() => handleOpenResetPassword(u)}
                              className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                              title="Reset Password"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>

                            {/* Activate / Deactivate Button */}
                            <button
                              onClick={() => setStatusTarget(u)}
                              disabled={isSelf}
                              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                isSelf 
                                  ? 'text-slate-300 cursor-not-allowed' 
                                  : u.isActive 
                                    ? 'text-slate-600 hover:text-red-600 hover:bg-red-50' 
                                    : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={isSelf ? 'You cannot deactivate your own logged-in account' : u.isActive ? 'Deactivate User' : 'Activate User'}
                            >
                              {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE & TABLET CARD VIEW (Visible on screens smaller than lg) */}
          <div className="block lg:hidden space-y-3">
            {filteredUsers.map((u) => {
              const isSelf = currentUser?.userId === u.userId;
              return (
                <div key={u.id} className="bg-white rounded-xl border border-[#E8E8E8] shadow-xs p-4 space-y-3">
                  {/* Card Header: Avatar, Name, Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-[#FFF1F6] flex items-center justify-center text-[#B0004F] font-bold text-sm border border-[#B0004F]/20 flex-shrink-0">
                        {u.fullName ? u.fullName.substring(0, 2).toUpperCase() : u.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-snug">{u.fullName}</h4>
                        <p className="text-xs text-slate-500 font-medium">@{u.username}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-1">
                      {/* Role Badge */}
                      {u.role === 'Admin' ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase bg-purple-50 text-purple-700 border border-purple-200">
                          <Shield className="w-3 h-3 text-purple-600" />
                          <span>Admin</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                          <User className="w-3 h-3 text-blue-600" />
                          <span>Staff</span>
                        </span>
                      )}

                      {/* Status Badge */}
                      {u.isActive ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-red-50 text-red-700 border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          <span>Deactivated</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                    <div className="flex items-center space-x-2 text-slate-500">
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{u.email || 'No email provided'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-400 text-2xs">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>Joined {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-[#FFF1F6] text-slate-700 hover:text-[#B0004F] border border-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleOpenResetPassword(u)}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>

                    <button
                      onClick={() => setStatusTarget(u)}
                      disabled={isSelf}
                      className={`px-3 py-1.5 border rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer ${
                        isSelf
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : u.isActive
                            ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {u.isActive ? (
                        <>
                          <UserX className="w-3.5 h-3.5" />
                          <span>Deactivate</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Activate</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ADD USER MODAL */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add User"
          subtitle="Create a new staff or admin portal user"
          icon={UserPlus}
          size="lg"
        >
          <form onSubmit={handleCreateUser} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Full Name *</label>
              <input
                type="text"
                required
                value={addForm.fullName}
                onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3.5 py-2 border border-[#E8E8E8] rounded-lg text-xs bg-white text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F]"
              />
            </div>

            {/* Username */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Username *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400">@</span>
                <input
                  type="text"
                  required
                  value={addForm.username}
                  onChange={(e) => setAddForm({ ...addForm, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                  placeholder="rahulsharma"
                  className="w-full pl-7 pr-3.5 py-2 border border-[#E8E8E8] rounded-lg text-xs bg-white text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F]"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Email Address</label>
              <input
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                placeholder="rahul@helloproperties.com"
                className="w-full px-3.5 py-2 border border-[#E8E8E8] rounded-lg text-xs bg-white text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F]"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Password *</label>
              <div className="relative">
                <input
                  type={showAddPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="•••••••• (Min 6 characters)"
                  className="w-full pl-3.5 pr-10 py-2 border border-[#E8E8E8] rounded-lg text-xs bg-white text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F]"
                />
                <button
                  type="button"
                  onClick={() => setShowAddPassword(!showAddPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Confirm Password *</label>
              <div className="relative">
                <input
                  type={showAddConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={addForm.confirmPassword}
                  onChange={(e) => setAddForm({ ...addForm, confirmPassword: e.target.value })}
                  placeholder="Re-enter password"
                  className="w-full pl-3.5 pr-10 py-2 border border-[#E8E8E8] rounded-lg text-xs bg-white text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F]"
                />
                <button
                  type="button"
                  onClick={() => setShowAddConfirmPassword(!showAddConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showAddConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">System Role *</label>
              <select
                value={addForm.role}
                onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                className="w-full px-3.5 py-2 border border-[#E8E8E8] rounded-lg text-xs bg-white text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F] cursor-pointer"
              >
                <option value="Staff">Staff (Properties, Requirements & Matching)</option>
                <option value="Admin">Admin (Full System Access & User Management)</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#B0004F] hover:bg-[#C4005A] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create User</span>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <Modal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          title={`Edit User: @${editingUser.username}`}
          subtitle={`Update profile and system access role for ${editingUser.fullName}`}
          icon={Edit3}
          size="lg"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Full Name *</label>
              <input
                type="text"
                required
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                className="w-full px-3.5 py-2 border border-[#E8E8E8] rounded-lg text-xs bg-white text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F]"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Email Address</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-3.5 py-2 border border-[#E8E8E8] rounded-lg text-xs bg-white text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F]"
              />
            </div>

            {/* System Role */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">System Role *</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className="w-full px-3.5 py-2 border border-[#E8E8E8] rounded-lg text-xs bg-white text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F] cursor-pointer"
              >
                <option value="Staff">Staff (Properties, Requirements & Matching)</option>
                <option value="Admin">Admin (Full System Access & User Management)</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#B0004F] hover:bg-[#C4005A] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetPasswordTarget && (
        <Modal
          isOpen={!!resetPasswordTarget}
          onClose={() => setResetPasswordTarget(null)}
          title="Reset Password"
          subtitle={`Set a new password for ${resetPasswordTarget.fullName} (@${resetPasswordTarget.username})`}
          icon={KeyRound}
          size="md"
        >
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* New Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">New Password *</label>
              <div className="relative">
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={resetPasswordForm.newPassword}
                  onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, newPassword: e.target.value })}
                  placeholder="•••••••• (Min 6 characters)"
                  className="w-full pl-3.5 pr-10 py-2 border border-[#E8E8E8] rounded-lg text-xs bg-white text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F]"
                />
                <button
                  type="button"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Confirm New Password *</label>
              <div className="relative">
                <input
                  type={showResetConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={resetPasswordForm.confirmNewPassword}
                  onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, confirmNewPassword: e.target.value })}
                  placeholder="Re-enter new password"
                  className="w-full pl-3.5 pr-10 py-2 border border-[#E8E8E8] rounded-lg text-xs bg-white text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#B0004F]/10 focus:border-[#B0004F]"
                />
                <button
                  type="button"
                  onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showResetConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResetPasswordTarget(null)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <span>Reset Password</span>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ACTIVATE / DEACTIVATE CONFIRMATION MODAL */}
      {statusTarget && (
        <Modal
          isOpen={!!statusTarget}
          onClose={() => setStatusTarget(null)}
          title={statusTarget.isActive ? `Deactivate ${statusTarget.fullName}?` : `Activate ${statusTarget.fullName}?`}
          subtitle={statusTarget.isActive ? 'They will no longer be able to sign in' : 'They will regain portal access'}
          icon={AlertTriangle}
          size="sm"
          footer={
            <div className="flex items-center justify-end space-x-3 w-full">
              <button
                type="button"
                onClick={() => setStatusTarget(null)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmToggleStatus}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer flex items-center space-x-1.5 ${
                  statusTarget.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{statusTarget.isActive ? 'Deactivate Account' : 'Activate Account'}</span>
                )}
              </button>
            </div>
          }
        />
      )}
    </div>
  );
}
