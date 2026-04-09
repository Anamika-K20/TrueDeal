/**
 * Scrapes a single Myntra product page.
 * Usage: node puppeteer_myntra.js <url>
 */

const puppeteer = require("puppeteer");

async function run() {
  const targetUrl = process.argv[2];
  if (!targetUrl) {
    process.stdout.write(JSON.stringify({ error: "Missing URL argument" }));
    process.exit(1);
  }

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

    await page.goto(targetUrl, { waitUntil: "networkidle2", timeout: 60000 });

    // Wait for price to appear
    await page.waitForSelector(".pdp-price, .pdp-discount-container, h1.pdp-title", {
      timeout: 15000,
    }).catch(() => null);

    const payload = await page.evaluate(() => {
      function parsePrice(text) {
        if (!text) return null;
        const match = String(text).replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
        if (!match) return null;
        const val = parseFloat(match[1]);
        return isNaN(val) ? null : Math.round(val);
      }

      function text(selector) {
        const el = document.querySelector(selector);
        return el ? el.textContent.replace(/\s+/g, " ").trim() : null;
      }

      // Product name
      const name =
        text("h1.pdp-title") ||
        text(".pdp-name") ||
        document.querySelector('meta[property="og:title"]')?.getAttribute("content") ||
        null;

      // Current price (discounted)
      const priceRaw =
        text(".pdp-price strong") ||
        text(".pdp-price") ||
        text('[class*="pdp-price"]');

      // MRP (original price)
      const mrpRaw =
        text(".pdp-mrp s") ||
        text(".pdp-mrp") ||
        text('[class*="pdp-mrp"]');

      const price = parsePrice(priceRaw);
      const mrp = parsePrice(mrpRaw);

      // Breadcrumb for category validation
      const breadcrumb = Array.from(
        document.querySelectorAll(".breadcrumbs-container a, nav[aria-label='breadcrumb'] a")
      )
        .map((el) => el.textContent.trim())
        .filter(Boolean)
        .join(" ");

      // Product image
      const image =
        document.querySelector('img.image-grid-image')?.getAttribute("src") ||
        document.querySelector('img[class*="image-grid"]')?.getAttribute("src") ||
        document.querySelector('meta[property="og:image"]')?.getAttribute("content") ||
        null;

      return {
        url: window.location.href,
        name,
        price,
        mrp,
        breadcrumb,
        image,
      };
    });

    process.stdout.write(JSON.stringify(payload));
  } catch (err) {
    process.stdout.write(JSON.stringify({ error: err.message || String(err) }));
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

run();
