import { ApiError } from '../api/client';
import type { LoginResponse } from '../types/api';
import type { StoredSession } from '../api/tokenStore';

export function getLoginSession(response: LoginResponse, loginIdentifier?: string): StoredSession {
  const { token, refreshToken, expiresAt, refreshTokenExpiresAt } = response;
  if (!token || !refreshToken || !expiresAt || !refreshTokenExpiresAt) {
    throw new ApiError({
      status: 200,
      title: 'Incomplete sign-in response',
      detail: 'The server accepted the sign-in request but did not return a complete session. Please contact your administrator.',
    });
  }

  const roleName = response.role ?? undefined;
  const mustChangePassword = response.mustChangePassword === true;

  return {
    token,
    refreshToken,
    expiresAt,
    refreshTokenExpiresAt,
    mustChangePassword,
    loginIdentifier,
    user: {
      id: response.id ?? undefined,
      email: response.email ?? undefined,
      userName: loginIdentifier,
      staffId: response.staffId ?? undefined,
      facilityId: response.facilityId ?? undefined,
      roleName,
      mustChangePassword,
    },
  };
}

export function getLoginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Invalid credentials. Please try again.';
    if (error.status === 400) {
      return error.detail || error.message || 'Please check the sign-in information and try again.';
    }
    if (error.status === undefined) {
      return 'Unable to reach the sign-in service. Check your connection and try again.';
    }
    return error.detail || error.message || 'Sign-in could not be completed. Please try again.';
  }

  return 'Sign-in could not be completed. Please try again.';
}
