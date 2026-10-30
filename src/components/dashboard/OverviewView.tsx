import React, { useState } from 'react';
import { useEmr } from '../../context/EmrContext';
import {
  Users,
  Calendar,
  Stethoscope,
  CreditCard,
  UserPlus,
  HeartPulse,
  FileText,
  FlaskConical,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  ArrowUpRight,
  MoreHorizontal,
  ChevronRight,
} from 'lucide-react';

export const OverviewView: React.FC = () => {
  const { setActiveTab, setSelectedEncounterId, appointments, encounters, patients, invoices } = useEmr();

  // Date selector showing current date dynamically
  const now = new Date();
  const selectedDate = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const [volumeTimeframe, setVolumeTimeframe] = useState<'This week' | 'Last week' | 'This month'>('This week');
  const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  startOfThisWeek.setDate(startOfThisWeek.getDate() - ((startOfThisWeek.getDay() + 6) % 7));
  const chartStart = volumeTimeframe === 'This month'
    ? new Date(now.getFullYear(), now.getMonth(), 1)
    : new Date(startOfThisWeek);
  if (volumeTimeframe === 'Last week') chartStart.setDate(chartStart.getDate() - 7);
  const chartEnd = volumeTimeframe === 'This month'
    ? new Date(now.getFullYear(), now.getMonth() + 1, 1)
    : new Date(chartStart.getFullYear(), chartStart.getMonth(), chartStart.getDate() + 7);
  const appointmentsByDay = dayNames.map((day) => ({ day, appointments: 0 }));
  appointments.forEach((apt) => {
    const appointmentDate = new Date(apt.dateTime);
    if (Number.isNaN(appointmentDate.getTime()) || appointmentDate < chartStart || appointmentDate >= chartEnd) return;
    appointmentsByDay[(appointmentDate.getDay() + 6) % 7].appointments += 1;
  });
  const volumeChartData = appointmentsByDay;
  const maxBarValue = Math.max(80, ...volumeChartData.map((item) => item.appointments));

  const todayAppointments = appointments
    .filter((appointment) => new Date(appointment.dateTime).toDateString() === now.toDateString())
    .map((appointment) => ({
      ...appointment,
      initials: appointment.patientName
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase(),
      patientCode: `${appointment.patientMrn} • ${appointment.reason}`,
      time: appointment.slotTime,
      status: appointment.status === 'In-Consultation' ? 'In consultation' : appointment.status,
    }));
  const currentEncounter = encounters.find((encounter) => encounter.status !== 'Closed');

  // Activity tiles derived from live encounter/invoice data
  const recentActivities = encounters.slice(-5).reverse().map((enc) => ({
    id: enc.id,
    title: `Encounter: ${enc.patientName}`,
    desc: `${enc.doctorName} - ${enc.status}`,
    time: 'Just now',
    icon: Stethoscope,
  }));

  // Semantic status badge styling mapping
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Checked-in':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'In consultation':
      case 'In-Consultation':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      case 'Scheduled':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'Completed':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-10">
      {/* 1. Page Title Header with Date Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Hospital overview
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            A clear picture of your hospital. A better day of care.
          </p>
        </div>

        {/* Date Selector Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer transition-colors self-start sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-slate-600" />
          <span className="font-mono tabular-nums">{selectedDate}</span>
          <ChevronDown className="w-3 h-3 text-slate-600 ml-1" />
        </div>
      </div>

      {/* 2. Slim Greeting Strip (No large photo, no emoji) */}
      <div className="rounded-2xl bg-[#EAF7EE] border border-[#c4e9cf] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase text-[#006837] bg-white/90 border border-[#c4e9cf]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#006837]" />
            <span>LET'S MAKE TODAY A HEALTHIER DAY</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Good morning, Dr. Sarah
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            Your team is ready. Let's give every patient the care they deserve.
          </p>
        </div>

        <div className="shrink-0">
          <button
            onClick={() => setActiveTab('appointments')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#006837] hover:bg-[#00522c] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <span>View today's schedule</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. 4 Key Stat Cards (Single Accent System) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Patients */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              Total patients
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#EAF7EE] text-[#006837] flex items-center justify-center">
              <Users className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight font-mono tabular-nums">
              {patients.length}
            </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-[#006837] tabular-nums">
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+12.8% vs. last month</span>
          </div>
        </div>

        {/* Card 2: Appointments Today */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              Appointments today
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#EAF7EE] text-[#006837] flex items-center justify-center">
              <Calendar className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight font-mono tabular-nums">
            {appointments.length}
          </div>
        </div>

        {/* Card 3: Active Encounters */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              Active encounters
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#EAF7EE] text-[#006837] flex items-center justify-center">
              <Stethoscope className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight font-mono tabular-nums">
                  {encounters.filter((e) => e.status !== 'Closed').length}
            </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-600 tabular-nums">
            <span className="w-1.5 h-1.5 rounded-full bg-[#006837]" />
            <span>{encounters.filter((e) => e.status === 'Checked-in' || e.status === 'Triage').length} patients awaiting consultation</span>
          </div>
        </div>

        {/* Card 4: Revenue Today */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              Revenue today
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#EAF7EE] text-[#006837] flex items-center justify-center">
              <CreditCard className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight font-mono tabular-nums">
            {invoices.reduce((acc, i) => acc + i.paidAmount, 0)}
          </div>
        </div>
      </div>

      {/* 4. Middle Section Grid (Left 8 cols / Right 4 cols on lg, stacked on md) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Patient Volume + Today's Appointments Table (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card A: Patient Volume Grouped Bar Chart */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Patient volume
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Patient visits throughout the week
                </p>
              </div>

              {/* Timeframe Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    const options: ('This week' | 'Last week' | 'This month')[] = ['This week', 'Last week', 'This month'];
                    const nextIndex = (options.indexOf(volumeTimeframe) + 1) % options.length;
                    setVolumeTimeframe(options[nextIndex]);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer transition-colors"
                >
                  <span>{volumeTimeframe}</span>
                  <ChevronDown className="w-3 h-3 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Grouped Bar Chart Container */}
            <div className="pt-6 pb-2">
              <div className="relative h-48 flex items-end justify-between gap-2 sm:gap-6 border-b border-slate-200 px-2 sm:px-6">
                {/* Horizontal Dashed Gridlines */}
                <div className="absolute inset-x-0 top-0 border-b border-dashed border-slate-200 flex items-center text-[10px] text-slate-600 font-mono tabular-nums">
                  <span className="absolute -left-6 sm:-left-7">80</span>
                </div>
                <div className="absolute inset-x-0 top-1/4 border-b border-dashed border-slate-200 flex items-center text-[10px] text-slate-600 font-mono tabular-nums">
                  <span className="absolute -left-6 sm:-left-7">60</span>
                </div>
                <div className="absolute inset-x-0 top-2/4 border-b border-dashed border-slate-200 flex items-center text-[10px] text-slate-600 font-mono tabular-nums">
                  <span className="absolute -left-6 sm:-left-7">40</span>
                </div>
                <div className="absolute inset-x-0 top-3/4 border-b border-dashed border-slate-200 flex items-center text-[10px] text-slate-600 font-mono tabular-nums">
                  <span className="absolute -left-6 sm:-left-7">20</span>
                </div>
                <span className="absolute -left-6 sm:-left-7 bottom-0 text-[10px] text-slate-600 font-mono tabular-nums">
                  0
                </span>

                {/* Bars for Mon - Sun */}
                {volumeChartData.map((item) => {
                  const height = Math.round((item.appointments / maxBarValue) * 100);

                  return (
                    <div key={item.day} className="flex-1 flex flex-col items-center h-full justify-end z-10 group">
                      <div className="flex items-end gap-1 sm:gap-1.5 w-full justify-center">
                        <div
                          style={{ height: `${height}%` }}
                          className="w-2.5 sm:w-4 bg-[#006837] rounded-t-sm group-hover:brightness-110 transition-all"
                          title={`Appointments: ${item.appointments}`}
                        />
                      </div>
                      <span className="mt-3 text-xs text-slate-600 font-semibold font-mono tabular-nums">
                        {item.day}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-6 mt-4 pt-1 px-4 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#006837]" />
                  <span>Appointments</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card B: Today's Appointments Table */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Today's appointments
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs font-semibold text-slate-700 font-mono tabular-nums">
                    {todayAppointments.length}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  A little preparation. A lot of better care.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('appointments')}
                className="text-xs font-bold text-[#006837] hover:text-[#00522c] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View all</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-6">Patient</th>
                    <th className="py-3 px-6">Doctor</th>
                    <th className="py-3 px-6">Time</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {todayAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Patient Column */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#EAF7EE] text-[#006837] border border-[#c4e9cf] flex items-center justify-center font-bold text-xs shrink-0">
                            {apt.initials}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {apt.patientName}
                            </div>
                            <div className="text-[11px] text-slate-600 font-mono tabular-nums">
                              {apt.patientCode}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Doctor Column */}
                      <td className="py-3.5 px-6">
                        <div className="font-medium text-slate-900">
                          {apt.doctorName}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          {apt.department}
                        </div>
                      </td>

                      {/* Time Column */}
                      <td className="py-3.5 px-6 font-medium text-slate-700 font-mono tabular-nums">
                        {apt.time}
                      </td>

                      {/* Status Column with Semantic Mapping */}
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${getStatusBadgeStyle(
                            apt.status
                          )}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                          <span>{apt.status}</span>
                        </span>
                      </td>

                      {/* Action Menu Column */}
                      <td className="py-3.5 px-6 text-right">
                        <button className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-4 px-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
              <span className="tabular-nums">Showing {Math.min(todayAppointments.length, 5)} of {todayAppointments.length} appointments</span>
              <button
                onClick={() => setActiveTab('appointments')}
                className="text-[#006837] hover:text-[#00522c] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>All appointments</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Quick Actions + Recent Activity (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card D: Quick actions 2x2 Grid */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Quick actions
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Less clicking. More caring.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              {/* Action 1: Register patient */}
              <button
                onClick={() => setActiveTab('patients')}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-[#EAF7EE]/40 hover:border-[#006837]/30 transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow-2xs"
              >
                <div className="w-9 h-9 rounded-lg bg-[#EAF7EE] text-[#006837] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <UserPlus className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-800">
                  Register patient
                </span>
              </button>

              {/* Action 2: Book appointment */}
              <button
                onClick={() => setActiveTab('appointments')}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-[#EAF7EE]/40 hover:border-[#006837]/30 transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow-2xs"
              >
                <div className="w-9 h-9 rounded-lg bg-[#EAF7EE] text-[#006837] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-800">
                  Book appointment
                </span>
              </button>

              {/* Action 3: Start encounter */}
              <button
                onClick={() => {
                  if (currentEncounter) {
                    setSelectedEncounterId(currentEncounter.id);
                    setActiveTab('doctor');
                  }
                }}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-[#EAF7EE]/40 hover:border-[#006837]/30 transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow-2xs"
              >
                <div className="w-9 h-9 rounded-lg bg-[#EAF7EE] text-[#006837] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-800">
                  Start encounter
                </span>
              </button>

              {/* Action 4: Create invoice */}
              <button
                onClick={() => setActiveTab('billing')}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-[#EAF7EE]/40 hover:border-[#006837]/30 transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow-2xs"
              >
                <div className="w-9 h-9 rounded-lg bg-[#EAF7EE] text-[#006837] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-800">
                  Create invoice
                </span>
              </button>
            </div>
          </div>

          {/* Card D: Recent activity Feed */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Recent activity
              </h3>
              <button className="text-slate-500 hover:text-slate-700 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {recentActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#EAF7EE] text-[#006837] flex items-center justify-center shrink-0 mt-0.5">
                    <act.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-900 leading-snug">
                      {act.title}
                    </div>
                    <div className="text-[11px] text-slate-600 leading-snug">
                      {act.desc}
                    </div>
                    <div className="text-[10px] text-slate-600 mt-0.5 font-medium font-mono tabular-nums">
                      {act.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200">
              <button
                onClick={() => setActiveTab('audit')}
                className="w-full text-center text-xs font-bold text-[#006837] hover:text-[#00522c] flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <span>View all activity</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Page Footer */}
      <footer className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
        <div>&copy; 2026 Carevia. All rights reserved.</div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#006837]" />
          <span>Live data from EMR backend</span>
        </div>
      </footer>
    </div>
  );
};
