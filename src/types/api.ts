/**
 * AUTO-GENERATED from the live OpenAPI document - do not edit by hand.
 *
 * Source: EMR Multi-Tenant API Documentation v1
 * Regenerate: node scripts/gen-api.mjs
 */

export interface AppointmentResponse {
  id?: string | null;
  facilityId?: string | null;
  patientId?: string | null;
  patientName?: string | null;
  patientMrn?: string | null;
  doctorId?: string | null;
  doctorName?: string | null;
  appointmentDateTime?: string;
  reason?: string | null;
  status?: string | null;
  checkedInAt?: string | null;
  completedAt?: string | null;
  createdAt?: string;
}

export interface AuditResponse {
  id?: string | null;
  facilityId?: string | null;
  actionByWho?: string | null;
  actionType?: string | null;
  tableName?: string | null;
  dateTime?: string;
  oldValues?: string | null;
  newValues?: string | null;
  affectedColumns?: string | null;
  primaryKey?: string | null;
}

export interface LoginResponse {
  id?: string | null;
  email?: string | null;
  staffId?: string | null;
  facilityId?: string | null;
  role?: string | null;
  token?: string | null;
  expiresAt?: string;
  refreshToken?: string | null;
  refreshTokenExpiresAt?: string;
  mustChangePassword?: boolean;
}

export interface RefreshTokenResponse {
  token?: string | null;
  expiresAt?: string;
  refreshToken?: string | null;
  refreshTokenExpiresAt?: string;
}

export interface HmoAuthCodeResponse {
  paymentId?: string | null;
  hmoProvider?: string | null;
  hmoMemberId?: string | null;
  hmoAuthCode?: string | null;
}

export interface InvoiceItemResponse {
  id?: string | null;
  itemType?: string | null;
  referenceId?: string | null;
  description?: string | null;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
}

export interface InvoiceResponse {
  id?: string | null;
  facilityId?: string | null;
  encounterId?: string | null;
  patientId?: string | null;
  patientName?: string | null;
  patientMrn?: string | null;
  invoiceNumber?: string | null;
  totalAmount?: number;
  paidAmount?: number;
  balanceAmount?: number;
  status?: string | null;
  items?: InvoiceItemResponse[] | null;
  payments?: PaymentResponse[] | null;
  createdAt?: string;
}

export interface PaymentResponse {
  id?: string | null;
  facilityId?: string | null;
  invoiceId?: string | null;
  patientId?: string | null;
  amount?: number;
  mode?: string | null;
  status?: string | null;
  transactionReference?: string | null;
  terminalReference?: string | null;
  shiftCode?: string | null;
  cashierId?: string | null;
  hmoProvider?: string | null;
  hmoMemberId?: string | null;
  receiptNumber?: string | null;
  paymentDate?: string;
  notes?: string | null;
}

export interface ReceiptResponse {
  receiptNumber?: string | null;
  transactionReference?: string | null;
  paymentDate?: string;
  amountPaid?: number;
  paymentMode?: string | null;
  patientName?: string | null;
  patientMrn?: string | null;
  invoiceNumber?: string | null;
  invoiceTotal?: number;
  outstandingBalance?: number;
  cashierName?: string | null;
  facilityName?: string | null;
}

export interface RefundResponse {
  id?: string | null;
  paymentId?: string | null;
  amount?: number;
  reason?: string | null;
  requestedBy?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  status?: string | null;
  createdAt?: string;
}

export interface AddendumResponse {
  id?: string | null;
  content?: string | null;
  doctorId?: string | null;
  createdAt?: string;
}

export interface ClinicalNoteResponse {
  id?: string | null;
  encounterId?: string | null;
  patientId?: string | null;
  doctorId?: string | null;
  doctorName?: string | null;
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;
  isSigned?: boolean;
  signedAt?: string | null;
  createdAt?: string;
  addendums?: AddendumResponse[] | null;
}

export interface DiagnosisResponse {
  id?: string | null;
  encounterId?: string | null;
  patientId?: string | null;
  doctorId?: string | null;
  doctorName?: string | null;
  icd10Code?: string | null;
  description?: string | null;
  diagnosisType?: string | null;
  status?: string | null;
  notes?: string | null;
  createdAt?: string;
}

export interface PrescriptionResponse {
  id?: string | null;
  encounterId?: string | null;
  patientId?: string | null;
  doctorId?: string | null;
  doctorName?: string | null;
  medicationName?: string | null;
  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
  route?: string | null;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  instructions?: string | null;
  status?: string | null;
  createdAt?: string;
}

export interface VitalsResponse {
  id?: string | null;
  encounterId?: string | null;
  patientId?: string | null;
  recordedBy?: string | null;
  recordedAt?: string;
  temperatureCelsius?: number | null;
  systolicBloodPressure?: number | null;
  diastolicBloodPressure?: number | null;
  heartRateBpm?: number | null;
  respiratoryRateCpm?: number | null;
  spO2Percentage?: number | null;
  weightKg?: number | null;
  heightCm?: number | null;
  bmi?: number | null;
  bloodGlucoseMmolL?: number | null;
  notes?: string | null;
}

