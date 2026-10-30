import React from 'react';
import { useEmr } from '../../context/EmrContext';
import { canAccessTab } from '../../auth/roles';
import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Users,
  Calendar,
  Stethoscope,
  FlaskConical,
  CreditCard,
  FileText,
  UserCheck,
  Settings,
  Building2,
  ChevronDown,
  X,
  Globe,
  LogOut,
  UserCircle,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  category: 'WORKSPACE' | 'SUPPORT';
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const navigate = useNavigate();
  const { role, activeTab, setActiveTab, facility, setFacility, facilities, appointments, setViewMode, signOut } = useEmr();
  const [showFacilityPicker, setShowFacilityPicker] = React.useState(false);

  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutGrid,
      category: 'WORKSPACE',
    },
    {
      id: 'patients',
      label: 'Patients',
      icon: Users,
      category: 'WORKSPACE',
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: Calendar,
      badge: `${appointments.length}`,
      category: 'WORKSPACE',
    },
    {
      id: 'encounters',
      label: 'Encounters',
      icon: Stethoscope,
      category: 'WORKSPACE',
    },
    {
      id: 'labs',
      label: 'Laboratory',
      icon: FlaskConical,
      category: 'WORKSPACE',
    },
    {
      id: 'billing',
      label: 'Billing & payments',
      icon: CreditCard,
      category: 'WORKSPACE',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      category: 'WORKSPACE',
    },
    {
      id: 'staff',
      label: 'Staff management',
      icon: UserCheck,
      category: 'WORKSPACE',
    },
    {
      id: 'portal',
      label: 'Patient portal',
      icon: UserCircle,
      category: 'WORKSPACE',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      category: 'SUPPORT',
    },
  ];

  const handleNavClick = (tabId: string) => {
    if (!canAccessTab(role, tabId)) return;
    setActiveTab(tabId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="px-5 pt-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#006837] text-white flex items-center justify-center font-bold text-xl shadow-sm">
              +
            </div>
            <div>
              <div className="font-extrabold text-2xl tracking-tight text-slate-900 leading-none">
                carevia
              </div>
              <div className="text-[8px] font-bold tracking-[0.2em] text-slate-400 uppercase mt-1 leading-none">
                CONNECTED CARE. BETTER LIVES.
              </div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Facility Selector Card */}
        <div className="px-4 mb-3 relative">
          <button
            onClick={() => setShowFacilityPicker(!showFacilityPicker)}
            className="w-full p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all flex items-center justify-between text-left shadow-xs group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 border border-slate-200/60">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-800 transition-colors">
                  {facility.name}
                </div>
                <div className="text-[10px] text-slate-400 font-medium truncate">
                  {facility.city}, Nigeria
                </div>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
          </button>

          {showFacilityPicker && (
            <div className="absolute left-4 right-4 mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Switch Facility
              </div>
              {facilities.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setFacility(f);
                    setShowFacilityPicker(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-emerald-50 flex items-center justify-between transition-colors ${
                    facility.id === f.id ? 'bg-emerald-50/70 text-emerald-900 font-bold' : 'text-slate-700'
                  }`}
                >
                  <span className="truncate">{f.name}</span>
                  {facility.id === f.id && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
          {['WORKSPACE', 'SUPPORT'].map((cat) => (
            <div key={cat} className="pt-2">
              <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {cat}
              </div>
              <div className="space-y-0.5 mt-0.5">
                {navItems
                  .filter((item) => item.category === cat && canAccessTab(role, item.id))
                  .map((item) => {
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all ${
                          isActive
                            ? 'bg-[#EAF7EE] text-[#006837] font-bold shadow-xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon
                            className={`w-4 h-4 ${isActive ? 'text-[#006837]' : 'text-slate-500'}`}
                          />
                          <span>{item.label}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={`text-xs font-semibold px-1.5 py-0.2 rounded-md ${
                              isActive ? 'text-[#006837] font-bold' : 'text-emerald-600'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}

                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Portal Navigation */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/40 space-y-1">
          <button
            onClick={() => {
              setViewMode('landing');
              onCloseMobile();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-teal-800 hover:bg-white border border-transparent hover:border-slate-200 transition-all shadow-none hover:shadow-sm"
          >
            <Globe className="w-4 h-4 text-teal-600" />
            <span>Public Hospital Site</span>
          </button>

          <button
            onClick={() => {
              signOut();
              navigate('/login', { replace: true });
              onCloseMobile();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Sign Out / Switch</span>
          </button>
        </div>

        {/* Bottom System & Architecture Info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold mb-1">
            <span>Stack & Architecture</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-[10px] text-slate-500 space-y-0.5">
            <div className="flex justify-between">
              <span>Backend:</span>
              <span className="font-mono text-slate-700">ASP.NET Core Web API</span>
            </div>
            <div className="flex justify-between">
              <span>Architecture:</span>
              <span className="font-mono text-slate-700">Clean Architecture</span>
            </div>
            <div className="flex justify-between">
              <span>Database:</span>
              <span className="font-mono text-slate-700">EF Core + PostgreSQL</span>
            </div>
            <div className="flex justify-between">
              <span>Frontend:</span>
              <span className="font-mono text-slate-700">React + TypeScript</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
