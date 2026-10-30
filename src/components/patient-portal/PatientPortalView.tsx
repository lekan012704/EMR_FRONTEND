import React from 'react';
import { useEmr } from '../../context/EmrContext';
import {
  User,
  Heart,
  Calendar,
  FileText,
  Pill,
  FlaskConical,
  Receipt,
  Download,
  ShieldCheck,
  Clock,
} from 'lucide-react';

export const PatientPortalView: React.FC = () => {
  const { patients, selectedPatientId, setSelectedPatientId, appointments, encounters, invoices } = useEmr();

  const currentPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];
  const myAppointments = appointments.filter((a) => a.patientId === currentPatient?.id);
  const myEncounters = encounters.filter((e) => e.patientId === currentPatient?.id);
  const myInvoices = invoices.filter((i) => i.patientId === currentPatient?.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Carevia Patient Health Portal (Self-Service)
          </h1>
          <p className="text-xs text-slate-500">
            View personal medical visits, doctor advice, active medications, lab findings, and official receipts
          </p>
        </div>

        {/* Demo Patient Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Logged in as:</span>
          <select
            value={currentPatient?.id}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName} ({p.mrn})
              </option>
            ))}
          </select>
        </div>
      </div>

      {currentPatient ? (
        <div className="space-y-6">
          {/* Welcome Patient Hero Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-teal-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                <ShieldCheck className="w-3 h-3" />
                Verified Patient ID: {currentPatient.mrn}
              </span>
              <h2 className="text-2xl font-black">
                Welcome, {currentPatient.firstName} {currentPatient.lastName}
              </h2>
              <p className="text-xs text-blue-100 max-w-xl leading-relaxed">
                Your medical records are encrypted and protected under national data privacy guidelines (NDPA).
                Access all your medical history, prescriptions, and official payment receipts below.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-blue-200 font-semibold">
                Insurance Provider
              </div>
              <div className="font-extrabold text-sm">
                {currentPatient.hmoDetails ? currentPatient.hmoDetails.provider : 'Self-Pay / Private'}
              </div>
              {currentPatient.hmoDetails && (
                <div className="text-[11px] text-blue-200 font-mono">
                  Policy: {currentPatient.hmoDetails.policyNumber} ({currentPatient.hmoDetails.coverageTier})
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80">
              <span className="text-xs text-slate-400 font-medium">My Clinic Visits</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{myEncounters.length}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80">
              <span className="text-xs text-slate-400 font-medium">Active Prescriptions</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {myEncounters.reduce((acc, e) => acc + e.prescriptions.length, 0)}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80">
              <span className="text-xs text-slate-400 font-medium">Lab Test Orders</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {myEncounters.reduce((acc, e) => acc + e.labOrders.length, 0)}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80">
              <span className="text-xs text-slate-400 font-medium">Outstanding Balances</span>
              <div className="text-2xl font-black text-rose-700 font-mono mt-1">
                ₦{myInvoices.reduce((acc, i) => acc + i.balance, 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* My Prescriptions and Active Medications */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Pill className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                My Prescribed Medications & Dosage Regimens
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {myEncounters.flatMap((e) => e.prescriptions).map((rx) => (
                <div key={rx.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{rx.drugName}</div>
                      <div className="text-slate-500 font-mono text-[11px]">Dose: {rx.dosage} • Duration: {rx.duration}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {rx.frequency}
                    </span>
                  </div>
                  <div className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/60 leading-relaxed">
                    <strong>Instructions: </strong>{rx.instructions}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Prescribed by {rx.prescribedBy} on {new Date(rx.prescribedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My Encounters and Clinical Summaries */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Past Doctor Encounters & Care Summaries
              </h3>
            </div>

            <div className="space-y-3">
              {myEncounters.map((enc) => (
                <div key={enc.id} className="p-4 rounded-xl border border-slate-200 text-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="font-bold text-slate-900 text-sm">
                      {enc.encounterNumber} • Attending: {enc.doctorName}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                      {new Date(enc.checkInTime).toLocaleDateString()}
                    </span>
                  </div>

                  {enc.vitals && (
                    <div className="p-2.5 rounded-lg bg-slate-50 font-mono text-slate-700 flex flex-wrap gap-4 text-[11px]">
                      <span>BP: <strong>{enc.vitals.bpSystolic}/{enc.vitals.bpDiastolic}</strong></span>
                      <span>Pulse: <strong>{enc.vitals.pulse} bpm</strong></span>
                      <span>Temp: <strong>{enc.vitals.temperature}°C</strong></span>
                      <span>BMI: <strong>{enc.vitals.bmi}</strong></span>
                    </div>
                  )}

                  {enc.diagnoses.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-500 font-semibold">Diagnoses:</span>
                      {enc.diagnoses.map((d) => (
                        <span key={d.id} className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-medium text-[11px]">
                          [{d.code}] {d.description}
                        </span>
                      ))}
                    </div>
                  )}

                  {enc.clinicalNote && (
                    <div className="p-3 rounded-lg bg-teal-50/50 border border-teal-100 text-slate-700 leading-relaxed">
                      <strong>Physician Treatment Plan: </strong>
                      <div className="whitespace-pre-line mt-1">{enc.clinicalNote.plan}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
