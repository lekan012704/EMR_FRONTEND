/**
 * Axios instance for the EMR API.
 *
 * Responsibilities:
 *   - a single base URL for every call
 *   - attach `Authorization: Bearer <token>` to authenticated requests
 *   - transparently refresh an expired access token and replay the original call
 *   - normalise RFC 7807 `application/problem+json` failures into a typed error
 *   - surface a forced password change (403 + mustChangePassword) to the app
 */
import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  isAccessTokenExpired,
  updateTokens,
} from './tokenStore';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'https://emr-backend-w6xs.onrender.com/api/v1';

/** Endpoints that must never carry a bearer token or trigger a refresh. */
const ANONYMOUS_PATHS = ['/auth/login', '/auth/refresh'];

/* ----------------------------------------------------------- error model */

/**
 * A flattened RFC 7807 problem document.
 *
 * `ProblemDetails` itself declares every member as nullable, which makes it
 * awkward to consume, so the shape used inside the app normalises nulls away.
 */
export interface ApiErrorShape {
  type?: string;
  title?: string;
  /** HTTP status, when the failure came from the transport. */
  status?: number;
  detail?: string;
  instance?: string;
  /** The raw body, when the server did not return ProblemDetails. */
  raw?: unknown;
  /** Extension members carried by ProblemDetails (e.g. mustChangePassword). */
  extensions?: Record<string, unknown>;
}

export class ApiError extends Error {
  readonly status: number | undefined;
  readonly type: string | undefined;
  readonly title: string | undefined;
  readonly detail: string | undefined;
  readonly instance: string | undefined;
  readonly raw: unknown;
  /** Extension members carried by ProblemDetails (e.g. mustChangePassword). */
  readonly extensions: Record<string, unknown>;

  constructor(shape: ApiErrorShape) {
    super(shape.detail || shape.title || 'Request failed');
    this.name = 'ApiError';
    this.status = shape.status;
    this.type = shape.type;
    this.title = shape.title;
    this.detail = shape.detail;
    this.instance = shape.instance;
    this.raw = shape.raw;
    this.extensions = shape.extensions ?? {};
  }

  /** True when the server told us the account must change its password first. */
  get mustChangePassword(): boolean {
    return isPasswordChangeRequired(this.extensions);
  }
}

function normalizedKey(value: string): string {
  return value.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function readFieldCaseInsensitive(
  value: Record<string, unknown> | undefined,
  ...names: string[]
): unknown {
  if (!value) return undefined;
  const wanted = new Set(names.map(normalizedKey));
  const key = Object.keys(value).find((candidate) => wanted.has(normalizedKey(candidate)));
  return key === undefined ? undefined : value[key];
}

function isPasswordChangeCode(value: unknown): boolean {
  return typeof value === 'string'
    && normalizedKey(value) === 'passwordchangerequired';
}

function isPasswordChangeRequired(value: Record<string, unknown>): boolean {
  const nestedError = readFieldCaseInsensitive(value, 'error');
  const nestedErrorObject = nestedError && typeof nestedError === 'object'
    ? nestedError as Record<string, unknown>
    : undefined;

  return readFieldCaseInsensitive(value, 'mustChangePassword') === true
    || isPasswordChangeCode(readFieldCaseInsensitive(value, 'code', 'errorCode'))
    || isPasswordChangeCode(nestedError)
    || isPasswordChangeCode(readFieldCaseInsensitive(nestedErrorObject, 'code', 'errorCode'));
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<Record<string, unknown>>;
    const status = axiosError.response?.status;
    const body = axiosError.response?.data;

    if (body && typeof body === 'object') {
      const bodyObject = body as Record<string, unknown>;
      const type = readFieldCaseInsensitive(bodyObject, 'type');
      const title = readFieldCaseInsensitive(bodyObject, 'title');
      const bodyStatus = readFieldCaseInsensitive(bodyObject, 'status');
      const detail = readFieldCaseInsensitive(bodyObject, 'detail');
      const instance = readFieldCaseInsensitive(bodyObject, 'instance');
      const extensions = bodyObject;
      const responseMessage = readResponseErrorMessage(body);
      return new ApiError({
        type: typeof type === 'string' ? type : undefined,
        title: typeof title === 'string' ? title : undefined,
        status: typeof bodyStatus === 'number' ? bodyStatus : status,
        detail: typeof detail === 'string' ? detail : responseMessage,
        instance: typeof instance === 'string' ? instance : undefined,
        raw: body,
        extensions: extensions as Record<string, unknown>,
      });
    }

    return new ApiError({
      status,
      title: axiosError.message || 'Request failed',
      detail: axiosError.message,
      raw: body,
    });
  }

  if (error instanceof Error) {
    return new ApiError({ title: error.message, detail: error.message });
  }
  return new ApiError({ title: 'Unexpected error', detail: String(error) });
}

