"use client";

import { AppIcon, type AppIconName } from "./app-icon";
import { UserBrand, UserSidebar } from "./user-sidebar";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";

type Profile = { firstName: string; lastNamePrivate: string; displayName: string };
type Overview = {
  user: { name: string; email: string; accountStatus: string; createdAt: string };
  profile: Profile | null;
  verification: { status: string; userSafeReason?: string | null };
  intake?: { serviceYear: string; batch: string; stream: string };
  camp?: { campName: string; stateName?: string | null };
};
type MeResponse = { user: Overview["user"] };
type VerificationStatus = Pick<Overview, "verification" | "intake" | "camp">;

const nav: Array<[AppIconName, string, string]> = [
  ["home", "Home", "/app"], ["trip", "Trips", "/travel-plans"], ["match", "Matches", "/matching"], ["circle", "Circle", "/circle"], ["profile", "Profile", "/profile"],
];
const label = (status: string) => ({
  VERIFIED: "Verified", SUBMITTED: "Submitted", UNDER_REVIEW: "Under review", REJECTED: "Not verified", RESUBMISSION_REQUIRED: "Action needed", UNVERIFIED: "Not started",
}[status] ?? "Not started");
const statusCopy = (status: string) => ({
  VERIFIED: "Your identity has been verified.", SUBMITTED: "Your verification is awaiting review.", UNDER_REVIEW: "Your verification is being reviewed.", REJECTED: "Your verification could not be approved.", RESUBMISSION_REQUIRED: "Please update and resubmit your verification.", UNVERIFIED: "Complete verification to unlock travel planning and matching.",
}[status] ?? "Complete verification to unlock travel planning and matching.");
const formatMonth = (value: string) => new Intl.DateTimeFormat("en-NG", { month: "long", year: "numeric" }).format(new Date(value));

function Icon({ name, size = 19 }: { name: AppIconName; size?: number }) { return <AppIcon name={name} size={size} />; }
function Avatar({ name }: { name: string }) { return <span className="profile-avatar" aria-label={`${name} profile avatar`}>{name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("") || "KP"}</span>; }
function Card({ icon, title, subtitle, children, className = "" }: { icon: AppIconName; title: string; subtitle: string; children: React.ReactNode; className?: string }) {
  return <section className={`profile-card ${className}`}><header><span className="profile-card-icon"><Icon name={icon} /></span><span><h2>{title}</h2><p>{subtitle}</p></span></header>{children}</section>;
}
function Loading() { return <main className="profile-main profile-loading" aria-busy="true"><i/><i/><i/><i/><span className="sr-only">Loading your profile</span></main>; }

