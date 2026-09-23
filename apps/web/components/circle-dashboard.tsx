"use client";
import { AppIcon, type AppIconName } from "./app-icon";

import { api } from "@/lib/api";
import Link from "next/link";
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { UserSidebar } from "./user-sidebar";

type Member = {
  userId: string;
  displayName: string | null;
  membershipStatus: "JOINED" | "CONFIRMED";
  confirmedAt: string | null;
  verificationStatus: string;
};
type Meetup = {
  id: string;
  areaLabel: string;
  locationDescription: string;
  status: string;
  proposedByUserId: string | null;
  confirmations: Array<{ userId: string }>;
} | null;
type CircleData = {
  circle: {
    id: string;
    status: string;
    memberCount: number;
    maxMembers: number;
    travelDate: string;
    departureWindow: string;
    transportMode: string;
  };
  membership: { userId: string; membershipStatus: string };
  destination: { name: string; address: string | null };
  originHub: { name: string } | null;
  members: Member[];
  meetup: Meetup;
  unreadCount: number;
  notifications: Array<{ id: string; body: string; type: string }>;
};
type Message = {
  id: string;
  type: "TEXT" | "SYSTEM" | "SAFETY_NOTICE";
  body: string;
  senderUserId: string | null;
  senderDisplayName: string | null;
  createdAt: string;
  deletedAt: string | null;
};
type MessagePage = {
  messages: Message[];
  hasMore: boolean;
  nextCursor: string | null;
};
type MobileTab = "chat" | "members" | "meetup";
type ConfirmState = {
  title: string;
  copy: string;
  actionLabel: string;
  run: () => Promise<void>;
} | null;

const POLL_INTERVAL_MS = Number(
  process.env.NEXT_PUBLIC_CIRCLE_POLL_INTERVAL_MS ?? 5000,
);
const label = (value: string) =>
  value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
function travelDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat("en-NG", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
}
function messageTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat("en-NG", {
        hour: "numeric",
        minute: "2-digit",
      }).format(date);
}
function initials(name: string | null) {
  return name
    ? name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : "KP";
}

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
function Avatar({
  member,
  small = false,
}: {
  member: Member;
  small?: boolean;
}) {
  return (
    <span
      className={`circle-avatar ${small ? "small" : ""}`}
      aria-hidden="true"
    >
      {initials(member.displayName)}
      <span className="circle-avatar-status">
        <Icon name="check" size={8} />
      </span>
    </span>
  );
}
function Brand() {
  return (
    <Link href="/" className="circle-brand" aria-label="Kopa-Padi home">
      <span className="circle-brand-mark">
        <Icon name="people" size={23} />
      </span>
      <span>
        <b>Kopa-Padi</b>
        <small>Travel together. Go further.</small>
      </span>
    </Link>
  );
}

function AppSidebar({ unreadCount }: { unreadCount: number }) {
  return <UserSidebar active="Travel Circle" unreadMessages={unreadCount} />;
}

function TopBar({ me }: { me?: Member }) {
  return (
    <header className="circle-topbar">
      <label className="circle-search">
        <span className="sr-only">Search trips, matches or messages</span>
        <Icon name="search" size={18} />
        <input placeholder="Search trips, matches or messages…" />
        <kbd>⌘ K</kbd>
      </label>
      <button
        type="button"
        className="circle-icon-button"
        aria-label="Notifications"
      >
        <Icon name="bell" />
        <span className="circle-notification-dot" />
      </button>
      <div className="circle-user">
        {me ? (
          <Avatar member={me} />
        ) : (
          <span className="circle-avatar">KP</span>
        )}
        <span>
          <b>{me?.displayName ?? "Kopa-Padi traveler"}</b>
          <small>
            <Icon name="shield" size={12} /> Verified traveler
          </small>
        </span>
      </div>
    </header>
  );
}

function MobileTopBar() {
  return (
    <header className="circle-mobile-topbar">
      <Link href="/travel-plans" aria-label="Back to my trips">
        ←
      </Link>
      <b>Travel Circle</b>
      <span>
        <Link href="/safety" aria-label="Safety tools">
          <Icon name="shield" />
        </Link>
        <button type="button" aria-label="More Circle options">
          <Icon name="more" />
        </button>
      </span>
    </header>
  );
}

