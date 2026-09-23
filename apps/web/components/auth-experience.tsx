"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthBrandPanel } from "./auth-brand-panel";
import { AuthMode, SignInForm, SignUpForm } from "./auth-form";

const TRIP_KEYS = ["from", "to", "date", "time", "mode"];

function getDestination() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("next");
  if (requested?.startsWith("/") && !requested.startsWith("//")) return requested;
  const trip = new URLSearchParams();
  for (const key of TRIP_KEYS) {
    const value = params.get(key);
    if (value) trip.set(key, value);
  }
  if (trip.size > 0) {
    sessionStorage.setItem("kopa-padi:pending-trip", trip.toString());
    return `/travel-plans?${trip.toString()}`;
  }
  const pendingTrip = sessionStorage.getItem("kopa-padi:pending-trip");
  return pendingTrip ? `/travel-plans?${pendingTrip}` : "/verification";
}

export function AuthExperience({ initialMode }: { initialMode: AuthMode }) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [destination, setDestination] = useState("/verification");

  useEffect(() => {
    setDestination(getDestination());
    function handlePopState() {
      setMode(window.location.pathname === "/login" ? "signin" : "signup");
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function changeMode(nextMode: AuthMode) {
    if (nextMode === mode) return;
    setMode(nextMode);
    const query = window.location.search;
    window.history.pushState({}, "", `${nextMode === "signin" ? "/login" : "/register"}${query}`);
    document.title = `${nextMode === "signin" ? "Sign in" : "Create account"} | Kopa-Padi`;
  }

  return (
    <main className="auth-page">
      <div className="auth-mobile-topbar">
        <Link href="/" className="auth-logo auth-logo-dark"><span>KP</span>Kopa-Padi</Link>
        <span>{mode === "signup" ? "Create an account" : "Sign in"}</span>
      </div>
      <section className="auth-shell" data-mode={mode} aria-label="Kopa-Padi authentication">
        <div className="auth-form-stage">
          <div className="auth-form-panel auth-signup-panel" aria-hidden={mode !== "signup"} inert={mode !== "signup"}>
            <SignUpForm onModeChange={changeMode} destination={destination} />
          </div>
          <div className="auth-form-panel auth-signin-panel" aria-hidden={mode !== "signin"} inert={mode !== "signin"}>
            <SignInForm onModeChange={changeMode} destination={destination} />
          </div>
        </div>
        <AuthBrandPanel mode={mode} />
      </section>
      <p className="auth-page-note">Travel smarter. Connect safely. Go together.</p>
    </main>
  );
}
