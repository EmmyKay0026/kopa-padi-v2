"use client";
import { api } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { AppIcon, type AppIconName } from "./app-icon";
import { UserSidebar } from "./user-sidebar";

const today = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

const schema = z.object({
  originStateId: z.string().min(1, "Select an origin state."),
  originLgaId: z.string().min(1, "Select an origin LGA."),
  originTownId: z.string().optional(),
  intendedTravelDate: z
    .string()
    .min(10, "Choose a valid travel date.")
    .refine((value) => value >= today(), "Travel date must be today or later."),
  dateFlexibilityDays: z.number().int().min(0).max(2),
  departureWindow: z.enum([
    "EARLY_MORNING",
    "MORNING",
    "LATE_MORNING",
    "AFTERNOON",
    "FLEXIBLE",
  ]),
  transportMode: z.enum([
    "COMMERCIAL_BUS",
    "TRAIN",
    "FLIGHT",
    "PRIVATE_VEHICLE",
    "UNDECIDED",
  ]),
  transportFlexible: z.boolean(),
  nearbyMatchingEnabled: z.boolean(),
  groupPreference: z.literal("ANY_VERIFIED_PCM"),
});
type Values = z.infer<typeof schema>;
type Place = { id: string; name: string };
type Plan = {
  plan: {
    id: string;
    status: string;
    intendedTravelDate: string;
    dateFlexibilityDays: number;
    departureWindow: Values["departureWindow"];
    transportMode: Values["transportMode"];
    transportFlexible: boolean;
    nearbyMatchingEnabled: boolean;
    groupPreference: "ANY_VERIFIED_PCM";
    originStateId: string;
    originLgaId: string;
    originTownId: string | null;
  };
  originState: Place;
  originLga: Place;
  originTown: Place | null;
  destination: { campName: string; stateName: string };
};
type Verification = {
  verification: { status: string };
  camp?: { campName: string; stateName: string };
};
const defaults: Values = {
  originStateId: "",
  originLgaId: "",
  originTownId: "",
  intendedTravelDate: "",
  dateFlexibilityDays: 0,
  departureWindow: "MORNING",
  transportMode: "COMMERCIAL_BUS",
  transportFlexible: false,
  nearbyMatchingEnabled: true,
  groupPreference: "ANY_VERIFIED_PCM",
};
const steps = ["Departure", "Schedule", "Preferences", "Review"];
const mobileNav: Array<[AppIconName, string, string]> = [
  ["home", "Dashboard", "/app"],
  ["trip", "My Trips", "/travel-plans"],
  ["match", "Matches", "/matching"],
  ["people", "Travel Circle", "/circle"],
  ["profile", "Profile", "/verification"],
];
const windows: Array<[Values["departureWindow"], string, string]> = [
  ["EARLY_MORNING", "Early Morning", "4 AM – 7 AM"],
  ["MORNING", "Morning", "7 AM – 10 AM"],
  ["LATE_MORNING", "Late Morning", "10 AM – 12 PM"],
  ["AFTERNOON", "Afternoon", "12 PM – 4 PM"],
  ["FLEXIBLE", "Flexible", ""],
];
const transports: Array<[Values["transportMode"], string, AppIconName]> = [
  ["COMMERCIAL_BUS", "Commercial Bus", "bus"],
  ["TRAIN", "Train", "train"],
  ["FLIGHT", "Flight", "plane"],
  ["PRIVATE_VEHICLE", "Private Vehicle", "car"],
  ["UNDECIDED", "Not Decided Yet", "clock"],
];
const pretty = (v: string) =>
  v
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (x) => x.toUpperCase());
const dateLabel = (v: string) =>
  v
    ? new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(
        new Date(`${v}T12:00:00`),
      )
    : "—";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <UserSidebar active="My Trips" />
      <div className="lg:pl-60">
        <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-5 lg:hidden">
          <Link href="/app" aria-label="Back to dashboard">
            <AppIcon name="arrow" className="rotate-180" />
          </Link>
          <b>Travel Plan</b>
          <button aria-label="Menu">
            <AppIcon name="menu" />
          </button>
        </header>
        {children}
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-white px-2 py-2 lg:hidden">
          {mobileNav.map(([icon, label, href]) => (
            <Link
              key={label}
              href={href}
              className={`flex min-h-11 flex-col items-center justify-center text-[9px] font-bold ${label === "My Trips" ? "text-primary" : "text-muted"}`}
            >
              <AppIcon name={icon} size={17} />
              {label.replace("My ", "").replace("Travel ", "")}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
function Header({ step, active }: { step?: number; active?: boolean }) {
  return (
    <>
      <header className="border-b border-border bg-surface px-5 py-5 sm:px-8">
        <h1 className="text-2xl font-black tracking-[-.04em]">Travel Plan</h1>
        <p className="mt-1 text-xs text-muted">
          {active
            ? "Your active Travel Plan."
            : "Plan your journey to your verified NYSC camp."}
        </p>
      </header>
      {step ? (
        <ol
          className="mx-auto flex max-w-3xl px-5 py-5"
          aria-label={`Step ${step} of 4: ${steps[step - 1]}`}
        >
          {steps.map((label, i) => (
            <li
              key={label}
              className={`relative flex flex-1 flex-col items-center gap-1 text-[9px] font-bold ${i + 1 <= step ? "text-primary" : "text-muted"}`}
            >
              <span
                className={`z-10 grid h-6 w-6 place-items-center rounded-full border ${i + 1 < step ? "border-primary bg-primary text-white" : i + 1 === step ? "border-primary bg-primary text-white" : "border-border bg-surface"}`}
              >
                {i + 1}
              </span>
              {label}
              {i < 3 && (
                <i
                  className={`absolute left-1/2 top-3 h-px w-full ${i + 1 < step ? "bg-primary" : "bg-border"}`}
                />
              )}
            </li>
          ))}
        </ol>
      ) : null}
    </>
  );
}
function Destination({
  camp,
}: {
  camp?: { campName: string; stateName: string };
}) {
  return (
    <section className="rounded-2xl border border-primary/20 bg-primary-light/25 p-4">
      <div className="flex items-start gap-3">
        <AppIcon name="pin" className="mt-0.5 text-primary" />
        <div className="flex-1">
          <p className="text-[10px] font-bold text-primary">
            Your destination (verified)
          </p>
          <h2 className="mt-1 text-sm font-black">{camp?.campName}</h2>
          <p className="text-xs text-muted">{camp?.stateName}</p>
          <p className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-primary-dark">
            <AppIcon name="check" size={14} /> Verified from your NYSC posting
          </p>
        </div>
        <span title="Locked destination" aria-label="Locked destination">
          <AppIcon name="lock" size={18} />
        </span>
      </div>
      <p className="mt-2 border-t border-primary/10 pt-2 text-right text-[9px] text-muted">
        This destination cannot be changed here.
      </p>
    </section>
  );
}
function Loading() {
  return (
    <div className="animate-pulse">
      <Header step={1} />
      <main className="mx-auto max-w-3xl space-y-4 px-5 pb-24">
        <div className="h-28 rounded-2xl bg-slate-100" />
        <div className="h-16 rounded-2xl bg-slate-100" />
        <div className="h-64 rounded-2xl bg-slate-100" />
      </main>
      <span className="sr-only" role="status">
        Loading Travel Plan
      </span>
    </div>
  );
}
function VerificationRequired() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-xl px-5 py-12">
        <section className="rounded-2xl border border-border bg-surface p-7 text-center shadow-soft">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary-light/60 text-primary">
            <AppIcon name="shield" size={38} />
          </span>
          <h2 className="mt-5 text-2xl font-black">Verification required</h2>
          <p className="mt-2 text-sm text-muted">
            Only verified PCMs can create Travel Plans.
          </p>
          <ul className="mt-6 space-y-4 rounded-xl bg-background p-4 text-left text-xs text-muted">
            <li className="flex gap-2">
              <AppIcon
                name="check"
                size={15}
                className="shrink-0 text-success"
              />{" "}
              Travel Plans are only available to verified NYSC corps members.
            </li>
            <li className="flex gap-2">
              <AppIcon
                name="check"
                size={15}
                className="shrink-0 text-success"
              />{" "}
              Verification confirms your eligibility to participate.
            </li>
            <li className="flex gap-2">
              <AppIcon
                name="check"
                size={15}
                className="shrink-0 text-success"
              />{" "}
              This helps keep Kopa-Padi safe and trustworthy for everyone.
            </li>
          </ul>
          <Link href="/verification" className="btn-primary mt-6 w-full">
            Complete verification <AppIcon name="arrow" size={16} />
          </Link>
          <Link
            href="/app"
            className="mt-3 grid min-h-12 place-items-center rounded-xl border border-primary font-bold text-primary"
          >
            Back to dashboard
          </Link>
        </section>
      </main>
    </>
  );
}
function Toggle({
  checked,
  onChange,
  label,
  copy,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  copy: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <AppIcon name="info" size={17} className="mt-1 shrink-0 text-primary" />
      <div className="flex-1">
        <b className="text-xs">{label}</b>
        <p className="mt-1 text-[10px] leading-4 text-muted">{copy}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-primary" : "bg-slate-300"}`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${checked ? "left-6" : "left-1"}`}
        />
      </button>
    </div>
  );
}
function CancelDialog({
  open,
  busy,
  onClose,
  onConfirm,
}: {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) ref.current?.focus();
  }, [open]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/45 p-5"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cancel-title"
        className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-2xl"
      >
        <button
          ref={ref}
          onClick={onClose}
          className="ml-auto block h-10 w-10"
          aria-label="Close dialog"
        >
          <AppIcon name="x" />
        </button>
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-danger/10 text-danger">
          <AppIcon name="warning" size={30} />
        </span>
        <h2 id="cancel-title" className="mt-4 text-xl font-black">
          Cancel Travel Plan?
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          This will remove your active Travel Plan and stop it from being used
          for matching. You can create a new plan later.
        </p>
        <div className="mt-7 grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="min-h-12 rounded-xl border font-bold"
          >
            Keep Plan
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="min-h-12 rounded-xl bg-danger font-bold text-white disabled:opacity-60"
          >
            {busy ? "Cancelling..." : "Yes, Cancel Plan"}
          </button>
        </div>
      </section>
    </div>
  );
}

