/* ============================
   Option A: Multi-source PWA
   - Select source via ?source=<id>
   - Map source -> { url, parser, theme }
   - Supports Jamix per-source station locking via sources.json: "jamixStation"
   - Static-only: requires CORS on remote endpoints
   ============================ */

const REGISTRY_PATH = "./sources.json";

const THEMES = {
  default: "./themes/default.css",
  ucla: "./themes/ucla.css",
  neon: "./themes/neon.css",
  sunset: "./themes/sunset.css",
  forest: "./themes/forest.css",
  light: "./themes/light.css",
};

const MEAL_ORDER = { Breakfast: 1, Lunch: 2, Dinner: 3, Snack: 4 };

/* ============================
   DOM refs
   ============================ */

const listEl = document.getElementById("list");
const errorBox = document.getElementById("errorBox");
const refreshBtn = document.getElementById("refreshBtn");
const copyLinkBtn = document.getElementById("copyLinkBtn");
const searchInput = document.getElementById("searchInput");

const netBadge = document.getElementById("netBadge");
const metaText = document.getElementById("metaText");

const appTitle = document.getElementById("appTitle");
const appSubtitle = document.getElementById("appSubtitle");

const sourceSelect = document.getElementById("sourceSelect");
const displaySelect = document.getElementById("displaySelect");

const jamixFiltersWrap = document.getElementById("jamixFilters");
const dateFilter = document.getElementById("dateFilter");
const mealFilter = document.getElementById("mealFilter");
const stationFilter = document.getElementById("stationFilter");

const themeStyles = document.getElementById("themeStyles");

/* ============================
   State
   ============================ */

let registry = {};
let currentSourceId = "";
let currentSource = null;

let items = [];
let filtered = [];

/* ============================
   Boot
   ============================ */

init().catch(showError);

async function init() {
  updateNetBadge();

  registry = await loadRegistry();

  const ids = Object.keys(registry);
  if (!ids.length) throw new Error("sources.json is empty.");

  buildSourceSelect(ids);

  // Gets endpoint configuration from URL parameters
  const endpointVals = getEndpointValuesfromURL();

  // If endpoint configs are not in URL, check for source (legacy) or fallback to first
  const initial = endpointVals.screenLocation ? endpointVals.screenLocation : getSourceFromUrl() || ids[0];

  // select initial xml source
  await selectSource(initial, { pushUrl: false, doFetch: true });

  // UI events
  sourceSelect.addEventListener("change", async () => {
    await selectSource(sourceSelect.value, { pushUrl: true, doFetch: true });
  });

  displaySelect?.addEventListener("change", () => {
  const groupName = displaySelect.value;
  if (!groupName) return;

  const selectedDisplay = currentSource?.displays?.[groupName];
  if (!selectedDisplay?.page) return;

  window.location.href = selectedDisplay.page;
  });

  refreshBtn.addEventListener("click", async () => {
    await refreshCurrent();
  });

  copyLinkBtn.addEventListener("click", async () => {
    await copyShareLink();
  });

  searchInput.addEventListener("input", () => recomputeFiltered());

  dateFilter?.addEventListener("change", () => recomputeFiltered());
  mealFilter?.addEventListener("change", () => recomputeFiltered());
  stationFilter?.addEventListener("change", () => recomputeFiltered());

  window.addEventListener("online", () => updateNetBadge(true));
  window.addEventListener("offline", () => updateNetBadge(true));

  // Back/forward support
  window.addEventListener("popstate", async () => {
    const id = endpointVals.screenLocation || getSourceFromUrl() || Object.keys(registry)[0];
    await selectSource(id, { pushUrl: false, doFetch: false });
  });

  // await registerServiceWorker();
}

/* ============================
   Registry + routing + theme
   ============================ */

