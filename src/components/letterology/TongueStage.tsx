import type { ReactNode } from "react";
import type { Tongue } from "@/lib/letterology/tongue";

/**
 * One tongue at a time. Stacking both with opacity left the Latin
 * reading sitting on top of the Greek one — dark room, old words.
 */
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
    <div className="tongue-stage" data-view={tongue}>
      {tongue === "el" ? (
        <div key="el" className="tongue-pane is-on">
          {greek}
        </div>
      ) : (
        <div key="la" className="tongue-pane is-on">
          {latin}
        </div>
      )}
    </div>
  );
}
