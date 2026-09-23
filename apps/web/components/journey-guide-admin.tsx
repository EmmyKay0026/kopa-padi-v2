"use client";
import { api } from "@/lib/api";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
type Guide = {
  id: string;
  title: string;
  summary: string;
  originScopeType: string;
  originStateId: string | null;
  originLgaId: string | null;
  originTownId: string | null;
  originHubId: string | null;
  destinationCampId: string;
  status: string;
  confidenceLevel: string;
  version: number;
  lastReviewedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
};
type Leg = {
  sequenceNumber: number;
  legType: string;
  fromLabel: string;
  toLabel: string;
  transportMode: string | null;
  instruction: string;
  connectionNotes: string | null;
  safetyNotes: string | null;
  estimatedDurationMinutes: number | null;
  estimatedDistanceKm: number | null;
  confidenceLevel: string;
  sourceType: string;
  fromStateId: null;
  fromLgaId: null;
  fromTownId: null;
  fromHubId: null;
  toStateId: null;
  toLgaId: null;
  toTownId: null;
  toHubId: null;
  toCampId: null;
};
type Source = {
  journeyLegSequence: number | null;
  sourceType: string;
  title: string;
  reference: string;
  sourceDate: string | null;
  reviewedAt: string | null;
};
type Detail = {
  guide: Guide;
  legs: Leg[];
  sources: Source[];
  destination: { name: string; state: string; address?: string };
};
type Place = {
  id: string;
  name: string;
  stateName?: string;
  campName?: string;
  lgaId?: string;
};
type Draft = {
  originScopeType: string;
  originStateId: string | null;
  originLgaId: string | null;
  originTownId: string | null;
  originHubId: string | null;
  destinationCampId: string;
  title: string;
  summary: string;
  alternativeNotes: string | null;
  confidenceLevel: string;
  legs: Leg[];
  sources: Source[];
};
const statuses = [
  "",
  "DRAFT",
  "UNDER_REVIEW",
  "PUBLISHED",
  "NEEDS_REVIEW",
  "RETIRED",
];
const labels: Record<string, string> = {
  DRAFT: "Draft",
  UNDER_REVIEW: "Under review",
  PUBLISHED: "Published",
  NEEDS_REVIEW: "Needs review",
  RETIRED: "Retired",
  STATE_AREA: "State",
  LGA: "LGA",
  TOWN: "Town",
  TRAVEL_HUB: "Travel hub",
};
const newLeg = (n: number): Leg => ({
  sequenceNumber: n,
  legType: "INTERCITY",
  fromLabel: "",
  toLabel: "",
  transportMode: "COMMERCIAL_BUS",
  instruction: "",
  connectionNotes: null,
  safetyNotes: null,
  estimatedDurationMinutes: null,
  estimatedDistanceKm: null,
  confidenceLevel: "MEDIUM",
  sourceType: "ADMIN_RESEARCH",
  fromStateId: null,
  fromLgaId: null,
  fromTownId: null,
  fromHubId: null,
  toStateId: null,
  toLgaId: null,
  toTownId: null,
  toHubId: null,
  toCampId: null,
});
const newSource = (): Source => ({
  journeyLegSequence: 1,
  sourceType: "ADMIN_RESEARCH",
  title: "",
  reference: "",
  sourceDate: null,
  reviewedAt: null,
});
const empty: Draft = {
  originScopeType: "LGA",
  originStateId: null,
  originLgaId: null,
  originTownId: null,
  originHubId: null,
  destinationCampId: "",
  title: "",
  summary: "",
  alternativeNotes: null,
  confidenceLevel: "MEDIUM",
  legs: [newLeg(1)],
  sources: [newSource()],
};
function Shell({ children }: { children: React.ReactNode }) {
  const nav = [
    "Dashboard",
    "Users",
    "Verifications",
    "Matches",
    "Travel Plans",
    "Geography",
    "Journey Guides",
    "Reports",
    "Safety",
    "Content",
    "Audit Logs",
    "Settings",
  ];
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-56 border-r bg-white p-5 lg:flex lg:flex-col">
        <Link href="/" className="flex items-center gap-2">
          <b className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-xs text-white">
            KP
          </b>
          <span>
            <strong className="block">Kopa-Padi</strong>
            <small className="text-[8px] text-muted">Admin</small>
          </span>
        </Link>
        <nav className="mt-7 space-y-1" aria-label="Admin navigation">
          {nav.map((n) => (
            <Link
              key={n}
              href={n === "Journey Guides" ? "/admin/journey-guides" : "#"}
              className={`flex min-h-10 items-center rounded-xl px-3 text-xs font-bold ${n === "Journey Guides" ? "bg-primary/10 text-primary" : "text-muted hover:bg-background"}`}
            >
              ◇ &nbsp; {n}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-56">
        <header className="flex h-16 items-center justify-between border-b bg-white px-5 lg:hidden">
          <b className="text-primary">
            ← &nbsp; Kopa-Padi <small className="text-muted">Admin</small>
          </b>
          <button aria-label="Menu">☷</button>
        </header>
        {children}
      </div>
    </div>
  );
}
function Badge({ value }: { value: string }) {
  const color =
    value === "PUBLISHED" || value === "HIGH"
      ? "bg-success/10 text-success"
      : value === "NEEDS_REVIEW" || value === "MEDIUM"
        ? "bg-warning/15 text-amber-700"
        : value === "UNDER_REVIEW"
          ? "bg-accent/10 text-accent"
          : value === "LOW"
            ? "bg-danger/10 text-danger"
            : "bg-slate-100 text-slate-600";
  return (
    <span
      className={`rounded-md px-2 py-1 text-[9px] font-black uppercase ${color}`}
    >
      {labels[value] ?? value}
    </span>
  );
}
function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <i key={i} className="h-20 rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="h-12 rounded-xl bg-slate-100" />
      <div className="h-80 rounded-xl bg-slate-100" />
    </div>
  );
}
function Confirm({
  item,
  onClose,
  onConfirm,
  busy,
}: {
  item: { guide: Guide; action: string } | null;
  onClose: () => void;
  onConfirm: () => void;
  busy: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    item && ref.current?.focus();
  }, [item]);
  if (!item) return null;
  const text: Record<string, [string, string, string]> = {
    "submit-review": [
      "Submit this guide for review?",
      "The guide will move to review and cannot be published until it passes the review stage.",
      "Submit for review",
    ],
    publish: [
      "Publish this journey guide?",
      "This guide may become visible to travelers whose journeys match its scope.",
      "Publish guide",
    ],
    "mark-review": [
      "Mark this guide as needing review?",
      "Travelers should no longer rely on this guide as fully current until it is reviewed again.",
      "Mark needs review",
    ],
    retire: [
      "Retire this journey guide?",
      "This guide will no longer be served to travelers but will remain available for audit history.",
      "Retire guide",
    ],
  };
  const t = text[item.action];
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-5"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-2xl"
      >
        <button
          ref={ref}
          onClick={onClose}
          className="ml-auto h-10 w-10"
          aria-label="Close"
        >
          ×
        </button>
        <span
          className={`mx-auto grid h-16 w-16 place-items-center rounded-full text-2xl ${item.action === "retire" ? "bg-danger/10 text-danger" : item.action === "mark-review" ? "bg-warning/15 text-warning" : "bg-primary-light text-primary"}`}
        >
          !
        </span>
        <h2 id="confirm-title" className="mt-4 text-xl font-black">
          {t[0]}
        </h2>
        <p className="mt-2 text-xs leading-5 text-muted">{t[1]}</p>
        {item.action === "publish" && (
          <ul className="mt-4 rounded-xl bg-background p-3 text-left text-[10px] text-muted">
            <li>✓ Route reviewed</li>
            <li>✓ Safety notes checked</li>
            <li>✓ Destination verified</li>
            <li>✓ Sources traceable</li>
          </ul>
        )}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="min-h-12 rounded-xl border font-bold"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`min-h-12 rounded-xl font-bold text-white ${item.action === "retire" ? "bg-danger" : "bg-primary"}`}
          >
            {busy ? "Working..." : t[2]}
          </button>
        </div>
      </section>
    </div>
  );
}
function DetailPanel({
  detail,
  onClose,
  onEdit,
}: {
  detail: Detail;
  onClose: () => void;
  onEdit: () => void;
}) {
  const [tab, setTab] = useState("Overview");
  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full overflow-y-auto border-l bg-white p-5 shadow-2xl sm:max-w-xl">
      <header className="flex items-center justify-between">
        <button onClick={onClose}>← &nbsp; Guide details</button>
        <button onClick={onClose} className="h-10 w-10">
          ×
        </button>
      </header>
      <div className="mt-6 flex items-start justify-between gap-3">
        <h2 className="text-xl font-black">{detail.guide.title}</h2>
        <Badge value={detail.guide.status} />
      </div>
      <div className="mt-5 flex border-b">
        {["Overview", "Journey legs", "Sources", "History"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`min-h-11 flex-1 border-b-2 text-[10px] font-bold ${tab === t ? "border-primary text-primary" : "border-transparent text-muted"}`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Overview" ? (
        <div className="mt-5">
          <dl className="grid gap-3 rounded-xl bg-background p-4 text-xs">
            {[
              ["Origin scope", labels[detail.guide.originScopeType]],
              [
                "Destination",
                `${detail.destination.name}, ${detail.destination.state}`,
              ],
              ["Confidence", detail.guide.confidenceLevel],
              ["Version", `v${detail.guide.version}`],
              [
                "Last reviewed",
                detail.guide.lastReviewedAt
                  ? new Date(detail.guide.lastReviewedAt).toLocaleDateString(
                      "en-NG",
                    )
                  : "—",
              ],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-muted">{k}</dt>
                <dd className="font-bold">{v}</dd>
              </div>
            ))}
          </dl>
          <h3 className="mt-5 font-black">Summary</h3>
          <p className="mt-2 text-xs leading-5 text-muted">
            {detail.guide.summary}
          </p>
        </div>
      ) : tab === "Journey legs" ? (
        <ol className="mt-5 space-y-3">
          {detail.legs.map((l) => (
            <li key={l.sequenceNumber} className="rounded-xl border p-4">
              <b>
                {l.sequenceNumber}. {l.fromLabel} → {l.toLabel}
              </b>
              <p className="mt-2 text-xs text-muted">{l.instruction}</p>
            </li>
          ))}
        </ol>
      ) : tab === "Sources" ? (
        <ul className="mt-5 space-y-3">
          {detail.sources.map((s, i) => (
            <li key={i} className="rounded-xl border p-4 text-xs">
              <b>{s.title}</b>
              <p className="mt-1 text-muted">
                {s.sourceType} · Leg {s.journeyLegSequence ?? "All"}
              </p>
              <p className="mt-2 break-all">{s.reference}</p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 rounded-xl bg-background p-4 text-xs text-muted">
          <p>Version v{detail.guide.version}</p>
          <p className="mt-2">
            Current lifecycle status: {labels[detail.guide.status]}
          </p>
          <p className="mt-2">
            Detailed audit history remains available through Audit Logs.
          </p>
        </div>
      )}
      {["DRAFT", "NEEDS_REVIEW"].includes(detail.guide.status) && (
        <button onClick={onEdit} className="btn-primary mt-6 w-full">
          Edit guide
        </button>
      )}
    </aside>
  );
}

const BUILDER_STEPS = [
  "Guide overview",
  "Journey legs",
  "Sources & evidence",
  "Review & create",
] as const;

function Builder({
  initial,
  states,
  camps,
  hubs,
  onClose,
  onSaved,
}: {
  initial?: Detail;
  states: Place[];
  camps: Place[];
  hubs: Place[];
  onClose: () => void;
  onSaved: (g: Guide) => void;
}) {
  const [draft, setDraft] = useState<Draft>(() =>
    initial
      ? {
          ...initial.guide,
          alternativeNotes:
            (initial.guide as Guide & { alternativeNotes?: string | null })
              .alternativeNotes ?? null,
          legs: initial.legs.map((l, i) => ({ ...l, sequenceNumber: i + 1 })),
          sources: initial.sources.map((s) => ({ ...s })),
        }
      : structuredClone(empty),
  );
  const [step, setStep] = useState(1),
    [lgas, setLgas] = useState<Place[]>([]),
    [towns, setTowns] = useState<Place[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [advanced, setAdvanced] = useState(false),
    [json, setJson] = useState("");
  useEffect(() => {
    if (!draft.originStateId) {
      setLgas([]);
      return;
    }
    api<Place[]>(`/locations/states/${draft.originStateId}/lgas`)
      .then(setLgas)
      .catch(() => setError("Could not load LGAs."));
  }, [draft.originStateId]);
  useEffect(() => {
    if (!draft.originLgaId) {
      setTowns([]);
      return;
    }
    api<Place[]>(`/locations/lgas/${draft.originLgaId}/towns`)
      .then(setTowns)
      .catch(() => setError("Could not load towns."));
  }, [draft.originLgaId]);
  function overviewValid() {
    const location =
      draft.originScopeType === "STATE_AREA"
        ? draft.originStateId
        : draft.originScopeType === "LGA"
          ? draft.originLgaId
          : draft.originScopeType === "TOWN"
            ? draft.originTownId
            : draft.originHubId;
    if (
      draft.title.trim().length < 3 ||
      draft.summary.trim().length < 10 ||
      !draft.destinationCampId ||
      !location
    ) {
      setError("Complete the required guide overview fields.");
      return false;
    }
    return true;
  }
  function legsValid() {
    if (
      !draft.legs.length ||
      draft.legs.some(
        (l) =>
          !l.legType ||
          l.fromLabel.trim().length < 2 ||
          l.toLabel.trim().length < 2 ||
          l.instruction.trim().length < 3 ||
          !l.confidenceLevel,
      )
    ) {
      setError("Complete every required journey leg field.");
      return false;
    }
    return true;
  }
  function sourcesValid() {
    if (
      !draft.sources.length ||
      draft.sources.some(
        (s) =>
          !s.title.trim() || s.reference.trim().length < 3 || !s.sourceType,
      )
    ) {
      setError("Add at least one complete, traceable source.");
      return false;
    }
    return true;
  }
  function next() {
    const ok =
      step === 1 ? overviewValid() : step === 2 ? legsValid() : sourcesValid();
    if (ok) {
      setError("");
      setStep((v) => Math.min(4, v + 1));
    }
  }
  function changeLeg(i: number, key: keyof Leg, value: string | number | null) {
    setDraft((d) => ({
      ...d,
      legs: d.legs.map((l, x) => (x === i ? { ...l, [key]: value } : l)),
    }));
  }
  function removeLeg(i: number) {
    setDraft((d) => ({
      ...d,
      legs: d.legs
        .filter((_, x) => x !== i)
        .map((l, x) => ({ ...l, sequenceNumber: x + 1 })),
      sources: d.sources.map((s) => ({
        ...s,
        journeyLegSequence:
          s.journeyLegSequence && s.journeyLegSequence > i + 1
            ? s.journeyLegSequence - 1
            : s.journeyLegSequence === i + 1
              ? null
              : s.journeyLegSequence,
      })),
    }));
  }
  function move(i: number, dir: number) {
    const to = i + dir;
    if (to < 0 || to >= draft.legs.length) return;
    setDraft((d) => {
      const legs = [...d.legs];
      [legs[i], legs[to]] = [legs[to], legs[i]];
      return {
        ...d,
        legs: legs.map((l, x) => ({ ...l, sequenceNumber: x + 1 })),
      };
    });
  }
  function changeSource(
    i: number,
    key: keyof Source,
    value: string | number | null,
  ) {
    setDraft((d) => ({
      ...d,
      sources: d.sources.map((s, x) => (x === i ? { ...s, [key]: value } : s)),
    }));
  }
  async function save() {
    if (!overviewValid() || !legsValid() || !sourcesValid()) return;
    setBusy(true);
    setError("");
    try {
      const payload = {
        ...draft,
        alternativeNotes: draft.alternativeNotes || null,
        legs: draft.legs.map((l) => ({
          ...l,
          estimatedDurationMinutes: l.estimatedDurationMinutes || null,
          estimatedDistanceKm: l.estimatedDistanceKm || null,
          connectionNotes: l.connectionNotes || null,
          safetyNotes: l.safetyNotes || null,
        })),
        sources: draft.sources.map((s) => ({
          ...s,
          sourceDate: s.sourceDate || null,
          reviewedAt: s.reviewedAt || null,
        })),
      };
      const result = await api<Detail>(
        initial
          ? `/admin/journey-guides/${initial.guide.id}`
          : "/admin/journey-guides",
        { method: initial ? "PATCH" : "POST", body: JSON.stringify(payload) },
      );
      onSaved(result.guide);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "We couldn't save the guide. Please check your information and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  function applyJson() {
    try {
      setDraft(JSON.parse(json));
      setAdvanced(false);
      setError("");
    } catch {
      setError("The advanced editor contains invalid JSON.");
    }
  }
  return (
    <aside className="fixed inset-0 z-40 overflow-y-auto bg-white shadow-2xl lg:left-auto lg:w-[620px] lg:border-l">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-5 py-4">
        <div>
          <h2 className="font-black">
            {initial ? "Edit journey guide" : "Create journey guide"}
          </h2>
          <p className="text-[10px] text-muted">
            Step {step} of 4 · {BUILDER_STEPS[step - 1]}
          </p>
        </div>

        <button
          onClick={onClose}
          className="h-10 w-10"
          aria-label="Close builder"
        >
          ×
        </button>
      </header>
      <div className="grid min-h-[calc(100vh-73px)] lg:grid-cols-[150px_1fr]">
        <ol className="hidden border-r bg-background p-4 lg:block">
          {BUILDER_STEPS.map((s, i) => (
            <li
              key={s}
              className={`mb-3 text-[10px] font-bold ${i + 1 === step ? "text-primary" : "text-muted"}`}
            >
              <span
                className={`mr-2 inline-grid h-6 w-6 place-items-center rounded-full ${i + 1 <= step ? "bg-primary text-white" : "bg-slate-200"}`}
              >
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
        <div className="p-5 pb-28">
          <div key={step} className="enter">
            {step === 1 ? (
              <>
                <h3 className="text-lg font-black">Guide overview</h3>
                <p className="mb-5 text-xs text-muted">
                  Define where this guidance applies.
                </p>
                <Field label="Guide title *">
                  <input
                    className="field"
                    value={draft.title}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, title: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Origin scope type *">
                  <select
                    className="field"
                    value={draft.originScopeType}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        originScopeType: e.target.value,
                        originStateId: null,
                        originLgaId: null,
                        originTownId: null,
                        originHubId: null,
                      }))
                    }
                  >
                    {[
                      ["STATE_AREA", "State"],
                      ["LGA", "LGA"],
                      ["TOWN", "Town"],
                      ["TRAVEL_HUB", "Travel hub"],
                    ].map(([v, l]) => (
                      <option value={v} key={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </Field>
                {draft.originScopeType !== "TRAVEL_HUB" && (
                  <Field label="Origin state *">
                    <select
                      className="field"
                      value={draft.originStateId ?? ""}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          originStateId: e.target.value || null,
                          originLgaId: null,
                          originTownId: null,
                        }))
                      }
                    >
                      <option value="">Select state</option>
                      {states.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                {["LGA", "TOWN"].includes(draft.originScopeType) && (
                  <Field label="Origin LGA *">
                    <select
                      className="field"
                      value={draft.originLgaId ?? ""}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          originLgaId: e.target.value || null,
                          originTownId: null,
                        }))
                      }
                    >
                      <option value="">Select LGA</option>
                      {lgas.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                {draft.originScopeType === "TOWN" && (
                  <Field label="Origin town *">
                    <select
                      className="field"
                      value={draft.originTownId ?? ""}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          originTownId: e.target.value || null,
                        }))
                      }
                    >
                      <option value="">Select town</option>
                      {towns.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                {draft.originScopeType === "TRAVEL_HUB" && (
                  <Field label="Origin travel hub *">
                    <select
                      className="field"
                      value={draft.originHubId ?? ""}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          originHubId: e.target.value || null,
                        }))
                      }
                    >
                      <option value="">Select hub</option>
                      {hubs.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                <Field label="Destination camp *">
                  <select
                    className="field"
                    value={draft.destinationCampId}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        destinationCampId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select camp</option>
                    {camps.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.campName ?? v.name} — {v.stateName}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Summary *">
                  <textarea
                    className="field min-h-24 py-3"
                    maxLength={2000}
                    value={draft.summary}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, summary: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Alternative notes (optional)">
                  <textarea
                    className="field min-h-20 py-3"
                    maxLength={1000}
                    value={draft.alternativeNotes ?? ""}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        alternativeNotes: e.target.value || null,
                      }))
                    }
                  />
                </Field>
                <Field label="Overall confidence *">
                  <select
                    className="field"
                    value={draft.confidenceLevel}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        confidenceLevel: e.target.value,
                      }))
                    }
                  >
                    {["HIGH", "MEDIUM", "LOW", "UNVERIFIED"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </Field>
              </>
            ) : step === 2 ? (
              <>
                <h3 className="text-lg font-black">Journey legs</h3>
                <p className="mb-5 text-xs text-muted">
                  Add the steps a traveler should take to reach the destination.
                </p>
                {draft.legs.map((l, i) => (
                  <section key={i} className="mb-4 rounded-xl border p-4">
                    <header className="flex justify-between">
                      <b className="text-xs">☷ &nbsp; Leg {i + 1}</b>
                      <span>
                        <button
                          onClick={() => move(i, -1)}
                          disabled={!i}
                          aria-label={`Move leg ${i + 1} up`}
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => move(i, 1)}
                          disabled={i === draft.legs.length - 1}
                          className="ml-3"
                          aria-label={`Move leg ${i + 1} down`}
                        >
                          ↓
                        </button>
                        {draft.legs.length > 1 && (
                          <button
                            onClick={() => removeLeg(i)}
                            className="ml-3 text-danger"
                            aria-label={`Remove leg ${i + 1}`}
                          >
                            ×
                          </button>
                        )}
                      </span>
                    </header>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Leg type *">
                        <select
                          className="field"
                          value={l.legType}
                          onChange={(e) =>
                            changeLeg(i, "legType", e.target.value)
                          }
                        >
                          {[
                            "INTERCITY",
                            "LOCAL_TRANSFER",
                            "FINAL_CONNECTION",
                            "WALKING",
                          ].map((v) => (
                            <option key={v}>{v}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Transport mode *">
                        <select
                          className="field"
                          value={l.transportMode ?? ""}
                          onChange={(e) =>
                            changeLeg(i, "transportMode", e.target.value)
                          }
                        >
                          {[
                            "COMMERCIAL_BUS",
                            "TRAIN",
                            "FLIGHT",
                            "PRIVATE_VEHICLE",
                            "TAXI",
                            "MOTORCYCLE",
                            "TRICYCLE",
                            "WALKING",
                            "OTHER",
                          ].map((v) => (
                            <option key={v}>{v}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="From *">
                        <input
                          className="field"
                          value={l.fromLabel}
                          onChange={(e) =>
                            changeLeg(i, "fromLabel", e.target.value)
                          }
                        />
                      </Field>
                      <Field label="To *">
                        <input
                          className="field"
                          value={l.toLabel}
                          onChange={(e) =>
                            changeLeg(i, "toLabel", e.target.value)
                          }
                        />
                      </Field>
                    </div>
                    <Field label="Instructions *">
                      <textarea
                        className="field min-h-24 py-3"
                        value={l.instruction}
                        onChange={(e) =>
                          changeLeg(i, "instruction", e.target.value)
                        }
                      />
                    </Field>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Estimated duration (minutes)">
                        <input
                          type="number"
                          min="1"
                          className="field"
                          value={l.estimatedDurationMinutes ?? ""}
                          onChange={(e) =>
                            changeLeg(
                              i,
                              "estimatedDurationMinutes",
                              e.target.value ? Number(e.target.value) : null,
                            )
                          }
                        />
                      </Field>
                      <Field label="Estimated distance (km)">
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          className="field"
                          value={l.estimatedDistanceKm ?? ""}
                          onChange={(e) =>
                            changeLeg(
                              i,
                              "estimatedDistanceKm",
                              e.target.value ? Number(e.target.value) : null,
                            )
                          }
                        />
                      </Field>
                      <Field label="Confidence *">
                        <select
                          className="field"
                          value={l.confidenceLevel}
                          onChange={(e) =>
                            changeLeg(i, "confidenceLevel", e.target.value)
                          }
                        >
                          {["HIGH", "MEDIUM", "LOW", "UNVERIFIED"].map((v) => (
                            <option key={v}>{v}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Source type *">
                        <select
                          className="field"
                          value={l.sourceType}
                          onChange={(e) =>
                            changeLeg(i, "sourceType", e.target.value)
                          }
                        >
                          {[
                            "ADMIN_RESEARCH",
                            "OFFICIAL_SOURCE",
                            "FIELD_REPORT",
                            "TRAVELER_FEEDBACK",
                          ].map((v) => (
                            <option key={v}>{v}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <Field label="Safety notes (optional)">
                      <textarea
                        className="field min-h-20 py-3"
                        value={l.safetyNotes ?? ""}
                        onChange={(e) =>
                          changeLeg(i, "safetyNotes", e.target.value || null)
                        }
                      />
                    </Field>
                    <Field label="Connection notes (optional)">
                      <textarea
                        className="field min-h-20 py-3"
                        value={l.connectionNotes ?? ""}
                        onChange={(e) =>
                          changeLeg(
                            i,
                            "connectionNotes",
                            e.target.value || null,
                          )
                        }
                      />
                    </Field>
                  </section>
                ))}
                <button
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      legs: [...d.legs, newLeg(d.legs.length + 1)],
                    }))
                  }
                  className="min-h-11 rounded-xl border border-primary px-4 text-xs font-bold text-primary"
                >
                  ＋ Add another leg
                </button>
              </>
            ) : step === 3 ? (
              <>
                <h3 className="text-lg font-black">Sources & evidence</h3>
                <p className="mb-5 text-xs text-muted">
                  Every published guide must be supported by traceable evidence.
                </p>
                {draft.sources.map((s, i) => (
                  <section key={i} className="mb-4 rounded-xl border p-4">
                    <header className="flex justify-between">
                      <b className="text-xs">Source {i + 1}</b>
                      {draft.sources.length > 1 && (
                        <button
                          onClick={() =>
                            setDraft((d) => ({
                              ...d,
                              sources: d.sources.filter((_, x) => x !== i),
                            }))
                          }
                          className="text-danger"
                        >
                          Remove
                        </button>
                      )}
                    </header>
                    <Field label="Supported leg *">
                      <select
                        className="field"
                        value={s.journeyLegSequence ?? ""}
                        onChange={(e) =>
                          changeSource(
                            i,
                            "journeyLegSequence",
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                      >
                        <option value="">Whole guide</option>
                        {draft.legs.map((l) => (
                          <option
                            key={l.sequenceNumber}
                            value={l.sequenceNumber}
                          >
                            Leg {l.sequenceNumber}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Source type *">
                      <select
                        className="field"
                        value={s.sourceType}
                        onChange={(e) =>
                          changeSource(i, "sourceType", e.target.value)
                        }
                      >
                        {[
                          "ADMIN_RESEARCH",
                          "OFFICIAL_SOURCE",
                          "FIELD_REPORT",
                          "TRAVELER_FEEDBACK",
                        ].map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Source title *">
                      <input
                        className="field"
                        value={s.title}
                        onChange={(e) =>
                          changeSource(i, "title", e.target.value)
                        }
                      />
                    </Field>
                    <Field label="Traceable reference *">
                      <textarea
                        className="field min-h-20 py-3"
                        value={s.reference}
                        onChange={(e) =>
                          changeSource(i, "reference", e.target.value)
                        }
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Source date">
                        <input
                          type="date"
                          className="field"
                          value={s.sourceDate ?? ""}
                          onChange={(e) =>
                            changeSource(
                              i,
                              "sourceDate",
                              e.target.value || null,
                            )
                          }
                        />
                      </Field>
                      <Field label="Reviewed at">
                        <input
                          type="datetime-local"
                          className="field"
                          value={s.reviewedAt?.slice(0, 16) ?? ""}
                          onChange={(e) =>
                            changeSource(
                              i,
                              "reviewedAt",
                              e.target.value
                                ? new Date(e.target.value).toISOString()
                                : null,
                            )
                          }
                        />
                      </Field>
                    </div>
                  </section>
                ))}
                <button
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      sources: [...d.sources, newSource()],
                    }))
                  }
                  className="min-h-11 rounded-xl border border-primary px-4 text-xs font-bold text-primary"
                >
                  ＋ Add source
                </button>
              </>
            ) : (
              <ReviewDraft draft={draft} edit={setStep} />
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
          <button
            onClick={() => {
              setJson(JSON.stringify(draft, null, 2));
              setAdvanced(true);
            }}
            className="mt-5 text-xs font-bold text-primary"
          >
            Advanced JSON editor
          </button>
          <div className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-2 gap-3 border-t bg-white p-4 lg:left-auto lg:w-[470px]">
            {step > 1 ? (
              <button
                onClick={() => setStep((v) => v - 1)}
                className="min-h-12 rounded-xl border font-bold"
              >
                ← Back
              </button>
            ) : (
              <button
                onClick={onClose}
                className="min-h-12 rounded-xl border font-bold"
              >
                Cancel
              </button>
            )}
            {step < 4 ? (
              <button onClick={next} className="btn-primary">
                Next →
              </button>
            ) : (
              <button
                onClick={() => void save()}
                disabled={busy}
                className="btn-primary"
              >
                {busy ? "Saving..." : initial ? "Save draft" : "Create draft"}
              </button>
            )}
          </div>
        </div>
      </div>
      {advanced && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-5">
          <section className="w-full max-w-3xl rounded-2xl bg-white p-5">
            <header className="flex justify-between">
              <h3 className="font-black">Advanced JSON editor</h3>
              <button onClick={() => setAdvanced(false)}>×</button>
            </header>
            <textarea
              className="mt-4 h-[55vh] w-full rounded-xl border p-4 font-mono text-xs"
              value={json}
              onChange={(e) => setJson(e.target.value)}
            />
            <div className="mt-3 flex justify-end gap-3">
              <button
                onClick={() => setAdvanced(false)}
                className="min-h-11 rounded-xl border px-5"
              >
                Cancel
              </button>
              <button onClick={applyJson} className="btn-primary">
                Apply JSON
              </button>
            </div>
          </section>
        </div>
      )}
    </aside>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mt-4 grid gap-2 text-xs font-bold">
      {label}
      {children}
    </label>
  );
}
function ReviewDraft({
  draft,
  edit,
}: {
  draft: Draft;
  edit: (n: number) => void;
}) {
  return (
    <>
      <h3 className="text-lg font-black">Review your guide</h3>
      <p className="mb-5 text-xs text-muted">
        Check the details before creating the draft.
      </p>
      <Summary
        title="Guide overview"
        edit={() => edit(1)}
        lines={[
          draft.title,
          labels[draft.originScopeType],
          draft.summary,
          `Confidence: ${draft.confidenceLevel}`,
        ]}
      />
      <Summary
        title={`Journey legs (${draft.legs.length})`}
        edit={() => edit(2)}
        lines={draft.legs.map(
          (l) => `${l.sequenceNumber}. ${l.fromLabel} → ${l.toLabel}`,
        )}
      />
      <Summary
        title={`Sources (${draft.sources.length})`}
        edit={() => edit(3)}
        lines={draft.sources.map((s) => s.title)}
      />
      <p className="mt-5 rounded-xl bg-primary-light/30 p-4 text-[10px] text-muted">
        ⓘ This guide will be saved as a draft and will not be visible to
        travelers until reviewed and published.
      </p>
    </>
  );
}
function Summary({
  title,
  lines,
  edit,
}: {
  title: string;
  lines: string[];
  edit: () => void;
}) {
  return (
    <section className="mb-3 rounded-xl border p-4">
      <header className="flex justify-between">
        <b className="text-xs">{title}</b>
        <button onClick={edit} className="text-xs font-bold text-primary">
          Edit
        </button>
      </header>
      <ul className="mt-3 space-y-1 text-[10px] text-muted">
        {lines.map((x, i) => (
          <li key={i}>{x || "—"}</li>
        ))}
      </ul>
    </section>
  );
}

export function JourneyGuideAdmin() {
  const [rows, setRows] = useState<Guide[]>([]),
    [loading, setLoading] = useState(true),
    [status, setStatus] = useState(""),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [builder, setBuilder] = useState<Detail | "new" | null>(null),
    [detail, setDetail] = useState<Detail | null>(null),
    [confirm, setConfirm] = useState<{ guide: Guide; action: string } | null>(
      null,
    ),
    [busy, setBusy] = useState(false),
    [toast, setToast] = useState<{ type: "ok" | "error"; text: string } | null>(
      null,
    ),
    [states, setStates] = useState<Place[]>([]),
    [camps, setCamps] = useState<Place[]>([]),
    [hubs, setHubs] = useState<Place[]>([]);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [g, s, c, h] = await Promise.all([
        api<Guide[]>("/admin/journey-guides"),
        api<Place[]>("/locations/states"),
        api<Place[]>("/orientation-camps"),
        api<Place[]>("/travel-hubs"),
      ]);
      setRows(g);
      setStates(s);
      setCamps(c);
      setHubs(h);
    } catch {
      setToast({
        type: "error",
        text: "We couldn't load journey guides. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    setPage(1);
  }, [status, search]);
  const filtered = useMemo(
    () =>
      rows.filter(
        (g) =>
          (!status || g.status === status) &&
          g.title.toLowerCase().includes(search.toLowerCase()),
      ),
    [rows, status, search],
  );
  const pageRows = filtered.slice((page - 1) * 10, page * 10);
  const counts = Object.fromEntries(
    statuses.map((s) => [
      s,
      s ? rows.filter((g) => g.status === s).length : rows.length,
    ]),
  );
  async function open(g: Guide) {
    try {
      setDetail(await api<Detail>(`/admin/journey-guides/${g.id}`));
    } catch {
      setToast({ type: "error", text: "We couldn't open this guide." });
    }
  }
  async function edit(g: Guide) {
    try {
      setBuilder(await api<Detail>(`/admin/journey-guides/${g.id}`));
      setDetail(null);
    } catch {
      setToast({ type: "error", text: "We couldn't load the guide editor." });
    }
  }
  async function transition() {
    if (!confirm) return;
    setBusy(true);
    try {
      const updated = await api<Guide>(
        `/admin/journey-guides/${confirm.guide.id}/${confirm.action}`,
        { method: "POST" },
      );
      setRows((v) => v.map((g) => (g.id === updated.id ? updated : g)));
      const messages: Record<string, string> = {
        "submit-review": "Submitted for review",
        publish: "Guide published",
        "mark-review": "Marked as needs review",
        retire: "Guide retired",
      };
      setToast({ type: "ok", text: messages[confirm.action] });
      setConfirm(null);
    } catch {
      setToast({
        type: "error",
        text: "We couldn't update the guide. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }
  function saved(g: Guide) {
    setRows((v) => {
      const exists = v.some((x) => x.id === g.id);
      return exists ? v.map((x) => (x.id === g.id ? g : x)) : [g, ...v];
    });
    setBuilder(null);
    setToast({ type: "ok", text: "Guide created" });
  }
  return (
    <Shell>
      <main className="p-4 pb-24 sm:p-6 lg:p-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row">
          <div>
            <h1 className="text-3xl font-black tracking-[-.04em]">
              Journey Guides
            </h1>
            <p className="mt-1 text-xs text-muted">
              Create, review, publish, flag, and retire structured guidance.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              aria-label="Search guides"
              className="field max-w-xs"
              placeholder="Search guides..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              onClick={() => setBuilder("new")}
              className="btn-primary whitespace-nowrap"
            >
              ＋ Create guide
            </button>
          </div>
        </header>
        {loading ? (
          <div className="mt-6">
            <Skeleton />
          </div>
        ) : (
          <>
            <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              {[
                ["Total guides", ""],
                ["Draft", "DRAFT"],
                ["Under review", "UNDER_REVIEW"],
                ["Published", "PUBLISHED"],
                ["Needs review", "NEEDS_REVIEW"],
                ["Retired", "RETIRED"],
              ].map(([l, s]) => (
                <button
                  key={l}
                  onClick={() => setStatus(s)}
                  className="rounded-xl border bg-white p-4 text-left shadow-sm"
                >
                  <b className="text-2xl">{counts[s]}</b>
                  <span className="mt-1 block text-[10px] text-muted">{l}</span>
                </button>
              ))}
            </section>
            <section className="mt-4 overflow-hidden rounded-xl border bg-white">
              <div
                className="flex overflow-x-auto border-b px-3"
                role="tablist"
              >
                {statuses.map((s) => (
                  <button
                    role="tab"
                    aria-selected={status === s}
                    onClick={() => setStatus(s)}
                    key={s || "ALL"}
                    className={`min-h-12 whitespace-nowrap border-b-2 px-4 text-[10px] font-bold ${status === s ? "border-primary text-primary" : "border-transparent text-muted"}`}
                  >
                    {s ? labels[s] : "All"} ({counts[s]})
                  </button>
                ))}
              </div>
              {!pageRows.length ? (
                <div className="p-14 text-center">
                  <h2 className="font-black">
                    {status
                      ? `No ${labels[status].toLowerCase()} guides yet.`
                      : "No guides found."}
                  </h2>
                  <button
                    onClick={() => {
                      setStatus("");
                      setSearch("");
                    }}
                    className="mt-4 text-xs font-bold text-primary"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                <>
                  <table className="hidden w-full text-left text-xs md:table">
                    <thead className="sticky top-0 bg-background text-[9px] uppercase text-muted">
                      <tr>
                        {[
                          "Title",
                          "Scope",
                          "Status",
                          "Confidence",
                          "Version",
                          "Reviewed",
                          "Actions",
                        ].map((h) => (
                          <th key={h} className="p-3">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((g) => (
                        <tr
                          key={g.id}
                          className="border-t hover:bg-background/60"
                        >
                          <td className="p-3 font-bold">
                            <button
                              onClick={() => void open(g)}
                              className="text-left hover:text-primary"
                            >
                              {g.title}
                            </button>
                          </td>
                          <td className="p-3">{labels[g.originScopeType]}</td>
                          <td className="p-3">
                            <Badge value={g.status} />
                          </td>
                          <td className="p-3">
                            <Badge value={g.confidenceLevel} />
                          </td>
                          <td className="p-3">v{g.version}</td>
                          <td className="p-3">
                            {g.lastReviewedAt
                              ? new Date(g.lastReviewedAt).toLocaleDateString(
                                  "en-NG",
                                )
                              : "—"}
                          </td>
                          <td className="p-3">
                            <Menu
                              guide={g}
                              open={() => void open(g)}
                              edit={() => void edit(g)}
                              act={(action) => setConfirm({ guide: g, action })}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="grid gap-3 p-3 md:hidden">
                    {pageRows.map((g) => (
                      <article key={g.id} className="rounded-xl border p-4">
                        <div className="flex justify-between gap-3">
                          <button
                            onClick={() => void open(g)}
                            className="text-left text-sm font-black"
                          >
                            {g.title}
                          </button>
                          <Menu
                            guide={g}
                            open={() => void open(g)}
                            edit={() => void edit(g)}
                            act={(action) => setConfirm({ guide: g, action })}
                          />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge value={g.status} />
                          <Badge value={g.confidenceLevel} />
                          <span className="text-[10px] text-muted">
                            {labels[g.originScopeType]} · v{g.version}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                  <footer className="flex items-center justify-between border-t p-4 text-[10px] text-muted">
                    <span>
                      Showing {(page - 1) * 10 + 1}–
                      {Math.min(page * 10, filtered.length)} of{" "}
                      {filtered.length}
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={page === 1}
                        onClick={() => setPage((v) => v - 1)}
                        className="h-9 w-9 rounded-lg border"
                      >
                        ←
                      </button>
                      <span className="grid h-9 min-w-9 place-items-center rounded-lg bg-primary-light font-bold text-primary">
                        {page}
                      </span>
                      <button
                        disabled={page * 10 >= filtered.length}
                        onClick={() => setPage((v) => v + 1)}
                        className="h-9 w-9 rounded-lg border"
                      >
                        →
                      </button>
                    </div>
                  </footer>
                </>
              )}
            </section>
          </>
        )}
      </main>
      {builder && (
        <Builder
          initial={builder === "new" ? undefined : builder}
          states={states}
          camps={camps}
          hubs={hubs}
          onClose={() => setBuilder(null)}
          onSaved={saved}
        />
      )}{" "}
      {detail && (
        <DetailPanel
          detail={detail}
          onClose={() => setDetail(null)}
          onEdit={() => void edit(detail.guide)}
        />
      )}
      <Confirm
        item={confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => void transition()}
        busy={busy}
      />
      {toast && (
        <div
          role={toast.type === "error" ? "alert" : "status"}
          className={`fixed bottom-6 right-6 z-[60] max-w-sm rounded-xl border bg-white p-4 text-xs font-bold shadow-xl ${toast.type === "error" ? "border-danger/20 text-danger" : "border-success/20 text-success"}`}
        >
          <button onClick={() => setToast(null)} className="float-right ml-5">
            ×
          </button>
          {toast.text}
        </div>
      )}
    </Shell>
  );
}
function Menu({
  guide,
  open,
  edit,
  act,
}: {
  guide: Guide;
  open: () => void;
  edit: () => void;
  act: (a: string) => void;
}) {
  return (
    <details className="relative">
      <summary
        className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-lg border"
        aria-label={`Actions for ${guide.title}`}
      >
        ⋯
      </summary>
      <div className="absolute right-0 z-20 mt-1 grid w-44 rounded-xl border bg-white p-2 shadow-xl">
        <button onClick={open} className="p-2 text-left">
          View details
        </button>
        {["DRAFT", "NEEDS_REVIEW"].includes(guide.status) && (
          <button onClick={edit} className="p-2 text-left">
            {guide.status === "NEEDS_REVIEW" ? "Create new version" : "Edit"}
          </button>
        )}
        {guide.status === "DRAFT" && (
          <button
            onClick={() => act("submit-review")}
            className="p-2 text-left"
          >
            Submit for review
          </button>
        )}
        {guide.status === "UNDER_REVIEW" && (
          <button onClick={() => act("publish")} className="p-2 text-left">
            Publish
          </button>
        )}
        {guide.status === "PUBLISHED" && (
          <button
            onClick={() => act("mark-review")}
            className="p-2 text-left text-amber-700"
          >
            Mark needs review
          </button>
        )}
        {guide.status === "NEEDS_REVIEW" && (
          <button
            onClick={() => act("retire")}
            className="p-2 text-left text-danger"
          >
            Retire
          </button>
        )}
      </div>
    </details>
  );
}
