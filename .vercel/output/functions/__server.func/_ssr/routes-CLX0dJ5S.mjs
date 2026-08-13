import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as require_jsx_runtime, t as Root } from "../_libs/@radix-ui/react-label+[...].mjs";
import { n as Copy, r as Check } from "../_libs/lucide-react.mjs";
import { c as ALPHABET, l as MAJOR_FIELDS, s as Route$3, u as VOWEL_LETTERS } from "./router-ByjMqvw8.mjs";
import { n as SiteHeader, r as cn, t as SiteFooter } from "./SiteChrome-DMaO45f7.mjs";
import { n as findTension, r as themeOf, t as LetterDetail } from "./LetterDetail-B90BCbwb.mjs";
import { t as Button } from "./button-J6qjHEZZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CLX0dJ5S.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FOLDS = {
	Æ: "AE",
	æ: "AE",
	Œ: "OE",
	œ: "OE",
	Ø: "O",
	ø: "O",
	Ð: "D",
	ð: "D",
	Þ: "TH",
	þ: "TH",
	ß: "SS",
	Ł: "L",
	ł: "L",
	Đ: "D",
	đ: "D"
};
function foldCharacters(raw) {
	let out = "";
	for (const ch of raw) out += FOLDS[ch] ?? ch;
	return out.normalize("NFD").replace(/\p{M}/gu, "");
}
function parseName(raw) {
	const displayName = raw.trim().replace(/\s+/g, " ");
	return {
		displayName,
		parts: foldCharacters(displayName).split(/[^A-Za-z]+/).filter(Boolean).map((token) => ({
			original: token,
			letters: token.toUpperCase().replace(/[^A-Z]/g, "")
		})).filter((p) => p.letters.length > 0)
	};
}
function isVowelInPart(letter, indexInPart) {
	if (VOWEL_LETTERS.has(letter)) return true;
	if (letter === "Y") return indexInPart > 0;
	return false;
}
function scoreParts(parts) {
	const byLetter = /* @__PURE__ */ new Map();
	let globalIndex = 0;
	parts.forEach((part, partIndex) => {
		const chars = [...part.letters];
		chars.forEach((letter, i) => {
			const isSignature = partIndex === 0 && i === 0;
			const isInitial = i === 0;
			const isFinal = i === chars.length - 1 && chars.length > 1;
			let weight = 1;
			if (isSignature) weight += 1.6;
			else if (isInitial) weight += .8;
			if (isFinal) weight += .25;
			const existing = byLetter.get(letter);
			if (existing) {
				existing.count += 1;
				existing.weight += weight;
				existing.isSignature = existing.isSignature || isSignature;
				existing.isInitial = existing.isInitial || isInitial;
				existing.isVowel = existing.isVowel || isVowelInPart(letter, i);
			} else byLetter.set(letter, {
				letter,
				count: 1,
				weight: Math.round(weight * 100) / 100,
				firstIndex: globalIndex,
				isVowel: isVowelInPart(letter, i),
				isSignature,
				isInitial
			});
			globalIndex += 1;
		});
	});
	return [...byLetter.values()].sort(compareInventory);
}
function compareInventory(a, b) {
	if (b.weight !== a.weight) return b.weight - a.weight;
	if (a.isSignature !== b.isSignature) return a.isSignature ? -1 : 1;
	return a.firstIndex - b.firstIndex;
}
function pickTension(ranked) {
	const top = ranked.slice(0, 6);
	let best = null;
	for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++) {
		const pair = findTension(top[i].letter, top[j].letter);
		if (!pair) continue;
		const score = top[i].weight + top[j].weight - i * .15 - j * .15;
		if (!best || score > best.score) best = {
			pair,
			score
		};
	}
	return best?.pair ?? null;
}
function pickShadows(ranked, primary) {
	const present = new Set(ranked.map((r) => r.letter));
	const complements = themeOf(primary).complements.filter((l) => !present.has(l));
	const majors = MAJOR_FIELDS.filter((l) => l !== primary && !present.has(l));
	const out = [];
	for (const letter of [...complements, ...majors]) {
		if (!out.includes(letter)) out.push(letter);
		if (out.length >= 2) break;
	}
	if (out.length < 2) for (const letter of ALPHABET) {
		if (letter === primary || present.has(letter) || out.includes(letter)) continue;
		out.push(letter);
		if (out.length >= 2) break;
	}
	return out.slice(0, 2);
}
function hashString(input) {
	let h = 2166136261;
	for (let i = 0; i < input.length; i++) {
		h ^= input.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}
function dayKey(date = /* @__PURE__ */ new Date()) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function weekKey(date = /* @__PURE__ */ new Date()) {
	const start = new Date(date.getFullYear(), 0, 1);
	const diff = date.getTime() - start.getTime();
	return Math.floor(diff / 6048e5);
}
function pickRotating(letters, salt, fallback) {
	if (letters.length === 0) return fallback;
	return letters[hashString(salt) % letters.length] ?? fallback;
}
function possessive(name) {
	if (!name) return "This name's";
	return name.endsWith("s") || name.endsWith("S") ? `${name}'` : `${name}'s`;
}
function article(word) {
	return /^[aeiou]/i.test(word) ? "an" : "a";
}
function buildHoroscope(rawName, now = /* @__PURE__ */ new Date()) {
	const { displayName, parts } = parseName(rawName);
	const inventory = scoreParts(parts);
	if (inventory.length === 0) return null;
	const primary = inventory[0];
	const secondaries = inventory.slice(1, 4);
	const gifts = [primary, ...secondaries.slice(0, 2)].map((x) => x.letter);
	const tension = pickTension(inventory);
	const shadows = pickShadows(inventory, primary.letter);
	const signature = inventory.find((x) => x.isSignature)?.letter ?? primary.letter;
	const vowels = inventory.filter((x) => x.isVowel);
	const consonants = inventory.filter((x) => !x.isVowel);
	const daily = pickRotating(inventory.map((x) => x.letter), `${dayKey(now)}:${displayName.toLowerCase()}`, primary.letter);
	const period = pickRotating((secondaries.length > 0 ? secondaries : inventory).map((x) => x.letter), `w${weekKey(now)}:${displayName.toLowerCase()}`, secondaries[0]?.letter ?? primary.letter);
	const p = themeOf(primary.letter);
	const g1 = themeOf(gifts[0]);
	const g2 = gifts[1] ? themeOf(gifts[1]) : null;
	const g3 = gifts[2] ? themeOf(gifts[2]) : null;
	const s1 = themeOf(shadows[0]);
	const s2 = shadows[1] ? themeOf(shadows[1]) : null;
	const dailyTheme = themeOf(daily);
	const periodTheme = themeOf(period);
	const vowelLead = vowels[0] ? themeOf(vowels[0].letter) : null;
	const consLead = consonants[0] ? themeOf(consonants[0].letter) : null;
	const primaryStatement = `${possessive(displayName)} signature pressure is ${p.name} — ${article(p.name)} ${p.name.toLowerCase()} field gathered around ${primary.letter}. ${p.essence}`;
	const giftBits = [
		g1,
		g2,
		g3
	].filter(Boolean).map((t) => `${t.letter} (${t.name.toLowerCase()})`);
	const giftsStatement = g2 ? `The letters ${giftBits.join(", ")} keep company in this name. ${g1.gift} ${g2.gift}` : g1.gift;
	const challengeStatement = tension ? `${tension.copy} ${s1 ? `Meanwhile the quieter field of ${s1.letter} — ${s1.name.toLowerCase()} — waits as a shadow invitation: ${s1.invitation}` : ""}`.trim() : s2 ? `A growth edge appears where ${s1.name.toLowerCase()} and ${s2.name.toLowerCase()} are nearly silent. ${s1.invitation} ${s2.invitation}` : s1.challenge;
	const innerNote = vowelLead ? `Vowels in this name lean toward ${vowelLead.name.toLowerCase()}: ${vowelLead.inner}` : "This name carries almost no vowel field — a rare, highly articulated outer signature.";
	const outerNote = consLead ? `Consonants speak of ${consLead.name.toLowerCase()} in the outer life: ${consLead.outer}` : "This name is almost all vowel — an unusually inward constellation.";
	const synthesis = [
		`${displayName} tends to meet the world through ${p.name.toLowerCase()}, with ${g2 ? `${g2.name.toLowerCase()} close behind` : "little secondary weather to dilute it"}.`,
		tension ? `A living tension — ${tension.title.toLowerCase()} — gives the configuration its characteristic pressure.` : `${p.invitation}`,
		shadows.length ? `The letters do not sentence you. They describe a climate. The quieter fields of ${shadows.map((l) => `${l} (${themeOf(l).name.toLowerCase()})`).join(" and ")} remain available as practice, not as lack.` : "",
		`Notice where ${p.name.toLowerCase()} already shows up in ordinary days. Letterology is a mirror, not a forecast.`
	].filter(Boolean).join(" ");
	const dailyStatement = `Today's letter in this name is ${daily} — ${dailyTheme.name}. ${dailyTheme.invitation}`;
	const periodStatement = `This week's period focus is ${period} (${periodTheme.name.toLowerCase()}). ${periodTheme.invitation}`;
	return {
		displayName,
		normalized: parts.map((p) => p.letters).join(" "),
		parts,
		signature,
		primary,
		secondaries,
		inventory,
		vowels,
		consonants,
		tension,
		shadows,
		gifts,
		daily,
		period,
		statements: {
			primary: primaryStatement,
			gifts: giftsStatement,
			challenge: challengeStatement,
			synthesis,
			daily: dailyStatement,
			period: periodStatement,
			vowelNote: innerNote,
			consonantNote: outerNote
		}
	};
}
function readingAsText(h) {
	return [
		`Letterological Horoscope — ${h.displayName}`,
		`Normalized: ${h.normalized}`,
		"",
		`Signature letter: ${h.signature}`,
		`Primary: ${h.primary.letter} — ${themeOf(h.primary.letter).name}`,
		`Secondary: ${h.secondaries.map((s) => `${s.letter} (${themeOf(s.letter).name})`).join(", ") || "—"}`,
		h.tension ? `Tension: ${h.tension.title}` : "",
		`Shadow fields: ${h.shadows.map((s) => `${s} (${themeOf(s).name})`).join(", ")}`,
		`Daily letter: ${h.daily} — ${themeOf(h.daily).name}`,
		`Period focus: ${h.period} — ${themeOf(h.period).name}`,
		"",
		h.statements.primary,
		"",
		h.statements.gifts,
		"",
		h.statements.challenge,
		"",
		h.statements.synthesis,
		"",
		h.statements.vowelNote,
		h.statements.consonantNote,
		"",
		"This reading is reflective, not deterministic. The letters we carry are already speaking."
	].filter((line, i, arr) => !(line === "" && arr[i - 1] === "")).join("\n");
}
function letterPath(parts) {
	return parts.flatMap((p) => [...p.letters]);
}
var COLS = 7;
var CELL = 36;
var GAP = 8;
var PAD = 12;
function cellCenter(letter) {
	const i = ALPHABET.indexOf(letter);
	const col = i % COLS;
	const row = Math.floor(i / COLS);
	return {
		x: PAD + col * 44 + CELL / 2,
		y: PAD + row * 44 + CELL / 2
	};
}
function LetterMap({ horoscope, onSelect, selected }) {
	const byLetter = new Map(horoscope.inventory.map((item) => [item.letter, item]));
	const maxWeight = horoscope.inventory[0]?.weight || 1;
	const path = letterPath(horoscope.parts);
	const points = path.filter((letter, i) => i === 0 || path[i - 1] !== letter).map((letter) => cellCenter(letter)).map((p) => `${p.x},${p.y}`).join(" ");
	const rows = Math.ceil(ALPHABET.length / COLS);
	const width = 324;
	const height = 24 + rows * CELL + (rows - 1) * GAP;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "w-full overflow-x-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: `0 0 ${width} ${height}`,
			className: "mx-auto h-auto w-full max-w-lg",
			role: "img",
			"aria-label": `Letter map of ${horoscope.displayName}`,
			children: [points.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polyline", {
				points,
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.25",
				className: "text-primary/35",
				strokeLinejoin: "round",
				strokeLinecap: "round"
			}) : null, ALPHABET.map((letter) => {
				const { x, y } = cellCenter(letter);
				const item = byLetter.get(letter);
				const intensity = item ? Math.max(.14, item.weight / maxWeight) : 0;
				const isPrimary = horoscope.primary.letter === letter;
				const isSelected = selected === letter;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: x - CELL / 2,
						y: y - CELL / 2,
						width: CELL,
						height: CELL,
						rx: "6",
						className: cn(isPrimary ? "fill-primary" : item ? "fill-ink" : "fill-ink/8", onSelect ? "cursor-pointer" : ""),
						opacity: isPrimary ? 1 : item ? .18 + intensity * .72 : 1,
						onClick: () => onSelect?.(letter)
					}),
					isSelected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: x - CELL / 2 - 1.5,
						y: y - CELL / 2 - 1.5,
						width: 39,
						height: 39,
						rx: "8",
						fill: "none",
						className: "stroke-primary pointer-events-none",
						strokeWidth: "1.5"
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
						x,
						y: y + 1,
						textAnchor: "middle",
						dominantBaseline: "middle",
						className: cn("font-display pointer-events-none", isPrimary || intensity > .55 ? "fill-primary-fg" : item ? "fill-ink" : "fill-muted"),
						fontSize: "13",
						fontWeight: isPrimary ? 600 : 500,
						children: letter
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("title", { children: [
						letter,
						" — ",
						themeOf(letter).name,
						item ? ` · ${item.count}×` : " · silent in this name"
					] })
				] }, letter);
			})]
		})
	});
}
function Pill({ letter, label, active, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: active ? "inline-flex h-9 items-center gap-2 rounded-full bg-primary px-3 text-primary-fg" : "inline-flex h-9 items-center gap-2 rounded-full bg-raised px-3 text-ink shadow-[var(--shadow-border)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-display text-sm",
			children: letter
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-display text-xs tracking-[0.14em] uppercase opacity-80",
			children: label
		})]
	});
}
function HoroscopeView({ horoscope }) {
	const [selected, setSelected] = (0, import_react.useState)(horoscope.primary.letter);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const theme = themeOf(selected);
	const text = (0, import_react.useMemo)(() => readingAsText(horoscope), [horoscope]);
	async function copyReading() {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1800);
		} catch {
			setCopied(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "stagger-in space-y-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-end gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						"aria-hidden": "true",
						className: "font-display text-7xl leading-none text-primary sm:text-8xl",
						children: horoscope.signature
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-xs tracking-[0.2em] text-muted uppercase",
							children: "Letterological Horoscope"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-1 font-display text-3xl leading-tight text-ink sm:text-4xl",
							children: horoscope.displayName
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm tracking-wide text-muted",
							children: horoscope.normalized
						})
					] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "outline",
					onClick: copyReading,
					className: "self-start sm:self-auto",
					children: [copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {}), copied ? "Copied" : "Copy reading"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-xs tracking-[0.18em] text-muted uppercase",
						children: "Primary theme"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
						className: "mt-2 font-display text-3xl text-ink",
						children: [
							horoscope.primary.letter,
							" — ",
							themeOf(horoscope.primary.letter).name
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 max-w-3xl text-base leading-relaxed",
						children: horoscope.statements.primary
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
							letter: horoscope.primary.letter,
							label: "Primary",
							active: selected === horoscope.primary.letter,
							onClick: () => setSelected(horoscope.primary.letter)
						}), horoscope.secondaries.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, {
							letter: item.letter,
							label: themeOf(item.letter).name,
							active: selected === item.letter,
							onClick: () => setSelected(item.letter)
						}, item.letter))]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid gap-4 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-xs tracking-[0.18em] text-muted uppercase",
						children: "Gifts"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 leading-relaxed text-ink/90",
						children: horoscope.statements.gifts
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-xs tracking-[0.18em] text-muted uppercase",
							children: horoscope.tension ? "Tension" : "Growth edge"
						}),
						horoscope.tension ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mt-2 font-display text-xl text-ink",
							children: horoscope.tension.title
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 leading-relaxed text-ink/90",
							children: horoscope.statements.challenge
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-xs tracking-[0.18em] text-muted uppercase",
					children: "Portrait"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-3xl text-lg leading-relaxed",
					children: horoscope.statements.synthesis
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid gap-4 md:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-xl bg-raised p-5 shadow-[var(--shadow-border)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-xs tracking-[0.18em] text-muted uppercase",
						children: "Vowels · inner"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm leading-relaxed",
						children: horoscope.statements.vowelNote
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-xl bg-raised p-5 shadow-[var(--shadow-border)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-xs tracking-[0.18em] text-muted uppercase",
						children: "Consonants · outer"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm leading-relaxed",
						children: horoscope.statements.consonantNote
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid gap-4 md:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-xl bg-raised p-5 shadow-[var(--shadow-border)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-xs tracking-[0.18em] text-muted uppercase",
							children: "Daily letter"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setSelected(horoscope.daily),
							className: "mt-2 text-left",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
								className: "font-display text-2xl text-ink",
								children: [
									horoscope.daily,
									" — ",
									themeOf(horoscope.daily).name
								]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-relaxed",
							children: horoscope.statements.daily
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "rounded-xl bg-raised p-5 shadow-[var(--shadow-border)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-xs tracking-[0.18em] text-muted uppercase",
							children: "Period focus"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setSelected(horoscope.period),
							className: "mt-2 text-left",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
								className: "font-display text-2xl text-ink",
								children: [
									horoscope.period,
									" — ",
									themeOf(horoscope.period).name
								]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-relaxed",
							children: horoscope.statements.period
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-xs tracking-[0.18em] text-muted uppercase",
						children: "Living map"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: "The path traces the name across the alphabet. Darker cells carry more weight."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [
							"Shadow fields",
							" ",
							horoscope.shadows.map((letter) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setSelected(letter),
								className: "ml-1 font-display text-ink underline-offset-4 hover:underline",
								children: letter
							}, letter))
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LetterMap, {
					horoscope,
					selected,
					onSelect: setSelected
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LetterDetail, { letter: selected }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-center text-sm italic text-muted",
				children: ["The letters we carry are already speaking. This is a mirror, not a sentence.", theme ? ` ${theme.name} is one climate among many.` : ""]
			})
		]
	});
}
var Input = import_react.forwardRef(({ className, type, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		className: cn("flex h-12 w-full rounded-md bg-raised px-4 font-serif text-base text-ink shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-50", className),
		ref,
		...props
	});
});
Input.displayName = "Input";
var Label = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root, {
	ref,
	className: cn("font-display text-xs font-medium tracking-[0.16em] text-muted uppercase", className),
	...props
}));
Label.displayName = Root.displayName;
var EXAMPLES = [
	"Ada Lovelace",
	"James Baldwin",
	"Zora Neale Hurston",
	"Octavia Butler"
];
function NameForm({ initial = "", onSubmit, compact = false }) {
	const [value, setValue] = (0, import_react.useState)(initial);
	function handleSubmit(event) {
		event.preventDefault();
		const next = value.trim();
		if (!next) return;
		onSubmit(next);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit: handleSubmit,
		className: "w-full",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
				htmlFor: "full-name",
				children: "The name you carry"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex flex-col gap-2 sm:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					id: "full-name",
					name: "name",
					value,
					onChange: (e) => setValue(e.target.value),
					placeholder: "Ada Lovelace",
					autoComplete: "name",
					autoCapitalize: "words",
					spellCheck: false,
					"aria-describedby": "name-hint"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					className: "h-12 shrink-0 px-6",
					children: "Read the letters"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				id: "name-hint",
				className: "mt-2 text-sm text-muted",
				children: "A given name, a full name, or a username. Diacritics fold; only A–Z are read."
			}),
			!compact ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5 flex flex-wrap gap-2",
				children: EXAMPLES.map((name) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => {
						setValue(name);
						onSubmit(name);
					},
					className: "h-9 rounded-full bg-raised px-3.5 font-display text-xs tracking-wide text-ink shadow-[var(--shadow-border)] transition-[box-shadow,transform] duration-150 hover:shadow-[var(--shadow-border-hover)] active:scale-[0.96]",
					children: name
				}, name))
			}) : null
		]
	});
}
var RECENT_KEY = "letterology:recent";
function loadRecent() {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.localStorage.getItem(RECENT_KEY);
		const parsed = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string").slice(0, 8) : [];
	} catch {
		return [];
	}
}
function saveRecent(name) {
	if (typeof window === "undefined") return;
	const next = [name, ...loadRecent().filter((item) => item.toLowerCase() !== name.toLowerCase())].slice(0, 8);
	window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}
