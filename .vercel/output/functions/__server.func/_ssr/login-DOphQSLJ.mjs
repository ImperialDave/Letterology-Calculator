import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as require_jsx_runtime } from "../_libs/@radix-ui/react-label+[...].mjs";
import { n as GROK_PROVIDERS } from "./router-ByjMqvw8.mjs";
import { i as signIn, n as SiteHeader, t as SiteFooter } from "./SiteChrome-DMaO45f7.mjs";
import { t as Button } from "./button-J6qjHEZZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-DOphQSLJ.js
var import_jsx_runtime = require_jsx_runtime();
function Login() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, { current: "login" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "mx-auto grid min-h-[70dvh] w-full max-w-md place-items-center px-4 py-12",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full rounded-xl bg-raised p-6 shadow-[var(--shadow-border)] sm:p-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-xs tracking-[0.2em] text-muted uppercase",
							children: "Account"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-2 font-display text-3xl text-ink",
							children: "Sign in"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-relaxed text-muted",
							children: "Readings work without an account. Sign in if you want a saved session on this device."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-6 space-y-2",
							children: GROK_PROVIDERS.map((provider) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								variant: "outline",
								className: "w-full",
								onClick: () => signIn(provider.providerId, { callbackURL: "/" }),
								children: ["Continue with ", provider.label]
							}, provider.providerId))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/",
							className: "mt-6 inline-flex h-9 items-center font-display text-xs tracking-[0.14em] text-muted uppercase hover:text-ink",
							children: "Return to the reading"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteFooter, {})
		]
	});
}
//#endregion
export { Login as component };
