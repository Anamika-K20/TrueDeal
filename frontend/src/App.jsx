import { useState, useEffect } from "react";
import { scrapeProduct, fetchAnalysis, fetchHistory, fetchProducts } from "./api";
import SearchBar from "./components/SearchBar";
import ProductCard from "./components/ProductCard";
import PriceChart from "./components/PriceChart";
import CategorySection from "./components/CategorySection";
import styles from "./App.module.css";

const BAG_KEYWORDS = [
  "bag",
  "bags",
  "backpack",
  "purse",
  "wallet",
  "luggage",
  "handbag",
  "satchel",
  "tote",
  "duffle",
  "duffel",
  "sling",
  "rucksack",
  "briefcase",
  "messenger",
  "trolley",
  "crossbody",
];

const ELECTRONICS_KEYWORDS = ["laptop", "phone", "headphone", "tablet", "camera"];
const CLOTHING_KEYWORDS = ["shirt", "pants", "dress", "shoes", "jacket"];
const HOME_KEYWORDS = ["chair", "table", "lamp", "shelf", "bed"];

function containsAnyKeyword(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function getProductsByCategory(products) {
  const categories = {
    bags: [],
    electronics: [],
    clothing: [],
    home: [],
    other: [],
  };

  products.forEach((product) => {
    const name = (product.name || "").toLowerCase();

    if (containsAnyKeyword(name, BAG_KEYWORDS)) {
      categories.bags.push(product);
    } else if (containsAnyKeyword(name, ELECTRONICS_KEYWORDS)) {
      categories.electronics.push(product);
    } else if (containsAnyKeyword(name, CLOTHING_KEYWORDS)) {
      categories.clothing.push(product);
    } else if (containsAnyKeyword(name, HOME_KEYWORDS)) {
      categories.home.push(product);
    } else {
      categories.other.push(product);
    }
  });

  return categories;
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [product, setProduct] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [view, setView] = useState("home");

  useEffect(() => {
    fetchProducts().then(setAllProducts).catch((err) => {
      setError(err.message || "Failed to load tracked products");
    });
  }, []);

  async function handleSearch(url) {
    setLoading(true);
    setError(null);
    setProduct(null);
    setAnalysis(null);
    setHistory(null);

    try {
      const scraped = await scrapeProduct(url);
      setProduct(scraped);

      const [analysisData, historyData] = await Promise.all([
        fetchAnalysis(scraped.product_id),
        fetchHistory(scraped.product_id),
      ]);

      setAnalysis(analysisData);
      setHistory(historyData);
      fetchProducts().then(setAllProducts).catch((err) => {
        setError(err.message || "Failed to refresh tracked products");
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectProduct(selectedProduct) {
    setLoading(true);
    setError(null);
    setProduct({ name: selectedProduct.name, url: selectedProduct.url });
    setAnalysis(null);
    setHistory(null);

    try {
      const [analysisData, historyData] = await Promise.all([
        fetchAnalysis(selectedProduct.id),
        fetchHistory(selectedProduct.id),
      ]);

      setProduct({
        ...selectedProduct,
        price: analysisData.current_price,
        mrp: analysisData.mrp,
        discount_percent: analysisData.current_discount_percent,
      });
      setAnalysis(analysisData);
      setHistory(historyData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const productsByCategory = getProductsByCategory(allProducts);
  const totalTracked = allProducts.length;

  return (
    <div className={styles.app}>
      <main className={styles.main}>
        {view === "home" ? (
          <>
            <section className={styles.heroCard}>
              <button className={styles.trackedLink} type="button" onClick={() => setView("tracked") }>
                Tracked Products
              </button>

              <p className={styles.kicker}>TrueDeal</p>
              <h1 className={styles.heroTitle}>
                Find the best deals.
                <br />
                Track the prices that matter.
              </h1>
              <p className={styles.heroText}>
                Paste any product link to check the deal, then browse tracked bags and other products below.
              </p>

              <div className={styles.searchBox}>
                <SearchBar onSearch={handleSearch} loading={loading} />
              </div>
            </section>

            {error && <div className={styles.error}>{error}</div>}

            {product && (
              <div className={styles.results}>
                <ProductCard product={product} analysis={analysis} />
                <PriceChart history={history} />
              </div>
            )}
          </>
        ) : (
          <section className={styles.trackedPage} id="tracked-products">
            <div className={styles.trackedHeader}>
              <div>
                <p className={styles.trackedKicker}>Tracked Products</p>
                <h2 className={styles.trackedTitle}>Tracked Products</h2>
              </div>
              <button className={styles.backButton} type="button" onClick={() => setView("home") }>
                Back to home
              </button>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {product && (
              <div className={styles.results}>
                <ProductCard product={product} analysis={analysis} />
                <PriceChart history={history} />
              </div>
            )}

            {totalTracked === 0 ? (
              <div className={styles.error}>No tracked products found yet.</div>
            ) : (
              <>
                <CategorySection
                  title="Bags"
                  icon="👜"
                  products={productsByCategory.bags}
                  onSelect={handleSelectProduct}
                />
                <CategorySection
                  title="Electronics"
                  icon="📱"
                  products={productsByCategory.electronics}
                  onSelect={handleSelectProduct}
                />
                <CategorySection
                  title="Clothing & Fashion"
                  icon="👕"
                  products={productsByCategory.clothing}
                  onSelect={handleSelectProduct}
                />
                <CategorySection
                  title="Home & Furniture"
                  icon="🪑"
                  products={productsByCategory.home}
                  onSelect={handleSelectProduct}
                />
                <CategorySection
                  title="Other Deals"
                  icon="🎁"
                  products={productsByCategory.other}
                  onSelect={handleSelectProduct}
                />
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
