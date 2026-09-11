import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/SiteChrome";
import { ThresholdRollDetail } from "@/components/letterology/ThresholdRoll";
import { pageCardMeta } from "@/lib/letterology/share";
import { VOICE } from "@/lib/letterology/voice";

export const Route = createFileRoute("/brain_/roll_/threshold_/$id")({
  head: () =>
    pageCardMeta({
      title: VOICE.thresholdTitle,
      description: VOICE.thresholdLede,
      path: "/brain/roll",
      imagePath: "/og.jpg",
    }),
  component: ThresholdDetailPage,
});

function ThresholdDetailPage() {
  const { id } = Route.useParams();
  return (
    <AppShell current="brain" wide>
      <ThresholdRollDetail id={id} />
    </AppShell>
  );
}
