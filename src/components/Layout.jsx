import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Home,
  Shield,
  Activity,
  Settings as SettingsIcon, 
  LogOut, 
  Menu, 
  X,
  User,
  ChevronDown,
  ChevronRight,
  Bell,
  HelpCircle,
  Search,
  Loader2
} from 'lucide-react';
import logo from '../assets/HELLO PROPERTIES LOGO.png';
import MinimalLoader from './MinimalLoader';
import { PropertyContext } from '../context/PropertyContext';
import { AuthContext } from '../context/AuthContext';

// Custom User with Dollar symbol icon for Buyer Requirements (matches reference image)
const UserDollarIcon = ({ className = "w-5 h-5" }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    {/* User Head */}
    <circle cx="10" cy="6.5" r="4" />
    {/* User Shoulders */}
    <path d="M2 20a7 7 0 0 1 11.5-5.2" />
    {/* Dollar Badge Circle */}
    <circle cx="17.5" cy="17.5" r="4.5" fill="currentColor" stroke="none" />
    {/* White Dollar text inside badge */}
    <text 
      x="17.5" 
      y="20.5" 
      textAnchor="middle" 
      fill="white" 
      fontSize="8.5" 
      fontWeight="bold" 
      fontFamily="system-ui, -apple-system, sans-serif" 
      stroke="none"
    >
      $
    </text>
  </svg>
);

