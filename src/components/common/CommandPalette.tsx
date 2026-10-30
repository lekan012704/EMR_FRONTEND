import React, { useState, useEffect } from 'react';
import { useEmr } from '../../context/EmrContext';
import { canAccessTab } from '../../auth/roles';
import {
  Search,
  User,
  Calendar,
  Activity,
  Stethoscope,
  CreditCard,
  FileText,
  ShieldCheck,
  Building2,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    patients,
    setActiveTab,
    setSelectedPatientId,
    role,
    setIsTourOpen,
  } = useEmr();

  const [query, setQuery] = useState('');

  if (!isCommandPaletteOpen) return null;

  const quickNav = [
    { label: 'Hospital Overview Dashboard', tab: 'overview', icon: Activity },
    { label: 'Patient Master Directory & Intake', tab: 'patients', icon: User },
    { label: 'Clinic Appointment Schedule', tab: 'appointments', icon: Calendar },
    { label: 'Nurse Triage & Vitals Station', tab: 'nurse', icon: Activity },
    { label: 'Doctor Clinical Consultation Chart', tab: 'doctor', icon: Stethoscope },
    { label: 'Cashier Billing & Payments Counter', tab: 'billing', icon: CreditCard },
    { label: 'Laboratory Diagnostics Tracker', tab: 'labs', icon: FileText },
    { label: 'Administration & RBAC Matrix', tab: 'reports', icon: ShieldCheck },
  ];

  const matchedPatients = canAccessTab(role, 'patients')
    ? patients.filter((p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
        p.mrn.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const matchedNav = quickNav.filter((item) =>
    canAccessTab(role, item.tab) && item.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectNav = (tab: string) => {
    if (!canAccessTab(role, tab)) return;
    setActiveTab(tab);
    setIsCommandPaletteOpen(false);
  };

  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
    setActiveTab('patients');
    setIsCommandPaletteOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-teal-600" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a patient name, MRN, or search any clinical module... (ESC to close)"
            className="flex-1 text-sm font-medium focus:outline-none placeholder:text-slate-400"
          />
          <button
            onClick={() => setIsCommandPaletteOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4 text-xs">
          {/* Quick Guided Tour shortcut */}
          <div
            onClick={() => {
              setIsTourOpen(true);
              setIsCommandPaletteOpen(false);
            }}
            className="p-3 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/80 flex items-center justify-between cursor-pointer hover:shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <div>
                <strong className="text-teal-950 font-bold">Simulate 8-Step Hospital Visit</strong>
                <p className="text-[11px] text-teal-700">Interactive walkthrough of the full patient lifecycle</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-teal-600" />
          </div>

          {/* Patients Section */}
          {matchedPatients.length > 0 && (
            <div>
              <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Matching Patients ({matchedPatients.length})
              </div>
              <div className="space-y-1">
                {matchedPatients.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPatient(p.id)}
                    className="p-2.5 rounded-xl hover:bg-slate-100 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                        {p.firstName[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{p.firstName} {p.lastName}</div>
                        <div className="text-[10px] font-mono text-teal-700">{p.mrn} • {p.phone}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded">
                      Open Profile
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Navigation Section */}
          {matchedNav.length > 0 && (
            <div>
              <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                System Screens & Workstations
              </div>
              <div className="space-y-1">
                {matchedNav.map((item) => (
                  <div
                    key={item.tab}
                    onClick={() => handleSelectNav(item.tab)}
                    className="p-2.5 rounded-xl hover:bg-slate-100 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className="w-4 h-4 text-slate-500" />
                      <span className="font-semibold text-slate-700">{item.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Jump to screen
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Tip: Press <strong>Ctrl + K</strong> anywhere to summon this menu</span>
          <span className="font-mono">Carevia EMR</span>
        </div>
      </div>
    </div>
  );
};

