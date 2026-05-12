import type { Registry, SheetData } from "../types";

const HALL_TO_GID: Record<string, string> = {
  bplate: "932045808",
  cafe1919: "677512158",
  deNeve: "1858868942",
  epic_covel: "1777114522",
  feast: "1384832536",
  bruinBowl: "1345841753",
  bcafe: "1979579976",
  epic_ackerman: "2027043595",
  rendezvous: "1622975910",
  drey: "1751470329",
  study_CYO: "1751470329",
  study_vertical: "680989628",
  study_coffee: "800954477",
};

function parseCSV(text: string): SheetData {
  const rows = text.split(/\r?\n/).filter((row) => row.trim() !== "");
  return rows.slice(1).map((row) => row.split(",").map((cell) => cell.trim()));
}

export function errorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return fallback;
}

export async function getSheetData(diningHall: string): Promise<SheetData> {
  const gid = HALL_TO_GID[diningHall];
  if (!gid) throw new Error(`Unknown dining hall: ${diningHall}`);

  const sheetUrl = `https://docs.google.com/spreadsheets/d/e/2PACX-1vTNxVJcODFyEeIwg5YnfblBE8xSQbSMYkCtvyT67aUnEUnhqiuRJ5oMUCK0sT7p39z5ddkva8-Pbzog/pub?gid=${gid}&single=true&output=csv`;
  const res = await fetch(sheetUrl, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Failed to fetch sheet: ${res.status} ${res.statusText}`);
  }

  return parseCSV(await res.text());
}

export function normalizeKey(value: unknown): string {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

export function matchesAnyStation(
  item: { facets?: { station?: string } } | null | undefined,
  stations: string[] = [],
): boolean {
  const itemStation = normalizeKey(item?.facets?.station);
  return stations.some((station) => normalizeKey(station) === itemStation);
}

export async function loadRegistry(): Promise<Registry> {
  const res = await fetch("/sources.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load /sources.json: ${res.status}`);

  const json: unknown = await res.json();
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    throw new Error("Invalid sources.json");
  }

  return json as Registry;
}

export async function fetchXmlText(url: string): Promise<string> {
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

export function parseXml(xmlText: string): XMLDocument {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");
  const parserError = doc.querySelector("parsererror");
  if (parserError) {
    throw new Error(
      "XML parse error:\n" + (parserError.textContent || "").trim().slice(0, 800),
    );
  }
  return doc;
}

export function findAllByLocalName(root: ParentNode, localName: string): Element[] {
  const wanted = String(localName).toLowerCase();
  const all = Array.from(root.querySelectorAll("*"));
  return all.filter((node) => String(node.localName).toLowerCase() === wanted);
}

export function findFirstByLocalName(root: ParentNode, localName: string): Element | null {
  const wanted = String(localName).toLowerCase();
  const all = Array.from(root.querySelectorAll("*"));
  return all.find((node) => String(node.localName).toLowerCase() === wanted) || null;
}

export function pickText(parentEl: ParentNode, localName: string): string {
  const el = findFirstByLocalName(parentEl, localName);
  return (el?.textContent || "").trim();
}

export function pickAll(parentEl: ParentNode, localName: string): string[] {
  const els = findAllByLocalName(parentEl, localName);
  const vals = els.map((node) => (node.textContent || "").trim()).filter(Boolean);
  return uniqInOrder(vals);
}

export function uniqInOrder<T>(arr: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];

  for (const value of arr) {
    const key = String(value).toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(value);
    }
  }

  return out;
}

export function cleanText(str: unknown): string {
  return String(str || "").replace(/\s+/g, " ").trim();
}

export function truncate(str: string, maxLen: number): string {
  const value = str || "";
  if (value.length <= maxLen) return value;
  return value.slice(0, maxLen - 1).trimEnd() + "…";
}

export function stripHtml(html: string): string {
  const value = (html || "").trim();
  if (!value) return "";

  if (/[<>]/.test(value)) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(value, "text/html");
    return (doc.body?.textContent || "").trim();
  }

  return value;
}

export function parseDateToTs(dateStr: string): number | null {
  if (!dateStr) return null;
  const value = dateStr.trim();

  const mdy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  if (mdy) {
    const mm = Number(mdy[1]);
    const dd = Number(mdy[2]);
    const yyyy = Number(mdy[3]);
    if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
      return Date.UTC(yyyy, mm - 1, dd, 12, 0, 0);
    }
  }

  if (/^\d{10}$/.test(value)) return Number(value) * 1000;
  if (/^\d{13}$/.test(value)) return Number(value);

  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : null;
}

export function formatDateLabel(dateStr: string): string {
  const ts = parseDateToTs(dateStr);
  if (!ts) return dateStr || "";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(ts));
}
