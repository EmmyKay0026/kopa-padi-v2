"use client";
import { AppIcon, type AppIconName } from "./app-icon";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
type State = { id: string; name: string };
type Lga = { id: string; name: string };
type Town = { id: string; name: string };
type IconName = AppIconName;
function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return <AppIcon name={name} size={size} className={className} />;
}
function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary font-black text-white">
        KP
      </span>
      <span>
        <strong className="block text-lg leading-none">Kopa-Padi</strong>
        <small className="text-xs text-muted">
          Travel together. Go further.
        </small>
      </span>
    </Link>
  );
}
function Header() {
  const session = authClient.useSession();
  const name = (session.data?.user.name || "Traveler").split(" ")[0];
  return (
    <header className="relative z-10 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Logo />
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-dark font-bold text-white">
            {name[0]}
          </span>
          <strong className="hidden text-sm sm:block">{name}</strong>
          <span aria-hidden="true" className="text-muted">
            v
          </span>
        </div>
      </div>
    </header>
  );
}
function Contours() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-full w-full text-primary/[.045]"
      viewBox="0 0 1400 1000"
      preserveAspectRatio="none"
    >
      <g fill="none" stroke="currentColor">
        <path d="M1100 0c-160 100-20 220-180 330s80 220-50 350M1150 0c-150 120 0 230-150 350s100 230-40 380M1200 0c-130 140 25 240-120 370s100 230-20 400" />
        <path d="M0 430c160-80 200 70 120 170S180 760 0 720M0 490c120-60 160 50 95 140S130 760 0 780" />
      </g>
    </svg>
  );
}
function Scenic() {
  return (
    <svg aria-hidden="true" viewBox="0 0 500 300" className="w-full">
      <path
        d="m0 230 100-105 70 65 85-135 110 145 70-90 65 120v70H0z"
        fill="rgb(var(--primary-light))"
      />
      <path
        d="m0 250 110-70 95 55 100-80 90 75 105-70v140H0z"
        fill="rgb(var(--primary)/.18)"
      />
      <path
        d="M210 300c20-80 130-35 150-140 12 60-55 83-62 140z"
        fill="white"
        opacity=".9"
      />
      <path
        d="M80 165c90-100 160 75 330-40"
        fill="none"
        stroke="rgb(var(--primary))"
        strokeWidth="3"
        strokeDasharray="7 8"
      />
      <circle cx="80" cy="165" r="10" fill="rgb(var(--primary))" />
      <circle cx="410" cy="125" r="10" fill="rgb(var(--primary))" />
    </svg>
  );
}
function Field({
  id,
  label,
  helper,
  optional,
  disabled,
  loading,
  value,
  onChange,
  options,
  placeholder,
  error,
}: {
  id: string;
  label: string;
  helper: string;
  optional?: boolean;
  disabled: boolean;
  loading: boolean;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; name: string }[];
  placeholder: string;
  error?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="text-sm font-black">
          {label}
          {optional ? null : (
            <span className="ml-1 text-danger" aria-label="required">
              *
            </span>
          )}
        </label>
        {optional ? (
          <span className="rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-bold text-primary-dark">
            Optional
          </span>
        ) : null}
      </div>
      <p id={id + "-help"} className="mt-1 text-xs text-muted">
        {helper}
      </p>
      <div className="relative mt-2">
        <Icon
          name="search"
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
        />
        <select
          id={id}
          aria-describedby={id + "-help" + (error ? " " + id + "-error" : "")}
          aria-invalid={!!error}
          required={!optional}
          disabled={disabled || loading}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={
            "field appearance-none pl-12 pr-12 " +
            (error ? "border-danger ring-1 ring-danger/20" : "")
          }
        >
          {<option value="">{loading ? "Loading..." : placeholder}</option>}
          {options.map((x) => (
            <option value={x.id} key={x.id}>
              {x.name}
            </option>
          ))}
        </select>
        {loading ? (
          <span
            className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin rounded-full border-2 border-primary/20 border-t-primary"
            role="status"
          >
            <span className="sr-only">Loading {label}</span>
          </span>
        ) : (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm"
          >
            v
          </span>
        )}
      </div>
      {error ? (
        <p
          id={id + "-error"}
          className="mt-2 flex items-center gap-2 text-xs font-semibold text-danger"
        >
          <span aria-hidden="true">!</span>
          {error}
        </p>
      ) : null}
    </div>
  );
}
const benefits: Array<[IconName, string, string]> = [
  [
    "people",
    "Find nearby travelers",
    "We match you with people starting their journey from the same area.",
  ],
  [
    "route",
    "Show relevant routes",
    "Get better route options and safety guidance for your location.",
  ],
  [
    "shield",
    "Keep your privacy",
    "We use only your general area. Your exact address is not required.",
  ],
];
function SidePanel() {
  return (
    <aside className="overflow-hidden rounded-[20px] border bg-white shadow-[0_18px_60px_rgba(15,118,110,.08)]">
      <div className="p-6 sm:p-8">
        <h2 className="flex items-center gap-4 text-xl font-black">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-primary-light text-primary">
            <Icon name="pin" />
          </span>
          Why we need this
        </h2>
        <div className="mt-7 space-y-6">
          {benefits.map(([i, t, c]) => (
            <div key={t} className="flex gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-light/70 text-primary">
                <Icon name={i} />
              </span>
              <div>
                <h3 className="font-bold">{t}</h3>
                <p className="mt-1 text-sm leading-6 text-muted">{c}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 border-t pt-7">
          <p className="-rotate-3 font-serif text-2xl italic leading-tight text-primary">
            Good people
            <br />
            lead to great journeys.
          </p>
        </div>
      </div>
      <Scenic />
      <div className="m-5 flex items-center gap-3 rounded-xl bg-primary-light/35 p-4 text-primary-dark">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-light">
          <Icon name="leaf" />
        </span>
        <strong className="text-sm">
          Safer journeys.
          <br />
          Stronger connections.
        </strong>
      </div>
    </aside>
  );
}

export function LocationSelector() {
  const [states, setStates] = useState<State[]>([]),
    [lgas, setLgas] = useState<Lga[]>([]),
    [towns, setTowns] = useState<Town[]>([]);
  const [stateId, setStateId] = useState(""),
    [lgaId, setLgaId] = useState(""),
    [townId, setTownId] = useState("");
  const [loading, setLoading] = useState<"states" | "lgas" | "towns" | "">(
      "states",
    ),
    [errors, setErrors] = useState<{
      state?: string;
      lga?: string;
      load?: string;
    }>({}),
    [confirmed, setConfirmed] = useState(false);
  useEffect(() => {
    let active = true;
    api<State[]>("/locations/states")
      .then((x) => {
        if (active) {
          setStates(x);
          setLoading("");
        }
      })
      .catch((e) => {
        if (active) {
          setErrors({ load: e.message });
          setLoading("");
        }
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!stateId) {
      setLgas([]);
      setLgaId("");
      setTowns([]);
      setTownId("");
      return;
    }
    let active = true;
    setLoading("lgas");
    setLgaId("");
    setTowns([]);
    setTownId("");
    setConfirmed(false);
    setErrors({});
    api<Lga[]>("/locations/states/" + stateId + "/lgas")
      .then((x) => {
        if (active) {
          setLgas(x);
          setLoading("");
        }
      })
      .catch((e) => {
        if (active) {
          setErrors({ load: e.message });
          setLoading("");
        }
      });
    return () => {
      active = false;
    };
  }, [stateId]);
  useEffect(() => {
    if (!lgaId) {
      setTowns([]);
      setTownId("");
      return;
    }
    let active = true;
    setLoading("towns");
    setTownId("");
    setConfirmed(false);
    setErrors({});
    api<Town[]>("/locations/lgas/" + lgaId + "/towns")
      .then((x) => {
        if (active) {
          setTowns(x);
          setLoading("");
        }
      })
      .catch((e) => {
        if (active) {
          setErrors({ load: e.message });
          setLoading("");
        }
      });
    return () => {
      active = false;
    };
  }, [lgaId]);
  const state = states.find((x) => x.id === stateId),
    lga = lgas.find((x) => x.id === lgaId),
    town = towns.find((x) => x.id === townId);
  function confirm() {
    const next: { state?: string; lga?: string } = {};
    if (!state) next.state = "Please select a State.";
    if (!lga) next.lga = "Please select an LGA.";
    setErrors(next);
    if (state && lga) {
      setConfirmed(true);
      document
        .getElementById("selection-summary")
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }
  function edit() {
    setConfirmed(false);
    document.getElementById("state")?.focus();
  }
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <Contours />
      <Header />
      <main className="relative mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-8">
        <div className="mb-5 grid items-center gap-4 sm:grid-cols-3">
          <Link
            href="/app"
            className="inline-flex min-h-11 items-center gap-3 font-bold"
          >
            <span aria-hidden="true">&lt;-</span>Back
          </Link>
          <div className="sm:text-center">
            <strong className="text-sm text-primary">Step 1 of 4</strong>
            <div className="mt-2 flex gap-2 sm:justify-center">
              <span className="h-2 w-8 rounded-full bg-primary" />
              {[1, 2, 3].map((x) => (
                <span key={x} className="h-2 w-8 rounded-full bg-slate-200" />
              ))}
            </div>
          </div>
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-[1.35fr_.8fr]">
          <section className="rounded-[20px] border bg-white p-6 shadow-[0_18px_60px_rgba(15,118,110,.08)] sm:p-9">
            <header className="flex gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary-light text-primary">
                <Icon name="pin" className="h-8 w-8" />
              </span>
              <div>
                <h1 className="text-3xl font-black tracking-[-.04em]">
                  Your departure location
                </h1>
                <h2 className="mt-3 text-lg font-bold">
                  Where are you travelling from?
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
                  Select your general departure area so we can find travelers
                  starting near you. Your home address is not required.
                </p>
              </div>
            </header>
            <div className="mt-8 space-y-6">
              <Field
                id="state"
                label="State"
                helper="Select the state you will be travelling from."
                disabled={false}
                loading={loading === "states"}
                value={stateId}
                onChange={setStateId}
                options={states}
                placeholder="Select State"
                error={errors.state}
              />
              <Field
                id="lga"
                label="LGA"
                helper="Select the Local Government Area."
                disabled={!stateId}
                loading={loading === "lgas"}
                value={lgaId}
                onChange={setLgaId}
                options={lgas}
                placeholder={stateId ? "Select LGA" : "Select a State first"}
                error={errors.lga}
              />
              <Field
                id="town"
                label="Town / Area"
                helper="Select a town or area to further refine your location."
                optional
                disabled={!lgaId}
                loading={loading === "towns"}
                value={townId}
                onChange={(v) => {
                  setTownId(v);
                  setConfirmed(false);
                }}
                options={towns}
                placeholder={
                  lgaId
                    ? towns.length
                      ? "No town selected"
                      : "No towns listed - continue with this LGA"
                    : "Select an LGA first"
                }
              />
            </div>
            {errors.load ? (
              <p
                role="alert"
                className="mt-5 rounded-xl border border-danger/20 bg-danger/5 p-3 text-sm text-danger"
              >
                {errors.load}
              </p>
            ) : null}
            {state && lga ? (
              <section
                id="selection-summary"
                className={
                  "mt-7 rounded-xl border p-5 transition " +
                  (confirmed
                    ? "border-success/30 bg-success/10"
                    : "border-primary/15 bg-primary-light/35")
                }
              >
                <div className="flex items-center gap-2 font-bold text-primary-dark">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-success text-white">
                    <Icon name="check" className="h-4 w-4" />
                  </span>
                  {confirmed ? "Location confirmed" : "Your selected area"}
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <Icon name="pin" className="h-9 w-9 shrink-0 text-primary" />
                  <div className="flex-1">
                    <strong className="block text-lg">
                      {town?.name ?? lga.name}
                    </strong>
                    <p className="text-muted">
                      {town ? lga.name + ", " + state.name : state.name}
                    </p>
                    {town ? null : (
                      <small className="text-muted">Town not specified</small>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={edit}
                    className="flex min-h-11 items-center gap-2 rounded-lg border bg-white px-4 text-sm font-bold text-primary"
                  >
                    <Icon name="edit" className="h-4 w-4" />
                    Edit
                  </button>
                </div>
              </section>
            ) : null}
            <section className="mt-5 flex gap-4 rounded-xl border bg-primary-light/20 p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-light text-primary">
                <Icon name="shield" />
              </span>
              <div>
                <h2 className="font-bold text-primary-dark">Your privacy</h2>
                <p className="mt-1 text-sm leading-6 text-muted">
                  We use your general departure area for route matching.
                  Kopa-Padi does not require your home address.
                </p>
              </div>
            </section>
            <button
              type="button"
              disabled={!state || !lga || loading !== ""}
              onClick={confirm}
              className="btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {confirmed ? "Location Confirmed" : "Use This Location"}{" "}
              <span className="ml-2">{confirmed ? "OK" : "->"}</span>
            </button>
          </section>
          <div className="hidden lg:block">
            <SidePanel />
          </div>
          <details className="rounded-[20px] border bg-white p-5 lg:hidden">
            <summary className="cursor-pointer font-black text-primary">
              Why we need your location
            </summary>
            <div className="mt-5">
              <SidePanel />
            </div>
          </details>
        </div>
        <footer className="py-8 text-center">
          <strong>Kopa-Padi</strong>
          <p className="text-xs text-muted">Travel together. Go further.</p>
        </footer>
      </main>
    </div>
  );
}
