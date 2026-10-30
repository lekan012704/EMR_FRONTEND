import { ApiError } from '../api/client';

export function getChangePasswordErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 400 || error.status === 401) {
      return error.detail || error.message || 'The password could not be changed.';
    }
    if (error.status === undefined) {
      return 'Unable to reach the password service. Check your connection and try again.';
    }
    return error.detail || error.message || 'The password could not be changed. Please try again.';
  }
  return 'The password could not be changed. Please try again.';
}
