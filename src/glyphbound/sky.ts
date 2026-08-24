import { districtFor, type DistrictLook, type Mid, type Weather } from "./districts";
import { VIEW_H, VIEW_W, type ThemeId } from "./types";

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
  drawMid(ctx, d, camX, t, index);
  drawWeather(ctx, d.weather, camX, t, d.accent, 0.55);
  drawHaze(ctx, d);
  drawDressing(ctx, d, camX, t, index);
  ctx.restore();
}

export function drawWeatherFront(
  ctx: CanvasRenderingContext2D,
  camX: number,
  _camY: number,
  t: number,
  index: number,
) {
  const d = districtFor(index);
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

function drawWeather(ctx: CanvasRenderingContext2D, kind: Weather, camX: number, t: number, accent: string, layer: number) {
  const w = VIEW_W;
  const h = VIEW_H;
  ctx.save();
  if (kind === "rain") {
    ctx.strokeStyle = "rgba(200,214,224,0.45)";
    ctx.lineWidth = 1.1;
    ctx.globalAlpha = 0.35 * layer;
    for (let i = 0; i < 50; i++) {
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
    for (let i = 0; i < 36; i++) {
      const rx = ((i * 61 + t * 18 - camX * 0.2) % (w + 12)) - 6;
      const ry = ((i * 43 + t * 22) % (h + 8)) - 4;
      ctx.fillRect(rx, ry, kind === "snow" ? 2.2 : 1.6, kind === "snow" ? 2.2 : 1.6);
    }
  } else if (kind === "embers" || kind === "sparks") {
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.5 * layer;
    for (let i = 0; i < 28; i++) {
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
    for (let wy = base - bh + 10; wy < base - 12; wy += 11) {
      for (let wx = x + 7; wx < x + bw - 6; wx += 8) {
        const on = ((i * 13 + wy + Math.floor(t * 0.4)) % 7) !== 0;
        ctx.fillStyle = on ? (i % 4 === 1 ? d.accent + "73" : "rgba(170,198,210,0.28)") : "rgba(12,16,20,0.35)";
        ctx.fillRect(wx, wy, 4, 6);
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
