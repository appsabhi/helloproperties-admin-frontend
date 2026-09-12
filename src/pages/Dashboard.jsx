import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { PropertyContext } from '../context/PropertyContext';
import { 
  Building2, 
  CheckCircle2, 
  ShoppingBag, 
  Users, 
  ArrowRight
} from 'lucide-react';

export default function Dashboard() {
  const { properties, requirements } = useContext(PropertyContext);

  const totalProps = properties.length;
  const availableProps = properties.filter(p => p.status === 'Available').length;
  const soldProps = properties.filter(p => p.status === 'Sold').length;
  const totalReqs = requirements.length;

  // Get 4 most recent properties
  const recentProperties = [...properties]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

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

      {/* Recent Properties Grid / Table */}
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3.5 text-[14px] font-medium text-slate-500 uppercase tracking-wider">Property Details</th>
                  <th className="px-6 py-3.5 text-[14px] font-medium text-slate-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3.5 text-[14px] font-medium text-slate-500 uppercase tracking-wider">Price / Rent</th>
                  <th className="px-6 py-3.5 text-[14px] font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-[14px] font-medium text-slate-500 uppercase tracking-wider">Date Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[14px] font-medium text-slate-700">
                {recentProperties.map((prop) => (
                  <tr key={prop.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200">
                          <img 
                            src={prop.imageUrl} 
                            alt={prop.title} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80';
                            }}
                          />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-slate-900">{prop.title}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              prop.listingType === 'Rent' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {prop.listingType || 'Sale'}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 block">Area: {prop.area || '—'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="block text-slate-800">{prop.location}</span>
                      <span className="text-xs text-slate-400">{prop.district} District</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {prop.listingType === 'Rent'
                        ? `${formatPrice(prop.monthlyRent)}/mo`
                        : formatPrice(prop.expectedPrice)}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(prop.status)}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(prop.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
