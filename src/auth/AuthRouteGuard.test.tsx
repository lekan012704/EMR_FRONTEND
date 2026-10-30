import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { clearSession, setSession } from '../api/tokenStore';
import { AuthRouteGuard } from './AuthRouteGuard';

const authState = vi.hoisted(() => ({
  value: {
    role: 'SuperAdmin' as string | null,
    isRoleLoading: false,
    mustChangePassword: false,
  },
}));

vi.mock('../context/EmrContext', () => ({
  useEmr: () => authState.value,
}));

function RouteProbe() {
  const location = useLocation();
  return (
    <output data-testid="current-route">{location.pathname}{location.search}</output>
  );
}

function GuardedContent() {
  const location = useLocation();
  if (location.pathname === '/app') return <p>Protected content</p>;
  if (location.pathname === '/change-password') return <p>Password form</p>;
  return null;
}

function renderGuard(path: string, children: ReactNode = <GuardedContent />) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <RouteProbe />
      <AuthRouteGuard>{children}</AuthRouteGuard>
    </MemoryRouter>,
  );
}

function createSession(mustChangePassword = false) {
  setSession({
    token: 'access-token',
    refreshToken: 'refresh-token',
    expiresAt: '2099-01-01T00:00:00.000Z',
    refreshTokenExpiresAt: '2099-01-08T00:00:00.000Z',
    mustChangePassword,
    user: { roleName: 'SuperAdmin', mustChangePassword },
  });
}

describe('AuthRouteGuard', () => {
  beforeEach(() => {
    clearSession();
    authState.value = {
      role: 'SuperAdmin',
      isRoleLoading: false,
      mustChangePassword: false,
    };
  });

  it('redirects unauthenticated users away from protected routes', async () => {
    renderGuard('/app?tab=reports');

    await waitFor(() => {
      expect(screen.getByTestId('current-route').textContent).toBe('/login');
    });
    expect(screen.queryByText('Protected content')).toBeNull();
  });

  it('forces an authenticated first-login session through password change', async () => {
    createSession(true);
    authState.value.mustChangePassword = true;
    renderGuard('/app?tab=reports');

    await waitFor(() => {
      expect(screen.getByTestId('current-route').textContent).toBe('/change-password');
    });
  });

  it('allows the password page while required and returns changed sessions to their role home', async () => {
    createSession(true);
    authState.value.mustChangePassword = true;
    const { unmount } = renderGuard('/change-password');
    expect(screen.getByText('Password form')).toBeTruthy();

    unmount();
    clearSession();
    createSession(false);
    authState.value.mustChangePassword = false;
    renderGuard('/change-password');

    await waitFor(() => {
      expect(screen.getByTestId('current-route').textContent).toBe('/app?tab=reports');
    });
  });
});