function siteDailyLetter() {
	const now = /* @__PURE__ */ new Date();
	const start = Date.UTC(now.getUTCFullYear(), 0, 0);
	const day = Math.floor((Date.now() - start) / 864e5);
	return ALPHABET[day % 26] ?? "L";
}
function Home() {
	const { name } = Route$3.useSearch();
	const navigate = useNavigate({ from: "/" });
	const [recent, setRecent] = (0, import_react.useState)([]);
	const horoscope = (0, import_react.useMemo)(() => name ? buildHoroscope(name) : null, [name]);
	const daily = themeOf(siteDailyLetter());
	(0, import_react.useEffect)(() => {
		setRecent(loadRecent());
	}, []);
	(0, import_react.useEffect)(() => {
		if (!horoscope) return;
		saveRecent(horoscope.displayName);
		setRecent(loadRecent());
	}, [horoscope]);
	function readName(next) {
		navigate({ search: { name: next } });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, { current: "read" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12",
				children: !horoscope ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mx-auto max-w-2xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col items-center text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: "/seal.jpg",
									alt: "Letterology wax seal",
									width: 112,
									height: 112,
									className: "size-24 rounded-full object-cover outline outline-1 -outline-offset-1 outline-ink/10 sm:size-28"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-6 font-display text-xs tracking-[0.28em] text-muted uppercase",
									children: "A living map of the alphabet"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "mt-3 font-display text-4xl leading-[1.05] text-ink sm:text-6xl",
									children: "Letterology"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-4 max-w-xl text-base leading-relaxed text-ink/85",
									children: "Every letter is a condensed field of meaning. A name is a personal constellation of those fields — not a prediction, a portrait."
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-10 rounded-xl bg-raised p-5 shadow-[var(--shadow-border)] sm:p-7",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NameForm, {
								initial: name ?? "",
								onSubmit: readName
							})
						}),
						recent.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-xs tracking-[0.16em] text-muted uppercase",
								children: "Recent readings"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-2 flex flex-wrap gap-2",
								children: recent.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => readName(item),
									className: "h-9 rounded-full bg-raised px-3.5 font-display text-xs tracking-wide text-ink shadow-[var(--shadow-border)]",
									children: item
								}, item))
							})]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
							className: "mt-12 border-t border-ink/10 pt-8 text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-display text-xs tracking-[0.18em] text-muted uppercase",
									children: "Letter of the day"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-2 font-display text-3xl text-ink",
									children: [
										daily.letter,
										" — ",
										daily.name
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted",
									children: daily.invitation
								})
							]
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-xl bg-raised p-4 shadow-[var(--shadow-border)] sm:p-5",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NameForm, {
							initial: horoscope.displayName,
							onSubmit: readName,
							compact: true
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HoroscopeView, { horoscope }, horoscope.normalized)]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteFooter, {})
		]
	});
}
//#endregion
export { Home as component };