export function ProfileDashboard() {
  const session = authClient.useSession();
  const [data, setData] = useState<Overview>();
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Profile>({ firstName: "", lastNamePrivate: "", displayName: "" });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    setError("");
    try {
      setData(await api<Overview>("/me/profile"));
    } catch {
      try {
        const [me, verification] = await Promise.all([
          api<MeResponse>("/me"),
          api<VerificationStatus>("/verification/status"),
        ]);
        setData({ ...verification, user: me.user, profile: null });
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "We could not load your profile.");
      }
    }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const accountName = data?.profile?.displayName || data?.user.name || session.data?.user.name || "Traveler";
  const verification = data?.verification.status ?? "UNVERIFIED";
  function beginEdit() { const profile = data?.profile; setForm(profile ?? { firstName: "", lastNamePrivate: "", displayName: accountName }); setNotice(""); setEditing(true); }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!form.firstName.trim() || !form.lastNamePrivate.trim() || form.displayName.trim().length < 2) { setNotice("Enter your first name, private last name, and a display name of at least two characters."); return; }
    setSaving(true); setNotice("");
    try { const profile = await api<Profile>("/me/profile", { method: "PUT", body: JSON.stringify(form) }); setData((current) => current ? { ...current, profile } : current); setEditing(false); setNotice("Your profile information was updated."); }
    catch { setNotice("We couldn't save your information. Please try again."); }
    finally { setSaving(false); }
  }
  async function signOut() { await authClient.signOut(); location.assign("/login"); }
  if (!data && !error) return <div className="profile-app"><UserSidebar active="Profile" /><div className="profile-shell"><ProfileTop name={accountName} verified={false}/><Loading/></div></div>;
  return <div className="profile-app"><UserSidebar active="Profile" /><div className="profile-shell"><ProfileTop name={accountName} verified={verification === "VERIFIED"}/>
    {error ? <main className="profile-main"><section className="profile-error" role="alert"><Icon name="warning" size={26}/><div><h1>We could not load your profile</h1><p>{error}</p><button className="profile-primary" onClick={() => void load()}>Try again</button></div></section></main> : data ? <main className="profile-main">
      <section className="profile-heading"><div><h1>My Profile</h1><p>Manage your account, identity and privacy.</p></div><p className="profile-note">Same routes.<br/>Brighter people.</p></section>
      {notice && !editing ? <p className="profile-toast" role="status"><Icon name="check"/> {notice}</p> : null}
      <div className="profile-hero-grid">
        <Card icon="profile" title="Profile Overview" subtitle="Your public identity on Kopa-Padi." className="profile-overview"><div className="profile-overview-body"><Avatar name={accountName}/><div><h3>{accountName}</h3><p className="profile-active"><i/> {data.user.accountStatus.toLowerCase() === "active" ? "Active account" : label(data.user.accountStatus)}</p><em>“Good people, great journeys.”</em><button className="profile-primary" onClick={beginEdit}><Icon name="edit"/> Edit Profile</button></div></div></Card>
        <Card icon="shield" title="Verification" subtitle={statusCopy(verification)} className={`profile-verification is-${verification.toLowerCase()}`}><div className="profile-verification-banner"><span><Icon name={verification === "VERIFIED" ? "check" : verification === "REJECTED" ? "warning" : "shield"} size={27}/></span><div><strong>{label(verification)}</strong><p>{statusCopy(verification)}</p></div></div>{data.intake && data.camp ? <div className="profile-assignment"><p><Icon name="document"/> NYSC {data.intake.serviceYear} · Batch {data.intake.batch} · Stream {data.intake.stream}</p><p><Icon name="pin"/> {data.camp.campName}{data.camp.stateName ? `, ${data.camp.stateName}` : ""}</p></div> : null}{data.verification.userSafeReason && verification !== "VERIFIED" ? <p className="profile-safe-reason">{data.verification.userSafeReason}</p> : null}<Link href="/verification" className="profile-secondary">{verification === "VERIFIED" ? "View verification details" : "Open verification"}<Icon name="arrow"/></Link></Card>
      </div>
      <div className="profile-info-grid"><Card icon="profile" title="Personal Information" subtitle="Your personal details and visibility settings."><dl className="profile-details"><div><dt>First name</dt><dd>{data.profile?.firstName || "Not added"}</dd></div><div><dt>Last name</dt><dd>{data.profile ? `${data.profile.lastNamePrivate[0]}${"*".repeat(Math.max(4, data.profile.lastNamePrivate.length - 1))}` : "Not added"} <small><Icon name="lock" size={14}/> Private</small></dd></div><div><dt>Display name</dt><dd>{data.profile?.displayName || accountName} <small className="visible"><Icon name="people" size={14}/> Visible to travelers</small></dd></div><div><dt>Profile photo</dt><dd><span className="profile-no-photo">No photo uploaded</span></dd></div></dl><button className="profile-secondary profile-edit-info" onClick={beginEdit}><Icon name="edit"/> Edit information</button></Card>
      <Card icon="gear" title="Account Information" subtitle="Your account details and activity."><dl className="profile-details"><div><dt>Email</dt><dd>{data.user.email}</dd></div><div><dt>Joined</dt><dd>{formatMonth(data.user.createdAt)}</dd></div><div><dt>Account status</dt><dd><span className="profile-active"><i/> {data.user.accountStatus === "ACTIVE" ? "Active" : label(data.user.accountStatus)}</span></dd></div></dl><button className="profile-secondary profile-signout" onClick={() => void signOut()}><Icon name="logout"/> Sign out</button></Card></div>
      <Card icon="lock" title="Your Privacy" subtitle="We're committed to keeping your information safe and giving you control." className="profile-privacy"><a href="#privacy">Learn more about our privacy practices <Icon name="arrow"/></a><div className="profile-privacy-grid"><section className="profile-public"><span><Icon name="profile"/></span><div><h3>Visible to travelers</h3><p>This information helps other travelers know you.</p><ul><li>Display name ({data.profile?.displayName || accountName})</li><li>Verification status ({label(verification)})</li></ul></div></section><section><span><Icon name="lock"/></span><div><h3>Always private</h3><p>This information is never shared with other travelers.</p><ul><li>Private last name</li><li>Email address</li><li>Verification documents</li></ul></div></section></div></Card>
      <Card icon="link" title="Quick Links" subtitle="Go to important sections quickly." className="profile-links"><Link href="/travel-plans"><Icon name="trip"/><span><b>Travel Plans</b><small>Plan your next trip</small></span><Icon name="arrow"/></Link><Link href="/circle"><Icon name="circle"/><span><b>Travel Circle</b><small>Find and connect</small></span><Icon name="arrow"/></Link><Link href="/safety"><Icon name="shield"/><span><b>Safety</b><small>Travel with confidence</small></span><Icon name="arrow"/></Link><Link href="/verification"><Icon name="shield"/><span><b>Verification</b><small>View your status</small></span><Icon name="arrow"/></Link></Card>
    </main> : null}
    <nav className="profile-mobile-nav" aria-label="Mobile navigation">{nav.map(([icon, name, href]) => <Link href={href} key={name} aria-current={name === "Profile" ? "page" : undefined}><Icon name={icon}/><span>{name}</span></Link>)}</nav>
  </div>{editing ? <div className="profile-dialog-backdrop" role="presentation"><form className="profile-dialog" onSubmit={save}><button type="button" className="profile-close" aria-label="Close edit profile" onClick={() => setEditing(false)}><Icon name="close"/></button><span className="profile-card-icon"><Icon name="edit"/></span><h2>Edit profile</h2><p>Choose the name travelers see. Your last name stays private.</p><label>First name<input className="field" value={form.firstName} maxLength={80} onChange={(e) => setForm({ ...form, firstName: e.target.value })}/></label><label>Private last name<input className="field" value={form.lastNamePrivate} maxLength={80} onChange={(e) => setForm({ ...form, lastNamePrivate: e.target.value })}/></label><label>Display name<input className="field" value={form.displayName} maxLength={80} onChange={(e) => setForm({ ...form, displayName: e.target.value })}/></label>{notice ? <p className="profile-form-error" role="alert">{notice}</p> : null}<div><button type="button" className="profile-secondary" onClick={() => setEditing(false)}>Cancel</button><button className="profile-primary" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button></div></form></div> : null}</div>;
}

function ProfileTop({ name, verified }: { name: string; verified: boolean }) { return <header className="profile-top"><div className="profile-mobile-brand"><UserBrand/></div><button aria-label="Notifications" className="profile-bell"><Icon name="bell"/><i/></button><div className="profile-user"><Avatar name={name}/><span><b>{name}</b><small className={verified ? "is-verified" : ""}>{verified ? "Verified · Active" : "Traveler"}</small></span></div></header>; }
