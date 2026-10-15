export const PASSWORD_MIN = 12;

export type PasswordMode = "no-email" | "provider-off" | "set" | "change";

export type PasswordProblem = "short" | "mismatch" | "same-as-email" | "missing-current";

/** Which password form to show. Provider-off wins, so a dead switch is not a blank email. */
export function passwordMode(input: {
  email: string | null;
  hasPassword: boolean;
  providerEnabled: boolean;
}): PasswordMode {
  if (!input.providerEnabled) return "provider-off";
  if (!input.email?.trim()) return "no-email";
  return input.hasPassword ? "change" : "set";
}

export function checkPassword(input: {
  password: string;
  confirm: string;
  email: string;
  current?: string;
}): PasswordProblem | null {
  if (input.current !== undefined && input.current.length === 0) return "missing-current";
  if (input.password.length < PASSWORD_MIN) return "short";
  if (input.password !== input.confirm) return "mismatch";
  const email = input.email.trim().toLowerCase();
  if (email && input.password.toLowerCase() === email) return "same-as-email";
  return null;
}
