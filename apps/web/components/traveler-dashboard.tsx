"use client";
import { AppIcon, type AppIconName } from "./app-icon";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { UserSidebar } from "./user-sidebar";

type Verification = { verification: { status: string } };
type Plan = {
  plan: {
    id: string;
    status: string;
    intendedTravelDate: string;
    departureWindow: string;
    transportMode: string;
  };
  originState: { name: string };
  originLga: { name: string };
  originTown: { name: string } | null;
  destination: { campName: string; stateName: string };
};
type Match = {
  status: string;
  circle: {
    id: string;
    status: string;
    memberCount: number;
    maxMembers: number;
    travelDate: string;
    departureWindow: string;
    transportMode: string;
  } | null;
  alternativeOfferAvailable: boolean;
};
type Circle = {
  circle: NonNullable<Match["circle"]>;
  members: Array<{ displayName: string; verified: boolean }>;
} | null;
type Data = {
  verification: Verification;
  plan: Plan | null;
  matching: Match | null;
  circle: Circle;
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
      <span>
        <strong className="block leading-none">Kopa-Padi</strong>
        <small className="text-[9px] text-muted">
          Travel together. Go further.
        </small>
      </span>
    </Link>
  );
}
function Motif() {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-x-0 bottom-0 h-24 w-full text-primary/30"
      viewBox="0 0 700 120"
      preserveAspectRatio="none"
    >
      <path
        d="M20 90C130 15 220 110 340 45S540 95 675 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="5 7"
      />
      <circle cx="20" cy="90" r="7" fill="currentColor" />
      <circle cx="675" cy="20" r="9" fill="currentColor" />
    </svg>
  );
}

