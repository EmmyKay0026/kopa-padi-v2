"use client";
import { api } from "@/lib/api";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Summary = {
  api: string;
  database: string;
  verifiedUsers: number;
  matchingBacklog: number;
  activeJourneys: number;
  pendingDomainJobs: number;
  failedEmails: number;
  openSafetyReports: number;
};
type Metrics = {
  registered_users: number;
  verified_pcms: number;
  travel_plans: number;
  matched_plans: number;
  circles_formed: number;
  ready_circles: number;
  average_circle_size: string | number;
  journeys_started: number;
  solo_journeys: number;
  safe_arrivals: number;
  trusted_contact_users: number;
  published_guides: number;
  guided_journeys: number;
  guide_feedback: number;
  helpful_guide_feedback: number;
  safety_reports: number;
  journey_checkins: number;
  average_seconds_to_first_match: string | number;
  nearby_lga_match_attempts: number;
};
const num = (value: number | string | undefined) => Number(value ?? 0);
const pct = (a: number | string, b: number | string) => {
  const d = num(b);
  return d ? Math.round((num(a) / d) * 100) : 0;
};
const navigation = [
  "Dashboard",
  "Users",
  "Verifications",
  "Matches",
  "Travel Plans",
  "Geography",
  "Journey Guides",
  "Operations",
  "Reports",
  "Safety",
  "Content",
  "Audit Logs",
  "Settings",
];
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-56 border-r border-border bg-surface p-5 lg:flex lg:flex-col">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-xs font-black text-white">
            KP
          </span>
          <span>
            <b className="block">Kopa-Padi</b>
            <small className="text-[8px] text-muted">Admin</small>
          </span>
        </Link>
        <nav className="mt-7 space-y-1" aria-label="Admin navigation">
          {navigation.map((label) => (
            <Link
              key={label}
              href={label === "Operations" ? "/admin/operations" : "#"}
              aria-current={label === "Operations" ? "page" : undefined}
              className={`flex min-h-10 items-center rounded-xl px-3 text-xs font-bold ${label === "Operations" ? "bg-primary/10 text-primary" : "text-muted hover:bg-background hover:text-foreground"}`}
            >
              ◇ &nbsp; {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-56">
        <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-5 lg:hidden">
          <b className="text-primary">
            ← &nbsp; Kopa-Padi <small className="text-muted">Admin</small>
          </b>
          <button aria-label="Menu">☷</button>
        </header>
        {children}
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-border bg-white py-2 lg:hidden">
          <Link
            className="grid min-h-11 place-items-center text-[10px] text-muted"
            href="/admin/operations"
          >
            Home
          </Link>
          <Link
            className="grid min-h-11 place-items-center text-[10px] font-bold text-primary"
            href="/admin/operations"
          >
            Operations
          </Link>
          <Link
            className="grid min-h-11 place-items-center text-[10px] text-muted"
            href="#"
          >
            More
          </Link>
        </nav>
      </div>
    </div>
  );
}
function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-border bg-surface p-4 shadow-[0_5px_22px_rgba(15,118,110,.04)] ${className}`}
    >
      {children}
    </section>
  );
}
function SectionTitle({
  title,
  copy,
  action,
}: {
  title: string;
  copy: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-3 flex items-start justify-between gap-3">
      <div>
        <h2 className="font-black tracking-[-.02em]">{title}</h2>
        <p className="mt-1 text-[10px] text-muted">{copy}</p>
      </div>
      {action}
    </header>
  );
}
function Info({ text }: { text: string }) {
  return (
    <span
      title={text}
      tabIndex={0}
      aria-label={text}
      className="ml-1 inline-grid h-4 w-4 cursor-help place-items-center rounded-full border text-[9px] text-muted"
    >
      i
    </span>
  );
}
function ValueCard({
  icon,
  label,
  value,
  copy,
  tone = "teal",
  info,
}: {
  icon: string;
  label: string;
  value: number | string;
  copy: string;
  tone?: "teal" | "amber" | "red" | "green";
  info?: string;
}) {
  const tones = {
    teal: "bg-primary-light/35 text-primary",
    amber: "bg-warning/10 text-amber-700",
    red: "bg-danger/8 text-danger",
    green: "bg-success/10 text-success",
  };
  return (
    <Card>
      <div className="flex gap-3">
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl ${tones[tone]}`}
        >
          {icon}
        </span>
        <div>
          <p className="text-2xl font-black tracking-[-.04em]">{value}</p>
          <h3 className="mt-1 text-xs font-black">
            {label}
            <Info text={info ?? copy} />
          </h3>
          <p className="mt-1 text-[10px] leading-4 text-muted">{copy}</p>
        </div>
      </div>
    </Card>
  );
}
function RatioCard({
  icon,
  title,
  left,
  right,
  leftLabel,
  rightLabel,
}: {
  icon: string;
  title: string;
  left: number | string;
  right: number | string;
  leftLabel: string;
  rightLabel: string;
}) {
  const percent = pct(right, left);
  return (
    <Card>
      <div className="flex items-center gap-2 text-primary">
        <span>{icon}</span>
        <h3 className="text-xs font-black text-foreground">{title}</h3>
      </div>
      <p className="mt-5 text-2xl font-black tracking-[-.04em]">
        {left} / {right}
      </p>
      <p className="text-[10px] text-muted">
        {leftLabel} / {rightLabel}
      </p>
      <div className="mt-4 flex items-center gap-3">
        <span className="h-2 flex-1 overflow-hidden rounded-full bg-primary-light">
          <i
            className="block h-full rounded-full bg-primary"
            style={{ width: `${Math.min(100, percent)}%` }}
          />
        </span>
        <b className="text-[10px] text-primary">{percent}%</b>
      </div>
    </Card>
  );
}
function ErrorState({ retry }: { retry: () => void }) {
  return (
    <Card className="border-danger/20 bg-danger/5">
      <p role="alert" className="text-xs font-bold text-danger">
        We couldn&apos;t load this section.
      </p>
      <button onClick={retry} className="mt-3 text-xs font-bold text-primary">
        Try again
      </button>
    </Card>
  );
}
function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-24 rounded-xl bg-slate-100" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-32 rounded-xl bg-slate-100" />
        <div className="h-32 rounded-xl bg-slate-100" />
      </div>
      <div className="h-64 rounded-xl bg-slate-100" />
    </div>
  );
}

