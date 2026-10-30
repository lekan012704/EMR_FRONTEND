/**
 * AUTO-GENERATED from the live OpenAPI document - do not edit by hand.
 *
 * Regenerate: node scripts/gen-api.mjs
 */

import { apiGet, apiPatch, apiPost, apiPut } from './client';
import { normalizeLoginResponse } from './loginResponse';
import type { ChangePasswordResponse } from './authTypes';

import type {
  AddBloodBankUnitRequest,
  AddDiagnosisRequest,
  AddNoteAddendumRequest,
  AppointmentResponse,
  ApprovePreAuthCodeRequest,
  AuditResponse,
  BookAppointmentRequest,
  ChangePasswordRequest,
  CheckDuplicatesRequest,
  ClinicalNoteResponse,
  CloseEncounterRequest,
  CloseShiftRequest,
  CreateClinicalNoteRequest,
  CreateDrugItemRequest,
  CreateFacilityRequest,
  CreateHmoProviderRequest,
  CreateHmoTariffRequest,
  CreateLabOrderRequest,
  CrossMatchRequest,
  DiagnosisResponse,
  DispensePrescriptionRequest,
  EncounterResponse,
  FacilityResponse,
  GenerateHmoClaimBatchRequest,
  HmoAuthCodeResponse,
  InvoiceResponse,
  LabOrderResponse,
  LoginRequest,
  LoginResponse,
  OpenEncounterRequest,
  PatientHistoryResponse,
  PatientResponse,
  PaymentResponse,
  PrescribeMedicationRequest,
  PrescriptionResponse,
  ProcessRefundRequest,
  ReceiptResponse,
  ReceiveDrugBatchRequest,
  ReconcileShiftRequest,
  RecordPaymentRequest,
  RecordVitalsRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RefundResponse,
  RegisterPatientRequest,
  RegisterStaffRequest,
  RequestPreAuthCodeRequest,
  SendNotificationRequest,
  StaffResponse,
  StartShiftRequest,
  UpdateAppointmentStatusRequest,
  UpdateLabOrderStatusRequest,
  UpdatePatientRequest,
  UserProfile,
  VitalsResponse,
} from '../types/api';

export const appointmentsApi = {
  /** BookAppointment */
  bookAppointment: (body: BookAppointmentRequest) => apiPost<AppointmentResponse>(`/appointments`, body),
  /** GetAppointments */
  getAppointments: (params?: { fromDate?: string; toDate?: string; doctorId?: string; patientId?: string }) => apiGet<AppointmentResponse[]>(`/appointments`, { params }),
  /** GetAppointmentById */
  getAppointmentById: (id: string) => apiGet<AppointmentResponse>(`/appointments/${encodeURIComponent(id)}`),
  /** UpdateAppointmentStatus */
  updateAppointmentStatus: (id: string, body: UpdateAppointmentStatusRequest) => apiPatch<AppointmentResponse>(`/appointments/${encodeURIComponent(id)}/status`, body),
};

export const auditsApi = {
  /** GetAuditLogs */
  getAuditLogs: (params?: { tableName?: string; actionByWho?: string; fromDate?: string; toDate?: string; skip?: number; take?: number }) => apiGet<AuditResponse[]>(`/audits`, { params }),
};

export const authApi = {
  /** ChangePassword */
  changePassword: (body: ChangePasswordRequest) => apiPost<ChangePasswordResponse>(`/auth/change-password`, body),
  /** Login */
  login: async (body: LoginRequest) => normalizeLoginResponse(await apiPost<unknown>(`/auth/login`, body)),
  /** GetCurrentUser */
  getCurrentUser: () => apiGet<UserProfile>(`/auth/me`),
  /** RefreshToken */
  refreshToken: (body: RefreshTokenRequest) => apiPost<RefreshTokenResponse>(`/auth/refresh`, body),
};

export const billingApi = {
  /** StartCashierShift */
  startCashierShift: (body: StartShiftRequest) => apiPost<void>(`/billing/shifts/start`, body),
  /** CloseCashierShift */
  closeCashierShift: (id: string, body: CloseShiftRequest) => apiPost<void>(`/billing/shifts/${encodeURIComponent(id)}/close`, body),
  /** ReconcileCashierShift */
  reconcileCashierShift: (id: string, body: ReconcileShiftRequest) => apiPost<void>(`/billing/shifts/${encodeURIComponent(id)}/reconcile`, body),
  /** GetCashierShifts */
  getCashierShifts: (params?: { status?: string }) => apiGet<void>(`/billing/shifts`, { params }),
  /** ApproveRefundSupervisor */
  approveRefundSupervisor: (id: string) => apiPost<void>(`/billing/refunds/${encodeURIComponent(id)}/supervisor-approve`),
  /** ApproveRefundDirector */
  approveRefundDirector: (id: string) => apiPost<void>(`/billing/refunds/${encodeURIComponent(id)}/director-approve`),
  /** GetInvoiceById */
  getInvoiceById: (id: string) => apiGet<InvoiceResponse>(`/billing/invoices/${encodeURIComponent(id)}`),
  /** GetInvoices */
  getInvoices: (params?: { patientId?: string; status?: string }) => apiGet<InvoiceResponse[]>(`/billing/invoices`, { params }),
  /** GetPaymentHmoAuthCode */
  getPaymentHmoAuthCode: (id: string) => apiGet<HmoAuthCodeResponse>(`/billing/payments/${encodeURIComponent(id)}/hmo-auth-code`),
  /** GetPaymentReceipt */
  getPaymentReceipt: (id: string) => apiGet<ReceiptResponse>(`/billing/payments/${encodeURIComponent(id)}/receipt`),
  /** ProcessRefund */
  processRefund: (body: ProcessRefundRequest) => apiPost<RefundResponse>(`/billing/refunds`, body),
  /** RecordPayment */
  recordPayment: (body: RecordPaymentRequest) => apiPost<PaymentResponse>(`/billing/payments`, body),
};

