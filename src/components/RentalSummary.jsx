import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { RentalContext } from '../context/RentalContext';
import { rentalSummary } from '../utils/rentalView';

export default function RentalSummary() {
  const rentals = useContext(RentalContext);
  if (!rentals?.canManage) return null;
  return <section aria-label="Rental overview" className="space-y-3">
    <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Rental overview</h2><Link to="/rentals" className="text-sm font-semibold text-[#C4005A]">View agreements</Link></div>
    {rentals.error ? <div role="alert" className="rounded-xl border bg-white p-4 text-sm text-red-700">Rental overview unavailable. <button onClick={rentals.refresh} disabled={rentals.syncing} className="underline">Retry</button></div> : <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{rentalSummary(rentals.agreements, rentals.today).map(stat => <div key={stat.label} className="rounded-xl border border-[#E8E8E8] bg-white p-4"><p className="text-xs text-slate-600">{stat.label}</p><p className="mt-2 text-2xl font-bold text-[#C4005A]">{rentals.loading ? '…' : stat.value}</p></div>)}</div>}
  </section>;
}
