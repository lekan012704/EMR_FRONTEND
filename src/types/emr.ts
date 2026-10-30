import type { Role } from './roles';
export type { Role } from './roles';

export interface Facility {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  address: string;
  phone: string;
}

export interface NextOfKin {
  name: string;
  relationship: string;
  phone: string;
}

export interface HmoDetails {
  provider: string;
  policyNumber: string;
  coverageTier: 'Standard' | 'Silver' | 'Gold' | 'Executive';
  coPayPercentage: number;
}

export interface Patient {
  id: string;
  mrn: string; // Medical Record Number
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  phone: string;
  email: string;
  address: string;
  bloodGroup: string;
  genotype: string;
  allergies: string[];
  nextOfKin: NextOfKin;
  hmoDetails?: HmoDetails;
  facilityId: string;
  createdAt: string;
}

export type AppointmentStatus = 'Scheduled' | 'Checked-in' | 'In-Consultation' | 'Completed' | 'Cancelled';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  doctorId: string;
  doctorName: string;
  department: string;
  dateTime: string;
  slotTime: string;
  reason: string;
  status: AppointmentStatus;
  encounterId?: string;
  facilityId: string;
}

export interface Vitals {
  id: string;
  encounterId: string;
  bpSystolic: number;
  bpDiastolic: number;
  pulse: number;
  temperature: number;
  respiratoryRate: number;
  spO2: number;
  weightKg: number;
  heightCm: number;
  bmi: number;
  painScale: number; // 0-10
  triageCategory: 'Emergency' | 'Urgent' | 'Standard';
  nurseNotes?: string;
  recordedAt: string;
  recordedBy: string;
}

export interface ClinicalNote {
  id: string;
  encounterId: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  writtenAt: string;
  writtenBy: string;
  isClosed: boolean;
  addendums: {
    id: string;
    text: string;
    addedAt: string;
    addedBy: string;
  }[];
}

export interface Diagnosis {
  id: string;
  code: string; // ICD-10
  description: string;
  type: 'Primary' | 'Secondary';
  diagnosedBy: string;
  timestamp: string;
}

export interface LabOrder {
  id: string;
  encounterId: string;
  patientId: string;
  investigationNo: string;
  testName: string;
  category: 'Hematology' | 'Chemical Pathology' | 'Microbiology' | 'Radiology' | 'General';
  priority: 'Routine' | 'Urgent' | 'STAT';
  notes: string;
  status: 'Ordered' | 'Sample Collected' | 'Analyzing' | 'Completed';
  cost: number;
  orderedAt: string;
  orderedBy: string;
  result?: {
    summary: string;
    referenceRange: string;
    findings: string;
    completedAt: string;
  };
}

export interface Prescription {
  id: string;
  encounterId: string;
  patientId: string;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  cost: number;
  dispensedStatus: 'Pending' | 'Dispensed';
  prescribedAt: string;
  prescribedBy: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  category: 'Consultation' | 'Lab' | 'Pharmacy' | 'Procedure' | 'Nursing';
  quantity: number;
  unitPrice: number;
  total: number;
  sourceRefId?: string;
}

export type PaymentMode = 'Cash' | 'POS/card' | 'Bank transfer' | 'Online (Paystack)' | 'HMO/insurance';

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  mode: PaymentMode;
  reference: string;
  timestamp: string;
  cashierName: string;
  terminalRef?: string;
  transferRef?: string;
  hmoApprovalCode?: string;
  paystackRef?: string;
  shiftCode?: string;
}

export interface Refund {
  id: string;
  paymentId: string;
  invoiceId: string;
  amount: number;
  reason: string;
  approvedBy: string;
  timestamp: string;
  status: 'Pending Approval' | 'Approved' | 'Disbursed';
}

export type InvoiceStatus = 'Pending' | 'Partial' | 'Paid';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  encounterId: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  hmoProvider?: string;
  items: InvoiceItem[];
  subtotal: number;
  hmoCoveredAmount: number;
  patientPayable: number;
  paidAmount: number;
  balance: number;
  status: InvoiceStatus;
  payments: Payment[];
  refunds: Refund[];
  createdAt: string;
  facilityId: string;
}

export interface Encounter {
  id: string;
  encounterNumber: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  appointmentId?: string;
  doctorId: string;
  doctorName: string;
  nurseId?: string;
  nurseName?: string;
  checkInTime: string;
  closedAt?: string;
  status: 'Checked-in' | 'Triage' | 'Consultation' | 'Closed';
  vitals?: Vitals;
  clinicalNote?: ClinicalNote;
  diagnoses: Diagnosis[];
  labOrders: LabOrder[];
  prescriptions: Prescription[];
  invoiceId: string;
  facilityId: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: Role | null;
  action: string;
  recordType: 'Patient' | 'Appointment' | 'Encounter' | 'Vitals' | 'ClinicalNote' | 'LabOrder' | 'Prescription' | 'Invoice' | 'Payment' | 'Refund' | 'Auth';
  recordId: string;
  facilityId: string;
  details: string;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  phone: string;
  facilityId: string;
  active: boolean;
  avatar?: string;
}
