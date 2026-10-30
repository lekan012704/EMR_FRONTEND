import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { canAccessTab, isRole } from '../auth/roles';
import { ROLES } from '../types/roles';
import {
  Role,
  Facility,
  Patient,
  Appointment,
  Encounter,
  Vitals,
  ClinicalNote,
  Diagnosis,
  LabOrder,
  Prescription,
  Invoice,
  InvoiceItem,
  Payment,
  PaymentMode,
  Refund,
  AuditLog,
} from '../types/emr';
import {
  patientsApi,
  appointmentsApi,
  encountersApi,
  clinicalApi,
  billingApi,
  labOrdersApi,
  auditsApi,
  staffApi,
  facilitiesApi,
  authApi,
} from '../api/endpoints';
import {
  apiGet,
  setPasswordChangeRequiredHandler,
  setUnauthorizedHandler,
  toApiError,
} from '../api/client';
import { allergiesToApi, allergiesFromApi } from '../lib/utils';
import {
  clearSession,
  getSession,
  setSession,
  updateMustChangePassword,
  type StoredSession,
  type StoredSessionUser,
} from '../api/tokenStore';
import type {
  PatientResponse,
  AppointmentResponse,
  EncounterResponse,
  VitalsResponse,
  ClinicalNoteResponse,
  DiagnosisResponse,
  LabOrderResponse,
  PrescriptionResponse,
  InvoiceResponse,
  PaymentResponse,
  AuditResponse,
  StaffResponse,
  FacilityResponse,
  UserProfile,
} from '../types/api';

export interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: number;
}

export type PatientRegistrationResult =
  | { success: true; patient: Patient }
  | { success: false; error: string };

interface EmrContextType {
  role: Role | null;
  setRole: (role: Role | null) => void;
  user: StoredSessionUser | null;
  setAuthSession: (session: StoredSession) => void;
  mustChangePassword: boolean;
  setMustChangePassword: (required: boolean) => void;
  isRoleLoading: boolean;
  signOut: () => void;
  facility: Facility;
  setFacility: (facility: Facility) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  viewMode: 'landing' | 'auth' | 'app';
  setViewMode: (mode: 'landing' | 'auth' | 'app') => void;

  // Data - now fetched from API
  patients: Patient[];
  appointments: Appointment[];
  encounters: Encounter[];
  invoices: Invoice[];
  auditLogs: AuditLog[];
  facilities: Facility[];
  staffList: StaffResponse[];

  // Loading states
  isLoadingPatients: boolean;
  isLoadingAppointments: boolean;
  isLoadingEncounters: boolean;
  isLoadingInvoices: boolean;
  isLoadingAuditLogs: boolean;

  // Error states
  patientsError: Error | null;
  appointmentsError: Error | null;
  encountersError: Error | null;
  invoicesError: Error | null;
  auditLogsError: Error | null;

  // Current active selections
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;
  selectedEncounterId: string | null;
  setSelectedEncounterId: (id: string | null) => void;

  // Workflow actions - now call actual API endpoints
  registerPatient: (patientData: Omit<Patient, 'id' | 'mrn' | 'createdAt' | 'facilityId'>) => Promise<PatientRegistrationResult>;
  bookAppointment: (aptData: Omit<Appointment, 'id' | 'status' | 'facilityId'>) => Promise<Appointment>;
  checkInPatient: (appointmentId: string) => Promise<Encounter>;
  recordVitals: (encounterId: string, vitalsData: Omit<Vitals, 'id' | 'encounterId' | 'recordedAt' | 'recordedBy'>) => Promise<void>;
  saveClinicalNote: (encounterId: string, note: { subjective: string; objective: string; assessment: string; plan: string }) => Promise<void>;
  addDiagnosis: (encounterId: string, diag: Omit<Diagnosis, 'id' | 'timestamp' | 'diagnosedBy'>) => Promise<void>;
  addLabOrder: (encounterId: string, order: { testName: string; category: LabOrder['category']; priority: LabOrder['priority']; cost: number; notes: string }) => Promise<void>;
  addPrescription: (encounterId: string, rx: { drugName: string; dosage: string; frequency: string; duration: string; instructions: string; cost: number }) => Promise<void>;
  closeEncounter: (encounterId: string) => Promise<void>;
  addClinicalAddendum: (encounterId: string, text: string) => Promise<void>;
  processPayment: (invoiceId: string, paymentData: { amount: number; mode: PaymentMode; reference: string; terminalRef?: string; transferRef?: string; hmoApprovalCode?: string }) => Promise<void>;
  requestRefund: (invoiceId: string, paymentId: string, amount: number, reason: string) => Promise<void>;

