import ProductGrid from "./ProductGrid";
import styles from "./CategorySection.module.css";

export default function CategorySection({ id, title, icon, products, onSelect }) {
  if (!products.length) {
    return null;
  }

  return (
    <section id={id} className={styles.category}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <span className={styles.icon}>{icon}</span>
          <h2 className={styles.title}>{title}</h2>
        </div>
        <p className={styles.count}>{products.length} products</p>
      </div>
      <ProductGrid products={products} onSelect={onSelect} />
    </section>
  );
}
