import styles from "./ProductCard.module.css";

const VERDICT_META = {
  great_deal:  { label: "Great Deal",  color: "green"  },
  good_deal:   { label: "Good Deal",   color: "green"  },
  fair_deal:   { label: "Fair Deal",   color: "yellow" },
  average:     { label: "Average",     color: "yellow" },
  overpriced:  { label: "Overpriced",  color: "red"    },
};

export default function ProductCard({ product, analysis }) {
  const meta = analysis ? (VERDICT_META[analysis.verdict] ?? { label: "Unknown", color: "yellow" }) : null;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.name}>{product.name}</h2>
        {meta && (
          <span className={`${styles.badge} ${styles[meta.color]}`}>
            {meta.label}
          </span>
        )}
      </div>

      <div className={styles.prices}>
        <div className={styles.priceBlock}>
          <span className={styles.label}>Current Price</span>
          <span className={styles.price}>₹{product.price?.toLocaleString()}</span>
        </div>
        {product.mrp && (
          <div className={styles.priceBlock}>
            <span className={styles.label}>MRP</span>
            <span className={styles.mrp}>₹{product.mrp?.toLocaleString()}</span>
          </div>
        )}
        {product.discount_percent && (
          <div className={styles.priceBlock}>
            <span className={styles.label}>Discount</span>
            <span className={styles.discount}>{product.discount_percent}% off</span>
          </div>
        )}
      </div>

      {analysis && (
        <div className={styles.stats}>
          <Stat label="Lowest Ever"  value={`₹${analysis.lowest_ever?.toLocaleString()}`} />
          <Stat label="Highest Ever" value={`₹${analysis.highest_ever?.toLocaleString()}`} />
          <Stat label="Average"      value={`₹${analysis.average_price?.toLocaleString()}`} />
          <Stat label="Data Points"  value={analysis.data_points} />
        </div>
      )}

      {analysis?.reason && (
        <p className={styles.reason}>{analysis.reason}</p>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
    </div>
  );
}