function PageHeader() {
  return (
    <header className="circle-page-header circle-enter">
      <Link href="/travel-plans" className="circle-back-link">
        ← <span>Back to My Trips</span>
      </Link>
      <div>
        <h1>Your Travel Circle</h1>
        <p>
          Coordinate with your verified companions and keep meetup plans public
          and safety-first.
        </p>
      </div>
      <div className="circle-header-art" aria-hidden="true">
        <span>
          Good people
          <br />
          lead to great journeys.
        </span>
      </div>
    </header>
  );
}

function JourneyOverview({ data }: { data: CircleData }) {
  const confirmed = data.members.filter(
    (member) => member.membershipStatus === "CONFIRMED",
  ).length;
  const progress = data.circle.memberCount
    ? Math.min(100, (confirmed / data.circle.memberCount) * 100)
    : 0;
  const locked = data.circle.status === "LOCKED";
  return (
    <section
      className="circle-journey-card circle-enter"
      aria-labelledby="journey-title"
    >
      <h2 id="journey-title" className="sr-only">
        Journey overview
      </h2>
      <div className="circle-route">
        <div className="circle-place">
          <Icon name="pin" />
          <span>
            <b>{data.originHub?.name ?? "Departure hub"}</b>
            <small>Starting point</small>
          </span>
        </div>
        <div className="circle-route-line">
          <span />
          <Icon name="car" />
          <span />
          <Icon name="arrow" size={14} />
        </div>
        <div className="circle-place">
          <Icon name="pin" />
          <span>
            <b>{data.destination.name}</b>
            <small>{data.destination.address ?? "Destination"}</small>
          </span>
        </div>
      </div>
      <div className="circle-trip-facts">
        <span>
          <Icon name="calendar" />
          <b>{travelDate(data.circle.travelDate)}</b>
        </span>
        <span>
          <Icon name="clock" />
          <b>{label(data.circle.departureWindow)}</b>
        </span>
        <span>
          <Icon name="car" />
          <b>{label(data.circle.transportMode)}</b>
        </span>
      </div>
      <div className="circle-confirmation-summary">
        <span className={locked ? "locked" : ""}>
          <small>Circle status</small>
          <b>
            {locked ? <Icon name="lock" size={14} /> : <i />}
            {label(data.circle.status)}
          </b>
        </span>
        <p>
          <b>
            <Icon name="people" size={17} /> {confirmed} of{" "}
            {data.circle.memberCount} confirmed
          </b>
        </p>
        <div
          className="circle-progress"
          aria-label={`${confirmed} of ${data.circle.memberCount} members confirmed`}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
        <small>
          {confirmed}/{data.circle.memberCount}
        </small>
      </div>
      {locked ? (
        <p className="circle-lock-note">
          <Icon name="lock" size={14} /> Circle locked — no new members can be
          added.
        </p>
      ) : null}
    </section>
  );
}

function ConfirmationBanner({
  confirmed,
  busy,
  onConfirm,
}: {
  confirmed: boolean;
  busy: boolean;
  onConfirm: () => void;
}) {
  return confirmed ? (
    <div className="circle-confirmed-note circle-enter">
      <span>
        <Icon name="check" />
      </span>
      <p>
        <b>Journey confirmed</b>Your Circle knows you’re still travelling.
      </p>
    </div>
  ) : (
    <section
      className="circle-confirm-banner circle-enter"
      aria-labelledby="confirm-title"
    >
      <span className="circle-warning-icon">
        <Icon name="warning" />
      </span>
      <div>
        <h2 id="confirm-title">Confirm you&apos;re still travelling</h2>
        <p>Please confirm so your circle can make final plans.</p>
      </div>
      <button
        className="circle-primary-button"
        disabled={busy}
        onClick={onConfirm}
      >
        {busy ? "Confirming…" : "Confirm I’m still travelling"}
      </button>
    </section>
  );
}

function NotificationList({
  notifications,
  busy,
  onDismiss,
}: {
  notifications: CircleData["notifications"];
  busy: boolean;
  onDismiss: (id: string) => void;
}) {
  if (!notifications.length) return null;
  return (
    <div className="circle-notification-list">
      {notifications.map((notification) => (
        <section key={notification.id} role="status">
          <Icon
            name={notification.type === "CIRCLE_LOCKED" ? "lock" : "bell"}
          />
          <p>
            <b>
              {notification.type === "CIRCLE_LOCKED"
                ? "Circle locked"
                : "Travel update"}
            </b>
            {notification.body}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => onDismiss(notification.id)}
            aria-label="Dismiss notification"
          >
            <Icon name="close" size={16} />
          </button>
        </section>
      ))}
    </div>
  );
}

