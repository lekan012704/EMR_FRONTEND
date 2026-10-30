import React, { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { EmrProvider, useEmr } from "./context/EmrContext";
import { canAccessTab, roleHomeRoute } from "./auth/roles";
import { setPublicRouteChecker } from "./api/client";
import { PatientLoginPage } from "./auth/PatientLoginPage";
import { PatientRegisterPage } from "./auth/PatientRegisterPage";
import { StaffLoginPage } from "./auth/StaffLoginPage";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { OverviewView } from "./components/dashboard/OverviewView";
import { PatientDirectoryView } from "./components/patients/PatientDirectoryView";
import { AppointmentsView } from "./components/appointments/AppointmentsView";
import { NurseQueueView } from "./components/nurse/NurseQueueView";
import { DoctorConsultationView } from "./components/doctor/DoctorConsultationView";
import { BillingView } from "./components/cashier/BillingView";
import { LabsView } from "./components/labs/LabsView";
import { AdminReportsView } from "./components/admin/AdminReportsView";
import { SuperAdminDashboardView } from "./components/admin/SuperAdminDashboardView";
import { PatientPortalView } from "./components/patient-portal/PatientPortalView";
import { SettingsView } from "./components/settings/SettingsView";
import { WorkflowSimulatorModal } from "./components/workflow/WorkflowSimulatorModal";
import { ToastContainer } from "./components/common/ToastContainer";
import { CommandPalette } from "./components/common/CommandPalette";
import { HospitalLandingPage } from "./components/landing/HospitalLandingPage";
import { Lock, Globe, LogIn, LayoutDashboard, Sparkles, MonitorPlay } from "lucide-react";
import { createBrowserRouter, RouterProvider, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import type { Role } from "./types/emr";
import { UserCircle } from "lucide-react";
import { ROLES } from "./types/roles";
import { AuthRouteGuard } from "./auth/AuthRouteGuard";
import { ChangePasswordView } from "./auth/ChangePasswordView";

/** Wrapper for StaffLoginPage that provides required props from EmrContext. */
const StaffLoginPageWrapper: React.FC = () => {
  const { setActiveTab, setRole, setViewMode } = useEmr();
  const handleLoginSuccess = (role: Exclude<Role, typeof ROLES.Patient>) => {
    setRole(role);
    setActiveTab(roleHomeRoute[role]);
    setViewMode("app");
  };
  return <StaffLoginPage onLoginSuccess={handleLoginSuccess} />;
};

/** Wrapper for PatientLoginPage that provides required props from EmrContext. */
const PatientLoginPageWrapper: React.FC = () => {
  const { setActiveTab, setRole, setViewMode } = useEmr();
  const handleLoginSuccess = (role: typeof ROLES.Patient) => {
    setRole(role);
    setActiveTab(roleHomeRoute[role]);
    setViewMode("app");
  };
  return <PatientLoginPage onLoginSuccess={handleLoginSuccess} />;
};

/** Wrapper for PatientRegisterPage that provides required props from EmrContext. */
const PatientRegisterPageWrapper: React.FC = () => <PatientRegisterPage />;

/** Resolve the facility label with safe defaults when context has not loaded yet. */
const defaultFacilityCode = "CAREVIA";
const facilityLabel = (code?: string): string => (code?.startsWith("UATH") ? "UATH" : defaultFacilityCode);

const FloatingDemoSwitcher: React.FC = () => {
  const { viewMode, setViewMode, setIsTourOpen } = useEmr();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 bg-slate-900/95 text-white backdrop-blur-md border border-slate-700/80 p-2 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center gap-1 pl-1 pr-2 border-r border-slate-700/80">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-300 font-bold hidden sm:inline">
          View Mode
        </span>
      </div>

      <button
        onClick={() => setViewMode("landing")}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
          viewMode === "landing"
            ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md shadow-teal-500/30"
            : "text-slate-300 hover:text-white hover:bg-slate-800"
        }`}
        title="Public Hospital Website"
      >
        <Globe className="w-3.5 h-3.5" />
        <span>Landing Page</span>
      </button>

      {/* Stable auth entrypoints (URL-first) */}
      <button
        onClick={() => {
          setViewMode("auth");
          window.location.href = "/login";
        }}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
          viewMode === "auth" || window.location.pathname.startsWith("/login")
            ? "bg-gradient-to-r from-[#006837] to-[#00542c] text-white shadow-md shadow-emerald-900/30"
            : "text-slate-300 hover:text-white hover:bg-slate-800"
        }`}
        title="Staff Sign In"
      >
        <Lock className="w-3.5 h-3.5" />
        <span>Staff Login</span>
      </button>

      {/* Patient login / register — same form as on their dedicated routes */}
      <button
        onClick={() => {
          if (window.location.pathname.startsWith("/patient")) return; // already on patient page
          setViewMode("auth");
          window.location.href = "/patient/login";
        }}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
          window.location.pathname.startsWith("/patient")
            ? "bg-gradient-to-r from-[#006837]/20 to-[#004724]/20 text-emerald-300 shadow-md shadow-emerald-900/20"
            : "text-slate-300 hover:text-white hover:bg-slate-800"
        }`}
        title="Patients Access or Registration"
      >
        <UserCircle className="w-3.5 h-3.5" />
        <span>{window.location.pathname.startsWith("/patient") ? "Portal Login" : "Patient Sign In"}</span>
      </button>

      <button
        onClick={() => setViewMode("app")}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
          viewMode === "app"
            ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-md shadow-cyan-500/30"
            : "text-slate-300 hover:text-white hover:bg-slate-800"
        }`}
        title="Clinical EMR Workstation"
      >
        <LayoutDashboard className="w-3.5 h-3.5" />
        <span>EMR Workstation</span>
      </button>

      <button
        onClick={() => setIsTourOpen(true)}
        className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition-all flex items-center gap-1 ml-1"
        title="Launch Interactive 8-Step Hospital Simulation"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: "4s" }} />
        <span className="hidden md:inline">8-Step Demo</span>
      </button>
    </div>
  );
};

