import React from 'react';
import ActivityLogView from '../components/ActivityLogView';
import { Activity } from 'lucide-react';

export default function Activities() {
  return (
    <div className="space-y-6 font-sans text-[#171717]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-6 h-6 text-[#C4005A]" />
            <h2 className="text-[28px] font-bold text-[#171717] tracking-tight">User Activity Monitoring</h2>
          </div>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Audit trail of when actions occurred, who performed them, and which items were modified.
          </p>
        </div>
      </div>

      {/* Main Activity Monitor View */}
      <ActivityLogView />
    </div>
  );
}
