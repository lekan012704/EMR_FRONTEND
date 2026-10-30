import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { EmrProvider, useEmr } from '../../context/EmrContext';
import type { Role } from '../../types/roles';
import { SuperAdminDashboardView } from './SuperAdminDashboardView';

function RoleSetter({ role }: { role: Role }) {
  const { setRole } = useEmr();

  useEffect(() => {
    setRole(role);
  }, [role, setRole]);

  return <SuperAdminDashboardView />;
}

function renderDashboard(role: Role) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/login']}>
        <EmrProvider>
          <RoleSetter role={role} />
        </EmrProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SuperAdmin dashboard authorization', () => {
  it('renders platform administration for the backend SuperAdmin role', () => {
    renderDashboard('SuperAdmin');

    expect(screen.getByRole('heading', { name: /superadmin dashboard/i })).toBeTruthy();
    expect(screen.getByText(/patient records, encounters, and billing data remain restricted/i)).toBeTruthy();
  });

  it('does not render the platform dashboard for a clinical role', () => {
    renderDashboard('Doctor');

    expect(screen.getByRole('alert').textContent).toMatch(/only available to superadmin accounts/i);
    expect(screen.queryByRole('heading', { name: /superadmin dashboard/i })).toBeNull();
  });
});
