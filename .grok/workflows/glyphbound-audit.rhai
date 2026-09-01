let meta = #{
    name: "glyphbound-audit",
    description: "Audit Glyphbound ledgers against the Doctrine: machine Housing/Site first, then player-sense",
    when_to_use: "Audit Glyphbound levels for Site, Housing, sentence, and whether the room makes sense to the player",
    phases: [
        #{ title: "Sense", detail: "one agent per ledger in the band" },
        #{ title: "Report", detail: "merge into a doctrine report" },
    ],
};

let sense_schema = #{
    "type": "object",
    "required": ["stage", "findings"],
    "properties": #{
        "stage": #{ "type": "string" },
        "findings": #{
            "type": "array",
            "maxItems": 16,
            "items": #{
                "type": "object",
                "required": ["code", "at", "internal", "external", "verdict"],
                "properties": #{
                    "code": #{ "type": "string" },
                    "at": #{ "type": "string" },
                    "internal": #{ "type": "string" },
                    "external": #{ "type": "string" },
                    "verdict": #{ "type": "string" },
                },
            },
        },
    },
};

fn band_ids(band) {
    if band == "hub" { return ["hub"]; }
    if band == "1-5" { return ["stage1", "stage2", "stage3", "stage4", "stage5"]; }
    if band == "6-14" { return ["stage6", "stage7", "stage8", "stage9", "stage10", "stage11", "stage12", "stage13", "stage14"]; }
    if band == "15-24" { return ["stage15", "stage16", "stage17", "stage18", "stage19", "stage20", "stage21", "stage22", "stage23", "stage24"]; }
    if band == "25-29" { return ["stage25", "stage26", "stage27", "stage28", "stage29"]; }
    if band == "30-44" { return ["stage30", "stage31", "stage32", "stage33", "stage34", "stage35", "stage36", "stage37", "stage38", "stage39", "stage40", "stage41", "stage42", "stage43", "stage44"]; }
    if band == "45-60" { return ["stage45", "stage46", "stage47", "stage48", "stage49", "stage50", "stage51", "stage52", "stage53", "stage54", "stage55", "stage56", "stage57", "stage58", "stage59", "stage60"]; }
    [];
}

fn sense_prompt(stage) {
    let p = "You are auditing ONE Glyphbound ledger against the Glyphbound Doctrine.\n";
    p += "Stage id: " + stage + "\n";
    p += "Repo: /home/ericdanielevans/projects/Letterology-Calculator\n";
    p += "Do not edit files. Do not commit. Do not push. Do not rewrite Numberomicons by pasting ASCII.\n";
    p += "1. Read .grok/skills/glyphbound-ledgers/SKILL.md — Site, Housing, Audit, Sentence. Those tables are the law.\n";
    p += "2. Run: npx tsx src/glyphbound/audit-cli.ts " + stage + "\n";
    p += "   from the repo root. Read the CLI output. That is the machine half. Do not invent codes.\n";
    p += "3. For every FAIL, and for each featured foundry toy if the CLI is clean, read the ASCII snippet.\n";
    p += "   Internally: does Site + Housing hold. Externally: would a player see a press, a trough, a pit of teeth, or a glyph in the air.\n";
    p += "4. verdict is fix or leave. fail must be fix unless the snippet shows the CLI is wrong — then leave and say why.\n";
    p += "5. Hub: [ { } are doors, d f j w x are teachers. Exchange (stage1) never foundry toys.\n";
    p += "A valid empty findings list means you ran the CLI, read the doctrine, and the room is legal internally and externally.\n";
    p += "Return {stage, findings:[{code, at, internal, external, verdict}]} for THIS stage only.\n";
    p
}

let band = if args == () { () } else { args.band };
if band == () {
    pause("verification", "Pass args.band: hub, 1-5, 6-14, 15-24, 25-29, 30-44, 45-60.");
}

let ids = band_ids(band);
if ids.len() == 0 {
    pause("verification", "Unknown band. Use hub, 1-5, 6-14, 15-24, 25-29, 30-44, or 45-60.");
}

phase("Sense");
log("Auditing " + ids.len().to_string() + " ledgers in band " + band);
let jobs = [];
for id in ids {
    jobs.push(#{
        prompt: sense_prompt(id),
        label: "sense:" + id,
        capability_mode: "execute",
        output_schema: sense_schema,
    });
}
let results = parallel(jobs);

let wanted = #{};
for id in ids { wanted[id] = true; }

let findings = [];
let i = 0;
for r in results {
    let expect_id = ids[i];
    i += 1;
    if r == () || !r.success || r.output == () { continue; }
    let st = r.output.stage;
    if st == () || wanted[st] != true { continue; }
    if r.output.findings == () { continue; }
    for f in r.output.findings {
        if f == () { continue; }
        findings.push(#{
            stage: st,
            code: f.code,
            at: f.at,
            internal: f.internal,
            external: f.external,
            verdict: f.verdict,
        });
    }
}

phase("Report");
let payload = json_encode(#{ band: band, ledgers: ids.len(), findings: findings });
let rp = "Write a Glyphbound doctrine audit report for band " + band + ".\n";
rp += "Do not edit game files. JSON of collected findings:\n";
rp += payload + "\n";
rp += "Group by stage. Quote internal vs external in one line each. Count fix vs leave.\n";
rp += "Do not add findings that are not in the JSON. If findings is empty, say the band is clean.\n";
rp += "Return markdown only.\n";

let report_agent = agent(rp, #{
    label: "report",
    capability_mode: "read-only",
});

let md = "# Glyphbound audit " + band + "\n\n";
md += "ledgers " + ids.len().to_string() + "  findings " + findings.len().to_string() + "\n\n";
if report_agent != () && report_agent.success && type_of(report_agent.output) == "string" {
    md += report_agent.output;
} else {
    md += "Synthesizer failed. Raw findings follow.\n\n";
    md += payload;
}
let path = write_scratch_file("report.md", md);
complete(#{ path: path, band: band, ledgers: ids.len(), findings: findings.len() });
