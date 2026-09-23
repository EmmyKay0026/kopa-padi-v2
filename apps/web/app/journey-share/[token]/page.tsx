import { JourneyShareView } from "@/components/journey-share-view";

export const metadata = {
  title: "Shared journey | Kopa-Padi",
  description: "A private, read-only journey update shared through Kopa-Padi.",
};

export default async function JourneySharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <JourneyShareView token={token} />;
}
