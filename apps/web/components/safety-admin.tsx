"use client";

import { api } from "@/lib/api";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Metrics = {
  new_reports: number;
  critical_reports: number;
  open_cases: number;
  active_restrictions: number;
  awaiting_action: number;
  suspended_users: number;
};
type Report = {
  id: string;
  reportedUserId: string | null;
  category: string;
  severity: string;
  status: string;
  createdAt: string;
};
type ReportDetail = {
  report: Report & {
    description?: string;
    reporterId?: string | null;
    contextType?: string | null;
  };
  hasMessageEvidence: boolean;
  caseLink?: { id: string; status?: string } | null;
};
const nav = [
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
const tabs = [
  "All reports",
  "New",
  "Critical",
  "Under review",
  "Resolved",
  "Dismissed",
];
const lower = (value: string) => value.toLowerCase().replaceAll("_", " ");
const display = (value: string) =>
  lower(value).replace(/\b\w/g, (c) => c.toUpperCase());
const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
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
          {nav.map((item) => (
            <Link
              key={item}
              href={
                item === "Safety"
                  ? "/admin/safety"
                  : item === "Operations"
                    ? "/admin/operations"
                    : "#"
              }
              aria-current={item === "Safety" ? "page" : undefined}
              className={`flex min-h-10 items-center rounded-xl px-3 text-xs font-bold ${item === "Safety" ? "bg-primary/10 text-primary" : "text-muted hover:bg-background hover:text-foreground"}`}
            >
              ◇ &nbsp; {item}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-56">
        <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-5 lg:hidden">
          <b className="text-primary">
            ← &nbsp; Kopa-Padi <small className="text-muted">Admin</small>
          </b>
          <button aria-label="Open menu">☷</button>
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
            href="/admin/safety"
          >
            Safety
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
      className={`rounded-card border border-border bg-surface ${className}`}
    >
      {children}
    </section>
  );
}
function Badge({ value }: { value: string }) {
  const v = lower(value);
  const tone = v.includes("critical")
    ? "bg-danger/10 text-danger"
    : v.includes("high")
      ? "bg-warning/15 text-amber-700"
      : v.includes("resolved")
        ? "bg-success/10 text-success"
        : v.includes("review")
          ? "bg-blue-50 text-blue-700"
          : v.includes("new")
            ? "bg-danger/10 text-danger"
            : "bg-background text-muted";
  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-[9px] font-black ${tone}`}
    >
      {display(value)}
    </span>
  );
}
function Metric({
  icon,
  value,
  label,
  copy,
  tone = "primary",
}: {
  icon: string;
  value: number;
  label: string;
  copy: string;
  tone?: "primary" | "danger" | "warning" | "success";
}) {
  const tones = {
    primary: "bg-primary-light/30 text-primary",
    danger: "bg-danger/10 text-danger",
    warning: "bg-warning/15 text-amber-700",
    success: "bg-success/10 text-success",
  };
  return (
    <Card className="p-3">
      <div className="flex gap-3">
        <span
          className={`grid h-11 w-11 place-items-center rounded-xl text-xl ${tones[tone]}`}
        >
          {icon}
        </span>
        <div>
          <p className="text-2xl font-black tracking-[-.04em]">{value}</p>
          <h2 className="text-xs font-black">{label}</h2>
          <p className="mt-1 text-[10px] text-muted">{copy}</p>
        </div>
      </div>
    </Card>
  );
}

export function SafetyAdmin() {
  const [metrics, setMetrics] = useState<Metrics | null>(null),
    [reports, setReports] = useState<Report[]>([]),
    [selected, setSelected] = useState<ReportDetail | null>(null),
    [search, setSearch] = useState(""),
    [tab, setTab] = useState("All reports"),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [panel, setPanel] = useState<
      "evidence" | "case" | "restriction" | "note" | null
    >(null),
    [busy, setBusy] = useState(false),
    [toast, setToast] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, rows] = await Promise.all([
        api<Metrics>("/admin/safety/dashboard"),
        api<Report[]>("/admin/safety/reports"),
      ]);
      setMetrics(m);
      setReports(rows);
      setError("");
      if (rows[0]) void open(rows[0].id);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Safety data could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  const open = useCallback(async (id: string) => {
    try {
      setSelected(await api<ReportDetail>(`/admin/safety/reports/${id}`));
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Unable to open this report.");
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const visible = useMemo(
    () =>
      reports.filter((r) => {
        const q =
          `${r.id} ${r.category} ${r.status} ${r.severity} ${r.reportedUserId ?? ""}`.toLowerCase();
        const matches = q.includes(search.toLowerCase());
        const status = lower(r.status);
        const active =
          tab === "All reports" || tab === "Critical"
            ? tab !== "Critical" || lower(r.severity) === "critical"
            : status === lower(tab);
        return matches && active;
      }),
    [reports, search, tab],
  );
  const run = async (path: string, body: unknown, success: string) => {
    setBusy(true);
    try {
      await api(path, { method: "POST", body: JSON.stringify(body) });
      setPanel(null);
      setToast(success);
      void load();
    } catch (e) {
      setToast(
        e instanceof Error ? e.message : "Action could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Shell>
      <main className="mx-auto max-w-[1600px] p-4 pb-28 sm:p-6 lg:p-8">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-[-.045em]">
              Safety Operations
            </h1>
            <p className="mt-1 text-xs text-muted">
              Review, investigate, and resolve safety reports to keep the
              Kopa-Padi community safe.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="hidden min-w-80 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-muted md:flex">
              ⌕
              <input
                className="w-full bg-transparent outline-none"
                placeholder="Search reports, users, or case IDs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <button
              className="grid h-10 w-10 place-items-center rounded-lg border border-border"
              aria-label="Notifications"
            >
              ♧
            </button>
            <button className="rounded-lg px-2 text-xs font-bold">
              A &nbsp; Admin⌄
            </button>
          </div>
        </header>
        {loading ? (
          <div className="mt-5 animate-pulse space-y-4">
            <div className="h-24 rounded-card bg-primary-light/20" />
            <div className="h-96 rounded-card bg-primary-light/20" />
          </div>
        ) : error ? (
          <Card className="mt-5 border-danger/20 bg-danger/5 p-5">
            <p role="alert" className="text-sm font-bold text-danger">
              {error}
            </p>
            <button
              className="mt-3 text-xs font-bold text-primary"
              onClick={() => void load()}
            >
              Try again
            </button>
          </Card>
        ) : (
          <>
            <section className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {metrics && (
                <>
                  <Metric
                    icon="⚠"
                    value={metrics.critical_reports}
                    label="Critical reports"
                    copy="Require immediate attention"
                    tone="danger"
                  />
                  <Metric
                    icon="◷"
                    value={metrics.new_reports}
                    label="New reports"
                    copy="Submitted in the last 24 hours"
                    tone="warning"
                  />
                  <Metric
                    icon="□"
                    value={metrics.open_cases}
                    label="Open moderation cases"
                    copy="Across all severities"
                  />
                  <Metric
                    icon="♙"
                    value={metrics.active_restrictions}
                    label="Active user restrictions"
                    copy="Users with applied restrictions"
                    tone="success"
                  />
                </>
              )}
              <Link
                href="#audit"
                className="rounded-card border border-border bg-surface p-3 hover:bg-background"
              >
                <div className="flex gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-light/30 text-xl text-primary">
                    ▤
                  </span>
                  <span>
                    <b className="block text-xs">View audit logs</b>
                    <small className="text-[10px] text-muted">
                      See recent safety actions
                    </small>
                  </span>
                </div>
              </Link>
            </section>
            <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(330px,.9fr)]">
              <Card className="overflow-hidden">
                <div className="flex overflow-x-auto border-b border-border px-3">
                  {tabs.map((item) => (
                    <button
                      key={item}
                      onClick={() => setTab(item)}
                      className={`shrink-0 border-b-2 px-4 py-4 text-[10px] font-bold ${tab === item ? "border-primary text-primary" : "border-transparent text-muted"}`}
                    >
                      {item}
                      {item === "All reports" ? ` (${reports.length})` : ""}
                    </button>
                  ))}
                </div>
                <div className="grid gap-2 border-b border-border p-3 md:grid-cols-[1.4fr_repeat(4,1fr)]">
                  <label className="flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-xs text-muted">
                    ⌕
                    <input
                      className="w-full bg-transparent outline-none"
                      placeholder="Search reports..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  {[
                    "All categories",
                    "All severities",
                    "All statuses",
                    "Newest first",
                  ].map((x) => (
                    <button
                      key={x}
                      className="min-h-10 rounded-lg border border-border px-3 text-left text-[10px] text-muted"
                    >
                      {x}⌄
                    </button>
                  ))}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead className="bg-background text-[10px] text-muted">
                      <tr>
                        {[
                          "",
                          "#",
                          "Category",
                          "Severity",
                          "Status",
                          "Reported user / context",
                          "Submitted",
                          "Actions",
                        ].map((x) => (
                          <th
                            className="whitespace-nowrap px-3 py-3 font-bold"
                            key={x}
                          >
                            {x || "□"}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visible.slice(0, 10).map((report) => (
                        <tr
                          key={report.id}
                          className={`border-t border-border text-[11px] ${selected?.report.id === report.id ? "bg-primary-light/10" : ""}`}
                        >
                          <td className="px-3 py-3">□</td>
                          <td className="px-3 py-3 font-bold text-primary">
                            #{report.id.slice(-4)}
                          </td>
                          <td className="px-3 py-3 font-bold">
                            ◌ &nbsp;{display(report.category)}
                          </td>
                          <td className="px-3 py-3">
                            <Badge value={report.severity} />
                          </td>
                          <td className="px-3 py-3">
                            <Badge value={report.status} />
                          </td>
                          <td className="px-3 py-3">
                            <b className="block">
                              {report.reportedUserId
                                ? `User ${report.reportedUserId.slice(-6)}`
                                : "User hidden"}
                            </b>
                            <small className="text-[9px] text-muted">
                              Reported via safety flow
                            </small>
                          </td>
                          <td className="px-3 py-3 text-muted">
                            <time dateTime={report.createdAt}>
                              {formatDate(report.createdAt)}
                            </time>
                          </td>
                          <td className="px-3 py-3">
                            <button
                              onClick={() => void open(report.id)}
                              className="rounded-lg border border-border px-3 py-2 text-[10px] font-bold text-primary"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <footer className="flex items-center justify-between p-4 text-[10px] text-muted">
                  <span>
                    Showing 1–{Math.min(10, visible.length)} of {visible.length}
                  </span>
                  <span className="font-bold text-primary">
                    ‹ &nbsp; 1 &nbsp; 2 &nbsp; 3 &nbsp; ›
                  </span>
                </footer>
              </Card>
              <ReportPanel
                selected={selected}
                onPanel={setPanel}
                onUnderReview={() =>
                  selected &&
                  void run(
                    `/admin/safety/reports/${selected.report.id}/triage`,
                    {
                      status: "UNDER_REVIEW",
                      severity: selected.report.severity,
                    },
                    "Report moved to under review.",
                  )
                }
              />
            </section>
          </>
        )}
        {panel && selected && (
          <ActionPanel
            kind={panel}
            report={selected}
            busy={busy}
            close={() => setPanel(null)}
            submit={run}
          />
        )}{" "}
        {toast && (
          <div
            role="status"
            className="fixed bottom-6 right-5 z-50 max-w-sm rounded-xl border border-primary/20 bg-surface p-4 text-xs font-bold shadow-xl"
          >
            <button
              className="float-right ml-4"
              onClick={() => setToast(null)}
              aria-label="Dismiss"
            >
              ×
            </button>
            {toast}
          </div>
        )}
      </main>
    </Shell>
  );
}
function ReportPanel({
  selected,
  onPanel,
  onUnderReview,
}: {
  selected: ReportDetail | null;
  onPanel: (v: "evidence" | "case" | "restriction" | "note") => void;
  onUnderReview: () => void;
}) {
  if (!selected)
    return (
      <Card className="grid min-h-96 place-items-center p-6 text-center">
        <div>
          <span className="text-3xl">◌</span>
          <h2 className="mt-3 font-black">Select a report</h2>
          <p className="mt-1 text-xs text-muted">
            Choose a report to review its details and safety actions.
          </p>
        </div>
      </Card>
    );
  const r = selected.report;
  return (
    <Card className="overflow-hidden">
      <header className="flex items-center justify-between border-b border-border p-4">
        <div>
          <h2 className="text-xl font-black">Report #{r.id.slice(-4)}</h2>
          <div className="mt-2">
            <Badge value={r.severity} />
          </div>
        </div>
        <span className="text-muted">×</span>
      </header>
      <nav className="flex border-b border-border text-[10px] font-bold text-muted">
        <button className="border-b-2 border-primary px-4 py-3 text-primary">
          Overview
        </button>
        {["Evidence", "Case", "Notes", "History"].map((x) => (
          <button key={x} className="px-3 py-3">
            {x}
          </button>
        ))}
      </nav>
      <div className="space-y-3 p-4">
        <section className="rounded-xl border border-border p-3">
          <h3 className="text-xs font-black">Report summary</h3>
          <dl className="mt-3 grid grid-cols-[112px_1fr] gap-y-2 text-[10px]">
            <dt className="text-muted">Category</dt>
            <dd className="font-bold">◌ &nbsp;{display(r.category)}</dd>
            <dt className="text-muted">Severity</dt>
            <dd>
              <Badge value={r.severity} />
            </dd>
            <dt className="text-muted">Status</dt>
            <dd>
              <Badge value={r.status} />
            </dd>
            <dt className="text-muted">Submitted</dt>
            <dd className="font-bold">{formatDate(r.createdAt)}</dd>
            <dt className="text-muted">Reported user</dt>
            <dd className="font-bold">
              {r.reportedUserId
                ? `User ${r.reportedUserId.slice(-6)}`
                : "User hidden"}
            </dd>
            <dt className="text-muted">Context</dt>
            <dd className="font-bold">{r.contextType ?? "Safety report"}</dd>
          </dl>
          {r.description && (
            <blockquote className="mt-3 rounded-lg bg-background p-3 text-[10px] leading-4 text-muted">
              “{r.description}”
            </blockquote>
          )}
        </section>
        <section className="rounded-xl border border-border p-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black">Linked case</h3>
              <p className="mt-1 text-[10px] text-muted">
                {selected.caseLink
                  ? `Case ${selected.caseLink.id}`
                  : "No case yet"}
              </p>
            </div>
            {!selected.caseLink && (
              <button
                className="btn-primary min-h-9 px-3 text-[10px]"
                onClick={() => onPanel("case")}
              >
                ＋ Create case
              </button>
            )}
          </div>
        </section>
        <section className="rounded-xl border border-border p-3">
          <h3 className="text-xs font-black">Quick actions</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <button
              onClick={onUnderReview}
              className="min-h-10 rounded-lg bg-blue-600 px-2 text-[10px] font-bold text-white"
            >
              ◉ Mark as under review
            </button>
            <button
              onClick={() => onPanel("case")}
              className="min-h-10 rounded-lg border border-border px-2 text-[10px] font-bold"
            >
              ▤ Create case
            </button>
            <button
              onClick={() => onPanel("note")}
              className="min-h-10 rounded-lg border border-border px-2 text-[10px] font-bold"
            >
              Add note
            </button>
          </div>
          {selected.hasMessageEvidence && (
            <button
              onClick={() => onPanel("evidence")}
              className="mt-2 text-[10px] font-bold text-primary"
            >
              Review authorised message evidence →
            </button>
          )}
        </section>
        <section className="rounded-xl border border-danger/20 bg-danger/5 p-3">
          <h3 className="text-xs font-black text-danger">
            ⚠ Priority guidance
          </h3>
          <p className="mt-2 text-[10px] leading-4 text-danger">
            Review critical reports as soon as possible and follow established
            safety procedures.
          </p>
          <button
            onClick={() => onPanel("restriction")}
            className="mt-3 text-[10px] font-bold text-danger"
          >
            Apply a restriction →
          </button>
        </section>
      </div>
    </Card>
  );
}
function ActionPanel({
  kind,
  report,
  busy,
  close,
  submit,
}: {
  kind: "evidence" | "case" | "restriction" | "note";
  report: ReportDetail;
  busy: boolean;
  close: () => void;
  submit: (path: string, body: unknown, success: string) => Promise<void>;
}) {
  const [id, setId] = useState("");
  const [note, setNote] = useState("");
  const r = report.report;
  const title = {
    evidence: "Evidence viewer",
    case: "Create moderation case",
    restriction: "Apply restriction",
    note: "Add internal note",
  }[kind];
  const action = () => {
    if (kind === "note" && report.caseLink)
      return submit(
        `/admin/safety/cases/${report.caseLink.id}/notes`,
        { note },
        "Internal note saved.",
      );
    if (kind === "case")
      return submit(
        `/admin/safety/reports/${r.id}/triage`,
        { status: "TRIAGED", severity: r.severity, openCase: true },
        "Moderation case created.",
      );
    if (kind === "restriction" && r.reportedUserId)
      return submit(
        `/admin/safety/users/${r.reportedUserId}/restrictions`,
        { type: id || "SUSPEND", reason: note || "Safety review" },
        "Restriction applied and logged.",
      );
    return Promise.resolve();
  };
  return (
    <div className="fixed inset-0 z-40 grid items-end bg-foreground/20 p-3 sm:place-items-center">
      <Card className="w-full max-w-lg p-5 shadow-soft">
        <header className="flex items-center justify-between">
          <h2 className="font-black">{title}</h2>
          <button onClick={close} aria-label="Close">
            ×
          </button>
        </header>
        {kind === "evidence" ? (
          <div className="mt-4">
            <div className="rounded-xl bg-background p-4 text-xs">
              <b className="block">Evidence access is controlled</b>
              <p className="mt-2 text-muted">
                Sensitive message evidence can only be requested by authorised
                moderators. Access is logged in the audit trail.
              </p>
            </div>
            <button
              className="btn-primary mt-4 min-h-11 w-full"
              onClick={close}
            >
              Close
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-muted">
              {kind === "restriction"
                ? "This action affects the reported account and will be logged. Confirm the restriction type before continuing."
                : kind === "note"
                  ? "Notes are internal only and are never visible to the reported user."
                  : "Create a case to coordinate investigation, findings, and restricted actions."}
            </p>
            {kind === "restriction" && (
              <>
                <label className="block text-xs font-bold">
                  Restriction type
                  <select
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-surface p-3 text-xs"
                  >
                    <option value="">Select restriction type</option>
                    <option value="SUSPEND">Suspend account</option>
                    <option value="BLOCK_MATCHING">Block matching</option>
                    <option value="BLOCK_TRAVEL_PLAN">
                      Block travel plans
                    </option>
                    <option value="FORCE_VERIFICATION_REVIEW">
                      Require verification review
                    </option>
                  </select>
                </label>
              </>
            )}
            <label className="block text-xs font-bold">
              {kind === "note" ? "Note" : "Internal notes (optional)"}
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="mt-1 min-h-28 w-full rounded-lg border border-border bg-surface p-3 text-xs"
                placeholder="Add an internal note..."
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={close}
                className="min-h-11 rounded-lg border border-border text-xs font-bold"
              >
                Cancel
              </button>
              <button
                disabled={busy || (kind === "restriction" && !id)}
                onClick={() => void action()}
                className={`min-h-11 rounded-lg text-xs font-bold text-white ${kind === "restriction" ? "bg-danger" : "bg-primary"}`}
              >
                {busy
                  ? "Saving..."
                  : kind === "restriction"
                    ? "Apply restriction"
                    : kind === "note"
                      ? "Save note"
                      : "Create case"}
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
