import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api/client';
import { AddStaff } from './AddStaff';

const mocks = vi.hoisted(() => ({
  role: 'Admin' as string | null,
  registerStaff: vi.fn(),
  getFacilities: vi.fn(),
}));

vi.mock('../../context/EmrContext', () => ({
  useEmr: () => ({ role: mocks.role }),
}));

vi.mock('../../api/endpoints', () => ({
  staffApi: { registerStaff: mocks.registerStaff },
  facilitiesApi: { getFacilities: mocks.getFacilities },
}));

function renderForm() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  render(<QueryClientProvider client={client}><AddStaff /></QueryClientProvider>);
  return { invalidate };
}

async function fillRequired(user: ReturnType<typeof userEvent.setup>, role: string) {
  await user.type(screen.getByLabelText('First name'), 'Ada');
  await user.type(screen.getByLabelText('Last name'), 'Example');
  await user.type(screen.getByLabelText('Email'), 'ada@example.test');
  await user.selectOptions(screen.getByLabelText('Role'), role);
  await user.click(screen.getByRole('button', { name: 'Generate' }));
}

describe('staff creation', () => {
  beforeEach(() => {
    mocks.role = 'Admin';
    mocks.registerStaff.mockReset();
    mocks.getFacilities.mockReset().mockResolvedValue([{ id: 'facility-1', name: 'Main facility' }]);
  });
  afterEach(cleanup);

  it.each(['MedicalDirector', 'Doctor', 'Nurse', 'Patient', null])('hides creation for %s', (role) => {
    mocks.role = role;
    renderForm();
    expect(screen.queryByRole('button', { name: 'Add staff' })).toBeNull();
  });

  it('creates an Admin-scoped account without facility or staff ID and displays the generated ID', async () => {
    const user = userEvent.setup();
    const { invalidate } = renderForm();
    mocks.registerStaff.mockResolvedValue({ staffId: 'STF-DOC-001', id: 'internal-id' });
    await user.click(screen.getByRole('button', { name: 'Add staff' }));
    const roleOptions = within(screen.getByLabelText('Role')).getAllByRole('option').map((option) => option.textContent);
    expect(roleOptions).toEqual(['Select role', 'Receptionist', 'Doctor', 'Nurse', 'Pharmacist', 'Laboratorist', 'Cashier', 'HmoOfficer']);
    expect(screen.queryByLabelText('Facility')).toBeNull();
    expect(mocks.getFacilities).not.toHaveBeenCalled();
    await fillRequired(user, 'Doctor');
    const password = (screen.getByLabelText('Temporary password') as HTMLInputElement).value;
    expect(password).toMatch(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{12,}$/);
    expect(screen.getByText(/must change this password on first login/i)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect((screen.getByLabelText('Temporary password') as HTMLInputElement).type).toBe('password');
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    await user.click(screen.getByRole('button', { name: 'Copy password' }));
    expect(await navigator.clipboard.readText()).toBe(password);
    await user.click(screen.getByRole('button', { name: 'Create staff' }));
    await waitFor(() => expect(mocks.registerStaff).toHaveBeenCalledOnce());
    expect(mocks.registerStaff).toHaveBeenCalledWith({
      firstName: 'Ada', lastName: 'Example', email: 'ada@example.test',
      role: 'Doctor', temporaryPassword: password,
    });
    expect(await screen.findByText('Staff created. Staff ID: STF-DOC-001')).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['staff'] });
  });

  it('loads facilities and submits a SuperAdmin-selected facility', async () => {
    mocks.role = 'SuperAdmin';
    mocks.registerStaff.mockResolvedValue({ staffId: 'STF-ADM-002' });
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole('button', { name: 'Add staff' }));
    expect(within(screen.getByLabelText('Role')).getAllByRole('option').map((option) => option.textContent))
      .toEqual(['Select role', 'Admin', 'MedicalDirector']);
    await screen.findByRole('option', { name: 'Main facility' });
    await user.selectOptions(screen.getByLabelText('Facility'), 'facility-1');
    await fillRequired(user, 'Admin');
    await user.click(screen.getByRole('button', { name: 'Create staff' }));
    await waitFor(() => expect(mocks.registerStaff).toHaveBeenCalledOnce());
    expect(mocks.registerStaff.mock.calls[0][0]).toMatchObject({ role: 'Admin', facilityId: 'facility-1' });
    expect(mocks.registerStaff.mock.calls[0][0]).not.toHaveProperty('staffId');
    expect(await screen.findByText('Staff created. Staff ID: STF-ADM-002')).toBeTruthy();
  });

  it.each([
    [403, 'You cannot create this role.'],
    [400, 'Email is already in use.'],
  ])('keeps the form open and displays the backend message for %s', async (status, message) => {
    mocks.registerStaff.mockRejectedValue(new ApiError({ status, detail: message }));
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole('button', { name: 'Add staff' }));
    await fillRequired(user, 'Doctor');
    await user.click(screen.getByRole('button', { name: 'Create staff' }));
    expect((await screen.findByRole('alert')).textContent).toBe(message);
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect((screen.getByLabelText('First name') as HTMLInputElement).value).toBe('Ada');
  });

  it('shows validation errors from the backend and allows retry', async () => {
    mocks.registerStaff.mockRejectedValueOnce(new ApiError({
      status: 400,
      title: 'Validation failed',
      raw: { errors: { Email: ['Email is already in use.'] } },
    })).mockResolvedValueOnce({ staffId: 'STF-DOC-003' });
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole('button', { name: 'Add staff' }));
    await fillRequired(user, 'Doctor');
    await user.click(screen.getByRole('button', { name: 'Create staff' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Email is already in use.');
    await user.click(screen.getByRole('button', { name: 'Create staff' }));
    expect(await screen.findByText('Staff created. Staff ID: STF-DOC-003')).toBeTruthy();
  });

  it('reports facility loading failures and offers a retry', async () => {
    mocks.role = 'SuperAdmin';
    mocks.getFacilities.mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce([{ id: 'facility-1', name: 'Main facility' }]);
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole('button', { name: 'Add staff' }));
    await user.click(await screen.findByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('option', { name: 'Main facility' })).toBeTruthy();
  });
});
