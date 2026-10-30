import React, { useState } from 'react';
import { useEmr } from '../../context/EmrContext';
import { getStatusBadgeStyle, getSystemTagStyle } from '../../lib/statusStyles';
import {
  Stethoscope,
  FileEdit,
  Pill,
  FlaskConical,
  Lock,
  CheckCircle2,
  Plus,
  ShieldAlert,
  History,
  ArrowRight,
} from 'lucide-react';

export const DoctorConsultationView: React.FC = () => {
  const {
    encounters,
    patients,
    selectedEncounterId,
    setSelectedEncounterId,
    saveClinicalNote,
    addDiagnosis,
    addLabOrder,
    addPrescription,
    closeEncounter,
    addClinicalAddendum,
    setActiveTab,
  } = useEmr();

  const activeEncounters = encounters;
  const currentEncounter =
    encounters.find((e) => e.id === selectedEncounterId) || encounters[0];
  const patient = patients.find((p) => p.id === currentEncounter?.patientId);

  // SOAP State
  const [subjective, setSubjective] = useState(
    currentEncounter?.clinicalNote?.subjective ||
      'Patient reports 3-day history of general fatigue, intermittent headaches, and mild chest tightness.'
  );
  const [objective, setObjective] = useState(
    currentEncounter?.clinicalNote?.objective ||
      'Alert, oriented x3. Chest: vesicular breath sounds bilaterally. Heart: normal S1/S2 heard.'
  );
  const [assessment, setAssessment] = useState(
    currentEncounter?.clinicalNote?.assessment ||
      '1. Sub-optimally controlled Essential Hypertension.\n2. Consider early renal strain vs medication non-compliance.'
  );
  const [plan, setPlan] = useState(
    currentEncounter?.clinicalNote?.plan ||
      '1. Titrate anti-hypertensive regimen.\n2. Request Serum Electrolytes, Urea & Creatinine.\n3. Patient educated on low-sodium dietary measures.'
  );

  // Diagnosis State - empty defaults, filled by doctor during consultation
  const [diagCode, setDiagCode] = useState('—');
  const [diagDesc, setDiagDesc] = useState('Add ICD-10 diagnosis...');
  const [diagType, setDiagType] = useState<'Primary' | 'Secondary'>('Primary');

  // Lab Order State - empty defaults, filled by doctor
  const [labName, setLabName] = useState('New test investigation...');
  const [labCategory, setLabCategory] = useState<'Hematology' | 'Chemical Pathology' | 'Microbiology' | 'Radiology' | 'General'>('Hematology');
  const [labPriority, setLabPriority] = useState<'Routine' | 'Urgent' | 'STAT'>('Routine');
  const [labCost, setLabCost] = useState(0);
  const [labNotes, setLabNotes] = useState('');

  // Prescription State - empty defaults, filled by doctor
  const [rxDrug, setRxDrug] = useState('');
  const [rxDose, setRxDose] = useState('');
  const [rxFreq, setRxFreq] = useState('');
  const [rxDuration, setRxDuration] = useState('');
  const [rxInstructions, setRxInstructions] = useState('');
  const [rxCost, setRxCost] = useState(0);

  // Addendum State
  const [addendumText, setAddendumText] = useState('');

  const isClosed = currentEncounter?.status === 'Closed' || currentEncounter?.clinicalNote?.isClosed;

  const handleSaveSoap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEncounter || isClosed) return;
    saveClinicalNote(currentEncounter.id, {
      subjective,
      objective,
      assessment,
      plan,
    });
  };

  const handleAddDiagnosis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEncounter || isClosed) return;
    addDiagnosis(currentEncounter.id, {
      code: diagCode,
      description: diagDesc,
      type: diagType,
    });
  };

  const handleAddLab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEncounter || isClosed) return;
    addLabOrder(currentEncounter.id, {
      testName: labName,
      category: labCategory,
      priority: labPriority,
      cost: labCost,
      notes: labNotes,
    });
  };

  const handleAddRx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEncounter || isClosed) return;
    addPrescription(currentEncounter.id, {
      drugName: rxDrug,
      dosage: rxDose,
      frequency: rxFreq,
      duration: rxDuration,
      instructions: rxInstructions,
      cost: rxCost,
    });
  };

  // Close encounter handler with existing window.confirm() dialog
  const handleCloseEncounter = () => {
    if (!currentEncounter) return;
    if (confirm('Closing this encounter will permanently lock clinical notes to READ-ONLY. Are you sure?')) {
      closeEncounter(currentEncounter.id);
    }
  };

  const handlePostAddendum = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEncounter || !addendumText) return;
    addClinicalAddendum(currentEncounter.id, addendumText);
    setAddendumText('');
  };

  const patientAge = patient ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-32">
      {/* Header & Lock Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Doctor Workstation & Clinical Chart
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Consultation management, SOAP clinical notes, ICD-10 diagnoses, lab orders, and pharmacy prescriptions
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isClosed ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-300">
              <Lock className="w-3.5 h-3.5 text-slate-600" />
              <span>Encounter Closed (Read-Only)</span>
            </span>
          ) : (
            <button
              onClick={handleCloseEncounter}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-600"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Close Encounter (Lock Notes)</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Encounter Switcher Roster (3 cols) & Clinical Chart (9 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Active Encounters Roster (3 cols on desktop, horizontal/stacked on tablet) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
            <span>Active Encounters ({activeEncounters.length})</span>
          </div>

          {/* Tablet & Mobile: Horizontal Swipe Selector */}
          <div className="flex lg:hidden overflow-x-auto gap-2.5 pb-2">
            {activeEncounters.map((enc) => {
              const isSelected = enc.id === currentEncounter?.id;
              return (
                <button
                  key={enc.id}
                  onClick={() => setSelectedEncounterId(enc.id)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-left shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#006837] bg-[#EAF7EE] ring-1 ring-[#006837]/30 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-semibold text-xs text-slate-900">{enc.patientName}</div>
                  <div className="font-mono text-[10px] text-[#006837]">{enc.encounterNumber}</div>
                </button>
              );
            })}
          </div>

          {/* Desktop Vertical List */}
          <div className="hidden lg:block space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
            {activeEncounters.map((enc) => {
              const isSelected = enc.id === currentEncounter?.id;
              const hasVitals = !!enc.vitals;

              return (
                <div
                  key={enc.id}
                  onClick={() => setSelectedEncounterId(enc.id)}
                  className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#006837] bg-[#EAF7EE]/30 ring-1 ring-[#006837]/30 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute left-0 inset-y-0 w-1 bg-[#006837] rounded-l-2xl" />
                  )}

                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-slate-900 text-xs truncate max-w-[150px]">
                      {enc.patientName}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border inline-flex items-center gap-1 ${getStatusBadgeStyle(
                        enc.status
                      )}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                      <span>{enc.status}</span>
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-[#006837] mt-1 font-semibold">
                    {enc.encounterNumber}
                  </div>

                  {hasVitals && (
                    <div className="mt-1.5 text-[11px] text-slate-600 font-mono tabular-nums">
                      BP: {enc.vitals?.bpSystolic}/{enc.vitals?.bpDiastolic} • {enc.vitals?.pulse} bpm
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Comprehensive Doctor Clinical Chart (9 cols) */}
        <div className="lg:col-span-9 space-y-6">
          {currentEncounter && patient ? (
            <>
              {/* 1. STICKY PATIENT & ALLERGY SAFETY BANNER (Accounts for sticky header height) */}
              <div className="sticky top-14 sm:top-16 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
                {/* Desktop Full Identity Details */}
                <div className="hidden sm:flex items-center justify-between gap-4 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#EAF7EE] text-[#006837] border border-[#c4e9cf] flex items-center justify-center font-bold text-base shrink-0">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-base">
                        {patient.firstName} {patient.lastName}{' '}
                        <span className="text-xs font-normal text-slate-600">
                          ({patient.gender}, <span className="tabular-nums">{patientAge}y</span>)
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 flex items-center flex-wrap gap-2 mt-0.5">
                        <span className="font-mono font-semibold text-[#006837] bg-[#EAF7EE] px-1.5 py-0.5 rounded border border-[#c4e9cf]">
                          {patient.mrn}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-slate-700 font-medium">
                          {currentEncounter.encounterNumber}
                        </span>
                        <span>•</span>
                        <span className="text-slate-700 font-medium">
                          HMO: {patient.hmoDetails?.provider || 'Private'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tablet/Mobile Collapsed Identity Header */}
                <div className="flex sm:hidden items-center justify-between gap-2 pb-1 border-b border-slate-100">
                  <div className="font-bold text-slate-900 text-sm truncate">
                    {patient.firstName} {patient.lastName}
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-[#006837] bg-[#EAF7EE] px-1.5 py-0.5 rounded border border-[#c4e9cf] shrink-0">
                    {patient.mrn}
                  </span>
                </div>

                {/* Persistent Clinical Safety Allergy Alert (Full wrap, never truncated) */}
                {patient.allergies.length > 0 ? (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 flex items-start gap-2.5 shadow-2xs">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase font-bold text-rose-800 tracking-wider">
                        Clinical Safety Alert: Known Allergies
                      </div>
                      <div className="text-xs font-bold text-rose-950 mt-0.5 break-words leading-relaxed">
                        {patient.allergies.join(', ')}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-[#006837] shrink-0" />
                    <span>
                      Allergies: <strong className="text-slate-800 font-semibold">No allergies recorded</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* 2. OBJECTIVE TELEMETRY VITALS STRIP */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Patient Telemetry & Vitals
                </div>

                {currentEncounter.vitals ? (
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                        Blood Pressure
                      </div>
                      <div className="text-xs font-bold font-mono tabular-nums text-slate-900 mt-1">
                        {currentEncounter.vitals.bpSystolic}/{currentEncounter.vitals.bpDiastolic}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                        Pulse Rate
                      </div>
                      <div className="text-xs font-bold font-mono tabular-nums text-slate-900 mt-1">
                        {currentEncounter.vitals.pulse} bpm
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                        Temperature
                      </div>
                      <div className="text-xs font-bold font-mono tabular-nums text-slate-900 mt-1">
                        {currentEncounter.vitals.temperature}°C
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                        Resp. Rate
                      </div>
                      <div className="text-xs font-bold font-mono tabular-nums text-slate-900 mt-1">
                        {currentEncounter.vitals.respiratoryRate} /min
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                        SpO2
                      </div>
                      <div className="text-xs font-bold font-mono tabular-nums text-slate-900 mt-1">
                        {currentEncounter.vitals.spO2}%
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                        BMI / Category
                      </div>
                      <div className="text-xs font-bold font-mono tabular-nums text-slate-900 mt-1">
                        {currentEncounter.vitals.bmi}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-300">
                    Nurse telemetry vitals not yet logged for this encounter.
                  </div>
                )}
              </div>

              {/* 3. SOAP CLINICAL NOTES (Pass A Refactored) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#EAF7EE] text-[#006837] border border-[#c4e9cf] flex items-center justify-center">
                      <FileEdit className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">
                        SOAP Clinical Note
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Structured clinical documentation
                      </p>
                    </div>
                  </div>

                  {isClosed ? (
                    <span className="text-[11px] font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-600" />
                      <span>READ-ONLY</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#006837] bg-[#EAF7EE] border border-[#c4e9cf] px-2.5 py-1 rounded-md font-semibold">
                      Drafting Mode
                    </span>
                  )}
                </div>

                <form onSubmit={handleSaveSoap} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="soap-subjective" className="block font-bold text-slate-700 mb-1">
                        S: Subjective (Symptoms & History of Presenting Complaint)
                      </label>
                      <textarea
                        id="soap-subjective"
                        rows={5}
                        disabled={isClosed}
                        value={subjective}
                        onChange={(e) => setSubjective(e.target.value)}
                        className="w-full min-h-[140px] p-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006837] focus:border-[#006837] disabled:bg-slate-50 disabled:text-slate-600 leading-relaxed"
                      />
                    </div>
                    <div>
                      <label htmlFor="soap-objective" className="block font-bold text-slate-700 mb-1">
                        O: Objective (Physical Exam Findings & Vitals)
                      </label>
                      <textarea
                        id="soap-objective"
                        rows={5}
                        disabled={isClosed}
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                        className="w-full min-h-[140px] p-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006837] focus:border-[#006837] disabled:bg-slate-50 disabled:text-slate-600 leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="soap-assessment" className="block font-bold text-slate-700 mb-1">
                        A: Assessment (Clinical Impression & Differential)
                      </label>
                      <textarea
                        id="soap-assessment"
                        rows={5}
                        disabled={isClosed}
                        value={assessment}
                        onChange={(e) => setAssessment(e.target.value)}
                        className="w-full min-h-[140px] p-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006837] focus:border-[#006837] disabled:bg-slate-50 disabled:text-slate-600 leading-relaxed"
                      />
                    </div>
                    <div>
                      <label htmlFor="soap-plan" className="block font-bold text-slate-700 mb-1">
                        P: Plan (Therapeutic Regimen & Patient Counseling)
                      </label>
                      <textarea
                        id="soap-plan"
                        rows={5}
                        disabled={isClosed}
                        value={plan}
                        onChange={(e) => setPlan(e.target.value)}
                        className="w-full min-h-[140px] p-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006837] focus:border-[#006837] disabled:bg-slate-50 disabled:text-slate-600 leading-relaxed"
                      />
                    </div>
                  </div>

                  {!isClosed && (
                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-[#006837] hover:bg-[#00522c] text-white font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006837]"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Save Clinical Note</span>
                      </button>
                    </div>
                  )}
                </form>

                {/* Addendum Display (Post-Close) */}
                {isClosed && (
                  <div className="mt-6 pt-4 border-t border-slate-200 space-y-3">
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <History className="w-4 h-4 text-[#006837]" />
                      <span>Post-Closure Clinical Addendums ({currentEncounter.clinicalNote?.addendums.length || 0})</span>
                    </div>

                    {currentEncounter.clinicalNote?.addendums.map((add) => (
                      <div key={add.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-600">
                          <strong className="text-slate-900">{add.addedBy}</strong>
                          <span className="font-mono tabular-nums">{new Date(add.addedAt).toLocaleString()}</span>
                        </div>
                        <div className="text-slate-900 leading-relaxed">{add.text}</div>
                      </div>
                    ))}

                    {/* Add Addendum Form */}
                    <form onSubmit={handlePostAddendum} className="flex gap-2 text-xs pt-1">
                      <label htmlFor="addendum-text-input" className="sr-only">Clinical Addendum Note</label>
                      <input
                        id="addendum-text-input"
                        type="text"
                        placeholder="Attach clinical addendum note (e.g. reviewed lab result post closure)..."
                        value={addendumText}
                        onChange={(e) => setAddendumText(e.target.value)}
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006837] focus:border-[#006837]"
                      />
                      <button
                        type="submit"
                        disabled={!addendumText}
                        className="px-4 py-2 bg-[#006837] hover:bg-[#00522c] text-white font-semibold rounded-xl shadow-xs disabled:opacity-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#006837]"
                      >
                        Add Addendum
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* 4. ICD-10 DIAGNOSES & IMPRESSIONS (Awaiting Pass B refinement) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      ICD-10 Diagnoses & Diagnostic Impressions
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">Clinical diagnostic codes</p>
                  </div>
                  <span className="text-xs text-slate-600 font-semibold tabular-nums">
                    Total: {currentEncounter.diagnoses.length}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {currentEncounter.diagnoses.map((d) => (
                    <div
                      key={d.id}
                      className="px-3 py-1.5 rounded-xl bg-[#EAF7EE] border border-[#c4e9cf] text-[#006837] text-xs flex items-center gap-2"
                    >
                      <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded text-[11px] border border-[#c4e9cf]">
                        {d.code}
                      </span>
                      <span className="font-medium text-slate-900">{d.description}</span>
                      <span className="text-[10px] text-[#006837] font-bold uppercase">
                        ({d.type})
                      </span>
                    </div>
                  ))}
                </div>

                {!isClosed && (
                  <form onSubmit={handleAddDiagnosis} className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs pt-2">
                    <input
                      type="text"
                      placeholder="ICD-10 Code (e.g. I10, B50.9)"
                      value={diagCode}
                      onChange={(e) => setDiagCode(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Diagnosis Description"
                      value={diagDesc}
                      onChange={(e) => setDiagDesc(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white sm:col-span-2"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#006837] hover:bg-[#00522c] text-white font-semibold flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Diagnosis</span>
                    </button>
                  </form>
                )}
              </div>

              {/* 5. LAB INVESTIGATION ORDERS (Awaiting Pass B refinement) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#EAF7EE] text-[#006837] border border-[#c4e9cf] flex items-center justify-center">
                      <FlaskConical className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        Laboratory Investigation Orders
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">Auto-queued for billing</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${getSystemTagStyle()}`}>
                    Invoice Synchronized
                  </span>
                </div>

                <div className="space-y-2">
                  {currentEncounter.labOrders.map((lab) => (
                    <div
                      key={lab.id}
                      className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          {lab.testName}
                        </div>
                        <div className="text-[11px] text-slate-600 font-mono mt-0.5 tabular-nums">
                          Inv No: {lab.investigationNo} • {lab.category} • Priority: {lab.priority}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 tabular-nums">
                          ₦{lab.cost.toLocaleString()}
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border mt-1 inline-block ${getStatusBadgeStyle(lab.status)}`}>
                          {lab.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {!isClosed && (
                  <form onSubmit={handleAddLab} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                    <div className="font-bold text-slate-700">Order New Laboratory Investigation</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Test Name (e.g. Fasting Blood Sugar, FBC)"
                        value={labName}
                        onChange={(e) => setLabName(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                      <select
                        value={labCategory}
                        onChange={(e) => setLabCategory(e.target.value as any)}
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      >
                        <option value="Hematology">Hematology</option>
                        <option value="Chemical Pathology">Chemical Pathology</option>
                        <option value="Microbiology">Microbiology</option>
                        <option value="Radiology">Radiology / Imaging</option>
                      </select>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Price (₦)"
                          value={labCost}
                          onChange={(e) => setLabCost(Number(e.target.value))}
                          className="w-1/2 px-3 py-2 rounded-xl border border-slate-200 bg-white tabular-nums"
                        />
                        <button
                          type="submit"
                          className="w-1/2 px-3 py-2 rounded-xl bg-[#006837] hover:bg-[#00522c] text-white font-semibold flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Order Lab
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>

              {/* 6. PHARMACY PRESCRIPTIONS (Awaiting Pass B refinement) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#EAF7EE] text-[#006837] border border-[#c4e9cf] flex items-center justify-center">
                      <Pill className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        Pharmacy Prescriptions
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">Auto-queued for billing</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${getSystemTagStyle()}`}>
                    Invoice Synchronized
                  </span>
                </div>

                <div className="space-y-2">
                  {currentEncounter.prescriptions.map((rx) => (
                    <div
                      key={rx.id}
                      className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          {rx.drugName} ({rx.dosage})
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          {rx.frequency} • {rx.duration} • Instructions: {rx.instructions}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 tabular-nums">
                          ₦{rx.cost.toLocaleString()}
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border mt-1 inline-block ${getStatusBadgeStyle(rx.dispensedStatus)}`}>
                          {rx.dispensedStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {!isClosed && (
                  <form onSubmit={handleAddRx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                    <div className="font-bold text-slate-700">Prescribe Medication</div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <input
                        type="text"
                        placeholder="Drug Name (e.g. Paracetamol, Coartem)"
                        value={rxDrug}
                        onChange={(e) => setRxDrug(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Dosage (e.g. 500mg, 10mg)"
                        value={rxDose}
                        onChange={(e) => setRxDose(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Frequency (e.g. TDS, BD, OD)"
                        value={rxFreq}
                        onChange={(e) => setRxFreq(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Price (₦)"
                          value={rxCost}
                          onChange={(e) => setRxCost(Number(e.target.value))}
                          className="w-1/2 px-3 py-2 rounded-xl border border-slate-200 bg-white tabular-nums"
                        />
                        <button
                          type="submit"
                          className="w-1/2 px-3 py-2 rounded-xl bg-[#006837] hover:bg-[#00522c] text-white font-semibold flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Prescribe
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>

              {/* 7. BILLING SETTLEMENT BANNER */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#EAF7EE] border border-[#c4e9cf] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div>
                  <div className="font-bold text-slate-900 text-xs sm:text-sm">
                    Ready for Billing Settlement?
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    The encounter invoice has automatically compiled all consultation, lab, and pharmacy items.
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('billing')}
                  className="px-4 py-2.5 rounded-xl bg-[#006837] hover:bg-[#00522c] text-white font-semibold text-xs sm:text-sm shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <span>Open Cashier Counter (Step 7)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-600 border border-dashed border-slate-200 rounded-2xl bg-white shadow-2xs">
              Select an encounter to open consultation chart
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
