import { ApiError } from './client';
import type { LoginResponse } from '../types/api';
import { ROLE_NAMES } from '../types/roles';

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonObject
    : undefined;
}

function normalizedKey(value: string): string {
  return value.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function readField(object: JsonObject | undefined, ...names: string[]): unknown {
  if (!object) return undefined;

  const acceptedNames = new Set(names.map(normalizedKey));
  const key = Object.keys(object).find((candidate) => acceptedNames.has(normalizedKey(candidate)));
  return key === undefined ? undefined : object[key];
}

function readString(objects: Array<JsonObject | undefined>, ...names: string[]): string | undefined {
  for (const object of objects) {
    const value = readField(object, ...names);
    if (typeof value === 'string' && value.trim()) return value;
  }
  return undefined;
}

function readErrorMessage(value: unknown, depth = 0): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (depth > 4) return undefined;

  if (Array.isArray(value)) {
    for (const item of value) {
      const message = readErrorMessage(item, depth + 1);
      if (message) return message;
    }
    return undefined;
  }

  const object = asObject(value);
  if (!object) return undefined;

  for (const key of ['message', 'detail', 'description', 'title', 'errorMessage', 'error', 'errors']) {
    const message = readErrorMessage(readField(object, key), depth + 1);
    if (message) return message;
  }

  return undefined;
}

function loginResponseError(message: string): ApiError {
  return new ApiError({
    status: 200,
    title: 'Sign-in unsuccessful',
    detail: message,
  });
}

/**
 * Adapts the backend's login payload to the generated LoginResponse contract.
 * Supports direct DTOs and common ASP.NET/API envelopes without changing the
 * shared HTTP client behavior for unrelated endpoints.
 */
export function normalizeLoginResponse(raw: unknown): LoginResponse {
  let payload: unknown = raw;

  for (let depth = 0; depth < 5; depth += 1) {
    const envelope = asObject(payload);
    if (!envelope) {
      throw loginResponseError('The sign-in service returned an invalid response.');
    }

    const isSuccess = readField(envelope, 'isSuccess', 'success');
    if (isSuccess === false) {
      throw loginResponseError(
        readErrorMessage(envelope)
          ?? 'The sign-in service could not authenticate this account.',
      );
    }

    const nestedData = readField(envelope, 'data');
    if (nestedData === undefined) break;
    payload = nestedData;
  }

  const data = asObject(payload);
  if (!data) {
    throw loginResponseError('The sign-in service returned an invalid response.');
  }

  const user = asObject(readField(data, 'user', 'profile', 'account'));
  const tokens = asObject(readField(data, 'tokens', 'tokenSet'));
  const sources = [data, user, tokens];

  const roleValue = readField(user, 'role', 'roleName', 'userRole')
    ?? readField(data, 'role', 'roleName', 'userRole');
  const unnormalizedRole = typeof roleValue === 'string'
    ? roleValue
    : readString([asObject(roleValue)], 'name', 'value');
  const role = unnormalizedRole
    ? ROLE_NAMES.find((knownRole) => knownRole.toLowerCase() === unnormalizedRole.trim().toLowerCase())
      ?? unnormalizedRole
    : undefined;

  return {
    id: readString(sources, 'id', 'userId', 'subject'),
    email: readString(sources, 'email', 'userEmail'),
    staffId: readString(sources, 'staffId'),
    facilityId: readString(sources, 'facilityId', 'tenantId'),
    role,
    token: readString([tokens, data], 'token', 'accessToken', 'jwt'),
    expiresAt: readString([tokens, data], 'expiresAt', 'accessTokenExpiresAt', 'tokenExpiresAt'),
    refreshToken: readString([tokens, data], 'refreshToken'),
    refreshTokenExpiresAt: readString([tokens, data], 'refreshTokenExpiresAt'),
    mustChangePassword: readField(data, 'mustChangePassword') === true
      || readField(user, 'mustChangePassword') === true,
  };
}
