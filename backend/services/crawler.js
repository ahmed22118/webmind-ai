import { chromium } from "playwright";
import { assertSafeCrawlTarget } from "../utils/ssrfGuard.js";

// Strip hash and trailing slash so we don't treat the same page as different URLs
function normalizeUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    u.hash = "";
    let normalized = u.toString();
    if (normalized.endsWith("/")) normalized = normalized.slice(0, -1);
    return normalized;
  } catch {
    return null;
  }
}

function isSameDomain(url, domain) {
  try {
    return new URL(url).hostname.replace(/^www\./, "") === domain.replace(/^www\./, "");
  } catch {
    return false;
  }
}

/**
 * Crawls a website starting at rootUrl, following only same-domain links,
 * up to maxPages. Every single URL — including the root and every discovered
 * link — is re-validated against the SSRF guard right before it's visited,
 * since a page could redirect to an internal address mid-crawl.
 */
export async function crawlWebsite(rootUrl, maxPages, onPageCrawled) {
  const rootDomain = new URL(rootUrl).hostname;
  const visited = new Set();
  const queue = [normalizeUrl(rootUrl)];
  let pagesCrawled = 0;

 const browser = await chromium.launch({
  headless: true,
  args: ["--disable-dev-shm-usage", "--disable-gpu", "--no-sandbox"],
});
  const context = await browser.newContext({
    userAgent: "WebMindAI-Crawler/1.0 (+https://webmind.ai/bot)",
  });

  // Block images/fonts/media/stylesheets — we only need text content,
  // and this significantly speeds up crawling heavy real-world sites.
  await context.route("**/*", (route) => {
    const type = route.request().resourceType();
    if (["image", "font", "media", "stylesheet"].includes(type)) {
      return route.abort();
    }
    return route.continue();
  });

  try {
    while (queue.length > 0 && pagesCrawled < maxPages) {
      const url = queue.shift();
      if (!url || visited.has(url)) continue;
      visited.add(url);

      // Re-validate right before navigating — catches DNS rebinding and
      // redirect-to-internal tricks that a one-time check at submit time would miss
      try {
        await assertSafeCrawlTarget(url);
      } catch (err) {
        console.warn(`Blocked unsafe URL ${url}: ${err.message}`);
        continue;
      }

      const page = await context.newPage();
      try {
        const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 40000 });

// Give client-side rendered content (common on modern sites like OLX) a chance
// to load, without blocking forever on sites that never go fully idle.
try {
          await page.waitForLoadState("networkidle", { timeout: 15000 });
        } catch {
          // Some sites keep background requests running indefinitely (analytics, chat
          // widgets, polling) — that's fine, we just proceed with whatever rendered.
        }

        // Some sites (infinite-scroll listing pages) only fetch and render more
        // content as the user scrolls. Keep scrolling until the page's height
        // stops growing (meaning no more new content is loading), rather than
        // a fixed number of scrolls — this matters a lot on catalog pages with
        // many items, where a handful of scrolls isn't nearly enough.
        try {
          let previousHeight = 0;
          const maxScrollAttempts = 20;

          for (let i = 0; i < maxScrollAttempts; i++) {
            const currentHeight = await page.evaluate(() => document.body.scrollHeight);

            if (currentHeight === previousHeight) {
              break; // page stopped growing — everything that will load has loaded
            }
            previousHeight = currentHeight;

            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(1000);

            // Some sites use a "Load more" button instead of pure auto-scroll —
            // click it if one is visible, so we don't get stuck below the fold.
            try {
              const loadMoreButton = page.getByText(/load more|show more/i).first();
              if (await loadMoreButton.isVisible({ timeout: 500 })) {
                await loadMoreButton.click({ timeout: 2000 });
                await page.waitForTimeout(1000);
              }
            } catch {
              // no "load more" button present — that's fine, pure scroll may be enough
            }
          }
        } catch {
          // if the page can't be scrolled for some reason, just proceed with what we have
        }

        // If the site redirected us somewhere, validate the final landed URL too
        const finalUrl = response ? response.url() : url;
        if (finalUrl !== url) {
          try {
            await assertSafeCrawlTarget(finalUrl);
          } catch (err) {
            console.warn(`Blocked unsafe redirect target ${finalUrl}: ${err.message}`);
            continue;
          }
        }

        const title = await page.title();
        const html = await page.content();

        await onPageCrawled({ url: finalUrl, title, html });
        pagesCrawled++;

        // Collect same-domain links to keep crawling. Links that look like
        // pagination of the SAME listing/search (e.g. "?page=2" of the exact
        // same path, or "/page-2.html" in the same directory) are prioritized
        // ahead of unrelated site-wide links — so a limited page budget gets
        // spent exhausting the topic the user actually asked about, instead
        // of wandering into unrelated categories.
        const links = await page.$$eval("a[href]", (anchors) =>
          anchors.map((a) => a.href)
        );

        const rootPath = new URL(rootUrl).pathname.replace(/\/$/, "");
        const rootDir = rootPath.substring(0, rootPath.lastIndexOf("/") + 1);

        for (const link of links) {
          const normalized = normalizeUrl(link);
          if (
            !normalized ||
            visited.has(normalized) ||
            !isSameDomain(normalized, rootDomain) ||
            !(normalized.startsWith("http://") || normalized.startsWith("https://"))
          ) {
            continue;
          }

          let isSameTopicPagination = false;
          try {
            const linkUrl = new URL(normalized);
            const linkPath = linkUrl.pathname.replace(/\/$/, "");

            // Pagination via query string on the EXACT same path (e.g. "?page=2")
            const sameExactPath =
              linkPath === rootPath && /[?&](page|p)=\d+/i.test(linkUrl.search);

            // Pagination via path suffix on the EXACT same path (e.g.
            // "/collections/men-shirts/page-2") — must start with the full
            // rootPath itself, NOT just the shared parent directory, so
            // sibling collections (e.g. "/collections/sale") never match.
            const samePathSuffixPagination =
              linkPath.startsWith(rootPath) && /\/page[-\/]?\d+$/i.test(linkPath);

            isSameTopicPagination = sameExactPath || samePathSuffixPagination;
          } catch {
            // if URL parsing fails here, just treat as a normal-priority link
          } 

          if (isSameTopicPagination) {
            queue.unshift(normalized); // jump ahead of everything else queued
          } else {
            queue.push(normalized);
          }
        }
      } catch (err) {
        console.warn(`Skipping ${url}: ${err.message}`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  return pagesCrawled;
}