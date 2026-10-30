import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { ApiError } from '../api/client';
import type { LoginResponse } from '../types/api';
import { ChangePasswordView } from './ChangePasswordView';
import { getChangePasswordErrorMessage } from './passwordChangeErrors';

const mocks = vi.hoisted(() => ({
  context: {
    role: 'SuperAdmin' as string | null,
    user: {
      email: 'admin@emr.local',
      userName: 'admin@emr.local',
      roleName: 'SuperAdmin',
    },
    setRole: vi.fn(),
    setActiveTab: vi.fn(),
    setViewMode: vi.fn(),
    setAuthSession: vi.fn(),
    setMustChangePassword: vi.fn(),
    signOut: vi.fn(),
    addToast: vi.fn(),
  },
  changePassword: vi.fn(),
  login: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock('../context/EmrContext', () => ({
  useEmr: () => mocks.context,
}));

vi.mock('../api/tokenStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/tokenStore')>();
  return { ...actual, getSession: mocks.getSession };
});

vi.mock('../api/endpoints', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/endpoints')>();
  return {
    ...actual,
    authApi: {
      ...actual.authApi,
      changePassword: mocks.changePassword,
      login: mocks.login,
    },
  };
});

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="current-route">{location.pathname}{location.search}</output>;
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/change-password']}>
      <LocationProbe />
      <ChangePasswordView />
    </MemoryRouter>,
  );
}

function loginResponse(token: string): LoginResponse {
  return {
    id: 'user-1',
    email: 'admin@emr.local',
    role: 'SuperAdmin',
    token,
    refreshToken: `${token}-refresh`,
    expiresAt: '2099-01-01T00:00:00.000Z',
    refreshTokenExpiresAt: '2099-01-08T00:00:00.000Z',
    mustChangePassword: false,
  };
}

async function enterValidValues(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Current temporary password'), 'Temporary#1');
  await user.type(screen.getByLabelText('New password'), 'Stronger#Pass123');
  await user.type(screen.getByLabelText('Confirm new password'), 'Stronger#Pass123');
}

