/**
 * Crawls Amazon search results for a given query and returns product URLs.
 * Usage: node puppeteer_catalog.js "bags" 8
 *   arg1 = search query (default: "bags")
 *   arg2 = number of pages to crawl (default: 8)
 */

const puppeteer = require("puppeteer");

const SEARCH_QUERY = process.argv[2] || "bags";
const PAGES = Math.min(parseInt(process.argv[3]) || 8, 25); // cap at 25 pages
const NAV_TIMEOUT_MS = parseInt(process.env.CATALOG_NAV_TIMEOUT_MS || "90000", 10);
const INTER_PAGE_DELAY_MS = parseInt(process.env.CATALOG_INTER_PAGE_DELAY_MS || "2000", 10);
const RETRIES_PER_PAGE = parseInt(process.env.CATALOG_RETRIES_PER_PAGE || "2", 10);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrapeSearchPage(page, pageNum) {
  const url = `https://www.amazon.in/s?k=${encodeURIComponent(SEARCH_QUERY)}&page=${pageNum}`;

  for (let attempt = 1; attempt <= RETRIES_PER_PAGE + 1; attempt++) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT_MS });
      await page.waitForSelector('[data-component-type="s-search-result"]', {
        timeout: Math.max(15000, Math.floor(NAV_TIMEOUT_MS / 3)),
      }).catch(() => null);

      return page.evaluate(() => {
        const results = document.querySelectorAll('[data-component-type="s-search-result"]');
        const urls = [];

        results.forEach((el) => {
          const asin = el.getAttribute("data-asin");
          if (asin && asin.trim()) {
            urls.push(`https://www.amazon.in/dp/${asin.trim()}`);
          }
        });

        return urls;
      });
    } catch (err) {
      if (attempt > RETRIES_PER_PAGE) {
        throw err;
      }
      await sleep(1000 * attempt);
    }
  }

  return [];
}

async function run() {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
    page.setDefaultNavigationTimeout(NAV_TIMEOUT_MS);
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const type = request.resourceType();
      if (type === "image" || type === "media" || type === "font") {
        request.abort();
        return;
      }
      request.continue();
    });

    const allUrls = new Set();

    for (let i = 1; i <= PAGES; i++) {
      try {
        const urls = await scrapeSearchPage(page, i);
        urls.forEach((u) => allUrls.add(u));
      } catch (err) {
        console.error(`[catalog] page ${i} failed: ${err.message || String(err)}`);
      }
      // Delay between pages to reduce throttling.
      await sleep(INTER_PAGE_DELAY_MS);
    }

    process.stdout.write(JSON.stringify({ urls: Array.from(allUrls) }));
  } catch (err) {
    process.stdout.write(JSON.stringify({ error: err.message || String(err) }));
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

run();
