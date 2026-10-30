import React, { useState } from 'react';
import { useEmr } from '../../context/EmrContext';
import { getStatusBadgeStyle, getPriorityBadgeStyle } from '../../lib/statusStyles';
import {
  FlaskConical,
  Search,
  Filter,
  ChevronDown,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';

export const LabsView: React.FC = () => {
  const { encounters, patients } = useEmr();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract all lab orders from all encounters
  const allLabOrders = encounters.flatMap((e) =>
    e.labOrders.map((lab) => {
      const patient = patients.find((p) => p.id === lab.patientId);
      return {
        ...lab,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient',
        patientMrn: patient?.mrn || 'N/A',
        doctorName: e.doctorName,
        encounterNumber: e.encounterNumber,
      };
    })
  );

  const filteredOrders = allLabOrders.filter((order) => {
    const matchesFilter = filterCategory === 'all' || order.category === filterCategory;
    const matchesSearch =
      order.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.investigationNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.patientName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Laboratory & Diagnostic Investigations
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Pathology tests, investigation numbers, priority queues, and result findings
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#EAF7EE] text-[#006837] border border-[#c4e9cf] tabular-nums shadow-2xs">
            Total Orders: {allLabOrders.length}
          </span>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by investigation number, test name, or patient name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006837] focus:border-[#006837] transition-all shadow-2xs"
          />
        </div>

        {/* Styled Native Category Filter */}
        <div className="relative self-start md:self-auto shrink-0 w-full md:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-600">
            <Filter className="w-4 h-4" />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full md:w-auto appearance-none pl-9 pr-9 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#006837] focus:border-[#006837] shadow-2xs cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <option value="all">All Pathology Categories</option>
            <option value="Hematology">Hematology</option>
            <option value="Chemical Pathology">Chemical Pathology</option>
            <option value="Microbiology">Microbiology</option>
            <option value="Radiology">Radiology</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-600">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl bg-white shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-[#EAF7EE] text-[#006837] border border-[#c4e9cf] flex items-center justify-center mx-auto mb-3">
            <FlaskConical className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No laboratory orders found</h3>
          <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
            No diagnostic investigation orders match your search criteria or category filter.
          </p>
          {(searchQuery || filterCategory !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterCategory('all');
              }}
              className="mt-4 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#006837] bg-[#EAF7EE] border border-[#c4e9cf] hover:bg-[#d8f0e0] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006837]"
            >
              Clear search & filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Desktop Semantic Table (>= 1024px) */}
          <div className="hidden lg:block overflow-x-auto rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <th scope="col" className="py-3 px-5">Investigation No.</th>
                  <th scope="col" className="py-3 px-5">Test Name & Category</th>
                  <th scope="col" className="py-3 px-5">Patient / MRN</th>
                  <th scope="col" className="py-3 px-5">Requesting Physician</th>
                  <th scope="col" className="py-3 px-5">Priority</th>
                  <th scope="col" className="py-3 px-5">Status</th>
                  <th scope="col" className="py-3 px-5 text-right">Fee (₦)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredOrders.map((lab) => (
                  <tr key={lab.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Investigation Number */}
                    <td className="py-3.5 px-5 font-mono font-semibold text-[#006837] whitespace-nowrap">
                      {lab.investigationNo}
                    </td>

                    {/* Test Name (Wraps, never truncated) & Category */}
                    <td className="py-3.5 px-5 max-w-xs">
                      <div className="font-bold text-slate-900 break-words leading-relaxed">
                        {lab.testName}
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5 font-medium">
                        {lab.category}
                      </div>
                    </td>

                    {/* Patient & MRN */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">
                        {lab.patientName}
                      </div>
                      <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                        {lab.patientMrn}
                      </div>
                    </td>

                    {/* Requesting Physician */}
                    <td className="py-3.5 px-5 text-slate-700 font-medium whitespace-nowrap">
                      {lab.doctorName}
                    </td>

                    {/* Priority (Distinct rounded-full pill with icon & text label) */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] border ${getPriorityBadgeStyle(
                          lab.priority
                        )}`}
                      >
                        {lab.priority === 'STAT' && (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        )}
                        {lab.priority === 'Urgent' && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        )}
                        <span className="font-semibold">{lab.priority}</span>
                      </span>
                    </td>

                    {/* Status (Standard rounded-md badge with dot) */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${getStatusBadgeStyle(
                          lab.status
                        )}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                        <span>{lab.status}</span>
                      </span>
                    </td>

                    {/* Fee Column */}
                    <td className="py-3.5 px-5 text-right font-bold text-slate-900 tabular-nums whitespace-nowrap">
                      ₦{lab.cost.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Collapsed Cards (< 1024px) */}
          <div className="block lg:hidden space-y-3">
            {filteredOrders.map((lab) => (
              <div
                key={lab.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3"
              >
                {/* Row 1: Investigation No & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-semibold text-[#006837]">
                      {lab.investigationNo}
                    </span>
                    <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                      {lab.category}
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${getStatusBadgeStyle(
                      lab.status
                    )}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                    <span>{lab.status}</span>
                  </span>
                </div>

                {/* Row 2: Test Name (Full wrap, never truncated) */}
                <div>
                  <div className="font-bold text-slate-900 text-sm break-words leading-relaxed">
                    {lab.testName}
                  </div>
                </div>

                {/* Row 3: Patient & Physician Details */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-600 font-medium">Patient:</span>
                    <span className="font-semibold text-slate-900">
                      {lab.patientName}{' '}
                      <span className="font-mono text-slate-600 font-normal">({lab.patientMrn})</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-600 font-medium">Physician:</span>
                    <span className="font-medium text-slate-900">{lab.doctorName}</span>
                  </div>
                </div>

                {/* Row 4: Priority & Fee Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 min-h-[44px]">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border ${getPriorityBadgeStyle(
                      lab.priority
                    )}`}
                  >
                    {lab.priority === 'STAT' && (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    )}
                    {lab.priority === 'Urgent' && (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    )}
                    <span className="font-semibold">{lab.priority} Priority</span>
                  </span>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-600 uppercase font-semibold block">Fee</span>
                    <span className="font-bold text-slate-900 tabular-nums text-sm">
                      ₦{lab.cost.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
