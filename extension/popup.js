const API = "https://truedeal-production.up.railway.app";

const VERDICT_META = {
  great_deal: { label: "Great Deal", cls: "green" },
  good_deal:  { label: "Good Deal",  cls: "green" },
  fair_deal:  { label: "Fair Deal",  cls: "yellow" },
  average:    { label: "Average",    cls: "yellow" },
  overpriced: { label: "Overpriced", cls: "red" },
};

function show(id) {
  ["idle", "loading", "result", "error", "unsupported"].forEach((s) => {
    document.getElementById("state-" + s).classList.add("hidden");
  });
  document.getElementById("state-" + id).classList.remove("hidden");
}

function isSupported(url) {
  return url && (url.includes("amazon.in") || url.includes("myntra.com"));
}

async function getCurrentUrl() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return null;
  // Try content script first, fall back to tab URL
  try {
    const resp = await chrome.tabs.sendMessage(tab.id, { type: "GET_URL" });
    return resp?.url || tab.url;
  } catch {
    return tab.url;
  }
}

async function checkDeal() {
  const url = await getCurrentUrl();

  if (!isSupported(url)) {
    show("unsupported");
    return;
  }

  show("loading");

  try {
    // Scrape + save
    const scrapeRes = await fetch(`${API}/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const scrapeData = await scrapeRes.json();
    if (!scrapeRes.ok) throw new Error(scrapeData.detail || "Scrape failed");

    // Fetch analysis
    const analysisRes = await fetch(`${API}/products/${scrapeData.product_id}/analysis`);
    const analysis = await analysisRes.json();

    renderResult(scrapeData, analysis, url);
    show("result");
  } catch (err) {
    document.getElementById("error-msg").textContent = err.message;
    show("error");
  }
}

function renderResult(product, analysis, url) {
  // Image
  const imgWrap = document.getElementById("product-image-wrap");
  const img = document.getElementById("product-image");
  if (product.image_url) {
    img.src = product.image_url;
    imgWrap.classList.remove("hidden");
  } else {
    imgWrap.classList.add("hidden");
  }

  // Name
  document.getElementById("product-name").textContent = product.name || "Unknown product";

  // Verdict badge
  const badge = document.getElementById("verdict-badge");
  const meta = VERDICT_META[analysis?.verdict];
  if (meta) {
    badge.textContent = meta.label;
    badge.className = "badge " + meta.cls;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }

  // Prices
  document.getElementById("product-price").textContent =
    product.price ? "₹" + product.price.toLocaleString("en-IN") : "—";

  const mrpBlock = document.getElementById("mrp-block");
  if (product.mrp) {
    document.getElementById("product-mrp").textContent = "₹" + product.mrp.toLocaleString("en-IN");
    mrpBlock.classList.remove("hidden");
  } else {
    mrpBlock.classList.add("hidden");
  }

  const discBlock = document.getElementById("discount-block");
  if (product.discount_percent) {
    document.getElementById("product-discount").textContent = product.discount_percent + "%";
    discBlock.classList.remove("hidden");
  } else {
    discBlock.classList.add("hidden");
  }

  // Stats
  document.getElementById("stat-lowest").textContent =
    analysis?.lowest_ever ? "₹" + analysis.lowest_ever.toLocaleString("en-IN") : "—";
  document.getElementById("stat-avg").textContent =
    analysis?.average_price ? "₹" + Number(analysis.average_price).toLocaleString("en-IN") : "—";
  document.getElementById("stat-points").textContent =
    analysis?.data_points ? analysis.data_points + " checks" : "—";

  // Reason
  const reason = document.getElementById("verdict-reason");
  reason.textContent = analysis?.reason || "";

  // View link
  document.getElementById("view-link").href =
    `https://true-deal.vercel.app`;
}

// Event listeners
document.getElementById("btn-check").addEventListener("click", checkDeal);
document.getElementById("btn-retry").addEventListener("click", checkDeal);
document.getElementById("btn-recheck").addEventListener("click", () => show("idle"));

// Auto-check if on a supported page
getCurrentUrl().then((url) => {
  if (isSupported(url)) {
    show("idle");
  } else {
    show("unsupported");
  }
});