async function loadRegistry() {
  const res = await fetch(REGISTRY_PATH, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${REGISTRY_PATH}: ${res.status}`);
  const json = await res.json();
  if (!json || typeof json !== "object") throw new Error("Invalid sources.json");
  return json;
}

function buildSourceSelect(ids) {
  sourceSelect.innerHTML = "";
  for (const id of ids) {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = registry[id]?.name || id;
    sourceSelect.appendChild(opt);
  }
}

function getSourceFromUrl() {
  const url = new URL(window.location.href);
  return url.searchParams.get("source") || "";
}

/**
 * Read endpoint-specific values from URL query params
 * @returns {object} containing screen station, screen location, timezone,
 * and assigns endpoint value source URL query parameters
 * @property {Array} screenStations
 * @property {string|null} screenLocation
 * @property {string|'America/Los_Angeles'} timezone follow IANA timezone format, e.g. "America/Los_Angeles"
 * @readonly @property {'query_params'} endpointValsSource 
 */

// direct to error content instead of null if missing critical values?

function getEndpointValuesfromURL() {
  const url = new URL(window.location.href);
  rawStations = url.searchParams.get("stations") || null;
  stationsArray = rawStations ? rawStations.split(',') : [];
  endpointVals = {
    screenStations: stationsArray.map((s) => s.trim()).filter(s => s !== ""),
    screenLocation: url.searchParams.get("location") || null,
    timezone: url.searchParams.get("timezone") || "America/Los_Angeles",
    endpointValsSource: "query_params"
  }
  return endpointVals 
}

function setSourceInUrl(sourceId) {
  const url = new URL(window.location.href);
  url.searchParams.set("source", sourceId);
  window.history.pushState({}, "", url);
}

/**
 * Parallel to setSourceInURL() based on endpoint values. Temp for testing
 * @param {*} endpointVals 
*/

function setEndpointConfigInURL(endpointVals) {
  const url = new URL(window.location.href);
  url.searchParams.set("location", endpointVals.screenLocation);
  url.searchParams.set("timezone", endpointVals.timezone);
  if (endpointVals.screenStations?.length > 0) url.searchParams.set("stations", endpointVals.screenStations.join(","));
  window.history.pushState({}, "", url);
}

function applyTheme(themeId) {
  const href = THEMES[themeId] || THEMES.default;
  themeStyles.href = href;
}

async function copyShareLink() {
  const url = new URL(window.location.href);
  url.searchParams.set("source", currentSourceId);

  const text = url.toString();
  try {
    await navigator.clipboard.writeText(text);
    const existing = loadMeta(currentSourceId) || {};
    setMetaText({ ...existing, note: "Link copied to clipboard." });
  } catch {
    // Fallback
    prompt("Copy this link:", text);
  }
}

/* ============================
   Source switching
   ============================ */

async function selectSource(
  id,
  { pushUrl, doFetch } = { pushUrl: true, doFetch: true }
) {
  const ids = Object.keys(registry);
  if (!registry[id]) id = ids[0];

  currentSourceId = id;
  currentSource = registry[id];

  populateDisplays(currentSource);

  sourceSelect.value = id;

  // Update title/branding
  const name = currentSource.name || id;
  appTitle.textContent = name;
  document.title = `${name} — XML Feed PWA`;

  // Apply theme
  applyTheme(currentSource.theme || "default");

  // Toggle Jamix filters + lock station dropdown if configured
  const isJamix = endpointVals?.location?.length > 0 || currentSource.parser === "jamix_forecastedrecipes";
  jamixFiltersWrap.hidden = !isJamix;

  if (isJamix) {
    // Lock location if URL query param provided, hide source selection UI
    sourceSelect.hidden = endpointVals?.screenLocation?.length > 0;

    // Lock station according to URL query param if found or source defines fixed station
    const isStationLocked = endpointVals?.screenStations?.length > 0 || currentSource.jamixStation?.length > 0;

    const stationLabel = stationFilter?.closest("label");

    if (stationLabel) stationLabel.hidden = isStationLocked;

    // Prevent hidden station select from accidentally filtering due to old value
    if (stationFilter) {
      stationFilter.disabled = isStationLocked;
      stationFilter.value = "";
    }

    const subtitleBits = [
      `Source: ${id}`,
      `Parser: ${currentSource.parser || "auto"}`,
    ];

    if (isStationLocked) {
      const lockedStation = endpointVals?.screenStations?.length > 0 
        ? endpointVals.screenStations.map((it) => cleanText(it))
        : [cleanText(currentSource.jamixStation)];
      subtitleBits.push(`Station: ${lockedStation.join(", ")}`);
    } 
    appSubtitle.textContent = subtitleBits.join(" • ");

  } else {
    appSubtitle.textContent = `Source: ${id} • Parser: ${currentSource.parser || "auto"}`;
  }

  // Load cached data for this source immediately (and apply preset filters)
  clearError();
  const cached = loadCachedItems(currentSourceId);
  const cachedFiltered = endpointVals?.screenLocation
    ? applyURLFilters(cached, currentSource, endpointVals)
    : applySourcePresetFilters(cached, currentSource);

  if (cachedFiltered?.length) {
    items = cachedFiltered;
    if (isJamix) populateJamixFilters(items);
    recomputeFiltered();
    setMetaText(loadMeta(currentSourceId) || { note: "Loaded cached data." });
  } else {
    items = [];
    renderEmpty("No cached data yet. Click Refresh.");
    setMetaText({ note: "No cached data." });

    if (isJamix) {
      resetSelect(dateFilter, "All dates");
      resetSelect(mealFilter, "All meals");
      if (!(endpointVals?.screenLocation)) resetSelect(stationFilter, "All stations");
    }
  }

  if (pushUrl) {
    if (endpointVals?.screenLocation?.length > 0) {
      setEndpointConfigInURL(endpointVals);
    } else {
      setSourceInUrl(currentSourceId);
    }
  } 
  if (doFetch) await refreshCurrent();
}

/* ============================
   Fetch + parse + cache
   ============================ */

/**
 * Fetches, parses, filters, and renders items
 *
 * @throws {Error} If the current source has no URL configured
 */

async function refreshCurrent() {
  if (!currentSource?.url) throw new Error("This source has no URL configured.");

  clearError();
  {
    const existing = loadMeta(currentSourceId) || {};
    setMetaText({ ...existing, note: "Fetching XML…" });
  }

  const xmlText = await fetchXmlText(currentSource.url);

  {
    const existing = loadMeta(currentSourceId) || {};
    setMetaText({ ...existing, note: "Parsing XML…" });
  }

  const parsedRaw = parseXmlWithParser(xmlText, currentSource.parser);
  const parsed = endpointVals.screenlocation 
    ? applyURLFilters(parsedRaw, currentSource, endpointVals)
    : applySourcePresetFilters(parsedRaw, currentSource);

  parsed.sort((a, b) => sortItems(a, b, currentSource.parser));

  items = parsed;

  cacheItems(currentSourceId, items);
  cacheMeta(currentSourceId, {
    fetchedAt: new Date().toISOString(),
    count: items.length,
    source: currentSourceId,
    url: currentSource.url,
  });

  if (currentSource.parser === "jamix_forecastedrecipes") populateJamixFilters(items);
  recomputeFiltered();
  setMetaText(loadMeta(currentSourceId));
}

async function fetchXmlText(url) {
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/xml,text/xml;q=0.9,*/*;q=0.8" },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);

  const text = await res.text();
  if (!text || text.trim().length === 0) throw new Error("Empty XML response.");
  return text;
}

function parseXmlWithParser(xmlText, parserName) {
  const doc = parseXml(xmlText);

  switch (parserName) {
    case "jamix_forecastedrecipes":
      return parseJamixForecastedRecipes(doc);
    case "rss":
      return parseRss(doc);
    case "atom":
      return parseAtom(doc);
    default:
      // Auto: try jamix -> rss -> atom
      try {
        const jamix = parseJamixForecastedRecipes(doc);
        if (jamix.length) return jamix;
      } catch {}
      try {
        const rss = parseRss(doc);
        if (rss.length) return rss;
      } catch {}
      return parseAtom(doc);
  }
}

function parseXml(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");
  const parserError = doc.querySelector("parsererror");
  if (parserError) {
    throw new Error(
      "XML parse error:\n" + (parserError.textContent || "").trim().slice(0, 800)
    );
  }
  return doc;
}

/* ============================
   Source preset filters
   ============================ */

function normalizeKey(s) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function applySourcePresetFilters(list, source) {
  let out = Array.isArray(list) ? list : [];
  if (!source) return out;

  // Only apply these presets to Jamix-style feeds
  if (source.parser === "jamix_forecastedrecipes") {
    const lockedStation = cleanText(source.jamixStation || "");
    if (lockedStation) {
      const want = normalizeKey(lockedStation);
      out = out.filter((it) => normalizeKey(it?.facets?.station) === want);
    }
  }

  return out;
}

/**
 * Parallel to applySourcePresetFilters() based on URL query params
 * @param {*} list
 * @param {*} source 
 * @param {object} endpointVals 
 * @returns {Array} filtered list
 */

function applyURLFilters(list, source, endpointVals) {
  let out = Array.isArray(list) ? list : [];
  if (!source) return out;

  // Only apply these filters to Jamix-style feeds with query param values
  if(source.parser === "jamix_forecastedrecipes" && endpointVals?.endpointValsSource === "query_params") {
    const { screenStations, screenLocation, timezone } = endpointVals;
    if (screenStations.length > 0) {
      const want = screenStations.map((i) => normalizeKey(i));
      out = out.filter((it) => want.includes(normalizeKey(it?.facets?.station)));
    }
  }

  return out;
}

/* ============================
   Namespace-safe helpers
   ============================ */

function findAllByLocalName(root, localName) {
  const wanted = String(localName).toLowerCase();
  const all = Array.from(root.getElementsByTagName("*"));
  return all.filter((n) => String(n.localName).toLowerCase() === wanted);
}

function findFirstByLocalName(root, localName) {
  const wanted = String(localName).toLowerCase();
  const all = Array.from(root.getElementsByTagName("*"));
  return all.find((n) => String(n.localName).toLowerCase() === wanted) || null;
}

function pickText(parentEl, localName) {
  const el = findFirstByLocalName(parentEl, localName);
  return (el?.textContent || "").trim();
}

function pickAll(parentEl, localName) {
  const els = findAllByLocalName(parentEl, localName);
  const vals = els.map((n) => (n.textContent || "").trim()).filter(Boolean);
  return uniqInOrder(vals);
}

/* ============================
   Parsers
   ============================ */

// 1) Jamix: <forecastedrecipes><recipe>...</recipe></forecastedrecipes>
function parseJamixForecastedRecipes(doc) {
  const recipes = findAllByLocalName(doc, "recipe");
  if (!recipes.length) return [];

  return recipes.map((el, idx) => {
    const serveDate = pickText(el, "Serve_Date");
    const menuType = pickText(el, "Menu_Type");

    // Station: DeNeve may include a "Food_Storage_Station" field. Prefer that if present.
    const storageStation =
      pickText(el, "Food_Storage_Station") ||
      pickText(el, "Food_Storage_Station_Name") ||
      pickText(el, "Food_Station") ||
      pickText(el, "FoodStorageStation") ||
      pickText(el, "Storage_Station") ||
      "";

    const menuStation = pickText(el, "Menu_Meal_Option") || "";

    // Prefer storage station if present, otherwise fall back
    const station = storageStation || menuStation;

    const locationNumber = pickText(el, "Location_Number");
    const recipeNumber = pickText(el, "Recipe_Number");
    const title =
      pickText(el, "Recipe_Print_As") ||
      (recipeNumber ? `Recipe #${recipeNumber}` : `Recipe ${idx + 1}`);
    const desc = pickText(el, "Description");

    const allergens = pickAll(el, "Allergen");

    const dateTs = parseDateToTs(serveDate);

    const id = `${serveDate}|${menuType}|${station}|${recipeNumber || idx}`;

    const tags = uniqInOrder([menuType, station, ...allergens].filter(Boolean));
    const metaRight = [
      locationNumber ? `Loc ${locationNumber}` : "",
      recipeNumber ? `Recipe #${recipeNumber}` : "",
    ]
      .filter(Boolean)
      .join(" • ");

    return {
      id,
      title: cleanText(title),
      summary: truncate(cleanText(desc), 220),
      dateStr: cleanText(serveDate),
      dateTs,
      link: "",

      tags,
      metaRight,

      facets: {
        date: cleanText(serveDate),
        meal: cleanText(menuType),
        station: cleanText(station),

        // Optional extras (useful for debugging)
        menuStation: cleanText(menuStation),
        storageStation: cleanText(storageStation),
      },
    };
  });
}