export interface EncounterResponse {
  id?: string | null;
  facilityId?: string | null;
  patientId?: string | null;
  patientName?: string | null;
  patientMrn?: string | null;
  doctorId?: string | null;
  doctorName?: string | null;
  appointmentId?: string | null;
  chiefComplaint?: string | null;
  status?: string | null;
  startedAt?: string;
  closedAt?: string | null;
  closedBy?: string | null;
  closingSummary?: string | null;
  invoiceId?: string | null;
}

export interface FacilityResponse {
  id?: string | null;
  name?: string | null;
  code?: string | null;
  type?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  isActive?: boolean;
  createdAt?: string;
}

export interface LabOrderResponse {
  id?: string | null;
  encounterId?: string | null;
  patientId?: string | null;
  doctorId?: string | null;
  doctorName?: string | null;
  investigationNumber?: string | null;
  testName?: string | null;
  price?: number;
  clinicalNotes?: string | null;
  status?: string | null;
  resultNotes?: string | null;
  resultDate?: string | null;
  createdAt?: string;
}

export interface PatientHistoryResponse {
  patient?: PatientResponse;
  encounters?: unknown[] | null;
  clinicalNotes?: unknown[] | null;
  diagnoses?: unknown[] | null;
  prescriptions?: unknown[] | null;
  labOrders?: unknown[] | null;
  vitals?: unknown[] | null;
}

export interface PatientResponse {
  id?: string | null;
  facilityId?: string | null;
  medicalRecordNumber?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  otherNames?: string | null;
  dateOfBirth?: string;
  gender?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  address?: string | null;
  nextOfKinName?: string | null;
  nextOfKinPhone?: string | null;
  nextOfKinRelationship?: string | null;
  hasHmo?: boolean;
  hmoProvider?: string | null;
  hmoMemberId?: string | null;
  hmoPlan?: string | null;
  bloodGroup?: string | null;
  genotype?: string | null;
  allergies?: string | null;
  isSickleCell?: boolean | null;
  isActive?: boolean;
  createdAt?: string;
  nin?: string | null;
  bvn?: string | null;
}

export interface StaffResponse {
  id?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  otherNames?: string | null;
  staffId?: string | null;
  facilityId?: string | null;
  role?: string | null;
  department?: string | null;
  specialization?: string | null;
  phoneNumber?: string | null;
  isEnabled?: boolean;
  mustChangePassword?: boolean;
}

export interface UserProfile {
  identityId?: string | null;
  id?: string | null;
  userName: string | null;
  email: string | null;
  firstName?: string | null;
  lastName?: string | null;
  staffId?: string | null;
  facilityId?: string | null;
  facilityName?: string | null;
  profilePicture?: string | null;
  roleId?: string | null;
  roleName?: string | null;
  isAccountActivated?: boolean;
  mustChangePassword?: boolean;
  phoneNumber?: string | null;
}

export interface ProblemDetails {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
}

export interface BookAppointmentRequest {
  patientId?: string | null;
  doctorId?: string | null;
  appointmentDateTime?: string;
  reason?: string | null;
  facilityId?: string | null;
}

export interface UpdateAppointmentStatusRequest {
  status?: string | null;
  reason?: string | null;
}

export interface ChangePasswordRequest {
  currentPassword?: string | null;
  newPassword?: string | null;
  confirmNewPassword?: string | null;
}

export interface LoginRequest {
  identifier?: string | null;
  password?: string | null;
  rememberMe?: boolean;
}

export interface RefreshTokenRequest {
  token?: string | null;
  refreshToken?: string | null;
}

export interface CloseShiftRequest {
  physicalCashCount?: number;
  notes?: string | null;
}

export interface ReconcileShiftRequest {
  auditorNotes?: string | null;
}

export interface StartShiftRequest {
  shiftType?: ShiftType;
}

export interface ProcessRefundRequest {
  paymentId?: string | null;
  amount?: number;
  reason?: string | null;
}

export interface RecordPaymentRequest {
  invoiceId?: string | null;
  amount?: number;
  mode?: string | null;
  transactionReference?: string | null;
  terminalReference?: string | null;
  shiftCode?: string | null;
  hmoProvider?: string | null;
  hmoMemberId?: string | null;
  hmoAuthCode?: string | null;
  notes?: string | null;
}

export interface AddBloodBankUnitRequest {
  unitNumber?: string | null;
  bloodGroup?: string | null;
  componentType?: BloodComponentType;
  donationDate?: string;
  expiryDate?: string;
}

export interface CrossMatchRequest {
  patientId?: string | null;
  notes?: string | null;
}

export interface AddDiagnosisRequest {
  encounterId?: string | null;
  icd10Code?: string | null;
  description?: string | null;
  diagnosisType?: string | null;
  notes?: string | null;
}

export interface AddNoteAddendumRequest {
  content?: string | null;
}

export interface CreateClinicalNoteRequest {
  encounterId?: string | null;
  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;
}