function readResponseErrorMessage(value: unknown, depth = 0): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (depth > 4) return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const message = readResponseErrorMessage(item, depth + 1);
      if (message) return message;
    }
    return undefined;
  }
  if (!value || typeof value !== 'object') return undefined;

  const body = value as Record<string, unknown>;
  const normalizedBody = new Map(
    Object.entries(body).map(([key, item]) => [key.replace(/[^a-z0-9]/gi, '').toLowerCase(), item]),
  );
  for (const key of ['detail', 'message', 'title', 'description', 'error', 'errors']) {
    const message = readResponseErrorMessage(normalizedBody.get(key), depth + 1);
    if (message) return message;
  }
  return undefined;
}

/* ------------------------------------------------------------- handlers */

type UnauthorizedHandler = () => void;
type PasswordChangeHandler = () => void;

let onUnauthorized: UnauthorizedHandler | null = null;
let onPasswordChangeRequired: PasswordChangeHandler | null = null;
let isPublicRoute: (() => boolean) | null = null;

/** Registered by the auth provider so the client can drive navigation. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

export function setPasswordChangeRequiredHandler(handler: PasswordChangeHandler | null) {
  onPasswordChangeRequired = handler;
}

/** Registered by the app to tell the client if the current route is public (no auth required). */
export function setPublicRouteChecker(checker: (() => boolean) | null) {
  isPublicRoute = checker;
}

/* ---------------------------------------------------------- token refresh */

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const token = getAccessToken();
  const refreshToken = getRefreshToken();
  if (!token || !refreshToken) return null;

  try {
    const { data } = await axios.post<{
      token: string;
      expiresAt: string;
      refreshToken?: string | null;
      refreshTokenExpiresAt?: string | null;
    }>(
      `${API_BASE_URL}/auth/refresh`,
      { token, refreshToken },
      { headers: { 'Content-Type': 'application/json' } },
    );
    updateTokens({
      token: data.token,
      expiresAt: data.expiresAt,
      refreshToken: data.refreshToken ?? undefined,
      refreshTokenExpiresAt: data.refreshTokenExpiresAt ?? undefined,
    });
    return data.token;
  } catch {
    clearSession();
    return null;
  }
}

/** Single-flight refresh: concurrent 401s wait on the same request. */
function ensureRefreshed(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

function isAnonymous(url: string | undefined): boolean {
  if (!url) return false;
  return ANONYMOUS_PATHS.some((path) => url.includes(path));
}

/* ------------------------------------------------------------- instance */

export const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

http.interceptors.request.use((config) => {
  if (!isAnonymous(config.url)) {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const axiosError = error as AxiosError;
    const status = axiosError?.response?.status;
    const config = axiosError?.config as RetriableConfig | undefined;

    // A 403 that demands a password change takes priority over everything else.
    if (status === 403 && axiosError.response) {
      const apiError = toApiError(error);
      if (apiError.mustChangePassword) {
        onPasswordChangeRequired?.();
        return Promise.reject(apiError);
      }
    }

    // Expired / invalid access token: refresh once, then replay the request.
    if (status === 401 && config && !config._retried && !isAnonymous(config.url)) {
      config._retried = true;
      const fresh = await ensureRefreshed();
      if (fresh) {
        config.headers.Authorization = `Bearer ${fresh}`;
        return http.request(config);
      }
      // Only trigger unauthorized handler if not on a public route (e.g., login page)
      if (!isPublicRoute?.()) {
        onUnauthorized?.();
      }
    }

    return Promise.reject(toApiError(error));
  },
);

/* --------------------------------------------------- unwrapped verbs */

/**
 * Thin wrappers that resolve to the response body rather than an
 * `AxiosResponse`, so callers can `await apiGet<T>()` and use the payload.
 */
export async function apiGet<T>(
  url: string,
  config?: Parameters<AxiosInstance['get']>[1],
): Promise<T> {
  const { data } = await http.get<T>(url, config);
  return data;
}

export async function apiPost<T>(
  url: string,
  body?: unknown,
  config?: Parameters<AxiosInstance['post']>[2],
): Promise<T> {
  const { data } = await http.post<T>(url, body, config);
  return data;
}

export async function apiPut<T>(
  url: string,
  body?: unknown,
  config?: Parameters<AxiosInstance['put']>[2],
): Promise<T> {
  const { data } = await http.put<T>(url, body, config);
  return data;
}

export async function apiPatch<T>(
  url: string,
  body?: unknown,
  config?: Parameters<AxiosInstance['patch']>[2],
): Promise<T> {
  const { data } = await http.patch<T>(url, body, config);
  return data;
}

export { toApiError };
