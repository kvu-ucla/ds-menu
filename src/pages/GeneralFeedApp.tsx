import { useEffect, useMemo, useState } from "react";
import IconRow from "../components/IconRow";
import type { MenuItemData, Registry } from "../types";
import { applyTextAndFacetFilters, fetchMenuItems, uniqueOptions } from "../lib/menuData";
import { errorMessage, formatDateLabel, loadRegistry } from "../lib/helpers";

function setTheme(themeId = "default") {
  const themeStyles = document.getElementById("themeStyles") as HTMLLinkElement | null;
  if (themeStyles) themeStyles.href = `/themes/${themeId}.css`;
}

function sourceFromUrl(fallback = "") {
  const url = new URL(window.location.href);
  return url.searchParams.get("source") || fallback;
}

function updateSourceInUrl(sourceId: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("source", sourceId);
  window.history.pushState({}, "", url);
}

export default function GeneralFeedApp() {
  const [registry, setRegistry] = useState<Registry>({});
  const [sourceId, setSourceId] = useState("");
  const [items, setItems] = useState<MenuItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [meal, setMeal] = useState("");
  const [station, setStation] = useState("");
  const [meta, setMeta] = useState("Loading…");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    document.body.removeAttribute("data-hall");
    setTheme("default");

    loadRegistry()
      .then((loaded) => {
        const ids = Object.keys(loaded);
        const initial = sourceFromUrl(ids[0] || "");
        setRegistry(loaded);
        setSourceId(loaded[initial] ? initial : ids[0] || "");
      })
      .catch((err) => {
        console.error(err);
        setError(errorMessage(err));
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!sourceId) return;

    async function load() {
      setIsLoading(true);
      setError("");
      setDate("");
      setMeal("");
      setStation("");

      try {
        const { source, items: loadedItems } = await fetchMenuItems(sourceId);
        setTheme(source.theme || "default");
        setItems(loadedItems);
        setMeta(`${loadedItems.length} items loaded.`);
        document.title = `${source.name || sourceId} — Digital Signage`;
      } catch (err) {
        console.error(err);
        setError(errorMessage(err));
        setItems([]);
        setMeta("Unable to load feed.");
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [sourceId, reloadKey]);

  const currentSource = registry[sourceId] || {};
  const sourceIds = Object.keys(registry);

  const dates = useMemo(() => uniqueOptions(items, (item) => item.facets.date), [items]);
  const meals = useMemo(() => uniqueOptions(items, (item) => item.facets.meal), [items]);
  const stations = useMemo(() => uniqueOptions(items, (item) => item.facets.station), [items]);

  const filtered = useMemo(
    () => applyTextAndFacetFilters(items, { query, date, meal, station }),
    [items, query, date, meal, station],
  );

  const handleSourceChange = (nextSourceId: string) => {
    setSourceId(nextSourceId);
    updateSourceInUrl(nextSourceId);
  };

  const handleDisplayChange = (displayName: string) => {
    if (!displayName) return;
    const display = currentSource.displays?.[displayName];
    if (display?.route || display?.page) {
      window.location.href = String(display.route || display.page);
    }
  };

  const copyLink = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set("source", sourceId);

    try {
      await navigator.clipboard.writeText(url.toString());
      setMeta("Link copied to clipboard.");
    } catch {
      window.prompt("Copy this link:", url.toString());
    }
  };

  return (
    <div className="general-feed">
      <header className="app-header">
        <div className="app-title">
          <div className="logo" aria-hidden="true">
            ⟲
          </div>
          <div>
            <h1>{currentSource.name || "Digital Signage"}</h1>
            <p className="subtitle">
              Source: {sourceId || "loading"} • Parser: {currentSource.parser || "auto"}
            </p>
          </div>
        </div>

        <div className="header-actions">
          <label className="select-wrap">
            <span className="sr-only">Source</span>
            <select
              className="select"
              value={sourceId}
              onChange={(event) => handleSourceChange(event.target.value)}
            >
              {sourceIds.map((id) => (
                <option key={id} value={id}>
                  {registry[id]?.name || id}
                </option>
              ))}
            </select>
          </label>

          <button className="btn" type="button" onClick={() => void copyLink()}>
            Copy link
          </button>

          <button
            className="btn"
            type="button"
            onClick={() => sourceId && setReloadKey((value) => value + 1)}
          >
            Refresh
          </button>
        </div>
      </header>

      <main className="container">
        <section className="controls">
          <label className="search">
            <span className="sr-only">Search</span>
            <input
              type="search"
              placeholder="Search items…"
              autoComplete="off"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          {currentSource.displays && (
            <label className="select-wrap">
              <span className="sr-only">Displays</span>
              <select
                className="select"
                defaultValue=""
                onChange={(event) => handleDisplayChange(event.target.value)}
              >
                <option value="">All Displays</option>
                {Object.keys(currentSource.displays).map((displayName) => (
                  <option key={displayName} value={displayName}>
                    {displayName}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="filters">
            <label>
              <span className="sr-only">Date</span>
              <select value={date} onChange={(event) => setDate(event.target.value)}>
                <option value="">All dates</option>
                {dates.map((value) => (
                  <option key={value} value={value}>
                    {formatDateLabel(value)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="sr-only">Meal</span>
              <select value={meal} onChange={(event) => setMeal(event.target.value)}>
                <option value="">All meals</option>
                {meals.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            {!currentSource.jamixStation && (
              <label>
                <span className="sr-only">Station</span>
                <select value={station} onChange={(event) => setStation(event.target.value)}>
                  <option value="">All stations</option>
                  {stations.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className="status">
            <span className={`badge ${navigator.onLine ? "ok" : "warn"}`}>
              {navigator.onLine ? "online" : "offline"}
            </span>
            <span className="meta">{isLoading ? "Loading…" : meta}</span>
          </div>
        </section>

        {error && <section className="error">{error}</section>}

        <section className="list" aria-live="polite">
          {!isLoading && !error && !filtered.length && (
            <article className="card">
              <h3>No items found</h3>
              <p>Try changing the search or filters.</p>
            </article>
          )}

          {filtered.map((item) => (
            <article key={item.id} className="card">
              <h3>{item.title}</h3>
              {item.summary && <p>{item.summary}</p>}
              <IconRow tags={item.tags} mode="light" size="20px" />
              <div className="chips">
                {[item.facets.date, item.facets.meal, item.facets.station]
                  .filter(Boolean)
                  .map((tag) => (
                    <span key={tag} className="chip">
                      {tag}
                    </span>
                  ))}
              </div>
              <div className="meta-row">
                <span>{item.price || ""}</span>
                <span>{item.metaRight || ""}</span>
              </div>
            </article>
          ))}
        </section>

        <footer className="footer">
          <small>Use the Displays menu to open the full-screen signage pages.</small>
        </footer>
      </main>
    </div>
  );
}

