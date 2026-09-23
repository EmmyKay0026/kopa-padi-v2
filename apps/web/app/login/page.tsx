import { AuthExperience } from "@/components/auth-experience";

export const metadata = { title: "Sign in | Kopa-Padi" };

export default function LoginPage() {
  return <AuthExperience initialMode="signin" />;
}
