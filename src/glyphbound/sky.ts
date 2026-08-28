import { blitLoop } from "./art";
import { districtFor, type DistrictLook, type Mid, type Weather } from "./districts";
import { VIEW_H, VIEW_W, type ThemeId } from "./types";

/** Low-FX path for phones and small screens — fewer weather motes, no window grids. */
export let fxLite = false;
export function setFxLite(v: boolean) {
  fxLite = v;
}

export function drawParallax(
  ctx: CanvasRenderingContext2D,
  camX: number,
  camY: number,
  t: number,
  _theme: ThemeId,
  shakeX: number,
  shakeY: number,
  index = 0,
) {
  const d = districtFor(index);
  ctx.save();
  ctx.translate(shakeX, shakeY);
  fillSky(ctx, d);
  drawCelestial(ctx, d, t, camX);
  const far = blitLoop(ctx, "bg", `${d.theme}-far`, camX, 0.1, 0, VIEW_H, camY, 0.04);
  if (!far) drawFarLand(ctx, d, camX, t, index);
  const mid = blitLoop(ctx, "bg", `${d.theme}-mid`, camX, 0.28, 0, VIEW_H, camY, 0.08);
  if (!mid) drawMid(ctx, d, camX, t, index);
  const near = blitLoop(ctx, "bg", `${d.theme}-near`, camX, 0.5, 0, VIEW_H, camY, 0.12);
  if (!near) drawNearLand(ctx, d, camX, t);
  if (!fxLite) {
    drawWeather(ctx, d.weather, camX, t, d.accent, 0.55);
    drawHaze(ctx, d);
    drawDressing(ctx, d, camX, t, index);
  } else {
    drawHaze(ctx, d);
  }
  ctx.restore();
}

export function drawFgVeil(ctx: CanvasRenderingContext2D, camX: number, t: number, index: number) {
  const d = districtFor(index);
  if (blitLoop(ctx, "bg", `${d.theme}-fg`, camX, 1.15, 0, VIEW_H)) return;
  if (fxLite) return;
  drawFgLand(ctx, d, camX, t);
}

export function drawWeatherFront(
  ctx: CanvasRenderingContext2D,
  camX: number,
  _camY: number,
  t: number,
  index: number,
) {
  const d = districtFor(index);
  if (fxLite) return;
  drawWeather(ctx, d.weather, camX, t, d.accent, 1);
}

