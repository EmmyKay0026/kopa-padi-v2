import { AuthExperience } from "@/components/auth-experience";

export const metadata = { title: "Create account | Kopa-Padi" };

export default function RegisterPage() {
  return <AuthExperience initialMode="signup" />;
}
