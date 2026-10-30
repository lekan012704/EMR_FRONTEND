import { Link } from 'react-router-dom';
import { Info, UserPlus } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';

/**
 * The API currently exposes only staff-authorized patient-record creation.
 * Keep the route, but do not present it as anonymous self-registration until
 * the backend publishes a public patient registration contract.
 */
export function PatientRegisterPage() {
  return (
    <AuthLayout
      eyebrow="PATIENT PORTAL"
      title="Online registration isn’t available yet"
      subtitle="You can still sign in if your hospital has already created your patient record."
      footerCopy="For patient safety, a new medical record must be created by authorized hospital staff."
    >
      <div
        role="status"
        aria-live="polite"
        className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
      >
        <Info aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <p>
          The documented patient-record endpoint requires authentication. This portal will not
          send personal health information to that staff-only endpoint or pretend registration
          succeeded.
        </p>
      </div>

      <Link
        to="/patient/login"
        className="auth-primary-action mt-5 w-full gap-2 px-4 py-3 text-sm"
      >
        <UserPlus aria-hidden="true" className="h-4 w-4" />
        Already registered? Sign in
      </Link>
    </AuthLayout>
  );
}
