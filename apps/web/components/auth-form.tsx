"use client";

import { authClient } from "@/lib/auth-client";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useId, useState } from "react";
import { z } from "zod";

export type AuthMode = "signup" | "signin";
type Props = { onModeChange: (mode: AuthMode) => void; destination: string };
type Field = "firstName" | "lastName" | "email" | "password" | "terms";
type Errors = Partial<Record<Field, string>>;
type Status = { type: "error" | "success"; text: string } | null;

const emailPasswordSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(10, "Password must be at least 10 characters."),
});
const signupSchema = emailPasswordSchema.extend({
  firstName: z.string().trim().min(2, "Enter your first name."),
  lastName: z.string().trim().min(2, "Enter your last name."),
  terms: z.literal(true, "Please accept the terms to continue."),
});
const fieldClass =
  "h-[50px] w-full rounded-xl border border-border bg-white px-4 text-[15px] text-foreground outline-none transition placeholder:text-slate-400 hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-slate-50";

function errorsFrom(error: z.ZodError): Errors {
  const errors: Errors = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as Field | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}

function FieldError({ field, errors }: { field: Field; errors: Errors }) {
  return (
    <span id={`${field}-error`} className="auth-field-error" aria-live="polite">
      {errors[field] ?? "\u00a0"}
    </span>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-1.99 3.02v2.54h3.23c1.89-1.74 2.98-4.31 2.98-7.4Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.42l-3.23-2.5c-.9.6-2.04.96-3.39.96-2.6 0-4.81-1.76-5.6-4.13H3.07v2.58A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 13.91A6 6 0 0 1 6.09 12c0-.66.11-1.3.31-1.91V7.51H3.07A10 10 0 0 0 2 12c0 1.61.39 3.14 1.07 4.49l3.33-2.58Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.96c1.47 0 2.79.51 3.83 1.5L18.7 4.6A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.93 5.51L6.4 10.1c.79-2.38 3-4.14 5.6-4.14Z"
      />
    </svg>
  );
}

export function GoogleAuthButton({ disabled }: { disabled: boolean }) {
  const enabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";
  const [loading, setLoading] = useState(false);
  async function connect() {
    if (!enabled || loading) return;
    setLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/verification",
      });
    } finally {
      setLoading(false);
    }
  }
  return (
    <button
      type="button"
      className="auth-google-button"
      onClick={connect}
      disabled={disabled || loading || !enabled}
      title={!enabled ? "Google sign-in is not configured yet" : undefined}
    >
      <GoogleIcon />
      {loading ? "Connecting…" : "Continue with Google"}
    </button>
  );
}

function PasswordInput({
  id,
  autoComplete,
  hasError,
}: {
  id: string;
  autoComplete: "new-password" | "current-password";
  hasError: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        name="password"
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        minLength={10}
        maxLength={128}
        required
        className={`${fieldClass} pr-12`}
        aria-invalid={hasError}
        aria-describedby={hasError ? "password-error" : undefined}
      />
      <button
        type="button"
        className="auth-password-toggle"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </button>
    </div>
  );
}

function Divider() {
  return (
    <div className="auth-divider">
      <span>or</span>
    </div>
  );
}
function SubmitButton({
  loading,
  children,
}: {
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      className="btn-primary group mt-1 w-full gap-2"
      disabled={loading}
    >
      {loading ? <span className="auth-spinner" aria-hidden="true" /> : null}
      {loading ? "Please wait…" : children}
      {!loading ? (
        <span
          aria-hidden="true"
          className="transition-transform group-hover:translate-x-1"
        >
          →
        </span>
      ) : null}
    </button>
  );
}
function StatusMessage({ status }: { status: Status }) {
  return status ? (
    <p
      role={status.type === "error" ? "alert" : "status"}
      className={`auth-status ${status.type}`}
    >
      {status.text}
    </p>
  ) : (
    <div className="auth-status-placeholder" />
  );
}

