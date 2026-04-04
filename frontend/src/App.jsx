import { useState, useEffect } from "react";
import { scrapeProduct, fetchAnalysis, fetchHistory, fetchProducts } from "./api";
import SearchBar from "./components/SearchBar";
import ProductCard from "./components/ProductCard";
import PriceChart from "./components/PriceChart";
import ProductGrid from "./components/ProductGrid";
import styles from "./App.module.css";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [product, setProduct] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState(null);
  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    fetchProducts().then(setAllProducts).catch(() => {});
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

      // Refresh the grid to include newly added product
      fetchProducts().then(setAllProducts).catch(() => {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectProduct(p) {
    setError(null);
    setProduct({ name: p.name, url: p.url });
    setAnalysis(null);
    setHistory(null);

    try {
      const [analysisData, historyData] = await Promise.all([
        fetchAnalysis(p.id),
        fetchHistory(p.id),
      ]);
      setProduct({ ...p, price: analysisData.current_price, mrp: analysisData.mrp, discount_percent: analysisData.current_discount_percent });
      setAnalysis(analysisData);
      setHistory(historyData);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.logo}>TrueDeal</h1>
        <p className={styles.tagline}>Find out if it's actually a good deal</p>
      </header>

      <main className={styles.main}>
        <SearchBar onSearch={handleSearch} loading={loading} />

        {error && <div className={styles.error}>{error}</div>}

        {product && (
          <div className={styles.results}>
            <ProductCard product={product} analysis={analysis} />
            <PriceChart history={history} />
          </div>
        )}

        <section>
          <h2 className={styles.sectionTitle}>Tracked Products</h2>
          <ProductGrid products={allProducts} onSelect={handleSelectProduct} />
        </section>
      </main>
    </div>
  );
}
