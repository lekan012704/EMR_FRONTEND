import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSession, setSession } from '../api/tokenStore';
import {
  appointmentsApi,
  auditsApi,
  authApi,
  billingApi,
  encountersApi,
  facilitiesApi,
  patientsApi,
  staffApi,
} from '../api/endpoints';
import type { PatientResponse } from '../types/api';
import type { Facility, Patient } from '../types/emr';
import { EmrProvider, useEmr } from './EmrContext';

vi.mock('../api/endpoints', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/endpoints')>();
  return {
    ...actual,
    appointmentsApi: {
      ...actual.appointmentsApi,
      getAppointments: vi.fn(),
    },
    billingApi: {
      ...actual.billingApi,
      getInvoices: vi.fn(),
    },
    encountersApi: {
      ...actual.encountersApi,
      getEncounters: vi.fn(),
    },
    authApi: {
      ...actual.authApi,
      getCurrentUser: vi.fn(),
    },
    facilitiesApi: {
      ...actual.facilitiesApi,
      getFacilities: vi.fn(),
    },
    staffApi: {
      ...actual.staffApi,
      getStaff: vi.fn(),
    },
    auditsApi: {
      ...actual.auditsApi,
      getAuditLogs: vi.fn(),
    },
    patientsApi: {
      ...actual.patientsApi,
      registerPatient: vi.fn(),
      searchPatients: vi.fn(),
    },
  };
});

const currentUserMock = vi.mocked(authApi.getCurrentUser);
const appointmentsMock = vi.mocked(appointmentsApi.getAppointments);
const invoicesMock = vi.mocked(billingApi.getInvoices);
const encountersMock = vi.mocked(encountersApi.getEncounters);
const facilitiesMock = vi.mocked(facilitiesApi.getFacilities);
const staffMock = vi.mocked(staffApi.getStaff);
const auditsMock = vi.mocked(auditsApi.getAuditLogs);
const searchPatientsMock = vi.mocked(patientsApi.searchPatients);
const registerPatientMock = vi.mocked(patientsApi.registerPatient);

const facility: Facility = {
  id: 'facility-1',
  name: 'Carevia Health',
  code: 'CAREVIA',
  city: 'Abuja',
  state: 'FCT',
  address: '',
  phone: '',
};

const patientInput: Omit<Patient, 'id' | 'mrn' | 'createdAt' | 'facilityId'> = {
  firstName: 'Ada',
  lastName: 'Example',
  gender: 'Female',
  dob: '1990-01-01',
  phone: '+2348000000000',
  email: 'ada@example.test',
  address: 'Abuja',
  bloodGroup: 'O+',
  genotype: 'AA',
  allergies: [],
  nextOfKin: { name: 'Sam Example', relationship: 'Sibling', phone: '+2348000000001' },
};

function createWrapper(initialEntry = '/login') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <EmrProvider>{children}</EmrProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };
}