describe('ChangePasswordView', () => {
  beforeEach(() => {
    mocks.changePassword.mockReset();
    mocks.login.mockReset();
    mocks.getSession.mockReset();
    mocks.context.setRole.mockReset();
    mocks.context.setActiveTab.mockReset();
    mocks.context.setViewMode.mockReset();
    mocks.context.setAuthSession.mockReset();
    mocks.context.setMustChangePassword.mockReset();
    mocks.context.signOut.mockReset();
    mocks.context.addToast.mockReset();
    mocks.getSession.mockReturnValue({
      token: 'temporary-access',
      refreshToken: 'temporary-refresh',
      expiresAt: '2099-01-01T00:00:00.000Z',
      refreshTokenExpiresAt: '2099-01-08T00:00:00.000Z',
      mustChangePassword: true,
      loginIdentifier: 'admin@emr.local',
      user: { email: 'admin@emr.local', roleName: 'SuperAdmin' },
    });
  });

  it('shows all password requirements and disables submit until confirmation matches', async () => {
    const user = userEvent.setup();
    renderPage();

    const submit = screen.getByRole('button', { name: /update password/i });
    expect(submit.hasAttribute('disabled')).toBe(true);
    expect(screen.getByLabelText('Current temporary password').getAttribute('autocomplete'))
      .toBe('current-password');
    expect(screen.getByLabelText('New password').getAttribute('autocomplete'))
      .toBe('new-password');

    await user.type(screen.getByLabelText('Current temporary password'), 'Temporary#1');
    await user.type(screen.getByLabelText('New password'), 'Stronger#Pass123');
    await user.type(screen.getByLabelText('Confirm new password'), 'Different#Pass123');

    expect(screen.getByRole('list', { name: /new password requirements/i }).textContent)
      .toMatch(/at least 10 characters/i);
    expect(submit.hasAttribute('disabled')).toBe(true);

    await user.clear(screen.getByLabelText('Confirm new password'));
    await user.type(screen.getByLabelText('Confirm new password'), 'Stronger#Pass123');
    expect(submit.hasAttribute('disabled')).toBe(false);
  });

  it('validates required fields and shows an inline confirmation mismatch', async () => {
    const user = userEvent.setup();
    renderPage();

    const currentPassword = screen.getByLabelText('Current temporary password');
    await user.click(currentPassword);
    await user.tab();
    expect(await screen.findByText(/enter your current temporary password/i)).toBeTruthy();

    await user.type(currentPassword, 'Temporary#1');
    await user.type(screen.getByLabelText('New password'), 'Stronger#Pass123');
    await user.type(screen.getByLabelText('Confirm new password'), 'NoMatch#123');
    expect(screen.getByText(/passwords do not match/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /update password/i }).hasAttribute('disabled')).toBe(true);
  });

  it('provides independent show/hide controls for all password fields', async () => {
    const user = userEvent.setup();
    renderPage();

    for (const label of [
      'Current temporary password',
      'New password',
      'Confirm new password',
    ]) {
      const input = screen.getByLabelText(label) as HTMLInputElement;
      await user.click(screen.getByRole('button', { name: `Show ${label.toLowerCase()}` }));
      expect(input.type).toBe('text');
      await user.click(screen.getByRole('button', { name: `Hide ${label.toLowerCase()}` }));
      expect(input.type).toBe('password');
    }
  });

  it('stores the fresh login session and redirects to the role home after success', async () => {
    mocks.changePassword.mockResolvedValue({ message: 'Password changed successfully.' });
    mocks.login.mockResolvedValue(loginResponse('fresh-access-token'));
    const user = userEvent.setup();
    renderPage();
    await enterValidValues(user);
    await user.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByTestId('current-route').textContent).toBe('/app?tab=reports');
    });
    expect(mocks.changePassword).toHaveBeenCalledWith({
      currentPassword: 'Temporary#1',
      newPassword: 'Stronger#Pass123',
      confirmNewPassword: 'Stronger#Pass123',
    });
    expect(mocks.login).toHaveBeenCalledWith({
      identifier: 'admin@emr.local',
      password: 'Stronger#Pass123',
      rememberMe: true,
    });
    expect(mocks.context.setAuthSession).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'fresh-access-token',
        mustChangePassword: false,
        user: expect.objectContaining({ roleName: 'SuperAdmin' }),
      }),
    );
    expect(mocks.context.addToast).toHaveBeenCalledWith(
      'Password updated',
      'Your new password is ready to use.',
      'success',
    );
    expect((screen.getByLabelText('Current temporary password') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('New password') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Confirm new password') as HTMLInputElement).value).toBe('');
  });

  it('signs out instead of reusing the old token when fresh sign-in fails', async () => {
    mocks.changePassword.mockResolvedValue({ message: 'Password changed successfully.' });
    mocks.login.mockRejectedValue(new ApiError({
      status: 401,
      detail: 'The new password was rejected during sign-in.',
    }));
    const user = userEvent.setup();
    renderPage();
    await enterValidValues(user);
    await user.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByTestId('current-route').textContent).toBe('/login');
      expect(mocks.context.signOut).toHaveBeenCalledOnce();
    });
    expect(mocks.context.setAuthSession).not.toHaveBeenCalled();
    expect(mocks.context.setMustChangePassword).not.toHaveBeenCalledWith(false);
    expect(mocks.context.addToast).toHaveBeenCalledWith(
      'Password updated',
      expect.stringMatching(/sign in with your new password/i),
      'warning',
    );
    expect((screen.getByLabelText('Current temporary password') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('New password') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Confirm new password') as HTMLInputElement).value).toBe('');
  });

  it('shows the backend message for a rejected password change and clears password values', async () => {
    mocks.changePassword.mockRejectedValue(new ApiError({
      status: 401,
      detail: 'The current password is incorrect.',
    }));
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const user = userEvent.setup();
    renderPage();
    await enterValidValues(user);
    await user.click(screen.getByRole('button', { name: /update password/i }));

    expect((await screen.findByRole('alert')).textContent)
      .toContain('The current password is incorrect.');
    expect((screen.getByLabelText('Current temporary password') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('New password') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Confirm new password') as HTMLInputElement).value).toBe('');
    expect(consoleLog).not.toHaveBeenCalled();
    consoleLog.mockRestore();
  });

  it('maps backend validation and network failures to distinct messages', () => {
    expect(getChangePasswordErrorMessage(new ApiError({
      status: 400,
      detail: 'The new password does not meet the server policy.',
    }))).toBe('The new password does not meet the server policy.');
    expect(getChangePasswordErrorMessage(new ApiError({ title: 'Network Error' })))
      .toMatch(/unable to reach the password service/i);
  });
});
