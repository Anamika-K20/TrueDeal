const API = "https://truedeal-production.up.railway.app";

const VERDICT_META = {
  great_deal: { label: "Great Deal", cls: "green" },
  good_deal:  { label: "Good Deal",  cls: "green" },
  fair_deal:  { label: "Fair Deal",  cls: "yellow" },
  average:    { label: "Average",    cls: "yellow" },
  overpriced: { label: "Overpriced", cls: "red" },
};

function show(id) {
  ["loading", "result", "error", "unsupported"].forEach((s) => {
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
  try {
    const resp = await chrome.tabs.sendMessage(tab.id, { type: "GET_URL" });
    return resp?.url || tab.url;
  } catch {
    return tab.url;
  }
}

function cacheKey(url) {
  return "cache_" + btoa(url).slice(0, 40);
}

async function loadCache(url) {
  return new Promise((resolve) => {
    chrome.storage.local.get(cacheKey(url), (data) => {
      resolve(data[cacheKey(url)] || null);
    });
  });
}

async function saveCache(url, payload) {
  chrome.storage.local.set({ [cacheKey(url)]: { ...payload, cachedAt: Date.now() } });
}

async function checkDeal(url, forceRefresh = false) {
  show("loading");
  document.getElementById("btn-refresh").classList.add("hidden");

  // Check cache first (unless forced refresh)
  if (!forceRefresh) {
    const cached = await loadCache(url);
    if (cached) {
      renderResult(cached.product, cached.analysis, cached.history, cached.previousPrice);
      show("result");
      document.getElementById("btn-refresh").classList.remove("hidden");
      return;
    }
  }

  try {
    // Scrape
    const scrapeRes = await fetch(`${API}/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const product = await scrapeRes.json();
    if (!scrapeRes.ok) throw new Error(product.detail || "Scrape failed");

    // Analysis + history in parallel
    const [analysisRes, historyRes] = await Promise.all([
      fetch(`${API}/products/${product.product_id}/analysis`),
      fetch(`${API}/products/${product.product_id}/history`),
    ]);
    const analysis = await analysisRes.json();
    const history = await historyRes.json();

    // Previous price for drop detection
    const previousPrice = history.length > 1 ? history[1]?.price : null;

    await saveCache(url, { product, analysis, history, previousPrice });
    renderResult(product, analysis, history, previousPrice);
    show("result");
    document.getElementById("btn-refresh").classList.remove("hidden");
  } catch (err) {
    document.getElementById("error-msg").textContent = err.message;
    show("error");
  }
}

function renderResult(product, analysis, history, previousPrice) {
  // Price drop banner
  const banner = document.getElementById("price-drop-banner");
  if (previousPrice && product.price && product.price < previousPrice) {
    banner.classList.remove("hidden");
  } else {
    banner.classList.add("hidden");
  }

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

  // Verdict
  const badge = document.getElementById("verdict-badge");
  const meta = VERDICT_META[analysis?.verdict];
  if (meta) {
    badge.textContent = meta.label;
    badge.className = "badge " + meta.cls;
  } else {
    badge.className = "badge hidden";
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
    analysis?.lowest_ever ? "₹" + Number(analysis.lowest_ever).toLocaleString("en-IN") : "—";
  document.getElementById("stat-avg").textContent =
    analysis?.average_price ? "₹" + Number(analysis.average_price).toLocaleString("en-IN") : "—";
  document.getElementById("stat-points").textContent =
    analysis?.data_points ? analysis.data_points : "—";

  // Reason
  document.getElementById("verdict-reason").textContent = analysis?.reason || "";

  // Sparkline
  drawSparkline(history);
}

function drawSparkline(history) {
  const canvas = document.getElementById("sparkline");
  if (!history || history.length < 2) {
    canvas.classList.add("hidden");
    return;
  }

  canvas.classList.remove("hidden");
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.offsetWidth || 292;
  const H = 56;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  const prices = [...history].reverse().map((h) => h.price).filter(Boolean);
  if (prices.length < 2) { canvas.classList.add("hidden"); return; }

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const pad = { top: 6, bottom: 6, left: 4, right: 4 };
  const w = W - pad.left - pad.right;
  const h = H - pad.top - pad.bottom;

  const x = (i) => pad.left + (i / (prices.length - 1)) * w;
  const y = (v) => pad.top + h - ((v - min) / range) * h;

  // Gradient fill
  const grad = ctx.createLinearGradient(0, pad.top, 0, H);
  grad.addColorStop(0, "rgba(124,58,237,0.35)");
  grad.addColorStop(1, "rgba(124,58,237,0)");

  ctx.beginPath();
  ctx.moveTo(x(0), y(prices[0]));
  prices.forEach((p, i) => { if (i > 0) ctx.lineTo(x(i), y(p)); });
  ctx.lineTo(x(prices.length - 1), H);
  ctx.lineTo(x(0), H);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(x(0), y(prices[0]));
  prices.forEach((p, i) => { if (i > 0) ctx.lineTo(x(i), y(p)); });
  ctx.strokeStyle = "#7c3aed";
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.stroke();

  // Last point dot
  const lx = x(prices.length - 1);
  const ly = y(prices[prices.length - 1]);
  ctx.beginPath();
  ctx.arc(lx, ly, 3, 0, Math.PI * 2);
  ctx.fillStyle = "#a78bfa";
  ctx.fill();
}

// Refresh button
document.getElementById("btn-refresh").addEventListener("click", async () => {
  const url = await getCurrentUrl();
  if (url) checkDeal(url, true);
});

document.getElementById("btn-retry").addEventListener("click", async () => {
  const url = await getCurrentUrl();
  if (url) checkDeal(url, true);
});

// Auto-detect on open
(async () => {
  const url = await getCurrentUrl();
  if (!isSupported(url)) {
    show("unsupported");
    return;
  }
  checkDeal(url, false);
})();
