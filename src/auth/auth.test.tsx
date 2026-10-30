import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { StaffLoginPage } from "./StaffLoginPage";
import { PatientLoginPage } from "./PatientLoginPage";
import { PatientRegisterPage } from "./PatientRegisterPage";
import * as endpoints from "../api/endpoints";
import { ApiError } from "../api/client";
import { canAccessTab, humanizeRole, isRole, isStaffRole, roleHomeRoute } from "./roles";
import { ROLE_NAMES } from "../types/roles";
import type { LoginResponse } from "../types/api";

vi.mock("../context/EmrContext", () => ({
  useEmr: () => ({
    addToast: vi.fn(),
    setAuthSession: vi.fn(),
    setMustChangePassword: vi.fn(),
    facility: { id: "facility-1", name: "Carevia Health", code: "CAREVIA" },
  }),
}));

vi.mock("../api/tokenStore", () => ({
  setSession: vi.fn(),
}));

vi.mock("../api/endpoints", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/endpoints")>();
  return {
    ...actual,
    authApi: { ...actual.authApi, login: vi.fn() },
  };
});

const loginMock = vi.mocked(endpoints.authApi.login);
const token = "test-session-token";

function loginResponse(role: string, mustChangePassword = false): LoginResponse {
  return {
    token,
    refreshToken: "test-refresh-token",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    refreshTokenExpiresAt: new Date(Date.now() + 120_000).toISOString(),
    role,
    mustChangePassword,
  };
}

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="current-location">{location.pathname}{location.search}</output>;
}

function renderInRouter(ui: ReactNode) {
  return render(
    <MemoryRouter>
      <LocationProbe />
      {ui}
    </MemoryRouter>,
  );
}