describe('EmrContext patient registration', () => {
  beforeEach(() => {
    clearSession();
    currentUserMock.mockReset();
    appointmentsMock.mockReset();
    invoicesMock.mockReset();
    encountersMock.mockReset();
    facilitiesMock.mockReset();
    staffMock.mockReset();
    auditsMock.mockReset();
    searchPatientsMock.mockReset();
    registerPatientMock.mockReset();
  });

  it('restores SuperAdmin from the backend profile and loads only platform data', async () => {
    setSession({
      token: 'test-access-token',
      refreshToken: 'test-refresh-token',
      expiresAt: '2099-01-01T00:00:00.000Z',
      refreshTokenExpiresAt: '2099-01-08T00:00:00.000Z',
      user: {
        userName: 'admin@emr.local',
        email: 'admin@emr.local',
        roleName: 'SuperAdmin',
        facilityId: 'facility-1',
      },
    });
    facilitiesMock.mockResolvedValue([]);
    staffMock.mockResolvedValue([]);
    auditsMock.mockResolvedValue([]);

    const { result } = renderHook(() => useEmr(), {
      wrapper: createWrapper('/app'),
    });

    await waitFor(() => expect(result.current.role).toBe('SuperAdmin'));
    await waitFor(() => {
      expect(facilitiesMock).toHaveBeenCalled();
      expect(staffMock).toHaveBeenCalled();
      expect(auditsMock).toHaveBeenCalled();
    });
    expect(currentUserMock).not.toHaveBeenCalled();
    expect(searchPatientsMock).not.toHaveBeenCalled();
    expect(appointmentsMock).not.toHaveBeenCalled();
    expect(encountersMock).not.toHaveBeenCalled();
    expect(invoicesMock).not.toHaveBeenCalled();
  });

  it('returns the created patient from the backend response', async () => {
    const response: PatientResponse = {
      id: 'patient-1',
      medicalRecordNumber: 'MRN-0001',
      firstName: 'Ada',
      lastName: 'Example',
      dateOfBirth: '1990-01-01',
      gender: 'Female',
      phoneNumber: '+2348000000000',
      facilityId: facility.id,
      createdAt: '2026-10-27T10:00:00.000Z',
    };
    registerPatientMock.mockResolvedValue(response);

    const { result } = renderHook(() => useEmr(), { wrapper: createWrapper() });
    act(() => result.current.setFacility(facility));

    let created: Patient | undefined;
    await act(async () => {
      const registration = await result.current.registerPatient(patientInput);
      if (registration.success) created = registration.patient;
    });

    expect(created).toMatchObject({
      id: 'patient-1',
      mrn: 'MRN-0001',
      firstName: 'Ada',
      facilityId: facility.id,
    });
    expect(registerPatientMock).toHaveBeenCalledWith(
      expect.objectContaining({ facilityId: facility.id }),
    );
  });

  it('returns a visible failure result when patient registration is rejected', async () => {
    registerPatientMock.mockRejectedValue(new Error('Registration forbidden'));

    const { result } = renderHook(() => useEmr(), { wrapper: createWrapper() });
    act(() => result.current.setFacility(facility));

    let registration;
    await act(async () => {
      registration = await result.current.registerPatient(patientInput);
    });
    expect(registration).toEqual({ success: false, error: 'Registration forbidden' });
  });

  it('returns a failure result when a success response contains no patient identity', async () => {
    registerPatientMock.mockResolvedValue(undefined as never);

    const { result } = renderHook(() => useEmr(), { wrapper: createWrapper() });
    act(() => result.current.setFacility(facility));

    let registration;
    await act(async () => {
      registration = await result.current.registerPatient(patientInput);
    });
    expect(registration).toEqual({
      success: false,
      error: 'The patient service did not return a valid patient record.',
    });
  });

  it('does not issue application data requests while a password change is required', async () => {
    setSession({
      token: 'test-access-token',
      refreshToken: 'test-refresh-token',
      expiresAt: '2099-01-01T00:00:00.000Z',
      refreshTokenExpiresAt: '2099-01-08T00:00:00.000Z',
      mustChangePassword: true,
      user: {
        email: 'admin@emr.local',
        roleName: 'SuperAdmin',
        mustChangePassword: true,
      },
    });
    const { result } = renderHook(() => useEmr(), { wrapper: createWrapper('/app') });

    await waitFor(() => expect(result.current.mustChangePassword).toBe(true));
    expect(currentUserMock).not.toHaveBeenCalled();
    expect(facilitiesMock).not.toHaveBeenCalled();
    expect(staffMock).not.toHaveBeenCalled();
    expect(auditsMock).not.toHaveBeenCalled();
    expect(searchPatientsMock).not.toHaveBeenCalled();
    expect(appointmentsMock).not.toHaveBeenCalled();
    expect(encountersMock).not.toHaveBeenCalled();
    expect(invoicesMock).not.toHaveBeenCalled();
  });
});
