"use client";
import { AppIcon, type AppIconName } from "./app-icon";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { JourneyGuidePanel } from "./journey-guide-panel";
import { UserSidebar } from "./user-sidebar";

type Contact = {
  id: string;
  name: string;
  relationship: string;
  phone: string | null;
  email: string | null;
};
type Journey = {
  status: string;
  journeyMode: "CIRCLE" | "SOLO";
  travelDate: string;
  departureWindow: string;
  transportMode: string;
  expectedArrivalAt: string | null;
  startedAt: string | null;
  arrivedAt: string | null;
};
type Data = {
  journey: Journey;
  destination: { name: string; address: string | null };
  checklist: { itemKey: string; label: string; completed: boolean }[];
  contacts: Contact[];
  checkIns: {
    id: string;
    type: string;
    message: string | null;
    createdAt: string;
  }[];
  shares: {
    id: string;
    trustedContactId: string;
    status: string;
    expiresAt: string;
  }[];
  emergencyNumbers: { general: string; road: string };
};
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
    <Link href="/" className="flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-black text-white">
        KP
      </span>
      <strong>Kopa-Padi</strong>
    </Link>
  );
}
function Sidebar() {
  return <UserSidebar active="Journey Safety" />;
}
function ShellTop() {
  const session = authClient.useSession();
  const name = (session.data?.user.name || "Traveler").split(" ")[0];
  return (
    <>
      <header className="hidden h-20 items-center justify-between border-b bg-white px-8 lg:flex">
        <label className="relative w-full max-w-md">
          <span className="sr-only">Search</span>
          <Icon name="search" className="absolute left-4 top-3.5 text-muted" />
          <input
            className="field pl-12"
            placeholder="Search trips, matches or messages..."
          />
        </label>
        <div className="flex items-center gap-4">
          <button
            aria-label="Notifications"
            className="grid h-11 w-11 place-items-center"
          >
            <Icon name="bell" />
          </button>
          <span className="grid h-11 w-11 place-items-center rounded-full bg-primary-dark font-bold text-white">
            {name[0]}
          </span>
          <p className="text-sm">
            <strong>{name}</strong>
            <small className="block text-success">Verified traveler</small>
          </p>
        </div>
      </header>
      <header className="flex h-16 items-center justify-between border-b bg-white px-4 lg:hidden">
        <Link
          href="/app"
          aria-label="Back to dashboard"
          className="grid h-11 w-11 place-items-center text-xl"
        >
          &lt;
        </Link>
        <strong>Journey Safety</strong>
        <button
          aria-label="More options"
          className="grid h-11 w-11 place-items-center"
        >
          <Icon name="menu" />
        </button>
      </header>
    </>
  );
}
function Bottom() {
  const b: Array<[IconName, string, string]> = [
    ["home", "Home", "/app"],
    ["trip", "Trips", "/travel-plans"],
    ["people", "Circle", "/circle"],
    ["shield", "Journey", "/journey"],
    ["user", "Profile", "/verification"],
  ];
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-white/95 px-2 pb-2 pt-2 backdrop-blur lg:hidden"
    >
      {b.map(([i, l, h]) => (
        <Link
          key={l}
          href={h}
          aria-current={l === "Journey" ? "page" : undefined}
          className={
            "flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] font-bold " +
            (l === "Journey" ? "text-primary" : "text-muted")
          }
        >
          <Icon name={i} />
          {l}
        </Link>
      ))}
    </nav>
  );
}
const human = (v: string) =>
  v
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
const steps = [
  "PREPARING",
  "READY_TO_START",
  "IN_PROGRESS",
  "ARRIVED",
  "COMPLETED",
];
function Progress({ status }: { status: string }) {
  const current =
    status === "NEEDS_ATTENTION" ? 2 : Math.max(0, steps.indexOf(status));
  return (
    <div className="rounded-2xl border bg-white px-4 py-5 shadow-sm">
      <ol className="grid grid-cols-5">
        {steps.map((s, i) => (
          <li key={s} className="relative text-center">
            <span
              className={
                "relative z-10 mx-auto grid h-5 w-5 place-items-center rounded-full border-2 " +
                (i < current
                  ? "border-primary bg-primary"
                  : i === current
                    ? status === "NEEDS_ATTENTION"
                      ? "border-danger bg-danger"
                      : "border-primary bg-primary"
                    : "border-slate-300 bg-white")
              }
            >
              {i < current ? (
                <Icon name="check" className="h-3 w-3 text-white" />
              ) : null}
            </span>
            {i < 4 ? (
              <span
                className={
                  "absolute left-1/2 top-[9px] h-0.5 w-full " +
                  (i < current ? "bg-primary" : "bg-slate-200")
                }
              />
            ) : null}
            <span
              className={
                "mt-2 hidden text-[10px] font-bold sm:block " +
                (i === current ? "text-primary" : "text-muted")
              }
            >
              {human(s)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
function Route({ data }: { data: Data }) {
  const j = data.journey;
  const tone =
    j.status === "NEEDS_ATTENTION"
      ? "bg-danger/10 text-danger"
      : j.status === "ARRIVED" || j.status === "COMPLETED"
        ? "bg-success/10 text-success"
        : "bg-primary-light text-primary-dark";
  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-3 font-black">
        <span className="flex items-center gap-2">
          <Icon name="pin" className="text-primary" />
          Departure
        </span>
        <span className="flex-1 border-t-2 border-dotted border-primary/35" />
        <Icon name="car" />
        <span className="flex-1 border-t-2 border-dotted border-primary/35" />
        <span className="flex items-center gap-2 text-right">
          <Icon name="pin" className="text-primary" />
          {data.destination.name}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-4 text-xs text-muted">
        <span className="flex gap-2">
          <Icon name="calendar" className="h-4 w-4" />
          {new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(
            new Date(j.travelDate),
          )}
        </span>
        <span>{human(j.departureWindow)}</span>
        <span>{human(j.transportMode)}</span>
        <strong className={"ml-auto rounded-full px-3 py-1 " + tone}>
          {human(j.status)}
        </strong>
      </div>
    </section>
  );
}
function Card({
  title,
  children,
  action,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={"rounded-2xl border bg-white p-5 shadow-sm " + className}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
function Skeleton() {
  return (
    <div className="animate-pulse space-y-5 p-4 sm:p-8">
      <div className="h-16 w-64 rounded bg-slate-100" />
      <div className="h-28 rounded-2xl bg-slate-100" />
      <div className="h-20 rounded-2xl bg-slate-100" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-96 rounded-2xl bg-slate-100" />
        <div className="h-96 rounded-2xl bg-slate-100" />
      </div>
      <span role="status" className="sr-only">
        Loading Journey
      </span>
    </div>
  );
}
function Prepare({
  busy,
  error,
  onPrepare,
}: {
  busy: boolean;
  error: string;
  onPrepare: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative h-36 overflow-hidden rounded-t-2xl bg-primary-light/25">
        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full text-primary/20"
          viewBox="0 0 700 180"
        >
          <path
            d="m0 180 150-120 90 75 100-105 130 120 80-70 150 100"
            fill="currentColor"
            opacity=".3"
          />
          <path
            d="M190 120c90-80 180 60 315-40"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray="7 8"
          />
          <circle cx="190" cy="120" r="8" fill="currentColor" />
          <circle cx="505" cy="80" r="8" fill="currentColor" />
        </svg>
      </div>
      <section className="rounded-b-2xl border border-t-0 bg-white p-7 text-center shadow-sm sm:p-12">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary-light text-primary">
          <Icon name="pin" className="h-9 w-9" />
        </span>
        <h2 className="mt-6 text-2xl font-black">Prepare your Journey</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted">
          Kopa-Padi will create a private safety record from your active travel
          plan. This helps you access safety tools, check-ins and
          trusted-contact sharing. This does not enable continuous tracking.
        </p>
        <button
          disabled={busy}
          onClick={onPrepare}
          className="btn-primary mt-7 w-full"
        >
          Prepare Journey <span className="ml-2">-&gt;</span>
        </button>
        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-danger/10 p-3 text-sm text-danger"
          >
            {error}
          </p>
        ) : null}
        <div className="mt-6 rounded-xl bg-background p-5 text-left">
          <h3 className="font-bold">Requirements</h3>
          <p className="mt-3 flex gap-2 text-sm">
            <Icon name="check" className="text-success" />
            Verified traveler required
          </p>
          <p className="mt-3 flex gap-2 text-sm">
            <Icon name="check" className="text-success" />
            Eligible active travel plan required
          </p>
        </div>
      </section>
    </div>
  );
}
function Checklist({
  data,
  busy,
  act,
}: {
  data: Data;
  busy: boolean;
  act: (w: () => Promise<unknown>, s: string) => Promise<void>;
}) {
  const done = data.checklist.filter((x) => x.completed).length,
    total = data.checklist.length,
    percent = total ? Math.round((done / total) * 100) : 0;
  return (
    <Card title="Safety Checklist">
      <div className="mb-5">
        <div className="flex justify-between text-sm">
          <strong>
            {done} of {total} complete
          </strong>
          <span className="text-muted">{percent}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: percent + "%" }}
          />
        </div>
      </div>
      <div className="space-y-3">
        {data.checklist.map((x) => (
          <label
            key={x.itemKey}
            className="flex cursor-pointer items-start gap-3 text-sm"
          >
            <input
              type="checkbox"
              checked={x.completed}
              disabled={busy}
              onChange={(e) =>
                act(
                  () =>
                    api("/journeys/current/checklist/" + x.itemKey, {
                      method: "PATCH",
                      body: JSON.stringify({ completed: e.target.checked }),
                    }),
                  "Checklist updated.",
                )
              }
              className="mt-0.5 h-5 w-5 accent-primary"
            />
            <span className={x.completed ? "text-muted line-through" : ""}>
              {x.label}
            </span>
          </label>
        ))}
      </div>
      <p className="mt-5 text-xs leading-5 text-muted">
        Completing this checklist supports preparation but does not guarantee
        safety.
      </p>
    </Card>
  );
}
function Contacts({
  data,
  busy,
  act,
  setShareUrl,
}: {
  data: Data;
  busy: boolean;
  act: (w: () => Promise<unknown>, s: string) => Promise<void>;
  setShareUrl: (x: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await act(
      () =>
        api("/trusted-contacts", {
          method: "POST",
          body: JSON.stringify({
            name: f.get("name"),
            relationship: f.get("relationship"),
            phone: f.get("phone") || null,
            email: f.get("email") || null,
          }),
        }),
      "Trusted contact added.",
    );
    e.currentTarget.reset();
    setAdding(false);
  }
  async function create(id: string) {
    const r = await api<{ url: string }>("/journeys/current/share", {
      method: "POST",
      body: JSON.stringify({ trustedContactId: id }),
    });
    setShareUrl(r.url);
    return r;
  }
  return (
    <Card
      title="Trusted Contacts"
      action={
        <button
          onClick={() => setAdding(!adding)}
          className="text-xs font-bold text-primary"
        >
          {adding ? "Close" : "Add contact"}
        </button>
      }
    >
      <div className="space-y-3">
        {data.contacts.length ? (
          data.contacts.map((c) => {
            const active = data.shares.some(
              (s) => s.trustedContactId === c.id && s.status === "ACTIVE",
            );
            return (
              <article
                key={c.id}
                className="flex items-center gap-3 rounded-xl bg-background p-3"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-200 text-muted">
                  <Icon name="user" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold">{c.name}</h3>
                  <p className="truncate text-xs text-muted">
                    {c.relationship}
                    {c.phone ? " - " + c.phone : ""}
                  </p>
                </div>
                {active ? (
                  <span className="rounded-full bg-success/10 px-2 py-1 text-[10px] font-bold text-success">
                    Link active
                  </span>
                ) : (
                  <button
                    disabled={busy}
                    onClick={() =>
                      void act(
                        () => create(c.id),
                        "Share link created. Copy it now; it is shown only once.",
                      )
                    }
                    className="rounded-lg border border-primary px-3 py-2 text-xs font-bold text-primary"
                  >
                    Share
                  </button>
                )}
                <button
                  aria-label={"Remove " + c.name}
                  disabled={busy}
                  onClick={() =>
                    window.confirm(
                      "Remove this trusted contact and revoke their active journey link?",
                    ) &&
                    void act(
                      () =>
                        api("/trusted-contacts/" + c.id, { method: "DELETE" }),
                      "Contact removed.",
                    )
                  }
                  className="text-danger"
                >
                  x
                </button>
              </article>
            );
          })
        ) : (
          <p className="rounded-xl bg-background p-4 text-center text-sm text-muted">
            No trusted contacts added yet.
          </p>
        )}
      </div>
      {adding ? (
        <form onSubmit={add} className="mt-4 grid gap-3 rounded-xl border p-4">
          <label className="grid gap-1 text-xs font-bold">
            Name
            <input className="field" name="name" required minLength={2} />
          </label>
          <label className="grid gap-1 text-xs font-bold">
            Relationship
            <input
              className="field"
              name="relationship"
              required
              minLength={2}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-bold">
              Phone
              <input className="field" name="phone" type="tel" />
            </label>
            <label className="grid gap-1 text-xs font-bold">
              Email
              <input className="field" name="email" type="email" />
            </label>
          </div>
          <button disabled={busy} className="btn-primary">
            Add trusted contact
          </button>
        </form>
      ) : null}
      {data.shares.some((s) => s.status === "ACTIVE") ? (
        <button
          disabled={busy}
          onClick={() =>
            window.confirm(
              "Revoke every active journey share link? Your contacts will lose access immediately.",
            ) &&
            void act(
              () => api("/journeys/current/share/revoke", { method: "POST" }),
              "All Journey links revoked.",
            )
          }
          className="mt-4 text-sm font-bold text-danger"
        >
          Revoke all links
        </button>
      ) : null}
    </Card>
  );
}
function CheckIns({
  data,
  busy,
  checkIn,
  arrive,
}: {
  data: Data;
  busy: boolean;
  checkIn: (x: string) => void;
  arrive: () => void;
}) {
  const actions: Array<[IconName, string, string, () => void]> = [
    ["shield", "I'm Safe", "SAFE", () => checkIn("SAFE")],
    [
      "trip",
      "Connection Reached",
      "CONNECTION_REACHED",
      () => checkIn("CONNECTION_REACHED"),
    ],
    [
      "pin",
      "Near Destination",
      "NEAR_DESTINATION",
      () => checkIn("NEAR_DESTINATION"),
    ],
    ["flag", "I've Arrived", "ARRIVED", arrive],
  ];
  const last = data.checkIns[0];
  return (
    <Card title="How are you doing?">
      <p className="-mt-3 mb-5 text-sm text-muted">
        Let your trusted contacts know you are safe.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.map(([i, l, k, fn], x) => (
          <button
            key={k}
            disabled={busy}
            onClick={fn}
            className={
              "min-h-28 rounded-xl p-3 text-sm font-bold transition active:scale-95 " +
              (x === 0
                ? "bg-primary text-white"
                : "bg-primary-light/45 text-primary-dark")
            }
          >
            <Icon name={i} className="mx-auto mb-3 h-7 w-7" />
            {l}
          </button>
        ))}
      </div>
      {last ? (
        <p className="mt-4 text-xs text-muted">
          Last check-in: {human(last.type)} at{" "}
          {new Date(last.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      ) : null}
      <p className="mt-2 text-xs text-muted">
        A missed reminder only means we have not received a recent check-in.
      </p>
    </Card>
  );
}
function Emergency({
  data,
  busy,
  act,
  checkIn,
  shareLocation,
}: {
  data: Data;
  busy: boolean;
  act: (w: () => Promise<unknown>, s: string) => Promise<void>;
  checkIn: (x: string) => void;
  shareLocation: (x: "TRUSTED_CONTACT" | "CIRCLE") => void;
}) {
  return (
    <Card title="Need Help?" className="border-danger/25 bg-danger/[.025]">
      <p className="-mt-3 mb-4 text-xs text-danger">
        Get help or alert your contacts.
      </p>
      <div className="grid gap-2">
        <a
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-danger font-bold text-white"
          href={"tel:" + data.emergencyNumbers.general}
        >
          <Icon name="phone" />
          Call Emergency ({data.emergencyNumbers.general})
        </a>
        <a
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-danger font-bold text-danger"
          href={"tel:" + data.emergencyNumbers.road}
        >
          <Icon name="phone" />
          Call FRSC ({data.emergencyNumbers.road})
        </a>
        <button
          disabled={busy}
          onClick={() => checkIn("NEED_HELP")}
          className="min-h-11 rounded-xl bg-danger/10 text-sm font-bold text-danger"
        >
          Record Need Help
        </button>
        <div className="grid grid-cols-3 gap-2 pt-2">
          <button
            disabled={busy}
            onClick={() =>
              void act(
                () =>
                  api("/journeys/current/emergency/alert-trusted", {
                    method: "POST",
                  }),
                "Trusted contacts alerted where email sharing is active.",
              )
            }
            className="rounded-xl border bg-white p-3 text-xs font-bold"
          >
            <Icon name="alert" className="mx-auto mb-2" />
            Alert Contacts
          </button>
          {data.journey.journeyMode === "CIRCLE" ? (
            <button
              disabled={busy}
              onClick={() =>
                void act(
                  () =>
                    api("/journeys/current/emergency/alert-circle", {
                      method: "POST",
                    }),
                  "Circle alerted.",
                )
              }
              className="rounded-xl border bg-white p-3 text-xs font-bold"
            >
              <Icon name="people" className="mx-auto mb-2" />
              Alert Circle
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={() => shareLocation("TRUSTED_CONTACT")}
            className="rounded-xl border bg-white p-3 text-xs font-bold"
          >
            <Icon name="pin" className="mx-auto mb-2" />
            Share Location
          </button>
        </div>
        {data.journey.journeyMode === "CIRCLE" ? (
          <button
            onClick={() => shareLocation("CIRCLE")}
            className="mt-2 text-xs font-bold text-primary"
          >
            Share temporary location with Circle
          </button>
        ) : null}
        <p className="mt-3 text-[11px] leading-4 text-muted">
          Location is requested only when you choose to share it and expires
          automatically. Continuous tracking is never enabled.
        </p>
      </div>
    </Card>
  );
}
function StatusCard({ data }: { data: Data }) {
  const j = data.journey;
  return (
    <Card title="Journey Status">
      <dl className="grid grid-cols-2 gap-y-3 text-sm">
        <dt className="text-muted">Started</dt>
        <dd className="font-bold">
          {j.startedAt
            ? new Date(j.startedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Not started"}
        </dd>
        <dt className="text-muted">Expected arrival</dt>
        <dd className="font-bold">
          {j.expectedArrivalAt
            ? new Date(j.expectedArrivalAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Not provided"}
        </dd>
        <dt className="text-muted">Travel mode</dt>
        <dd className="font-bold">{human(j.transportMode)}</dd>
        <dt className="text-muted">Journey type</dt>
        <dd className="font-bold">
          {j.journeyMode === "CIRCLE" ? "Travel Circle" : "Solo"}
        </dd>
      </dl>
      {j.journeyMode === "CIRCLE" ? (
        <Link
          className="mt-5 inline-flex text-sm font-bold text-primary"
          href="/circle"
        >
          Open Circle -&gt;
        </Link>
      ) : null}
    </Card>
  );
}
function Attention({ busy, onSafe }: { busy: boolean; onSafe: () => void }) {
  return (
    <section className="rounded-2xl border border-danger/20 bg-danger/10 p-5">
      <div className="flex gap-3">
        <Icon name="alert" className="shrink-0 text-danger" />
        <div>
          <h2 className="font-black">
            We have not received a recent check-in.
          </h2>
          <p className="mt-1 text-sm text-muted">
            Please check in to let your trusted contacts know you are safe.
          </p>
        </div>
      </div>
      <button
        disabled={busy}
        onClick={onSafe}
        className="btn-primary mt-5 w-full"
      >
        I'm Safe
      </button>
    </section>
  );
}
function Arrival({ busy, complete }: { busy: boolean; complete: () => void }) {
  return (
    <section className="rounded-2xl border bg-white p-10 text-center shadow-sm">
      <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-success text-white">
        <Icon name="check" className="h-10 w-10" />
      </span>
      <h2 className="mt-6 text-2xl font-black">You arrived!</h2>
      <p className="mt-2 text-muted">Good to hear you made it safely.</p>
      <button
        disabled={busy}
        onClick={complete}
        className="btn-primary mt-7 w-full"
      >
        Complete Journey
      </button>
    </section>
  );
}
function Completed() {
  return (
    <section className="rounded-2xl border bg-white p-10 text-center shadow-sm">
      <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-success text-white">
        <Icon name="check" className="h-10 w-10" />
      </span>
      <h2 className="mt-6 text-2xl font-black">Journey completed</h2>
      <p className="mt-2 text-muted">Thanks for travelling with Kopa-Padi.</p>
      <a href="#guide-feedback" className="btn-primary mt-7 w-full">
        Give Feedback
      </a>
      <Link
        href="/travel-plans"
        className="mt-3 grid min-h-12 place-items-center rounded-xl border font-bold text-primary"
      >
        View Journey Details
      </Link>
    </section>
  );
}
function Sticky({ help }: { help: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-[65px] z-30 grid grid-cols-2 gap-2 border-t bg-white/95 p-3 lg:hidden">
      <a href="#check-ins" className="btn-primary min-h-11">
        Check In
      </a>
      <button
        onClick={help}
        className="min-h-11 rounded-xl border border-danger font-bold text-danger"
      >
        Need Help
      </button>
    </div>
  );
}

export function JourneyDashboard() {
  const [data, setData] = useState<Data | null>(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [shareUrl, setShareUrl] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await api<Data>("/journeys/current"));
    } catch (e) {
      if (e instanceof Error && e.message.includes("No active Journey"))
        setData(null);
      else setError(e instanceof Error ? e.message : "Could not load Journey");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function act(work: () => Promise<unknown>, success: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await work();
      setNotice(success);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }
  function checkIn(type: string) {
    void act(
      () =>
        api("/journeys/current/check-ins", {
          method: "POST",
          body: JSON.stringify({
            type,
            clientRequestId: crypto.randomUUID(),
            includeLocation: false,
          }),
        }),
      type === "NEED_HELP"
        ? "Help request recorded. Use the call buttons if you are in danger."
        : "Check-in saved.",
    );
  }
  function shareLocation(audience: "TRUSTED_CONTACT" | "CIRCLE") {
    const who =
      audience === "CIRCLE" ? "your Travel Circle" : "your trusted contacts";
    if (
      !window.confirm(
        "Share your current location with " +
          who +
          " for a limited time? It will expire automatically.",
      )
    )
      return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        void act(
          () =>
            api("/journeys/current/emergency/location", {
              method: "POST",
              body: JSON.stringify({
                latitude: coords.latitude,
                longitude: coords.longitude,
                audience,
                consent: true,
              }),
            }),
          "Temporary location shared.",
        ),
      (e) => setError(e.message),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }
  async function complete() {
    if (
      !data ||
      !window.confirm(
        "Complete this Journey? Active check-in controls will close.",
      )
    )
      return;
    setBusy(true);
    try {
      await api("/journeys/current/complete", { method: "POST" });
      setData({ ...data, journey: { ...data.journey, status: "COMPLETED" } });
      setNotice("Journey completed.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not complete Journey");
    } finally {
      setBusy(false);
    }
  }
  const active =
    data && ["IN_PROGRESS", "NEEDS_ATTENTION"].includes(data.journey.status);
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-60">
        <ShellTop />
        {loading ? (
          <Skeleton />
        ) : (
          <main
            className={
              "mx-auto max-w-6xl space-y-5 px-4 pb-28 pt-6 sm:px-7 lg:pb-10 " +
              (active ? "pb-44" : "")
            }
          >
            <header className="hidden lg:block">
              <h1 className="text-3xl font-black tracking-tight">
                Journey Safety
              </h1>
              <p className="mt-1 text-sm text-muted">
                Prepare, check in, and keep people you trust informed while you
                travel.
              </p>
            </header>
            {!data ? (
              <Prepare
                busy={busy}
                error={error}
                onPrepare={() =>
                  void act(
                    () =>
                      api("/journeys/prepare", { method: "POST", body: "{}" }),
                    "Journey preparation started.",
                  )
                }
              />
            ) : (
              <>
                <Route data={data} />
                <Progress status={data.journey.status} />
                {data.journey.status === "NEEDS_ATTENTION" ? (
                  <Attention busy={busy} onSafe={() => checkIn("SAFE")} />
                ) : null}
                {notice ? (
                  <p
                    role="status"
                    aria-live="polite"
                    className="rounded-xl bg-success/10 p-3 text-sm font-bold text-success"
                  >
                    {notice}
                  </p>
                ) : null}
                {error ? (
                  <p
                    role="alert"
                    className="rounded-xl bg-danger/10 p-3 text-sm text-danger"
                  >
                    {error}
                  </p>
                ) : null}
                {shareUrl ? (
                  <section className="rounded-xl border border-primary/20 bg-primary-light/40 p-4">
                    <h2 className="font-bold">Your new private share link</h2>
                    <p className="mt-1 text-xs text-muted">
                      Copy it now. It is shown only once.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <input
                        className="field min-w-0"
                        aria-label="Journey share link"
                        readOnly
                        value={shareUrl}
                      />
                      <button
                        onClick={() =>
                          void navigator.clipboard.writeText(shareUrl)
                        }
                        className="btn-primary"
                      >
                        Copy Link
                      </button>
                    </div>
                  </section>
                ) : null}
                <div className="grid items-start gap-5 lg:grid-cols-[1.55fr_1fr]">
                  <div className="space-y-5">
                    {active ? (
                      <div id="check-ins">
                        <CheckIns
                          data={data}
                          busy={busy}
                          checkIn={checkIn}
                          arrive={() =>
                            void act(
                              () =>
                                api("/journeys/current/arrive", {
                                  method: "POST",
                                  body: JSON.stringify({
                                    clientRequestId: crypto.randomUUID(),
                                  }),
                                }),
                              "Arrival confirmed.",
                            )
                          }
                        />
                      </div>
                    ) : null}
                    {data.journey.status === "ARRIVED" ? (
                      <Arrival busy={busy} complete={() => void complete()} />
                    ) : null}
                    {data.journey.status === "COMPLETED" ? <Completed /> : null}
                    <div id="guide-feedback">
                      <JourneyGuidePanel journeyStatus={data.journey.status} />
                    </div>
                  </div>
                  <aside className="space-y-5">
                    {["PREPARING", "READY_TO_START"].includes(
                      data.journey.status,
                    ) ? (
                      <Checklist data={data} busy={busy} act={act} />
                    ) : null}
                    {data.journey.status === "PREPARING" ? (
                      <Card title="Next Step" className="bg-primary-light/30">
                        <Icon name="flag" className="h-8 w-8 text-primary" />
                        <h3 className="mt-4 font-black">
                          Your journey preparation
                        </h3>
                        <p className="mt-2 text-sm text-muted">
                          Complete your checklist, then mark your journey as
                          ready.
                        </p>
                        <button
                          disabled={busy}
                          onClick={() =>
                            void act(
                              () =>
                                api("/journeys/current/ready", {
                                  method: "POST",
                                }),
                              "Journey is ready to start.",
                            )
                          }
                          className="btn-primary mt-5 w-full"
                        >
                          Mark as Ready
                        </button>
                      </Card>
                    ) : null}
                    {data.journey.status === "READY_TO_START" ? (
                      <Card
                        title="Your journey is ready"
                        className="bg-primary-light/30"
                      >
                        <p className="text-sm text-muted">
                          Your preparation is saved. Start when your journey
                          begins.
                        </p>
                        <button
                          disabled={busy}
                          onClick={() =>
                            void act(
                              () =>
                                api("/journeys/current/start", {
                                  method: "POST",
                                }),
                              "Journey started.",
                            )
                          }
                          className="btn-primary mt-5 w-full"
                        >
                          Start Journey
                        </button>
                      </Card>
                    ) : null}
                    {active ? <StatusCard data={data} /> : null}
                    <Contacts
                      data={data}
                      busy={busy}
                      act={act}
                      setShareUrl={setShareUrl}
                    />
                    {active ? (
                      <div id="emergency">
                        <Emergency
                          data={data}
                          busy={busy}
                          act={act}
                          checkIn={checkIn}
                          shareLocation={shareLocation}
                        />
                      </div>
                    ) : null}
                  </aside>
                </div>
                {active ? (
                  <Sticky
                    help={() =>
                      document
                        .getElementById("emergency")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  />
                ) : null}
              </>
            )}
          </main>
        )}
        <Bottom />
      </div>
    </div>
  );
}
