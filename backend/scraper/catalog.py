import json
import subprocess
from pathlib import Path


CATALOG_SCRIPT = Path(__file__).with_name("puppeteer_catalog.js")


def discover_catalog_urls(query="bags", pages=20):
    """Return deduplicated catalog product URLs from Amazon search pages."""
    try:
        result = subprocess.run(
            ["node", str(CATALOG_SCRIPT), query, str(pages)],
            capture_output=True,
            text=True,
            timeout=600,
            check=False,
        )
    except FileNotFoundError:
        return [], "Node.js not found"
    except subprocess.TimeoutExpired:
        return [], "Catalog crawl timed out"

    stdout = (result.stdout or "").strip()
    stderr = (result.stderr or "").strip()
    if not stdout:
        return [], (stderr or "No catalog output")

    try:
        payload = json.loads(stdout)
    except json.JSONDecodeError:
        return [], "Invalid catalog JSON"

    if "error" in payload:
        return [], str(payload["error"])

    urls = payload.get("urls", [])
    # Preserve order while deduplicating.
    unique_urls = list(dict.fromkeys(urls))
    return unique_urls, None