// 2) RSS: <rss><channel><item>...</item></channel></rss>
function parseRss(doc) {
  const itemsEls = findAllByLocalName(doc, "item");
  if (!itemsEls.length) return [];

  return itemsEls.map((el, idx) => {
    const title = pickText(el, "title") || `Item ${idx + 1}`;
    const link = pickText(el, "link");
    const guid = pickText(el, "guid");
    const dateStr = pickText(el, "pubDate") || pickText(el, "date");
    const dateTs = parseDateToTs(dateStr);

    // content:encoded localName is often "encoded"
    const rawDesc = pickText(el, "description") || pickText(el, "encoded");
    const summary = truncate(cleanText(stripHtml(rawDesc)), 240);

    const cats = pickAll(el, "category");
    const metaRight = link ? safeHost(link) : "";

    return {
      id: guid || link || `${title}-${idx}`,
      title: cleanText(title),
      summary,
      dateStr: cleanText(dateStr),
      dateTs,
      link: cleanText(link),
      tags: uniqInOrder(cats),
      metaRight,
    };
  });
}

// 3) Atom: <feed><entry>...</entry></feed>
function parseAtom(doc) {
  const entries = findAllByLocalName(doc, "entry");
  if (!entries.length) return [];

  return entries.map((el, idx) => {
    const title = pickText(el, "title") || `Entry ${idx + 1}`;
    const id = pickText(el, "id") || `${title}-${idx}`;

    const dateStr = pickText(el, "updated") || pickText(el, "published");
    const dateTs = parseDateToTs(dateStr);

    const summaryRaw = pickText(el, "summary") || pickText(el, "content");
    const summary = truncate(cleanText(stripHtml(summaryRaw)), 240);

    // <link href="..."> (sometimes multiple; prefer rel=alternate/empty)
    const linkEls = findAllByLocalName(el, "link");
    const linkEl =
      linkEls.find((lnk) => {
        const rel = (lnk.getAttribute("rel") || "").toLowerCase();
        return rel === "" || rel === "alternate";
      }) || linkEls[0];

    const link = linkEl?.getAttribute("href") || "";

    // <category term="...">
    const catEls = findAllByLocalName(el, "category");
    const cats = catEls
      .map((c) => c.getAttribute("term") || (c.textContent || "").trim())
      .filter(Boolean);

    const metaRight = link ? safeHost(link) : "";

    return {
      id,
      title: cleanText(title),
      summary,
      dateStr: cleanText(dateStr),
      dateTs,
      link: cleanText(link),
      tags: uniqInOrder(cats),
      metaRight,
    };
  });
}

