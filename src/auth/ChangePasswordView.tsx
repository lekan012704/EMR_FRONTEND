import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Circle, Eye, EyeOff, Lock } from 'lucide-react';
import { ApiError } from '../api/client';
import { getSession } from '../api/tokenStore';
import { authApi } from '../api/endpoints';
import { normalizeLoginResponse } from '../api/loginResponse';
import { AuthLayout } from '../components/auth/AuthLayout';
import { useEmr } from '../context/EmrContext';
import type { LoginResponse } from '../types/api';
import type { Role } from '../types/roles';
import { getChangePasswordErrorMessage } from './passwordChangeErrors';
import { getLoginSession } from './loginErrors';
import { isRole, roleHomeRoute } from './roles';

const passwordRules = [
  { key: 'length', label: 'At least 10 characters', test: (value: string) => value.length >= 10 },
  { key: 'uppercase', label: 'An uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
  { key: 'lowercase', label: 'A lowercase letter', test: (value: string) => /[a-z]/.test(value) },
  { key: 'digit', label: 'A number', test: (value: string) => /\d/.test(value) },
  { key: 'symbol', label: 'A symbol', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
] as const;

function containsLoginToken(value: unknown, depth = 0): boolean {
  if (!value || typeof value !== 'object' || depth > 4) return false;
  const object = value as Record<string, unknown>;
  const token = Object.entries(object).find(([key]) => (
    ['token', 'accessToken', 'jwt'].includes(key.replace(/[^a-z0-9]/gi, '').toLowerCase())
  ))?.[1];
  if (typeof token === 'string' && token.trim()) return true;
  return Object.entries(object).some(([key, nested]) => (
    ['data', 'tokens', 'tokenset'].includes(key.replace(/[^a-z0-9]/gi, '').toLowerCase())
    && containsLoginToken(nested, depth + 1)
  ));
}

function isFailureEnvelope(value: unknown, depth = 0): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value) || depth > 4) return false;
  const object = value as Record<string, unknown>;
  for (const [key, nested] of Object.entries(object)) {
    const normalizedKey = key.replace(/[^a-z0-9]/gi, '').toLowerCase();
    if (['issuccess', 'success'].includes(normalizedKey) && nested === false) return true;
    if (normalizedKey === 'data' && isFailureEnvelope(nested, depth + 1)) return true;
  }
  return false;
}

function readBackendMessage(value: unknown, depth = 0): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (!value || typeof value !== 'object' || depth > 4) return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const message = readBackendMessage(item, depth + 1);
      if (message) return message;
    }
    return undefined;
  }

  const object = value as Record<string, unknown>;
  for (const [key, item] of Object.entries(object)) {
    if (['message', 'detail', 'description', 'title', 'error', 'errors'].includes(
      key.replace(/[^a-z0-9]/gi, '').toLowerCase(),
    )) {
      const message = readBackendMessage(item, depth + 1);
      if (message) return message;
    }
  }
  return undefined;
}

type CompleteLoginResponse = LoginResponse & {
  token: string;
  refreshToken: string;
  expiresAt: string;
  refreshTokenExpiresAt: string;
  role: Role;
};

function hasFreshSession(
  login: LoginResponse | undefined,
): login is CompleteLoginResponse {
  return Boolean(
    login?.token
    && login.refreshToken
    && login.expiresAt
    && login.refreshTokenExpiresAt
    && isRole(login.role)
    && login.mustChangePassword !== true,
  );
}

