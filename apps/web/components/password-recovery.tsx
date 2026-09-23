"use client";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Check, Eye, EyeOff, Mail, TriangleAlert } from "lucide-react";

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className={`recovery-logo ${dark ? "dark" : ""}`}>
      <span>KP</span>
      <span>
        <b>Kopa-Padi</b>
        <small>Travel together. Go further.</small>
      </span>
    </Link>
  );
}
function Layout({ children }: { children: ReactNode }) {
  return (
    <main className="recovery-page">
      <section className="recovery-shell">
        <aside className="recovery-brand">
          <Image
            src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1400&q=86"
            alt="A scenic road winding through mountains"
            fill
            priority
            sizes="(max-width: 767px) 100vw, 42vw"
            className="object-cover"
          />
          <div className="recovery-overlay" />
          <div className="recovery-brand-copy">
            <Logo />
            <p>
              Good people
              <br />
              lead to great
              <br />
              journeys.
            </p>
            <small>
              Safer journeys.
              <br />
              Stronger connections.
            </small>
          </div>
        </aside>
        <header className="recovery-mobile-logo">
          <Logo dark />
        </header>
        <div className="recovery-content">{children}</div>
      </section>
    </main>
  );
}
const Spinner = () => <span className="auth-spinner" aria-hidden="true" />;
const Back = () => (
  <Link className="recovery-back" href="/login">
    ←&nbsp; Back to sign in
  </Link>
);
function Icon({ type }: { type: "mail" | "error" | "check" }) {
  return (
    <span className={`recovery-icon ${type}`} aria-hidden="true">
      {type === "mail" ? (
        <>
          <Mail />
          <i>✓</i>
        </>
      ) : type === "error" ? (
        <TriangleAlert />
      ) : (
        <Check />
      )}
    </span>
  );
}

export function ForgotPasswordExperience() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  async function submit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (state === "loading" || !email.trim()) return;
    setState("loading");
    try {
      const result = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: `${location.origin}/reset-password`,
      });
      setState(result.error ? "error" : "success");
    } catch {
      setState("error");
    }
  }
  if (state === "success")
    return (
      <Layout>
        <div className="recovery-form centered enter" aria-live="polite">
          <Icon type="mail" />
          <h1>Check your inbox</h1>
          <p>
            If that account exists, a reset email has been sent. Please check
            your inbox and follow the link to create a new password.
          </p>
          <div className="recovery-note">
            <b>ⓘ&nbsp; Didn&apos;t receive the email?</b>
            <ul>
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email</li>
              <li>You can request another link below</li>
            </ul>
          </div>
          <button
            className="recovery-button secondary"
            onClick={() => void submit()}
          >
            Resend link
          </button>
          <Link className="recovery-button" href="/login">
            Back to sign in
          </Link>
        </div>
      </Layout>
    );
  const loading = state === "loading";
  return (
    <Layout>
      <div className="recovery-form enter">
        <h1>Forgot your password?</h1>
        <p>
          No worries. Enter your email and we&apos;ll send you a link to reset
          your password.
        </p>
        <form onSubmit={submit} noValidate aria-busy={loading}>
          <label htmlFor="recovery-email">Email address</label>
          <div className="recovery-email">
            <span>✉</span>
            <input
              id="recovery-email"
              type="email"
              autoComplete="email"
              required
              className="field"
              placeholder="you@example.com"
              value={email}
              disabled={loading}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {state === "error" && (
            <p className="recovery-error" role="alert">
              We couldn&apos;t send the reset request right now. Please try
              again.
            </p>
          )}
          <button
            className="recovery-button"
            disabled={loading || !email.trim()}
          >
            {loading ? (
              <>
                <Spinner /> Sending...
              </>
            ) : state === "error" ? (
              "Try again"
            ) : (
              "Send reset link"
            )}
          </button>
        </form>
        <Back />
      </div>
    </Layout>
  );
}

function Password({
  id,
  label,
  value,
  setValue,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  setValue: (v: string) => void;
  disabled: boolean;
}) {
  const [shown, setShown] = useState(false);
  return (
    <label className="recovery-password" htmlFor={id}>
      {label}
      <div>
        <input
          id={id}
          type={shown ? "text" : "password"}
          autoComplete="new-password"
          minLength={10}
          maxLength={128}
          required
          className="field"
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => setShown((v) => !v)}
          aria-label={`${shown ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={shown}
        >
          {shown ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      </div>
    </label>
  );
}

export function ResetPasswordExperience() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<
    "checking" | "form" | "loading" | "invalid" | "success"
  >("checking");
  useEffect(() => {
    const value =
      new URLSearchParams(location.search).get("token")?.trim() ?? "";
    setToken(value);
    setState(value ? "form" : "invalid");
  }, []);
  const long = password.length >= 10;
  const match = confirm.length > 0 && password === confirm;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "loading" || !long || !match || !token) return;
    setState("loading");
    try {
      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      });
      setState(result.error ? "invalid" : "success");
    } catch {
      setState("invalid");
    }
  }
  if (state === "checking")
    return (
      <Layout>
        <div
          className="recovery-skeleton"
          aria-busy="true"
          aria-label="Checking reset link"
        >
          <i />
          <i />
          <i />
          <i />
        </div>
      </Layout>
    );
  if (state === "invalid")
    return (
      <Layout>
        <div className="recovery-form centered enter">
          <Icon type="error" />
          <h1>This reset link is no longer valid</h1>
          <p>
            The link may have expired or already been used. Please request a new
            reset link to create a new password.
          </p>
          <Link className="recovery-button" href="/forgot-password">
            Request another reset link
          </Link>
          <div className="recovery-or">
            <span>or</span>
          </div>
          <Back />
        </div>
      </Layout>
    );
  if (state === "success")
    return (
      <Layout>
        <div className="recovery-form centered enter" aria-live="polite">
          <Icon type="check" />
          <h1>Password updated</h1>
          <p>
            Your password has been changed successfully. You can now sign in to
            your account.
          </p>
          <Link className="recovery-button" href="/login">
            Continue to sign in
          </Link>
        </div>
      </Layout>
    );
  const loading = state === "loading";
  return (
    <Layout>
      <div className="recovery-form enter">
        <h1>Create a new password</h1>
        <p>Your new password will replace your old one.</p>
        <form onSubmit={submit} aria-busy={loading}>
          <Password
            id="new-password"
            label="New password"
            value={password}
            setValue={setPassword}
            disabled={loading}
          />
          <Password
            id="confirm-password"
            label="Confirm new password"
            value={confirm}
            setValue={setConfirm}
            disabled={loading}
          />
          <div className="recovery-note requirements" aria-live="polite">
            <b>ⓘ&nbsp; Password requirements:</b>
            <ul>
              <li className={long ? "met" : ""}>
                {long ? "✓" : "○"}&nbsp; At least 10 characters
              </li>
              <li className={match ? "met" : ""}>
                {match ? "✓" : "○"}&nbsp; Passwords match
              </li>
            </ul>
          </div>
          <button
            className="recovery-button"
            disabled={loading || !long || !match}
          >
            {loading ? (
              <>
                <Spinner /> Updating...
              </>
            ) : (
              "Update password"
            )}
          </button>
        </form>
        <Back />
      </div>
    </Layout>
  );
}
