import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { authApi } from '../api/endpoints';
import { useEmr } from '../context/EmrContext';
import { isRole, roleHomeRoute } from './roles';
import { getLoginErrorMessage, getLoginSession } from './loginErrors';
import { ROLES } from '../types/roles';

interface PatientLoginPageProps {
  onLoginSuccess: (role: typeof ROLES.Patient) => void;
}

/** Patient login uses the shared backend login contract and verifies its role. */
export function PatientLoginPage({ onLoginSuccess }: PatientLoginPageProps) {
  const { addToast, setAuthSession } = useEmr();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSlowRequest, setIsSlowRequest] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setIsSlowRequest(false);
    const slowTimer = window.setTimeout(() => setIsSlowRequest(true), 5000);

    try {
      const response = await authApi.login({
        identifier: identifier.trim(),
        password,
        rememberMe: true,
      });

      if (!isRole(response.role)) {
        setError('The server accepted the sign-in request but did not return a recognized account role. Please contact your administrator.');
        return;
      }
      if (response.role !== ROLES.Patient) {
        setError('This account is not configured for patient portal access. Hospital staff should use staff sign in.');
        return;
      }

      setAuthSession(getLoginSession(response, identifier.trim()));

      if (response.mustChangePassword) {
        addToast('Password update required', 'Set a new password to continue.', 'info');
      } else {
        addToast('Signed in', 'Your patient portal is ready.', 'success');
      }
      onLoginSuccess(ROLES.Patient);
      navigate(
        response.mustChangePassword
          ? '/change-password'
          : `/app?tab=${encodeURIComponent(roleHomeRoute[ROLES.Patient])}`,
        { replace: true },
      );
    } catch (error: unknown) {
      const message = getLoginErrorMessage(error);
      setError(message);
      addToast('Sign-in failed', message, 'error');
    } finally {
      window.clearTimeout(slowTimer);
      setIsLoading(false);
      setIsSlowRequest(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="PATIENT PORTAL"
      title="Sign in to your patient portal"
      subtitle="Use the medical record number or phone number on your account and your password."
      footerCopy="Your health information is shown only after the backend authenticates your account."
    >
      <p className="mb-5 text-sm text-slate-600">
        Hospital staff?{' '}
        <Link
          to="/login"
          className="auth-link"
        >
          Staff sign in
        </Link>
      </p>

      {error && (
        <div
          className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} aria-label="Patient login form" className="space-y-4">
        <div>
          <label htmlFor="patient-identifier" className="mb-1.5 block text-sm font-semibold text-slate-800">
            Medical record number or registered phone
          </label>
          <input
            id="patient-identifier"
            type="text"
            required
            autoComplete="username"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="Enter your MRN or phone number"
            className="auth-control px-3.5 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="patient-password" className="mb-1.5 block text-sm font-semibold text-slate-800">
            Password or portal PIN
          </label>
          <div className="relative">
            <Lock aria-hidden="true" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              id="patient-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="auth-control py-2 pl-10 pr-12 text-sm"
            />
            <button
              id="patient-password-toggle"
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="auth-icon-button absolute right-1.5 top-1/2 -translate-y-1/2 hover:bg-slate-100"
            >
              {showPassword
                ? <EyeOff aria-hidden="true" className="h-4 w-4" />
                : <Eye aria-hidden="true" className="h-4 w-4" />}
            </button>
          </div>
          <div className="mt-2 text-right">
            <Link
              to="/patient/forgot-pin"
              className="auth-link inline-flex min-h-11 items-center text-sm"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="auth-primary-action w-full gap-2 px-4 py-3 text-sm disabled:cursor-wait"
        >
          {isLoading ? (isSlowRequest ? 'Connecting securely…' : 'Signing in…') : 'Sign in'}
          {!isLoading && <ArrowRight aria-hidden="true" className="h-4 w-4" />}
        </button>
      </form>
    </AuthLayout>
  );
}