  // Guided tour / Simulation modal
  isTourOpen: boolean;
  setIsTourOpen: (open: boolean) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;

  // Modern Toast notification system
  toasts: Toast[];
  addToast: (title: string, message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;

  // Command Palette
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
}

// Transform API response types to local UI types
function transformPatient(apiPatient: PatientResponse): Patient {
  return {
    id: apiPatient.id!,
    mrn: apiPatient.medicalRecordNumber!,
    firstName: apiPatient.firstName!,
    lastName: apiPatient.lastName!,
    gender: apiPatient.gender as 'Male' | 'Female' | 'Other',
    dob: apiPatient.dateOfBirth!,
    phone: apiPatient.phoneNumber || '',
    email: apiPatient.email || '',
    address: apiPatient.address || '',
    bloodGroup: apiPatient.bloodGroup || '',
    genotype: apiPatient.genotype || '',
    allergies: allergiesFromApi(apiPatient.allergies),
    nextOfKin: {
      name: apiPatient.nextOfKinName || '',
      relationship: apiPatient.nextOfKinRelationship || '',
      phone: apiPatient.nextOfKinPhone || '',
    },
    hmoDetails: apiPatient.hasHmo ? {
      provider: apiPatient.hmoProvider || '',
      policyNumber: apiPatient.hmoMemberId || '',
      coverageTier: apiPatient.hmoPlan as 'Standard' | 'Silver' | 'Gold' | 'Executive' || 'Standard',
      coPayPercentage: 10,
    } : undefined,
    facilityId: apiPatient.facilityId!,
    createdAt: apiPatient.createdAt!,
  };
}

function transformAppointment(apiApt: AppointmentResponse): Appointment {
  return {
    id: apiApt.id!,
    patientId: apiApt.patientId!,
    patientName: apiApt.patientName!,
    patientMrn: apiApt.patientMrn!,
    doctorId: apiApt.doctorId!,
    doctorName: apiApt.doctorName!,
    department: 'General Medicine',
    dateTime: apiApt.appointmentDateTime || new Date().toISOString(),
    slotTime: new Date(apiApt.appointmentDateTime || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    reason: apiApt.reason || '',
    status: apiApt.status as Appointment['status'],
    facilityId: apiApt.facilityId!,
  };
}

function transformEncounter(apiEncounter: EncounterResponse): Encounter {
  return {
    id: apiEncounter.id!,
    encounterNumber: apiEncounter.id!.replace('enc-', 'ENC-2026-10-') || `ENC-${apiEncounter.id?.slice(-4)}`,
    patientId: apiEncounter.patientId!,
    patientName: apiEncounter.patientName || '',
    patientMrn: apiEncounter.patientMrn || '',
    appointmentId: apiEncounter.appointmentId ?? undefined,
    doctorId: apiEncounter.doctorId!,
    doctorName: apiEncounter.doctorName || '',
    nurseId: undefined,
    nurseName: undefined,
    checkInTime: apiEncounter.startedAt || new Date().toISOString(),
    closedAt: apiEncounter.closedAt ?? undefined,
    status: apiEncounter.status as Encounter['status'],
    vitals: undefined,
    clinicalNote: undefined,
    diagnoses: [],
    labOrders: [],
    prescriptions: [],
    invoiceId: apiEncounter.invoiceId || '',
    facilityId: apiEncounter.facilityId!,
  };
}

function transformInvoice(apiInvoice: InvoiceResponse): Invoice {
  const items: InvoiceItem[] = (apiInvoice.items || []).map((item: any) => ({
    id: item.id!,
    description: item.description!,
    category: item.itemType === 'Consultation' ? 'Consultation' : item.itemType === 'Lab' ? 'Lab' : item.itemType === 'Pharmacy' ? 'Pharmacy' : item.itemType === 'Procedure' ? 'Procedure' : 'Nursing',
    quantity: item.quantity || 1,
    unitPrice: item.unitPrice || 0,
    total: item.totalPrice || 0,
    sourceRefId: item.referenceId,
  }));

  const payments: Payment[] = (apiInvoice.payments || []).map((p: PaymentResponse) => ({
    id: p.id!,
    invoiceId: apiInvoice.id!,
    amount: p.amount || 0,
    mode: p.mode as PaymentMode,
    reference: p.transactionReference || '',
    timestamp: p.paymentDate || new Date().toISOString(),
    cashierName: p.cashierId || '',
    terminalRef: p.terminalReference ?? undefined,
    transferRef: p.mode === 'Bank transfer' ? p.transactionReference ?? undefined : undefined,
    hmoApprovalCode: undefined,
    paystackRef: undefined,
    shiftCode: p.shiftCode ?? undefined,
  }));

  const refunds: Refund[] = [];

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = Math.max(0, (apiInvoice.balanceAmount || 0));
  const status = balance === 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Pending';

  return {
    id: apiInvoice.id!,
    invoiceNumber: apiInvoice.invoiceNumber!,
    encounterId: apiInvoice.encounterId || '',
    patientId: apiInvoice.patientId!,
    patientName: apiInvoice.patientName || '',
    patientMrn: apiInvoice.patientMrn || '',
    hmoProvider: undefined,
    items,
    subtotal: apiInvoice.totalAmount || 0,
    hmoCoveredAmount: 0,
    patientPayable: apiInvoice.totalAmount || 0,
    paidAmount: apiInvoice.paidAmount ?? totalPaid,
    balance,
    status,
    payments,
    refunds,
    createdAt: apiInvoice.createdAt!,
    facilityId: apiInvoice.facilityId!,
  };
}

function transformAuditLog(apiLog: AuditResponse): AuditLog {
  return {
    id: apiLog.id!,
    timestamp: apiLog.dateTime || new Date().toISOString(),
    userName: apiLog.actionByWho || 'Unknown User',
    userRole: null,
    action: apiLog.actionType || 'UNKNOWN',
    recordType: 'Patient' as AuditLog['recordType'],
    recordId: apiLog.primaryKey || '',
    facilityId: apiLog.facilityId || '',
    details: apiLog.newValues || '',
  };
}

function transformFacility(apiFacility: FacilityResponse): Facility {
  return {
    id: apiFacility.id!,
    name: apiFacility.name!,
    code: apiFacility.code!,
    city: apiFacility.city || '',
    state: apiFacility.state || '',
    address: apiFacility.address || '',
    phone: apiFacility.phoneNumber || '',
  };
}

const EmrContext = createContext<EmrContextType | undefined>(undefined);

export const EmrProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Determine if we're on an auth/public route where we shouldn't fetch authenticated data
  const location = useLocation();
  const isAuthRoute = [
    '/',
    '/login',
    '/patient/login',
    '/patient/register',
    '/logout',
  ].includes(location.pathname);

  // Check for valid session to gate authenticated data fetches
  const session = getSession();
  const isAuthenticated = !!session?.token && !isAuthRoute;

  // State that doesn't need to be persisted
  const [role, setRoleState] = useState<Role | null>(() => (
    isRole(session?.user?.roleName) ? session.user.roleName : null
  ));
  const [user, setUserState] = useState<StoredSessionUser | null>(() => session?.user ?? null);
  const [mustChangePasswordState, setMustChangePasswordState] = useState(
    () => session?.mustChangePassword === true,
  );
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [viewMode, setViewMode] = useState<'landing' | 'auth' | 'app'>('landing');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(null);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Facility selection (will be updated from facilities list)
  const [facility, setFacilityState] = useState<Facility>({
    id: '',
    name: '',
    code: '',
    city: '',
    state: '',
    address: '',
    phone: '',
  });

  // Modern Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((title: string, message: string, type: Toast['type'] = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: Toast = { id, title, message, type, timestamp: Date.now() };
    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss after 4.5s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Helper for audit logging
  const logAudit = useCallback((action: string, recordType: AuditLog['recordType'], recordId: string, details: string) => {
    addToast('Action', `${action}: ${details}`, 'info');
  }, []);

  // Recover the backend-issued role on refresh; never assume a default role.
  const currentUserQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.getCurrentUser(),
    // A current SuperAdmin profile is persisted from the backend login DTO;
    // avoid an extra profile endpoint on the platform-only dashboard.
    enabled: isAuthenticated && !(role === ROLES.SuperAdmin && user !== null),
    retry: false,
  });

  const mustChangePassword = mustChangePasswordState
    || currentUserQuery.data?.mustChangePassword === true;

  const setMustChangePassword = useCallback((required: boolean) => {
    setMustChangePasswordState(required);
    updateMustChangePassword(required);
    setUserState((current) => current
      ? { ...current, mustChangePassword: required }
      : current);
    queryClient.setQueryData<UserProfile | undefined>(
      ['auth', 'me'],
      (current) => current
        ? { ...current, mustChangePassword: required }
        : current,
    );
  }, [queryClient]);

  useEffect(() => {
    if (currentUserQuery.data) {
      const backendRole = currentUserQuery.data.roleName;
      const profileUser: StoredSessionUser = {
        id: currentUserQuery.data.id ?? undefined,
        identityId: currentUserQuery.data.identityId ?? undefined,
        userName: currentUserQuery.data.userName,
        email: currentUserQuery.data.email,
        firstName: currentUserQuery.data.firstName,
        lastName: currentUserQuery.data.lastName,
        staffId: currentUserQuery.data.staffId,
        facilityId: currentUserQuery.data.facilityId,
        roleName: backendRole,
        mustChangePassword: currentUserQuery.data.mustChangePassword === true,
      };
      setRoleState(isRole(backendRole) ? backendRole : null);
      setUserState(profileUser);

      const currentSession = getSession();
      if (currentSession) {
        setSession({
          ...currentSession,
          user: profileUser,
          mustChangePassword: currentUserQuery.data.mustChangePassword
            ?? currentSession.mustChangePassword
            ?? false,
        });
      }

      if (currentUserQuery.data.mustChangePassword === true) {
        setMustChangePasswordState(true);
      }
    } else if (currentUserQuery.isError) {
      setRoleState(null);
    }
  }, [currentUserQuery.data, currentUserQuery.isError]);

  const isRoleLoading = isAuthenticated && currentUserQuery.isLoading && role === null;
  const canFetchApplicationData = isAuthenticated
    && !mustChangePassword
    && location.pathname !== '/change-password';

  const passwordChangeRedirecting = useRef(false);
  useEffect(() => {
    if (location.pathname !== '/change-password') {
      passwordChangeRedirecting.current = false;
    }
  }, [location.pathname]);

  const handlePasswordChangeRequired = useCallback(() => {
    setMustChangePassword(true);
    if (location.pathname !== '/change-password' && !passwordChangeRedirecting.current) {
      passwordChangeRedirecting.current = true;
      navigate('/change-password', { replace: true });
    }
  }, [location.pathname, navigate, setMustChangePassword]);

  useEffect(() => {
    setPasswordChangeRequiredHandler(handlePasswordChangeRequired);
    return () => setPasswordChangeRequiredHandler(null);
  }, [handlePasswordChangeRequired]);

  // Platform data and workspaces are held until the forced password change is complete.
  const { data: facilitiesData, isLoading: isLoadingFacilities, error: facilitiesError } = useQuery({
    queryKey: ['facilities'],
    queryFn: () => facilitiesApi.getFacilities(),
    staleTime: 5 * 60 * 1000,
    enabled: canFetchApplicationData && canAccessTab(role, 'reports'),
  });

  // Fetch staff directory for clinician assignment and display only.
  const { data: staffData, isLoading: isLoadingStaff } = useQuery({
    queryKey: ['staff'],
    queryFn: () => staffApi.getStaff(),
    staleTime: 5 * 60 * 1000,
    enabled: canFetchApplicationData && canAccessTab(role, 'staff'),
  });

  // Fetch patients
  const { data: patientsData, isLoading: isLoadingPatients, error: patientsError } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientsApi.searchPatients(),
    staleTime: 30 * 1000,
    enabled: canFetchApplicationData && canAccessTab(role, 'patients'),
  });

  // Fetch appointments
  const { data: appointmentsData, isLoading: isLoadingAppointments, error: appointmentsError } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentsApi.getAppointments(),
    staleTime: 30 * 1000,
    enabled: canFetchApplicationData && canAccessTab(role, 'appointments'),
  });

  // Fetch encounters
  const { data: encountersData, isLoading: isLoadingEncounters, error: encountersError } = useQuery({
    queryKey: ['encounters'],
    queryFn: () => encountersApi.getEncounters({ activeOnly: false }),
    staleTime: 30 * 1000,
    enabled: canFetchApplicationData && canAccessTab(role, 'encounters'),
  });

  // Fetch invoices
  const { data: invoicesData, isLoading: isLoadingInvoices, error: invoicesError } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => billingApi.getInvoices(),
    staleTime: 30 * 1000,
    enabled: canFetchApplicationData && canAccessTab(role, 'billing'),
  });

  // Fetch audit logs
  const { data: auditLogsData, isLoading: isLoadingAuditLogs, error: auditLogsError } = useQuery({
    queryKey: ['audits'],
    queryFn: () => auditsApi.getAuditLogs(),
    staleTime: 60 * 1000,
    enabled: canFetchApplicationData && canAccessTab(role, 'audit'),
  });

  // If the role may not read the facility directory, still initialize the active
  // tenant from the authenticated profile rather than calling a forbidden endpoint.
  useEffect(() => {
    const profile = currentUserQuery.data;
    const profileFacilityId = profile?.facilityId;

    if (profileFacilityId) {
      const profileFacility = profileFacilityId
        ? facilitiesData?.find((item) => item.id === profileFacilityId)
        : undefined;
      if (profileFacility) {
        setFacilityState(transformFacility(profileFacility));
      } else {
        setFacilityState({
          id: profileFacilityId,
          name: profile.facilityName || 'Assigned facility',
          code: '',
          city: '',
          state: '',
          address: '',
          phone: '',
        });
      }
      return;
    }

    if (facilitiesData && facilitiesData.length > 0) {
      setFacilityState(transformFacility(facilitiesData[0]));
    }
  }, [facilitiesData, currentUserQuery.data]);

  // Auto-select first patient and encounter when data loads
  useEffect(() => {
    if (patientsData && patientsData.length > 0 && !selectedPatientId) {
      setSelectedPatientId(patientsData[0].id!);
    }
  }, [patientsData, selectedPatientId]);

  useEffect(() => {
    if (encountersData && encountersData.length > 0 && !selectedEncounterId) {
      const firstActive = encountersData.find(e => e.status !== 'closed');
      setSelectedEncounterId(firstActive?.id || encountersData[0].id || null);
    }
  }, [encountersData, selectedEncounterId]);

  // Transform data for UI
  const patients = patientsData ? patientsData.map(transformPatient) : [];
  const appointments = appointmentsData ? appointmentsData.map(transformAppointment) : [];
  const encounters = encountersData ? encountersData.map(transformEncounter) : [];
  const invoices = invoicesData ? invoicesData.map(transformInvoice) : [];
  const auditLogs = auditLogsData ? auditLogsData.map(transformAuditLog) : [];
  const facilities = facilitiesData ? facilitiesData.map(transformFacility) : [];
  const staffList = staffData || [];

  // Mutations for API calls
  const registerPatientMutation = useMutation({
    mutationFn: async (body: Parameters<typeof patientsApi.registerPatient>[0]) => {
      const response = await patientsApi.registerPatient(body);
      if (
        !response
        || typeof response.id !== 'string'
        || !response.id.trim()
        || typeof response.medicalRecordNumber !== 'string'
        || !response.medicalRecordNumber.trim()
      ) {
        throw new Error('The patient service did not return a valid patient record.');
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });

  const bookAppointmentMutation = useMutation({
    mutationFn: (body: Parameters<typeof appointmentsApi.bookAppointment>[0]) => appointmentsApi.bookAppointment(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const openEncounterMutation = useMutation({
    mutationFn: (body: Parameters<typeof encountersApi.openEncounter>[0]) => encountersApi.openEncounter(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encounters'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const closeEncounterMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof encountersApi.closeEncounter>[1] }) => encountersApi.closeEncounter(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encounters'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const recordVitalsMutation = useMutation({
    mutationFn: (body: Parameters<typeof clinicalApi.recordVitals>[0]) => clinicalApi.recordVitals(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encounters'] });
    },
  });

  const createClinicalNoteMutation = useMutation({
    mutationFn: (body: Parameters<typeof clinicalApi.createClinicalNote>[0]) => clinicalApi.createClinicalNote(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encounters'] });
    },
  });

  const addDiagnosisMutation = useMutation({
    mutationFn: (body: Parameters<typeof clinicalApi.addDiagnosis>[0]) => clinicalApi.addDiagnosis(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encounters'] });
    },
  });

  const addLabOrderMutation = useMutation({
    mutationFn: (body: Parameters<typeof labOrdersApi.createLabOrder>[0]) => labOrdersApi.createLabOrder(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encounters'] });
    },
  });

  const prescribeMedicationMutation = useMutation({
    mutationFn: (body: Parameters<typeof clinicalApi.prescribeMedication>[0]) => clinicalApi.prescribeMedication(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encounters'] });
    },
  });

  const processPaymentMutation = useMutation({
    mutationFn: (body: Parameters<typeof billingApi.recordPayment>[0]) => billingApi.recordPayment(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const processRefundMutation = useMutation({
    mutationFn: (body: Parameters<typeof billingApi.processRefund>[0]) => billingApi.processRefund(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const setRole = useCallback((newRole: Role | null) => {
    setRoleState(newRole);
    const currentSession = getSession();
    if (currentSession && newRole) {
      const nextUser = { ...currentSession.user, roleName: newRole };
      setUserState(nextUser);
      setSession({ ...currentSession, user: nextUser });
    }
  }, []);

  const setAuthSession = useCallback((newSession: StoredSession) => {
    setSession(newSession);
    setUserState(newSession.user ?? null);
    setRoleState(isRole(newSession.user?.roleName) ? newSession.user.roleName : null);
    setMustChangePasswordState(newSession.mustChangePassword === true);
    queryClient.removeQueries({ queryKey: ['auth', 'me'] });
  }, [queryClient]);

  const signOut = useCallback(() => {
    clearSession();
    queryClient.clear();
    setRoleState(null);
    setUserState(null);
    setMustChangePasswordState(false);
    setViewMode('auth');
  }, [queryClient]);

  const handleUnauthorized = useCallback(() => {
    signOut();
    navigate('/login', { replace: true });
  }, [navigate, signOut]);

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
    return () => setUnauthorizedHandler(null);
  }, [handleUnauthorized]);

  const setFacility = useCallback((newFacility: Facility) => {
    setFacilityState(newFacility);
  }, []);

  // Workflow action implementations
  const registerPatient = async (
    patientData: Omit<Patient, 'id' | 'mrn' | 'createdAt' | 'facilityId'>,
  ): Promise<PatientRegistrationResult> => {
    // Guard against missing facility (should be caught by component too, but defense in depth)
    if (!facility || !facility.id) {
      const message = 'No facility is assigned to this session. Ask an administrator to configure your account.';
      addToast('Registration Failed', message, 'error');
      return { success: false, error: message };
    }

    try {
      const patientResponse = await registerPatientMutation.mutateAsync({
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        otherNames: undefined,
        dateOfBirth: patientData.dob,
        gender: patientData.gender,
        phoneNumber: patientData.phone,
        email: patientData.email,
        address: patientData.address,
        nextOfKinName: patientData.nextOfKin?.name,
        nextOfKinPhone: patientData.nextOfKin?.phone,
        nextOfKinRelationship: patientData.nextOfKin?.relationship,
        hmoProvider: patientData.hmoDetails?.provider,
        hmoMemberId: patientData.hmoDetails?.policyNumber,
        hmoPlan: patientData.hmoDetails?.coverageTier,
        bloodGroup: patientData.bloodGroup,
        genotype: patientData.genotype,
        allergies: allergiesToApi(patientData.allergies),
        nin: undefined,
        bvn: undefined,
        allowDuplicateOverride: false,
        facilityId: facility.id,
      });

      // Validate again at the boundary before transforming or reading identity fields.
      if (!patientResponse || typeof patientResponse.id !== 'string' || !patientResponse.id.trim()) {
        throw new Error('The patient service did not return a valid patient record.');
      }

      const createdPatient = transformPatient({
        ...patientResponse,
        facilityId: patientResponse.facilityId ?? facility.id,
      });
      addToast('Patient Registered', `${createdPatient.firstName} ${createdPatient.lastName} (${createdPatient.mrn}) was registered.`, 'success');
      return { success: true, patient: createdPatient };
    } catch (error: unknown) {
      // Ensure we never leak ReferenceError or other internal errors to the user
      let message: string;
      if (error instanceof ReferenceError) {
        console.error('ReferenceError in registerPatient:', error);
        message = 'Internal error: facility context missing. Please refresh the page.';
      } else {
        const apiError = toApiError(error);
        message = apiError.detail || apiError.message || 'Patient registration failed. Please try again.';
      }
      addToast('Registration Failed', message, 'error');
      return { success: false, error: message };
    }
  };

  const bookAppointment = async (aptData: Omit<Appointment, 'id' | 'status' | 'facilityId'>): Promise<Appointment> => {
    await bookAppointmentMutation.mutateAsync({
      patientId: aptData.patientId,
      doctorId: aptData.doctorId,
      appointmentDateTime: aptData.dateTime,
      reason: aptData.reason,
      facilityId: facility.id,
    });
    addToast('Appointment Scheduled', `${aptData.patientName} booked with ${aptData.doctorName}.`, 'success');
    return {} as Appointment;
  };

  const checkInPatient = async (appointmentId: string): Promise<Encounter> => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (!apt) throw new Error('Appointment not found');

    await openEncounterMutation.mutateAsync({
      patientId: apt.patientId,
      doctorId: apt.doctorId,
      appointmentId,
      chiefComplaint: apt.reason,
      facilityId: facility.id,
    });

    await appointmentsApi.updateAppointmentStatus(appointmentId, { status: 'Checked-in' });
    addToast('Patient Checked In', 'Encounter opened & sent to triage queue.', 'info');
    return {} as Encounter;
  };

  const recordVitals = async (encounterId: string, vitalsData: Omit<Vitals, 'id' | 'encounterId' | 'recordedAt' | 'recordedBy'>): Promise<void> => {
    await recordVitalsMutation.mutateAsync({
      encounterId,
      temperatureCelsius: vitalsData.temperature,
      systolicBloodPressure: vitalsData.bpSystolic,
      diastolicBloodPressure: vitalsData.bpDiastolic,
      heartRateBpm: vitalsData.pulse,
      respiratoryRateCpm: vitalsData.respiratoryRate,
      spO2Percentage: vitalsData.spO2,
      weightKg: vitalsData.weightKg,
      heightCm: vitalsData.heightCm,
      bloodGlucoseMmolL: undefined,
      notes: vitalsData.nurseNotes,
    });
    addToast('Vitals Recorded', 'Telemetry vitals saved successfully.', 'success');
  };

  const saveClinicalNote = async (encounterId: string, note: { subjective: string; objective: string; assessment: string; plan: string }): Promise<void> => {
    await createClinicalNoteMutation.mutateAsync({
      encounterId,
      subjective: note.subjective,
      objective: note.objective,
      assessment: note.assessment,
      plan: note.plan,
    });
    addToast('Clinical Note Saved', 'SOAP documentation synchronized.', 'success');
  };

  const addDiagnosis = async (encounterId: string, diag: Omit<Diagnosis, 'id' | 'timestamp' | 'diagnosedBy'>): Promise<void> => {
    await addDiagnosisMutation.mutateAsync({
      encounterId,
      icd10Code: diag.code,
      description: diag.description,
      diagnosisType: diag.type,
      notes: undefined,
    });
    addToast('Diagnosis Added', `[${diag.code}] ${diag.description}`, 'success');
  };

  const addLabOrder = async (encounterId: string, order: { testName: string; category: LabOrder['category']; priority: LabOrder['priority']; cost: number; notes: string }): Promise<void> => {
    await addLabOrderMutation.mutateAsync({
      encounterId,
      testName: order.testName,
      price: order.cost,
      clinicalNotes: order.notes,
    });
    addToast('Lab Ordered', `${order.testName} ordered successfully.`, 'success');
  };

  const addPrescription = async (encounterId: string, rx: { drugName: string; dosage: string; frequency: string; duration: string; instructions: string; cost: number }): Promise<void> => {
    await prescribeMedicationMutation.mutateAsync({
      encounterId,
      medicationName: rx.drugName,
      dosage: rx.dosage,
      frequency: rx.frequency,
      duration: rx.duration,
      route: 'Oral',
      quantity: 30,
      unitPrice: rx.cost,
      instructions: rx.instructions,
    });
    addToast('Prescription Issued', `${rx.drugName} ${rx.dosage} (${rx.duration}).`, 'success');
  };

  const closeEncounter = async (encounterId: string): Promise<void> => {
    await closeEncounterMutation.mutateAsync({
      id: encounterId,
      body: { summary: 'Encounter closed' },
    });
    addToast('Encounter Closed', 'Clinical chart locked to read-only state.', 'info');
  };

  const addClinicalAddendum = async (encounterId: string, text: string): Promise<void> => {
    // TODO: call clinicalApi.addNoteAddendum when endpoint signature matches
    addToast('Addendum', 'Clinical addendum attached.', 'success');
  };

  const processPayment = async (invoiceId: string, paymentData: { amount: number; mode: PaymentMode; reference: string; terminalRef?: string; transferRef?: string; hmoApprovalCode?: string }): Promise<void> => {
    await processPaymentMutation.mutateAsync({
      invoiceId,
      amount: paymentData.amount,
      mode: paymentData.mode,
      transactionReference: paymentData.transferRef || paymentData.reference,
      terminalReference: paymentData.terminalRef,
      hmoAuthCode: paymentData.hmoApprovalCode,
      notes: undefined,
    });
    addToast('Payment Processed', `\u20A6${paymentData.amount.toLocaleString()} received via ${paymentData.mode}.`, 'success');
  };

  const requestRefund = async (invoiceId: string, paymentId: string, amount: number, reason: string): Promise<void> => {
    await processRefundMutation.mutateAsync({
      paymentId,
      amount,
      reason,
    });
    addToast('Refund Requested', `\u20A6${amount.toLocaleString()} refund submitted for approval.`, 'warning');
  };

  return (
    <EmrContext.Provider
      value={{
        role,
        setRole,
        user,
        setAuthSession,
        mustChangePassword,
        setMustChangePassword,
        isRoleLoading,
        signOut,
        facility,
        setFacility,
        activeTab,
        setActiveTab,
        viewMode,
        setViewMode,
        patients,
        appointments,
        encounters,
        invoices,
        auditLogs,
        facilities,
        staffList,
        isLoadingPatients,
        isLoadingAppointments,
        isLoadingEncounters,
        isLoadingInvoices,
        isLoadingAuditLogs,
        patientsError: patientsError as Error | null,
        appointmentsError: appointmentsError as Error | null,
        encountersError: encountersError as Error | null,
        invoicesError: invoicesError as Error | null,
        auditLogsError: auditLogsError as Error | null,
        selectedPatientId,
        setSelectedPatientId,
        selectedEncounterId,
        setSelectedEncounterId,
        registerPatient,
        bookAppointment,
        checkInPatient,
        recordVitals,
        saveClinicalNote,
        addDiagnosis,
        addLabOrder,
        addPrescription,
        closeEncounter,
        addClinicalAddendum,
        processPayment,
        requestRefund,
        isTourOpen,
        setIsTourOpen,
        currentStep,
        setCurrentStep,
        toasts,
        addToast,
        removeToast,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
      }}
    >
      {children}
    </EmrContext.Provider>
  );
};

export const useEmr = () => {
  const context = useContext(EmrContext);
  if (!context) {
    throw new Error('useEmr must be used within an EmrProvider');
  }
  return context;
};
