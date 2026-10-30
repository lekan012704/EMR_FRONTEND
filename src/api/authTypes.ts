import type { LoginResponse } from '../types/api';

/**
 * The API currently returns `{ message }` from change-password. Some deployed
 * versions may return a full login response instead, so keep both shapes typed.
 */
export type ChangePasswordResponse = Partial<LoginResponse> & {
  message?: string;
  isSuccess?: boolean;
  data?: unknown;
  error?: unknown;
  errorCode?: string;
  code?: string;
};
