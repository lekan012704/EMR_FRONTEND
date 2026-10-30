import type { StaffResponse } from '../types/api';

export function staffDisplayName(staff: StaffResponse): string {
  const name = [staff.firstName, staff.otherNames, staff.lastName]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(' ')
    .trim();

  return name || staff.email || staff.staffId || 'Unnamed staff member';
}
