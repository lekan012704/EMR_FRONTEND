import * as Dialog from '@radix-ui/react-dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { ApiError } from '../../api/client';
import { facilitiesApi, staffApi } from '../../api/endpoints';
import { useEmr } from '../../context/EmrContext';
import type { RegisterStaffRequest } from '../../types/api';
import { ROLES, type Role } from '../../types/roles';

const creatableRoles: Partial<Record<Role, readonly Role[]>> = {
  [ROLES.SuperAdmin]: [ROLES.Admin, ROLES.MedicalDirector],
  [ROLES.Admin]: [
    ROLES.Receptionist, ROLES.Doctor, ROLES.Nurse, ROLES.Pharmacist,
    ROLES.Laboratorist, ROLES.Cashier, ROLES.HmoOfficer,
  ],
};

const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700';
const buttonClass = 'rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50';

// Rejection sampling avoids modulo bias; Web Crypto supplies all randomness.
function randomIndex(length: number): number {
  const limit = Math.floor(256 / length) * length;
  const value = new Uint8Array(1);
  do {
    crypto.getRandomValues(value);
  } while (value[0] >= limit);
  return value[0] % length;
}

function generateTemporaryPassword(): string {
  const groups = ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz', '0123456789', '!@#$%^&*_-+='];
  const all = groups.join('');
  const chars = groups.map((group) => group[randomIndex(group.length)]);
  while (chars.length < 16) chars.push(all[randomIndex(all.length)]);
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

function validationMessages(value: unknown): string[] {
  if (typeof value === 'string') return value.trim() ? [value.trim()] : [];
  if (Array.isArray(value)) return value.flatMap(validationMessages);
  if (value && typeof value === 'object') return Object.values(value).flatMap(validationMessages);
  return [];
}

function responseMessage(value: unknown, depth = 0): string | undefined {
  if (typeof value === 'string') return value.trim() || undefined;
  if (depth > 4 || !value || typeof value !== 'object') return undefined;
  if (Array.isArray(value)) {
    return value.map((item) => responseMessage(item, depth + 1)).find(Boolean);
  }
  const entries = Object.entries(value);
  for (const name of ['detail', 'message', 'errormessage', 'description', 'error', 'errors', 'title']) {
    const entry = entries.find(([key]) => key.replace(/[^a-z0-9]/gi, '').toLowerCase() === name);
    if (!entry) continue;
    const message = name === 'errors'
      ? validationMessages(entry[1]).join(' ')
      : responseMessage(entry[1], depth + 1);
    if (message) return message;
  }
  return undefined;
}

function staffErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return responseMessage(error.raw) || error.detail || error.message;
  }
  return error instanceof Error ? error.message : 'Unable to create staff. Please try again.';
}

export function AddStaff() {
  const { role } = useEmr();
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState('');
  const allowedRoles = role ? creatableRoles[role] : undefined;

  if (!allowedRoles) return null;

  return (
    <div className="space-y-2">
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button type="button" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800">
            Add staff
          </button>
        </Dialog.Trigger>
        {open && (
          <StaffForm
            creatorRole={role!}
            allowedRoles={allowedRoles}
            onSuccess={(staffId) => {
              setSuccess(staffId ? `Staff created. Staff ID: ${staffId}` : 'Staff created. The response did not include a staff ID.');
              setOpen(false);
            }}
            onCancel={() => setOpen(false)}
          />
        )}
      </Dialog.Root>
      {success && <p role="status" className="text-sm font-medium text-emerald-800">{success}</p>}
    </div>
  );
}

