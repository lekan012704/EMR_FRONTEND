import type { ReactNode } from 'react';
import { Building2, ClipboardList, Users } from 'lucide-react';
import { useEmr } from '../../context/EmrContext';
import { staffDisplayName } from '../../lib/staff';
import { ROLES } from '../../types/roles';
import { AddStaff } from './AddStaff';

/** Platform-only view; it intentionally never reads patient or clinical data. */
export function SuperAdminDashboardView() {
  const { role, facilities, staffList, auditLogs } = useEmr();

  if (role !== ROLES.SuperAdmin) {
    return (
      <section
        className="mx-auto mt-12 max-w-xl rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm"
        role="alert"
      >
        <h1 className="text-lg font-bold text-slate-900">Access restricted</h1>
        <p className="mt-2 text-sm text-slate-600">
          This platform administration dashboard is only available to SuperAdmin accounts.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 pb-10" aria-labelledby="superadmin-title">
      <header className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">
          Platform administration
        </p>
        <h1 id="superadmin-title" className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
          SuperAdmin dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Manage facility and staff access and review the audit trail. Patient records,
          encounters, and billing data remain restricted to their assigned clinical roles.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Facilities" value={facilities.length} icon={<Building2 aria-hidden="true" />} />
        <SummaryCard label="Staff accounts" value={staffList.length} icon={<Users aria-hidden="true" />} />
        <SummaryCard label="Audit events" value={auditLogs.length} icon={<ClipboardList aria-hidden="true" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="platform-facilities">
          <h2 id="platform-facilities" className="text-base font-bold text-slate-900">Facilities</h2>
          {facilities.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No facilities are available.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {facilities.map((facility) => (
                <li key={facility.id} className="flex items-center justify-between gap-4 py-3">
                  <span className="font-semibold text-slate-800">{facility.name}</span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-900">
                    {facility.code}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="platform-staff">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 id="platform-staff" className="text-base font-bold text-slate-900">Staff directory</h2>
            <AddStaff />
          </div>
          {staffList.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No staff accounts are available.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {staffList.slice(0, 8).map((staff) => (
                <li key={staff.id ?? staff.email} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800">{staffDisplayName(staff)}</p>
                    <p className="truncate text-xs text-slate-500">{staff.email}</p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-slate-600">{staff.role}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2" aria-labelledby="platform-audits">
          <h2 id="platform-audits" className="text-base font-bold text-slate-900">Recent audit activity</h2>
          {auditLogs.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No audit events are available.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {auditLogs.slice(0, 8).map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-semibold text-slate-800">{entry.action}</p>
                    <p className="text-xs text-slate-500">By {entry.userName}</p>
                  </div>
                  <time className="text-xs text-slate-500" dateTime={entry.timestamp}>
                    {new Date(entry.timestamp).toLocaleString()}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <article className="flex min-h-28 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-800">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums text-slate-950">{value}</p>
        <p className="text-sm text-slate-600">{label}</p>
      </div>
    </article>
  );
}