const MainContent: React.FC = () => {
  const { activeTab, role, setActiveTab } = useEmr();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isScreenAllowed = canAccessTab(role, activeTab);

  const renderCurrentView = () => {
    if (!isScreenAllowed) {
      return (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4 max-w-lg mx-auto mt-12">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Access Restricted by Authorization Policy
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Your active role (<strong className="text-slate-800">{role}</strong>) does not have
              permission to access the <strong>{activeTab.toUpperCase()}</strong> screen.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 text-[11px] text-slate-600 border border-slate-200">
            Per system rules, doctors cannot take payments, cashiers and receptionists cannot view
            clinical notes, and nurses cannot prescribe medications.
          </div>
          <button
            onClick={() => setActiveTab("overview")}
            className="px-5 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-md shadow-teal-600/20"
          >
            Return to Allowed Overview
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case "overview":
        return <OverviewView />;
      case "patients":
        return <PatientDirectoryView />;
      case "appointments":
        return <AppointmentsView />;
      case "encounters":
        return <DoctorConsultationView />;
      case "nurse":
        return <NurseQueueView />;
      case "doctor":
        return <DoctorConsultationView />;
      case "labs":
        return <LabsView />;
      case "billing":
        return <BillingView />;
      case "reports":
      case "audit":
      case "staff":
        return role === ROLES.SuperAdmin
          ? <SuperAdminDashboardView />
          : <AdminReportsView />;
      case "settings":
        return <SettingsView />;
      case "portal":
        return <PatientPortalView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onToggleMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderCurrentView()}
        </main>
      </div>

      {/* Interactive Simulation Walkthrough Modal */}
      {role !== ROLES.SuperAdmin && <WorkflowSimulatorModal />}

      {/* Quick Command Palette (Ctrl+K) */}
      <CommandPalette />
    </div>
  );
};

const RootApp: React.FC = () => {
  return (
    <>
      <ToastContainer />
      <AuthRouteGuard>
        <Routes>
          <Route path="/login" element={<StaffLoginPageWrapper />} />
          <Route path="/patient/login" element={<PatientLoginPageWrapper />} />
          <Route path="/patient/register" element={<PatientRegisterPageWrapper />} />
          <Route path="/change-password" element={<ChangePasswordView />} />
          <Route path="/logout" element={<LogoutRoute />} />
          <Route path="*" element={<AppRoutes />} />
        </Routes>
      </AuthRouteGuard>
    </>
  );
};

const LogoutRoute: React.FC = () => {
  const { signOut } = useEmr();
  const navigate = useNavigate();

  useEffect(() => {
    signOut();
    navigate("/login", { replace: true });
  }, [navigate, signOut]);

  return <div role="status" className="min-h-screen grid place-items-center text-sm text-slate-600">Signing out…</div>;
};

/** Default router root: staff login / patient login / patient register + fallback. */
const DefaultLanding: React.FC = () => {
  const { setViewMode } = useEmr();
  return (
    <div className="relative min-h-screen">
      <FloatingDemoSwitcher />
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<StaffLoginPageWrapper />} />
        <Route path="/patient/login" element={<PatientLoginPageWrapper />} />
        <Route path="/patient/register" element={<PatientRegisterPageWrapper />} />
        <Route
          path="*"
          element={
            <HospitalLandingPage
              onEnterEmr={() => setViewMode("app")}
              onOpenAuth={() => setViewMode("auth")}
            />
          }
        />
      </Routes>
    </div>
  );
};