export function SignUpForm({ onModeChange, destination }: Props) {
  const router = useRouter();
  const id = useId();
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>(null);
  const [submitting, setSubmitting] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const values = {
      firstName: String(data.get("firstName") ?? "").trim(),
      lastName: String(data.get("lastName") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      password: String(data.get("password") ?? ""),
      terms: data.get("terms") === "on",
    };
    const parsed = signupSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(errorsFrom(parsed.error));
      setStatus(null);
      return;
    }
    setErrors({});
    setStatus(null);
    setSubmitting(true);
    try {
      const response = await authClient.signUp.email({
        name: `${values.firstName} ${values.lastName}`,
        email: values.email,
        password: values.password,
        callbackURL: destination,
      });
      if (response.error) {
        setStatus({
          type: "error",
          text: response.error.message ?? "We couldn't create your account.",
        });
        return;
      }
      form.reset();
      setStatus({
        type: "success",
        text: "Account created. Check your inbox to verify your email, then sign in.",
      });
      router.prefetch(destination);
    } catch (error) {
      console.error("Sign-up request failed:", error);
      setStatus({
        type: "error",
        text: "Unable to connect. Please check that the API is running.",
      });
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <div className="auth-form-content">
      <p className="eyebrow">Welcome to Kopa-Padi</p>
      <h1 className="auth-title">Create your account</h1>
      <p className="auth-support">
        Join Kopa-Padi and start travelling together.
      </p>
      <form
        noValidate
        onSubmit={submit}
        className="mt-6"
        aria-label="Create your Kopa-Padi account"
      >
        <GoogleAuthButton disabled={submitting} />
        <Divider />
        <div className="grid grid-cols-2 gap-3">
          <label className="auth-label" htmlFor={`${id}-first`}>
            First name
            <input
              id={`${id}-first`}
              name="firstName"
              autoComplete="given-name"
              className={fieldClass}
              aria-invalid={Boolean(errors.firstName)}
              aria-describedby={
                errors.firstName ? "firstName-error" : undefined
              }
            />
            <FieldError field="firstName" errors={errors} />
          </label>
          <label className="auth-label" htmlFor={`${id}-last`}>
            Last name
            <input
              id={`${id}-last`}
              name="lastName"
              autoComplete="family-name"
              className={fieldClass}
              aria-invalid={Boolean(errors.lastName)}
              aria-describedby={errors.lastName ? "lastName-error" : undefined}
            />
            <FieldError field="lastName" errors={errors} />
          </label>
        </div>
        <label className="auth-label" htmlFor={`${id}-email`}>
          Email address
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="email"
            className={fieldClass}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          <FieldError field="email" errors={errors} />
        </label>
        <label className="auth-label" htmlFor={`${id}-password`}>
          Password
          <PasswordInput
            id={`${id}-password`}
            autoComplete="new-password"
            hasError={Boolean(errors.password)}
          />
          <FieldError field="password" errors={errors} />
        </label>
        <label className="auth-check-label">
          <input
            name="terms"
            type="checkbox"
            aria-invalid={Boolean(errors.terms)}
            aria-describedby={errors.terms ? "terms-error" : undefined}
          />
          <span>
            I agree to the <Link href="/#footer">Terms of Service</Link> and{" "}
            <Link href="/#footer">Privacy Policy</Link>
          </span>
        </label>
        <FieldError field="terms" errors={errors} />
        <SubmitButton loading={submitting}>Create account</SubmitButton>
        <StatusMessage status={status} />
      </form>
      <p className="auth-switch-copy">
        Already have an account?{" "}
        <button type="button" onClick={() => onModeChange("signin")}>
          Sign in
        </button>
      </p>
    </div>
  );
}

export function SignInForm({ onModeChange, destination }: Props) {
  const router = useRouter();
  const id = useId();
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>(null);
  const [submitting, setSubmitting] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const data = new FormData(event.currentTarget);
    const values = {
      email: String(data.get("email") ?? "").trim(),
      password: String(data.get("password") ?? ""),
    };
    const parsed = emailPasswordSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(errorsFrom(parsed.error));
      setStatus(null);
      return;
    }
    setErrors({});
    setStatus(null);
    setSubmitting(true);
    try {
      const response = await authClient.signIn.email({
        ...values,
        rememberMe: data.get("rememberMe") === "on",
      });
      if (response.error) {
        setStatus({
          type: "error",
          text: response.error.message ?? "We couldn't sign you in.",
        });
        return;
      }
      router.replace(destination);
      router.refresh();
    } catch (error) {
      console.error("Sign-in request failed:", error);
      setStatus({
        type: "error",
        text: "Unable to connect. Please check that the API is running.",
      });
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <div className="auth-form-content auth-form-content-signin">
      <p className="eyebrow">Good to see you again</p>
      <h1 className="auth-title">Welcome back</h1>
      <p className="auth-support">Sign in to continue your journey.</p>
      <form
        noValidate
        onSubmit={submit}
        className="mt-7"
        aria-label="Sign in to Kopa-Padi"
      >
        <GoogleAuthButton disabled={submitting} />
        <Divider />
        <label className="auth-label" htmlFor={`${id}-email`}>
          Email address
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="email"
            className={fieldClass}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          <FieldError field="email" errors={errors} />
        </label>
        <label className="auth-label" htmlFor={`${id}-password`}>
          Password
          <PasswordInput
            id={`${id}-password`}
            autoComplete="current-password"
            hasError={Boolean(errors.password)}
          />
          <FieldError field="password" errors={errors} />
        </label>
        <div className="flex items-center justify-between gap-4 text-sm">
          <label className="auth-check-label whitespace-nowrap">
            <input name="rememberMe" type="checkbox" defaultChecked />
            <span>Keep me signed in</span>
          </label>
          <Link
            className="font-bold text-primary hover:text-primary-dark"
            href="/forgot-password"
          >
            Forgot password?
          </Link>
        </div>
        <SubmitButton loading={submitting}>Sign in</SubmitButton>
        <StatusMessage status={status} />
      </form>
      <p className="auth-switch-copy">
        Don&apos;t have an account?{" "}
        <button type="button" onClick={() => onModeChange("signup")}>
          Create account
        </button>
      </p>
    </div>
  );
}