/* ============================
   Sorting
   ============================ */

function sortItems(a, b, parserName) {
  if (parserName === "jamix_forecastedrecipes") {
    const ad = a.dateTs ?? Number.POSITIVE_INFINITY;
    const bd = b.dateTs ?? Number.POSITIVE_INFINITY;
    if (ad !== bd) return ad - bd;

    const am = MEAL_ORDER[a.facets?.meal] ?? 99;
    const bm = MEAL_ORDER[b.facets?.meal] ?? 99;
    if (am !== bm) return am - bm;

    const as = (a.facets?.station || "").toLowerCase();
    const bs = (b.facets?.station || "").toLowerCase();
    if (as !== bs) return as.localeCompare(bs);

    return (a.title || "").localeCompare(b.title || "");
  }

  // default: newest first
  const ad = a.dateTs ?? 0;
  const bd = b.dateTs ?? 0;
  if (ad !== bd) return bd - ad;
  return (a.title || "").localeCompare(b.title || "");
}

/* ============================
   Filtering + rendering
   ============================ */

function recomputeFiltered() {
  const q = (searchInput.value || "").trim();

  let base = items;

  // Jamix filters only
  if (currentSource?.parser === "jamix_forecastedrecipes") {
    const d = dateFilter.value || "";
    const m = mealFilter.value || "";
    if (d) base = base.filter((it) => it.facets?.date === d);
    if (m) base = base.filter((it) => it.facets?.meal === m);
    
    // Lock station if the URL parameter stations is available
    // or if the legacy source chosen is fixed to a station.

    const isStationLocked = endpointVals?.screenStations?.length > 0 || currentSource.jamixStation?.length > 0

    if (isStationLocked) {
      const lockedStation = endpointVals?.screenStations?.length > 0 
        ? endpointVals.screenStations.map((it) => cleanText(it.toLowerCase()))
        : [cleanText(currentSource.jamixStation).toLowerCase()]
      base = base.filter((it) => lockedStation.includes(it.facets?.station?.toLowerCase())) // filter data by locked station(s)
    } else {
      const selectedStation = cleanText(stationFilter.value.toLowerCase())
      if (selectedStation.length > 0) { // check if user has selected a station from dropdown
        base = base.filter((it) => it.facets?.station?.toLowerCase() === selectedStation) // filter data by user selected station
        // if using URL query params for location, lock selected station into URL and hide UI
        if (endpointVals?.screenLocation?.length > 0) {
          endpointVals.screenStations = [selectedStation];
          setEndpointConfigInURL(endpointVals);
          const stationLabel = stationFilter?.closest("label");
          if (stationLabel) stationLabel.hidden = true;
        } else {
          setSourceInUrl(currentSourceId);
        }
      }
    }
  }
  
  filtered = applySearch(base, q);
  render(filtered, endpointVals);

  const meta = loadMeta(currentSourceId) || {};
  setMetaText({ ...meta, note: `Showing ${filtered.length} of ${items.length}` });
}