export function OperationsDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null),
    [metrics, setMetrics] = useState<Metrics | null>(null),
    [summaryError, setSummaryError] = useState(false),
    [metricsError, setMetricsError] = useState(false),
    [initial, setInitial] = useState(true),
    [refreshing, setRefreshing] = useState(false),
    [updated, setUpdated] = useState<Date | null>(null),
    [toast, setToast] = useState<string | null>(null);
  const loadSummary = useCallback(async () => {
    try {
      setSummary(await api<Summary>("/admin/operations/summary"));
      setSummaryError(false);
      return true;
    } catch {
      setSummaryError(true);
      return false;
    }
  }, []);
  const loadMetrics = useCallback(async () => {
    try {
      setMetrics(await api<Metrics>("/admin/operations/metrics"));
      setMetricsError(false);
      return true;
    } catch {
      setMetricsError(true);
      return false;
    }
  }, []);
  const refresh = useCallback(
    async (first = false) => {
      if (!first) setRefreshing(true);
      const [s, m] = await Promise.all([loadSummary(), loadMetrics()]);
      if (s || m) setUpdated(new Date());
      if (!first)
        setToast(
          s && m
            ? "Operations data refreshed"
            : "Some operations data could not be refreshed.",
        );
      setInitial(false);
      setRefreshing(false);
    },
    [loadSummary, loadMetrics],
  );
  useEffect(() => {
    void refresh(true);
  }, [refresh]);
  const time = updated
    ? new Intl.DateTimeFormat("en-NG", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(updated)
    : "—";
  return (
    <Shell>
      <main className="mx-auto max-w-[1500px] p-4 pb-28 sm:p-6 lg:p-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-black tracking-[-.045em]">
              Pilot Operations
            </h1>
            <p className="mt-1 text-xs text-muted">
              Capability-protected health, backlog, notification, and safety
              indicators.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 text-[10px] sm:items-end">
            <p className="text-muted">
              Last updated: {time}{" "}
              <span className="ml-2 font-bold text-success">● Live data</span>
            </p>
            <button
              onClick={() => void refresh()}
              disabled={refreshing}
              className="btn-primary min-h-11 gap-2 px-5 text-xs"
            >
              {refreshing ? (
                <>
                  <span className="auth-spinner" /> Refreshing...
                </>
              ) : (
                <>↻ &nbsp; Refresh status</>
              )}
            </button>
          </div>
        </header>
        {initial ? (
          <div className="mt-6">
            <Skeleton />
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <section className="grid gap-4 xl:grid-cols-[.95fr_1.05fr]">
              <Card>
                {summary ? (
                  <>
                    <SectionTitle
                      title="System health"
                      copy="Key platform services"
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Health
                        label="API"
                        status={summary.api}
                        copy="Application is responding normally."
                      />
                      <Health
                        label="Database"
                        status={summary.database}
                        copy="Database is reachable and responding."
                      />
                    </div>
                  </>
                ) : summaryError ? (
                  <ErrorState retry={() => void loadSummary()} />
                ) : null}
              </Card>
              <Card className="border-warning/25 bg-warning/[.035]">
                <SectionTitle
                  title="Attention required"
                  copy="Items that may need human review."
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  {summary ? (
                    <>
                      <ValueCard
                        icon="✉"
                        label="Failed emails"
                        value={summary.failedEmails}
                        copy={
                          summary.failedEmails
                            ? "Notifications that were not successfully sent."
                            : "No failed email deliveries."
                        }
                        tone="amber"
                      />
                      <ValueCard
                        icon="⚠"
                        label="Open safety reports"
                        value={summary.openSafetyReports}
                        copy={
                          summary.openSafetyReports
                            ? "Reports awaiting resolution."
                            : "No open safety reports."
                        }
                        tone="amber"
                      />
                    </>
                  ) : summaryError ? (
                    <ErrorState retry={() => void loadSummary()} />
                  ) : null}
                </div>
              </Card>
            </section>
            {summary ? (
              <section className="grid gap-4 xl:grid-cols-2">
                <Card>
                  <SectionTitle
                    title="Pilot activity"
                    copy="Current platform activity"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ValueCard
                      icon="♟"
                      label="Verified PCMs"
                      value={summary.verifiedUsers}
                      copy="Applicants who have completed verification."
                    />
                    <ValueCard
                      icon="▣"
                      label="Active journeys"
                      value={summary.activeJourneys}
                      copy="Journeys in progress or needing attention."
                      info="Journeys currently in IN_PROGRESS or NEEDS_ATTENTION."
                    />
                  </div>
                </Card>
                <Card>
                  <SectionTitle
                    title="Operational backlogs"
                    copy="Queues and items that may require monitoring."
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ValueCard
                      icon="▧"
                      label="Searching plans"
                      value={summary.matchingBacklog}
                      copy={
                        summary.matchingBacklog
                          ? "Travel Plans currently in SEARCHING status."
                          : "No travel plans are waiting for matching."
                      }
                    />
                    <ValueCard
                      icon="▤"
                      label="Pending domain events"
                      value={summary.pendingDomainJobs}
                      copy={
                        summary.pendingDomainJobs
                          ? "Internal events that have not yet been processed."
                          : "No pending domain events."
                      }
                    />
                  </div>
                </Card>
              </section>
            ) : null}
            <Card>
              {metrics ? (
                <>
                  <SectionTitle
                    title="Pilot outcomes"
                    copy="Key indicators for the Kopa-Padi pilot."
                    action={
                      <span className="rounded-lg bg-background px-3 py-2 text-[9px] text-muted">
                        Current totals from live system
                      </span>
                    }
                  />
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <RatioCard
                      icon="♟"
                      title="Registration & verification"
                      left={metrics.registered_users}
                      right={metrics.verified_pcms}
                      leftLabel="Registered users"
                      rightLabel="Verified PCMs"
                    />
                    <RatioCard
                      icon="▧"
                      title="Travel plans & matches"
                      left={metrics.travel_plans}
                      right={metrics.matched_plans}
                      leftLabel="Travel plans"
                      rightLabel="Matched plans"
                    />
                    <Card>
                      <div className="flex gap-2 text-primary">
                        ♟{" "}
                        <h3 className="text-xs font-black text-foreground">
                          Travel circles
                        </h3>
                      </div>
                      <p className="mt-5 text-2xl font-black">
                        {metrics.circles_formed}
                      </p>
                      <p className="text-[10px] text-muted">
                        Total circles formed
                      </p>
                      <div className="mt-4 grid grid-cols-2 divide-x text-center text-xs">
                        <p>
                          <b className="block text-base">
                            {metrics.ready_circles}
                          </b>
                          Ready circles
                        </p>
                        <p>
                          <b className="block text-base">
                            {metrics.average_circle_size}
                          </b>
                          Average size
                        </p>
                      </div>
                    </Card>
                    <Card>
                      <div className="flex gap-2 text-primary">
                        ▣{" "}
                        <h3 className="text-xs font-black text-foreground">
                          Journey outcomes
                        </h3>
                      </div>
                      <div className="mt-7 grid grid-cols-3 divide-x text-center text-xs">
                        {[
                          [metrics.journeys_started, "Journeys started"],
                          [metrics.solo_journeys, "Solo journeys"],
                          [metrics.safe_arrivals, "Safe arrivals"],
                        ].map(([v, l]) => (
                          <p key={String(l)}>
                            <b className="block text-lg">{v}</b>
                            <span className="text-[9px] text-muted">{l}</span>
                          </p>
                        ))}
                      </div>
                    </Card>
                    <ValueCard
                      icon="♢"
                      label="Trusted contacts"
                      value={metrics.trusted_contact_users}
                      copy="Users with active trusted contacts. Safety adoption indicator."
                    />
                    <Card>
                      <div className="flex gap-2 text-primary">
                        ▤{" "}
                        <h3 className="text-xs font-black text-foreground">
                          Journey guides
                        </h3>
                      </div>
                      <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                        {[
                          [metrics.published_guides, "Published guides"],
                          [metrics.guided_journeys, "Guided journeys"],
                          [metrics.helpful_guide_feedback, "Helpful feedback"],
                          [metrics.guide_feedback, "Total feedback"],
                        ].map(([v, l]) => (
                          <p key={String(l)}>
                            <b className="block text-lg">{v}</b>
                            <span className="text-[9px] text-muted">{l}</span>
                          </p>
                        ))}
                      </div>
                    </Card>
                    <ValueCard
                      icon="⚠"
                      label="Safety reports"
                      value={metrics.safety_reports}
                      copy="All reports ever created."
                      tone="amber"
                    />
                    <Card>
                      <div className="flex gap-2 text-primary">
                        ▥{" "}
                        <h3 className="text-xs font-black text-foreground">
                          Matching performance
                        </h3>
                      </div>
                      <div className="mt-5 grid grid-cols-2 divide-x text-center text-xs">
                        <p>
                          <b className="block text-xl">
                            {num(metrics.average_seconds_to_first_match)}s
                          </b>
                          <span className="text-[9px] text-muted">
                            Average time to first match
                          </span>
                        </p>
                        <p>
                          <b className="block text-xl">
                            {metrics.nearby_lga_match_attempts}
                          </b>
                          <span className="text-[9px] text-muted">
                            Nearby-LGA match attempts
                          </span>
                        </p>
                      </div>
                    </Card>
                    <ValueCard
                      icon="✓"
                      label="Journey check-ins"
                      value={metrics.journey_checkins}
                      copy="Non-started and non-arrived check-ins recorded during journeys."
                    />
                  </div>
                  <section className="mt-5 rounded-xl border border-primary/15 bg-primary-light/15 p-4">
                    <h3 className="text-xs font-black">Pilot progression</h3>
                    <p className="mt-1 text-[10px] text-muted">
                      Current snapshot totals; this is not a cohort conversion
                      or trend chart.
                    </p>
                    <ol className="mt-4 grid gap-2 text-center text-[10px] font-bold sm:grid-cols-7">
                      {[
                        [metrics.registered_users, "Registered"],
                        [metrics.verified_pcms, "Verified"],
                        [metrics.travel_plans, "Plans"],
                        [metrics.matched_plans, "Matched"],
                        [metrics.circles_formed, "Circles"],
                        [metrics.journeys_started, "Started"],
                        [metrics.safe_arrivals, "Safe arrivals"],
                      ].map(([v, l], i) => (
                        <li
                          key={String(l)}
                          className="flex items-center gap-2 sm:block"
                        >
                          <b className="grid h-9 min-w-12 place-items-center rounded-lg bg-white text-sm text-primary">
                            {v}
                          </b>
                          <span className="sm:mt-2 sm:block">{l}</span>
                          {i < 6 && (
                            <i className="hidden text-primary sm:block">→</i>
                          )}
                        </li>
                      ))}
                    </ol>
                  </section>
                </>
              ) : metricsError ? (
                <ErrorState retry={() => void loadMetrics()} />
              ) : null}
            </Card>
            {summary && (
              <Card>
                <SectionTitle
                  title="System information"
                  copy="Supporting operational details"
                />
                <div className="grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
                  <InfoRow icon="⌘" label="Environment" value="Production" />
                  <InfoRow icon="◷" label="Last refreshed" value={time} />
                  <InfoRow
                    icon="♢"
                    label="Access"
                    value="Capability protected"
                  />
                </div>
              </Card>
            )}
          </div>
        )}
        {toast && (
          <div
            role="status"
            className={`fixed bottom-6 right-5 z-50 rounded-xl border bg-white p-4 text-xs font-bold shadow-xl ${toast.includes("could") ? "border-danger/20 text-danger" : "border-success/20 text-success"}`}
          >
            <button onClick={() => setToast(null)} className="ml-5">
              ×
            </button>
            {toast}
          </div>
        )}
      </main>
    </Shell>
  );
}
function Health({
  label,
  status,
  copy,
}: {
  label: string;
  status: string;
  copy: string;
}) {
  const good = /healthy|reachable/i.test(status);
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center gap-3">
        <span
          className={`h-3 w-3 rounded-full ${good ? "bg-success" : "bg-warning"}`}
        />
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-background">
          {label === "API" ? "▤" : "▣"}
        </span>
        <p>
          <b className="block text-xs">{label}</b>
          <strong className={good ? "text-success" : "text-warning"}>
            {status}
          </strong>
        </p>
      </div>
      <p className="mt-3 text-[10px] text-muted">{copy}</p>
    </div>
  );
}
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border p-3">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-light/30 text-primary">
        {icon}
      </span>
      <p>
        <b className="block text-[10px] text-muted">{label}</b>
        <span className="font-bold">{value}</span>
      </p>
    </div>
  );
}
