const BASE = "http://localhost:8000";

export async function fetchProducts() {
  const res = await fetch(`${BASE}/products`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch products");
  return data;
}

export async function scrapeProduct(url) {
  const res = await fetch(`${BASE}/scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Scrape failed");
  return data;
}

export async function fetchAnalysis(productId) {
  const res = await fetch(`${BASE}/products/${productId}/analysis`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Analysis failed");
  return data;
}

export async function fetchHistory(productId) {
  const res = await fetch(`${BASE}/products/${productId}/history`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "History failed");
  return data;
}