export const bloodBankApi = {
  /** GetBloodBankStockGrid */
  getBloodBankStockGrid: () => apiGet<void>(`/blood-bank/grid`),
  /** AddBloodBankUnit */
  addBloodBankUnit: (body: AddBloodBankUnitRequest) => apiPost<void>(`/blood-bank/units`, body),
  /** CrossMatchBloodUnit */
  crossMatchBloodUnit: (id: string, body: CrossMatchRequest) => apiPost<void>(`/blood-bank/units/${encodeURIComponent(id)}/cross-match`, body),
};

export const clinicalApi = {
  /** AddDiagnosis */
  addDiagnosis: (body: AddDiagnosisRequest) => apiPost<DiagnosisResponse>(`/clinical/diagnoses`, body),
  /** AddNoteAddendum */
  addNoteAddendum: (id: string, body: AddNoteAddendumRequest) => apiPost<void>(`/clinical/notes/${encodeURIComponent(id)}/addendums`, body),
  /** CreateClinicalNote */
  createClinicalNote: (body: CreateClinicalNoteRequest) => apiPost<ClinicalNoteResponse>(`/clinical/notes`, body),
  /** GetDiagnosesByEncounter */
  getDiagnosesByEncounter: (encounterId: string) => apiGet<DiagnosisResponse[]>(`/clinical/diagnoses/${encodeURIComponent(encounterId)}`),
  /** GetNotes */
  getNotes: (encounterId: string) => apiGet<ClinicalNoteResponse[]>(`/clinical/notes/${encodeURIComponent(encounterId)}`),
  /** GetPrescriptionsByEncounter */
  getPrescriptionsByEncounter: (encounterId: string) => apiGet<PrescriptionResponse[]>(`/clinical/prescriptions/${encodeURIComponent(encounterId)}`),
  /** GetVitals */
  getVitals: (encounterId: string) => apiGet<VitalsResponse[]>(`/clinical/vitals/${encodeURIComponent(encounterId)}`),
  /** PrescribeMedication */
  prescribeMedication: (body: PrescribeMedicationRequest) => apiPost<PrescriptionResponse>(`/clinical/prescriptions`, body),
  /** RecordVitals */
  recordVitals: (body: RecordVitalsRequest) => apiPost<VitalsResponse>(`/clinical/vitals`, body),
};

export const encountersApi = {
  /** CloseEncounter */
  closeEncounter: (id: string, body: CloseEncounterRequest) => apiPost<EncounterResponse>(`/encounters/${encodeURIComponent(id)}/close`, body),
  /** GetEncounterById */
  getEncounterById: (id: string) => apiGet<EncounterResponse>(`/encounters/${encodeURIComponent(id)}`),
  /** GetEncounters */
  getEncounters: (params?: { patientId?: string; doctorId?: string; activeOnly?: boolean }) => apiGet<EncounterResponse[]>(`/encounters`, { params }),
  /** OpenEncounter */
  openEncounter: (body: OpenEncounterRequest) => apiPost<EncounterResponse>(`/encounters`, body),
};

export const facilitiesApi = {
  /** CreateFacility */
  createFacility: (body: CreateFacilityRequest) => apiPost<FacilityResponse>(`/facilities`, body),
  /** GetFacilities */
  getFacilities: () => apiGet<FacilityResponse[]>(`/facilities`),
  /** GetFacilityById */
  getFacilityById: (id: string) => apiGet<FacilityResponse>(`/facilities/${encodeURIComponent(id)}`),
};

