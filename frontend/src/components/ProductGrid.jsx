import { useEffect, useState } from "react";
import { fetchAnalysis } from "../api";
import styles from "./ProductGrid.module.css";

const VERDICT_META = {
  great_deal: { label: "Great Deal", color: "green" },
  good_deal:  { label: "Good Deal",  color: "green" },
  fair_deal:  { label: "Fair Deal",  color: "yellow" },
  average:    { label: "Average",    color: "yellow" },
  overpriced: { label: "Overpriced", color: "red" },
};

export default function ProductGrid({ products, onSelect }) {
  const [analyses, setAnalyses] = useState({});

  useEffect(() => {
    products.slice(0, 20).forEach((p) => {
      fetchAnalysis(p.id)
        .then((a) => setAnalyses((prev) => ({ ...prev, [p.id]: a })))
        .catch(() => {});
    });
  }, [products]);

  if (!products.length) {
    return (
      <p className={styles.empty}>
        No products tracked yet. Paste an Amazon URL above to get started.
      </p>
    );
  }

  return (
    <div className={styles.grid}>
      {products.map((p) => {
        const analysis = analyses[p.id];
        const meta = VERDICT_META[analysis?.verdict];
        return (
          <button key={p.id} className={styles.card} onClick={() => onSelect(p)}>
            <span className={styles.name}>{p.name}</span>
            <div className={styles.footer}>
              {analysis && (
                <span className={styles.price}>
                  ₹{analysis.current_price?.toLocaleString()}
                </span>
              )}
              {meta && (
                <span className={`${styles.badge} ${styles[meta.color]}`}>
                  {meta.label}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
