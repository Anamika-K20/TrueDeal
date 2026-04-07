/**
 * Crawls Amazon search results for a given query and returns product URLs.
 * Usage: node puppeteer_catalog.js "bags" 8
 *   arg1 = search query (default: "bags")
 *   arg2 = number of pages to crawl (default: 8)
 */

const puppeteer = require("puppeteer");

const SEARCH_QUERY = process.argv[2] || "bags";
const PAGES = Math.min(parseInt(process.argv[3]) || 8, 25); // cap at 25 pages

async function scrapeSearchPage(page, pageNum) {
  const url = `https://www.amazon.in/s?k=${encodeURIComponent(SEARCH_QUERY)}&page=${pageNum}`;

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForSelector('[data-component-type="s-search-result"]', { timeout: 15000 }).catch(() => null);

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
}

async function run() {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");

    const allUrls = new Set();

    for (let i = 1; i <= PAGES; i++) {
      const urls = await scrapeSearchPage(page, i);
      urls.forEach((u) => allUrls.add(u));
      // Small delay between pages to be polite
      await new Promise((r) => setTimeout(r, 1500));
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
