import { useState } from "react";
import styles from "./SearchBar.module.css";

export default function SearchBar({ onSearch, loading }) {
  const [url, setUrl] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (url.trim()) onSearch(url.trim());
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        type="url"
        placeholder="Paste an Amazon product URL..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
      />
      <button className={styles.btn} type="submit" disabled={loading}>
        {loading ? "Checking..." : "Check Deal"}
      </button>
    </form>
  );
}
