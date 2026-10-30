/** Role names mirrored from Domain.Application.Constants.Roles in the API. */
export const ROLES = {
  SuperAdmin: 'SuperAdmin',
  Admin: 'Admin',
  MedicalDirector: 'MedicalDirector',
  Receptionist: 'Receptionist',
  Doctor: 'Doctor',
  Nurse: 'Nurse',
  Pharmacist: 'Pharmacist',
  Laboratorist: 'Laboratorist',
  Cashier: 'Cashier',
  HmoOfficer: 'HmoOfficer',
  Patient: 'Patient',
} as const;

/**
 * Backend-seeded role names accepted by the frontend. OpenAPI currently types
 * role claims as arbitrary strings, so keep this tuple synchronized with the
 * backend's seeded roles until it publishes an authoritative role enum.
 */
export const ROLE_NAMES = [
  ROLES.SuperAdmin,
  ROLES.Admin,
  ROLES.MedicalDirector,
  ROLES.Receptionist,
  ROLES.Doctor,
  ROLES.Nurse,
  ROLES.Pharmacist,
  ROLES.Laboratorist,
  ROLES.Cashier,
  ROLES.HmoOfficer,
  ROLES.Patient,
] as const;

export type Role = (typeof ROLE_NAMES)[number];
