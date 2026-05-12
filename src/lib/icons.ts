import type { IconMode } from "../types";

export const ICON_BASE_PATHS: Record<IconMode, string> = {
  light: "/allergen_icons/Light Mode/SVG/",
  dark: "/allergen_icons/Dark Mode/SVG/",
};

export const TAG_TO_ICON = {
  vegetarian: "01 Vegetarian.svg",
  vegan: "02 Vegan.svg",
  peanut: "03 Contains Peanuts.svg",
  treenuts: "04 Contains Tree Nuts.svg",
  wheat: "05 Contains Wheat.svg",
  gluten: "06 Contains Gluten.svg",
  soy: "07 Contains Soy.svg",
  sesame: "08 Contains Sesame Seeds.svg",
  dairy: "09 Contains Dairy.svg",
  egg: "10 Contains Egg.svg",
  shellfish: "11 Contains Shellfish.svg",
  fish: "12 Contains Fish.svg",
  alcohol: "13 Contains Ethanol-Alcohol.svg",
  halal: "14 Halal.svg",
  lowcarbon: "15 Low-Carbon Foodprint.svg",
  highcarbon: "16 Hight-Carbon Foodprint.svg",
} as const;

export type IconTag = keyof typeof TAG_TO_ICON;

export const ICON_NAMES: Record<IconTag, string> = {
  vegetarian: "VEGETARIAN",
  vegan: "VEGAN",
  peanut: "PEANUTS",
  treenuts: "TREE NUTS",
  wheat: "WHEAT",
  gluten: "GLUTEN",
  soy: "SOY",
  sesame: "SESAME",
  dairy: "DAIRY",
  egg: "EGGS",
  shellfish: "SHELLFISH",
  fish: "FISH",
  alcohol: "ETHANOL-ALCOHOL",
  halal: "HALAL",
  lowcarbon: "LOW-CARBON FOODPRINT",
  highcarbon: "HIGH-CARBON FOODPRINT",
};

export function normalizeTag(tag: unknown): IconTag | "" {
  const value = String(tag || "").trim().toLowerCase();
  if (!value) return "";

  if (value.includes("vegetarian")) return "vegetarian";
  if (value.includes("vegan")) return "vegan";
  if (value.includes("peanut")) return "peanut";
  if (value.includes("treenuts")) return "treenuts";
  if (value.includes("tree nuts")) return "treenuts";
  if (value.includes("wheat")) return "wheat";
  if (value.includes("gluten")) return "gluten";
  if (value.includes("soy")) return "soy";
  if (value.includes("sesame")) return "sesame";
  if (value.includes("dairy")) return "dairy";
  if (value.includes("egg")) return "egg";
  if (value.includes("shellfish")) return "shellfish";
  if (value.includes("fish")) return "fish";
  if (value.includes("alcohol") || value.includes("ethanol")) return "alcohol";
  if (value.includes("halal")) return "halal";
  if (value.includes("lowcarbon") || value.includes("low-carbon")) return "lowcarbon";
  if (value.includes("highcarbon") || value.includes("high-carbon")) return "highcarbon";

  return "";
}

export function iconSrc(tag: unknown, mode: IconMode = "light"): string | undefined {
  const normalized = normalizeTag(tag);
  if (!normalized) return undefined;

  const base = mode === "dark" ? ICON_BASE_PATHS.dark : ICON_BASE_PATHS.light;
  const filename =
    mode === "dark"
      ? TAG_TO_ICON[normalized].replace(".svg", "-Dark Mode.svg")
      : TAG_TO_ICON[normalized];

  return encodeURI(base + filename);
}

export function uniqueIconTags(tags: unknown[] = []): IconTag[] {
  const seen = new Set<IconTag>();
  const out: IconTag[] = [];

  for (const rawTag of tags) {
    const tag = normalizeTag(rawTag);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
  }

  return out;
}
