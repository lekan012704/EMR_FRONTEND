import React from 'react';
import { useEmr } from '../../context/EmrContext';
import { canAccessTab } from '../../auth/roles';
import {
  Sparkles,
  X,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  UserCheck,
  Calendar,
  FolderHeart,
  Activity,
  Stethoscope,
  FlaskConical,
  CreditCard,
  Lock,
} from 'lucide-react';
import { Role } from '../../types/emr';

export const WorkflowSimulatorModal: React.FC = () => {
  const {
    isTourOpen,
    setIsTourOpen,
    currentStep,
    setCurrentStep,
    role,
    setActiveTab,
  } = useEmr();

  if (!isTourOpen) return null;

  const steps = [
    {
      num: 1,
      title: '1. Register Patient & Assign MRN',
      role: 'Receptionist' as Role,
      tab: 'patients',
      desc: 'The receptionist creates or finds the patient (full name, phone, emergency next of kin, HMO policy details). An isolated medical record number (MRN) is generated under the active facility.',
      icon: UserCheck,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      num: 2,
      title: '2. Book Appointment Slot',
      role: 'Receptionist' as Role,
      tab: 'appointments',
      desc: 'An appointment is scheduled for an attending doctor and clinic time slot with initial status set to "Scheduled".',
      icon: Calendar,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      num: 3,
      title: '3. Check In & Open Encounter',
      role: 'Receptionist' as Role,
      tab: 'appointments',
      desc: 'When the patient arrives at the hospital, the appointment changes to "Checked-in", and a clinical Encounter (visit) is automatically opened with a linked invoice.',
      icon: FolderHeart,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    },
    {
      num: 4,
      title: '4. Nurse Triage & Vitals Telemetry',
      role: 'Nurse' as Role,
      tab: 'nurse',
      desc: 'The triage nurse captures BP, pulse, temperature, resp rate, SpO2, and height/weight with automatic BMI calculation and triage acuity scoring.',
      icon: Activity,
      color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    },
    {
      num: 5,
      title: '5. Doctor Consult & SOAP Note',
      role: 'Doctor' as Role,
      tab: 'doctor',
      desc: 'The physician reviews patient telemetry, documents the formal SOAP clinical note, and assigns primary/secondary ICD-10 diagnostic codes.',
      icon: Stethoscope,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      num: 6,
      title: '6. Order Lab Investigations & Rx',
      role: 'Doctor' as Role,
      tab: 'doctor',
      desc: 'The doctor creates pathology lab orders with unique investigation numbers and issues pharmacy prescriptions. Each order automatically appends an invoice item to the bill.',
      icon: FlaskConical,
      color: 'text-violet-600 bg-violet-50 border-violet-200',
    },
    {
      num: 7,
      title: '7. Cashier Billing & Multi-Mode Settlement',
      role: 'Cashier' as Role,
      tab: 'billing',
      desc: 'The cashier receives payment via Cash, POS/Card, Bank Transfer, Paystack, or HMO Co-pay. Payments are append-only. Generates printable official receipts.',
      icon: CreditCard,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
    {
      num: 8,
      title: '8. Close Encounter & Addendums',
      role: 'Doctor' as Role,
      tab: 'doctor',
      desc: 'The doctor officially closes the encounter. Clinical notes are permanently locked to read-only. Any subsequent clinical entries require signed addendums.',
      icon: Lock,
      color: 'text-rose-600 bg-rose-50 border-rose-200',
    },
  ];

  const current = steps[currentStep - 1];
  const canOpenCurrentScreen = canAccessTab(role, current.tab);

  const handleGoToScreen = () => {
    if (!canOpenCurrentScreen) return;
    setActiveTab(current.tab);
    setIsTourOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-400/20 text-teal-300 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                Interactive EMR Patient Visit Simulator
              </h3>
              <p className="text-xs text-teal-200">
                End-to-end 8-step hospital care lifecycle matching system architecture
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsTourOpen(false)}
            className="p-1.5 text-teal-200 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Numbers Indicator Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-1 overflow-x-auto">
          {steps.map((s) => (
            <button
              key={s.num}
              onClick={() => setCurrentStep(s.num)}
              className={`flex-shrink-0 w-8 h-8 rounded-full text-xs font-bold transition-all flex items-center justify-center ${
                currentStep === s.num
                  ? 'bg-teal-600 text-white ring-4 ring-teal-100 shadow-sm'
                  : currentStep > s.num
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-white text-slate-400 border border-slate-200'
              }`}
            >
              {currentStep > s.num ? '✓' : s.num}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className={`p-4 rounded-2xl border ${current.color}`}>
              <current.icon className="w-8 h-8" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  Target Role: {current.role}
                </span>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                  Screen: {current.tab.toUpperCase()}
                </span>
              </div>
              <h4 className="text-lg font-bold text-slate-900">{current.title}</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {current.desc}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 text-xs text-teal-900 flex items-center justify-between">
            <div>
              This walkthrough never changes your signed-in role. Screen access continues to follow your account permissions.
            </div>
            <button
              onClick={handleGoToScreen}
              disabled={!canOpenCurrentScreen}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold whitespace-nowrap shadow-sm ml-3 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {canOpenCurrentScreen ? 'Open available screen' : 'Screen not available to this role'}
            </button>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            disabled={currentStep === 1}
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-40 flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs text-slate-400 font-mono font-bold">
            Step {currentStep} of {steps.length}
          </span>

          {currentStep < steps.length ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 flex items-center gap-1"
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              disabled={!canOpenCurrentScreen}
              onClick={handleGoToScreen}
              className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Finish & Explore
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
