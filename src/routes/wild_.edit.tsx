import { createFileRoute } from "@tanstack/react-router";
import { WildEditor } from "@/components/WildEditor";

export const Route = createFileRoute("/wild_/edit")({
  component: WildEditor,
});
