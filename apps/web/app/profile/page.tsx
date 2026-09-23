import type { Metadata } from "next";
import { ProfileDashboard } from "@/components/profile-dashboard";
import "./profile.css";

export const metadata: Metadata = {
  title: "My Profile | Kopa-Padi",
  description: "Manage your account, identity and privacy.",
};

export default function ProfilePage() {
  return <ProfileDashboard />;
}
