import type { MenuItemData } from "../types";
import {
  findAllByLocalName,
  pickText,
  pickAll,
  cleanText,
  truncate,
  parseDateToTs,
  uniqInOrder,
} from "./helpers";

export function parseJamixForecastedRecipes(doc: XMLDocument): MenuItemData[] {
  const recipes = findAllByLocalName(doc, "recipe");
  if (!recipes.length) return [];

  return recipes.map((el, idx) => {
    const serveDate = pickText(el, "Serve_Date");
    const menuType = pickText(el, "Menu_Type");

    const storageStation =
      pickText(el, "Food_Storage_Station") ||
      pickText(el, "Food_Storage_Station_Name") ||
      pickText(el, "Food_Station") ||
      pickText(el, "FoodStorageStation") ||
      pickText(el, "Storage_Station") ||
      "";

    const menuStation = pickText(el, "Menu_Meal_Option") || "";
    const station = storageStation || menuStation;

    const locationNumber = pickText(el, "Location_Number");
    const recipeNumber = pickText(el, "Recipe_Number");
    const title =
      pickText(el, "Recipe_Print_As") ||
      (recipeNumber ? `Recipe #${recipeNumber}` : `Recipe ${idx + 1}`);

    const price = pickText(el, "Sales_Price") || "";
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
      price: cleanText(price),
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
        menuStation: cleanText(menuStation),
        storageStation: cleanText(storageStation),
      },
    } satisfies MenuItemData;
  });
}
