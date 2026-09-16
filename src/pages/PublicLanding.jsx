import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/HELLO PROPERTIES LOGO.png';
import { 
  Building2, 
  Search, 
  MapPin, 
  MessageCircle, 
  Phone, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  UserCheck,
  CheckCircle2,
  Lock
} from 'lucide-react';

export default function PublicLanding() {
  const navigate = useNavigate();
  const [searchId, setSearchId] = useState('');
  const [searchError, setSearchError] = useState(false);

  const handlePropertySearch = (e) => {
    e.preventDefault();
    const cleanedId = searchId.trim();
    if (!cleanedId) {
      setSearchError(true);
      return;
    }
    setSearchError(false);
    // Navigate to public property detail
    navigate(`/p/${encodeURIComponent(cleanedId)}`);
  };

  const handleWhatsAppContact = () => {
    const text = encodeURIComponent("Hello HelloProperties! 👋\n\nI am looking for property details or would like to request listings in Kerala. Please assist me. Thank you!");
    window.open(`https://web.whatsapp.com/send?phone=919605182753&text=${text}`, '_blank');
  };

  const districts = [
    { name: 'Kozhikode', count: 'Plots & Villas', desc: 'Engapuzha, Kodencherry, Kunnamangalam, Mukkam & City' },
    { name: 'Palakkad', count: 'Commercial & Land', desc: 'Kanjikode, Stadium Bye Pass, Ottapalam & Pattambi' },
    { name: 'Malappuram', count: 'Residential & Plots', desc: 'Manjeri, Perinthalmanna, Tirur & Kottakkal' },
    { name: 'Ernakulam', count: 'Commercial & Apartments', desc: 'Kakkanad, Edappally, Aluva & Kochi City' },
    { name: 'Thrissur', count: 'Villas & Agricultural', desc: 'Swaraj Round, Puzhakkal, Guruvayur & Chalakudy' },
    { name: 'Wayanad', count: 'Resorts & Estates', desc: 'Kalpetta, Sulthan Bathery & Vythiri' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased selection:bg-[#B0004F] selection:text-white flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <img 
              src={logo} 
              alt="HelloProperties Logo" 
              className="h-10 sm:h-12 w-auto object-contain transition-transform hover:scale-105" 
            />
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={handleWhatsAppContact}
              className="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span className="hidden sm:inline">WhatsApp Inquiry</span>
              <span className="sm:hidden">WhatsApp</span>
            </button>

            <button
              onClick={() => navigate('/login')}
              className="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl border border-slate-200/80 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-[#B0004F]" />
              <span className="hidden sm:inline">Staff Login</span>
              <span className="sm:hidden">Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white pt-12 sm:pt-20 pb-20 sm:pb-28 px-4 sm:px-6 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#B0004F]/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-emerald-400 text-xs font-semibold animate-fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kerala's Trusted Property Network</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Find Premier Properties &amp; Land Across <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-[#FF2A85] to-amber-300">Kerala</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
            Verified plots, residential land, villas, and commercial real estate with direct assistance from HelloProperties.
          </p>

          {/* PROPERTY ID SEARCH BOX */}
          <div className="max-w-xl mx-auto pt-4">
            <form onSubmit={handlePropertySearch} className="bg-white p-2 sm:p-2.5 rounded-2xl shadow-2xl border border-slate-200/50 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1 flex items-center">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Enter Property ID or Reference Code (e.g. 101)"
                  value={searchId}
                  onChange={(e) => {
                    setSearchId(e.target.value);
                    if (searchError) setSearchError(false);
                  }}
                  className="w-full pl-11 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none font-medium"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-[#B0004F] hover:bg-[#8A003E] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>View Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
            {searchError && (
              <p className="text-xs text-rose-400 font-semibold mt-2 text-left px-2">
                Please enter a property ID or reference code to view.
              </p>
            )}
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              Received a shared link? Enter the ID above to inspect full property details, location, and images.
            </p>
          </div>
        </div>
      </section>

      {/* HIGHLIGHTED DISTRICTS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-10 sm:-mt-14 relative z-10 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
          {districts.map((d, idx) => (
            <div 
              key={idx} 
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md hover:border-[#B0004F]/40 transition-all duration-200 group space-y-2 cursor-default"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-rose-50 text-[#B0004F] group-hover:bg-[#B0004F] group-hover:text-white transition-colors">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{d.name}</h3>
                </div>
                <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {d.count}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">{d.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHY HELLOPROPERTIES SECTION */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Why HelloProperties?</h2>
          <p className="text-xs sm:text-sm text-slate-500">We bridge buyers and sellers with verified data, transparent pricing, and instant communication.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Verified Listings</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every property is inspected and verified with accurate district, locality, area measurements, and price breakdowns.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#B0004F] flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Direct Assistance</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Connect directly with our team for site visits, legal documentation, negotiation, and seamless property transfers.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Instant Sharing</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Share property details instantly on WhatsApp with one click, complete with images, area specs, and location info.
            </p>
          </div>
        </div>
      </section>

      {/* WHATSAPP CTA BANNER */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-16 w-full">
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl sm:text-2xl font-extrabold">Looking for something specific?</h3>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-lg">
              Send us your requirement on WhatsApp (Location, Budget, Property Type &amp; Area) and our team will match it for you!
            </p>
          </div>
          <button
            onClick={handleWhatsAppContact}
            className="px-6 py-3.5 bg-white hover:bg-emerald-50 text-emerald-800 font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0 active:scale-95"
          >
            <MessageCircle className="w-5 h-5 text-emerald-600 fill-emerald-600" />
            <span>Chat on WhatsApp</span>
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-8 px-4 sm:px-6 font-sans">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <img src={logo} alt="HelloProperties" className="h-6 w-auto opacity-80" />
            <span>© {new Date().getFullYear()} HelloProperties. All rights reserved.</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/login')}
              className="text-slate-400 hover:text-[#B0004F] transition-colors font-medium flex items-center gap-1 cursor-pointer"
            >
              <Lock className="w-3 h-3" />
              <span>Staff &amp; Admin Portal</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
