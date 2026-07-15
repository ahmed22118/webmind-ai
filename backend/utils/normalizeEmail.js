// Normalizes email for duplicate-detection purposes.
// Gmail (and Google Workspace via googlemail.com) ignores dots in the local part
// and ignores anything after a '+' (plus-addressing). This function collapses
// those variants down to one canonical form so they're treated as the same account.
export function normalizeEmail(email) {
  if (typeof email !== "string") return "";
  const trimmed = email.trim().toLowerCase();
  const [localPart, domain] = trimmed.split("@");
  if (!localPart || !domain) return trimmed;

  const isGmail = domain === "gmail.com" || domain === "googlemail.com";

  if (isGmail) {
    const withoutPlus = localPart.split("+")[0];
    const withoutDots = withoutPlus.replace(/\./g, "");
    return `${withoutDots}@gmail.com`;
  }

  return trimmed;
}