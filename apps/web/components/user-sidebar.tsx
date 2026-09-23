"use client";

import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  GitCompareArrows,
  House,
  LogOut,
  MessageCircle,
  Route,
  Settings,
  ShieldCheck,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

export type UserSidebarItem =
  | "Dashboard"
  | "My Trips"
  | "Matches"
  | "Travel Circle"
  | "Messages"
  | "Journey Safety"
  | "Safety Centre"
  | "Profile";
const navigation: Array<{
  label: UserSidebarItem;
  href: string;
  icon: LucideIcon;
}> = [
  { label: "Dashboard", href: "/app", icon: House },
  { label: "My Trips", href: "/travel-plans", icon: BriefcaseBusiness },
  { label: "Matches", href: "/matching", icon: GitCompareArrows },
  { label: "Travel Circle", href: "/circle", icon: UsersRound },
  { label: "Messages", href: "/circle#circle-chat", icon: MessageCircle },
  { label: "Journey Safety", href: "/journey", icon: Route },
  { label: "Safety Centre", href: "/safety", icon: ShieldCheck },
  { label: "Profile", href: "/profile", icon: UserRound },
];
export function UserBrand() {
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
export function UserSidebar({
  active,
  unreadMessages = 0,
}: {
  active: UserSidebarItem;
  unreadMessages?: number;
}) {
  const pathname = usePathname();
  const [matchAttention, setMatchAttention] = useState(false);
  const [circleAttention, setCircleAttention] = useState(false);
  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const [match, circle] = await Promise.all([api<{ circle: unknown | null; alternativeOfferAvailable: boolean }>("/matching/status"), api<{ meetup: { id: string; updatedAt?: string; createdAt?: string } | null }>("/travel-circles/current")]);
        if (!alive) return;
        const matchKey = match.circle ? String((match.circle as { id?: string }).id ?? "circle") : match.alternativeOfferAvailable ? "offer" : "";
        if (pathname === "/matching" || pathname.startsWith("/matching/")) window.localStorage.setItem("kopa-padi:match-seen", matchKey);
        const matchSeen = matchKey !== "" && window.localStorage.getItem("kopa-padi:match-seen") === matchKey;
        const meetupKey = circle.meetup ? circle.meetup.id + ":" + (circle.meetup.updatedAt ?? circle.meetup.createdAt ?? "") : "";
        const meetupSeen = meetupKey !== "" && window.localStorage.getItem("kopa-padi:meetup-seen") === meetupKey;
        setMatchAttention(Boolean(match.circle || match.alternativeOfferAvailable) && !matchSeen);
        setCircleAttention(Boolean(circle.meetup) && !meetupSeen && !(pathname === "/circle" || pathname.startsWith("/circle/")));
      } catch {}
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 15000);
    return () => { alive = false; window.clearInterval(timer); };
  }, [pathname]);
  useEffect(() => {
    if (pathname === "/matching" || pathname.startsWith("/matching/")) window.localStorage.setItem("kopa-padi:match-seen", "true");
    if (pathname === "/circle" || pathname.startsWith("/circle/")) window.localStorage.setItem("kopa-padi:meetup-seen", "visited");
  }, [pathname]);
  async function signOut() {
    await authClient.signOut();
    location.assign("/login");
  }
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-border bg-white p-5 lg:flex lg:flex-col">
      <UserBrand />
      <nav className="mt-9 grid gap-1" aria-label="Application navigation">
        {navigation.map((item) => {
          const current = item.label === active;
          const Icon = item.icon;
          const attention = item.label === "Matches" ? matchAttention : item.label === "Travel Circle" ? circleAttention : false;
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={current ? "page" : undefined}
              className={`relative flex min-h-11 items-center gap-3 rounded-xl px-4 text-[13px] font-semibold transition ${current ? "bg-primary/10 text-primary before:absolute before:-left-5 before:h-7 before:w-1 before:bg-primary" : "text-slate-600 hover:bg-background hover:text-primary"}`}
            >
              <Icon aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={1.8} />
              <span>{item.label}</span>
              {attention ? <span className="ml-auto h-2.5 w-2.5 rounded-full bg-red-500 shadow-sm" title={item.label === "Matches" ? "New match available" : "Meetup update available"} aria-label={item.label === "Matches" ? "New match available" : "Meetup update available"} /> : null}
              {item.label === "Messages" && unreadMessages > 0 ? (
                <b className="ml-auto grid min-w-5 place-items-center rounded-full bg-danger px-1.5 py-0.5 text-[10px] text-white">
                  {unreadMessages}
                </b>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <p className="mt-auto px-3 pb-5 font-serif text-lg italic leading-7 text-primary">
        Safer journeys.
        <br />
        Stronger connections.
      </p>
      <div className="border-t pt-3">
        <Link
          href="/verification"
          className="flex min-h-11 items-center gap-3 rounded-xl px-4 text-[13px] font-semibold text-slate-600 hover:bg-background hover:text-primary"
        >
          <Settings aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={1.8} />
          Settings
        </Link>
        <button
          type="button"
          onClick={() => void signOut()}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-4 text-[13px] font-semibold text-slate-600 hover:bg-background hover:text-primary"
        >
          <LogOut aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={1.8} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
