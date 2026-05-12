import type { MenuItemData, MenuSource, Registry, SourceDisplay } from "../types";
import {
  fetchXmlText,
  loadRegistry,
  matchesAnyStation,
  normalizeKey,
  parseXml,
} from "./helpers";
import { parseJamixForecastedRecipes } from "./jamix";

export interface FetchMenuItemsResult {
  registry: Registry;
  source: MenuSource;
  display: SourceDisplay | null;
  items: MenuItemData[];
}

export async function fetchMenuItems(
  sourceId: string,
  displayId = "",
): Promise<FetchMenuItemsResult> {
  const registry = await loadRegistry();
  const source = registry[sourceId];
  if (!source) throw new Error(`Unknown source: ${sourceId}`);

  const xmlText = await fetchXmlText(source.url);
  const doc = parseXml(xmlText);

  let items: MenuItemData[] = [];
  if (source.parser === "jamix_forecastedrecipes") {
    items = parseJamixForecastedRecipes(doc);
  } else {
    items = parseJamixForecastedRecipes(doc);
  }

  if (source.jamixStation) {
    items = items.filter(
      (item) => normalizeKey(item.facets.station) === normalizeKey(source.jamixStation),
    );
  }

  const display = displayId ? source.displays?.[displayId] ?? null : null;
  if (display?.stations?.length) {
    items = items.filter((item) => matchesAnyStation(item, display.stations));
  }

  return { registry, source, display, items };
}

interface FilterOptions {
  query?: string;
  date?: string;
  meal?: string;
  station?: string;
}

export function applyTextAndFacetFilters(
  items: MenuItemData[],
  { query = "", date = "", meal = "", station = "" }: FilterOptions,
): MenuItemData[] {
  const q = normalizeKey(query);

  return items.filter((item) => {
    if (date && item.facets.date !== date) return false;
    if (meal && item.facets.meal !== meal) return false;
    if (station && item.facets.station !== station) return false;

    if (!q) return true;

    return [
      item.title,
      item.summary,
      item.facets.date,
      item.facets.meal,
      item.facets.station,
      item.metaRight,
      ...(item.tags || []),
    ].some((value) => normalizeKey(value).includes(q));
  });
}

export function uniqueOptions(
  items: MenuItemData[],
  getter: (item: MenuItemData) => string,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const item of items) {
    const value = getter(item);
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }

  return out;
}
