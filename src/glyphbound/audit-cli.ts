/** Machine half of a Glyphbound doctrine audit. Grok reads this, then the room. */
import { auditCampaign, formatReport, parseAuditTarget } from "./audit";

const args = process.argv.slice(2);
const json = args.includes("--json");
const summary = args.includes("--summary");
const target = args.find((a) => a !== "--json" && a !== "--summary") ?? "all";
const ids = parseAuditTarget(target);
if (!ids.length) {
  console.error(`unknown target ${target}. Use hub, stage12, 6-14, or all.`);
  process.exit(2);
}

const reports = auditCampaign(target);
if (json) {
  console.log(JSON.stringify(reports, null, 2));
} else if (summary) {
  let fails = 0;
  let warns = 0;
  for (const r of reports) {
    fails += r.fails;
    warns += r.warns;
    const codes = [...new Set(r.issues.filter((i) => i.severity === "fail").map((i) => i.code))];
    console.log(`${r.id}\t${r.fails}\t${r.warns}\t${codes.join(",")}`);
  }
  console.log(`ledgers ${reports.length}  fails ${fails}  warns ${warns}`);
} else {
  let fails = 0;
  let warns = 0;
  for (const r of reports) {
    fails += r.fails;
    warns += r.warns;
    console.log(formatReport(r));
    console.log("");
  }
  console.log(`ledgers ${reports.length}  fails ${fails}  warns ${warns}`);
}

process.exit(reports.some((r) => r.fails > 0) ? 1 : 0);