function applySearch(list, q) {
  const query = (q || "").trim().toLowerCase();
  if (!query) return list;

  return list.filter((it) => {
    const hay = [
      it.title,
      it.summary,
      it.dateStr,
      ...(it.tags || []),
      it.metaRight,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return hay.includes(query);
  });
}

function render(data, endpointVals) {
  listEl.innerHTML = "";

  if (!data || data.length === 0) {
    renderEmpty(searchInput.value?.trim() ? "No matches." : "No items.");
    return;
  }

  const frag = document.createDocumentFragment();

  for (const item of data) {
    const card = document.createElement("article");
    card.className = "card";

    const h = document.createElement("h3");
    h.textContent = item.title;

    const tags = item.tags || [];
    if (tags.length) {
      const chips = document.createElement("div");
      chips.className = "chips";

      const tagMax = 8;
      for (const t of tags.slice(0, tagMax)) addChip(chips, t);
      if (tags.length > tagMax) addChip(chips, `+${tags.length - tagMax}`);

      card.appendChild(chips);
    }

    const p = document.createElement("p");
    p.textContent = item.summary || "—";

    const meta = document.createElement("div");
    meta.className = "meta-row";

    const left = document.createElement("div");
    
    // If URL query params for timezone are provided, display in URL specified timezone. Otherwise, fall back to existing behavior.
    const locale = endpointVals?.timezone ? "en-US" : undefined;
    const opts = endpointVals?.timezone ? { timeZone: endpointVals.timezone } : undefined;
    left.textContent = item.dateTs
      ? new Date(item.dateTs).toLocaleString(locale, opts)
      : item.dateStr || "No date";

    const right = document.createElement("div");
    if (item.link) {
      const a = document.createElement("a");
      a.href = item.link;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = "Open";
      right.appendChild(a);
    } else {
      right.textContent = item.metaRight || "";
    }

    meta.append(left, right);

    card.prepend(h);
    card.append(p, meta);

    frag.appendChild(card);
  }

  listEl.appendChild(frag);
}

function renderEmpty(msg) {
  listEl.innerHTML = "";
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `<p>${escapeHtml(msg)}</p>`;
  listEl.appendChild(card);
}

function addChip(container, text) {
  const t = (text || "").trim();
  if (!t) return;
  const span = document.createElement("span");
  span.className = "chip";
  span.textContent = t;
  container.appendChild(span);
}

/* ============================
   Jamix filter population
   ============================ */

function populateJamixFilters(list) {
  const prev = {
    date: dateFilter.value || "",
    meal: mealFilter.value || "",
    selectedStation: stationFilter.value || "",
  };

  const dates = uniqInOrder(list.map((x) => x.facets?.date).filter(Boolean));
  const meals = uniqInOrder(list.map((x) => x.facets?.meal).filter(Boolean));
  const stations = uniqInOrder(list.map((x) => x.facets?.station).filter(Boolean));

  fillSelect(dateFilter, dates, "All dates");
  fillSelect(mealFilter, meals, "All meals");
  fillSelect(stationFilter, stations, "All stations");

  dateFilter.value = dates.includes(prev.date) ? prev.date : "";
  mealFilter.value = meals.includes(prev.meal) ? prev.meal : "";

  // If station is locked by url params or source, keep it blank to avoid double-filtering
  const isStationLocked = endpointVals?.screenStations?.length > 0 || currentSource.jamixStation?.length > 0
  if (isStationLocked) {
    stationFilter.value = "";
  } else {
    stationFilter.value = stations.includes(prev.selectedStation) ? prev.selectedStation : "";
  }
}

function fillSelect(selectEl, options, allLabel) {
  selectEl.innerHTML = "";
  const allOpt = document.createElement("option");
  allOpt.value = "";
  allOpt.textContent = allLabel;
  selectEl.appendChild(allOpt);

  for (const opt of options) {
    const o = document.createElement("option");
    o.value = opt;
    o.textContent = opt;
    selectEl.appendChild(o);
  }
}

function resetSelect(selectEl, allLabel) {
  if (!selectEl) return;
  selectEl.innerHTML = "";
  const allOpt = document.createElement("option");
  allOpt.value = "";
  allOpt.textContent = allLabel;
  selectEl.appendChild(allOpt);
}

/* ============================
   Local caching (per source)
   ============================ */

function itemsKey(sourceId) {
  return `xml_pwa_cache_items_${sourceId}`;
}
function metaKey(sourceId) {
  return `xml_pwa_cache_meta_${sourceId}`;
}

function cacheItems(sourceId, list) {
  localStorage.setItem(itemsKey(sourceId), JSON.stringify(list));
}
function loadCachedItems(sourceId) {
  try {
    const raw = localStorage.getItem(itemsKey(sourceId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function cacheMeta(sourceId, meta) {
  localStorage.setItem(metaKey(sourceId), JSON.stringify(meta));
}
function loadMeta(sourceId) {
  try {
    const raw = localStorage.getItem(metaKey(sourceId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/* ============================
   Status + errors
   ============================ */

function updateNetBadge(alsoUpdateText = false) {
  const online = navigator.onLine;

  netBadge.textContent = online ? "Online" : "Offline";
  netBadge.classList.remove("ok", "warn", "danger");
  netBadge.classList.add(online ? "ok" : "warn");

  if (alsoUpdateText) {
    setMetaText(loadMeta(currentSourceId) || { note: online ? "Back online." : "You are offline." });
  }
}

function setMetaText(meta) {
  if (!meta) {
    metaText.textContent = "";
    return;
  }

  const parts = [];
  if (meta.count != null) parts.push(`${meta.count} items`);
  if (meta.fetchedAt) parts.push(`Last updated: ${new Date(meta.fetchedAt).toLocaleString()}`);
  if (meta.note) parts.push(meta.note);

  metaText.textContent = parts.join(" • ");
}

function showError(err) {
  let msg = err instanceof Error ? err.message : String(err);

  // Friendly hint for CORS/blocked fetch
  if (/failed to fetch/i.test(msg)) {
    msg +=
      "\n\nHint: This often means the XML endpoint blocks browser requests (CORS) " +
      "or the network is blocked. Option A requires endpoints that allow CORS.";
  }

  errorBox.hidden = false;
  errorBox.textContent = msg;
}

function clearError() {
  errorBox.hidden = true;
  errorBox.textContent = "";
}

/* ============================
   Helpers
   ============================ */

/* If the source has a "displays" config, then populate the display dropdown. */
function populateDisplays(source) {
  if (!displaySelect) return;

  displaySelect.innerHTML = "";

  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = "All Displays";
  displaySelect.appendChild(defaultOpt);

  const displays = source?.displays || {};

  for (const [groupName, config] of Object.entries(displays)) {
    if (!config?.page) continue;

    const opt = document.createElement("option");
    opt.value = groupName;
    opt.textContent = groupName;
    displaySelect.appendChild(opt);
  }

  displaySelect.disabled = Object.keys(displays).length === 0;
}

function uniqInOrder(arr) {
  const seen = new Set();
  const out = [];
  for (const v of arr) {
    const key = String(v).toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(v);
    }
  }
  return out;
}

function cleanText(str) {
  return (str || "").replace(/\s+/g, " ").trim();
}

function truncate(str, maxLen) {
  const s = str || "";
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen - 1).trimEnd() + "…";
}

function escapeHtml(str) {
  return (str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function stripHtml(html) {
  const s = (html || "").trim();
  if (!s) return "";
  if (/[<>]/.test(s)) {
    const dp = new DOMParser();
    const doc = dp.parseFromString(s, "text/html");
    return (doc.body?.textContent || "").trim();
  }
  return s;
}

function parseDateToTs(dateStr) {
  if (!dateStr) return null;
  const s = dateStr.trim();

  // MM/DD/YYYY (Jamix Serve_Date)
  const mdy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (mdy) {
    const mm = Number(mdy[1]);
    const dd = Number(mdy[2]);
    const yyyy = Number(mdy[3]);
    if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
      // UTC noon avoids “previous day” timezone shifts
      return Date.UTC(yyyy, mm - 1, dd, 12, 0, 0);
    }
  }

  // epoch seconds/ms
  if (/^\d{10}$/.test(s)) return Number(s) * 1000;
  if (/^\d{13}$/.test(s)) return Number(s);

  const ts = Date.parse(s);
  return Number.isFinite(ts) ? ts : null;
}

function safeHost(url) {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}

/* ============================
   Service worker registration
   ============================ */

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("./sw.js", { scope: "./" });
  } catch (e) {
    console.warn("Service worker registration failed:", e);
  }
}