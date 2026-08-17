import { firebaseConfig } from "./app";

export type AuthDoorReason = "no-config" | "google-off" | "domain-off" | "unknown";

export type AuthDoorStatus = {
  ok: boolean;
  reason: AuthDoorReason | null;
  message: string | null;
  domains: string[];
};

export function hostOf(origin: string): string {
  try {
    return new URL(origin).hostname;
  } catch {
    return origin.replace(/^https?:\/\//, "").split("/")[0] ?? origin;
  }
}

export function interpretAuthPreflight(input: {
  config: { authorizedDomains?: string[] } | null;
  configError?: string | null;
  googleError?: string | null;
  origin: string;
}): AuthDoorStatus {
  const domains = input.config?.authorizedDomains ?? [];
  const host = hostOf(input.origin);
  const configText = `${input.configError ?? ""} ${input.googleError ?? ""}`;

  if (/CONFIGURATION_NOT_FOUND/i.test(configText) || (!input.config && input.configError)) {
    return {
      ok: false,
      reason: "no-config",
      message: "Google sign-in is not turned on for this project yet.",
      domains,
    };
  }

  const googleOff = /OPERATION_NOT_ALLOWED|identity provider configuration is not found/i.test(
    input.googleError ?? "",
  );
  const domainOff = Boolean(host) && !domains.includes(host);

  if (googleOff && domainOff) {
    return {
      ok: false,
      reason: "google-off",
      message: `Google is not enabled on this Firebase project yet. ${host} is not on the allowed list yet.`,
      domains,
    };
  }
  if (googleOff) {
    return {
      ok: false,
      reason: "google-off",
      message: "Google is not enabled on this Firebase project yet.",
      domains,
    };
  }
  if (domainOff) {
    return {
      ok: false,
      reason: "domain-off",
      message: `${host} is not on the allowed list yet.`,
      domains,
    };
  }
  if (input.googleError) {
    return {
      ok: false,
      reason: "unknown",
      message: input.googleError,
      domains,
    };
  }
  return { ok: true, reason: null, message: null, domains };
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: { message?: string } };
    return String(body.error?.message ?? res.statusText);
  } catch {
    return res.statusText;
  }
}

export async function probeAuthDoor(origin: string): Promise<AuthDoorStatus> {
  const key = firebaseConfig?.apiKey;
  if (!key) {
    return {
      ok: false,
      reason: "no-config",
      message: "Google sign-in is not turned on for this project yet.",
      domains: [],
    };
  }

  let config: { authorizedDomains?: string[] } | null = null;
  let configError: string | null = null;
  try {
    const res = await fetch(
      `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=${encodeURIComponent(key)}`,
    );
    if (!res.ok) configError = await readError(res);
    else config = (await res.json()) as { authorizedDomains?: string[] };
  } catch (err) {
    configError = err instanceof Error ? err.message : "Could not reach Google.";
  }

  let googleError: string | null = null;
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId: "google.com", continueUri: origin }),
      },
    );
    if (!res.ok) googleError = await readError(res);
  } catch (err) {
    googleError = err instanceof Error ? err.message : "Could not reach Google.";
  }

  return interpretAuthPreflight({ config, configError, googleError, origin });
}
