import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { PropertyContext } from '../context/PropertyContext';
import { AuthContext } from '../context/AuthContext';
import ActivityLogView from '../components/ActivityLogView';
import Modal from '../components/Modal';
import { 
  Building2, 
  CheckCircle2, 
  ShoppingBag, 
  Users, 
  ArrowRight,
  Eye,
  MapPin
} from 'lucide-react';

export default function Dashboard() {
  const { properties, requirements } = useContext(PropertyContext);
  const { user } = useContext(AuthContext);

  const [selectedProperty, setSelectedProperty] = useState(null);

  const totalProps = properties.length;
  const availableProps = properties.filter(p => p.status === 'Available').length;
  const soldProps = properties.filter(p => p.status === 'Sold').length;
  const totalReqs = requirements.length;

  // Get 2 most recent properties
  const recentProperties = [...properties]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 2);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Available
          </span>
        );
      case 'Under Negotiation':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Negotiation
          </span>
        );
      case 'Sold':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Sold
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            Inactive
          </span>
        );
    }
  };

  const stats = [
    { label: 'Total Properties', value: totalProps, icon: Building2, color: 'text-[#6B6B6B] bg-slate-100' },
    { label: 'Available Properties', value: availableProps, icon: CheckCircle2, color: 'text-[#C4005A] bg-[#FFF1F6]' },
    { label: 'Buy Requirements', value: totalReqs, icon: Users, color: 'text-[#C4005A] bg-[#FFF1F6]' },
  ];

  return (
    <div className="space-y-8 font-sans text-[#171717]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-[32px] font-bold text-[#171717] tracking-tight leading-tight">Dashboard</h2>
          <p className="text-sm text-[#6B6B6B]">Welcome back. Here's an overview of HelloProperties.</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/properties"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold bg-[#C4005A] hover:bg-[#B0004F] text-white rounded-lg shadow-sm transition-all duration-150 cursor-pointer"
          >
            Property Listings
          </Link>
          <Link
            to="/properties/requirements"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold bg-white text-[#171717] hover:bg-[#F7F7F7] border border-[#E8E8E8] rounded-lg shadow-sm transition-all duration-150 cursor-pointer"
          >
            Buyer Requirements
          </Link>
        </div>
      </div>

      {/* Recent Properties Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-[20px] font-bold text-[#171717]">Recent Properties</h3>
            <p className="text-xs text-[#6B6B6B]">Recently added property listings.</p>
          </div>
          <Link 
            to="/properties" 
            className="text-xs font-semibold text-[#C4005A] hover:text-[#B0004F] flex items-center space-x-1 transition-colors duration-150"
          >
            <span>View all properties</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentProperties.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No properties found. Try adding a new property listing.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6">
            {recentProperties.map((prop) => (
              <div 
                key={prop.id}
                onClick={() => setSelectedProperty(prop)}
                className="group bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-[#C4005A]/40 transition-all duration-200 cursor-pointer flex items-center space-x-4"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200 relative">
                  <img 
                    src={prop.imageUrl} 
                    alt={prop.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      prop.listingType === 'Rent' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {prop.listingType || 'Sale'}
                    </span>
                    {getStatusBadge(prop.status)}
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-[#C4005A] transition-colors">
                    {prop.title}
                  </h4>

                  <div className="flex items-center space-x-1 text-xs text-slate-500 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{prop.location ? `${prop.location}, ${prop.district}` : prop.district || 'Location N/A'}</span>
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-sm">
                      {prop.listingType === 'Rent'
                        ? `${formatPrice(prop.monthlyRent)}/mo`
                        : formatPrice(prop.expectedPrice)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProperty(prop);
                      }}
                      className="inline-flex items-center gap-1 text-2xs font-bold text-[#C4005A] hover:text-[#B0004F] bg-[#FFF1F6] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Property Details Popup Modal (Exact Popup matching Properties view) */}
      {selectedProperty && (
        <Modal
          isOpen={!!selectedProperty}
          onClose={() => setSelectedProperty(null)}
          title="Property Details"
          subtitle={`Viewing record ID: ${selectedProperty.id || 'N/A'}`}
          icon={Building2}
          badge={
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
              selectedProperty.listingType === 'Rent'
                ? 'bg-violet-50 text-violet-700 border border-violet-100'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            }`}>
              {selectedProperty.listingType === 'Rent' ? 'Rent' : 'Sale'}
            </span>
          }
          size="xl"
          footer={
            <div className="flex items-center justify-end space-x-2 w-full">
              <button
                onClick={() => setSelectedProperty(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          }
        >
          <div className="space-y-4 font-sans text-xs text-slate-700">
            {/* Media Container: Image or Video */}
            <div className="space-y-3">
              {selectedProperty.imageUrl && (
                <div className="h-48 sm:h-56 max-h-[30vh] w-full rounded-xl overflow-hidden bg-slate-100 relative shadow-inner">
                  <img 
                    src={selectedProperty.imageUrl} 
                    alt={selectedProperty.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                </div>
              )}

              {selectedProperty.videoUrl && (
                <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md">
                  {selectedProperty.videoUrl.includes('youtu') || selectedProperty.videoUrl.includes('embed') ? (
                    <iframe
                      src={selectedProperty.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                      title="Property Video"
                      className="w-full h-44 rounded-xl border-0"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={selectedProperty.videoUrl}
                      controls
                      className="w-full max-h-44 object-cover rounded-xl"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Title & Financials */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  {selectedProperty.title}
                </h3>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    {`${selectedProperty.location || ''}, ${selectedProperty.district || ''}${selectedProperty.state ? `, ${selectedProperty.state}` : ''}`}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 px-3.5 py-2 rounded-xl text-left sm:text-right shrink-0">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  {selectedProperty.listingType === 'Rent' ? 'Rent' : 'Price / Budget'}
                </span>
                <span className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight block">
                  {selectedProperty.listingType === 'Rent'
                    ? formatPrice(selectedProperty.monthlyRent)
                    : formatPrice(selectedProperty.expectedPrice)}
                </span>
              </div>
            </div>

            {/* Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Property Type</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">{selectedProperty.propertyType || '—'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Area / Size</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">{selectedProperty.area || '—'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Location / City</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">{selectedProperty.location || '—'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">District</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">{selectedProperty.district || '—'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">State</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">{selectedProperty.state || '—'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Registered Date</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">
                  {selectedProperty.createdAt 
                    ? new Date(selectedProperty.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'Recently'}
                </span>
              </div>
            </div>

            {/* Keywords Section */}
            {Array.isArray(selectedProperty.keywords) && selectedProperty.keywords.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">Property Keywords</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProperty.keywords.map((kw, kIdx) => (
                    <span key={kIdx} className="px-2.5 py-1 rounded-lg bg-rose-50 text-[#B0004F] border border-rose-100/80 text-xs font-semibold">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description & Remarks */}
            {selectedProperty.description && (
              <div className="space-y-1.5">
                <h4 className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">Description & Remarks</h4>
                <p className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-wrap">
                  {selectedProperty.description}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Recent User Activity Feed (Admin Only) */}
      {user?.role === 'Admin' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-[20px] font-bold text-[#171717]">User Activity Monitoring</h3>
              <p className="text-xs text-[#6B6B6B]">Live audit trail of user actions across the admin portal.</p>
            </div>
            <Link
              to="/activities"
              className="text-xs font-semibold text-[#C4005A] hover:text-[#B0004F] flex items-center space-x-1 transition-colors duration-150"
            >
              <span>View full activity log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <ActivityLogView compact limit={5} />
        </div>
      )}
    </div>
  );
}

