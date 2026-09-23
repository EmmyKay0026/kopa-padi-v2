"use client";
import { AppIcon, type AppIconName } from "./app-icon";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

type Plan = {
  plan: {
    intendedTravelDate: string;
    departureWindow: string;
    transportMode: string;
  };
  originState: { name: string };
  originLga: { name: string };
  originTown: { name: string } | null;
  destination: { campName: string; stateName: string };
};
type Status = {
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
};
type Member = {
  userId?: string;
  displayName: string | null;
  verificationStatus?: string;
  verified?: boolean;
};
type Circle = {
  circle: NonNullable<Status["circle"]>;
  originHub?: { name: string } | null;
  members: Member[];
} | null;
type Offer = {
  id: string;
  proposedTravelDate: string | null;
  proposedDepartureWindow: string | null;
  proposedTransportMode: string | null;
  expiresAt: string;
};
type PageData = {
  plan: Plan | null;
  status: Status;
  circle: Circle;
  offers: Array<{ match_offer: Offer }>;
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
const human = (v: string) =>
  v
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (x) => x.toUpperCase());
const time = (v: string) =>
  ({
    EARLY_MORNING: "4:00 AM – 7:00 AM",
    MORNING: "7:00 AM – 10:00 AM",
    LATE_MORNING: "10:00 AM – 12:00 PM",
    AFTERNOON: "12:00 PM – 4:00 PM",
    FLEXIBLE: "Flexible",
  })[v] ?? human(v);
const mode = (v: string) =>
  ({
    COMMERCIAL_BUS: "Bus",
    PRIVATE_VEHICLE: "Private vehicle",
    UNDECIDED: "Not decided yet",
  })[v] ?? human(v);
