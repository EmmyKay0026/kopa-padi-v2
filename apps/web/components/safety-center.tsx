"use client";
import { AppIcon, type AppIconName } from "./app-icon";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { UserSidebar } from "./user-sidebar";

type Report = {
  id: string;
  category: string;
  status: string;
  createdAt: string;
};
type Block = { blockedUserId: string; createdAt: string };
type Member = {
  userId: string;
  displayName: string | null;
  verificationStatus: string;
};
type Circle = { membership: { userId: string }; members: Member[] } | null;
type DialogState =
  { kind: "report" } | { kind: "unblock"; block: Block; label: string } | null;
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
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase() || "KP";
const human = (value: string) =>
  value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (x) => x.toUpperCase());
const statusLabel: Record<string, string> = {
  SUBMITTED: "Submitted",
  TRIAGED: "Being assessed",
  UNDER_REVIEW: "Under review",
  ACTION_TAKEN: "Action taken",
  RESOLVED: "Resolved",
  DISMISSED: "Closed",
  DUPLICATE: "Merged with another report",
};
const categories = [
  ["HARASSMENT", "Harassment", "Unwanted, abusive, or degrading behaviour."],
  ["MONEY_REQUEST", "Money request", "Pressure or requests to send money."],
  ["SCAM", "Scam", "Suspicious offers, payments, or dishonest activity."],
  [
    "UNSAFE_MEETUP",
    "Unsafe meetup",
    "A meetup location or plan that felt unsafe.",
  ],
  [
    "IDENTITY_CONCERN",
    "Identity concern",
    "Information that may not match the traveler’s identity.",
  ],
  [
    "THREATENING_BEHAVIOUR",
    "Threatening behaviour",
    "Threats, intimidation, or language that makes you feel unsafe.",
  ],
  ["SPAM", "Spam", "Repeated irrelevant or unwanted messages."],
  [
    "STALKING_OR_PROBING",
    "Stalking or probing",
    "Persistent attempts to obtain private information or follow you.",
  ],
  ["IMPERSONATION", "Impersonation", "Pretending to be another person."],
  ["OTHER", "Other", "A concern that does not fit another category."],
] as const;
const nav: [IconName, string, string][] = [
  ["home", "Dashboard", "/app"],
  ["trip", "My Trips", "/travel-plans"],
  ["match", "Matches", "/matching"],
  ["circle", "Travel Circle", "/circle"],
  ["message", "Messages", "/circle#circle-chat"],
  ["journey", "Journey Safety", "/journey"],
  ["shield", "Safety Centre", "/safety"],
  ["profile", "Profile", "/verification"],
];
function Brand() {
  return (
    <Link href="/app" className="flex items-center gap-2.5 text-foreground">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-xs font-black text-white">
        KP
      </span>
      <span>
        <b className="block text-[15px] leading-none">Kopa-Padi</b>
        <small className="mt-1 block text-[8px] text-muted">
          Travel together. Go further.
        </small>
      </span>
    </Link>
  );
}
function Shell({
  children,
  name,
}: {
  children: React.ReactNode;
  name: string;
}) {
  return (
    <div className="safety-app min-h-screen bg-background text-foreground">
      <UserSidebar active="Safety Centre" />
      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b bg-white/95 px-4 backdrop-blur lg:hidden">
          <Brand />
          <button
            className="grid h-11 w-11 place-items-center rounded-xl"
            aria-label="Open navigation"
          >
            <Icon name="menu" />
          </button>
        </header>
        <header className="hidden h-[72px] items-center justify-end gap-4 border-b bg-white px-8 lg:flex">
          <button
            aria-label="Notifications"
            className="grid h-10 w-10 place-items-center rounded-full text-slate-600"
          >
            <Icon name="bell" />
          </button>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-200 text-[10px] font-black text-slate-700">
            {initials(name)}
          </span>
          <b className="text-xs">{name.split(/\s+/)[0]}</b>
        </header>
        {children}
        <nav
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-white/95 px-2 pb-2 pt-1.5 backdrop-blur lg:hidden"
          aria-label="Mobile navigation"
        >
          {nav.slice(0, 5).map(([icon, label, href]) => (
            <Link
              key={label}
              href={href}
              className="flex min-h-12 flex-col items-center justify-center gap-1 text-[9px] font-bold text-muted"
            >
              <Icon name={icon} size={18} />
              {label.replace("My ", "").replace("Travel ", "")}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
function Panel({
  title,
  copy,
  icon,
  children,
  className = "",
}: {
  title: string;
  copy?: string;
  icon: IconName;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={
        "rounded-[18px] border bg-white p-5 shadow-[0_12px_35px_rgba(15,118,110,.055)] " +
        className
      }
    >
      <header className="flex items-start gap-3">
        <span className="mt-0.5 text-slate-700">
          <Icon name={icon} />
        </span>
        <div>
          <h2 className="text-[15px] font-black tracking-[-.02em]">{title}</h2>
          {copy ? <p className="mt-1 text-[10px] text-muted">{copy}</p> : null}
        </div>
      </header>
      {children}
    </section>
  );
}
function Danger() {
  return (
    <section className="safety-delay-one flex flex-col gap-4 rounded-[15px] border border-danger/25 bg-danger/5 p-4 sm:flex-row sm:items-center">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-danger">
        <Icon name="alert" size={26} />
      </span>
      <div className="flex-1">
        <h2 className="text-sm font-black">Are you in immediate danger?</h2>
        <p className="mt-1 text-[10px] leading-5 text-slate-600">
          Kopa-Padi reporting is not an emergency service. If you are in
          immediate danger, contact the appropriate local emergency service
          first.
        </p>
      </div>
      <a
        href="tel:112"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border bg-white px-4 text-xs font-bold text-slate-800 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-danger"
      >
        Call 112 <Icon name="arrow" size={15} />
      </a>
    </section>
  );
}
function PrivacySummary({ hasContext }: { hasContext: boolean }) {
  return (
    <div className="mt-5 rounded-xl bg-slate-50 p-4">
      <h3 className="flex items-center gap-2 text-[11px] font-black">
        <Icon name="document" size={17} />
        What will be submitted
      </h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-[9px] leading-4 text-muted">
        <li>Selected traveler’s account ID</li>
        <li>Your report category and the details you entered</li>
        {hasContext ? (
          <li>Relevant Circle, message, meetup, or journey context</li>
        ) : null}
      </ul>
    </div>
  );
}
function ReportForm({
  members,
  loading,
  onConfirm,
}: {
  members: Member[];
  loading: boolean;
  onConfirm: (payload: {
    reportedUserId: string;
    category: string;
    description: string;
    context: Record<string, string>;
  }) => void;
}) {
  const [traveler, setTraveler] = useState(""),
    [category, setCategory] = useState(""),
    [description, setDescription] = useState(""),
    [search, setSearch] = useState("");
  const context = useMemo(() => {
    if (typeof window === "undefined") return {};
    const params = new URLSearchParams(window.location.search),
      result: Record<string, string> = {};
    for (const key of [
      "travelCircleId",
      "journeyId",
      "messageId",
      "meetupId",
      "reportedUserId",
    ]) {
      const value = params.get(key);
      if (value) result[key] = value;
    }
    return result;
  }, []);
  useEffect(() => {
    if (context.reportedUserId) setTraveler(context.reportedUserId);
  }, [context]);
  const visible = members.filter((member) =>
    (member.displayName ?? "Verified traveler")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const chosen = categories.find((item) => item[0] === category);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!traveler || !category) return;
    onConfirm({ reportedUserId: traveler, category, description, context });
  }
  return (
    <Panel
      title="1. Report a concern"
      copy="Help us keep Kopa-Padi safer for everyone."
      icon="document"
      className="safety-delay-two"
    >
      <form className="mt-5" onSubmit={submit}>
        <label className="text-[10px] font-black">Select traveler</label>
        {loading ? (
          <div className="mt-2 h-11 animate-pulse rounded-xl bg-slate-100" />
        ) : (
          <>
            <label className="relative mt-2 block">
              <span className="sr-only">Search travelers by name</span>
              <Icon
                name="search"
                size={17}
                className="absolute left-3 top-3 text-muted"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name"
                className="min-h-11 w-full rounded-xl border bg-white pl-10 pr-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </label>
            <div className="mt-2 grid max-h-36 gap-1 overflow-y-auto">
              {visible.map((member) => {
                const name = member.displayName ?? "Verified traveler";
                return (
                  <button
                    type="button"
                    key={member.userId}
                    onClick={() => setTraveler(member.userId)}
                    className={
                      "flex min-h-11 items-center gap-3 rounded-xl border px-3 text-left " +
                      (traveler === member.userId
                        ? "border-primary bg-primary/5"
                        : "hover:bg-background")
                    }
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-[9px] font-black text-primary">
                      {initials(name)}
                    </span>
                    <span className="grid flex-1 text-[10px]">
                      <b>{name}</b>
                      <small className="flex items-center gap-1 text-success">
                        <Icon name="check" size={10} />
                        Verified traveler
                      </small>
                    </span>
                    {traveler === member.userId ? (
                      <Icon name="check" size={16} className="text-primary" />
                    ) : null}
                  </button>
                );
              })}
              {!visible.length ? (
                <p className="rounded-xl bg-slate-50 p-3 text-[10px] leading-4 text-muted">
                  No selectable traveler is available. Open Safety Centre from a
                  Circle member or relevant safety action.
                </p>
              ) : null}
            </div>
          </>
        )}
        {Object.keys(context).length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {context.travelCircleId ? (
              <span className="rounded-full border bg-slate-50 px-3 py-1 text-[8px]">
                From Circle
              </span>
            ) : null}
            {context.messageId ? (
              <span className="rounded-full border bg-slate-50 px-3 py-1 text-[8px]">
                From Messages
              </span>
            ) : null}
            {context.meetupId ? (
              <span className="rounded-full border bg-slate-50 px-3 py-1 text-[8px]">
                From Meetup
              </span>
            ) : null}
            {context.journeyId ? (
              <span className="rounded-full border bg-slate-50 px-3 py-1 text-[8px]">
                From Journey
              </span>
            ) : null}
          </div>
        ) : null}
        <fieldset className="mt-5">
          <legend className="text-[10px] font-black">What happened?</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {categories.map(([value, label]) => (
              <button
                type="button"
                aria-pressed={category === value}
                onClick={() => setCategory(value)}
                key={value}
                className={
                  "min-h-10 rounded-full border px-3 text-[9px] font-semibold transition " +
                  (category === value
                    ? "border-primary bg-primary text-white"
                    : "bg-slate-50 text-slate-700 hover:border-primary")
                }
              >
                {label}
              </button>
            ))}
          </div>
          {chosen ? (
            <p className="mt-2 rounded-lg bg-primary-light/25 px-3 py-2 text-[9px] leading-4 text-primary-dark">
              {chosen[2]}
            </p>
          ) : null}
        </fieldset>
        <label className="mt-5 flex items-center gap-2 text-[10px] font-black">
          Tell us more{" "}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[7px] uppercase tracking-wide text-muted">
            Optional
          </span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={5}
          placeholder="Share any additional details that might help us review what happened."
          className="mt-2 w-full resize-y rounded-xl border p-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
        <p className="text-right text-[8px] text-muted">
          {description.length}/2000
        </p>
        <PrivacySummary hasContext={Object.keys(context).length > 0} />
        <button
          disabled={!traveler || !category}
          className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-primary text-xs font-black text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-45"
        >
          Submit report
        </button>
        <p className="mt-3 flex items-center justify-center gap-2 text-[9px] text-muted">
          <Icon name="lock" size={14} />
          Your details are not shared with the reported user.
        </p>
      </form>
    </Panel>
  );
}
function tone(status: string) {
  if (["TRIAGED", "UNDER_REVIEW"].includes(status))
    return "bg-amber-100 text-amber-800";
  if (["ACTION_TAKEN", "RESOLVED"].includes(status))
    return "bg-green-100 text-green-800";
  if (["DISMISSED", "DUPLICATE"].includes(status))
    return "bg-slate-100 text-slate-600";
  return "bg-cyan-100 text-cyan-800";
}
function Reports({
  reports,
  loading,
}: {
  reports: Report[];
  loading: boolean;
}) {
  const [selected, setSelected] = useState<Report | null>(reports[0] ?? null);
  useEffect(() => {
    if (!selected && reports[0]) setSelected(reports[0]);
  }, [reports, selected]);
  const stage = (status: string) =>
    status === "RESOLVED"
      ? 3
      : ["ACTION_TAKEN", "DISMISSED", "DUPLICATE"].includes(status)
        ? 2
        : ["TRIAGED", "UNDER_REVIEW"].includes(status)
          ? 1
          : 0;
  return (
    <Panel
      title="2. My reports"
      copy="Track the status of reports you've submitted."
      icon="list"
      className="safety-delay-three"
    >
      {loading ? (
        <div className="mt-4 grid gap-2">
          {[1, 2, 3].map((x) => (
            <div
              key={x}
              className="h-11 animate-pulse rounded-lg bg-slate-100"
            />
          ))}
        </div>
      ) : reports.length ? (
        <>
          <div className="mt-4 grid gap-2">
            {reports.map((report, index) => (
              <button
                key={report.id}
                onClick={() => setSelected(report)}
                className={
                  "grid min-h-14 grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border p-3 text-left " +
                  (selected?.id === report.id
                    ? "border-primary/40 bg-primary/5"
                    : "hover:bg-background")
                }
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-muted">
                  <Icon name="profile" size={15} />
                </span>
                <span className="grid min-w-0">
                  <b className="text-[10px]">Traveler report {index + 1}</b>
                  <small className="text-[8px] text-muted">
                    {human(report.category)} ·{" "}
                    {new Intl.DateTimeFormat("en-NG", {
                      dateStyle: "medium",
                    }).format(new Date(report.createdAt))}
                  </small>
                </span>
                <span
                  className={
                    "rounded-full px-2 py-1 text-[7px] font-black " +
                    tone(report.status)
                  }
                >
                  {statusLabel[report.status] ?? human(report.status)}
                </span>
              </button>
            ))}
          </div>
          {selected ? (
            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <b className="text-[9px]">Report status</b>
              <ol className="mt-3 grid grid-cols-4">
                {["Submitted", "Review", "Decision", "Resolved"].map(
                  (label, index) => (
                    <li
                      key={label}
                      className={
                        "relative grid justify-items-center gap-2 text-[7px] " +
                        (index <= stage(selected.status)
                          ? "text-primary"
                          : "text-slate-400")
                      }
                    >
                      <span
                        className={
                          "z-10 h-3 w-3 rounded-full border-2 " +
                          (index <= stage(selected.status)
                            ? "border-primary bg-primary"
                            : "border-slate-300 bg-white")
                        }
                      />
                      {index > 0 ? (
                        <i
                          className={
                            "absolute right-1/2 top-[5px] h-0.5 w-full " +
                            (index <= stage(selected.status)
                              ? "bg-primary"
                              : "bg-slate-300")
                          }
                        />
                      ) : null}
                      <b>{label}</b>
                    </li>
                  ),
                )}
              </ol>
            </div>
          ) : null}
        </>
      ) : (
        <div className="py-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-muted">
            <Icon name="document" size={28} />
          </span>
          <h3 className="mt-4 text-sm font-black">No reports yet</h3>
          <p className="mt-2 text-[10px] text-muted">
            You haven&apos;t submitted any reports.
          </p>
          <a
            href="#report-concern"
            className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-[10px] font-bold text-white"
          >
            Report a concern
          </a>
        </div>
      )}
    </Panel>
  );
}
function Blocks({
  blocks,
  loading,
  onUnblock,
}: {
  blocks: Block[];
  loading: boolean;
  onUnblock: (block: Block, label: string) => void;
}) {
  return (
    <Panel
      title="3. Blocked travelers"
      copy="Manage travelers you've blocked."
      icon="people"
      className="safety-delay-four"
    >
      {loading ? (
        <div className="mt-4 grid gap-2">
          {[1, 2].map((x) => (
            <div
              key={x}
              className="h-12 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      ) : blocks.length ? (
        <>
          <ul className="mt-4 grid gap-2">
            {blocks.map((block, index) => {
              const label = "Blocked traveler " + (index + 1);
              return (
                <li
                  key={block.blockedUserId}
                  className="flex min-h-14 items-center gap-3 rounded-xl border p-3"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-muted">
                    <Icon name="profile" size={15} />
                  </span>
                  <span className="grid flex-1">
                    <b className="text-[10px]">{label}</b>
                    <small className="text-[8px] text-muted">
                      Private account
                    </small>
                  </span>
                  <button
                    onClick={() => onUnblock(block, label)}
                    className="min-h-10 rounded-lg border px-3 text-[9px] font-bold hover:border-danger hover:text-danger"
                  >
                    Unblock
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-[8px] leading-4 text-muted">
            Unblocking does not restore an old Circle or trigger rematching.
          </p>
        </>
      ) : (
        <div className="py-7 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-muted">
            <Icon name="people" size={28} />
          </span>
          <h3 className="mt-4 text-sm font-black">No blocked travelers</h3>
          <p className="mx-auto mt-2 max-w-xs text-[9px] leading-4 text-muted">
            You haven&apos;t blocked any travelers. You can block or report
            travelers from their profile, Travel Circle, or relevant safety
            actions.
          </p>
        </div>
      )}
    </Panel>
  );
}
function Emergency() {
  return (
    <Panel
      title="4. Emergency guidance"
      icon="shield"
      className="safety-delay-five"
    >
      <div className="mt-4 rounded-xl border border-danger/20 bg-danger/5 p-3 text-[9px] leading-4 text-slate-700">
        <b className="text-danger">
          If you are in immediate danger, call 112 or the appropriate local
          emergency service first.
        </b>
        <p className="mt-2">Kopa-Padi reporting is not an emergency service.</p>
      </div>
      <h3 className="mt-4 text-[10px] font-black">Useful reminders</h3>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-[9px] leading-4 text-muted">
        <li>Move to a safer or public place if possible.</li>
        <li>Contact someone you trust.</li>
        <li>Use Journey Safety tools during an active journey.</li>
        <li>Report the incident afterward when it is safe.</li>
      </ul>
      <Link
        href="/journey"
        className="mt-4 inline-flex min-h-10 items-center gap-2 text-[9px] font-bold text-primary"
      >
        Open Journey Safety <Icon name="arrow" size={14} />
      </Link>
    </Panel>
  );
}
function Dialog({
  state,
  busy,
  onClose,
  onSubmit,
  onUnblock,
}: {
  state: DialogState;
  busy: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onUnblock: (block: Block) => void;
}) {
  const box = useRef<HTMLDivElement>(null),
    cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!state) return;
    const previous = document.activeElement as HTMLElement | null;
    cancel.current?.focus();
    const keys = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
      if (event.key !== "Tab" || !box.current) return;
      const items = Array.from(
        box.current.querySelectorAll<HTMLButtonElement>(
          "button:not(:disabled)",
        ),
      );
      if (!items.length) return;
      const first = items[0]!,
        last = items.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", keys);
    return () => {
      document.removeEventListener("keydown", keys);
      previous?.focus();
    };
  }, [state, busy, onClose]);
  if (!state) return null;
  const unblock = state.kind === "unblock";
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm"
      onMouseDown={(event) =>
        event.target === event.currentTarget && !busy && onClose()
      }
    >
      <div
        ref={box}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="safety-dialog-title"
        className="safety-dialog w-full max-w-md rounded-[18px] bg-white p-6 shadow-2xl"
      >
        <button
          aria-label="Close dialog"
          disabled={busy}
          onClick={onClose}
          className="float-right grid h-10 w-10 place-items-center rounded-full text-muted"
        >
          <Icon name="x" />
        </button>
        <span
          className={
            "grid h-12 w-12 place-items-center rounded-full " +
            (unblock
              ? "bg-danger/10 text-danger"
              : "bg-primary/10 text-primary")
          }
        >
          <Icon name={unblock ? "profile" : "document"} size={24} />
        </span>
        <h2 id="safety-dialog-title" className="mt-4 text-xl font-black">
          {unblock ? "Unblock traveler?" : "Submit this report?"}
        </h2>
        <p className="mt-2 text-xs leading-5 text-muted">
          {unblock
            ? "Unblocking does not restore an old Travel Circle or trigger rematching."
            : "This will be sent privately to the Kopa-Padi safety team for review. Your details are not shared with the reported user."}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            ref={cancel}
            disabled={busy}
            onClick={onClose}
            className="min-h-11 rounded-xl border text-xs font-bold"
          >
            Cancel
          </button>
          <button
            disabled={busy}
            onClick={() => (unblock ? onUnblock(state.block) : onSubmit())}
            className={
              "min-h-11 rounded-xl text-xs font-black text-white " +
              (unblock ? "bg-danger" : "bg-primary")
            }
          >
            {busy ? "Please wait…" : unblock ? "Unblock" : "Submit report"}
          </button>
        </div>
      </div>
    </div>
  );
}
function Success({ back }: { back: () => void }) {
  return (
    <section
      className="safety-success rounded-[18px] border bg-white p-10 text-center shadow-sm"
      role="status"
    >
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-100 text-green-700">
        <Icon name="check" size={31} />
      </span>
      <h2 className="mt-5 text-xl font-black">Report received</h2>
      <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-muted">
        Your report has been submitted privately. Your details are not shared
        with the reported user.
      </p>
      <button
        onClick={back}
        className="mt-6 min-h-11 rounded-xl border px-6 text-xs font-bold"
      >
        Back to Safety Centre
      </button>
    </section>
  );
}
export function SafetyCenter() {
  const session = authClient.useSession();
  const [reports, setReports] = useState<Report[]>([]),
    [blocks, setBlocks] = useState<Block[]>([]),
    [members, setMembers] = useState<Member[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [dialog, setDialog] = useState<DialogState>(null),
    [draft, setDraft] = useState<{
      reportedUserId: string;
      category: string;
      description: string;
      context: Record<string, string>;
    } | null>(null),
    [success, setSuccess] = useState(false);
  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const [r, b, c] = await Promise.allSettled([
        api<Report[]>("/safety-reports/mine"),
        api<Block[]>("/blocks"),
        api<Circle>("/travel-circles/current"),
      ]);
      if (r.status === "rejected") throw r.reason;
      if (b.status === "rejected") throw b.reason;
      setReports(r.value);
      setBlocks(b.value);
      if (c.status === "fulfilled" && c.value)
        setMembers(
          c.value.members.filter(
            (member) => member.userId !== c.value?.membership.userId,
          ),
        );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "We couldn't load this information.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const close = useCallback(() => {
    if (!busy) setDialog(null);
  }, [busy]);
  async function submit() {
    if (!draft) return;
    setBusy(true);
    setError("");
    try {
      await api("/safety-reports", {
        method: "POST",
        body: JSON.stringify({
          reportedUserId: draft.reportedUserId,
          category: draft.category,
          description: draft.description || null,
          ...draft.context,
        }),
      });
      setDialog(null);
      setDraft(null);
      setSuccess(true);
      await load();
    } catch {
      setError("We couldn't submit your report right now. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function unblock(block: Block) {
    setBusy(true);
    setError("");
    try {
      await api("/blocks/" + block.blockedUserId, { method: "DELETE" });
      setDialog(null);
      await load();
    } catch {
      setError(
        "We couldn't unblock this traveler right now. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell name={session.data?.user.name?.trim() || "Traveler"}>
      <main className="relative mx-auto max-w-[1180px] px-4 pb-28 pt-6 sm:px-7 lg:pb-12">
        <div className="safety-contours" aria-hidden="true" />
        <header className="safety-enter relative flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Icon name="shield" size={30} />
          </span>
          <div>
            <h1 className="text-3xl font-black tracking-[-.04em]">
              Safety Centre
            </h1>
            <p className="mt-1 text-xs text-muted">
              Verification confirms PCM status, not personal trustworthiness.
            </p>
            <p className="mt-1 hidden text-[10px] text-muted sm:block">
              Report concerns privately, review your reports, and manage blocked
              travelers.
            </p>
          </div>
        </header>
        <div className="mt-5">
          <Danger />
        </div>
        {error ? (
          <section
            role="alert"
            className="mt-4 flex items-center gap-3 rounded-xl border border-danger/20 bg-danger/5 p-4 text-danger"
          >
            <Icon name="alert" />
            <p className="flex-1 text-[10px]">{error}</p>
            <button
              onClick={() => void load()}
              className="min-h-10 rounded-lg border border-danger/30 bg-white px-4 text-[9px] font-bold"
            >
              Try again
            </button>
          </section>
        ) : null}
        {success ? (
          <div className="mt-5">
            <Success back={() => setSuccess(false)} />
          </div>
        ) : (
          <div className="mt-5 grid items-start gap-4 xl:grid-cols-[1.15fr_.85fr]">
            <div id="report-concern">
              <ReportForm
                members={members}
                loading={loading}
                onConfirm={(payload) => {
                  setDraft(payload);
                  setDialog({ kind: "report" });
                }}
              />
            </div>
            <aside className="grid gap-4">
              <Reports reports={reports} loading={loading} />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                <Blocks
                  blocks={blocks}
                  loading={loading}
                  onUnblock={(block, label) =>
                    setDialog({ kind: "unblock", block, label })
                  }
                />
                <Emergency />
              </div>
            </aside>
          </div>
        )}
        <Dialog
          state={dialog}
          busy={busy}
          onClose={close}
          onSubmit={() => void submit()}
          onUnblock={(block) => void unblock(block)}
        />
      </main>
    </Shell>
  );
}
