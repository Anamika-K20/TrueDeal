import { useState } from "react";
import styles from "./SearchBar.module.css";

export default function SearchBar({ onSearch, loading, searchInHeader = false }) {
  const [url, setUrl] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (url.trim()) onSearch(url.trim());
  }

  return (
    <form className={`${styles.form} ${searchInHeader ? styles.headerForm : ""}`} onSubmit={handleSubmit}>
      <input
        className={`${styles.input} ${searchInHeader ? styles.headerInput : ""}`}
        type="url"
        placeholder={searchInHeader ? "Paste URL..." : "Paste an Amazon product URL..."}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
      />
      <button className={`${styles.btn} ${searchInHeader ? styles.headerBtn : ""}`} type="submit" disabled={loading}>
        {loading ? "Checking..." : "Check Deal"}
      </button>
    </form>
  );
}
