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
    return <p className={styles.empty}>No products tracked yet.</p>;
  }

  return (
    <div className={styles.grid}>
      {products.map((p) => {
        const meta = p.verdict ? VERDICT_META[p.verdict] : null;
        return (
          <button key={p.id} className={styles.card} onClick={() => onSelect(p)}>
            <div className={styles.imageWrap}>
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className={styles.image} loading="lazy" />
              ) : (
                <div className={styles.imagePlaceholder}>👜</div>
              )}
              {meta && (
                <span className={`${styles.badge} ${styles[meta.color]}`}>
                  {meta.label}
                </span>
              )}
            </div>
            <div className={styles.info}>
              <span className={styles.name}>{p.name}</span>
              <div className={styles.footer}>
                {p.latest_price != null && (
                  <span className={styles.price}>₹{p.latest_price.toLocaleString()}</span>
                )}
                {p.latest_mrp != null && p.latest_mrp > p.latest_price && (
                  <span className={styles.mrp}>₹{p.latest_mrp.toLocaleString()}</span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
