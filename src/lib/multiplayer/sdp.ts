/** DTLS fingerprint line from an SDP blob, or null when the blob has none. */
export function sdpFingerprint(sdp: string | undefined): string | null {
  if (!sdp) return null;
  for (const line of sdp.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("a=fingerprint:")) return trimmed;
  }
  return null;
}
