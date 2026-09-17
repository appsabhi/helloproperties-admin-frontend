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
    { label: 'Sold Properties', value: soldProps, icon: ShoppingBag, color: 'text-[#6B6B6B] bg-slate-100' },
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

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-slate-300/80 transition-all duration-200 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</span>
              <p className="text-[28px] font-bold text-slate-900 leading-none tracking-tight">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-xl ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
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
                className="group bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#C4005A]/30 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between"
              >
                <div className="p-4 flex items-start space-x-3.5">
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200 relative">
                    <img 
                      src={prop.imageUrl} 
                      alt={prop.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
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
                      <span className="text-2xs text-slate-400 font-medium">
                        Area: {prop.area || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#C4005A] group-hover:bg-[#FFF1F6] transition-colors">
                  <span>Click to view full details</span>
                  <Eye className="w-3.5 h-3.5 text-[#C4005A]" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Property Details Popup Modal */}
      {selectedProperty && (
        <Modal
          isOpen={!!selectedProperty}
          onClose={() => setSelectedProperty(null)}
          title={selectedProperty.title}
          subtitle={`${selectedProperty.listingType || 'Sale'} • ${selectedProperty.location ? `${selectedProperty.location}, ` : ''}${selectedProperty.district} District`}
          icon={Building2}
          size="lg"
          footer={
            <button
              onClick={() => setSelectedProperty(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          }
        >
          <div className="space-y-4 text-xs text-slate-700">
            {/* Image Preview */}
            {selectedProperty.imageUrl && (
              <div className="w-full h-56 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
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

            {/* Key Property Attributes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="text-3xs font-semibold text-slate-400 uppercase block">Price / Rent</span>
                <span className="font-bold text-slate-900 text-sm">
                  {selectedProperty.listingType === 'Rent'
                    ? `${formatPrice(selectedProperty.monthlyRent)}/mo`
                    : formatPrice(selectedProperty.expectedPrice)}
                </span>
              </div>
              <div>
                <span className="text-3xs font-semibold text-slate-400 uppercase block">Status</span>
                <span className="mt-0.5 block">{getStatusBadge(selectedProperty.status)}</span>
              </div>
              <div>
                <span className="text-3xs font-semibold text-slate-400 uppercase block">Area</span>
                <span className="font-bold text-slate-800 text-xs">{selectedProperty.area || 'N/A'}</span>
              </div>
              {selectedProperty.bedrooms && (
                <div>
                  <span className="text-3xs font-semibold text-slate-400 uppercase block">Bedrooms</span>
                  <span className="font-bold text-slate-800 text-xs">{selectedProperty.bedrooms} BHK</span>
                </div>
              )}
              {selectedProperty.bathrooms && (
                <div>
                  <span className="text-3xs font-semibold text-slate-400 uppercase block">Bathrooms</span>
                  <span className="font-bold text-slate-800 text-xs">{selectedProperty.bathrooms}</span>
                </div>
              )}
              {selectedProperty.category && (
                <div>
                  <span className="text-3xs font-semibold text-slate-400 uppercase block">Category</span>
                  <span className="font-bold text-slate-800 text-xs">{selectedProperty.category}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {selectedProperty.description && (
              <div className="space-y-1">
                <span className="text-3xs font-semibold text-slate-400 uppercase">Description</span>
                <p className="text-slate-600 leading-relaxed font-medium bg-white p-3 rounded-lg border border-slate-100">
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

