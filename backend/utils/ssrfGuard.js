import dns from "dns/promises";
import net from "net";

// Checks whether an IP address falls into a private, loopback, or link-local range
function isPrivateIp(ip) {
  const type = net.isIP(ip);

  if (type === 4) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 127) return true; // loopback
    if (a === 169 && b === 254) return true; // link-local
    if (a === 0) return true; // "this" network
    return false;
  }

  if (type === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true; // loopback
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local fc00::/7
    if (lower.startsWith("fe80")) return true; // link-local
    return false;
  }

  return true; // couldn't parse -> treat as unsafe
}

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "0.0.0.0",
  "metadata.google.internal", // GCP metadata
]);

/**
 * Validates a user-submitted URL is safe to crawl:
 * - only http/https
 * - hostname isn't an obviously blocked internal name
 * - hostname resolves to a public (non-private) IP address
 * Throws an Error with a user-safe message if the URL should be rejected.
 */
export async function assertSafeCrawlTarget(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Enter a valid URL, including http:// or https://");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http:// and https:// URLs are allowed");
  }

  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new Error("This URL cannot be crawled");
  }

  // If the hostname itself is an IP literal (e.g. http://127.0.0.1), check it directly
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new Error("This URL cannot be crawled");
    }
    return; // public IP literal, allowed
  }

  // Otherwise resolve DNS and check every returned address (defends against DNS rebinding)
  let addresses;
  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch {
    throw new Error("Could not resolve this domain");
  }

  if (addresses.length === 0) {
    throw new Error("Could not resolve this domain");
  }

  for (const { address } of addresses) {
    if (isPrivateIp(address)) {
      throw new Error("This URL cannot be crawled");
    }
  }
}