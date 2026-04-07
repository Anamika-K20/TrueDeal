import styles from "./HeroSection.module.css";

export default function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        <h2 className={styles.title}>Find Amazing Deals</h2>
        <p className={styles.subtitle}>
          Don't overpay for products. Check if it's actually a good deal with real price history and analytics.
        </p>
      </div>
      <div className={styles.visual}>
        <div className={styles.placeholderIcon}>📊</div>
      </div>
    </section>
  );
}
