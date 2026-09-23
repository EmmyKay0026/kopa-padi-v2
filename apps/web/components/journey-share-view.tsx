"use client";
import { AppIcon, type AppIconName } from "./app-icon";

import { api } from "@/lib/api";
import Link from "next/link";
import { type ReactNode, useCallback, useEffect, useState } from "react";

type Shared = {
  travellerName: string;
  status: string;
  destination: string;
  expectedArrivalAt: string | null;
  lastCheckIn: {
    type: string;
    message: string | null;
    createdAt: string;
  } | null;
  currentLocation: {
    latitude: string;
    longitude: string;
    sharedAt: string;
    expiresAt: string;
  } | null;
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
function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <Link
      href="/"
      className={`share-brand ${footer ? "footer" : ""}`}
      aria-label="Kopa-Padi home"
    >
      <span>
        <Icon name="people" size={footer ? 18 : 25} />
      </span>
      <span>
        <b>Kopa-Padi</b>
        <small>Travel together. Go further.</small>
      </span>
    </Link>
  );
}

function JourneyShareHeader() {
  return (
    <header className="share-header">
      <Brand />
      <p aria-hidden="true">
        Good people
        <br />
        lead to great journeys.
      </p>
    </header>
  );
}

function SharedJourneyBadge() {
  return (
    <p className="share-badge">
      <Icon name="shield" size={15} /> Shared journey
    </p>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatRefreshTime(value: Date) {
  const today = new Date();
  const sameDay = value.toDateString() === today.toDateString();
  const time = new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
  return sameDay
    ? `Today, ${time}`
    : new Intl.DateTimeFormat("en-NG", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      }).format(value);
}

function relativeTime(value: string) {
  const timestamp = new Date(value).valueOf();
  if (Number.isNaN(timestamp)) return value;
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  return formatDateTime(value);
}

function sentenceName(name: string) {
  return name.trim() || "The traveler";
}

const STATUS_COPY: Record<
  string,
  {
    label: string;
    copy: (name: string) => string;
    icon: IconName;
    tone: string;
  }
> = {
  PREPARING: {
    label: "Preparing",
    copy: (name) => `${name} is preparing for the journey.`,
    icon: "route",
    tone: "teal",
  },
  READY_TO_START: {
    label: "Ready to Start",
    copy: (name) => `${name} is ready to begin the journey.`,
    icon: "route",
    tone: "blue",
  },
  IN_PROGRESS: {
    label: "In Progress",
    copy: (name) => `${name} is currently travelling.`,
    icon: "journey",
    tone: "blue",
  },
  NEEDS_ATTENTION: {
    label: "Needs Attention",
    copy: () => "We haven’t received a recent check-in.",
    icon: "warning",
    tone: "warning",
  },
  ARRIVED: {
    label: "Arrived",
    copy: (name) => `${name} has reached their destination.`,
    icon: "flag",
    tone: "success",
  },
  COMPLETED: {
    label: "Completed",
    copy: (name) => `${name} has completed this journey.`,
    icon: "check",
    tone: "success",
  },
  CANCELLED: {
    label: "Cancelled",
    copy: () => "This journey is no longer active.",
    icon: "route",
    tone: "neutral",
  },
};

function TravelerJourneyHeading({ data }: { data: Shared }) {
  const arrived = data.status === "ARRIVED" || data.status === "COMPLETED";
  return (
    <div className="share-heading">
      <span className="share-avatar" aria-hidden="true">
        {data.travellerName.trim().slice(0, 1).toUpperCase() || "K"}
      </span>
      <h1>
        {sentenceName(data.travellerName)}{" "}
        {arrived ? "has arrived at" : "is travelling to"}
        <strong>{data.destination}</strong>
      </h1>
    </div>
  );
}

function JourneyRoute({ destination }: { destination: string }) {
  return (
    <div
      className="share-route"
      aria-label={`Shared journey to ${destination}. This is not live vehicle tracking.`}
    >
      <div>
        <Icon name="route" />
        <span>
          <b>Journey</b>
          <small>Shared status</small>
        </span>
      </div>
      <span className="share-route-line" />
      <Icon name="journey" />
      <span className="share-route-line" />
      <div>
        <Icon name="pin" />
        <span>
          <b>{destination}</b>
          <small>Destination</small>
        </span>
      </div>
    </div>
  );
}

function JourneyStatusCard({ data }: { data: Shared }) {
  const config = STATUS_COPY[data.status] ?? {
    label: data.status.replaceAll("_", " "),
    copy: () => "Journey status update.",
    icon: "route" as const,
    tone: "teal",
  };
  return (
    <section
      className={`share-status-card ${config.tone}`}
      aria-labelledby="share-status-title"
    >
      <span>
        <Icon name={config.icon} size={27} />
      </span>
      <div>
        <h2 id="share-status-title">{config.label}</h2>
        <p>{config.copy(sentenceName(data.travellerName))}</p>
      </div>
    </section>
  );
}

function JourneyTimeline({ data }: { data: Shared }) {
  const started = [
    "IN_PROGRESS",
    "NEEDS_ATTENTION",
    "ARRIVED",
    "COMPLETED",
  ].includes(data.status);
  const arrived = ["ARRIVED", "COMPLETED"].includes(data.status);
  const hasCheckIn = Boolean(data.lastCheckIn);
  return (
    <div
      className="share-timeline"
      aria-label="Semantic journey progress; not GPS progress"
    >
      <div className={started ? "active" : ""}>
        <i />
        <span>Started</span>
      </div>
      <b className={started ? "active" : ""} />
      <div className={hasCheckIn ? "active" : ""}>
        <i />
        <span>Latest check-in</span>
      </div>
      <b className={arrived ? "active" : ""} />
      <div className={arrived ? "active" : ""}>
        <i />
        <span>Arrived</span>
      </div>
    </div>
  );
}

function JourneyMetaCards({
  expectedArrivalAt,
}: {
  expectedArrivalAt: string | null;
}) {
  if (!expectedArrivalAt) return null;
  return (
    <section className="share-meta-grid" aria-label="Journey timing">
      <div>
        <span>
          <Icon name="clock" />
        </span>
        <p>
          <small>Expected arrival</small>
          <b>
            <time dateTime={expectedArrivalAt}>
              {formatDateTime(expectedArrivalAt)}
            </time>
          </b>
        </p>
      </div>
    </section>
  );
}

const CHECKIN_COPY: Record<string, { label: string; icon: IconName }> = {
  SAFE: { label: "I’m Safe", icon: "shield" },
  CONNECTION_REACHED: { label: "Connection Reached", icon: "route" },
  NEAR_DESTINATION: { label: "Near Destination", icon: "pin" },
  NEED_HELP: { label: "Need Help", icon: "warning" },
  ARRIVED: { label: "I’ve Arrived", icon: "flag" },
  STARTED: { label: "Journey Started", icon: "journey" },
};

function LatestCheckIn({ data }: { data: Shared }) {
  const checkIn = data.lastCheckIn;
  if (!checkIn)
    return (
      <section className="share-checkin empty">
        <span>
          <Icon name="clock" />
        </span>
        <div>
          <h2>No check-in yet</h2>
          <p>
            Waiting for {sentenceName(data.travellerName)}&apos;s first update.
          </p>
        </div>
      </section>
    );
  const config = CHECKIN_COPY[checkIn.type] ?? {
    label: checkIn.type.replaceAll("_", " "),
    icon: "check" as const,
  };
  const needHelp = checkIn.type === "NEED_HELP";
  return (
    <section
      className={`share-checkin ${needHelp ? "danger" : ""}`}
      aria-labelledby="checkin-title"
    >
      <span>
        <Icon name={config.icon} />
      </span>
      <div>
        <small>Latest check-in</small>
        <h2 id="checkin-title">{config.label}</h2>
        <time
          dateTime={checkIn.createdAt}
          title={formatDateTime(checkIn.createdAt)}
        >
          {relativeTime(checkIn.createdAt)}
        </time>
        {checkIn.message ? <blockquote>“{checkIn.message}”</blockquote> : null}
      </div>
    </section>
  );
}

function AttentionNotice({ data }: { data: Shared }) {
  if (
    data.status !== "NEEDS_ATTENTION" ||
    data.lastCheckIn?.type === "NEED_HELP"
  )
    return null;
  return (
    <section className="share-attention" role="status">
      <Icon name="warning" />
      <div>
        <h2>A recent check-in is missing.</h2>
        <p>
          Please wait for an update or contact the traveler directly if
          appropriate. A missing check-in does not mean there is an emergency.
        </p>
      </div>
    </section>
  );
}

function CompletionNotice({ status }: { status: string }) {
  if (!["ARRIVED", "COMPLETED"].includes(status)) return null;
  return (
    <section className="share-complete-note">
      <Icon name="check" />
      <p>
        <b>This journey is now complete.</b>This share will remain available for
        a limited time after arrival.
      </p>
    </section>
  );
}

function TemporaryLocationAction({ data }: { data: Shared }) {
  if (!data.currentLocation) return null;
  const { latitude, longitude, sharedAt, expiresAt } = data.currentLocation;
  return (
    <a
      className="share-location-action"
      href={`https://www.google.com/maps?q=${encodeURIComponent(latitude)},${encodeURIComponent(longitude)}`}
      target="_blank"
      rel="noreferrer"
    >
      <span>
        <Icon name="pin" />
      </span>
      <p>
        <b>View temporary location</b>
        <small>
          Shared explicitly by {sentenceName(data.travellerName)} at{" "}
          <time dateTime={sharedAt}>{formatDateTime(sharedAt)}</time>. Expires{" "}
          <time dateTime={expiresAt}>{formatDateTime(expiresAt)}</time>.
        </small>
      </p>
      <Icon name="external" size={17} />
    </a>
  );
}

function RefreshRow({
  refreshedAt,
  refreshing,
  onRefresh,
}: {
  refreshedAt: Date;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="share-refresh-row">
      <p>
        Last refreshed:{" "}
        <time dateTime={refreshedAt.toISOString()}>
          {formatRefreshTime(refreshedAt)}
        </time>
      </p>
      <button type="button" onClick={onRefresh} disabled={refreshing}>
        <Icon name="refresh" size={17} />
        {refreshing ? "Refreshing…" : "Refresh status"}
      </button>
    </div>
  );
}

function JourneyPrivacyNotice() {
  return (
    <aside className="share-privacy">
      <span>
        <Icon name="shield" />
      </span>
      <p>
        <b>A missing check-in is not proof of an emergency.</b>This page shows
        only the information the traveler has chosen to share. Location is only
        shown when explicitly shared and expires automatically.
      </p>
    </aside>
  );
}

function JourneyShareSkeleton() {
  return (
    <SharePage>
      <JourneyShareHeader />
      <main
        className="share-receipt share-skeleton-wrap"
        aria-label="Loading Journey update"
        aria-busy="true"
      >
        <SharedJourneyBadge />
        <div className="share-skeleton heading" />
        <div className="share-skeleton route" />
        <div className="share-skeleton status" />
        <div className="share-skeleton timeline" />
        <div className="share-skeleton meta" />
        <div className="share-skeleton checkin" />
        <div className="share-skeleton action" />
        <div className="share-skeleton privacy" />
      </main>
      <footer className="share-footer">
        <span>People look out for people.</span>
      </footer>
    </SharePage>
  );
}

function JourneyUnavailableState() {
  return (
    <SharePage>
      <JourneyShareHeader />
      <main className="share-unavailable">
        <span className="share-broken-link">
          <Icon name="link" size={45} />
          <i />
        </span>
        <h1>Journey link unavailable</h1>
        <p>
          This journey share has expired, been revoked, or is no longer
          available.
        </p>
        <p>
          For privacy, Kopa-Padi cannot display any previous journey
          information.
        </p>
        <Link href="/#safety">Learn more about journey sharing</Link>
      </main>
      <footer className="share-footer">
        <Brand footer />
      </footer>
    </SharePage>
  );
}

function SharePage({ children }: { children: ReactNode }) {
  return (
    <div className="share-page">
      <div className="share-contours" aria-hidden="true" />
      {children}
      <div className="share-landscape" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}

export function JourneyShareView({ token }: { token: string }) {
  const [data, setData] = useState<Shared | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  const load = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      try {
        const shared = await api<Shared>(
          `/journey-share/${encodeURIComponent(token)}`,
        );
        setData(shared);
        setRefreshedAt(new Date());
        setUnavailable(false);
        setRefreshError("");
      } catch {
        if (refresh)
          setRefreshError(
            "Couldn’t refresh right now. The previous update is still shown.",
          );
        else setUnavailable(true);
      } finally {
        setRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void load();
  }, [load]);
  if (unavailable) return <JourneyUnavailableState />;
  if (!data || !refreshedAt) return <JourneyShareSkeleton />;

  return (
    <SharePage>
      <JourneyShareHeader />
      <main className="share-receipt">
        <SharedJourneyBadge />
        <TravelerJourneyHeading data={data} />
        <JourneyRoute destination={data.destination} />
        <JourneyStatusCard data={data} />
        <JourneyTimeline data={data} />
        <JourneyMetaCards expectedArrivalAt={data.expectedArrivalAt} />
        <LatestCheckIn data={data} />
        <AttentionNotice data={data} />
        <CompletionNotice status={data.status} />
        <TemporaryLocationAction data={data} />
        <RefreshRow
          refreshedAt={refreshedAt}
          refreshing={refreshing}
          onRefresh={() => void load(true)}
        />
        {refreshError ? (
          <p className="share-refresh-error" role="alert">
            {refreshError}
          </p>
        ) : null}
        <JourneyPrivacyNotice />
      </main>
      <footer className="share-footer">
        <Brand footer />
      </footer>
    </SharePage>
  );
}
