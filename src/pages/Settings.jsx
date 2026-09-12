import React, { useState, useContext } from 'react';
import { User, ShieldAlert, Monitor, CheckCircle2, RefreshCw, Share2 } from 'lucide-react';
import { PropertyContext } from '../context/PropertyContext';

export default function Settings() {
  const { fetchFromBackend, isPropertySharingEnabled, togglePropertySharing } = useContext(PropertyContext);

  const [profileName, setProfileName] = useState(() => {
    return localStorage.getItem('hp_profile_name') || 'Staff Member';
  });
  const [profileEmail, setProfileEmail] = useState(() => {
    return localStorage.getItem('hp_profile_email') || 'staff@helloproperties.in';
  });
  const [profileRole] = useState(() => {
    const rawRole = localStorage.getItem('hp_user_role') || 'Staff';
    return rawRole.charAt(0).toUpperCase() + rawRole.slice(1);
  });

  const [saveMessage, setSaveMessage] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const handleSaveChanges = (e) => {
    e.preventDefault();
    localStorage.setItem('hp_profile_name', profileName);
    localStorage.setItem('hp_profile_email', profileEmail);
    setSaveMessage('Profile changes saved successfully.');
    setTimeout(() => {
      setSaveMessage('');
    }, 3000);
  };

  const handleRefreshData = async () => {
    if (fetchFromBackend) {
      await fetchFromBackend();
    }
    setResetMessage('Database synced successfully with PostgreSQL backend.');
    setTimeout(() => {
      setResetMessage('');
    }, 3000);
  };

  return (
    <div className="space-y-6 font-sans text-[#171717] max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-[24px] font-bold tracking-tight text-[#171717]">Settings</h2>
        <p className="text-sm text-[#6B6B6B]">Manage your account and application preferences.</p>
      </div>

      {saveMessage && (
        <div className="bg-[#FFF1F6] border border-[#C4005A]/20 rounded-xl p-4 flex items-center space-x-3 text-[#C4005A] animate-fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-[#C4005A] flex-shrink-0" />
          <span className="text-sm font-semibold">{saveMessage}</span>
        </div>
      )}

      {resetMessage && (
        <div className="bg-[#FFF1F6] border border-[#C4005A]/20 rounded-xl p-4 flex items-center space-x-3 text-[#C4005A] animate-fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-[#C4005A] flex-shrink-0" />
          <span className="text-sm font-semibold">{resetMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Profile & Application Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Profile Card */}
          <div className="bg-white rounded-xl border border-[#E8E8E8] shadow-sm p-6 space-y-5">
            <div className="flex items-center space-x-2.5 text-[#171717]">
              <User className="w-5 h-5 text-[#C4005A]" />
              <h3 className="font-bold text-base">Profile</h3>
            </div>

            <form onSubmit={handleSaveChanges} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="fullName" className="text-xs font-semibold text-[#6B6B6B]">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-[#E8E8E8] rounded-lg text-sm bg-white text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#C4005A]/10 focus:border-[#C4005A] transition-colors"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="email" className="text-xs font-semibold text-[#6B6B6B]">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full px-3.5 py-2 border border-[#E8E8E8] rounded-lg text-sm bg-white text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#C4005A]/10 focus:border-[#C4005A] transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-1.5 max-w-md">
                <label htmlFor="role" className="text-xs font-semibold text-[#6B6B6B]">
                  Role
                </label>
                <input
                  id="role"
                  type="text"
                  readOnly
                  value={profileRole}
                  className="w-full px-3.5 py-2 border border-[#E8E8E8] rounded-lg text-sm bg-slate-50 text-[#6B6B6B] cursor-not-allowed select-none focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#C4005A] hover:bg-[#B0004F] text-white font-semibold rounded-lg shadow-sm text-sm transition-all duration-150 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* Feature Settings Card */}
          <div className="bg-white rounded-xl border border-[#E8E8E8] shadow-sm p-6 space-y-5">
            <div className="flex items-center space-x-2.5 text-[#171717]">
              <Share2 className="w-5 h-5 text-[#C4005A]" />
              <h3 className="font-bold text-base">Feature Settings</h3>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div className="space-y-0.5 pr-4">
                <span className="font-bold text-sm text-slate-900 block">Property Sharing (WhatsApp)</span>
                <span className="text-xs text-[#6B6B6B] block">
                  Allow staff to generate and share customer-facing property details with buyers. (Contains ONLY Image, Type, District, Area, Price).
                </span>
              </div>
              <button
                type="button"
                onClick={() => togglePropertySharing(!isPropertySharingEnabled)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isPropertySharingEnabled ? 'bg-[#C4005A]' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={isPropertySharingEnabled}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isPropertySharingEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Application Details Card */}
          <div className="bg-white rounded-xl border border-[#E8E8E8] shadow-sm p-6 space-y-5">
            <div className="flex items-center space-x-2.5 text-[#171717]">
              <Monitor className="w-5 h-5 text-[#C4005A]" />
              <h3 className="font-bold text-base">Application</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[#6B6B6B] block">Application Name:</span>
                <span className="font-semibold text-[#171717]">HelloProperties</span>
              </div>
              <div className="space-y-1">
                <span className="text-[#6B6B6B] block">Application Type:</span>
                <span className="font-semibold text-[#171717]">Internal Admin Dashboard</span>
              </div>
              <div className="space-y-1">
                <span className="text-[#6B6B6B] block">Version:</span>
                <span className="font-semibold text-[#171717]">V1.0.0</span>
              </div>
              <div className="space-y-1">
                <span className="text-[#6B6B6B] block">Database:</span>
                <span className="font-semibold text-[#171717]">Neon PostgreSQL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Data Sync Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-[#E8E8E8] shadow-sm p-6 space-y-4">
            <div className="flex items-center space-x-2.5 text-[#171717]">
              <ShieldAlert className="w-5 h-5 text-[#C4005A]" />
              <h3 className="font-bold text-base">Data Sync</h3>
            </div>

            <p className="text-xs text-[#6B6B6B] leading-relaxed">
              Manually refresh live properties and buyer requirements directly from your Neon PostgreSQL database.
            </p>

            <button
              onClick={handleRefreshData}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#FFF1F6] border border-[#C4005A]/20 hover:bg-[#C4005A] text-[#C4005A] hover:text-white rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Data from Database</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
