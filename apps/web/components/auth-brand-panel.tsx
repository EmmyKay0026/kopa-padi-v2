import Image from "next/image";
import Link from "next/link";
import type { AuthMode } from "./auth-form";

export function AuthBrandPanel({ mode }: { mode: AuthMode }) {
  return (
    <aside className="auth-brand-panel" aria-label="About Kopa-Padi">
      <Image
        src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=88"
        alt="A scenic road winding through mountains"
        fill
        priority
        sizes="(max-width: 899px) 100vw, 590px"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(7,29,26,.94),rgba(15,118,110,.62))]" />
      <div className="auth-brand-glow" aria-hidden="true" />
      <div className="auth-brand-content">
        <Link href="/" className="auth-logo" aria-label="Kopa-Padi home"><span>KP</span>Kopa-Padi</Link>
        <div className="auth-brand-copy">
          <p className="text-xs font-black uppercase tracking-[.26em] text-teal-100">Your journey, shared</p>
          <h2>Travel together.<br />Go further.</h2>
          <p>Join a community of travelers who believe journeys are better together.</p>
          <p className="auth-handwritten">Same routes. Brighter stories.</p>
        </div>
        <div className="auth-brand-footer">
          {mode === "signup" ? (
            <ol className="auth-steps" aria-label="Account setup progress">
              <li className="active"><span>01</span><b>Create your account</b></li>
              <li><span>02</span><b>Verify yourself</b></li>
              <li><span>03</span><b>Complete your profile</b></li>
            </ol>
          ) : (
            <div className="auth-welcome-back">
              <span aria-hidden="true">✦</span>
              <p><b>Welcome back, Padi.</b><br />Your next shared journey is waiting.</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