describe("separate authentication pages", () => {
  beforeEach(() => {
    loginMock.mockReset();
  });

  it("redirects staff to the home route selected by the backend role", async () => {
    loginMock.mockResolvedValue(loginResponse("Doctor"));
    const user = userEvent.setup();
    const onLoginSuccess = vi.fn();

    renderInRouter(
      <StaffLoginPage
        onLoginSuccess={onLoginSuccess}
      />,
    );

    await user.type(screen.getByLabelText(/staff username or email/i), "doctor@example.test");
    await user.type(screen.getByLabelText(/^password$/i), "correct-password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByTestId("current-location").textContent).toBe("/app?tab=overview");
    });
    expect(onLoginSuccess).toHaveBeenCalledWith("Doctor");
    expect(loginMock).toHaveBeenCalledWith({
      identifier: "doctor@example.test",
      password: "correct-password",
      rememberMe: true,
    });
    expect(screen.queryByText(/select staff role profile/i)).toBeNull();
  });

  it("sends a first-login staff session to the mandatory password-change route", async () => {
    loginMock.mockResolvedValue(loginResponse("SuperAdmin", true));
    const user = userEvent.setup();

    renderInRouter(<StaffLoginPage onLoginSuccess={vi.fn()} />);
    await user.type(screen.getByLabelText(/staff username or email/i), "admin@example.test");
    await user.type(screen.getByLabelText(/^password$/i), "temporary-password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByTestId("current-location").textContent).toBe("/change-password");
    });
  });

  it("shows a generic error for rejected staff credentials", async () => {
    loginMock.mockRejectedValue(new ApiError({
      status: 401,
      title: "Unauthorized",
      detail: "Account doctor@example.test does not exist",
    }));
    const user = userEvent.setup();

    renderInRouter(
      <StaffLoginPage
        onLoginSuccess={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText(/staff username or email/i), "doctor@example.test");
    await user.type(screen.getByLabelText(/^password$/i), "wrong-password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect((await screen.findByRole("alert")).textContent).toBe("Invalid credentials. Please try again.");
    expect(screen.getByRole("alert").textContent).not.toMatch(/does not exist|account doctor/i);
  });

  it("accepts SuperAdmin and redirects to the administrative workspace", async () => {
    loginMock.mockResolvedValue(loginResponse("SuperAdmin"));
    const user = userEvent.setup();
    const onLoginSuccess = vi.fn();

    renderInRouter(<StaffLoginPage onLoginSuccess={onLoginSuccess} />);
    await user.type(screen.getByLabelText(/staff username or email/i), "superadmin@example.test");
    await user.type(screen.getByLabelText(/^password$/i), "correct-password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByTestId("current-location").textContent).toBe("/app?tab=reports");
    });
    expect(onLoginSuccess).toHaveBeenCalledWith("SuperAdmin");
  });

  it("shows a connection error rather than blaming credentials when the API is unreachable", async () => {
    loginMock.mockRejectedValue(new ApiError({ title: "Network Error" }));
    const user = userEvent.setup();

    renderInRouter(<StaffLoginPage onLoginSuccess={vi.fn()} />);
    await user.type(screen.getByLabelText(/staff username or email/i), "doctor@example.test");
    await user.type(screen.getByLabelText(/^password$/i), "correct-password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect((await screen.findByRole("alert")).textContent).toMatch(/unable to reach the sign-in service/i);
    expect(screen.getByRole("alert").textContent).not.toMatch(/invalid credentials/i);
  });

  it("shows the backend message for a rejected 400 login request", async () => {
    loginMock.mockRejectedValue(new ApiError({
      status: 400,
      detail: "The sign-in request is missing a required field.",
    }));
    const user = userEvent.setup();

    renderInRouter(<StaffLoginPage onLoginSuccess={vi.fn()} />);
    await user.type(screen.getByLabelText(/staff username or email/i), "doctor@example.test");
    await user.type(screen.getByLabelText(/^password$/i), "correct-password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect((await screen.findByRole("alert")).textContent)
      .toContain("The sign-in request is missing a required field.");
  });

  it("shows the backend message from a 200 failure envelope", async () => {
    loginMock.mockRejectedValue(new ApiError({
      status: 200,
      title: "Sign-in unsuccessful",
      detail: "This account is locked. Contact your administrator.",
    }));
    const user = userEvent.setup();

    renderInRouter(<StaffLoginPage onLoginSuccess={vi.fn()} />);
    await user.type(screen.getByLabelText(/staff username or email/i), "doctor@example.test");
    await user.type(screen.getByLabelText(/^password$/i), "correct-password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect((await screen.findByRole("alert")).textContent)
      .toContain("This account is locked. Contact your administrator.");
  });

  it("renders a patient-only login and redirects to the patient home", async () => {
    loginMock.mockResolvedValue(loginResponse("Patient"));
    const user = userEvent.setup();
    const onLoginSuccess = vi.fn();

    renderInRouter(
      <PatientLoginPage onLoginSuccess={onLoginSuccess} />,
    );

    expect(screen.getByRole("heading", { name: /sign in to your patient portal/i })).toBeTruthy();
    expect(screen.queryByText(/select staff role profile|staff & clinical access|hospital staff portal/i)).toBeNull();
    await user.type(screen.getByLabelText(/medical record number/i), "PT-1001");
    await user.type(screen.getByLabelText(/portal pin/i), "1234");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByTestId("current-location").textContent).toBe("/app?tab=portal");
    });
    expect(onLoginSuccess).toHaveBeenCalledWith("Patient");
  });

  it("rejects a non-patient role on the patient login page", async () => {
    loginMock.mockResolvedValue(loginResponse("Doctor"));
    const user = userEvent.setup();
    const onLoginSuccess = vi.fn();

    renderInRouter(<PatientLoginPage onLoginSuccess={onLoginSuccess} />);
    await user.type(screen.getByLabelText(/medical record number/i), "person@example.test");
    await user.type(screen.getByLabelText(/portal pin/i), "password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "This account is not configured for patient portal access.",
    );
    expect(onLoginSuccess).not.toHaveBeenCalled();
    expect(screen.getByTestId("current-location").textContent).toBe("/");
  });

  it("renders patient registration without staff role controls", () => {
    renderInRouter(<PatientRegisterPage />);

    expect(screen.getByRole("heading", { name: /online registration/i })).toBeTruthy();
    expect(screen.queryByText(/select staff role profile|staff & clinical access|hospital staff portal/i)).toBeNull();
    expect(screen.queryByRole("button", { name: /register/i })).toBeNull();
    expect(screen.getByText(/endpoint requires authentication/i)).toBeTruthy();
  });

  it("accepts only known role names and applies role-based UI access", () => {
    expect(isRole("Doctor")).toBe(true);
    expect(isRole("SuperAdmin")).toBe(true);
    expect(isStaffRole("SuperAdmin")).toBe(true);
    expect(roleHomeRoute.SuperAdmin).toBe("reports");
    expect(humanizeRole("SuperAdmin")).toBe("Super Administrator");
    expect(canAccessTab("SuperAdmin", "reports")).toBe(true);
    expect(canAccessTab("SuperAdmin", "staff")).toBe(true);
    expect(canAccessTab("SuperAdmin", "audit")).toBe(true);
    expect(canAccessTab("SuperAdmin", "patients")).toBe(false);
    expect(canAccessTab("SuperAdmin", "encounters")).toBe(false);
    expect(canAccessTab("SuperAdmin", "billing")).toBe(false);
    expect(canAccessTab("SuperAdmin", "appointments")).toBe(false);
    expect(canAccessTab("SuperAdmin", "labs")).toBe(false);
    expect(canAccessTab("SuperAdmin", "settings")).toBe(false);
    expect(canAccessTab("SuperAdmin", "portal")).toBe(false);
    expect(ROLE_NAMES).toEqual([
      "SuperAdmin",
      "Admin",
      "MedicalDirector",
      "Receptionist",
      "Doctor",
      "Nurse",
      "Pharmacist",
      "Laboratorist",
      "Cashier",
      "HmoOfficer",
      "Patient",
    ]);
    expect(isRole("MedicalDirector")).toBe(true);
    expect(isRole("Pharmacist")).toBe(true);
    expect(isRole("Laboratorist")).toBe(true);
    expect(isRole("HmoOfficer")).toBe(true);
    expect(isRole("UnknownRole")).toBe(false);
    expect(canAccessTab("Patient", "portal")).toBe(true);
    expect(canAccessTab("Patient", "reports")).toBe(false);
    expect(canAccessTab(null, "overview")).toBe(false);
  });
});
