import React, { useState } from 'react';
import { useEmr } from '../../context/EmrContext';
import {
  ShieldCheck,
  Users,
  BarChart3,
  FileText,
  Lock,
  CheckCircle2,
  XCircle,
  Building,
  KeyRound,
} from 'lucide-react';
import { getStatusBadgeStyle } from '../../lib/statusStyles';
import { staffDisplayName } from '../../lib/staff';
import { ROLES } from '../../types/roles';
import { AddStaff } from './AddStaff';

/**
 * Local currency formatter for Nigerian Naira.
 * Formats numbers as ₦x,xxx with thousands separators.
 * Stored context values remain strictly numeric.
 */
const formatNaira = (amount: number): string => {
  return `₦${amount.toLocaleString()}`;
};

/**
 * Display-only helper to convert raw database audit action enums into human-readable labels.
 * Stored values remain untouched.
 */
const formatActionLabel = (action: string): string => {
  const actionMap: Record<string, string> = {
    USER_LOGIN: 'User Login',
    PATIENT_CHECK_IN: 'Patient Check-In',
    VITALS_RECORDED: 'Vitals Recorded',
    CLINICAL_NOTE_SAVED: 'Clinical Note Saved',
    LAB_INVESTIGATION_ORDERED: 'Lab Ordered',
    PRESCRIPTION_ISSUED: 'Prescription Issued',
    INVOICE_GENERATED: 'Invoice Generated',
    PAYMENT_SETTLED: 'Payment Settled',
    REFUND_PROCESSED: 'Refund Processed',
    AUTH_REVOKED: 'Auth Revoked',
  };
  if (actionMap[action]) return actionMap[action];
  return action
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

export const AdminReportsView: React.FC = () => {
  const { facility, auditLogs, invoices, encounters, patients, staffList } = useEmr();
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'staff' | 'audit' | 'reports'>('matrix');

  // Seed calculation preserved exactly from original specification
  const totalPaidRevenue = invoices.reduce((acc, i) => acc + i.paidAmount, 0);

  // Policy Matrix from PDF page 1 - wording preserved exactly
  const rbacMatrix = [
    {
      role: ROLES.Admin,
      canDo: 'Manage facility, staff, user accounts, system configuration, roles, daily reports',
      cannotDo: 'Edit clinical notes (Locked by policy)',
      bg: 'bg-rose-50/50',
    },
    {
      role: ROLES.SuperAdmin,
      canDo: 'Open the administrative workspace; exact capabilities are determined by backend authorization.',
      cannotDo: 'No additional frontend-only permission rules are defined for this role.',
      bg: 'bg-violet-50/50',
    },
    {
      role: ROLES.Receptionist,
      canDo: 'Register patients, generate MRN, book appointments, check-in arrivals',
      cannotDo: 'View clinical notes & diagnoses',
      bg: 'bg-amber-50/50',
    },
    {
      role: ROLES.Doctor,
      canDo: 'View medical history, write SOAP notes, diagnose (ICD-10), prescribe drugs, order lab investigations',
      cannotDo: 'Take payments or settle invoices',
      bg: 'bg-emerald-50/50',
    },
    {
      role: ROLES.Nurse,
      canDo: 'Record triage vitals, monitor waiting queue, write nurse intake observations',
      cannotDo: 'Prescribe medications or close clinical encounters',
      bg: 'bg-cyan-50/50',
    },
    {
      role: ROLES.Cashier,
      canDo: 'Create invoices, take payments (Cash, POS, Paystack, HMO), issue receipts, request refunds',
      cannotDo: 'View confidential clinical notes',
      bg: 'bg-purple-50/50',
    },
    {
      role: ROLES.Patient,
      canDo: 'View own health records, lab results, prescriptions, and official receipts',
      cannotDo: 'Access any other patient data (Strict tenant & subject isolation)',
      bg: 'bg-blue-50/50',
    },
  ];

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Hospital Administration & Governance Console
          </h1>
          <p className="text-xs text-slate-600">
            Multi-tenant facility parameters, RBAC authorization matrix, staff roster, and audit trails
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
            Facility: {facility.code}
          </span>
        </div>
      </div>

      {/* Sub Tabs */}
      <div
        role="tablist"
        aria-label="Administration Sub-Navigation"
        className="flex items-center gap-2 border-b border-slate-200 pb-2 flex-wrap"
      >
        <button
          type="button"
          role="tab"
          id="tab-matrix"
          aria-selected={activeSubTab === 'matrix'}
          aria-controls="panel-matrix"
          onClick={() => setActiveSubTab('matrix')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
            activeSubTab === 'matrix'
              ? 'bg-[#006837] text-white shadow-sm'
              : 'text-slate-700 hover:bg-slate-100'
          } focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006837]`}
        >
          RBAC Roles & Permissions Matrix
        </button>
        <button
          type="button"
          role="tab"
          id="tab-staff"
          aria-selected={activeSubTab === 'staff'}
          aria-controls="panel-staff"
          onClick={() => setActiveSubTab('staff')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
            activeSubTab === 'staff'
              ? 'bg-[#006837] text-white shadow-sm'
              : 'text-slate-700 hover:bg-slate-100'
          } focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006837]`}
        >
          Staff Directory ({staffList.length})
        </button>
        <button
          type="button"
          role="tab"
          id="tab-audit"
          aria-selected={activeSubTab === 'audit'}
          aria-controls="panel-audit"
          onClick={() => setActiveSubTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
            activeSubTab === 'audit'
              ? 'bg-[#006837] text-white shadow-sm'
              : 'text-slate-700 hover:bg-slate-100'
          } focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006837]`}
        >
          Immutable Audit Trail ({auditLogs.length})
        </button>
        <button
          type="button"
          role="tab"
          id="tab-reports"
          aria-selected={activeSubTab === 'reports'}
          aria-controls="panel-reports"
          onClick={() => setActiveSubTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
            activeSubTab === 'reports'
              ? 'bg-[#006837] text-white shadow-sm'
              : 'text-slate-700 hover:bg-slate-100'
          } focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006837]`}
        >
          Daily Executive Reports
        </button>
      </div>

      {/* Tab 1: RBAC Roles and Permissions Matrix */}
      {activeSubTab === 'matrix' && (
        <div
          role="tabpanel"
          id="panel-matrix"
          aria-labelledby="tab-matrix"
          className="space-y-4"
        >
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 text-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <div className="font-bold text-sm text-slate-900">Policy-Based Authorization Specification</div>
              <p className="text-xs text-slate-600 mt-0.5">
                Enforced by ASP.NET Core Web API policies and synced with the React UI navigation guards.
              </p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 border border-slate-300 px-3 py-1 rounded-full font-semibold self-start sm:self-auto flex-shrink-0">
              NDPA / HIPAA Compliant
            </span>
          </div>

          {/* Desktop Table (lg+) */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th scope="col" className="py-3 px-4 w-36">Role</th>
                  <th scope="col" className="py-3 px-4">Can Do (Authorized Capabilities)</th>
                  <th scope="col" className="py-3 px-4">Cannot Do (Policy Enforced Restrictions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rbacMatrix.map((r) => (
                  <tr key={r.role} className="bg-white hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-sm align-top">
                      {r.role}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium align-top leading-relaxed">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="sr-only">Authorized: </span>
                          <span>{r.canDo}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium align-top leading-relaxed">
                      <div className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="sr-only">Restriction: </span>
                          <span>{r.cannotDo}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile / Tablet Collapsed Cards (< lg) */}
          <div className="block lg:hidden space-y-3">
            {rbacMatrix.map((r) => (
              <div
                key={r.role}
                className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3 min-h-[44px]"
              >
                <div className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
                  {r.role}
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-2 text-slate-800 font-medium leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="sr-only">Authorized: </span>
                      <span>{r.canDo}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-slate-700 font-medium leading-relaxed pt-2 border-t border-slate-100/80">
                    <XCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="sr-only">Restriction: </span>
                      <span>{r.cannotDo}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Staff Directory */}
      {activeSubTab === 'staff' && (
        <div
          role="tabpanel"
          id="panel-staff"
          aria-labelledby="tab-staff"
          className="space-y-4"
        >
          <AddStaff />
          {staffList.length === 0 ? (
            <div className="p-12 text-center bg-white border border-dashed border-slate-200 rounded-2xl space-y-2">
              <Users className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No staff members found</h3>
              <p className="text-xs text-slate-500">The facility staff directory is currently empty.</p>
            </div>
          ) : (
            <>
              {/* Desktop Semantic Table (lg+) */}
              <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th scope="col" className="py-3 px-4 w-28">Staff ID</th>
                      <th scope="col" className="py-3 px-4">Full Name</th>
                      <th scope="col" className="py-3 px-4">Role</th>
                      <th scope="col" className="py-3 px-4">Department</th>
                      <th scope="col" className="py-3 px-4">Contact Details</th>
                      <th scope="col" className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {staffList.map((staff) => (
                      <tr key={staff.id ?? staff.staffId ?? staff.email ?? staffDisplayName(staff)} className="bg-white hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-600">
                          {staff.id ?? staff.staffId ?? '—'}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                          {staffDisplayName(staff)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {staff.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {staff.department}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 leading-snug break-words">
                          <div>{staff.email}</div>
                          <div className="tabular-nums text-slate-500 mt-0.5">{staff.phoneNumber}</div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeStyle(
                              staff.isEnabled ? 'Active' : 'Inactive'
                            )}`}
                          >
                            {staff.isEnabled ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile / Tablet Cards (< lg) */}
              <div className="block lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                {staffList.map((staff) => (
                  <div
                    key={staff.id ?? staff.staffId ?? staff.email ?? staffDisplayName(staff)}
                    className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3 min-h-[44px]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {staff.role}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeStyle(
                          staff.isEnabled ? 'Active' : 'Inactive'
                        )}`}
                      >
                        {staff.isEnabled ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{staffDisplayName(staff)}</div>
                      <div className="text-xs text-slate-600 mt-0.5">{staff.department}</div>
                    </div>
                    <div className="text-xs text-slate-600 pt-2 border-t border-slate-100 space-y-1">
                      <div className="break-words">
                        <span className="text-slate-500">Email:</span> {staff.email}
                      </div>
                      <div className="break-words tabular-nums">
                        <span className="text-slate-500">Phone:</span> {staff.phoneNumber}
                      </div>
                      <div>
                        <span className="text-slate-500">ID:</span>{' '}
                        <span className="font-mono text-slate-600 font-medium">{staff.id ?? staff.staffId ?? '—'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 3: Immutable Audit Trail */}
      {activeSubTab === 'audit' && (
        <div
          role="tabpanel"
          id="panel-audit"
          aria-labelledby="tab-audit"
          className="space-y-4"
        >
          {auditLogs.length === 0 ? (
            <div className="p-12 text-center bg-white border border-dashed border-slate-200 rounded-2xl space-y-2">
              <FileText className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No audit logs recorded</h3>
              <p className="text-xs text-slate-500">The audit ledger is currently empty.</p>
            </div>
          ) : (
            <>
              {/* Desktop Semantic Table (lg+) */}
              <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Cryptographic Audit Stream (Who, What, When, Record ID)
                  </span>
                  <span className="text-xs bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded font-semibold self-start sm:self-auto">
                    PostgreSQL Interceptor Sync
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                      <tr>
                        <th scope="col" className="py-2.5 px-3 w-40">Timestamp</th>
                        <th scope="col" className="py-2.5 px-3 w-48">Actor & Role</th>
                        <th scope="col" className="py-2.5 px-3 w-36">Action Type</th>
                        <th scope="col" className="py-2.5 px-3 w-44">Target Record</th>
                        <th scope="col" className="py-2.5 px-3">Operation Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {auditLogs.map((log) => {
                        const dateObj = new Date(log.timestamp);
                        const formattedTime = dateObj.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        });
                        const formattedDate = dateObj.toLocaleDateString();

                        return (
                          <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3 text-slate-600 tabular-nums whitespace-nowrap">
                              <div>{formattedDate}</div>
                              <div className="text-[11px] text-slate-500">{formattedTime}</div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-900 font-bold whitespace-nowrap">
                              {log.userName}
                              {log.userRole && (
                                <span className="text-slate-500 font-normal"> ({log.userRole})</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs whitespace-nowrap">
                                {formatActionLabel(log.action)}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-800 whitespace-nowrap">
                              <span>{log.recordType}:</span>{' '}
                              <span className="font-mono text-slate-600 font-medium">{log.recordId}</span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 break-words leading-relaxed">
                              {log.details}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile / Tablet Collapsed Cards (< lg) */}
              <div className="block lg:hidden space-y-3">
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Cryptographic Audit Stream
                  </span>
                  <span className="text-[11px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-semibold">
                    PostgreSQL Interceptor Sync
                  </span>
                </div>

                {auditLogs.map((log) => {
                  const dateObj = new Date(log.timestamp);
                  const formattedTime = dateObj.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });
                  const formattedDate = dateObj.toLocaleDateString();

                  return (
                    <div
                      key={log.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2.5 min-h-[44px]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900 text-xs">
                            {log.userName}
                            {log.userRole && (
                              <span className="text-slate-500 font-normal"> ({log.userRole})</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                            {formattedDate} • {formattedTime}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-[11px] flex-shrink-0">
                          {formatActionLabel(log.action)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-800 pt-1.5 border-t border-slate-100">
                        <span className="text-slate-500">Target:</span> {log.recordType}:{' '}
                        <span className="font-mono text-slate-600 font-medium">{log.recordId}</span>
                      </div>
                      <div className="text-xs text-slate-700 break-words leading-relaxed">
                        {log.details}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 4: Daily Reports */}
      {activeSubTab === 'reports' && (
        <div
          role="tabpanel"
          id="panel-reports"
          aria-labelledby="tab-reports"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#006837]" />
              <span>Clinical Throughput Summary</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Total Registered Patients:</span>
                <strong className="text-slate-900 tabular-nums">{patients.length} active</strong>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Total Clinical Encounters:</span>
                <strong className="text-slate-900 tabular-nums">{encounters.length} visits</strong>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Average Nurse Triage Wait:</span>
                <strong className="text-slate-900 tabular-nums">12.4 minutes</strong>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-600">Encounter Chart Closure Rate:</span>
                <strong className="text-emerald-700 font-bold tabular-nums">92% Compliance</strong>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#006837]" />
              <span>Financial Revenue Summary</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Gross Invoiced Charges:</span>
                <strong className="text-slate-900 tabular-nums font-bold">
                  {formatNaira(invoices.reduce((a, b) => a + b.subtotal, 0))}
                </strong>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">HMO Insurance Receivables:</span>
                <strong className="text-slate-900 tabular-nums font-bold">
                  {formatNaira(invoices.reduce((a, b) => a + b.hmoCoveredAmount, 0))}
                </strong>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">Total Collections Disbursed:</span>
                <strong className="text-emerald-700 font-bold tabular-nums">
                  {formatNaira(totalPaidRevenue)}
                </strong>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-600">Outstanding Patient Balances:</span>
                {invoices.reduce((a, b) => a + b.balance, 0) > 0 ? (
                  <strong className="text-rose-700 font-bold tabular-nums">
                    {formatNaira(invoices.reduce((a, b) => a + b.balance, 0))}
                  </strong>
                ) : (
                  <strong className="text-slate-800 font-bold tabular-nums">
                    {formatNaira(invoices.reduce((a, b) => a + b.balance, 0))}
                  </strong>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