export function ChangePasswordView() {
  const {
    user,
    setRole,
    setActiveTab,
    setViewMode,
    setAuthSession,
    signOut,
    addToast,
  } = useEmr();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitInFlight = useRef(false);

  const ruleResults = passwordRules.map((rule) => ({
    ...rule,
    met: rule.test(newPassword),
  }));
  const meetsPolicy = ruleResults.every((rule) => rule.met);
  const newPasswordDiffers = currentPassword.length > 0
    && newPassword.length > 0
    && currentPassword !== newPassword;
  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === newPassword;
  const isFormValid = currentPassword.length > 0
    && meetsPolicy
    && newPasswordDiffers
    && passwordsMatch;

  const errors = {
    currentPassword: !currentPassword && touched.currentPassword
      ? 'Enter your current temporary password.'
      : '',
    newPassword: !newPassword && touched.newPassword
      ? 'Enter a new password.'
      : newPassword && !meetsPolicy
        ? 'Meet every password requirement below.'
        : newPassword && currentPassword && !newPasswordDiffers
          ? 'Your new password must differ from the current password.'
          : '',
    confirmPassword: !confirmPassword && touched.confirmPassword
      ? 'Confirm your new password.'
      : confirmPassword && !passwordsMatch
        ? 'The passwords do not match.'
        : '',
  };

  const markTouched = (field: string) => {
    setTouched((previous) => ({ ...previous, [field]: true }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({
      currentPassword: true,
      newPassword: true,
      confirmPassword: true,
    });
    setError(null);
    if (!isFormValid || submitInFlight.current) return;

    const submittedCurrentPassword = currentPassword;
    const submittedNewPassword = newPassword;
    const existingSession = getSession();
    submitInFlight.current = true;
    setIsSubmitting(true);

    try {
      const response = await authApi.changePassword({
        currentPassword: submittedCurrentPassword,
        newPassword: submittedNewPassword,
        confirmNewPassword: confirmPassword,
      });

      if (isFailureEnvelope(response)) {
        throw new ApiError({
          status: 200,
          title: 'Password update unsuccessful',
          detail: readBackendMessage(response) ?? 'The password could not be changed. Please try again.',
        });
      }

      let freshLogin: LoginResponse | undefined;
      if (containsLoginToken(response)) {
        try {
          freshLogin = normalizeLoginResponse(response);
        } catch {
          // If the change endpoint returns an incomplete token envelope, use
          // the normal login endpoint to obtain a complete session instead.
        }
      }

      // The current API returns only { message }, so sign in with the new
      // password to obtain fresh access/refresh tokens and authoritative role
      // information. Never clear the password-change gate on the old token.
      const identifier = existingSession?.loginIdentifier
        || user?.email
        || user?.userName
        || user?.staffId
        || undefined;

      if (!hasFreshSession(freshLogin)) {
        if (!identifier) {
          signOut();
          addToast(
            'Password updated',
            'Your password was changed. Sign in with your new password to continue.',
            'warning',
          );
          navigate('/login', { replace: true });
          return;
        }

        try {
          freshLogin = await authApi.login({
            identifier,
            password: submittedNewPassword,
            rememberMe: true,
          });
        } catch {
          signOut();
          addToast(
            'Password updated',
            'Your password was changed, but your session could not be renewed. Sign in with your new password to continue.',
            'warning',
          );
          navigate('/login', { replace: true });
          return;
        }
      }

      if (!hasFreshSession(freshLogin)) {
        signOut();
        addToast(
          'Password updated',
          'Your password was changed, but your session could not be verified. Sign in again with your new password.',
          'warning',
        );
        navigate('/login', { replace: true });
        return;
      }

      const resolvedRole = freshLogin.role;
      const freshSession = getLoginSession(freshLogin, identifier);
      setAuthSession(freshSession);
      setRole(resolvedRole);
      setActiveTab(roleHomeRoute[resolvedRole]);
      setViewMode('app');
      addToast('Password updated', 'Your new password is ready to use.', 'success');
      navigate(`/app?tab=${encodeURIComponent(roleHomeRoute[resolvedRole])}`, { replace: true });
    } catch (submitError: unknown) {
      setError(getChangePasswordErrorMessage(submitError));
    } finally {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTouched({});
      submitInFlight.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="ACCOUNT SECURITY"
      title="Change your temporary password"
      subtitle="For your security, choose a new password before continuing to your workspace."
      footerCopy="Your password is protected by your hospital account security policy."
    >
      {error && (
        <div
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} aria-label="Change password form" className="space-y-4" noValidate>
        <input
          id="change-password-username"
          name="username"
          type="text"
          autoComplete="username"
          value={user?.userName || user?.email || ''}
          readOnly
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
        />
        <PasswordField
          id="current-password"
          label="Current temporary password"
          value={currentPassword}
          visible={showCurrentPassword}
          autoComplete="current-password"
          error={errors.currentPassword}
          disabled={isSubmitting}
          onChange={setCurrentPassword}
          onBlur={() => markTouched('currentPassword')}
          onToggle={() => setShowCurrentPassword((visible) => !visible)}
        />

        <div>
          <PasswordField
            id="new-password"
            label="New password"
            value={newPassword}
            visible={showNewPassword}
            autoComplete="new-password"
            error={errors.newPassword}
          hintId="password-requirements"
            disabled={isSubmitting}
            onChange={setNewPassword}
            onBlur={() => markTouched('newPassword')}
            onToggle={() => setShowNewPassword((visible) => !visible)}
          />
          <ul
            className="mt-2 grid grid-cols-1 gap-1 text-xs text-slate-700 sm:grid-cols-2"
            id="password-requirements"
            aria-label="New password requirements"
            aria-live="polite"
            aria-atomic="true"
          >
            {ruleResults.map((rule) => (
              <li key={rule.key} className="flex items-center gap-1.5">
                {rule.met
                  ? <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0 text-emerald-700" />
                  : <Circle aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" />}
                <span>{rule.label}</span>
                <span className="sr-only">{rule.met ? 'met' : 'not met'}</span>
              </li>
            ))}
          </ul>
        </div>

        <PasswordField
          id="confirm-new-password"
          label="Confirm new password"
          value={confirmPassword}
          visible={showConfirmPassword}
          autoComplete="new-password"
          error={errors.confirmPassword}
          disabled={isSubmitting}
          onChange={setConfirmPassword}
          onBlur={() => markTouched('confirmPassword')}
          onToggle={() => setShowConfirmPassword((visible) => !visible)}
        />

        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="auth-primary-action w-full gap-2 px-4 py-3 text-sm disabled:cursor-wait"
        >
          {isSubmitting ? 'Updating password…' : 'Update password'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        Need to leave? <Link to="/logout" className="auth-link">Sign out</Link>
      </p>
    </AuthLayout>
  );
}

function PasswordField({
  id,
  label,
  value,
  visible,
  autoComplete,
  error,
  hintId,
  disabled,
  onChange,
  onBlur,
  onToggle,
}: {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  autoComplete: string;
  error: string;
  hintId?: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
  onToggle: () => void;
}) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-800">
        {label}
      </label>
      <div className="relative">
        <Lock aria-hidden="true" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required
          aria-required="true"
          aria-invalid={Boolean(error)}
          aria-describedby={[hintId, error ? errorId : undefined].filter(Boolean).join(' ') || undefined}
          autoComplete={autoComplete}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className="auth-control py-2 pl-10 pr-12 text-sm"
        />
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
          className="auth-icon-button absolute right-1.5 top-1/2 -translate-y-1/2 hover:bg-slate-100 disabled:opacity-50"
        >
          {visible
            ? <EyeOff aria-hidden="true" className="h-4 w-4" />
            : <Eye aria-hidden="true" className="h-4 w-4" />}
        </button>
      </div>
      {error && <p id={errorId} className="mt-1 text-xs text-red-700" role="alert">{error}</p>}
    </div>
  );
}
