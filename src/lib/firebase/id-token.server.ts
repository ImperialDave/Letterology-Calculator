import { createVerify } from "node:crypto";
import { publicFirebaseConfig } from "./public-config";

const CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

export class FirebaseTokenError extends Error {
  readonly status = 401;
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "FirebaseTokenError";
  }
}

export type FirebaseTokenClaims = {
  iss: string;
  aud: string;
  exp: number;
  iat?: number;
  sub: string;
  email?: string;
  email_verified?: boolean;
};

export type VerifiedFirebaseUser = {
  uid: string;
  email: string | null;
  emailVerified: boolean;
};

type CertCache = { certs: Record<string, string>; exp: number };

let certCache: CertCache | null = null;

function b64urlToBuffer(value: string): Buffer {
  const pad = (4 - (value.length % 4)) % 4;
  const b64 = value.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat(pad);
  return Buffer.from(b64, "base64");
}

export function parseJwt(token: string): {
  header: { alg?: string; kid?: string };
  payload: FirebaseTokenClaims;
  signingInput: string;
  signature: Buffer;
} {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    throw new FirebaseTokenError("Unauthorized");
  }
  let header: { alg?: string; kid?: string };
  let payload: FirebaseTokenClaims;
  try {
    header = JSON.parse(b64urlToBuffer(parts[0]).toString("utf8")) as { alg?: string; kid?: string };
    payload = JSON.parse(b64urlToBuffer(parts[1]).toString("utf8")) as FirebaseTokenClaims;
  } catch {
    throw new FirebaseTokenError("Unauthorized");
  }
  return {
    header,
    payload,
    signingInput: `${parts[0]}.${parts[1]}`,
    signature: b64urlToBuffer(parts[2]),
  };
}

export function assertFirebaseClaims(
  claims: FirebaseTokenClaims,
  projectId: string,
  nowSec: number,
): VerifiedFirebaseUser {
  const iss = `https://securetoken.google.com/${projectId}`;
  if (claims.iss !== iss) throw new FirebaseTokenError("Unauthorized");
  if (claims.aud !== projectId) throw new FirebaseTokenError("Unauthorized");
  if (typeof claims.exp !== "number" || claims.exp <= nowSec) throw new FirebaseTokenError("Unauthorized");
  if (!claims.sub || typeof claims.sub !== "string") throw new FirebaseTokenError("Unauthorized");
  return {
    uid: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
    emailVerified: claims.email_verified === true,
  };
}

function parseMaxAge(header: string | null): number {
  if (!header) return 3600;
  const match = /max-age\s*=\s*(\d+)/i.exec(header);
  if (!match?.[1]) return 3600;
  return Math.max(60, Number(match[1]));
}

export async function getGoogleCerts(now = Date.now()): Promise<Record<string, string>> {
  if (certCache && now < certCache.exp) return certCache.certs;
  const response = await fetch(CERTS_URL);
  if (!response.ok) throw new FirebaseTokenError("Unauthorized");
  const certs = (await response.json()) as Record<string, string>;
  const maxAge = parseMaxAge(response.headers.get("cache-control"));
  certCache = { certs, exp: now + maxAge * 1000 };
  return certs;
}

export function verifyJwtSignature(pem: string, signingInput: string, signature: Buffer): boolean {
  const verifier = createVerify("SHA256");
  verifier.update(signingInput);
  verifier.end();
  return verifier.verify(pem, signature);
}

export async function verifyFirebaseIdToken(
  token: string,
  opts?: {
    nowSec?: number;
    projectId?: string;
    certs?: Record<string, string>;
  },
): Promise<VerifiedFirebaseUser> {
  const parsed = parseJwt(token);
  if (parsed.header.alg !== "RS256") throw new FirebaseTokenError("Unauthorized");
  const projectId = opts?.projectId ?? publicFirebaseConfig.projectId;
  const certs = opts?.certs ?? (await getGoogleCerts());
  const kid = parsed.header.kid;
  const pem = kid ? certs[kid] : undefined;
  if (!pem) throw new FirebaseTokenError("Unauthorized");
  if (!verifyJwtSignature(pem, parsed.signingInput, parsed.signature)) {
    throw new FirebaseTokenError("Unauthorized");
  }
  return assertFirebaseClaims(parsed.payload, projectId, opts?.nowSec ?? Math.floor(Date.now() / 1000));
}
