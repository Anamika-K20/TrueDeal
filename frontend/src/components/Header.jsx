import SearchBar from "./SearchBar";
import styles from "./Header.module.css";

export default function Header({ onSearch, loading }) {
  return (
    <header className={styles.header}>
      <a href="#top" className={styles.logo}>TrueDeal</a>

      <nav className={styles.nav}>
        <a href="#about" className={styles.navLink}>About Us</a>
        <a href="#bags" className={`${styles.navLink} ${styles.active}`}>Bags</a>
        <a href="#deals" className={styles.navLink}>Deals</a>
        <a href="#help" className={styles.navLink}>Help</a>
      </nav>

      <div className={styles.rightSection}>
        <SearchBar onSearch={onSearch} loading={loading} searchInHeader />
      </div>
    </header>
  );
}
