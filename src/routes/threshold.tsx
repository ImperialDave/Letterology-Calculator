import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/SiteChrome";
import { ThresholdForm } from "@/components/letterology/ThresholdForm";
import { pageCardMeta } from "@/lib/letterology/share";
import { VOICE } from "@/lib/letterology/voice";

export const Route = createFileRoute("/threshold")({
  head: () =>
    pageCardMeta({
      title: VOICE.thresholdTitle,
      description: VOICE.thresholdLede,
      path: "/threshold",
      imagePath: "/og.jpg",
    }),
  component: ThresholdPage,
});

function ThresholdPage() {
  return (
    <AppShell current="brain">
      <ThresholdForm />
    </AppShell>
  );
}
