import { AxiosError, type AxiosAdapter, type AxiosResponse } from 'axios';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import {
  http,
  setPasswordChangeRequiredHandler,
} from './client';
import { clearSession, setSession } from './tokenStore';

describe('HTTP client forced password-change handling', () => {
  let originalAdapter: typeof http.defaults.adapter;

  beforeEach(() => {
    originalAdapter = http.defaults.adapter;
    clearSession();
    setSession({
      token: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: '2099-01-01T00:00:00.000Z',
      refreshTokenExpiresAt: '2099-01-08T00:00:00.000Z',
      mustChangePassword: true,
    });
    setPasswordChangeRequiredHandler(null);
  });

  afterEach(() => {
    http.defaults.adapter = originalAdapter;
    setPasswordChangeRequiredHandler(null);
    clearSession();
  });

  it('attaches the bearer token to the authenticated password-change endpoint', async () => {
    let authorization: unknown;
    const adapter: AxiosAdapter = async (config) => {
      authorization = config.headers.get('Authorization');
      return {
        data: { message: 'Password changed successfully.' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };
    http.defaults.adapter = adapter;

    await http.post('/auth/change-password', {
      currentPassword: 'temporary',
      newPassword: 'New#Password123',
      confirmNewPassword: 'New#Password123',
    });

    expect(authorization).toBe('Bearer access-token');
  });

  it.each([
    ['top-level code', { code: 'PASSWORD_CHANGE_REQUIRED' }],
    ['nested error code', { error: { code: 'PASSWORD_CHANGE_REQUIRED' } }],
    ['errorCode', { errorCode: 'PASSWORD_CHANGE_REQUIRED' }],
    ['current middleware shape', {
      error: 'PasswordChangeRequired',
      mustChangePassword: true,
      message: 'You must change your password before performing this action.',
    }],
  ])('notifies the app for a 403 using %s', async (_label, body) => {
    const redirect = vi.fn();
    setPasswordChangeRequiredHandler(redirect);
    const adapter: AxiosAdapter = async (config) => {
      const response: AxiosResponse = {
        data: body,
        status: 403,
        statusText: 'Forbidden',
        headers: {},
        config,
      };
      throw new AxiosError(
        'Forbidden',
        AxiosError.ERR_BAD_REQUEST,
        config,
        undefined,
        response,
      );
    };
    http.defaults.adapter = adapter;

    await expect(http.get('/patients')).rejects.toMatchObject({ status: 403 });
    expect(redirect).toHaveBeenCalledTimes(1);
  });
});
