import styles from "./ProductGrid.module.css";

const VERDICT_META = {
  great_deal: { label: "Great Deal", color: "green" },
  good_deal:  { label: "Good Deal",  color: "green" },
  fair_deal:  { label: "Fair Deal",  color: "yellow" },
  average:    { label: "Average",    color: "yellow" },
  overpriced: { label: "Overpriced", color: "red" },
};

export default function ProductGrid({ products, onSelect }) {
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
        const meta = p.verdict ? VERDICT_META[p.verdict] : { label: "No History", color: "yellow" };
        const priceValue = p.latest_price;

        return (
          <button key={p.id} className={styles.card} onClick={() => onSelect(p)}>
            <span className={styles.name}>{p.name}</span>
            <div className={styles.footer}>
              {priceValue != null && (
                <span className={styles.price}>
                  ₹{priceValue.toLocaleString()}
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