function ChatMessage({
  message,
  own,
  onDelete,
}: {
  message: Message;
  own: boolean;
  onDelete: () => void;
}) {
  if (message.type === "SYSTEM")
    return (
      <li className="circle-system-message">
        <span>
          <Icon name="check" size={13} />
        </span>
        <p>
          {message.body}
          <time dateTime={message.createdAt}>
            {messageTime(message.createdAt)}
          </time>
        </p>
      </li>
    );
  if (message.type === "SAFETY_NOTICE")
    return (
      <li className="circle-safety-message">
        <span>
          <Icon name="shield" />
        </span>
        <p>
          <b>Safety reminder</b>
          {message.body}
        </p>
        <time dateTime={message.createdAt}>
          {messageTime(message.createdAt)}
        </time>
      </li>
    );
  return (
    <li className={`circle-user-message ${own ? "own" : ""}`}>
      {!own ? (
        <span className="circle-message-avatar">
          {initials(message.senderDisplayName)}
        </span>
      ) : null}
      <div className="circle-message-content">
        <div className="circle-message-meta">
          <b>{own ? "You" : (message.senderDisplayName ?? "Verified PCM")}</b>
          <time dateTime={message.createdAt}>
            {messageTime(message.createdAt)}
          </time>
        </div>
        <div className="circle-message-bubble">
          {message.deletedAt ? <em>Message deleted</em> : message.body}
        </div>
        {own ? (
          <div className="circle-delivery">
            {message.deletedAt ? null : (
              <>
                <span>Delivered</span>
                <span aria-hidden="true">✓✓</span>
                <button type="button" onClick={onDelete}>
                  Delete
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>
    </li>
  );
}

function CircleChat(props: {
  messages: Message[];
  unreadCount: number;
  hasOlder: boolean;
  body: string;
  busy: boolean;
  me: string;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  hasNewMessages: boolean;
  onScroll: () => void;
  onLoadOlder: () => void;
  onBodyChange: (value: string) => void;
  onSend: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: (id: string) => void;
  onJumpToLatest: () => void;
}) {
  const {
    messages,
    unreadCount,
    hasOlder,
    body,
    busy,
    me,
    viewportRef,
    hasNewMessages,
    onScroll,
    onLoadOlder,
    onBodyChange,
    onSend,
    onDelete,
    onJumpToLatest,
  } = props;
  return (
    <section
      id="circle-chat"
      className="circle-chat-card circle-enter"
      aria-labelledby="chat-title"
    >
      <header>
        <div>
          <h2 id="chat-title">Circle Chat</h2>
          <span className="circle-live">
            <i /> Live <small>(updates every 5 seconds)</small>
          </span>
        </div>
        {unreadCount > 0 ? (
          <b>{unreadCount} new messages</b>
        ) : (
          <small>Up to date</small>
        )}
      </header>
      <div
        className="circle-chat-viewport"
        ref={viewportRef}
        onScroll={onScroll}
      >
        {hasOlder ? (
          <button
            className="circle-load-older"
            type="button"
            onClick={onLoadOlder}
          >
            Load older messages
          </button>
        ) : null}
        <ol aria-live="polite" aria-relevant="additions">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              own={message.senderUserId === me}
              onDelete={() => onDelete(message.id)}
            />
          ))}
        </ol>
        {hasNewMessages ? (
          <button
            className="circle-new-message-button"
            onClick={onJumpToLatest}
          >
            New messages ↓
          </button>
        ) : null}
      </div>
      <form className="circle-composer" onSubmit={onSend}>
        <label>
          <span className="sr-only">Message</span>
          <textarea
            value={body}
            maxLength={2000}
            required
            onChange={(event) => onBodyChange(event.target.value)}
            placeholder="Write a message…"
            rows={1}
          />
        </label>
        <button
          className="circle-send-button"
          aria-label="Send message"
          disabled={busy || !body.trim()}
        >
          <Icon name="send" />
        </button>
      </form>
    </section>
  );
}

function MemberRow(props: {
  member: Member;
  isMe: boolean;
  busy: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onReport: () => void;
  onBlock: () => void;
}) {
  const { member, isMe, busy, menuOpen, onToggleMenu, onReport, onBlock } =
    props;
  const confirmed = member.membershipStatus === "CONFIRMED";
  return (
    <li className="circle-member-row">
      <Avatar member={member} />
      <div>
        <b>
          {member.displayName ?? "Verified PCM"}
          {isMe ? " (You)" : ""}
        </b>
        <span className="circle-verified">
          <Icon name="check" size={10} /> Verified
        </span>
      </div>
      <span
        className={`circle-member-status ${confirmed ? "confirmed" : "waiting"}`}
      >
        <Icon name={confirmed ? "check" : "warning"} size={12} />
        {confirmed ? "Confirmed" : "Waiting confirmation"}
      </span>
      {!isMe ? (
        <div className="circle-member-menu">
          <button
            type="button"
            disabled={busy}
            aria-label={`Actions for ${member.displayName ?? "member"}`}
            aria-expanded={menuOpen}
            onClick={onToggleMenu}
          >
            <Icon name="more" />
          </button>
          {menuOpen ? (
            <div role="menu">
              <button role="menuitem" type="button" onClick={onReport}>
                Report user
              </button>
              <button
                role="menuitem"
                type="button"
                className="danger"
                onClick={onBlock}
              >
                Block user
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function CircleMembers(props: {
  data: CircleData;
  busy: boolean;
  openMember: string | null;
  onToggleMember: (id: string) => void;
  onReport: (id: string) => void;
  onBlock: (member: Member) => void;
}) {
  const { data, busy, openMember, onToggleMember, onReport, onBlock } = props;
  return (
    <section
      className="circle-side-card circle-members-card circle-stagger"
      aria-labelledby="members-title"
    >
      <header>
        <h2 id="members-title">
          Circle Members <span>({data.members.length})</span>
        </h2>
      </header>
      <ul>
        {data.members.map((member) => (
          <MemberRow
            key={member.userId}
            member={member}
            isMe={member.userId === data.membership.userId}
            busy={busy}
            menuOpen={openMember === member.userId}
            onToggleMenu={() => onToggleMember(member.userId)}
            onReport={() => onReport(member.userId)}
            onBlock={() => onBlock(member)}
          />
        ))}
      </ul>
    </section>
  );
}

function MeetupCard(props: {
  data: CircleData;
  areaLabel: string;
  locationDescription: string;
  busy: boolean;
  onAreaChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onPropose: (event: FormEvent<HTMLFormElement>) => void;
  onUpdate: (event: FormEvent<HTMLFormElement>) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onReport: () => void;
}) {
  const {
    data,
    areaLabel,
    locationDescription,
    busy,
    onAreaChange,
    onLocationChange,
    onPropose,
    onUpdate,
    onConfirm,
    onCancel,
    onReport,
  } = props;
  const meetup = data.meetup;
  const confirmed = meetup?.confirmations.length ?? 0;
  const total = data.circle.memberCount;
  const isConfirmed = meetup?.confirmations.some(
    (entry) => entry.userId === data.membership.userId,
  );
  const proposer = data.members.find(
    (member) => member.userId === meetup?.proposedByUserId,
  );
  return (
    <section
      className="circle-side-card circle-meetup-card circle-stagger"
      aria-labelledby="meetup-title"
    >
      <header>
        <h2 id="meetup-title">Public Meetup</h2>
        {meetup ? <Icon name="more" /> : null}
      </header>
      {meetup ? (
        <>
          <p className="circle-proposer">
            {proposer ? <Avatar member={proposer} small /> : null} Proposed by{" "}
            {proposer?.displayName ?? "a Circle member"}
          </p>
          {meetup.status === "PROPOSED" ? <form className="circle-meetup-form" onSubmit={onUpdate}>
            <label>Area or landmark<input value={areaLabel || meetup.areaLabel} maxLength={120} required onChange={(event) => onAreaChange(event.target.value)} /></label>
            <label>Public meeting point<textarea value={locationDescription || meetup.locationDescription} maxLength={500} required onChange={(event) => onLocationChange(event.target.value)} /></label>
            <button className="circle-secondary-button full" disabled={busy}>Update suggestion</button>
          </form> : <div className="circle-meetup-location">
            <Icon name="pin" />
            <p><b>{meetup.areaLabel}</b><span>{meetup.locationDescription}</span></p>
          </div>}
          <div className="circle-meetup-location">
            <Icon name="calendar" />
            <p>
              <b>{travelDate(data.circle.travelDate)}</b>
              <span>Journey date</span>
            </p>
          </div>
          <p className="circle-public-badge">
            <Icon name="shield" size={15} />
            <span>
              <b>Public location</b>This is a public meetup suggestion.
            </span>
          </p>
          <div className="circle-meetup-progress">
            <b>
              Confirmed ({confirmed} of {total})
            </b>
            <div className="circle-progress">
              <span
                style={{
                  width: `${total ? Math.min(100, (confirmed / total) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
          <button
            className="circle-primary-button full"
            disabled={busy || isConfirmed}
            onClick={onConfirm}
          >
            {isConfirmed ? "Meetup confirmed" : "Confirm Meetup"}
          </button>
          {meetup.proposedByUserId === data.membership.userId &&
          meetup.status === "PROPOSED" ? (
            <button
              className="circle-secondary-button full"
              disabled={busy}
              onClick={onCancel}
            >
              Cancel proposal
            </button>
          ) : null}
          <button
            className="circle-danger-outline full"
            disabled={busy}
            onClick={onReport}
          >
            Report unsafe suggestion
          </button>
        </>
      ) : (
        <form className="circle-meetup-form" onSubmit={onPropose}>
          <label>
            Area or landmark
            <input
              value={areaLabel}
              maxLength={120}
              required
              onChange={(event) => onAreaChange(event.target.value)}
              placeholder="Main motor park entrance"
            />
          </label>
          <label>
            Public meeting point
            <textarea
              value={locationDescription}
              maxLength={500}
              required
              onChange={(event) => onLocationChange(event.target.value)}
              placeholder="By the staffed ticket office, not outside the park"
            />
          </label>
          <button className="circle-primary-button full" disabled={busy}>
            Propose meetup
          </button>
        </form>
      )}
      <p className="circle-safety-copy">
        <Icon name="shield" size={16} /> Always meet in public, well-lit places
        with other people around.
      </p>
    </section>
  );
}

function SafetyTools() {
  const tools = [
    { label: "Share Trip", href: "/safety", icon: "route" as const },
    { label: "Emergency Contacts", href: "/safety", icon: "user" as const },
    { label: "Report a Concern", href: "/safety", icon: "warning" as const },
    { label: "SOS", href: "/safety", icon: "bell" as const, danger: true },
  ];
  return (
    <section className="circle-side-card circle-safety-tools circle-stagger">
      <h2>Safety Tools</h2>
      <div>
        {tools.map((tool) => (
          <Link
            key={tool.label}
            href={tool.href}
            className={tool.danger ? "danger" : ""}
          >
            <span>
              <Icon name={tool.icon} />
            </span>
            {tool.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function LeaveCircleCard({
  busy,
  onLeave,
}: {
  busy: boolean;
  onLeave: () => void;
}) {
  return (
    <section className="circle-side-card circle-leave-card circle-stagger">
      <div>
        <h2>Leave Circle</h2>
        <p>
          You can leave this Circle at any time. If you’re still travelling, you
          may return to matching before the lock cutoff.
        </p>
      </div>
      <button
        className="circle-danger-outline"
        disabled={busy}
        onClick={onLeave}
      >
        Leave Circle
      </button>
    </section>
  );
}

function MobileTabs({
  active,
  onChange,
}: {
  active: MobileTab;
  onChange: (tab: MobileTab) => void;
}) {
  return (
    <div
      className="circle-mobile-tabs"
      role="tablist"
      aria-label="Travel Circle sections"
    >
      {(["chat", "members", "meetup"] as const).map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={active === tab}
          onClick={() => onChange(tab)}
        >
          {label(tab)}
        </button>
      ))}
    </div>
  );
}

function MobileBottomNav({ unreadCount }: { unreadCount: number }) {
  const items = [
    { label: "Home", href: "/app", icon: "home" as const },
    { label: "Trips", href: "/travel-plans", icon: "trip" as const },
    { label: "Matches", href: "/matching", icon: "people" as const },
    { label: "Messages", href: "/circle#circle-chat", icon: "chat" as const },
    { label: "Profile", href: "/verification", icon: "user" as const },
  ];
  return (
    <nav className="circle-bottom-nav" aria-label="Mobile navigation">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={item.label === "Home" ? "active" : ""}
        >
          <span>
            <Icon name={item.icon} />
            {item.label === "Messages" && unreadCount > 0 ? (
              <b>{unreadCount}</b>
            ) : null}
          </span>
          <small>{item.label}</small>
        </Link>
      ))}
    </nav>
  );
}

function CircleSkeleton() {
  return (
    <div
      className="circle-app-shell circle-loading"
      aria-label="Loading your Travel Circle"
      role="status"
    >
      <aside className="circle-sidebar">
        <div className="circle-skeleton brand" />
        {Array.from({ length: 6 }, (_, index) => (
          <div className="circle-skeleton nav" key={index} />
        ))}
      </aside>
      <div className="circle-app-body">
        <div className="circle-skeleton topbar" />
        <main className="circle-content">
          <div className="circle-skeleton heading" />
          <div className="circle-skeleton journey" />
          <div className="circle-skeleton banner" />
          <div className="circle-workspace">
            <div className="circle-skeleton chat" />
            <div>
              <div className="circle-skeleton panel" />
              <div className="circle-skeleton panel" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function CircleEmptyState() {
  return (
    <div className="circle-app-shell">
      <AppSidebar unreadCount={0} />
      <div className="circle-app-body">
        <TopBar />
        <MobileTopBar />
        <main className="circle-empty-wrap">
          <section className="circle-empty-state">
            <div className="circle-empty-route" aria-hidden="true">
              <Icon name="pin" />
              <span />
              <Icon name="people" />
              <span />
              <Icon name="pin" />
            </div>
            <h1>No active travel circle yet</h1>
            <p>
              A travel circle will appear here after you’re matched with
              compatible travelers.
            </p>
            <Link className="circle-primary-button" href="/matching">
              Browse Matches <Icon name="arrow" size={16} />
            </Link>
            <small>
              Former members can’t access old Circle messages or meetup details.
            </small>
          </section>
        </main>
        <MobileBottomNav unreadCount={0} />
      </div>
    </div>
  );
}

function ConfirmDialog({
  state,
  busy,
  onClose,
}: {
  state: ConfirmState;
  busy: boolean;
  onClose: () => void;
}) {
  if (!state) return null;
  return (
    <div
      className="circle-dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="circle-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="circle-dialog-title"
        aria-describedby="circle-dialog-copy"
      >
        <button
          className="circle-dialog-close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <Icon name="close" />
        </button>
        <span className="circle-dialog-warning">
          <Icon name="warning" />
        </span>
        <h2 id="circle-dialog-title">{state.title}</h2>
        <p id="circle-dialog-copy">{state.copy}</p>
        <div>
          <button
            className="circle-secondary-button"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            className="circle-danger-button"
            onClick={state.run}
            disabled={busy}
          >
            {busy ? "Please wait…" : state.actionLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export function CircleDashboard() {
  const [data, setData] = useState<CircleData | null>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [olderCursor, setOlderCursor] = useState<string | null>(null);
  const [hasOlder, setHasOlder] = useState(false);
  const [body, setBody] = useState("");
  const [areaLabel, setAreaLabel] = useState("");
  const [locationDescription, setLocationDescription] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");
  const [openMember, setOpenMember] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const lastCursor = useRef<string | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);

  const refreshCircle = useCallback(async () => {
    const current = await api<CircleData | null>("/travel-circles/current");
    setData(current);
    return current;
  }, []);
  const scrollToLatest = useCallback((behavior: ScrollBehavior = "smooth") => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior });
    setHasNewMessages(false);
    nearBottomRef.current = true;
  }, []);
  const loadInitial = useCallback(async () => {
    const current = await refreshCircle();
    if (!current) return;
    const page = await api<MessagePage>(
      "/travel-circles/current/messages?limit=50",
    );
    setMessages(page.messages);
    setOlderCursor(page.nextCursor);
    setHasOlder(page.hasMore);
    const latest = page.messages.at(-1);
    if (latest) {
      lastCursor.current = BufferCursor(latest);
      await api("/travel-circles/current/messages/read", {
        method: "POST",
        body: JSON.stringify({ messageId: latest.id }),
      });
    }
    window.requestAnimationFrame(() => scrollToLatest("auto"));
  }, [refreshCircle, scrollToLatest]);

  useEffect(() => {
    void loadInitial().catch((reason) =>
      setError(
        reason instanceof Error ? reason.message : "Could not load your Circle",
      ),
    );
  }, [loadInitial]);
  useEffect(() => {
    if (!data) return;
    const timer = window.setInterval(async () => {
      try {
        const suffix = lastCursor.current
          ? `?after=${encodeURIComponent(lastCursor.current)}&limit=100`
          : "?limit=50";
        const page = await api<MessagePage>(
          `/travel-circles/current/messages${suffix}`,
        );
        if (page.messages.length) {
          const shouldFollow = nearBottomRef.current;
          setMessages((current) => {
            const seen = new Set(current.map((message) => message.id));
            return [
              ...current,
              ...page.messages.filter((message) => !seen.has(message.id)),
            ];
          });
          const latest = page.messages.at(-1)!;
          lastCursor.current = BufferCursor(latest);
          await api("/travel-circles/current/messages/read", {
            method: "POST",
            body: JSON.stringify({ messageId: latest.id }),
          });
          if (shouldFollow)
            window.requestAnimationFrame(() => scrollToLatest());
          else setHasNewMessages(true);
        }
        await refreshCircle();
      } catch {
        // A transient polling failure should not interrupt coordination.
      }
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [data?.circle.id, refreshCircle, scrollToLatest]);

  async function act(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(success);
      await loadInitial();
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Action failed");
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = body.trim();
    if (!text) return;
    const sent = await act(
      () =>
        api("/travel-circles/current/messages", {
          method: "POST",
          body: JSON.stringify({ body: text }),
        }),
      "Message sent.",
    );
    if (sent) setBody("");
  }
  async function propose(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const proposed = await act(
      () =>
        api("/travel-circles/current/meetup", {
          method: "POST",
          body: JSON.stringify({ areaLabel, locationDescription }),
        }),
      "Meetup proposed.",
    );
    if (proposed) {
      setAreaLabel("");
      setLocationDescription("");
    }
  }
  async function loadOlder() {
    if (!olderCursor) return;
    const viewport = viewportRef.current;
    const previousHeight = viewport?.scrollHeight ?? 0;
    const page = await api<MessagePage>(
      `/travel-circles/current/messages?before=${encodeURIComponent(olderCursor)}&limit=50`,
    );
    setMessages((current) => [...page.messages, ...current]);
    setOlderCursor(page.nextCursor);
    setHasOlder(page.hasMore);
    window.requestAnimationFrame(() => {
      if (viewport)
        viewport.scrollTop += viewport.scrollHeight - previousHeight;
    });
  }
  function handleChatScroll() {
    const viewport = viewportRef.current;
    if (!viewport) return;
    nearBottomRef.current =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 90;
    if (nearBottomRef.current) setHasNewMessages(false);
  }
  if (data === undefined && !error) return <CircleSkeleton />;
  if (data === null) return <CircleEmptyState />;
  if (!data)
    return (
      <main className="circle-fatal-error" role="alert">
        <Icon name="warning" />
        <h1>We couldn’t load your Circle</h1>
        <p>{error}</p>
        <button onClick={() => location.reload()}>Try again</button>
      </main>
    );

  const me = data.membership.userId;
  const meMember = data.members.find((member) => member.userId === me);
  const meetup = data.meetup;
  const requestLeave = () =>
    setConfirmState({
      title: "Leave this Travel Circle?",
      copy: "You will lose access to this Circle’s chat and meetup details. If you’re still travelling, you may return to matching before the lock cutoff.",
      actionLabel: "Leave Circle",
      run: async () => {
        const done = await act(
          () =>
            api("/travel-circles/current/leave", {
              method: "POST",
              body: JSON.stringify({ stillTravelling: true }),
            }),
          "You left the Circle.",
        );
        if (done) setConfirmState(null);
      },
    });

  return (
    <div className="circle-app-shell">
      <AppSidebar unreadCount={data.unreadCount} />
      <div className="circle-app-body">
        <TopBar me={meMember} />
        <MobileTopBar />
        <main className="circle-content">
          <PageHeader />
          {error ? (
            <p role="alert" className="circle-toast error">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p role="status" className="circle-toast success">
              <Icon name="check" size={15} />
              {notice}
            </p>
          ) : null}
          <JourneyOverview data={data} />
          <ConfirmationBanner
            confirmed={data.membership.membershipStatus === "CONFIRMED"}
            busy={busy}
            onConfirm={() =>
              void act(
                () =>
                  api("/travel-circles/current/confirm", { method: "POST" }),
                "Travel confirmed.",
              )
            }
          />
          <NotificationList
            notifications={data.notifications}
            busy={busy}
            onDismiss={(id) =>
              void act(
                () =>
                  api(`/travel-circles/current/notifications/${id}/read`, {
                    method: "POST",
                  }),
                "Notification dismissed.",
              )
            }
          />
          <MobileTabs active={mobileTab} onChange={setMobileTab} />
          <div className="circle-workspace">
            <div
              className="circle-mobile-panel"
              data-mobile-active={mobileTab === "chat"}
            >
              <CircleChat
                messages={messages}
                unreadCount={data.unreadCount}
                hasOlder={hasOlder}
                body={body}
                busy={busy}
                me={me}
                viewportRef={viewportRef}
                hasNewMessages={hasNewMessages}
                onScroll={handleChatScroll}
                onLoadOlder={() => void loadOlder()}
                onBodyChange={setBody}
                onSend={(event) => void send(event)}
                onDelete={(id) =>
                  void act(
                    () =>
                      api(`/travel-circles/current/messages/${id}`, {
                        method: "DELETE",
                      }),
                    "Message deleted.",
                  )
                }
                onJumpToLatest={() => scrollToLatest()}
              />
            </div>
            <aside className="circle-supporting-rail">
              <div
                className="circle-mobile-panel"
                data-mobile-active={mobileTab === "members"}
              >
                <CircleMembers
                  data={data}
                  busy={busy}
                  openMember={openMember}
                  onToggleMember={(id) =>
                    setOpenMember((current) => (current === id ? null : id))
                  }
                  onReport={(id) =>
                    void act(
                      () =>
                        api("/travel-circles/current/reports", {
                          method: "POST",
                          body: JSON.stringify({
                            reportedUserId: id,
                            category: "OTHER",
                          }),
                        }),
                      "Private safety report submitted.",
                    )
                  }
                  onBlock={(member) => {
                    setOpenMember(null);
                    setConfirmState({
                      title: `Block ${member.displayName ?? "this member"}?`,
                      copy: "They won’t be able to contact you. Blocking this member will also remove you from this Circle.",
                      actionLabel: "Block and leave",
                      run: async () => {
                        const done = await act(
                          () =>
                            api("/travel-circles/current/blocks", {
                              method: "POST",
                              body: JSON.stringify({ userId: member.userId }),
                            }),
                          "Member blocked. You have left the Circle.",
                        );
                        if (done) setConfirmState(null);
                      },
                    });
                  }}
                />
              </div>
              <div
                className="circle-mobile-panel"
                data-mobile-active={mobileTab === "meetup"}
              >
                <MeetupCard
                  data={data}
                  areaLabel={areaLabel}
                  locationDescription={locationDescription}
                  busy={busy}
                  onAreaChange={setAreaLabel}
                  onLocationChange={setLocationDescription}
                  onPropose={(event) => void propose(event)}
                  onUpdate={(event) => {
                    event.preventDefault();
                    if (!meetup) return;
                    void act(() => api('/travel-circles/current/meetup/' + meetup.id, { method: 'PATCH', body: JSON.stringify({ areaLabel: areaLabel || meetup.areaLabel, locationDescription: locationDescription || meetup.locationDescription }) }), 'Meetup suggestion updated.');
                  }}
                  onConfirm={() =>
                    meetup &&
                    void act(
                      () =>
                        api(
                          `/travel-circles/current/meetup/${meetup.id}/confirm`,
                          { method: "POST" },
                        ),
                      "Meetup confirmed.",
                    )
                  }
                  onCancel={() =>
                    meetup &&
                    void act(
                      () =>
                        api(
                          `/travel-circles/current/meetup/${meetup.id}/cancel`,
                          { method: "POST" },
                        ),
                      "Meetup cancelled.",
                    )
                  }
                  onReport={() =>
                    meetup &&
                    void act(
                      () =>
                        api("/travel-circles/current/reports", {
                          method: "POST",
                          body: JSON.stringify({
                            meetupId: meetup.id,
                            category: "UNSAFE_MEETUP",
                          }),
                        }),
                      "Unsafe meetup reported privately.",
                    )
                  }
                />
              </div>
              <div className="circle-desktop-only">
                <SafetyTools />
                <LeaveCircleCard busy={busy} onLeave={requestLeave} />
              </div>
            </aside>
          </div>
          <div className="circle-mobile-secondary">
            <SafetyTools />
            <LeaveCircleCard busy={busy} onLeave={requestLeave} />
          </div>
        </main>
        <MobileBottomNav unreadCount={data.unreadCount} />
      </div>
      <ConfirmDialog
        state={confirmState}
        busy={busy}
        onClose={() => !busy && setConfirmState(null)}
      />
    </div>
  );
}

function BufferCursor(message: Message) {
  return window
    .btoa(
      JSON.stringify({
        createdAt: new Date(message.createdAt).toISOString(),
        id: message.id,
      }),
    )
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}