const appRouter = createBrowserRouter([
  {
    path: "*",
    element: (
      <EmrProvider>
        <RootApp />
      </EmrProvider>
    ),
    children: [
      { path: "login", element: <StaffLoginPageWrapper /> },
      { path: "patient/login", element: <PatientLoginPageWrapper /> },
      { path: "patient/register", element: <PatientRegisterPageWrapper /> },
    ],
  },
]);

/** Per-route body rendered when no auth match — handles landing and app shells. */
function AppRoutes() {
  const { viewMode, role, isRoleLoading, activeTab, setActiveTab } = useEmr();
  const location = useLocation();
  const isAppPath = location.pathname === "/app" || location.pathname.startsWith("/app/");
  const lastRouteSync = useRef("");

  useEffect(() => {
    if (!role) return;
    const routeKey = `${role}:${location.pathname}:${location.search}`;
    const requestedTab = new URLSearchParams(location.search).get("tab");
    if (
      requestedTab
      && canAccessTab(role, requestedTab)
      && lastRouteSync.current !== routeKey
    ) {
      lastRouteSync.current = routeKey;
      setActiveTab(requestedTab);
      return;
    }
    if (!canAccessTab(role, activeTab)) {
      setActiveTab(roleHomeRoute[role]);
      return;
    }
    lastRouteSync.current = routeKey;
  }, [activeTab, location.pathname, location.search, role, setActiveTab]);

  if (viewMode === "landing" && !isAppPath) {
    return <Landing />;
  }
  if (viewMode === "auth") {
    return <Navigate to="/login" replace />;
  }
  if (!role) {
    return isRoleLoading
      ? <div className="min-h-screen grid place-items-center text-sm text-slate-600" role="status">Checking your session…</div>
      : <Navigate to="/login" replace />;
  }
  return <MainContent />;
}

/** Public entrypage that keeps the old shell buttons working alongside React Router. */
const Landing: React.FC = () => {
  const { setViewMode } = useEmr();
  return (
    <div className="relative min-h-screen">
      <FloatingDemoSwitcher />
      <ToastContainer />
      <HospitalLandingPage
        onEnterEmr={() => setViewMode("app")}
        onOpenAuth={() => setViewMode("auth")}
      />
    </div>
  );
};

export default function App() {
  // Register public route checker for 401 interceptor
  useEffect(() => {
    setPublicRouteChecker(() => {
      const path = window.location.pathname;
      return path === "/login" || path === "/patient/login" || path === "/patient/register";
    });
    return () => setPublicRouteChecker(null);
  }, []);

  return <RouterProvider router={appRouter} />;
}
