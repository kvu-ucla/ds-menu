export type CssSize = string | number;
export type IconMode = "light" | "dark";

export interface MenuFacets {
  date: string;
  meal: string;
  station: string;
  menuStation: string;
  storageStation: string;
}

export interface MenuItemData {
  id: string;
  title: string;
  price: string;
  summary: string;
  dateStr: string;
  dateTs: number | null;
  link: string;
  tags: string[];
  metaRight: string;
  facets: MenuFacets;
}

export interface SourceDisplay {
  route?: string;
  page?: string;
  stations?: string[];
  [key: string]: unknown;
}

export interface MenuSource {
  name?: string;
  parser?: string;
  url: string;
  theme?: string;
  jamixStation?: string;
  displays?: Record<string, SourceDisplay>;
  [key: string]: unknown;
}

export type Registry = Record<string, MenuSource>;
export type SheetRow = string[];
export type SheetData = SheetRow[];

export type Cafe1919DisplayId = "Mains" | "Sides" | "Late Night" | "Specials";
export type StationConfig = Record<string, string[]>;
export type StationItems = Record<string, MenuItemData[]>;

export interface RendezvousRouteConfig {
  displayId: string;
  title: string;
  fallbackPrice: string;
  background: string;
}
