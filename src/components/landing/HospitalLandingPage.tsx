import React, { useState } from 'react';
import { useEmr } from '../../context/EmrContext';
import { useNavigate } from 'react-router-dom';
import {
  HeartPulse,
  PhoneCall,
  Calendar,
  ShieldCheck,
  Stethoscope,
  Activity,
  Award,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  Building2,
  ChevronRight,
  FlaskConical,
  Pill,
  Ambulance,
  Lock,
  Globe,
  MapPin,
  Star,
} from 'lucide-react';
import { EcgMonitor } from '../common/EcgMonitor';
import { staffDisplayName } from '../../lib/staff';

interface HospitalLandingPageProps {
  onEnterEmr: () => void;
  onOpenAuth: () => void;
}

export const HospitalLandingPage: React.FC<HospitalLandingPageProps> = ({
  onEnterEmr,
  onOpenAuth,
}) => {
  const navigate = useNavigate();
  const { facility, setFacility, facilities, staffList, addToast } = useEmr();

  const [bookingSpecialty, setBookingSpecialty] = useState('Internal Medicine');
  const [bookingDoctor, setBookingDoctor] = useState(staffList[0]?.id || '');
  const [bookingDate, setBookingDate] = useState('2026-10-15');

  // Facilities customizable content map
  const hospitalThemes: Record<
    string,
    {
      brandColor: string;
      accentBg: string;
      headline: string;
      subheadline: string;
      emergencyPhone: string;
      badgeText: string;
    }
  > = {
    'fac-001': {
      brandColor: 'from-emerald-700 via-teal-800 to-cyan-900',
      accentBg: 'bg-teal-600',
      headline: 'World-Class Clinical Precision. Zero Delays. Compassionate Care.',
      subheadline:
        'Carevia General Hospital CBD combines multi-disciplinary consultant physicians, digital pharmacy ordering, and synchronized telemetry.',
      emergencyPhone: '+234 9 291 4000',
      badgeText: '★ CBD Main Center of Clinical Excellence',
    },
    'fac-002': {
      brandColor: 'from-blue-900 via-indigo-900 to-teal-900',
      accentBg: 'bg-indigo-600',
      headline: 'Advanced Trauma, Surgical Innovation & Precision Healthcare.',
      subheadline:
        'Lekki Specialty Center delivers rapid cardiac care, intensive care telemetry, and 24/7 surgical theatre readiness.',
      emergencyPhone: '+234 1 888 2020',
      badgeText: '★ 24/7 Trauma & Critical Care Wing',
    },
    'fac-003': {
      brandColor: 'from-green-900 via-emerald-800 to-slate-900',
      accentBg: 'bg-emerald-700',
      headline: 'Tertiary Medical Excellence & Compassionate Healing For All.',
      subheadline:
        'University of Abuja Teaching Hospital clinical extension provides top-tier specialist clinics, research medicine, and NHIS access.',
      emergencyPhone: '+234 9 444 1122',
      badgeText: '★ Premier Teaching Hospital Affiliate',
    },
  };

  const currentTheme = hospitalThemes[facility.id] || hospitalThemes['fac-001'];

  const specialties = [
    {
      title: 'Cardiology & Heart Center',
      desc: 'Advanced ECG telemetry, post-stent cardiac rehabilitation, and hypertension management.',
      icon: HeartPulse,
      color: 'bg-rose-500/10 text-rose-600 border-rose-200',
    },
    {
      title: 'Internal Medicine & Nephrology',
      desc: 'Comprehensive adult diagnostics, diabetic clinics, and kidney profile evaluations.',
      icon: Stethoscope,
      color: 'bg-teal-500/10 text-teal-600 border-teal-200',
    },
    {
      title: 'Accident & Emergency (A&E)',
      desc: '24/7 trauma triage, rapid resuscitation bays, and emergency ambulance dispatch.',
      icon: Ambulance,
      color: 'bg-amber-500/10 text-amber-600 border-amber-200',
    },
    {
      title: 'Pediatrics & Maternal Care',
      desc: 'Gentle newborn care, pediatric immunizations, and prenatal specialist monitoring.',
      icon: Users,
      color: 'bg-purple-500/10 text-purple-600 border-purple-200',
    },
    {
      title: 'Laboratory & Diagnostic Imaging',
      desc: 'Automated hematology, microbiology, ultrasound scans, and rapid pathology reports.',
      icon: FlaskConical,
      color: 'bg-blue-500/10 text-blue-600 border-blue-200',
    },
    {
      title: 'Digital Pharmacy & Therapeutics',
      desc: 'Direct electronic dispensing, verified drug interactions, and refill tracking.',
      icon: Pill,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    },
  ];

  const handleQuickBook = (e: React.FormEvent) => {
    e.preventDefault();
    addToast(
      'Sign in required',
      'Sign in to the patient portal to request an appointment. No appointment has been reserved yet.',
      'info'
    );
    navigate('/patient/login');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* 1. Top Emergency & Hotline Strip */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-950 to-teal-950 border-b border-emerald-800/40 py-2 px-4 sm:px-8 text-xs text-slate-300 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-emerald-300">
            Emergency Dispatch & ICU Hotline:
          </span>
          <a
            href={`tel:${currentTheme.emergencyPhone}`}
            className="font-bold text-white hover:text-emerald-300 font-mono flex items-center gap-1"
          >
            <PhoneCall className="w-3 h-3 text-emerald-400" />
            {currentTheme.emergencyPhone} / 112 (24/7)
          </a>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span className="hidden md:inline">
            📍 {facility.address}
          </span>
          <span className="bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
            NDPA Certified Health Facility
          </span>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-cyan-400 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/20 font-black">
              <HeartPulse className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white">
                  carevia
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-teal-400 text-slate-950 px-1.5 py-0.5 rounded">
                  HOSPITAL
                </span>
              </div>
              <div className="text-[10px] font-semibold text-teal-300 truncate max-w-[200px] sm:max-w-xs">
                {facility.name}
              </div>
            </div>
          </div>

          {/* Hospital Switcher dropdown (Customer Requirement: adaptable for each hospital) */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Switch Hospital View:</span>
            <select
              value={facility.id}
              onChange={(e) => {
                const f = facilities.find((item) => item.id === e.target.value);
                if (f) setFacility(f);
              }}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20 bg-slate-900/90 text-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Navigation Links & Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-teal-300" />
              <span>Staff Sign In</span>
            </button>

            <button
              onClick={onEnterEmr}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-teal-500/25 transition-all transform hover:-translate-y-0.5 flex items-center gap-1.5"
            >
              <span>Launch EMR Workstation</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      </header>

      {/* 3. Hero Section (Vibrant, buoyant, courageous, energetic) */}
      <section className={`relative overflow-hidden py-16 sm:py-24 bg-gradient-to-br ${currentTheme.brandColor} border-b border-white/10`}>
        {/* Ambient mesh background circles */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Col: Hero Copy & Fast Booking (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/15 text-teal-200 border border-white/20 shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>{currentTheme.badgeText}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
                {currentTheme.headline}
              </h1>

              <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-xl">
                {currentTheme.subheadline}
              </p>

              {/* Quick Booking Box on Landing Page */}
              <div className="p-5 rounded-3xl bg-slate-950/80 backdrop-blur-xl border border-white/20 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-300 uppercase tracking-wider">
                    <Calendar className="w-4 h-4" />
                    <span>Instant Clinic Appointment Booking</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                    Live Doctors Online
                  </span>
                </div>

                <form onSubmit={handleQuickBook} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Clinical Specialty
                    </label>
                    <select
                      value={bookingSpecialty}
                      onChange={(e) => setBookingSpecialty(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium"
                    >
                      <option value="Internal Medicine">Internal Medicine</option>
                      <option value="Cardiology">Cardiology & ICU</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Surgery">General Surgery</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Attending Consultant
                    </label>
                    <select
                      value={bookingDoctor}
                      onChange={(e) => setBookingDoctor(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium"
                    >
                      {staffList.filter((s) => s.role === 'Doctor').map((doc) => (
                        <option key={doc.id ?? doc.staffId ?? staffDisplayName(doc)} value={doc.id ?? ''}>
                          {staffDisplayName(doc)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium"
                    />
                  </div>

                  <div className="sm:col-span-3 pt-1">
                    <button
                      type="submit"
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-sm shadow-xl shadow-teal-500/30 flex items-center justify-center gap-2 transition-all"
                    >
                      <span>Reserve Appointment Slot</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>

              {/* 4 Trust stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                  <div className="text-2xl font-black text-white font-mono">50k+</div>
                  <div className="text-[11px] text-teal-200 mt-0.5 font-medium">Patients Treated</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                  <div className="text-2xl font-black text-white font-mono">99.8%</div>
                  <div className="text-[11px] text-teal-200 mt-0.5 font-medium">Recovery Index</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                  <div className="text-2xl font-black text-white font-mono">&lt; 14m</div>
                  <div className="text-[11px] text-teal-200 mt-0.5 font-medium">Avg Triage Wait</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                  <div className="text-2xl font-black text-white font-mono">100%</div>
                  <div className="text-[11px] text-teal-200 mt-0.5 font-medium">HMO Coverage Sync</div>
                </div>
              </div>
            </div>

            {/* Right Col: Live ECG Telemetry & Hospital Card (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              <EcgMonitor heartRate={76} label={`${facility.code} • Cardiac ICU Live Telemetry`} />

              <div className="p-6 rounded-3xl bg-slate-950/80 backdrop-blur-xl border border-white/15 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-teal-400" />
                    <span>Hospital Campus Profile</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded">
                    Facility ID: {facility.id}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                    <span>{facility.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Direct Desk: {facility.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Ambulance className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Trauma Level: Tertiary Referral Center</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-white/10 text-xs">
                  <button
                    onClick={onOpenAuth}
                    className="text-teal-300 hover:text-white font-bold flex items-center gap-1"
                  >
                    Staff & Doctor Portal <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={onEnterEmr}
                    className="text-amber-300 hover:text-white font-bold flex items-center gap-1"
                  >
                    Open Live EMR <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Specialties Showcase */}
      <section className="py-16 sm:py-20 bg-slate-950 px-4 sm:px-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-wider text-teal-400">
              CLINICAL DEPARTMENTS & EXCELLENCE
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Comprehensive Medical Specializations
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Every department connects synchronously to the Carevia EMR backend with automated lab orders,
              instant pharmacy fulfillment, and itemized billing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {specialties.map((spec, i) => (
              <div
                key={i}
                className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 hover:border-teal-500/50 hover:bg-slate-900 transition-all group shadow-lg"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border mb-4 transition-transform group-hover:scale-110 ${spec.color}`}>
                  <spec.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-base mb-2 group-hover:text-teal-300 transition-colors">
                  {spec.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {spec.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Health Insurance & HMO Partners */}
      <section className="py-12 bg-slate-900/50 px-4 sm:px-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-xs font-bold text-teal-400 uppercase tracking-wider">
              Accredited Health Maintenance Organizations (HMO)
            </div>
            <div className="text-lg font-black text-white mt-0.5">
              Cashless Care & Instant Digital Co-Pay Authorization
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {['Hygeia HMO', 'Reliance HMO', 'AXA Mansard Health', 'Leadway Health', 'NHIS National'].map(
              (hmo, idx) => (
                <div
                  key={idx}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/15 text-xs font-bold text-slate-200"
                >
                  {hmo}
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* 6. Call To Action Footer */}
      <footer className="py-12 bg-slate-950 px-4 sm:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/10 pb-8 mb-8">
          <div className="space-y-1 text-center md:text-left">
            <div className="font-extrabold text-base text-white">
              {facility.name}
            </div>
            <div>
              {facility.address} &bull; Emergency Dispatch: {currentTheme.emergencyPhone}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
            >
              Sign In to Workstation
            </button>
            <button
              onClick={onEnterEmr}
              className="px-5 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-black transition-colors"
            >
              Launch Live EMR
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 text-center sm:text-left">
          <div>
            &copy; {new Date().getFullYear()} {facility.name}. Connected to ASP.NET Core Clean Architecture API & PostgreSQL.
          </div>
          <div>
            Compliant with NDPA 2023 &bull; ISO 27001 Clinical Data Standards
          </div>
        </div>
      </footer>
    </div>
  );
};

