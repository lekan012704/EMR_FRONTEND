import { type Role } from '../types/roles';

/**
 * Permission constants mirrored from backend authorization policies.
 * These represent the permission claims that the API uses for authorization.
 * The frontend uses these for UX-only gating; API remains the security boundary.
 */
export const PERMISSIONS = {
  VIEW_PATIENT_CLINICAL: 'view:patient_clinical',
  CREATE_APPOINTMENT: 'create:appointment',
  VIEW_ENCOUNTERS: 'view:encounters',
  VIEW_BILLING: 'view:billing',
} as const;

/**
 * Role-to-permission mapping for clinical data access.
 * Only clinical roles (Doctor, Nurse, MedicalDirector) can view patient clinical data.
 * Admin, Receptionist, SuperAdmin only have demographics access.
 */
const rolePermissions: Record<Role, readonly string[]> = {
  SuperAdmin: [],
  Admin: [],
  MedicalDirector: [PERMISSIONS.VIEW_PATIENT_CLINICAL],
  Receptionist: [],
  Doctor: [PERMISSIONS.VIEW_PATIENT_CLINICAL],
  Nurse: [PERMISSIONS.VIEW_PATIENT_CLINICAL],
  Pharmacist: [],
  Laboratorist: [],
  Cashier: [],
  HmoOfficer: [],
  Patient: [],
};

/**
 * Check if a role has a specific permission.
 */
export function roleHasPermission(role: Role | null, permission: string): boolean {
  if (!role) return false;
  return rolePermissions[role]?.includes(permission) ?? false;
}

/**
 * Check if the current user can view patient clinical data (allergies, blood group, genotype).
 */
export function canViewClinical(role: Role | null): boolean {
  return roleHasPermission(role, PERMISSIONS.VIEW_PATIENT_CLINICAL);
}

/**
 * Check if the current user can create appointments.
 */
export function canCreateAppointment(role: Role | null): boolean {
  return roleHasPermission(role, PERMISSIONS.CREATE_APPOINTMENT);
}

/**
 * Check if the current user can view encounters.
 */
export function canViewEncounters(role: Role | null): boolean {
  return roleHasPermission(role, PERMISSIONS.VIEW_ENCOUNTERS);
}

/**
 * Check if the current user can view billing.
 */
export function canViewBilling(role: Role | null): boolean {
  return roleHasPermission(role, PERMISSIONS.VIEW_BILLING);
}

/**
 * Clinical data visibility states for permission-aware display.
 */
export type ClinicalVisibility = 'restricted' | 'empty' | 'value';

/**
 * Determine the visibility state for a clinical field based on user permissions and data.
 * - 'restricted': User lacks view:patient_clinical permission
 * - 'empty': User has permission but field is null/empty
 * - 'value': User has permission and field has a value
 */
export function getClinicalVisibility(
  role: Role | null,
  value: string | string[] | null | undefined
): ClinicalVisibility {
  if (!canViewClinical(role)) return 'restricted';
  if (!value) return 'empty';
  if (Array.isArray(value)) return value.length > 0 ? 'value' : 'empty';
  return value.trim() ? 'value' : 'empty';
}

/**
 * Get display text for a clinical field based on visibility state.
 */
export function getClinicalDisplayText(
  visibility: ClinicalVisibility,
  value: string | string[] | null | undefined,
  fieldLabel: string
): string {
  switch (visibility) {
    case 'restricted':
      return 'Restricted';
    case 'empty':
      return \No \ recorded\;
    case 'value':
      return Array.isArray(value) ? value.join(', ') : value;
  }
}