function Sidebar() {
  return <UserSidebar active="Dashboard" />;
}
function Top({ name, verified }: { name: string; verified: boolean }) {
  return (
    <>
      <header className="hidden h-20 items-center justify-between border-b bg-white px-8 lg:flex">
        <label className="relative w-full max-w-md">
          <span className="sr-only">Search dashboard</span>
          <Icon name="search" className="absolute left-4 top-3.5 text-muted" />
          <input
            className="field pl-12"
            placeholder="Search trips, matches or messages..."
          />
        </label>
        <div className="flex items-center gap-4">
          <button
            aria-label="Notifications"
            className="relative grid h-11 w-11 place-items-center"
          >
            <Icon name="bell" />
            <i className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger" />
          </button>
          <span className="grid h-11 w-11 place-items-center rounded-full bg-primary-dark font-bold text-white">
            {name[0]}
          </span>
          <p className="text-sm">
            <strong>{name}</strong>
            <small
              className={verified ? "block text-success" : "block text-muted"}
            >
              {verified ? "Verified traveler" : "Traveler"}
            </small>
          </p>
        </div>
      </header>
      <header className="flex h-20 items-center justify-between border-b bg-white px-5 lg:hidden">
        <Logo />
        <div className="flex items-center">
          <button
            aria-label="Notifications"
            className="grid h-11 w-11 place-items-center"
          >
            <Icon name="bell" />
          </button>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-dark font-bold text-white">
            {name[0]}
          </span>
        </div>
      </header>
    </>
  );
}
function Header({ name }: { name: string }) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-primary-light/30 p-6 sm:p-8">
      <Motif />
      <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-[-.04em] sm:text-4xl">
            Good morning, {name}
          </h1>
          <p className="mt-1 text-muted">Ready to plan your next journey?</p>
        </div>
        <p className="absolute right-44 top-0 hidden -rotate-6 font-serif text-lg italic text-primary xl:block">
          More places.
          <br />
          Better people.
        </p>
        <Link href="/travel-plans" className="btn-primary">
          <Icon name="plus" className="mr-2" />
          Create a Trip
        </Link>
      </div>
    </section>
  );
}
function VerificationCard({ ok }: { ok: boolean }) {
  const [hide, setHide] = useState(false);
  if (ok || hide) return null;
  return (
    <section className="flex items-center gap-4 rounded-2xl border border-primary/15 bg-primary-light/50 p-4">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-white">
        <Icon name="shield" />
      </span>
      <div className="flex-1">
        <h2 className="font-bold">Complete your verification</h2>
        <p className="mt-1 text-sm text-muted">
          Verify your identity to create trips and connect with other travelers.
        </p>
      </div>
      <Link
        href="/verification"
        className="hidden rounded-xl bg-primary-dark px-5 py-3 text-sm font-bold text-white sm:block"
      >
        Complete Verification
      </Link>
      <Link
        href="/verification"
        aria-label="Complete verification"
        className="text-primary sm:hidden"
      >
        -&gt;
      </Link>
      <button
        aria-label="Dismiss"
        onClick={() => setHide(true)}
        className="h-10 w-10"
      >
        x
      </button>
    </section>
  );
}
function Card({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={
        "rounded-2xl border bg-white p-5 shadow-[0_8px_30px_rgba(15,118,110,.04)] " +
        className
      }
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-black">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
const pretty = (v: string) =>
  v
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (x) => x.toUpperCase());
function TripCard({ plan }: { plan: Plan | null }) {
  if (!plan)
    return (
      <Card
        title="Your Next Trip"
        action={
          <Link className="text-xs font-bold text-primary" href="/travel-plans">
            View all -&gt;
          </Link>
        }
      >
        <div className="relative overflow-hidden rounded-xl bg-primary-light/30 py-11 text-center">
          <Motif />
          <div className="relative">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white text-primary">
              <Icon name="trip" />
            </span>
            <h3 className="mt-4 font-bold">No upcoming trip yet</h3>
            <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
              Create a trip to start finding travelers going your way.
            </p>
            <Link href="/travel-plans" className="btn-primary mt-5">
              Create a Trip
            </Link>
          </div>
        </div>
      </Card>
    );
  const origin = plan.originTown?.name ?? plan.originLga.name;
  return (
    <Card
      title="Your Next Trip"
      action={
        <Link className="text-xs font-bold text-primary" href="/travel-plans">
          View all -&gt;
        </Link>
      }
    >
      <div
        className="h-28 rounded-xl bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=80')",
        }}
      />
      <div className="mt-5 flex items-center gap-2 font-bold">
        <span>{origin}</span>
        <span className="flex-1 border-t border-dashed" />
        <Icon name="car" className="text-primary" />
        <span className="flex-1 border-t border-dashed" />
        <span>{plan.destination.stateName}</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <p className="flex gap-2">
          <Icon name="calendar" />
          <span>
            {new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(
              new Date(plan.plan.intendedTravelDate),
            )}
            <small className="block text-muted">
              {pretty(plan.plan.departureWindow)}
            </small>
          </span>
        </p>
        <p className="flex gap-2">
          <Icon name="car" />
          <span>
            {pretty(plan.plan.transportMode)}
            <small className="block text-success">
              {pretty(plan.plan.status)}
            </small>
          </span>
        </p>
      </div>
      <div className="mt-5 rounded-xl bg-background p-4 text-sm">
        <strong>Matching status</strong>
        <p className="mt-1 text-xs text-muted">
          Open Matches to see the latest update for this journey.
        </p>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Link className="btn-primary" href="/travel-plans">
          View Trip
        </Link>
        <Link
          className="grid place-items-center rounded-xl border border-primary font-bold text-primary"
          href="/travel-plans"
        >
          Edit Trip
        </Link>
      </div>
    </Card>
  );
}
const stages = [
  ["Trip created", "Your trip has been posted."],
  ["Looking for matches", "Finding travelers going your way."],
  ["Review matches", "We will notify you when matches are available."],
  ["Accept a match", "Choose the right travel companion."],
  ["Travel together", "Join your travel circle and get ready to go."],
];
function Matching({
  plan,
  match,
  className = "",
}: {
  plan: Plan | null;
  match: Match | null;
  className?: string;
}) {
  let active = plan ? 1 : 0;
  if (match?.alternativeOfferAvailable) active = 2;
  if (match?.circle) active = 4;
  return (
    <Card title="Matching Activity" className={className}>
      <ol>
        {stages.map(([t, c], i) => (
          <li key={t} className="relative flex gap-3 pb-5 last:pb-0">
            <span
              className={
                "z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-[9px] " +
                (plan && i < active
                  ? "border-primary bg-primary text-white"
                  : plan && i === active
                    ? "border-primary bg-primary-light text-primary"
                    : "border-slate-300 text-muted")
              }
            >
              {plan && i < active ? "OK" : i + 1}
            </span>
            {i < 4 ? (
              <i
                className={
                  "absolute left-[11px] top-6 h-full w-px " +
                  (plan && i < active ? "bg-primary" : "bg-slate-200")
                }
              />
            ) : null}
            <div>
              <h3
                className={
                  "text-sm font-bold " +
                  (plan && i === active ? "text-primary" : "")
                }
              >
                {t}
              </h3>
              <p className="mt-1 text-xs leading-5 text-muted">
                {!plan && i === 0 ? "Create a trip to begin matching." : c}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
function CircleCard({
  circle,
  className = "",
}: {
  circle: Circle;
  className?: string;
}) {
  return (
    <Card title="Travel Circle" className={className}>
      {circle ? (
        <>
          <div className="flex -space-x-2">
            {circle.members.slice(0, 4).map((m, i) => (
              <span
                key={m.displayName + i}
                className="grid h-11 w-11 place-items-center rounded-full border-2 border-white bg-primary-light font-bold text-primary"
              >
                {m.displayName[0]}
              </span>
            ))}
          </div>
          <h3 className="mt-5 font-bold">
            {circle.circle.memberCount} member travel circle
          </h3>
          <p className="mt-2 text-sm text-muted">
            {pretty(circle.circle.status)}
          </p>
          <Link className="btn-primary mt-5 w-full" href="/circle">
            Open Travel Circle
          </Link>
        </>
      ) : (
        <div className="py-7 text-center">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-background text-muted">
            <Icon name="people" className="h-10 w-10" />
          </span>
          <h3 className="mt-5 font-bold">No travel circle yet</h3>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted">
            Your travel circle will appear here once you accept a match.
          </p>
          <Link
            className="mt-5 inline-flex rounded-xl border px-5 py-3 font-bold"
            href="/circle"
          >
            Learn more
          </Link>
        </div>
      )}
    </Card>
  );
}
const quick: Array<[IconName, string, string, string]> = [
  ["plus", "Create a Trip", "Plan a new journey", "/travel-plans"],
  ["people", "Find Matches", "See travelers going your way", "/matching"],
  ["trip", "My Trips", "View and manage your trips", "/travel-plans"],
  ["chat", "Messages", "Chat with your matches", "/circle"],
];
const safe: Array<[IconName, string, string, string]> = [
  ["share", "Share Trip", "Share your journey", "/circle"],
  ["phone", "Emergency Contacts", "Manage your contacts", "/circle"],
  ["check", "Journey Check-in", "Check in during travel", "/circle"],
  ["alert", "Report a Concern", "Report unsafe behaviour", "/circle"],
  ["alert", "SOS", "Use only in emergency", "/circle"],
];
function Actions({ safety = false }: { safety?: boolean }) {
  const a = safety ? safe : quick;
  return (
    <Card
      title={safety ? "Safety Tools" : "Quick Actions"}
      action={
        <Link
          className="text-xs font-bold text-primary"
          href={safety ? "/circle" : "/travel-plans"}
        >
          See all -&gt;
        </Link>
      }
    >
      <div
        className={
          "grid gap-3 " +
          (safety ? "grid-cols-3 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4")
        }
      >
        {a.map(([i, t, c, h]) => (
          <Link key={t} href={h} className="text-center">
            <span
              className={
                "mx-auto grid h-14 w-14 place-items-center rounded-xl " +
                (t === "SOS"
                  ? "bg-danger/10 text-danger"
                  : "bg-primary/5 text-primary")
              }
            >
              <Icon name={i} />
            </span>
            <strong
              className={
                "mt-2 block text-xs " + (t === "SOS" ? "text-danger" : "")
              }
            >
              {t}
            </strong>
            <small className="mt-1 hidden text-muted sm:block">{c}</small>
          </Link>
        ))}
      </div>
    </Card>
  );
}
const rec = [
  [
    "Plan a weekend trip",
    "Find travelers for popular routes",
    "/travel-plans",
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=80",
  ],
  [
    "Travel safety tips",
    "Stay informed and travel with confidence",
    "/circle",
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80",
  ],
  [
    "Build your travel circle",
    "Travel with people you trust",
    "/circle",
    "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=600&q=80",
  ],
];
function Recommended() {
  return (
    <Card
      title="Recommended for you"
      action={
        <span className="text-xs font-bold text-primary">See all -&gt;</span>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {rec.map(([t, c, h, img]) => (
          <Link key={t} href={h} className="overflow-hidden rounded-xl border">
            <div
              className="h-28 bg-cover bg-center"
              style={{ backgroundImage: `url('${img}')` }}
            />
            <div className="p-3">
              <h3 className="text-sm font-bold">{t}</h3>
              <p className="mt-1 text-xs text-muted">{c}</p>
              <span className="mt-3 block text-xs font-bold text-primary">
                Learn more -&gt;
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
function MatchAlert({
  match,
  circle,
}: {
  match: Match | null;
  circle: Circle;
}) {
  if (circle)
    return (
      <section
        role="status"
        className="flex items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-white">
            <Icon name="people" size={19} />
          </span>
          <div>
            <p className="font-black text-primary">You have been matched!</p>
            <p className="text-sm text-muted">
              Your Travel Circle is ready to review.
            </p>
          </div>
        </div>
        <Link href="/circle" className="btn-primary shrink-0">
          Open Circle
        </Link>
      </section>
    );
  if (match?.alternativeOfferAvailable)
    return (
      <section
        role="status"
        className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4"
      >
        <div>
          <p className="font-black text-amber-900">
            A match is waiting for your review
          </p>
          <p className="text-sm text-amber-800">
            Review the proposed travel details before accepting.
          </p>
        </div>
        <Link href="/matching" className="btn-primary shrink-0">
          Review match
        </Link>
      </section>
    );
  return null;
}
function Recent({ data }: { data: Data }) {
  const rows: string[] = [];
  if (data.plan)
    rows.push(
      "Your trip to " +
        data.plan.destination.stateName +
        " is " +
        pretty(data.plan.plan.status),
    );
  if (data.matching?.alternativeOfferAvailable)
    rows.push("An alternative match needs your review");
  if (data.circle) rows.push("Your Travel Circle is ready");
  return (
    <Card title="Recent Activity">
      {rows.length ? (
        <ul className="space-y-4">
          {rows.map((x) => (
            <li key={x} className="flex gap-3 text-sm font-semibold">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-background text-primary">
                <Icon name="check" />
              </span>
              {x}
            </li>
          ))}
        </ul>
      ) : (
        <div className="py-8 text-center">
          <h3 className="font-semibold">No recent activity yet</h3>
          <p className="mt-2 text-sm text-muted">
            Trip and matching updates will appear here.
          </p>
        </div>
      )}
    </Card>
  );
}
function Brand() {
  return (
    <section
      className="rounded-2xl bg-primary-dark bg-cover bg-center p-8 text-white"
      style={{
        backgroundImage:
          "linear-gradient(90deg,rgba(5,53,49,.97),rgba(5,53,49,.55)),url('https://images.unsplash.com/photo-1473445361085-b9a07f55608b?auto=format&fit=crop&w=1400&q=80')",
      }}
    >
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <p className="-rotate-2 font-serif text-2xl italic">
          Good people lead to great journeys.
        </p>
        <div>
          <strong>Create a trip today</strong>
          <p className="text-sm text-white/70">
            and find travelers going your way.
          </p>
        </div>
        <Link
          className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-primary-dark"
          href="/travel-plans"
        >
          Get started -&gt;
        </Link>
      </div>
    </section>
  );
}
function Bottom() {
  const b: Array<[IconName, string, string]> = [
    ["home", "Dashboard", "/app"],
    ["trip", "My Trips", "/travel-plans"],
    ["match", "Matches", "/matching"],
    ["people", "Travel Circle", "/circle"],
    ["chat", "Messages", "/circle#circle-chat"],
  ];
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-white/95 px-2 pb-2 pt-2 lg:hidden"
    >
      {b.map(([i, l, h], x) => (
        <Link
          key={l}
          href={h}
          className={
            "flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] font-bold " +
            (x === 0 ? "text-primary" : "text-muted")
          }
        >
          <Icon name={i} />
          {x === 0 ? "Home" : l.replace("My ", "")}
        </Link>
      ))}
    </nav>
  );
}
function Loading() {
  return (
    <div className="animate-pulse space-y-5 p-5">
      <div className="h-40 rounded-2xl bg-primary-light/40" />
      <div className="h-24 rounded-2xl bg-slate-100" />
      <div className="h-96 rounded-2xl bg-slate-100" />
      <span className="sr-only" role="status">
        Loading dashboard
      </span>
    </div>
  );
}

export function TravelerDashboard() {
  const session = authClient.useSession();
  const [data, setData] = useState<Data>();
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setError("");
    try {
      const verification = await api<Verification>("/verification/status");
      let plan: Plan | null = null,
        matching: Match | null = null,
        circle: Circle = null;
      if (verification.verification.status === "VERIFIED") {
        [plan, matching, circle] = await Promise.all([
          api<Plan | null>("/travel-plans/active"),
          api<Match>("/matching/status"),
          api<Circle>("/travel-circles/current"),
        ]);
      }
      setData({ verification, plan, matching, circle });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not load your dashboard",
      );
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const name = (session.data?.user.name?.trim() || "Traveler").split(/\s+/)[0];
  const verified = data?.verification.verification.status === "VERIFIED";
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-60">
        <Top name={name} verified={verified} />
        {!data && !error ? (
          <Loading />
        ) : (
          <main className="mx-auto max-w-[1500px] space-y-5 px-4 pb-28 pt-5 sm:px-7 lg:pb-10 xl:px-10">
            {error ? (
              <section
                role="alert"
                className="rounded-2xl border border-danger/20 bg-danger/5 p-6"
              >
                <h1 className="text-xl font-bold text-danger">
                  We could not load your dashboard
                </h1>
                <p className="mt-2 text-sm text-muted">{error}</p>
                <button
                  onClick={() => void load()}
                  className="btn-primary mt-5"
                >
                  Try again
                </button>
              </section>
            ) : data ? (
              <>
                <Header name={name} />
                <VerificationCard ok={verified} />{" "}
                <MatchAlert match={data.matching} circle={data.circle} />
                <div className="grid gap-5 lg:grid-cols-[1.25fr_.8fr_.72fr]">
                  <TripCard plan={data.plan} />
                  <Matching
                    plan={data.plan}
                    match={data.matching}
                    className="hidden lg:block"
                  />
                  <CircleCard
                    circle={data.circle}
                    className="hidden lg:block"
                  />
                </div>
                <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
                  <Actions />
                  <Actions safety />
                </div>
                <div className="grid gap-5 xl:grid-cols-[1.4fr_.6fr]">
                  <Recommended />
                  <Recent data={data} />
                </div>
                <Matching
                  plan={data.plan}
                  match={data.matching}
                  className="lg:hidden"
                />
                <CircleCard circle={data.circle} className="lg:hidden" />
                <Brand />
                <footer className="flex flex-col items-center justify-between gap-5 py-4 text-sm text-muted sm:flex-row">
                  <Logo />
                  <div className="flex gap-6">
                    <a href="#">Help</a>
                    <a href="#">Privacy</a>
                    <a href="#">Terms</a>
                    <a href="#">Contact</a>
                  </div>
                </footer>
              </>
            ) : null}
          </main>
        )}
        <Bottom />
      </div>
    </div>
  );
}
