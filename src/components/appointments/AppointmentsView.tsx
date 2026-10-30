import React, { useState, useRef, useEffect } from 'react';
import { useEmr } from '../../context/EmrContext';
import {
  CalendarDays,
  Plus,
  Clock,
  Stethoscope,
  CheckCircle2,
  X,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { staffDisplayName } from '../../lib/staff';

export const AppointmentsView: React.FC = () => {
  const {
    patients,
    appointments,
    staffList,
    bookAppointment,
    checkInPatient,
    encounters,
    setActiveTab,
    setSelectedEncounterId,
  } = useEmr();

  const doctors = staffList.filter((staff) => staff.role === 'Doctor');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const bookButtonRef = useRef<HTMLButtonElement>(null);

  // Book form state
  const [patientId, setPatientId] = useState(patients[0]?.id || '');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slotTime, setSlotTime] = useState('11:30 AM');
  const [department, setDepartment] = useState('Internal Medicine');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!patientId && patients[0]?.id) setPatientId(patients[0].id);
  }, [patientId, patients]);
  useEffect(() => {
    if (!doctorId && doctors[0]?.id) setDoctorId(doctors[0].id);
  }, [doctorId, doctors]);

  // Min date for appointment booking (today)
  const todayStr = new Date().toISOString().split('T')[0];

  // Filter options with dynamically computed counts
  const filterOptions = [
    { id: 'all', label: 'All Appointments' },
    { id: 'Scheduled', label: 'Scheduled' },
    { id: 'Checked-in', label: 'Checked-in' },
    { id: 'In-Consultation', label: 'In-Consultation' },
    { id: 'Completed', label: 'Completed' },
  ];

  const getCountForStatus = (statusId: string) => {
    if (statusId === 'all') return appointments.length;
    return appointments.filter((a) => a.status === statusId).length;
  };

  const filteredAppointments = appointments.filter((a) => {
    if (filterStatus === 'all') return true;
    return a.status === filterStatus;
  });

  // Time parser helper to sort "09:00 AM", "11:30 AM", etc.
  const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  // Sort a shallow copy by date then slotTime
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const dateDiff = (a.dateTime || '').localeCompare(b.dateTime || '');
    if (dateDiff !== 0) return dateDiff;
    return parseTimeToMinutes(a.slotTime) - parseTimeToMinutes(b.slotTime);
  });

  // Check if all appointments share a single date
  const uniqueDates = Array.from(new Set(sortedAppointments.map((a) => a.dateTime))).filter(Boolean);
  const allShareDate = uniqueDates.length === 1;
  const sharedDate = allShareDate ? uniqueDates[0] : null;

  // Semantic status badge styling mapping (reuses OverviewView mapping 1:1)
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Checked-in':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'In-Consultation':
      case 'In consultation':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      case 'Scheduled':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'Completed':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  // Modal close handler with focus restoration
  const closeModal = () => {
    setIsBookModalOpen(false);
    setTimeout(() => {
      bookButtonRef.current?.focus();
    }, 0);
  };

  // Lock body scroll behind modal
  useEffect(() => {
    if (isBookModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isBookModalOpen]);

  // Escape key closes modal
  useEffect(() => {
    if (!isBookModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBookModalOpen]);

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find((p) => p.id === patientId);
    const doctor = doctors.find((d) => d.id === doctorId);
    if (!patient || !doctor?.id) return;

    bookAppointment({
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientMrn: patient.mrn,
      doctorId: doctor.id,
      doctorName: staffDisplayName(doctor),
      department: doctor.department || department,
      dateTime: date,
      slotTime,
      reason: reason || 'General clinical consultation and review',
    });

    closeModal();
    setReason('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Appointments & Clinic Intake
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Schedule visits and check-in arriving patients to automatically initiate Encounters
          </p>
        </div>
        <button
          ref={bookButtonRef}
          onClick={() => setIsBookModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-[#006837] hover:bg-[#00522c] text-white font-semibold text-xs sm:text-sm shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto focus:outline-none focus:ring-2 focus:ring-[#006837]"
        >
          <Plus className="w-4 h-4" />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* Filter Tabs with Dynamic Counts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {filterOptions.map((opt) => {
          const count = getCountForStatus(opt.id);
          const isActive = filterStatus === opt.id;

          return (
            <button
              key={opt.id}
              onClick={() => setFilterStatus(opt.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006837] ${
                isActive
                  ? 'bg-[#006837] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{opt.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] tabular-nums font-semibold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {sortedAppointments.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl bg-white shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-[#EAF7EE] text-[#006837] border border-[#c4e9cf] flex items-center justify-center mx-auto mb-3">
            <CalendarDays className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No appointments found</h3>
          <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
            There are no appointments matching the &ldquo;{filterStatus}&rdquo; status filter.
          </p>
          {filterStatus !== 'all' && (
            <button
              onClick={() => setFilterStatus('all')}
              className="mt-4 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#006837] bg-[#EAF7EE] border border-[#c4e9cf] hover:bg-[#d8f0e0] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006837]"
            >
              View all appointments
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Schedule Date Banner (shown once if all appointments share a single date) */}
          {allShareDate && sharedDate && (
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium px-1">
              <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
              <span>
                Schedule Date: <strong className="text-slate-900 tabular-nums">{sharedDate}</strong>
              </span>
            </div>
          )}

          {/* Desktop Schedule Table (>= 768px) */}
          <div className="hidden md:block overflow-x-auto rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <th scope="col" className="py-3 px-5">Slot Time</th>
                  <th scope="col" className="py-3 px-5">Patient</th>
                  <th scope="col" className="py-3 px-5">Physician & Dept</th>
                  <th scope="col" className="py-3 px-5">Reason</th>
                  <th scope="col" className="py-3 px-5">Status</th>
                  <th scope="col" className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sortedAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Slot Time Column */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 tabular-nums">
                        {apt.slotTime}
                      </div>
                      {!allShareDate && (
                        <div className="text-[11px] text-slate-600 tabular-nums mt-0.5">
                          {apt.dateTime}
                        </div>
                      )}
                    </td>

                    {/* Patient Column */}
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-900">
                        {apt.patientName}
                      </div>
                      <div className="text-[11px] font-mono text-[#006837] mt-0.5">
                        {apt.patientMrn}
                      </div>
                    </td>

                    {/* Physician & Dept Column */}
                    <td className="py-3.5 px-5">
                      <div className="font-medium text-slate-900">
                        {apt.doctorName}
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        {apt.department}
                      </div>
                    </td>

                    {/* Reason Column (Wraps, never truncated) */}
                    <td className="py-3.5 px-5 text-slate-600 max-w-xs break-words leading-relaxed">
                      {apt.reason}
                    </td>

                    {/* Status Column */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${getStatusBadgeStyle(
                          apt.status
                        )}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                        <span>{apt.status}</span>
                      </span>
                    </td>

                    {/* Action Column */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      {apt.status === 'Scheduled' && (
                        <button
                          onClick={() => checkInPatient(apt.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#006837] hover:bg-[#00522c] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006837]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Check-in Patient</span>
                        </button>
                      )}

                      {apt.status === 'Checked-in' && (
                        <button
                          onClick={() => {
                            setSelectedEncounterId(apt.encounterId || null);
                            setActiveTab('nurse');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#006837] hover:bg-[#00522c] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006837]"
                        >
                          <span>Send to Nurse Triage</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {apt.status === 'In-Consultation' && (
                        <button
                          onClick={() => {
                            setSelectedEncounterId(apt.encounterId || null);
                            setActiveTab('doctor');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#006837] hover:bg-[#00522c] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006837]"
                        >
                          <span>View Doctor Chart</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {apt.status === 'Completed' && (
                        <button
                          onClick={() => setActiveTab('billing')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006837]"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>View Settle Invoice</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Collapsed Schedule Cards (< 768px) */}
          <div className="block md:hidden space-y-3">
            {sortedAppointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3"
              >
                {/* Header: Slot Time & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-900 font-bold">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span className="tabular-nums">{apt.slotTime}</span>
                    {!allShareDate && (
                      <span className="text-[11px] text-slate-600 font-medium tabular-nums">
                        ({apt.dateTime})
                      </span>
                    )}
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${getStatusBadgeStyle(
                      apt.status
                    )}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                    <span>{apt.status}</span>
                  </span>
                </div>

                {/* Patient Information */}
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    {apt.patientName}
                  </div>
                  <div className="text-xs font-mono text-[#006837] mt-0.5">
                    {apt.patientMrn}
                  </div>
                </div>

                {/* Physician & Department */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Stethoscope className="w-3.5 h-3.5 text-slate-500" />
                    {apt.doctorName}
                  </span>
                  <span className="text-slate-600">{apt.department}</span>
                </div>

                {/* Reason (Full text, wraps) */}
                <div className="text-xs text-slate-600 bg-slate-50/60 p-2.5 rounded-lg border border-slate-100 leading-relaxed break-words">
                  <strong className="text-slate-800">Reason: </strong>
                  {apt.reason}
                </div>

                {/* Full-width touch-friendly Action Button (>= 44px height) */}
                <div className="pt-1">
                  {apt.status === 'Scheduled' && (
                    <button
                      onClick={() => checkInPatient(apt.id)}
                      className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-[#006837] hover:bg-[#00522c] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006837]"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Check-in Patient (Opens Encounter)</span>
                    </button>
                  )}

                  {apt.status === 'Checked-in' && (
                    <button
                      onClick={() => {
                        setSelectedEncounterId(apt.encounterId || null);
                        setActiveTab('nurse');
                      }}
                      className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-[#006837] hover:bg-[#00522c] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006837]"
                    >
                      <span>Send to Nurse Triage</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  {apt.status === 'In-Consultation' && (
                    <button
                      onClick={() => {
                        setSelectedEncounterId(apt.encounterId || null);
                        setActiveTab('doctor');
                      }}
                      className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-[#006837] hover:bg-[#00522c] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006837]"
                    >
                      <span>View Doctor Chart</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  {apt.status === 'Completed' && (
                    <button
                      onClick={() => setActiveTab('billing')}
                      className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006837]"
                    >
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span>View Settle Invoice</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Book Appointment Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="book-appointment-title"
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EAF7EE] text-[#006837] border border-[#c4e9cf] flex items-center justify-center">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="book-appointment-title" className="font-bold text-slate-900 text-base">
                    Book Patient Appointment
                  </h3>
                  <p className="text-xs text-slate-600">Step 2: Assign physician and clinic slot</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                aria-label="Close booking modal"
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006837]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Patient *</label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006837] focus:border-[#006837]"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.mrn}) — {p.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Attending Physician *</label>
                <select
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006837] focus:border-[#006837]"
                >
                  {doctors.map((d) => (
                    <option key={d.id ?? d.staffId ?? staffDisplayName(d)} value={d.id ?? ''}>
                      {staffDisplayName(d)}{d.department ? ` (${d.department})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006837] focus:border-[#006837]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time Slot *</label>
                  <select
                    value={slotTime}
                    onChange={(e) => setSlotTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006837] focus:border-[#006837]"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="09:45 AM">09:45 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="11:15 AM">11:15 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006837] focus:border-[#006837]"
                >
                  <option value="Internal Medicine">Internal Medicine</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="General Outpatient">General Outpatient</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Surgery">General Surgery</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Visit</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Primary complaint, symptoms or follow-up note..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006837] focus:border-[#006837]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[#006837]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#006837] hover:bg-[#00522c] text-white font-semibold shadow-xs cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[#006837]"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
