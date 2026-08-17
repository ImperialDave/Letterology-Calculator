import type { ReactNode } from "react";
import type { Tongue } from "@/lib/letterology/tongue";
import { cn } from "@/lib/utils";

export function TongueStage({
  tongue,
  latin,
  greek,
}: {
  tongue: Tongue;
  latin: ReactNode;
  greek: ReactNode;
}) {
  return (
    <div className="tongue-stage">
      <div className={cn("tongue-pane", tongue === "la" ? "is-on" : "is-off")} inert={tongue !== "la"}>
        {latin}
      </div>
      <div className={cn("tongue-pane", tongue === "el" ? "is-on" : "is-off")} inert={tongue !== "el"}>
        {greek}
      </div>
    </div>
  );
}
