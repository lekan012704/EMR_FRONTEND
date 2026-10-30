import { ROLE_NAMES, ROLES, type Role } from '../types/roles';

/**
 * The API currently describes LoginResponse.role and UserProfile.roleName as
 * plain strings, not an enum. These names mirror backend-seeded roles; the
 * runtime guard rejects names that are not in that mirrored role contract.
 */
export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLE_NAMES as readonly string[]).includes(value);
}

export function isStaffRole(role: Role): role is Exclude<Role, typeof ROLES.Patient> {
  return role !== ROLES.Patient;
}

/** One role-to-home mapping, driven by the role returned by the backend. */
export const roleHomeRoute: Record<Role, string> = {
  [ROLES.Admin]: 'reports',
  [ROLES.SuperAdmin]: 'reports',
  [ROLES.MedicalDirector]: 'reports',
  [ROLES.Receptionist]: 'overview',
  [ROLES.Doctor]: 'overview',
  [ROLES.Nurse]: 'overview',
  [ROLES.Pharmacist]: 'overview',
  [ROLES.Laboratorist]: 'overview',
  [ROLES.Cashier]: 'overview',
  [ROLES.HmoOfficer]: 'billing',
  [ROLES.Patient]: 'portal',
};

/**
 * UX-only route visibility while the API contract exposes roles but no
 * permission claims. API authorization remains the security boundary.
 */
const roleTabs: Record<Role, readonly string[]> = {
  [ROLES.Admin]: ['overview', 'patients', 'appointments', 'billing', 'reports', 'audit', 'staff', 'settings'],
  // Platform administration is intentionally separate from clinical and billing
  // workspaces. SuperAdmin dashboard data is limited to facilities, staff, audits.
  [ROLES.SuperAdmin]: ['reports', 'audit', 'staff'],
  [ROLES.MedicalDirector]: ['overview', 'patients', 'encounters', 'doctor', 'labs', 'billing', 'reports', 'audit', 'staff', 'settings'],
  [ROLES.Receptionist]: ['overview', 'patients', 'appointments', 'settings'],
  [ROLES.Doctor]: ['overview', 'patients', 'appointments', 'encounters', 'nurse', 'doctor', 'labs', 'settings'],
  [ROLES.Nurse]: ['overview', 'patients', 'appointments', 'encounters', 'nurse', 'labs', 'settings'],
  [ROLES.Pharmacist]: ['overview', 'patients', 'settings'],
  [ROLES.Laboratorist]: ['overview', 'patients', 'labs', 'settings'],
  [ROLES.Cashier]: ['overview', 'billing', 'settings'],
  [ROLES.HmoOfficer]: ['overview', 'patients', 'billing', 'settings'],
  [ROLES.Patient]: ['portal', 'settings'],
};

export function canAccessTab(role: Role | null, tab: string): boolean {
  return role !== null && roleTabs[role].includes(tab);
}

export function humanizeRole(role: unknown): string {
  if (typeof role !== 'string') return String(role);
  switch (role) {
    case ROLES.Admin:
      return 'System Administrator';
    case ROLES.SuperAdmin:
      return 'Super Administrator';
    case ROLES.MedicalDirector:
      return 'Medical Director';
    case ROLES.Doctor:
      return 'Clinical Doctor';
    case ROLES.Nurse:
      return 'Nursing Staff';
    case ROLES.Receptionist:
      return 'Patient Intake';
    case ROLES.Cashier:
      return 'Revenue';
    case ROLES.Pharmacist:
      return 'Pharmacy';
    case ROLES.Laboratorist:
      return 'Laboratory';
    case ROLES.HmoOfficer:
      return 'HMO Officer';
    case ROLES.Patient:
      return 'Patient';
    default:
      return role;
  }
}
