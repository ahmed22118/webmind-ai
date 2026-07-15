import * as cheerio from "cheerio";

const CHUNK_SIZE_WORDS = parseInt(process.env.CHUNK_SIZE_WORDS, 10) || 700;
const CHUNK_OVERLAP_WORDS = parseInt(process.env.CHUNK_OVERLAP_WORDS, 10) || 100;
const MAX_HTML_SIZE_BYTES = parseInt(process.env.MAX_HTML_SIZE_BYTES, 10) || 5_000_000;
const MAX_WORDS_PER_PAGE = 50_000;

export function cleanHtml(rawHtml, baseUrl = "") {
  if (typeof rawHtml !== "string") return "";

  let html = rawHtml;
  if (Buffer.byteLength(html, "utf8") > MAX_HTML_SIZE_BYTES) {
    console.warn(`Page HTML exceeds ${MAX_HTML_SIZE_BYTES} bytes — truncating before parsing`);
    html = html.slice(0, Math.floor(MAX_HTML_SIZE_BYTES / 2));
  }

  const $ = cheerio.load(html);

  $(
    "script, style, noscript, nav, header, footer, iframe, form, button, svg, aside, link, meta"
  ).remove();

  $('[style*="display:none"], [style*="display: none"], [hidden], [aria-hidden="true"]').remove();

  $('[class*="cookie"], [class*="advert"], [class*="banner-ad"], [id*="cookie-consent"]').remove();

  $("a[href]").each((_, el) => {
    const $el = $(el);
    const href = $el.attr("href");
    const text = $el.text().trim();
    if (!href || !text) return;

    let absoluteUrl;
    try {
      absoluteUrl = baseUrl ? new URL(href, baseUrl).toString() : new URL(href).toString();
    } catch {
      return;
    }

    if (!/^https?:\/\//i.test(absoluteUrl)) return;

    $el.replaceWith(`${text} (${absoluteUrl})`);
  });

  $("p, div, li, h1, h2, h3, h4, h5, h6, br, tr, td, blockquote, pre, section, article").after(
    "\n"
  );

  let text = $("body").text();

  text = text
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");

  return text.trim();
}

/**
 * Detects product-listing/catalog-style pages (many repeated "price" markers
 * close together) and splits them one-product-per-chunk instead of by raw
 * word count. This keeps each embedding focused on a single item, so
 * attribute-specific searches (e.g. "boxy shirts") aren't diluted by being
 * lumped in with 20+ unrelated products in one chunk.
 */
function chunkProductListing(text) {
  // Matches the end of a price mention — the natural boundary between one
  // product's info and the next on a catalog page.
  const priceBoundaryRegex = /(?:Regular price:\s*PKR\s*[\d,]+|(?<!Regular )Price:\s*PKR\s*[\d,]+)/gi;

  const matches = [...text.matchAll(priceBoundaryRegex)];

  // Only treat this as a product listing if there are enough repeated price
  // markers to indicate a real catalog page, not just one or two incidental
  // mentions on a normal content page.
  if (matches.length < 3) return null;

  const segments = [];
  let cursor = 0;

  for (const match of matches) {
    const end = match.index + match[0].length;
    const segment = text.slice(cursor, end).trim();
    if (segment) segments.push(segment);
    cursor = end;
  }

  // Capture any trailing text after the last price mention (e.g. footer text)
  const trailing = text.slice(cursor).trim();
  if (trailing) {
    if (segments.length > 0) {
      segments[segments.length - 1] += "\n" + trailing;
    } else {
      segments.push(trailing);
    }
  }

  return segments.map((content, chunkIndex) => ({
    content,
    wordCount: content.split(/\s+/).filter(Boolean).length,
    chunkIndex,
  }));
}

export function chunkText(text, chunkSize = CHUNK_SIZE_WORDS, overlap = CHUNK_OVERLAP_WORDS) {
  let words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  if (words.length > MAX_WORDS_PER_PAGE) {
    console.warn(`Page has ${words.length} words, exceeding cap of ${MAX_WORDS_PER_PAGE} — truncating`);
    words = words.slice(0, MAX_WORDS_PER_PAGE);
  }

  const chunks = [];
  let start = 0;
  let chunkIndex = 0;

  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    const chunkWords = words.slice(start, end);

    chunks.push({
      content: chunkWords.join(" "),
      wordCount: chunkWords.length,
      chunkIndex,
    });

    chunkIndex++;
    if (end === words.length) break;
    start += chunkSize - overlap;
  }

  return chunks;
}

export function processHtmlIntoChunks(rawHtml, baseUrl) {
  const cleanedText = cleanHtml(rawHtml, baseUrl);

  // Try product-per-chunk splitting first; fall back to normal word-based
  // chunking for regular (non-catalog) pages.
  const productChunks = chunkProductListing(cleanedText);
  if (productChunks) return productChunks;

  return chunkText(cleanedText);
}