import type {
  Cafe1919DisplayId,
  MenuItemData,
  SheetData,
  StationConfig,
  StationItems,
} from "../types";

export const CAFE_1919_ROUTES: Record<string, Cafe1919DisplayId> = {
  "/cafe1919/mains": "Mains",
  "/cafe1919/sides": "Sides",
  "/cafe1919/latenight": "Late Night",
  "/cafe1919/specials": "Specials",
};

export function fillConfig(
  _config: StationConfig,
  filtered: MenuItemData[],
  displayId: Cafe1919DisplayId,
): StationItems {
  const stationItems: StationItems = {};

  for (const item of filtered) {
    const station = item.facets.station.toUpperCase();

    if (station === "DAILY SPECIALS" && displayId === "Sides") {
      const dayName = new Date()
        .toLocaleDateString("en-US", { weekday: "long" })
        .slice(0, 3);
      if (!item.title.startsWith(dayName)) continue;
    }

    stationItems[station] = stationItems[station] || [];
    stationItems[station].push(item);
  }

  return stationItems;
}

export function regionToPage(sheetData: SheetData): Record<Cafe1919DisplayId, StationConfig> {
  const pages: Record<Cafe1919DisplayId, StationConfig> = {
    Mains: { 2: [], 3: [], 4: [] },
    Sides: { 6: [], 7: [], 8: [] },
    "Late Night": { 10: [], 11: [], 12: [] },
    Specials: { 13: [] },
  };

  for (const row of Object.values(sheetData || [])) {
    let station = row[1];
    const position = row[2];
    const pos = Number(position);
    if (!station || !pos) continue;

    if (pos >= 2 && pos <= 4) {
      if (station === "PRETZEL SAUCE") station = "SC PRETZEL SAUCE";
      pages.Mains[pos].push(station);
    } else if (pos >= 6 && pos <= 8) {
      if (station === "SC SALAD DRESSINGS") station = "SALAD DRESSINGS";
      else if (station === "SPECIALS") station = "DAILY SPECIALS";
      pages.Sides[pos].push(station);
    } else if (pos >= 10 && pos <= 12) {
      pages["Late Night"][pos].push(station);
    } else if (pos === 13) {
      pages.Specials[pos].push(station);
    }
  }

  return pages;
}

export function fallbackCafe1919Config(
  displayId: Cafe1919DisplayId,
  stations: string[] = [],
): StationConfig {
  if (displayId === "Specials") {
    return { 13: stations.length ? stations : ["DAILY SPECIALS"] };
  }

  const chunks: string[][] = [[], [], []];
  stations.forEach((station, index) => chunks[index % chunks.length].push(station));

  const start = displayId === "Mains" ? 2 : displayId === "Sides" ? 6 : 10;
  return {
    [start]: chunks[0],
    [start + 1]: chunks[1],
    [start + 2]: chunks[2],
  };
}

export function displayTitleForStation(station: string): string {
  if (station === "SC PRETZEL SAUCE") return "PRETZEL SAUCE";
  if (station === "SC SALAD DRESSINGS") return "SALAD DRESSINGS";
  if (station === "DAILY SPECIALS") return "SPECIALS";
  return station;
}
