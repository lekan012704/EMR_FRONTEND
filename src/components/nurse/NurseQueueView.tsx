import React, { useState } from 'react';
import { useEmr } from '../../context/EmrContext';
import {
  Activity,
  Heart,
  Thermometer,
  Wind,
  Gauge,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const NurseQueueView: React.FC = () => {
  const {
    encounters,
    patients,
    recordVitals,
    selectedEncounterId,
    setSelectedEncounterId,
    setActiveTab,
  } = useEmr();

  const activeEncounters = encounters.filter((e) => e.status !== 'Closed');
  const targetEncounter =
    encounters.find((e) => e.id === selectedEncounterId) || activeEncounters[0] || encounters[0];
  const patient = patients.find((p) => p.id === targetEncounter?.patientId);

  // Vitals entry form state
  const [bpSystolic, setBpSystolic] = useState<number>(targetEncounter?.vitals?.bpSystolic || 120);
  const [bpDiastolic, setBpDiastolic] = useState<number>(targetEncounter?.vitals?.bpDiastolic || 80);
  const [pulse, setPulse] = useState<number>(targetEncounter?.vitals?.pulse || 72);
  const [temperature, setTemperature] = useState<number>(targetEncounter?.vitals?.temperature || 36.6);
  const [respiratoryRate, setRespiratoryRate] = useState<number>(targetEncounter?.vitals?.respiratoryRate || 16);
  const [spO2, setSpO2] = useState<number>(targetEncounter?.vitals?.spO2 || 98);
  const [weightKg, setWeightKg] = useState<number>(targetEncounter?.vitals?.weightKg || 70);
  const [heightCm, setHeightCm] = useState<number>(targetEncounter?.vitals?.heightCm || 172);
  const [painScale, setPainScale] = useState<number>(targetEncounter?.vitals?.painScale || 1);
  const [triageCategory, setTriageCategory] = useState<'Standard' | 'Urgent' | 'Emergency'>(
    targetEncounter?.vitals?.triageCategory || 'Standard'
  );
  const [nurseNotes, setNurseNotes] = useState<string>(targetEncounter?.vitals?.nurseNotes || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Auto-calculated BMI
  const heightM = heightCm / 100;
  const bmi = heightM > 0 ? Number((weightKg / (heightM * heightM)).toFixed(1)) : 22.0;

  const getBmiStatus = (bmiVal: number) => {
    if (bmiVal < 18.5) return { label: 'Underweight', color: 'text-amber-600 bg-amber-50' };
    if (bmiVal < 25) return { label: 'Normal Weight', color: 'text-emerald-600 bg-emerald-50' };
    if (bmiVal < 30) return { label: 'Overweight', color: 'text-amber-700 bg-amber-50' };
    return { label: 'Obese', color: 'text-rose-700 bg-rose-50' };
  };

  const getBpCategory = (sys: number, dia: number) => {
    if (sys >= 140 || dia >= 90) return { label: 'Stage 2 Hypertension', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    if (sys >= 130 || dia >= 80) return { label: 'Stage 1 Hypertension', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    if (sys >= 120 && dia < 80) return { label: 'Elevated BP', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' };
    return { label: 'Normal BP', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  };

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEncounter) return;

    recordVitals(targetEncounter.id, {
      bpSystolic: Number(bpSystolic),
      bpDiastolic: Number(bpDiastolic),
      pulse: Number(pulse),
      temperature: Number(temperature),
      respiratoryRate: Number(respiratoryRate),
      spO2: Number(spO2),
      weightKg: Number(weightKg),
      heightCm: Number(heightCm),
      bmi,
      painScale: Number(painScale),
      triageCategory,
      nurseNotes,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Nurse Station: Triage & Vitals Recording
          </h1>
          <p className="text-xs text-slate-500">
            Step 4: Capture clinical physiological telemetry against active encounters
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
            Active Triage Queue: {activeEncounters.length} patients
          </span>
        </div>
      </div>

      {/* Main Grid: Queue on left, Vitals form on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Triage Patient Queue (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Waiting for Triage Assessment
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {activeEncounters.map((enc) => {
              const isSelected = enc.id === targetEncounter?.id;
              const hasVitals = !!enc.vitals;

              return (
                <div
                  key={enc.id}
                  onClick={() => setSelectedEncounterId(enc.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-50/70 border-cyan-500 ring-2 ring-cyan-500/20 shadow-md'
                      : 'bg-white border-slate-200/80 hover:border-cyan-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {enc.patientName}
                      </div>
                      <div className="text-[11px] font-mono text-cyan-800">
                        {enc.patientMrn} • {enc.encounterNumber}
                      </div>
                    </div>
                    {hasVitals ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Vitals Done
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 animate-pulse">
                        Pending Vitals
                      </span>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                    <span>Doctor: {enc.doctorName}</span>
                    <span className="font-mono text-[10px]">
                      {new Date(enc.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {enc.vitals && (
                    <div className="mt-2 text-[11px] font-mono bg-white p-2 rounded-lg border border-slate-200/60 text-slate-700 flex justify-between">
                      <span>BP {enc.vitals.bpSystolic}/{enc.vitals.bpDiastolic}</span>
                      <span>Pulse {enc.vitals.pulse}</span>
                      <span>Temp {enc.vitals.temperature}°C</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Vitals Entry Station (8 cols) */}
        <div className="lg:col-span-8">
          {targetEncounter ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
              {/* Encounter Header info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Triage Entry: {targetEncounter.patientName}
                    </h2>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span className="font-mono text-cyan-800 font-semibold">
                        {targetEncounter.patientMrn}
                      </span>
                      <span>•</span>
                      <span>Encounter: {targetEncounter.encounterNumber}</span>
                      <span>•</span>
                      <span>Attending: {targetEncounter.doctorName}</span>
                    </div>
                  </div>
                </div>

                {patient?.allergies && patient.allergies.length > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Allergies: {patient.allergies.join(', ')}</span>
                  </div>
                )}
              </div>

              {savedSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Vitals recorded successfully and synced with patient encounter chart!</span>
                </div>
              )}

              <form onSubmit={handleSaveVitals} className="space-y-6">
                {/* Vitals Telemetry Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Blood Pressure */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-rose-500" />
                        Blood Pressure (mmHg)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        required
                        value={bpSystolic}
                        onChange={(e) => setBpSystolic(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-200 bg-white"
                        placeholder="Sys (120)"
                      />
                      <span className="text-slate-400 font-bold">/</span>
                      <input
                        type="number"
                        required
                        value={bpDiastolic}
                        onChange={(e) => setBpDiastolic(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-200 bg-white"
                        placeholder="Dia (80)"
                      />
                    </div>
                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded border text-center ${getBpCategory(bpSystolic, bpDiastolic).color}`}>
                      {getBpCategory(bpSystolic, bpDiastolic).label}
                    </div>
                  </div>

                  {/* Pulse Rate */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      Pulse / Heart Rate (bpm)
                    </span>
                    <input
                      type="number"
                      required
                      value={pulse}
                      onChange={(e) => setPulse(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-200 bg-white"
                    />
                    <div className="text-[10px] text-slate-500 text-center font-medium">
                      Normal resting: 60 - 100 bpm
                    </div>
                  </div>

                  {/* Temperature */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                      Body Temperature (°C)
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={temperature}
                      onChange={(e) => setTemperature(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-200 bg-white"
                    />
                    <div className="text-[10px] text-center">
                      {temperature >= 38.0 ? (
                        <span className="font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                          Febrile / Fever Alert!
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium">Normal: 36.5 - 37.5°C</span>
                      )}
                    </div>
                  </div>

                  {/* Respiratory Rate */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Wind className="w-3.5 h-3.5 text-cyan-500" />
                      Resp. Rate (breaths/min)
                    </span>
                    <input
                      type="number"
                      required
                      value={respiratoryRate}
                      onChange={(e) => setRespiratoryRate(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-200 bg-white"
                    />
                    <div className="text-[10px] text-slate-500 text-center font-medium">
                      Standard: 12 - 20 bpm
                    </div>
                  </div>

                  {/* SpO2 */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-blue-500" />
                      Oxygen Saturation (SpO2 %)
                    </span>
                    <input
                      type="number"
                      required
                      min="50"
                      max="100"
                      value={spO2}
                      onChange={(e) => setSpO2(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-200 bg-white"
                    />
                    <div className="text-[10px] text-center">
                      {spO2 < 95 ? (
                        <span className="font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                          Hypoxia Warning (&lt; 95%)
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium">Optimal: 95 - 100%</span>
                      )}
                    </div>
                  </div>

                  {/* Weight & Height (BMI Auto-Calculation) */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-teal-600" />
                      Weight (kg) & Height (cm)
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.5"
                        value={weightKg}
                        onChange={(e) => setWeightKg(Number(e.target.value))}
                        className="w-full px-2 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-200 bg-white"
                        placeholder="kg"
                      />
                      <input
                        type="number"
                        value={heightCm}
                        onChange={(e) => setHeightCm(Number(e.target.value))}
                        className="w-full px-2 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-200 bg-white"
                        placeholder="cm"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="font-bold text-slate-700">BMI: {bmi}</span>
                      <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${getBmiStatus(bmi).color}`}>
                        {getBmiStatus(bmi).label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pain Scale & Triage Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        Wong-Baker FACES Pain Severity Scale (0 - 10)
                      </label>
                      <span className="text-sm font-extrabold text-slate-900 font-mono">
                        {painScale} / 10
                      </span>
                    </div>

                    {/* Interactive Facial Pain Picker */}
                    <div className="grid grid-cols-6 gap-1 pt-1">
                      {[
                        { val: 0, face: '😊', label: 'No Hurt' },
                        { val: 2, face: '🙂', label: 'Little' },
                        { val: 4, face: '😐', label: 'Mild' },
                        { val: 6, face: '🙁', label: 'Moderate' },
                        { val: 8, face: '😣', label: 'Severe' },
                        { val: 10, face: '😭', label: 'Worst' },
                      ].map((item) => (
                        <button
                          type="button"
                          key={item.val}
                          onClick={() => setPainScale(item.val)}
                          className={`p-1.5 rounded-xl border text-center transition-all ${
                            painScale === item.val
                              ? 'bg-teal-600 text-white border-teal-600 shadow-md scale-105'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <div className="text-lg">{item.face}</div>
                          <div className="text-[9px] font-bold mt-0.5">{item.val}</div>
                          <div className="text-[8px] opacity-80 truncate">{item.label}</div>
                        </button>
                      ))}
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={painScale}
                      onChange={(e) => setPainScale(Number(e.target.value))}
                      className="w-full accent-teal-600 cursor-pointer mt-2"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Nurse Triage Acuity Category
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Standard', 'Urgent', 'Emergency'] as const).map((cat) => (
                        <button
                          type="button"
                          key={cat}
                          onClick={() => setTriageCategory(cat)}
                          className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                            triageCategory === cat
                              ? cat === 'Emergency'
                                ? 'bg-rose-600 text-white shadow-sm'
                                : cat === 'Urgent'
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'bg-teal-600 text-white shadow-sm'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Nurse Observation Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nurse Clinical Observations & Intake Notes
                  </label>
                  <textarea
                    rows={3}
                    value={nurseNotes}
                    onChange={(e) => setNurseNotes(e.target.value)}
                    placeholder="General appearance, alertness, patient complaints upon intake, emergency meds given..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>

                {/* Form Footer */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    Telemetry signed by: <strong>Nurse Amina Yusuf, RN</strong>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-cyan-600/20 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Telemetry & Vitals</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleSaveVitals({ preventDefault: () => {} } as any);
                        setActiveTab('doctor');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/20 flex items-center gap-1.5"
                    >
                      <span>Proceed to Doctor Consultation</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 border border-dashed rounded-2xl">
              No active patient selected for triage
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