export function TravelPlanManager() {
  const [states, setStates] = useState<Place[]>([]),
    [lgas, setLgas] = useState<Place[]>([]),
    [towns, setTowns] = useState<Place[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null),
    [verification, setVerification] = useState<Verification>(),
    [step, setStep] = useState(1),
    [editing, setEditing] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [cancelOpen, setCancelOpen] = useState(false),
    [cancelling, setCancelling] = useState(false);
  const {
    register,
    control,
    reset,
    setValue,
    getValues,
    trigger,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });
  const stateId = useWatch({ control, name: "originStateId" }),
    lgaId = useWatch({ control, name: "originLgaId" }),
    flex = useWatch({ control, name: "dateFlexibilityDays" }),
    windowValue = useWatch({ control, name: "departureWindow" }),
    transport = useWatch({ control, name: "transportMode" }),
    transportFlexible = useWatch({ control, name: "transportFlexible" }),
    nearby = useWatch({ control, name: "nearbyMatchingEnabled" });
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [s, v] = await Promise.all([
        api<Place[]>("/locations/states"),
        api<Verification>("/verification/status"),
      ]);
      setStates(s);
      setVerification(v);
      if (v.verification.status !== "VERIFIED") {
        setPlan(null);
        return;
      }
      const p = await api<Plan | null>("/travel-plans/active");
      setPlan(p);
      if (p) reset({ ...p.plan, originTownId: p.plan.originTownId ?? "" });
    } catch {
      setError(
        "We couldn't load your Travel Plan right now. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [reset]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (!stateId) {
      setLgas([]);
      return;
    }
    let live = true;
    api<Place[]>(`/locations/states/${stateId}/lgas`)
      .then((v) => live && setLgas(v))
      .catch(() => live && setError("We couldn't load LGAs right now."));
    return () => {
      live = false;
    };
  }, [stateId]);
  useEffect(() => {
    if (!lgaId) {
      setTowns([]);
      return;
    }
    let live = true;
    api<Place[]>(`/locations/lgas/${lgaId}/towns`)
      .then((v) => live && setTowns(v))
      .catch(() => live && setError("We couldn't load towns right now."));
    return () => {
      live = false;
    };
  }, [lgaId]);
  async function next() {
    const fields =
      step === 1
        ? (["originStateId", "originLgaId"] as const)
        : step === 2
          ? (["intendedTravelDate"] as const)
          : [];
    if (fields.length && !(await trigger(fields))) return;
    setStep((v) => Math.min(4, v + 1));
  }
  function edit() {
    setEditing(true);
    setStep(1);
  }
  async function save(values: Values) {
    setError("");
    try {
      const payload = { ...values, originTownId: values.originTownId || null };
      const result = await api<Plan>(
        plan ? `/travel-plans/${plan.plan.id}` : "/travel-plans",
        { method: plan ? "PATCH" : "POST", body: JSON.stringify(payload) },
      );
      setPlan(result);
      setEditing(false);
    } catch {
      setError(
        "We couldn't save your Travel Plan right now. Please try again.",
      );
    }
  }
  async function cancel() {
    if (!plan) return;
    setCancelling(true);
    try {
      await api(`/travel-plans/${plan.plan.id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: "TRAVEL_NO_LONGER_NEEDED" }),
      });
      setPlan(null);
      reset(defaults);
      setStep(1);
      setCancelOpen(false);
    } catch {
      setError(
        "We couldn't cancel your Travel Plan right now. Please try again.",
      );
    } finally {
      setCancelling(false);
    }
  }
  if (loading)
    return (
      <Shell>
        <Loading />
      </Shell>
    );
  if (verification?.verification.status !== "VERIFIED")
    return (
      <Shell>
        <VerificationRequired />
      </Shell>
    );
  const camp = plan?.destination ?? verification.camp;
  if (plan && !editing)
    return (
      <Shell>
        <Header active />
        <main className="mx-auto max-w-3xl px-5 pb-28 pt-6">
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
            <div className="rounded-xl bg-success/10 p-4 text-success">
              <b className="flex items-center gap-1">
                <AppIcon name="check" size={16} /> Active
              </b>
              <p className="mt-1 text-xs text-primary-dark">
                Your Travel Plan is active and is being used for matching.
              </p>
            </div>
            <div className="my-5 flex items-center gap-3 rounded-xl border border-border p-4 text-sm font-black">
              <span>{plan.originTown?.name ?? plan.originLga.name}</span>
              <i className="flex-1 border-t border-dashed border-primary" />
              <AppIcon name="bus" size={18} className="shrink-0 text-primary" />
              <i className="flex-1 border-t border-dashed border-primary" />
              <span>{plan.destination.campName}</span>
            </div>
            <dl className="grid gap-4 text-xs sm:grid-cols-2">
              {[
                ["Travel date", dateLabel(plan.plan.intendedTravelDate)],
                [
                  "Date flexibility",
                  plan.plan.dateFlexibilityDays
                    ? `±${plan.plan.dateFlexibilityDays} day${plan.plan.dateFlexibilityDays > 1 ? "s" : ""}`
                    : "Exact date",
                ],
                ["Departure window", pretty(plan.plan.departureWindow)],
                ["Transport mode", pretty(plan.plan.transportMode)],
                [
                  "Open to other transport?",
                  plan.plan.transportFlexible ? "Yes" : "No",
                ],
                [
                  "Nearby LGA matching",
                  plan.plan.nearbyMatchingEnabled ? "Yes" : "No",
                ],
                ["Travel Circle preference", "Any verified PCM"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between border-b border-border pb-3"
                >
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-bold">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 flex gap-2 rounded-xl bg-primary-light/30 p-4 text-[10px] text-muted">
              <AppIcon
                name="shield"
                size={15}
                className="shrink-0 text-primary"
              />{" "}
              You can edit or cancel your plan at any time. Cancelling will stop
              it from being used for matching.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Link href="/matching" className="btn-primary">
                Go to Matching <AppIcon name="arrow" size={16} />
              </Link>
              <button
                onClick={edit}
                className="min-h-12 rounded-xl border border-primary font-bold text-primary"
              >
                Edit Plan
              </button>
              <button
                onClick={() => setCancelOpen(true)}
                className="min-h-12 rounded-xl border border-danger font-bold text-danger"
              >
                Cancel Plan
              </button>
            </div>
          </section>
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-danger/10 p-3 text-sm text-danger"
            >
              {error}
            </p>
          )}
        </main>
        <CancelDialog
          open={cancelOpen}
          busy={cancelling}
          onClose={() => setCancelOpen(false)}
          onConfirm={() => void cancel()}
        />
      </Shell>
    );
  const values = getValues();
  return (
    <Shell>
      <Header step={step} />
      <main className="mx-auto max-w-3xl px-5 pb-32">
        <Destination camp={camp} />
        <form
          onSubmit={handleSubmit(save)}
          className="mt-4 rounded-2xl border border-border bg-surface p-5 shadow-soft"
        >
          <div key={step} className="enter">
            {step === 1 ? (
              <>
                <h2 className="text-lg font-black">Departure location</h2>
                <p className="mb-5 mt-1 text-xs text-muted">
                  Where will you be travelling from?
                </p>
                <label className="travel-label">
                  Origin State *
                  <select
                    className="field"
                    {...register("originStateId", {
                      onChange: (e) => {
                        setValue("originStateId", e.target.value);
                        setValue("originLgaId", "");
                        setValue("originTownId", "");
                      },
                    })}
                  >
                    <option value="">Select state</option>
                    {states.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                  </select>
                  {errors.originStateId && (
                    <span>{errors.originStateId.message}</span>
                  )}
                </label>
                <label className="travel-label">
                  Origin LGA *
                  <select
                    className="field"
                    disabled={!stateId}
                    {...register("originLgaId", {
                      onChange: (e) => {
                        setValue("originLgaId", e.target.value);
                        setValue("originTownId", "");
                      },
                    })}
                  >
                    <option value="">Select LGA</option>
                    {lgas.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                  </select>
                  {errors.originLgaId && (
                    <span>{errors.originLgaId.message}</span>
                  )}
                </label>
                <label className="travel-label">
                  Town or Area (optional)
                  <select
                    className="field"
                    disabled={!lgaId}
                    {...register("originTownId")}
                  >
                    <option value="">No town selected</option>
                    {towns.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="mt-5 flex gap-2 rounded-xl bg-background p-4 text-[10px] leading-5 text-muted">
                  <AppIcon
                    name="shield"
                    size={15}
                    className="shrink-0 text-primary"
                  />{" "}
                  You don&apos;t need to provide your home address or precise
                  location. A general departure area is enough.
                </p>
              </>
            ) : step === 2 ? (
              <>
                <h2 className="text-lg font-black">Travel date</h2>
                <p className="mb-5 mt-1 text-xs text-muted">
                  When do you plan to travel?
                </p>
                <label className="travel-label">
                  Intended travel date *
                  <input
                    type="date"
                    min={today()}
                    className="field"
                    {...register("intendedTravelDate")}
                  />
                  {errors.intendedTravelDate && (
                    <span>{errors.intendedTravelDate.message}</span>
                  )}
                </label>
                <fieldset className="mt-5">
                  <legend className="text-xs font-black">
                    Date flexibility *
                  </legend>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {[
                      [0, "Exact date only"],
                      [1, "±1 day"],
                      [2, "±2 days"],
                    ].map(([v, l]) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() =>
                          setValue("dateFlexibilityDays", Number(v))
                        }
                        className={`min-h-11 rounded-xl border px-2 text-[10px] font-bold ${flex === v ? "border-primary bg-primary-light/40 text-primary-dark" : "border-border"}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="mt-7">
                  <legend className="text-sm font-black">
                    Departure window
                  </legend>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {windows.map(([v, l, t]) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setValue("departureWindow", v)}
                        className={`min-h-16 rounded-xl border p-2 text-xs font-bold ${windowValue === v ? "border-primary bg-primary-light/40 text-primary-dark" : "border-border"}`}
                      >
                        {l}
                        <small className="mt-1 block text-[9px] text-muted">
                          {t}
                        </small>
                      </button>
                    ))}
                  </div>
                </fieldset>
              </>
            ) : step === 3 ? (
              <>
                <h2 className="text-lg font-black">Transport preferences</h2>
                <p className="mb-4 mt-1 text-xs text-muted">
                  How do you plan to travel?
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {transports.map(([v, l, i]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setValue("transportMode", v)}
                      className={`min-h-20 rounded-xl border p-2 text-[10px] font-bold ${transport === v ? "border-primary bg-primary-light/40 text-primary-dark" : "border-border"}`}
                    >
                      <AppIcon name={i} size={22} className="mx-auto mb-2" />
                      {l}
                    </button>
                  ))}
                </div>
                <div className="my-6 border-y border-border py-5">
                  <Toggle
                    checked={transportFlexible}
                    onChange={(v) => setValue("transportFlexible", v)}
                    label="Open to another transport option later?"
                    copy="This gives Kopa-Padi more flexibility when suggesting compatible travel options."
                  />
                </div>
                <h3 className="text-sm font-black">Matching preferences</h3>
                <div className="mt-4">
                  <Toggle
                    checked={nearby}
                    onChange={(v) => setValue("nearbyMatchingEnabled", v)}
                    label="Include verified PCMs from nearby LGAs?"
                    copy="Nearby means travelers who can reasonably converge within approximately one hour."
                  />
                </div>
                <h3 className="mt-7 text-sm font-black">
                  Travel Circle preference
                </h3>
                <div className="mt-3 rounded-xl border border-primary/20 bg-primary-light/20 p-4 text-xs">
                  <b className="flex items-center gap-2">
                    <AppIcon name="people" size={17} /> Any verified PCM
                  </b>
                  <p className="mt-2 text-[10px] text-muted">
                    For now, you&apos;ll be matched with any compatible verified
                    PCM.
                  </p>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-black">Review your Travel Plan</h2>
                <p className="mb-5 mt-1 text-xs text-muted">
                  Please check your details before submitting.
                </p>
                <div className="mb-4 flex items-center gap-3 rounded-xl border p-4 text-xs font-black">
                  <span>
                    {towns.find((x) => x.id === values.originTownId)?.name ??
                      lgas.find((x) => x.id === values.originLgaId)?.name}
                  </span>
                  <i className="flex-1 border-t border-dashed border-primary" />
                  <AppIcon
                    name="bus"
                    size={18}
                    className="shrink-0 text-primary"
                  />
                  <i className="flex-1 border-t border-dashed border-primary" />
                  <span>{camp?.campName}</span>
                </div>
                <dl className="grid gap-3 text-xs">
                  {[
                    ["Travel date", dateLabel(values.intendedTravelDate)],
                    [
                      "Date flexibility",
                      values.dateFlexibilityDays
                        ? `±${values.dateFlexibilityDays} day${values.dateFlexibilityDays > 1 ? "s" : ""}`
                        : "Exact date",
                    ],
                    ["Departure window", pretty(values.departureWindow)],
                    ["Transport mode", pretty(values.transportMode)],
                    [
                      "Open to other transport?",
                      values.transportFlexible ? "Yes" : "No",
                    ],
                    [
                      "Nearby LGA matching",
                      values.nearbyMatchingEnabled ? "Yes" : "No",
                    ],
                    ["Travel Circle preference", "Any verified PCM"],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between border-b border-border pb-2"
                    >
                      <dt className="text-muted">{k}</dt>
                      <dd className="font-bold">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-5 rounded-xl bg-primary-light/30 p-4 text-[10px] leading-5 text-muted">
                  <b className="flex items-center gap-2 text-primary-dark">
                    <AppIcon name="shield" size={15} /> Your Travel Plan is
                    private.
                  </b>
                  <br />
                  It will only be used to find compatible verified travelers. We
                  don&apos;t require your home address or precise location.
                </p>
              </>
            )}
          </div>
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-danger/10 p-3 text-xs text-danger"
            >
              {error}
            </p>
          )}
          <div className="mt-6 flex gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((v) => v - 1)}
                className="min-h-12 flex-1 rounded-xl border font-bold"
              >
                <AppIcon name="arrow" size={16} className="rotate-180" /> Back
              </button>
            ) : plan ? (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="min-h-12 flex-1 rounded-xl border font-bold"
              >
                Discard changes
              </button>
            ) : (
              <Link
                href="/app"
                className="grid min-h-12 flex-1 place-items-center rounded-xl border text-xs font-bold"
              >
                Save and exit
              </Link>
            )}
            {step < 4 ? (
              <button
                type="button"
                onClick={() => void next()}
                className="btn-primary flex-1"
              >
                Continue <AppIcon name="arrow" size={16} />
              </button>
            ) : (
              <button disabled={isSubmitting} className="btn-primary flex-1">
                {isSubmitting
                  ? "Submitting..."
                  : plan
                    ? "Save Changes"
                    : "Submit Travel Plan"}
              </button>
            )}
          </div>
        </form>
      </main>
    </Shell>
  );
}