const date = (v: string) =>
  new Intl.DateTimeFormat("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(v.slice(0, 10) + "T12:00:00"));
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase() || "KP";
const circleLabel = (v: string) =>
  ({
    FORMING: "Circle forming",
    READY: "Ready",
    FULL: "Circle complete",
    LOCKED: "Circle locked",
  })[v] ?? human(v);
function Logo() {
  return (
    <Link className="matching-brand" href="/app" aria-label="Kopa-Padi home">
      <span className="matching-brand-mark" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span>
        <b>Kopa-Padi</b>
        <small>Travel together. Go further.</small>
      </span>
    </Link>
  );
}
function Header({ name }: { name: string }) {
  return (
    <header className="matching-topbar">
      <Logo />
      <span className="matching-profile" aria-label={name + "'s profile"}>
        {initials(name)}
      </span>
    </header>
  );
}
function Route({ plan, circle }: { plan: Plan; circle: Circle }) {
  const origin =
    circle?.originHub?.name ?? plan.originTown?.name ?? plan.originLga.name;
  const trip = circle?.circle;
  return (
    <section
      className="matching-route matching-enter"
      aria-label={
        "Journey from " + origin + " to " + plan.destination.stateName
      }
    >
      <div className="matching-route-row">
        <div className="matching-place">
          <Icon name="pin" />
          <span>
            <b>{origin}</b>
            <small>
              {circle?.originHub ? "Meeting hub" : plan.originState.name}
            </small>
          </span>
        </div>
        <div className="matching-route-line" aria-hidden="true">
          <i />
          <Icon name="bus" size={22} />
          <i />
        </div>
        <div className="matching-place destination">
          <Icon name="pin" />
          <span>
            <b>{plan.destination.stateName}</b>
            <small>{plan.destination.campName}</small>
          </span>
        </div>
      </div>
      <div className="matching-facts">
        <span>
          <Icon name="calendar" size={17} />
          <b>{date(trip?.travelDate ?? plan.plan.intendedTravelDate)}</b>
        </span>
        <span>
          <Icon name="clock" size={17} />
          <b>{time(trip?.departureWindow ?? plan.plan.departureWindow)}</b>
        </span>
        <span>
          <Icon name="bus" size={18} />
          <b>{mode(trip?.transportMode ?? plan.plan.transportMode)}</b>
        </span>
      </div>
    </section>
  );
}
function Progress({ stage }: { stage: 0 | 1 | 2 }) {
  return (
    <ol
      className="matching-progress matching-delay-one"
      aria-label="Matching progress"
    >
      {["Plan active", "Searching", "Circle formed"].map((label, index) => {
        const done = index < stage || stage === 2,
          current = index === stage && stage > 0;
        return (
          <li
            key={label}
            className={done ? "complete" : current ? "current" : ""}
            aria-current={current ? "step" : undefined}
          >
            <span>{done ? <Icon name="check" size={12} /> : null}</span>
            <b>{label}</b>
          </li>
        );
      })}
    </ol>
  );
}
function Privacy({ noPlan = false }: { noPlan?: boolean }) {
  return (
    <aside className="matching-privacy matching-delay-two">
      <span>
        <Icon name="shield" />
      </span>
      <p>
        <b>{noPlan ? "Your privacy matters." : "Your search is private."}</b>
        {noPlan
          ? "Your travel details are only used for matching and are not publicly listed."
          : "We don’t expose candidate profiles, nearby traveler counts, precise locations, match scores, or other travelers while matching."}
      </p>
    </aside>
  );
}
function Skeleton() {
  return (
    <div
      className="matching-body matching-loading"
      role="status"
      aria-label="Loading matching status"
    >
      <i className="route" />
      <i className="progress" />
      <div className="state">
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}
function Empty() {
  return (
    <>
      <section className="matching-card matching-empty matching-delay-two">
        <span className="matching-state-icon">
          <Icon name="document" size={34} />
        </span>
        <h2>Create an active Travel Plan to enter matching.</h2>
        <p>
          Tell us where and when you&apos;re travelling so Kopa-Padi can look
          for compatible verified travelers.
        </p>
        <Link className="matching-primary" href="/travel-plans">
          Create Travel Plan <Icon name="arrow" size={17} />
        </Link>
      </section>
      <Privacy noPlan />
    </>
  );
}
function Searching({
  plan,
  lastChecked,
  refreshing,
  onRefresh,
}: {
  plan: Plan;
  lastChecked: Date | null;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const origin = plan.originTown?.name ?? plan.originLga.name;
  return (
    <>
      <section className="matching-card matching-searching matching-delay-two">
        <div className="matching-search-icon" aria-hidden="true">
          <Icon name="search" size={29} />
          <i />
          <i />
          <i />
        </div>
        <h2>Finding your travel companions</h2>
        <p>
          We&apos;re privately looking for verified travelers whose plans are
          compatible with yours.
        </p>
        <div className="matching-mini-plan">
          <div className="matching-mini-route">
            <span>
              <Icon name="pin" size={17} />
              <b>{origin}</b>
            </span>
            <i />
            <Icon name="bus" size={18} />
            <i />
            <span>
              <Icon name="pin" size={17} />
              <b>{plan.destination.stateName}</b>
            </span>
          </div>
          <p>
            <Icon name="calendar" size={15} />
            {date(plan.plan.intendedTravelDate)} <i />{" "}
            {time(plan.plan.departureWindow)} <i />{" "}
            {mode(plan.plan.transportMode)}
          </p>
          <div className="matching-check">
            <span>
              <Icon name="clock" size={17} />
              <b>Matching in progress</b>
              <small>
                Last checked:{" "}
                {lastChecked
                  ? new Intl.DateTimeFormat("en-NG", {
                      hour: "numeric",
                      minute: "2-digit",
                    }).format(lastChecked)
                  : "Just now"}
              </small>
            </span>
            <button type="button" disabled={refreshing} onClick={onRefresh}>
              <Icon name="refresh" size={18} />
              {refreshing ? "Checking…" : "Refresh"}
            </button>
          </div>
        </div>
      </section>
      <Privacy />
    </>
  );
}
function Compare({
  label,
  plan,
  offer,
  suggested = false,
}: {
  label: string;
  plan: Plan;
  offer: Offer;
  suggested?: boolean;
}) {
  const proposed = (next: string | null, current: string) =>
    suggested ? (next ?? current) : current;
  const rows: [IconName, string, boolean][] = [
    [
      "calendar",
      date(proposed(offer.proposedTravelDate, plan.plan.intendedTravelDate)),
      Boolean(suggested && offer.proposedTravelDate),
    ],
    [
      "clock",
      time(proposed(offer.proposedDepartureWindow, plan.plan.departureWindow)),
      Boolean(suggested && offer.proposedDepartureWindow),
    ],
    [
      "bus",
      mode(proposed(offer.proposedTransportMode, plan.plan.transportMode)),
      Boolean(suggested && offer.proposedTransportMode),
    ],
  ];
  return (
    <section className={suggested ? "suggested" : ""}>
      <small>{label}</small>
      {rows.map(([icon, value, changed]) => (
        <p className={changed ? "changed" : ""} key={icon}>
          <Icon name={icon} size={16} />
          <b>{value}</b>
        </p>
      ))}
    </section>
  );
}
function expiry(expiresAt: string, now: number) {
  const m = Math.max(
    0,
    Math.ceil((new Date(expiresAt).getTime() - now) / 60000),
  );
  return m
    ? "Offer available for " + m + " minute" + (m === 1 ? "" : "s")
    : "Offer expires momentarily";
}
function Alternative({
  plan,
  offer,
  busy,
  onAccept,
  onDecline,
}: {
  plan: Plan;
  offer: Offer;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <section className="matching-card matching-offer matching-delay-two">
      <header>
        <span>
          <Icon name="swap" size={25} />
        </span>
        <div>
          <h2>A possible alternative</h2>
          <p>
            A small change to your travel plan may improve the chance of forming
            a Travel Circle.
          </p>
        </div>
      </header>
      <div className="matching-compare">
        <Compare label="Your plan" plan={plan} offer={offer} />
        <span aria-hidden="true">
          <Icon name="arrow" size={18} />
        </span>
        <Compare label="Suggested" plan={plan} offer={offer} suggested />
      </div>
      <p className="matching-expiry" aria-live="polite">
        <Icon name="clock" size={16} />
        {expiry(offer.expiresAt, now)}
      </p>
      <div className="matching-actions">
        <button className="matching-primary" disabled={busy} onClick={onAccept}>
          {busy ? "Please wait…" : "Accept Alternative"}
        </button>
        <button
          className="matching-secondary"
          disabled={busy}
          onClick={onDecline}
        >
          Keep My Current Plan
        </button>
      </div>
    </section>
  );
}
function CircleReady({ circle }: { circle: NonNullable<Circle> }) {
  return (
    <section className="matching-card matching-success matching-delay-two">
      <span className="matching-success-icon" aria-hidden="true">
        <Icon name="check" size={26} />
        <i />
        <i />
        <i />
      </span>
      <h2>
        Your Travel Circle is ready <span aria-hidden="true">🎉</span>
      </h2>
      <p>
        You&apos;ve been matched with verified travelers. Open your Circle to
        coordinate travel and plan a safe public meetup.
      </p>
      <span className="matching-pill">
        <Icon name="check" size={13} />
        {circleLabel(circle.circle.status)}
      </span>
      <div className="matching-circle">
        <b>
          {circle.circle.memberCount} of {circle.circle.maxMembers} travelers
        </b>
        <div className="matching-members" aria-label="Travel Circle members">
          {circle.members.map((member, index) => {
            const name = member.displayName?.trim() || "Verified PCM",
              verified =
                member.verified ?? member.verificationStatus === "VERIFIED";
            return (
              <div key={member.userId ?? name + index}>
                <span>{initials(name)}</span>
                <b>{name}</b>
                {verified ? (
                  <small>
                    <Icon name="check" size={10} />
                    Verified
                  </small>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
      <Link className="matching-primary" href="/circle">
        Open Travel Circle <Icon name="arrow" size={17} />
      </Link>
    </section>
  );
}
function ErrorCard({ retry }: { retry: () => void }) {
  return (
    <section className="matching-error" role="alert">
      <span>
        <Icon name="warning" size={23} />
      </span>
      <div>
        <h2>Something went wrong</h2>
        <p>
          We couldn&apos;t update your matching status right now. Please try
          again.
        </p>
      </div>
      <button onClick={retry}>Try again</button>
    </section>
  );
}
function Confirm({
  offer,
  plan,
  busy,
  close,
  accept,
}: {
  offer: Offer | null;
  plan: Plan | null;
  busy: boolean;
  close: () => void;
  accept: () => void;
}) {
  const box = useRef<HTMLDivElement>(null),
    cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!offer) return;
    const previous = document.activeElement as HTMLElement | null;
    cancel.current?.focus();
    const keys = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) close();
      if (e.key !== "Tab" || !box.current) return;
      const items = Array.from(
        box.current.querySelectorAll<HTMLElement>("button:not(:disabled)"),
      );
      if (!items.length) return;
      const first = items[0]!,
        last = items.at(-1)!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", keys);
    return () => {
      document.removeEventListener("keydown", keys);
      previous?.focus();
    };
  }, [offer, busy, close]);
  if (!offer || !plan) return null;
  const changes = [
    offer.proposedTravelDate
      ? "Travel date to " + date(offer.proposedTravelDate)
      : null,
    offer.proposedDepartureWindow
      ? "Departure to " + time(offer.proposedDepartureWindow)
      : null,
    offer.proposedTransportMode
      ? "Transport to " + mode(offer.proposedTransportMode)
      : null,
  ].filter((x): x is string => Boolean(x));
  return (
    <div
      className="matching-dialog-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && close()}
    >
      <div
        className="matching-dialog"
        ref={box}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="matching-dialog-title"
      >
        <span>
          <Icon name="swap" size={25} />
        </span>
        <h2 id="matching-dialog-title">Update your Travel Plan?</h2>
        <p>Accepting this alternative will update:</p>
        <ul>
          {changes.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <div>
          <button
            ref={cancel}
            className="matching-secondary"
            disabled={busy}
            onClick={close}
          >
            Cancel
          </button>
          <button className="matching-primary" disabled={busy} onClick={accept}>
            {busy ? "Updating…" : "Accept and Update Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}
export function MatchingStatus() {
  const session = authClient.useSession();
  const [data, setData] = useState<PageData>();
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Offer | null>(null);
  const [checked, setChecked] = useState<Date | null>(null);
  const load = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    setError("");
    try {
      const [plan, status, circle, offers] = await Promise.all([
        api<Plan | null>("/travel-plans/active"),
        api<Status>("/matching/status"),
        api<Circle>("/travel-circles/current"),
        api<Array<{ match_offer: Offer }>>("/match-offers"),
      ]);
      setData({ plan, status, circle, offers });
      setChecked(new Date());
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not update matching status",
      );
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const poll = Boolean(
    data?.plan && !data.circle && data.status.status === "SEARCHING",
  );
  useEffect(() => {
    if (!poll) return;
    const id = window.setInterval(() => void load(true), 12000);
    return () => window.clearInterval(id);
  }, [load, poll]);
  async function respond(offer: Offer, action: "accept" | "decline") {
    setBusy(offer.id);
    setError("");
    try {
      await api("/match-offers/" + offer.id + "/" + action, { method: "POST" });
      setConfirm(null);
      await load(true);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not respond to this offer",
      );
    } finally {
      setBusy(null);
    }
  }
  const offer = data?.offers[0]?.match_offer ?? null,
    stage: 0 | 1 | 2 = data?.circle ? 2 : data?.plan ? 1 : 0;
  const close = useCallback(() => setConfirm(null), []);
  return (
    <div className="matching-page">
      <div className="matching-contours" aria-hidden="true" />
      <div className="matching-landscape" aria-hidden="true">
        <i />
        <i />
      </div>
      <Header name={session.data?.user.name?.trim() || "Traveler"} />
      <main className="matching-container">
        <Link className="matching-back" href="/app">
          ← <span>Back</span>
        </Link>
        <div className="matching-title matching-enter">
          <h1>Matching</h1>
          <p>Your private matching and Travel Circle status.</p>
        </div>
        {!data && !error ? (
          <Skeleton />
        ) : (
          <div className="matching-body">
            {data?.plan ? (
              <Route plan={data.plan} circle={data.circle} />
            ) : null}
            <Progress stage={stage} />
            {error ? <ErrorCard retry={() => void load()} /> : null}
            {data?.circle && data.plan ? (
              <CircleReady circle={data.circle} />
            ) : data?.plan && offer ? (
              <Alternative
                plan={data.plan}
                offer={offer}
                busy={busy === offer.id}
                onAccept={() => setConfirm(offer)}
                onDecline={() => void respond(offer, "decline")}
              />
            ) : data?.plan ? (
              <Searching
                plan={data.plan}
                lastChecked={checked}
                refreshing={refreshing}
                onRefresh={() => void load()}
              />
            ) : data ? (
              <Empty />
            ) : null}
          </div>
        )}
        <p className="matching-signoff">Same route. Better company.</p>
      </main>
      <Confirm
        offer={confirm}
        plan={data?.plan ?? null}
        busy={Boolean(busy)}
        close={close}
        accept={() => confirm && void respond(confirm, "accept")}
      />
    </div>
  );
}
