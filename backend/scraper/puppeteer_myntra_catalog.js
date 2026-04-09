/**
 * Crawls Myntra bags category pages and returns product URLs.
 * Usage: node puppeteer_myntra_catalog.js <pages>
 *   pages = number of pages to crawl (default: 5)
 *
 * Myntra bags category URLs:
 *   https://www.myntra.com/bags
 *   https://www.myntra.com/backpacks
 *   https://www.myntra.com/handbags
 *   https://www.myntra.com/wallets
 *   https://www.myntra.com/luggage-trolley-bags
 */

const puppeteer = require("puppeteer");

const PAGES = Math.min(parseInt(process.argv[2]) || 5, 20);

const CATEGORIES = [
  "bags",
  "backpacks",
  "handbags",
  "wallets",
  "luggage-trolley-bags",
  "sling-bags",
  "clutches",
  "laptop-bags",
  "duffel-bags",
  "tote-bags",
];

async function scrapeCategory(page, category, maxPages) {
  const urls = new Set();

  for (let p = 1; p <= maxPages; p++) {
    const url = `https://www.myntra.com/${category}?p=${p}`;
    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
      await page.waitForSelector(".product-base, .product-productMetaInfo", {
        timeout: 10000,
      }).catch(() => null);

      const pageUrls = await page.evaluate(() => {
        const links = document.querySelectorAll("a.product-base, li.product-base a, .product-productMetaInfo a");
        const found = [];
        links.forEach((a) => {
          const href = a.getAttribute("href");
          if (href && href.includes("/buy/")) {
            found.push("https://www.myntra.com" + href);
          }
        });
        // Also try direct product card links
        document.querySelectorAll('a[href*="/buy/"]').forEach((a) => {
          found.push(a.href);
        });
        return [...new Set(found)];
      });

      pageUrls.forEach((u) => urls.add(u));

      if (pageUrls.length === 0) break; // no more products
      await new Promise((r) => setTimeout(r, 1500));
    } catch {
      break;
    }
  }

  return Array.from(urls);
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
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-IN,en;q=0.9" });

    const allUrls = new Set();

    for (const category of CATEGORIES) {
      const urls = await scrapeCategory(page, category, PAGES);
      urls.forEach((u) => allUrls.add(u));
      await new Promise((r) => setTimeout(r, 2000));
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
