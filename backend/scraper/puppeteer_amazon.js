const puppeteer = require("puppeteer");

async function run() {
  const targetUrl = process.argv[2];
  if (!targetUrl) {
    process.stdout.write(JSON.stringify({ error: "Missing URL argument" }));
    process.exit(1);
    return;
  }

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForSelector("#productTitle, title", { timeout: 15000 }).catch(() => null);

    const payload = await page.evaluate(() => {
      function parsePrice(value) {
        if (!value) {
          return null;
        }

        const raw = String(value).replace(/,/g, "");
        const match = raw.match(/(\d+(?:\.\d+)?)/);
        if (!match) {
          return null;
        }

        const parsed = Number.parseFloat(match[1]);
        if (Number.isNaN(parsed)) {
          return null;
        }

        return Math.round(parsed);
      }

      function textFromSelectors(selectors) {
        for (const selector of selectors) {
          const node = document.querySelector(selector);
          if (node && node.textContent) {
            const text = node.textContent.replace(/\s+/g, " ").trim();
            if (text) {
              return text;
            }
          }
        }
        return null;
      }

      function contentFromMeta(selectors) {
        for (const selector of selectors) {
          const node = document.querySelector(selector);
          const content = node ? node.getAttribute("content") : null;
          if (content && content.trim()) {
            return content.trim();
          }
        }
        return null;
      }

      function extractFromJsonLd() {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));

        let name = null;
        let price = null;
        let mrp = null;

        for (const script of scripts) {
          const raw = script.textContent ? script.textContent.trim() : "";
          if (!raw) {
            continue;
          }

          let data;
          try {
            data = JSON.parse(raw);
          } catch {
            continue;
          }

          const stack = [data];
          while (stack.length > 0) {
            const item = stack.pop();
            if (Array.isArray(item)) {
              stack.push(...item);
              continue;
            }

            if (!item || typeof item !== "object") {
              continue;
            }

            for (const key of ["@graph", "itemListElement", "mainEntity", "items"]) {
              if (key in item) {
                stack.push(item[key]);
              }
            }

            const itemType = item["@type"];
            const isProduct = itemType === "Product" || (Array.isArray(itemType) && itemType.includes("Product"));
            if (!isProduct) {
              continue;
            }

            if (!name && item.name) {
              name = String(item.name).replace(/\s+/g, " ").trim();
            }

            let offers = item.offers;
            if (Array.isArray(offers)) {
              offers = offers.length > 0 ? offers[0] : null;
            }

            if (offers && typeof offers === "object") {
              if (price == null) {
                price = parsePrice(offers.price || offers.lowPrice);
              }
              if (mrp == null) {
                mrp = parsePrice(offers.highPrice || offers.priceBeforeDiscount);
              }
            }
          }
        }

        return { name, price, mrp };
      }

      const title = document.title ? document.title.replace(/\s+/g, " ").trim() : null;

      const name = textFromSelectors([
        "#productTitle",
        "h1",
      ]) || contentFromMeta([
        'meta[property="og:title"]',
        'meta[name="title"]',
        'meta[name="twitter:title"]',
      ]);

      const price = parsePrice(
        textFromSelectors([
          "span.a-price-whole",
          "span.a-price span.a-offscreen",
          "span.priceToPay span.a-offscreen",
        ]) || contentFromMeta([
          'meta[property="product:price:amount"]',
          'meta[property="og:price:amount"]',
          'meta[itemprop="price"]',
        ])
      );

      const mrp = parsePrice(
        textFromSelectors([
          "span.a-price.a-text-price span.a-offscreen",
          "span.a-price.a-text-strike span.a-offscreen",
          "span.a-text-price span.a-offscreen",
        ])
      );

      const breadcrumb = Array.from(
        document.querySelectorAll("#wayfinding-breadcrumbs_feature_div a, #wayfinding-breadcrumbs_container a")
      )
        .map((node) => (node.textContent || "").replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .join(" ");

      const ld = extractFromJsonLd();

      return {
        url: window.location.href,
        title,
        breadcrumb,
        name: name || ld.name,
        price: price != null ? price : ld.price,
        mrp: mrp != null ? mrp : ld.mrp,
      };
    });

    process.stdout.write(JSON.stringify(payload));
  } catch (error) {
    process.stdout.write(JSON.stringify({ error: error.message || String(error) }));
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

run();