export interface PrescribeMedicationRequest {
  encounterId?: string | null;
  medicationName?: string | null;
  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
  route?: string | null;
  quantity?: number;
  unitPrice?: number;
  instructions?: string | null;
}

export interface RecordVitalsRequest {
  encounterId?: string | null;
  temperatureCelsius?: number | null;
  systolicBloodPressure?: number | null;
  diastolicBloodPressure?: number | null;
  heartRateBpm?: number | null;
  respiratoryRateCpm?: number | null;
  spO2Percentage?: number | null;
  weightKg?: number | null;
  heightCm?: number | null;
  bloodGlucoseMmolL?: number | null;
  notes?: string | null;
}

export interface CloseEncounterRequest {
  summary?: string | null;
}

export interface OpenEncounterRequest {
  patientId?: string | null;
  doctorId?: string | null;
  appointmentId?: string | null;
  chiefComplaint?: string | null;
  facilityId?: string | null;
}

export interface CreateFacilityRequest {
  name?: string | null;
  code?: string | null;
  type?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
}

export interface ApprovePreAuthCodeRequest {
  pacCode?: string | null;
}

export interface CreateHmoProviderRequest {
  code?: string | null;
  name?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  requiresPreAuthByDefault?: boolean;
}

export interface CreateHmoTariffRequest {
  hmoProviderId?: string | null;
  itemCode?: string | null;
  itemName?: string | null;
  category?: string | null;
  standardCashPrice?: number;
  hmoCoveredPrice?: number;
  patientCoPayPercent?: number;
  requiresPreAuth?: boolean;
  preAuthThreshold?: number;
}

export interface GenerateHmoClaimBatchRequest {
  hmoProviderId?: string | null;
  periodStart?: string;
  periodEnd?: string;
}

export interface RequestPreAuthCodeRequest {
  hmoProviderId?: string | null;
  patientId?: string | null;
  encounterId?: string | null;
  itemCode?: string | null;
  itemDescription?: string | null;
  requestedAmount?: number;
  clinicalSummary?: string | null;
}

export interface CreateLabOrderRequest {
  encounterId?: string | null;
  testName?: string | null;
  price?: number;
  clinicalNotes?: string | null;
}

export interface UpdateLabOrderStatusRequest {
  status?: string | null;
  resultNotes?: string | null;
}

export interface SendNotificationRequest {
  userId?: string | null;
  targetRole?: string | null;
  patientId?: string | null;
  phoneNumber?: string | null;
  title?: string | null;
  message?: string | null;
  type?: NotificationType;
  severity?: NotificationSeverity;
  channel?: NotificationChannel;
}

export interface CheckDuplicatesRequest {
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: string;
  nin?: string | null;
}

export interface RegisterPatientRequest {
  firstName?: string | null;
  lastName?: string | null;
  otherNames?: string | null;
  dateOfBirth?: string;
  gender?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  address?: string | null;
  nextOfKinName?: string | null;
  nextOfKinPhone?: string | null;
  nextOfKinRelationship?: string | null;
  hmoProvider?: string | null;
  hmoMemberId?: string | null;
  hmoPlan?: string | null;
  bloodGroup?: string | null;
  genotype?: string | null;
  allergies?: string | null;
  nin?: string | null;
  bvn?: string | null;
  allowDuplicateOverride?: boolean;
  facilityId?: string | null;
}

export interface UpdatePatientRequest {
  firstName?: string | null;
  lastName?: string | null;
  otherNames?: string | null;
  dateOfBirth?: string;
  gender?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  address?: string | null;
  nextOfKinName?: string | null;
  nextOfKinPhone?: string | null;
  nextOfKinRelationship?: string | null;
  hmoProvider?: string | null;
  hmoMemberId?: string | null;
  hmoPlan?: string | null;
  bloodGroup?: string | null;
  genotype?: string | null;
  allergies?: string | null;
}

export interface CreateDrugItemRequest {
  code?: string | null;
  name?: string | null;
  genericName?: string | null;
  category?: string | null;
  form?: string | null;
  strength?: string | null;
  reorderLevel?: number;
  standardPrice?: number;
  contraindications?: string | null;
  allergyWarnings?: string | null;
}

export interface DispensePrescriptionRequest {
  overrideBatchNumber?: string | null;
}

export interface ReceiveDrugBatchRequest {
  drugItemId?: string | null;
  batchNumber?: string | null;
  manufacturingDate?: string | null;
  expiryDate?: string;
  quantityReceived?: number;
  unitCost?: number;
  sellingPrice?: number;
}

export interface RegisterStaffRequest {
  facilityId?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  otherNames?: string | null;
  role?: string | null;
  department?: string | null;
  specialization?: string | null;
  phoneNumber?: string | null;
  temporaryPassword?: string | null;
}

export type ShiftType = 1 | 2 | 3;
export type BloodComponentType = 1 | 2 | 3 | 4 | 5;
export type NotificationChannel = 1 | 2 | 3;
export type NotificationSeverity = 1 | 2 | 3;
export type NotificationType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
