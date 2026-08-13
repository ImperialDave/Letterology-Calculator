export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the older execCommand path
  }
  if (typeof document === "undefined") return false;
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.setAttribute("aria-hidden", "true");
    el.style.position = "fixed";
    el.style.top = "0";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.focus();
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

export function openXIntent(href: string) {
  if (typeof window === "undefined") return;
  const width = 550;
  const height = 420;
  const left = Math.round(window.screen.width / 2 - width / 2);
  const top = Math.max(0, Math.round(window.screen.height / 2 - height / 2));
  window.open(
    href,
    "letterology-x",
    `scrollbars=yes,resizable=yes,toolbar=no,location=yes,width=${width},height=${height},left=${left},top=${top}`,
  );
}
