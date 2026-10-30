import React, { useState } from 'react';
import { useEmr } from '../../context/EmrContext';
import { Role } from '../../types/emr';
import { ROLES } from '../../types/roles';
import { staffDisplayName } from '../../lib/staff';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Bell,
  Sparkles,
  ShieldCheck,
  Stethoscope,
  Activity,
  UserCheck,
  CreditCard,
  User,
  ChevronDown,
  Menu,
  Search,
  Command,
  Globe,
  LogOut,
} from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const navigate = useNavigate();
  const {
    role,
    facility,
    setFacility,
    activeTab,
    setIsTourOpen,
    auditLogs,
    setIsCommandPaletteOpen,
    setViewMode,
    signOut,
    facilities,
    staffList,
  } = useEmr();
  const [showFacilityMenu, setShowFacilityMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const currentUser = role ? staffList.find((s) => s.role === role) : undefined;
  const currentUserName = currentUser ? staffDisplayName(currentUser) : 'Signed-in user';

  const roleConfigs: Record<Role, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
    Doctor: {
      label: 'Doctor (Consultant)',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50 border-emerald-200',
      icon: <Stethoscope className="w-4 h-4 text-emerald-600" />,
    },
    Nurse: {
      label: 'Triage Nurse',
      color: 'text-cyan-700',
      bg: 'bg-cyan-50 border-cyan-200',
      icon: <Activity className="w-4 h-4 text-cyan-600" />,
    },
    Receptionist: {
      label: 'Front Desk / Intake',
      color: 'text-amber-700',
      bg: 'bg-amber-50 border-amber-200',
      icon: <UserCheck className="w-4 h-4 text-amber-600" />,
    },
    Cashier: {
      label: 'Cashier / Billing',
      color: 'text-purple-700',
      bg: 'bg-purple-50 border-purple-200',
      icon: <CreditCard className="w-4 h-4 text-purple-600" />,
    },
    Admin: {
      label: 'System Administrator',
      color: 'text-rose-700',
      bg: 'bg-rose-50 border-rose-200',
      icon: <ShieldCheck className="w-4 h-4 text-rose-600" />,
    },
    [ROLES.SuperAdmin]: {
      label: 'Super Administrator',
      color: 'text-violet-800',
      bg: 'bg-violet-50 border-violet-200',
      icon: <ShieldCheck className="w-4 h-4 text-violet-700" />,
    },
    [ROLES.MedicalDirector]: {
      label: 'Medical Director',
      color: 'text-indigo-700',
      bg: 'bg-indigo-50 border-indigo-200',
      icon: <Activity className="w-4 h-4 text-indigo-600" />,
    },
    [ROLES.Pharmacist]: {
      label: 'Pharmacist',
      color: 'text-teal-700',
      bg: 'bg-teal-50 border-teal-200',
      icon: <UserCheck className="w-4 h-4 text-teal-600" />,
    },
    [ROLES.Laboratorist]: {
      label: 'Laboratory staff',
      color: 'text-sky-700',
      bg: 'bg-sky-50 border-sky-200',
      icon: <Stethoscope className="w-4 h-4 text-sky-600" />,
    },
    [ROLES.HmoOfficer]: {
      label: 'HMO Officer',
      color: 'text-cyan-700',
      bg: 'bg-cyan-50 border-cyan-200',
      icon: <CreditCard className="w-4 h-4 text-cyan-600" />,
    },
    Patient: {
      label: 'Patient Portal',
      color: 'text-blue-700',
      bg: 'bg-blue-50 border-blue-200',
      icon: <User className="w-4 h-4 text-blue-600" />,
    },
  };

  const currentRoleCfg = role
    ? roleConfigs[role]
    : {
        label: 'Role not verified',
        color: 'text-slate-600',
        bg: 'bg-slate-50 border-slate-200',
        icon: <User className="w-4 h-4 text-slate-500" />,
      };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-2.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile trigger & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumbs matching screenshot */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-1.5 hover:text-slate-900 transition-colors">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Workspace</span>
            </div>
            <span className="text-slate-300 font-normal">›</span>
            <span className="text-slate-900 font-bold capitalize">
              {activeTab === 'overview' ? 'Overview' : activeTab}
            </span>
          </div>
        </div>

        {/* Center: Search Bar matching screenshot */}
        <div className="flex-1 max-w-md hidden md:flex justify-center">
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="w-full max-w-sm flex items-center justify-between px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-xs text-slate-400 shadow-2xs transition-all hover:border-slate-300 group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 transition-colors" />
              <span className="text-slate-500">Search anything...</span>
            </div>
            <kbd className="text-[10px] font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 font-semibold shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Quick actions, notifications, and profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {role !== ROLES.SuperAdmin && (
            <button
              onClick={() => setIsTourOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-xs sm:text-sm font-semibold shadow-sm hover:from-teal-700 hover:to-emerald-700 transition-all transform hover:-translate-y-0.5 glow-teal"
              title="Step-by-step hospital workflow demo"
            >
              <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
              <span className="hidden md:inline">Interactive Workflow Demo</span>
              <span className="md:hidden">Demo</span>
            </button>
          )}

          {/* Backend-issued role badge; switching roles requires a different account. */}
          <div
            aria-label={`Active role: ${role ?? 'not verified'}`}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold ${currentRoleCfg.bg} ${currentRoleCfg.color}`}
          >
            {currentRoleCfg.icon}
            <span className="hidden sm:inline">Role:</span>
            <span>{role ?? 'Unverified'}</span>
          </div>

          {/* Notifications / Live Audit Feed */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Recent Clinical & Audit Events"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-500 ring-2 ring-white animate-ping" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-500 ring-2 ring-white" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 py-3 z-50">
                <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                  <div className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-teal-600" />
                    Live System & Clinical Audit Log
                  </div>
                  <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                    Real-time
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {auditLogs.slice(0, 6).map((log) => (
                    <div key={log.id} className="p-3 text-xs hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span className="font-semibold text-slate-700">{log.userName}</span>
                        <span className="font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="text-slate-800 text-[11px] font-medium leading-relaxed">
                        {log.details}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-semibold">
                          {log.action}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          ID: {log.recordId}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Avatar matching screenshot */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div
              aria-hidden="true"
              className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100 flex items-center justify-center"
            >
              <User className="w-4 h-4" />
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1">
                <span>{currentUserName}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {role === ROLES.SuperAdmin
                  ? 'Platform administrator'
                  : role === 'Admin'
                    ? 'Hospital administrator'
                    : `${currentUser?.department || 'Clinical staff'} • ${role}`}
              </div>
            </div>
          </div>

          {/* Quick Landing & Sign Out Action Buttons */}
          <div className="hidden xl:flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <button
              onClick={() => setViewMode('landing')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all shadow-sm"
              title="Return to Public Hospital Landing Page"
            >
              <Globe className="w-3.5 h-3.5 text-teal-600" />
              <span>Public Site</span>
            </button>
            <button
              onClick={() => {
                signOut();
                navigate('/login', { replace: true });
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-rose-100 bg-rose-50/60 hover:bg-rose-100/80 text-xs font-semibold text-rose-700 transition-all shadow-sm"
              title="Sign Out to UATH Portal"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
