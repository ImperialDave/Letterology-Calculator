/**
 * Build public/brief.pptx from src/lib/letterology/brief.ts.
 * Run: npx tsx scripts/letterology/build-brief-pptx.ts
 */
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pptxgen from "pptxgenjs";
import { BRIEF_FOOTER, briefSlides } from "../../src/lib/letterology/brief.ts";

const PAPER = "EFE6D6";
const INK = "1C1712";
const PRIMARY = "7A3328";
const MUTED = "6B6256";
const RAISED = "F6F0E4";

const here = dirname(fileURLToPath(import.meta.url));
const outFile = resolve(here, "../../public/brief.pptx");

async function main() {
  const slides = briefSlides();
  const pres = new pptxgen();
  pres.title = "CC33 · Letterology Brief";
  pres.author = "CC33";
  pres.subject = "A short brief for people who will share a reading.";
  pres.layout = "LAYOUT_WIDE";

  for (const [index, slide] of slides.entries()) {
    const page = pres.addSlide();
    page.background = { color: PAPER };
    page.addShape(pres.shapes.RECTANGLE, {
      x: 0,
      y: 0,
      w: 0.18,
      h: 7.5,
      fill: { color: PRIMARY },
      line: { color: PRIMARY },
    });
    page.addText(slide.kicker.toUpperCase(), {
      x: 0.7,
      y: 0.35,
      w: 11.8,
      h: 0.35,
      fontFace: "Georgia",
      fontSize: 12,
      color: MUTED,
      margin: 0,
      charSpacing: 3,
    });
    page.addText(slide.title, {
      x: 0.7,
      y: 0.75,
      w: 11.8,
      h: 1.1,
      fontFace: "Georgia",
      fontSize: 32,
      bold: true,
      color: INK,
      margin: 0,
      valign: "top",
    });
    page.addText(
      slide.paragraphs.map((text, i) => ({
        text,
        options: { breakLine: i < slide.paragraphs.length - 1, paraSpaceAfter: 10 },
      })),
      {
        x: 0.7,
        y: 2.0,
        w: 11.8,
        h: 4.5,
        fontFace: "Georgia",
        fontSize: 18,
        color: INK,
        margin: 0,
        valign: "top",
      },
    );
    page.addText(`${BRIEF_FOOTER}  ·  ${index + 1} / ${slides.length}`, {
      x: 0.7,
      y: 6.95,
      w: 11.8,
      h: 0.3,
      fontFace: "Georgia",
      fontSize: 11,
      color: MUTED,
      margin: 0,
    });
    page.addNotes(slide.notes.join("\n\n"));
    page.addShape(pres.shapes.RECTANGLE, {
      x: 0.7,
      y: 6.8,
      w: 2.2,
      h: 0.04,
      fill: { color: RAISED },
      line: { color: PRIMARY },
    });
  }

  mkdirSync(dirname(outFile), { recursive: true });
  await pres.writeFile({ fileName: outFile });
  console.log(`wrote ${outFile} (${slides.length} slides)`);
}

void main();