export const hmoApi = {
  /** GetHmoProviders */
  getHmoProviders: () => apiGet<void>(`/hmo/providers`),
  /** CreateHmoProvider */
  createHmoProvider: (body: CreateHmoProviderRequest) => apiPost<void>(`/hmo/providers`, body),
  /** GetHmoTariffs */
  getHmoTariffs: (params?: { providerId?: string; category?: string }) => apiGet<void>(`/hmo/tariffs`, { params }),
  /** CreateHmoTariff */
  createHmoTariff: (body: CreateHmoTariffRequest) => apiPost<void>(`/hmo/tariffs`, body),
  /** GetPreAuthCodes */
  getPreAuthCodes: (params?: { status?: string }) => apiGet<void>(`/hmo/pac`, { params }),
  /** RequestPreAuthCode */
  requestPreAuthCode: (body: RequestPreAuthCodeRequest) => apiPost<void>(`/hmo/pac/request`, body),
  /** ApprovePreAuthCode */
  approvePreAuthCode: (id: string, body: ApprovePreAuthCodeRequest) => apiPost<void>(`/hmo/pac/${encodeURIComponent(id)}/approve`, body),
  /** GetHmoClaims */
  getHmoClaims: (params?: { providerId?: string }) => apiGet<void>(`/hmo/claims`, { params }),
  /** GenerateHmoClaimBatch */
  generateHmoClaimBatch: (body: GenerateHmoClaimBatchRequest) => apiPost<void>(`/hmo/claims/batch`, body),
};

export const labOrdersApi = {
  /** CreateLabOrder */
  createLabOrder: (body: CreateLabOrderRequest) => apiPost<LabOrderResponse>(`/lab-orders`, body),
  /** GetLabOrders */
  getLabOrders: (params?: { encounterId?: string; patientId?: string; status?: string }) => apiGet<LabOrderResponse[]>(`/lab-orders`, { params }),
  /** GetLabOrderByInvestigationNo */
  getLabOrderByInvestigationNo: (investigationNo: string) => apiGet<LabOrderResponse>(`/lab-orders/investigation/${encodeURIComponent(investigationNo)}`),
  /** UpdateLabOrderStatus */
  updateLabOrderStatus: (id: string, body: UpdateLabOrderStatusRequest) => apiPatch<LabOrderResponse>(`/lab-orders/${encodeURIComponent(id)}/status`, body),
};

export const notificationsApi = {
  /** GetNotifications */
  getNotifications: (params?: { unreadOnly?: boolean }) => apiGet<void>(`/notifications`, { params }),
  /** MarkNotificationAsRead */
  markNotificationAsRead: (id: string) => apiPut<void>(`/notifications/${encodeURIComponent(id)}/read`),
  /** SendNotification */
  sendNotification: (body: SendNotificationRequest) => apiPost<void>(`/notifications/send`, body),
};

export const patientsApi = {
  /** CheckDuplicatePatients */
  checkDuplicatePatients: (body: CheckDuplicatesRequest) => apiPost<void>(`/patients/check-duplicates`, body),
  /** GetPatientById */
  getPatientById: (id: string) => apiGet<PatientResponse>(`/patients/${encodeURIComponent(id)}`),
  /** UpdatePatient */
  updatePatient: (id: string, body: UpdatePatientRequest) => apiPut<PatientResponse>(`/patients/${encodeURIComponent(id)}`, body),
  /** GetPatientHistory */
  getPatientHistory: (id: string) => apiGet<PatientHistoryResponse>(`/patients/${encodeURIComponent(id)}/history`),
  /** RegisterPatient */
  registerPatient: (body: RegisterPatientRequest) => apiPost<PatientResponse>(`/patients`, body),
  /** SearchPatients */
  searchPatients: (params?: { q?: string; limit?: number }) => apiGet<PatientResponse[]>(`/patients/search`, { params }),
};

export const pharmacyApi = {
  /** GetDrugCatalog */
  getDrugCatalog: (params?: { search?: string; category?: string }) => apiGet<void>(`/pharmacy/catalog`, { params }),
  /** CreateDrugItem */
  createDrugItem: (body: CreateDrugItemRequest) => apiPost<void>(`/pharmacy/catalog`, body),
  /** ReceiveDrugBatch */
  receiveDrugBatch: (body: ReceiveDrugBatchRequest) => apiPost<void>(`/pharmacy/batches/receive`, body),
  /** GetExpiringBatches */
  getExpiringBatches: (params?: { days?: number }) => apiGet<void>(`/pharmacy/batches/expiring`, { params }),
  /** DispensePrescription */
  dispensePrescription: (id: string, body: DispensePrescriptionRequest) => apiPost<void>(`/pharmacy/prescriptions/${encodeURIComponent(id)}/dispense`, body),
};

export const staffApi = {
  /** GetStaff */
  getStaff: (params?: { facilityId?: string }) => apiGet<StaffResponse[]>(`/staff`, { params }),
  /** RegisterStaff */
  registerStaff: (body: RegisterStaffRequest) => apiPost<StaffResponse>(`/staff`, body),
  /** GetStaffById */
  getStaffById: (id: string) => apiGet<StaffResponse>(`/staff/${encodeURIComponent(id)}`),
};

export const webhooksApi = {
  /** PaystackWebhook */
  paystackWebhook: () => apiPost<void>(`/webhooks/paystack`),
};

export const registerPatient = patientsApi.registerPatient;
