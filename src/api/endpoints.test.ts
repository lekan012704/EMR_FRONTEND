import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiPost } from './client';
import { authApi, registerPatient } from './endpoints';
import type {
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
  PatientResponse,
  RegisterPatientRequest,
} from '../types/api';

vi.mock('./client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./client')>();
  return {
    ...actual,
    apiGet: vi.fn(),
    apiPatch: vi.fn(),
    apiPost: vi.fn(),
    apiPut: vi.fn(),
  };
});

const apiPostMock = vi.mocked(apiPost);

describe('generated endpoint aliases', () => {
  beforeEach(() => {
    apiPostMock.mockReset();
  });

  it('registerPatient delegates to the documented patient-record endpoint', async () => {
    const request: RegisterPatientRequest = {
      firstName: 'Ada',
      lastName: 'Example',
      phoneNumber: '+2348000000000',
      allowDuplicateOverride: false,
    };
    const response: PatientResponse = { id: 'patient-1' };
    apiPostMock.mockResolvedValue(response as never);

    await expect(registerPatient(request)).resolves.toBe(response);
    expect(apiPostMock).toHaveBeenCalledWith('/patients', request);
  });

  it('authApi.login uses the existing backend login endpoint', async () => {
    const request: LoginRequest = {
      identifier: 'staff@example.test',
      password: 'example-password',
      rememberMe: true,
    };
    const response: LoginResponse = {
      role: 'Doctor',
      token: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: '2030-01-01T00:00:00.000Z',
      refreshTokenExpiresAt: '2030-02-01T00:00:00.000Z',
    };
    apiPostMock.mockResolvedValue(response as never);

    await expect(authApi.login(request)).resolves.toMatchObject(response);
    expect(apiPostMock).toHaveBeenCalledWith('/auth/login', request);
  });

  it('posts the backend ChangePassword request field names and returns its message payload', async () => {
    const request: ChangePasswordRequest = {
      currentPassword: 'temporary-password',
      newPassword: 'A-new-password#123',
      confirmNewPassword: 'A-new-password#123',
    };
    const response = { message: 'Password changed successfully.' };
    apiPostMock.mockResolvedValue(response as never);

    await expect(authApi.changePassword(request)).resolves.toEqual(response);
    expect(apiPostMock).toHaveBeenCalledWith('/auth/change-password', request);
  });

  it('normalizes a PascalCase response envelope with nested data and accessToken', async () => {
    const request: LoginRequest = {
      identifier: 'staff@example.test',
      password: 'example-password',
      rememberMe: true,
    };
    apiPostMock.mockResolvedValue({
      IsSuccess: true,
      Data: {
        Data: {
          AccessToken: 'access-token',
          RefreshToken: 'refresh-token',
          ExpiresAt: '2030-01-01T00:00:00.000Z',
          RefreshTokenExpiresAt: '2030-02-01T00:00:00.000Z',
          User: {
            Id: 'staff-1',
            Email: 'staff@example.test',
            RoleName: 'SuperAdmin',
          },
        },
      },
      Error: null,
    } as never);

    await expect(authApi.login(request)).resolves.toEqual({
      id: 'staff-1',
      email: 'staff@example.test',
      role: 'SuperAdmin',
      token: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: '2030-01-01T00:00:00.000Z',
      refreshTokenExpiresAt: '2030-02-01T00:00:00.000Z',
      staffId: undefined,
      facilityId: undefined,
      mustChangePassword: false,
    });
  });

  it('preserves the backend message from a 200 failure envelope', async () => {
    apiPostMock.mockResolvedValue({
      isSuccess: false,
      data: null,
      error: { message: 'This account is locked. Contact your administrator.' },
    } as never);

    await expect(authApi.login({ identifier: 'user', password: 'bad' }))
      .rejects.toMatchObject({
        status: 200,
        message: 'This account is locked. Contact your administrator.',
      });
  });
});