export function drawGrade(ctx: CanvasRenderingContext2D, index: number) {
  const d = districtFor(index);
  const w = VIEW_W;
  const h = VIEW_H;
  ctx.save();
  const g = ctx.createRadialGradient(w * 0.5, h * 0.42, h * 0.18, w * 0.5, h * 0.55, h * 0.85);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, d.fog);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = d.grade;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function fillSky(ctx: CanvasRenderingContext2D, d: DistrictLook) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, d.sky[0]);
  g.addColorStop(0.55, d.sky[1]);
  g.addColorStop(1, d.sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function drawCelestial(ctx: CanvasRenderingContext2D, d: DistrictLook, t: number, camX: number) {
  const w = VIEW_W;
  const x = w * 0.72 - camX * 0.02;
  const y = d.sun === "day" ? 54 : 70;
  if (d.sun === "eclipse") {
    ctx.fillStyle = d.accent;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(x, y, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#07040a";
    ctx.beginPath();
    ctx.arc(x - 6, y - 2, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = d.accent;
    ctx.globalAlpha = 0.5 + Math.sin(t * 2) * 0.2;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 42 + Math.sin(t) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    return;
  }
  if (d.sun === "night") {
    ctx.fillStyle = "#e8ece8";
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    return;
  }
  const col = d.sun === "dusk" ? "#e07040" : d.sun === "storm" ? "#c8d0d4" : "#f0d48a";
  ctx.fillStyle = col;
  ctx.globalAlpha = d.sun === "storm" ? 0.25 : 0.7;
  ctx.beginPath();
  ctx.arc(x, y, d.sun === "day" ? 22 : 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.12;
  ctx.beginPath();
  ctx.arc(x, y, 48, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawHaze(ctx: CanvasRenderingContext2D, d: DistrictLook) {
  ctx.fillStyle = d.fog;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(0, VIEW_H - 90, VIEW_W, 90);
  ctx.globalAlpha = 1;
}

function wrapSlot(camX: number, factor: number, spacing: number, i: number) {
  const span = spacing * 12;
  return ((i * spacing - camX * factor) % (VIEW_W + span)) - spacing;
}

function drawFarLand(ctx: CanvasRenderingContext2D, d: DistrictLook, camX: number, t: number, index: number) {
  const h = VIEW_H;
  if (d.sun === "night" || d.sun === "eclipse") {
    ctx.fillStyle = "#e8ece8";
    for (let i = 0; i < 28; i++) {
      const x = wrapSlot(camX, 0.04, 48, i);
      const y = 18 + ((i * 37 + index * 9) % 110);
      ctx.globalAlpha = 0.12 + (i % 5) * 0.04;
      ctx.fillRect(x, y, i % 4 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1);
    }
    ctx.globalAlpha = 1;
  }
  ctx.beginPath();
  ctx.moveTo(-20, h);
  const ridge = d.mid === "glacier" || d.mid === "glass" ? 0.38 : d.mid === "spires" || d.mid === "orrery" ? 0.34 : 0.48;
  for (let i = 0; i <= 18; i++) {
    const x = wrapSlot(camX, 0.1, 92, i);
    const peak = h * ridge - (20 + ((i * 19 + index) % 70));
    ctx.lineTo(x, peak);
  }
  ctx.lineTo(VIEW_W + 40, h);
  ctx.closePath();
  ctx.fillStyle = d.sky[2];
  ctx.globalAlpha = 0.72;
  ctx.fill();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = d.accent;
  ctx.fill();
  ctx.globalAlpha = 1;
  if (d.mid === "orrery" || d.mid === "lattice") {
    ctx.strokeStyle = d.accent;
    ctx.globalAlpha = 0.2;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      const cx = wrapSlot(camX, 0.1, 220, i) + 80;
      const cy = 70 + i * 18;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 36 + i * 10, 14 + i * 4, t * 0.12 + i, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

function drawNearLand(ctx: CanvasRenderingContext2D, d: DistrictLook, camX: number, t: number) {
  const h = VIEW_H;
  const base = h - 64;
  ctx.globalAlpha = 0.55;
  for (let i = 0; i < 10; i++) {
    const x = wrapSlot(camX, 0.5, 140, i);
    const bw = 48 + (i % 3) * 22;
    const bh = 70 + (i % 5) * 28;
    ctx.fillStyle = i % 2 ? d.sky[2] : "#0a0c10";
    if (d.mid === "spires" || d.mid === "columns") {
      ctx.fillRect(x + 16, base - bh - 40, 10, bh + 40);
      ctx.beginPath();
      ctx.moveTo(x + 8, base - bh - 40);
      ctx.lineTo(x + 21, base - bh - 70);
      ctx.lineTo(x + 34, base - bh - 40);
      ctx.fill();
    } else if (d.mid === "ribs" || d.mid === "abyss") {
      ctx.beginPath();
      ctx.moveTo(x, base);
      ctx.quadraticCurveTo(x + bw * 0.5, base - bh - 20, x + bw, base);
      ctx.fill();
    } else if (d.mid === "pipes" || d.mid === "docks" || d.mid === "ships") {
      ctx.fillRect(x, base - 36, bw, 36);
      ctx.fillRect(x + 8, base - 70, 14, 34);
    } else if (d.mid === "glacier" || d.mid === "glass") {
      ctx.beginPath();
      ctx.moveTo(x, base);
      ctx.lineTo(x + bw * 0.35, base - bh);
      ctx.lineTo(x + bw, base);
      ctx.fill();
    } else if (d.mid === "coils") {
      ctx.beginPath();
      ctx.arc(x + 24, base - 30, 28, 0, Math.PI * 2);
      ctx.fill();
    } else if (d.mid === "garden" || d.mid === "forest") {
      ctx.beginPath();
      ctx.ellipse(x + 22, base - 38, 26, 40, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x + 18, base - 24, 8, 24);
    } else {
      ctx.fillRect(x, base - bh, bw, bh);
      ctx.fillStyle = d.accent;
      ctx.globalAlpha = 0.12;
      ctx.fillRect(x + 4, base - bh + 8, 3, bh - 16);
      ctx.globalAlpha = 0.55;
    }
  }
  ctx.globalAlpha = 0.08 + Math.sin(t * 0.7) * 0.02;
  ctx.fillStyle = d.accent;
  ctx.fillRect(0, base - 8, VIEW_W, 12);
  ctx.globalAlpha = 1;
}

function drawFgLand(ctx: CanvasRenderingContext2D, d: DistrictLook, camX: number, t: number) {
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#05060a";
  ctx.strokeStyle = d.accent;
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 5; i++) {
    const x = wrapSlot(camX, 1.15, 260, i);
    if (d.mid === "glacier" || d.mid === "glass") {
      ctx.beginPath();
      ctx.moveTo(x + 20, 0);
      ctx.lineTo(x + 28, 70 + (i % 3) * 20);
      ctx.lineTo(x + 36, 0);
      ctx.fill();
    } else if (d.mid === "ribs" || d.mid === "abyss") {
      ctx.beginPath();
      ctx.moveTo(x, VIEW_H);
      ctx.quadraticCurveTo(x + 40, VIEW_H - 120, x + 50, VIEW_H);
      ctx.fill();
    } else if (d.mid === "pipes" || d.mid === "docks") {
      ctx.fillRect(x + 10, 0, 8, 50);
      ctx.fillRect(x, 48, 70, 8);
    } else {
      ctx.globalAlpha = 0.14;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 8 + Math.sin(t + i) * 2, 36);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawWeather(ctx: CanvasRenderingContext2D, kind: Weather, camX: number, t: number, accent: string, layer: number) {
  const w = VIEW_W;
  const h = VIEW_H;
  ctx.save();
  if (kind === "rain") {
    ctx.strokeStyle = "rgba(200,214,224,0.45)";
    ctx.lineWidth = 1.1;
    ctx.globalAlpha = 0.35 * layer;
    for (let i = 0; i < (fxLite ? 18 : 50); i++) {
      const rx = ((i * 47 + t * 220 - camX * 0.5) % (w + 20)) - 10;
      const ry = ((i * 89 + t * 340) % (h + 20)) - 10;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + 1.2, ry + 10);
      ctx.stroke();
    }
  } else if (kind === "ash" || kind === "snow") {
    ctx.fillStyle = kind === "snow" ? "#e8ece8" : "#c4b08a";
    ctx.globalAlpha = 0.4 * layer;
    for (let i = 0; i < (fxLite ? 14 : 36); i++) {
      const rx = ((i * 61 + t * 18 - camX * 0.2) % (w + 12)) - 6;
      const ry = ((i * 43 + t * 22) % (h + 8)) - 4;
      ctx.fillRect(rx, ry, kind === "snow" ? 2.2 : 1.6, kind === "snow" ? 2.2 : 1.6);
    }
  } else if (kind === "embers" || kind === "sparks") {
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.5 * layer;
    for (let i = 0; i < (fxLite ? 10 : 28); i++) {
      const rx = ((i * 67 + t * (kind === "sparks" ? 90 : 24) - camX * 0.3) % (w + 16)) - 8;
      const ry = (h - ((i * 41 + t * (kind === "sparks" ? 70 : 40)) % h));
      ctx.fillRect(rx, ry, kind === "sparks" ? 2 : 1.6, kind === "sparks" ? 2 : 3);
    }
  } else if (kind === "motes") {
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.28 * layer;
    for (let i = 0; i < 22; i++) {
      const rx = ((i * 73 + t * 12 - camX * 0.15) % (w + 16)) - 8;
      const ry = 20 + (i * 37 + Math.sin(t + i) * 8) % (h - 40);
      ctx.beginPath();
      ctx.arc(rx, ry, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === "inkfall") {
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.22 * layer;
    for (let i = 0; i < 18; i++) {
      const rx = ((i * 53 + t * 20 - camX * 0.35) % (w + 20)) - 10;
      const ry = ((i * 29 + t * 50) % (h - 20)) + 8;
      ctx.fillRect(rx, ry, 1.6, 8);
    }
  } else if (kind === "petals") {
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.28 * layer;
    for (let i = 0; i < 16; i++) {
      const rx = ((i * 71 + t * 16 - camX * 0.2) % (w + 20)) - 10;
      const ry = ((i * 47 + t * 14) % (h + 10)) - 4;
      ctx.beginPath();
      ctx.ellipse(rx, ry, 4, 2, t + i, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === "aurora") {
    ctx.globalAlpha = 0.18 * layer;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 18;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-20, 40 + i * 28);
      for (let x = 0; x <= w + 20; x += 24) {
        ctx.lineTo(x, 50 + i * 26 + Math.sin(t * 0.7 + x * 0.02 + i) * 18);
      }
      ctx.stroke();
    }
  } else if (kind === "static") {
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.08 * layer;
    for (let i = 0; i < 12; i++) {
      const y = ((i * 37 + Math.floor(t * 40)) % h);
      ctx.fillRect(0, y, w, 1.2);
    }
  } else if (kind === "eclipse") {
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.2 * layer;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w * 0.5, 80, 90 + Math.sin(t) * 6, 0, Math.PI * 2);
    ctx.stroke();
  } else if (kind === "hail") {
    ctx.fillStyle = "#e8ece8";
    ctx.globalAlpha = 0.4 * layer;
    for (let i = 0; i < (fxLite ? 10 : 28); i++) {
      const rx = ((i * 53 + t * 180 - camX * 0.4) % (w + 16)) - 8;
      const ry = ((i * 71 + t * 260) % (h + 16)) - 8;
      ctx.fillRect(rx, ry, 2.4, 3.4);
    }
  } else if (kind === "gold") {
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.32 * layer;
    for (let i = 0; i < 24; i++) {
      const rx = ((i * 79 + t * 14 - camX * 0.18) % (w + 20)) - 10;
      const ry = 16 + (i * 41 + Math.sin(t * 0.8 + i) * 10) % (h - 30);
      ctx.beginPath();
      ctx.arc(rx, ry, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === "lightning") {
    if (Math.sin(t * 7) > 0.92) {
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.18 * layer;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.35 * layer;
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 3; i++) {
      const x0 = ((i * 211 + Math.floor(t * 2) * 40) % w);
      ctx.beginPath();
      ctx.moveTo(x0, 0);
      ctx.lineTo(x0 + 12, 40);
      ctx.lineTo(x0 - 8, 80);
      ctx.lineTo(x0 + 10, 130);
      ctx.stroke();
    }
  } else if (kind === "void") {
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.12 * layer;
    for (let i = 0; i < 10; i++) {
      const rx = ((i * 97 + t * 8 - camX * 0.1) % (w + 40)) - 20;
      const ry = 40 + (i * 53) % (h - 60);
      ctx.beginPath();
      ctx.arc(rx, ry, 10 + Math.sin(t + i) * 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawMid(ctx: CanvasRenderingContext2D, d: DistrictLook, camX: number, t: number, index: number) {
  const fn: Record<Mid, (c: CanvasRenderingContext2D, look: DistrictLook, cam: number, time: number, n: number) => void> = {
    city: midCity,
    books: midBooks,
    pipes: midPipes,
    spires: midSpires,
    ribs: midRibs,
    ships: midShips,
    columns: midColumns,
    coils: midCoils,
    vaults: midVaults,
    irises: midIrises,
    machines: midMachines,
    mirrors: midMirrors,
    arches: midArches,
    docks: midDocks,
    foundry: midFoundry,
    forest: midForest,
    lattice: midLattice,
    orrery: midOrrery,
    glacier: midGlacier,
    glass: midGlass,
    garden: midGarden,
    script: midScript,
  };
  fn[d.mid](ctx, d, camX, t, index);
}

function midCity(ctx: CanvasRenderingContext2D, d: DistrictLook, camX: number, t: number, n: number) {
  const h = VIEW_H;
  const w = VIEW_W;
  const skyline = [110, 190, 140, 240, 160, 210, 90, 260, 170, 130];
  for (let i = 0; i < 16; i++) {
    const bw = 42 + (i % 4) * 14;
    const bh = skyline[i % skyline.length] * (n > 6 ? 0.85 : 1);
    const x = ((i * 78 - camX * 0.2) % (w + 260)) - 90;
    const base = h - 78;
    ctx.fillStyle = i % 3 === 0 ? "#2c3944" : "#24303a";
    ctx.fillRect(x, base - bh, bw, bh);
    ctx.fillStyle = "rgba(200,214,224,0.08)";
    ctx.fillRect(x + 2, base - bh, 3, bh);
    if (!fxLite) {
      for (let wy = base - bh + 10; wy < base - 12; wy += 11) {
        for (let wx = x + 7; wx < x + bw - 6; wx += 8) {
          const on = ((i * 13 + wy + Math.floor(t * 0.4)) % 7) !== 0;
          ctx.fillStyle = on ? (i % 4 === 1 ? d.accent + "73" : "rgba(170,198,210,0.28)") : "rgba(12,16,20,0.35)";
          ctx.fillRect(wx, wy, 4, 6);
        }
      }
    }
    if (i % 4 === 0) {
      ctx.fillStyle = "rgba(212,90,74,0.55)";
      ctx.font = "700 28px 'Source Sans 3', sans-serif";
      ctx.fillText(String((i * 3 + n) % 10), x + bw * 0.25, base - bh + 32);
    }
  }
}

function midBooks(ctx: CanvasRenderingContext2D, d: DistrictLook, camX: number, t: number) {
  const w = VIEW_W;
  ctx.globalAlpha = 0.38;
  for (let i = 0; i < 16; i++) {
    const px = ((i * 173 - camX * 0.08) % (w + 80)) - 40;
    const py = 40 + (i * 37) % 220;
    ctx.fillStyle = i % 2 ? d.accent : "#8a7a62";
    ctx.font = `${18 + (i % 5) * 6}px "Cormorant Garamond", serif`;
    ctx.fillText(["Aa", "Ee", "Ss", "Rr", "Mm"][i % 5], px, py + Math.sin(t + i) * 6);
  }
  ctx.globalAlpha = 1;
}

function midPipes(ctx: CanvasRenderingContext2D, d: DistrictLook, camX: number) {
  const w = VIEW_W;
  const h = VIEW_H;
  ctx.globalAlpha = 0.32;
  for (let i = 0; i < 10; i++) {
    const x = ((i * 140 - camX * 0.12) % (w + 160)) - 40;
    ctx.fillStyle = i % 2 ? "#1a3a30" : "#16342a";
    ctx.fillRect(x, h - 160 - (i % 4) * 18, 28, 160);
    ctx.fillStyle = d.accent;
    ctx.globalAlpha = 0.12;
    ctx.fillRect(x + 8, h - 150, 4, 80);
    ctx.globalAlpha = 0.32;
  }
  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = d.accent;
  ctx.lineWidth = 8;
  for (let i = 0; i < 5; i++) {
    const x = ((i * 220 - camX * 0.28) % (w + 180)) - 60;
    ctx.beginPath();
    ctx.ellipse(x, h - 70, 70, 18, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function midSpires(ctx: CanvasRenderingContext2D, d: DistrictLook, camX: number) {
  const w = VIEW_W;
  const h = VIEW_H;
  ctx.globalAlpha = 0.32;
  for (let i = 0; i < 8; i++) {
    const x = ((i * 160 - camX * 0.14) % (w + 180)) - 60;
    const bh = 140 + (i % 3) * 40;
    ctx.fillStyle = "#2a2434";
    ctx.fillRect(x, h - bh, 36, bh);
    ctx.fillStyle = d.accent;
    ctx.globalAlpha = 0.14;
    ctx.fillRect(x + 12, h - bh, 4, bh);
    ctx.globalAlpha = 0.32;
  }
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = d.accent;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(w * 0.5 - camX * 0.05, 20);
  ctx.lineTo(w * 0.5 - camX * 0.05, h);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function midRibs(ctx: CanvasRenderingContext2D, d: DistrictLook, camX: number) {
  const w = VIEW_W;
  const h = VIEW_H;
  ctx.globalAlpha = 0.35;
  for (let i = 0; i < 12; i++) {
    const x = ((i * 130 - camX * 0.08) % (w + 140)) - 40;
    ctx.fillStyle = i % 2 ? "#101820" : "#0c141c";
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.lineTo(x + 40, h - 80 - (i % 4) * 30);
    ctx.lineTo(x + 80, h);
    ctx.fill();
    ctx.strokeStyle = d.accent;
    ctx.globalAlpha = 0.15;
    ctx.stroke();
    ctx.globalAlpha = 0.35;
  }
  ctx.globalAlpha = 1;
}

function midShips(ctx: CanvasRenderingContext2D, d: DistrictLook, camX: number, t: number) {
  const w = VIEW_W;
  const h = VIEW_H;
  ctx.globalAlpha = 0.4;
  for (let i = 0; i < 6; i++) {
    const x = ((i * 200 - camX * 0.18 + t * 4) % (w + 220)) - 80;
    const y = h - 110 - (i % 3) * 16;
    ctx.fillStyle = "#1a2830";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 90, y + 8);
    ctx.lineTo(x + 80, y + 28);
    ctx.lineTo(x + 10, y + 28);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = d.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 40, y);
    ctx.lineTo(x + 40, y - 36);
    ctx.stroke();
    ctx.fillStyle = d.accent;
    ctx.font = "700 18px 'Source Sans 3', sans-serif";
    ctx.fillText(String((i * 4) % 10), x + 20, y + 20);
  }
  ctx.globalAlpha = 1;
}

function midColumns(ctx: CanvasRenderingContext2D, d: DistrictLook, camX: number) {
  const w = VIEW_W;
  const h = VIEW_H;
  ctx.globalAlpha = 0.34;
  for (let i = 0; i < 10; i++) {
    const x = ((i * 120 - camX * 0.16) % (w + 140)) - 40;
    ctx.fillStyle = "#2a241c";
    ctx.fillRect(x, h - 200, 18, 200);
    ctx.fillRect(x - 6, h - 208, 30, 10);
    ctx.fillStyle = d.accent;
    ctx.globalAlpha = 0.2;
    ctx.fillRect(x + 6, h - 190, 4, 80);
    ctx.globalAlpha = 0.34;
  }
  ctx.globalAlpha = 1;
}

function midCoils(ctx: CanvasRenderingContext2D, d: DistrictLook, camX: number) {
  const w = VIEW_W;
  const h = VIEW_H;
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = d.accent;
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const x = ((i * 120 - camX * 0.16) % (w + 140)) - 50;
    ctx.beginPath();
    ctx.arc(x, 90 + (i % 3) * 40, 28 + (i % 3) * 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 8, 118 + (i % 3) * 40, 22, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 14; i++) {
    const x = ((i * 90 - camX * 0.32) % (w + 120)) - 40;
    ctx.fillStyle = i % 2 ? "#2a1430" : "#221028";
    ctx.fillRect(x, h - 100 - (i % 5) * 16, 36, 100);
    ctx.fillStyle = d.accent;
    ctx.globalAlpha = 0.25;
    ctx.fillRect(x + 8, h - 88, 3, 12);
    ctx.globalAlpha = 0.5;
  }
  ctx.globalAlpha = 1;
}

function midVaults(ctx: CanvasRenderingContext2D, d: DistrictLook, camX: number) {
  const w = VIEW_W;
  ctx.globalAlpha = 0.24;
  ctx.strokeStyle = d.accent;
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const x = ((i * 180 - camX * 0.12) % (w + 160)) - 50;
    ctx.strokeRect(x, 40 + (i % 3) * 18, 70, 110);
    ctx.beginPath();
    ctx.moveTo(x + 8, 40);
    ctx.lineTo(x + 35, 18);
    ctx.lineTo(x + 62, 40);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function midIrises(ctx: CanvasRenderingContext2D, d: DistrictLook, camX: number, t: number) {
  const w = VIEW_W;
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = d.accent;
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    const x = ((i * 200 - camX * 0.1) % (w + 180)) - 50;
    const y = 70 + (i % 3) * 36;
    const r = 22 + Math.sin(t + i) * 4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = d.accent;
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.28;
  }
  ctx.globalAlpha = 1;
}

function midMachines(ctx: CanvasRenderingContext2D, d: DistrictLook, camX: number, t: number) {
  const w = VIEW_W;
  const h = VIEW_H;
  ctx.globalAlpha = 0.4;
  for (let i = 0; i < 8; i++) {
    const x = ((i * 140 - camX * 0.22) % (w + 160)) - 50;
    ctx.fillStyle = "#2a2420";
    ctx.fillRect(x, h - 120, 70, 90);
    ctx.strokeStyle = d.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + 35, h - 150, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.save();
    ctx.translate(x + 35, h - 150);
    ctx.rotate(t * (i % 2 ? 1 : -1));
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(16, 0);
    ctx.stroke();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function midMirrors(ctx: CanvasRenderingContext2D, d: DistrictLook, camX: number) {
  const w = VIEW_W;
  const h = VIEW_H;
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 8; i++) {
    const x = ((i * 150 - camX * 0.14) % (w + 160)) - 40;
    ctx.fillStyle = d.accent;
    ctx.fillRect(x, 40, 4, h - 80);
    ctx.globalAlpha = 0.08;
    ctx.fillRect(x + 8, 50, 40, h - 120);
    ctx.globalAlpha = 0.22;
  }
  ctx.globalAlpha = 1;
}

function midArches(ctx: CanvasRenderingContext2D, d: DistrictLook, camX: number) {
  const w = VIEW_W;
  const h = VIEW_H;
  ctx.globalAlpha = 0.32;
  ctx.strokeStyle = d.accent;
  ctx.lineWidth = 6;
  for (let i = 0; i < 7; i++) {
    const x = ((i * 170 - camX * 0.16) % (w + 180)) - 50;
    ctx.beginPath();
    ctx.moveTo(x, h - 40);
    ctx.quadraticCurveTo(x + 50, h - 180, x + 100, h - 40);
    ctx.stroke();
    ctx.fillStyle = "#1c1410";
    ctx.fillRect(x, h - 40, 12, 40);
    ctx.fillRect(x + 88, h - 40, 12, 40);
  }
  ctx.globalAlpha = 1;
}

function midDocks(ctx: CanvasRenderingContext2D, d: DistrictLook, camX: number, t: number) {
  midPipes(ctx, d, camX);
  midShips(ctx, d, camX, t);
}

function midFoundry(ctx: CanvasRenderingContext2D, d: DistrictLook, camX: number, t: number) {
  midMachines(ctx, d, camX, t);
  const w = VIEW_W;
  const h = VIEW_H;
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = d.accent;
  ctx.beginPath();
  ctx.moveTo(w * 0.2, h);
  ctx.lineTo(w * 0.35, h - 90 - Math.sin(t) * 10);
  ctx.lineTo(w * 0.5, h);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function midForest(ctx: CanvasRenderingContext2D, d: DistrictLook, camX: number) {
  const w = VIEW_W;
  const h = VIEW_H;
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < 12; i++) {
    const x = ((i * 90 - camX * 0.12) % (w + 100)) - 30;
    ctx.fillStyle = "#14241c";
    ctx.fillRect(x + 16, h - 90, 8, 90);
    ctx.beginPath();
    ctx.arc(x + 20, h - 100, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = d.accent;
    ctx.globalAlpha = 0.1;
    ctx.beginPath();
    ctx.arc(x + 20, h - 100, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.3;
  }
  ctx.globalAlpha = 1;
}

function midLattice(ctx: CanvasRenderingContext2D, d: DistrictLook, camX: number) {
  const w = VIEW_W;
  const h = VIEW_H;
  ctx.strokeStyle = d.accent;
  ctx.globalAlpha = 0.18;
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 8; i++) {
    const x = ((i * 90 - camX * 0.14) % (w + 80)) - 20;
    ctx.beginPath();
    ctx.moveTo(x, h - 40);
    ctx.lineTo(x + 40, h - 200);
    ctx.lineTo(x + 80, h - 40);
    ctx.stroke();
    ctx.strokeRect(x + 16, h - 160, 48, 48);
  }
  ctx.globalAlpha = 1;
}

function midOrrery(ctx: CanvasRenderingContext2D, d: DistrictLook, camX: number, t: number) {
  const w = VIEW_W;
  ctx.strokeStyle = d.accent;
  ctx.globalAlpha = 0.28;
  for (let i = 0; i < 5; i++) {
    const x = ((i * 160 - camX * 0.08) % (w + 120)) - 40;
    const y = 90 + i * 18;
    ctx.beginPath();
    ctx.arc(x, y, 28 + i * 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + Math.cos(t + i) * (28 + i * 6), y + Math.sin(t + i) * (18 + i * 3), 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function midGlacier(ctx: CanvasRenderingContext2D, d: DistrictLook, camX: number) {
  const w = VIEW_W;
  const h = VIEW_H;
  ctx.globalAlpha = 0.28;
  for (let i = 0; i < 8; i++) {
    const x = ((i * 110 - camX * 0.16) % (w + 140)) - 50;
    ctx.fillStyle = i % 2 ? "#8aa8bc" : "#6a889c";
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.lineTo(x + 40, h - 140 - (i % 3) * 30);
    ctx.lineTo(x + 80, h);
    ctx.fill();
    ctx.fillStyle = d.accent;
    ctx.globalAlpha = 0.1;
    ctx.fillRect(x + 30, h - 80, 8, 80);
    ctx.globalAlpha = 0.28;
  }
  ctx.globalAlpha = 1;
}

function midGlass(ctx: CanvasRenderingContext2D, d: DistrictLook, camX: number, t: number) {
  const w = VIEW_W;
  const h = VIEW_H;
  ctx.globalAlpha = 0.2;
  for (let i = 0; i < 10; i++) {
    const x = ((i * 70 - camX * 0.12) % (w + 90)) - 30;
    ctx.strokeStyle = d.accent;
    ctx.strokeRect(x, h - 200 + Math.sin(t + i) * 4, 36, 160);
    ctx.fillStyle = d.accent;
    ctx.globalAlpha = 0.06;
    ctx.fillRect(x, h - 200, 36, 160);
    ctx.globalAlpha = 0.2;
  }
  ctx.globalAlpha = 1;
}

function midGarden(ctx: CanvasRenderingContext2D, d: DistrictLook, camX: number, t: number) {
  const w = VIEW_W;
  const h = VIEW_H;
  ctx.globalAlpha = 0.32;
  for (let i = 0; i < 14; i++) {
    const x = ((i * 70 - camX * 0.1) % (w + 80)) - 20;
    ctx.fillStyle = "#1a2a18";
    ctx.fillRect(x + 10, h - 70, 5, 70);
    ctx.fillStyle = d.accent;
    ctx.beginPath();
    ctx.ellipse(x + 12, h - 78 + Math.sin(t + i) * 3, 14, 8, t + i, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function midScript(ctx: CanvasRenderingContext2D, d: DistrictLook, camX: number, t: number) {
  const w = VIEW_W;
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = d.accent;
  const marks = ["+", "−", "×", "÷", "%", "∞", "π", "Σ"];
  for (let i = 0; i < 12; i++) {
    const x = ((i * 150 - camX * 0.07) % (w + 60)) - 20;
    const y = 50 + (i * 41) % 200;
    ctx.font = `${22 + (i % 4) * 8}px "Cormorant Garamond", serif`;
    ctx.fillText(marks[i % marks.length], x, y + Math.sin(t * 0.6 + i) * 5);
  }
  ctx.globalAlpha = 1;
}

function drawDressing(ctx: CanvasRenderingContext2D, d: DistrictLook, camX: number, t: number, index: number) {
  const w = VIEW_W;
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = d.accent;
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) {
    const x = ((i * 190 - camX * 0.55) % (w + 80)) - 20;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + Math.sin(t + i) * 4, 28);
    ctx.stroke();
    ctx.fillStyle = d.accent;
    ctx.globalAlpha = 0.35 + Math.sin(t * 3 + i) * 0.15;
    ctx.beginPath();
    ctx.arc(x + Math.sin(t + i) * 4, 32, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.55;
  }
  if (index >= 6) {
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = d.accent;
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    const gx = ((-camX * 0.08) % 280) + 80;
    const digit = String(index % 10);
    ctx.font = "700 160px 'Source Sans 3', sans-serif";
    ctx.strokeText(digit, gx, 200);
  }
  ctx.globalAlpha = 1;
}
