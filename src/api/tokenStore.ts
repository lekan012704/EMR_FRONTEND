/**
 * Token persistence for the EMR API.
 *
 * The API returns the JWT in the login response body, so a httpOnly cookie is not
 * available to us. To keep the blast radius small we split the two tokens:
 *
 *   - access token  -> in-memory + sessionStorage (dies with the browser tab)
 *   - refresh token -> localStorage (survives a reload so the session can be renewed)
 *
 * Both are cleared together on logout or on a failed refresh.
 */

export interface StoredSession {
  token: string;
  refreshToken: string;
  expiresAt: string;
  refreshTokenExpiresAt: string;
  mustChangePassword?: boolean;
  loginIdentifier?: string;
  user?: StoredSessionUser;
}

export interface StoredSessionUser {
  id?: string;
  identityId?: string;
  userName?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  staffId?: string | null;
  facilityId?: string | null;
  roleName?: string | null;
  mustChangePassword?: boolean;
}

const ACCESS_KEY = 'emr.session.access';
const REFRESH_KEY = 'emr.session.refresh';

function readJson<T>(key: string, storage: Storage): T | null {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown, storage: Storage) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode / quota) - the in-memory copy still works */
  }
}

function remove(key: string) {
  try {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** In-memory mirror so we avoid touching sessionStorage on every request. */
let memory: StoredSession | null = null;

export function getSession(): StoredSession | null {
  if (memory) return memory;
  const access = readJson<StoredSession>(ACCESS_KEY, sessionStorage);
  const refresh = readJson<StoredSession>(REFRESH_KEY, localStorage);
  if (access?.token) {
    memory = { ...access, ...refresh };
    return memory;
  }
  return null;
}

export function getAccessToken(): string | null {
  return getSession()?.token ?? null;
}

export function getRefreshToken(): string | null {
  return getSession()?.refreshToken || null;
}

export function setSession(session: StoredSession): void {
  memory = session;
  writeJson(
    ACCESS_KEY,
    {
      token: session.token,
      expiresAt: session.expiresAt,
      mustChangePassword: session.mustChangePassword ?? false,
      loginIdentifier: session.loginIdentifier,
      user: session.user,
    },
    sessionStorage,
  );
  writeJson(
    REFRESH_KEY,
    { refreshToken: session.refreshToken, refreshTokenExpiresAt: session.refreshTokenExpiresAt },
    localStorage,
  );
}

/** Update only the token pair after a refresh - keeps the session in sync. */
export function updateTokens(tokens: {
  token: string;
  refreshToken?: string | null;
  expiresAt: string;
  refreshTokenExpiresAt?: string | null;
}): void {
  const current = getSession();
  if (!current) return;
  setSession({
    ...current,
    token: tokens.token,
    refreshToken: tokens.refreshToken ?? current.refreshToken,
    expiresAt: tokens.expiresAt,
    refreshTokenExpiresAt: tokens.refreshTokenExpiresAt ?? current.refreshTokenExpiresAt,
  });
}

/** Persist the password-change gate with the access-token session. */
export function updateMustChangePassword(required: boolean): void {
  const current = getSession();
  if (!current) return;
  setSession({
    ...current,
    mustChangePassword: required,
    user: current.user
      ? { ...current.user, mustChangePassword: required }
      : undefined,
  });
}

export function clearSession(): void {
  memory = null;
  remove(ACCESS_KEY);
  remove(REFRESH_KEY);
}

/** True when the access token is at (or past) its expiry. */
export function isAccessTokenExpired(): boolean {
  const session = getSession();
  if (!session?.expiresAt) return false;
  const expiry = Date.parse(session.expiresAt);
  if (Number.isNaN(expiry)) return false;
  // 30s of slack so we refresh before the server rejects the request.
  return expiry - 30_000 <= Date.now();
}
