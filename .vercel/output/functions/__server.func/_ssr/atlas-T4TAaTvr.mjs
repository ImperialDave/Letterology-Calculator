import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as require_jsx_runtime } from "../_libs/@radix-ui/react-label+[...].mjs";
import { c as ALPHABET, o as Route$2, u as VOWEL_LETTERS } from "./router-ByjMqvw8.mjs";
import { n as SiteHeader, r as cn, t as SiteFooter } from "./SiteChrome-DMaO45f7.mjs";
import { r as themeOf, t as LetterDetail } from "./LetterDetail-B90BCbwb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/atlas-T4TAaTvr.js
var import_jsx_runtime = require_jsx_runtime();
function AtlasPage() {
	const { letter } = Route$2.useSearch();
	const navigate = useNavigate({ from: "/atlas" });
	const selected = letter ?? "A";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, { current: "atlas" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "max-w-2xl",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-xs tracking-[0.22em] text-muted uppercase",
								children: "The twenty-six fields"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "mt-2 font-display text-4xl text-ink sm:text-5xl",
								children: "Letter Atlas"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 max-w-xl leading-relaxed text-ink/85",
								children: "Each theme is drawn from the conceptual neighborhood of words that begin with the letter. Vowels tend to speak of inner orientation; consonants of outer expression."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-8 grid grid-cols-5 gap-2 sm:grid-cols-7",
						children: ALPHABET.map((item) => {
							const active = item === selected;
							const isVowel = VOWEL_LETTERS.has(item);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => navigate({ search: { letter: item } }),
								className: cn("flex aspect-square items-center justify-center rounded-md font-display text-lg transition-[background-color,color,transform] duration-150 active:scale-[0.96]", active ? "bg-primary text-primary-fg" : "bg-raised text-ink shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]"),
								"aria-pressed": active,
								"aria-label": `${item} — ${themeOf(item).name}${isVowel ? ", vowel" : ""}`,
								children: item
							}, item);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-8",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LetterDetail, { letter: selected })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteFooter, {})
		]
	});
}
//#endregion
export { AtlasPage as component };