export default function Layout({ children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(() => 
    location.pathname.startsWith('/properties')
  );
  const navigate = useNavigate();
  const { isApiLoading, apiLoadingMessage } = useContext(PropertyContext) || {};
  const { logout, user } = useContext(AuthContext) || {};

  useEffect(() => {
    if (location.pathname.startsWith('/properties')) {
      setIsPropertiesOpen(true);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    if (logout) {
      await logout();
    }
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { 
      to: '/properties', 
      label: 'Properties', 
      icon: Building2,
      subItems: [
        { to: '/properties', label: 'Property Listings', icon: Home, exact: true },
        { to: '/properties/requirements', label: 'Buyer Requirements', icon: UserDollarIcon }
      ]
    },
    ...(user?.role === 'Admin' ? [{ to: '/users', label: 'User Management', icon: Shield }] : []),
    ...(user?.role === 'Admin' ? [{ to: '/activities', label: 'Activity Logs', icon: Activity }] : []),
    { to: '/settings', label: 'Settings', icon: SettingsIcon }
  ];

  const SidebarContent = ({ isCollapsed = false }) => (
    <div className="flex flex-col h-full bg-[#FFFFFF] text-[#171717]">
      {/* Brand Header */}
      <div className={`flex items-center border-b border-[#E8E8E8] h-[88px] bg-white flex-shrink-0 transition-all duration-300 ${
        isCollapsed ? 'justify-center px-2' : 'px-5 py-4 space-x-3'
      }`}>
        {!isCollapsed && (
          <div className="flex-1 flex items-center animate-fade-in">
            <img src={logo} alt="HelloProperties Logo" className="w-[155px] h-auto object-contain" />
          </div>
        )}
      </div>

      {/* Nav Menu */}
      <nav className={`flex-1 py-4 space-y-1.5 overflow-y-auto transition-all duration-300 ${
        isCollapsed ? 'px-2' : 'px-4'
      }`}>
        {navItems.map((item) => {
          const isActive = item.to === '/properties'
            ? location.pathname.startsWith('/properties')
            : location.pathname === item.to;

          return (
            <div key={item.label} className="space-y-1">
              <div className="relative flex items-center w-full">
                <NavLink
                  to={item.to}
                  onClick={() => !item.subItems && setIsMobileOpen(false)}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex-1 flex items-center rounded-lg text-[14px] font-semibold transition-all duration-150 border border-transparent ${
                    isCollapsed ? 'justify-center h-11' : 'justify-between px-4 h-11'
                  } ${
                    isActive
                      ? 'bg-[#FFF1F6] text-[#C4005A] border-l-4 border-l-[#C4005A] rounded-l-none font-bold'
                      : 'text-[#171717] hover:bg-[#FFF1F6] hover:text-[#C4005A]'
                  }`}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
                    <item.icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors duration-150 ${isActive ? 'text-[#C4005A]' : 'text-[#6B6B6B]'}`} />
                    {!isCollapsed && <span className="animate-fade-in">{item.label}</span>}
                  </div>
                </NavLink>
                {item.subItems && !isCollapsed && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsPropertiesOpen(prev => !prev);
                    }}
                    className={`absolute right-3 p-1.5 rounded-md hover:bg-[#FFF1F6]/50 transition-colors cursor-pointer ${isActive ? 'text-[#C4005A]' : 'text-[#6B6B6B]'}`}
                  >
                    {isPropertiesOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {/* Subitems */}
              {item.subItems && (isPropertiesOpen || isCollapsed) && (
                <div className={`space-y-1 mt-1 border-[#E8E8E8] transition-all duration-300 ${
                  isCollapsed ? 'border-none ml-0 pl-0' : 'border-l ml-6'
                }`}>
                  {item.subItems.map((sub) => {
                    const isSubActive = sub.exact
                      ? (location.pathname === '/properties' || location.pathname === '/properties/listings')
                      : (location.pathname === '/properties/requirements' || location.pathname === '/properties/buy');

                    return (
                      <NavLink
                        key={sub.label}
                        to={sub.to}
                        onClick={() => setIsMobileOpen(false)}
                        title={isCollapsed ? sub.label : undefined}
                        className={`flex items-center rounded-lg text-[13px] transition-all duration-150 border-l-2 box-border ${
                          isCollapsed ? 'justify-center h-10 border-l-transparent' : 'space-x-2.5 pl-5 pr-2 h-10'
                        } ${
                          isSubActive
                            ? 'bg-[#FFF1F6]/50 text-[#C4005A] border-l-[#C4005A] rounded-l-none font-semibold'
                            : 'text-[#6B6B6B] hover:bg-[#FFF1F6]/50 hover:text-[#C4005A] border-l-transparent font-medium'
                        }`}
                      >
                        <sub.icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors duration-150 ${isSubActive ? 'text-[#C4005A]' : 'text-[#6B6B6B]'}`} />
                        {!isCollapsed && <span className="animate-fade-in whitespace-nowrap">{sub.label}</span>}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div className={`border-t border-[#E8E8E8] bg-slate-50/50 mt-auto flex flex-col space-y-3 transition-all duration-300 ${
        isCollapsed ? 'p-2 items-center' : 'p-4'
      }`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3 px-2'}`}>
          <div className="w-9 h-9 rounded-full bg-[#FFF1F6] flex items-center justify-center border border-[#E8E8E8] flex-shrink-0">
            <User className="w-[18px] h-[18px] text-[#C4005A]" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 animate-fade-in">
              <p className="text-[13px] font-semibold text-[#171717] truncate">{user?.fullName || user?.username || 'Staff Member'}</p>
              <p className="text-[11px] font-normal text-[#6B6B6B] truncate">{user?.role || 'Staff'} • HelloProperties</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Logout' : undefined}
          className={`flex items-center justify-center space-x-2 rounded-lg text-[12px] font-semibold bg-white hover:bg-[#FFF1F6] text-[#6B6B6B] hover:text-[#C4005A] border border-[#E8E8E8] hover:border-[#FFF1F6] transition-all duration-150 cursor-pointer ${
            isCollapsed ? 'w-10 h-10' : 'w-full px-4 h-10'
          }`}
        >
          <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
          {!isCollapsed && <span className="animate-fade-in">Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F7F7F7]">
      {/* Desktop Sidebar (Permanent) */}
      <div className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 z-10 shadow-sm border-r border-[#E8E8E8] transition-all duration-300 ${
        sidebarCollapsed ? 'md:w-[72px]' : 'md:w-[260px]'
      }`}>
        <SidebarContent isCollapsed={sidebarCollapsed} />
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
        sidebarCollapsed ? 'md:pl-[72px]' : 'md:pl-[260px]'
      }`}>
        {/* TOP HEADER */}
        <header className="sticky top-0 z-20 flex items-center justify-between bg-white px-6 h-[72px] border-b border-[#E8E8E8] shadow-xs">
          {/* Left Side: Hamburger menu & Search */}
          <div className="flex items-center space-x-4 flex-1">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-1.5 rounded-md text-[#6B6B6B] hover:text-[#171717] hover:bg-slate-100 focus:outline-none md:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSidebarCollapsed(prev => !prev)}
              className="hidden md:block p-1.5 rounded-md text-[#6B6B6B] hover:text-[#171717] hover:bg-slate-100 focus:outline-none cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Search Bar */}
            <div className="relative w-full max-w-md hidden sm:block">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#6B6B6B]" />
              <input
                type="text"
                placeholder="Search properties, locations, owners..."
                className="w-full pl-9 pr-4 py-2 border border-[#E8E8E8] rounded-full text-xs bg-white text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#C4005A]/10 focus:border-[#C4005A] transition-colors"
              />
            </div>
          </div>

          {/* Right Side: Notification, Help, Profile */}
          <div className="flex items-center space-x-3">
            {isApiLoading && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-[#FFF1F6] text-[#C4005A] border border-[#C4005A]/20 rounded-full text-xs font-semibold animate-fade-in shadow-2xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0 text-[#C4005A]" />
                <span className="truncate max-w-[140px]">{apiLoadingMessage || 'Syncing...'}</span>
              </div>
            )}
            <button className="p-1.5 rounded-full text-[#6B6B6B] hover:text-[#C4005A] hover:bg-[#FFF1F6] transition-colors cursor-pointer">
              <Bell className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-full text-[#6B6B6B] hover:text-[#C4005A] hover:bg-[#FFF1F6] transition-colors cursor-pointer">
              <HelpCircle className="w-4 h-4" />
            </button>
            
            {/* Profile Avatar */}
            <div className="flex items-center space-x-2 border-l border-[#EAEAEA] pl-4">
              <div className="w-8 h-8 rounded-full bg-[#FFF1F6] flex items-center justify-center border border-[#E8E8E8] text-[#C4005A] font-semibold text-xs select-none">
                {user?.fullName 
                  ? user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
                  : (user?.username ? user.username.substring(0, 2).toUpperCase() : 'AD')
                }
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-[12px] font-semibold text-[#171717] leading-none">
                  {user?.fullName || user?.username || 'Staff Member'}
                </p>
                <p className="text-[10px] text-[#6B6B6B] mt-0.5">{user?.role || 'Staff'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Mobile Sidebar Drawer */}
        {isMobileOpen && (
          <div className="relative z-50 md:hidden">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-xs" 
              onClick={() => setIsMobileOpen(false)}
            />
            {/* Drawer */}
            <div className="fixed inset-y-0 left-0 w-[260px] bg-white shadow-xl flex flex-col border-r border-[#E8E8E8]">
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-[#171717] hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent />
            </div>
          </div>
        )}

        {/* Page Content Panel */}
        <main className="flex-grow p-6 md:p-8 max-w-7xl w-full mx-auto animate-fade-in text-[#111111]">
          {children}
        </main>
      </div>
    </div>
  );
}