function StaffForm({ creatorRole, allowedRoles, onSuccess, onCancel }: {
  creatorRole: Role;
  allowedRoles: readonly Role[];
  onSuccess: (staffId: string | null | undefined) => void;
  onCancel: () => void;
}) {
  const queryClient = useQueryClient();
  const facilities = useQuery({
    queryKey: ['facilities'],
    queryFn: facilitiesApi.getFacilities,
    enabled: creatorRole === ROLES.SuperAdmin,
    staleTime: 5 * 60 * 1000,
  });
  const [form, setForm] = useState({
    firstName: '', lastName: '', otherNames: '', email: '', phoneNumber: '',
    department: '', specialization: '', role: '', facilityId: '', temporaryPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const update = (key: keyof typeof form, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    if (key === 'temporaryPassword') setCopyMessage('');
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (!allowedRoles.includes(form.role as Role)) {
      setError('Select an available role.');
      return;
    }
    if (creatorRole === ROLES.SuperAdmin && !facilities.data?.some((item) => item.id === form.facilityId)) {
      setError('Select an available facility.');
      return;
    }
    const password = form.temporaryPassword;
    if (password.length < 12 || !/[A-Z]/.test(password) || !/[a-z]/.test(password)
      || !/[0-9]/.test(password) || !/[^A-Za-z0-9\s]/.test(password)) {
      setError('The temporary password must have at least 12 characters, including uppercase, lowercase, a digit and a symbol.');
      return;
    }

    const request: RegisterStaffRequest = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      role: form.role,
      temporaryPassword: password,
      ...(form.otherNames.trim() && { otherNames: form.otherNames.trim() }),
      ...(form.phoneNumber.trim() && { phoneNumber: form.phoneNumber.trim() }),
      ...(form.department.trim() && { department: form.department.trim() }),
      ...(form.specialization.trim() && { specialization: form.specialization.trim() }),
      ...(creatorRole === ROLES.SuperAdmin && { facilityId: form.facilityId }),
    };
    setError('');
    setPending(true);
    try {
      const created = await staffApi.registerStaff(request);
      void queryClient.invalidateQueries({ queryKey: ['staff'] });
      onSuccess(created.staffId);
    } catch (failure) {
      setError(staffErrorMessage(failure));
      setPending(false);
    }
  }

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(form.temporaryPassword);
      setCopyMessage('Password copied.');
    } catch {
      setCopyMessage('Unable to copy. Please copy the password manually.');
    }
  }

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/50" />
      <Dialog.Content
        className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(95vw,38rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onEscapeKeyDown={(event) => { if (pending) event.preventDefault(); }}
        onInteractOutside={(event) => { if (pending) event.preventDefault(); }}
      >
        <Dialog.Title className="text-lg font-bold text-slate-900">Add staff</Dialog.Title>
        <Dialog.Description className="mt-1 text-sm text-slate-600">Create a staff account with a temporary password.</Dialog.Description>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            {([
              ['firstName', 'First name', true, 'text'],
              ['lastName', 'Last name', true, 'text'],
              ['otherNames', 'Other names', false, 'text'],
              ['email', 'Email', true, 'email'],
              ['phoneNumber', 'Phone number', false, 'tel'],
              ['department', 'Department', false, 'text'],
              ['specialization', 'Specialization', false, 'text'],
            ] as const).map(([key, label, required, type]) => (
              <label key={key} className="block text-sm font-semibold text-slate-700">
                {label}
                <input className={`${inputClass} mt-1`} type={type} required={required} value={form[key]} onChange={(event) => update(key, event.target.value)} />
              </label>
            ))}
            <label className="block text-sm font-semibold text-slate-700">
              Role
              <select className={`${inputClass} mt-1`} required value={form.role} onChange={(event) => update('role', event.target.value)}>
                <option value="">Select role</option>
                {allowedRoles.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </label>
            {creatorRole === ROLES.SuperAdmin && (
              <label className="block text-sm font-semibold text-slate-700">
                Facility
                <select className={`${inputClass} mt-1`} required value={form.facilityId} onChange={(event) => update('facilityId', event.target.value)} disabled={facilities.isLoading || facilities.isError}>
                  <option value="">{facilities.isLoading ? 'Loading facilities...' : 'Select facility'}</option>
                  {facilities.data?.filter((facility) => facility.id).map((facility) => (
                    <option key={facility.id} value={facility.id!}>{facility.name || facility.id}</option>
                  ))}
                </select>
                {facilities.isError && <span className="mt-1 block text-rose-700">Unable to load facilities. <button type="button" className="underline" onClick={() => void facilities.refetch()}>Retry</button></span>}
                {!facilities.isLoading && !facilities.isError && !facilities.data?.some((facility) => facility.id) && <span className="mt-1 block text-slate-600">No facilities available.</span>}
              </label>
            )}
          </div>
          <div>
            <label htmlFor="temporary-staff-password" className="block text-sm font-semibold text-slate-700">Temporary password</label>
            <input id="temporary-staff-password" className={`${inputClass} mt-1`} type={showPassword ? 'text' : 'password'} autoComplete="new-password" required value={form.temporaryPassword} onChange={(event) => update('temporaryPassword', event.target.value)} aria-describedby="temporary-password-note" />
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" className={buttonClass} onClick={() => { update('temporaryPassword', generateTemporaryPassword()); setShowPassword(true); }}>Generate</button>
              <button type="button" className={buttonClass} onClick={() => setShowPassword((shown) => !shown)}>{showPassword ? 'Hide' : 'Show'} password</button>
              <button type="button" className={buttonClass} disabled={!form.temporaryPassword} onClick={() => void copyPassword()}>Copy password</button>
            </div>
            <p id="temporary-password-note" className="mt-2 text-xs text-slate-600">Use at least 12 characters with uppercase, lowercase, a digit and a symbol. The staff member must change this password on first login.</p>
            {copyMessage && <p role="status" className="mt-1 text-xs text-slate-600">{copyMessage}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className={buttonClass} disabled={pending} onClick={onCancel}>Cancel</button>
            <button type="submit" disabled={pending || (creatorRole === ROLES.SuperAdmin && (facilities.isLoading || facilities.isError))} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50">{pending ? 'Creating...' : 'Create staff'}</button>
          </div>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
