import { useEffect, useMemo, useState } from "react";
import IconLegend from "../components/IconLegend";
import IconRow from "../components/IconRow";
import type {
  Cafe1919DisplayId,
  MenuItemData,
  StationConfig,
  StationItems,
} from "../types";
import { errorMessage, getSheetData, loadRegistry, matchesAnyStation } from "../lib/helpers";
import { fetchMenuItems } from "../lib/menuData";
import {
  displayTitleForStation,
  fallbackCafe1919Config,
  fillConfig,
  regionToPage,
} from "../lib/cafe1919";

function SideInfoPanel() {
  return (
    <div className="flex h-full flex-col text-white">
      <section>
        <div className="flex h-[54px] items-center justify-center border-b-4 border-b-(--hall-border-color) bg-(--hall-bg-color) py-5 text-white">
          <h2
            className="mt-1 text-[40px] uppercase leading-none"
            style={{ fontFamily: "var(--hall-font-bold)" }}
          >
            SCAN FOR FULL MENU
          </h2>
        </div>
      </section>

      <section className="pt-5 text-center">
        <div className="mx-auto w-[85%] border-b-2 border-(--hall-border-color) pb-5">
          <div className="mx-auto h-[261px] w-[261px] bg-white">
            <img
              src={`${import.meta.env.BASE_URL}bgs/cafe1919/qr.svg`}
              alt="QR code"
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      </section>

      <section className="pt-3 text-center">
        <div className="mx-auto w-[85%] text-center">
          <h3 className="text-[40px] uppercase" style={{ fontFamily: "var(--hall-font-bold)" }}>
            1 Swipe Meal Deal
          </h3>
        </div>

        <div className="mx-auto w-[85%] text-center">
          <p
            className="mx-auto my-auto max-w-[400px] text-[25px] leading-tight"
            style={{ fontFamily: "var(--hall-font-bold)" }}
          >
            Any Pizzette, Panini, Insalate, or Pretzel + 1 Side + 1 Fountain Drink
          </p>
        </div>
      </section>

      <section className="pt-3 text-center">
        <h3 className="text-[40px] uppercase" style={{ fontFamily: "var(--hall-font-bold)" }}>
          1 Swipe Dessert Deal
        </h3>
        <p
          className="mx-auto max-w-[350px] text-[25px] leading-tight"
          style={{ fontFamily: "var(--hall-font-bold)" }}
        >
          Up to 2 Flavors + Up to 2 Toppings OR 1 Daily Special
        </p>
      </section>

      <section className="pt-3 text-center">
        <div className="mx-auto w-[85%] border-b-2 border-(--hall-border-color) pb-5">
          <h3 className="text-[40px] uppercase" style={{ fontFamily: "var(--hall-font-bold)" }}>
            Accepted Payment
          </h3>
          <p className="text-[25px] leading-tight" style={{ fontFamily: "var(--hall-font-bold)" }}>
            Bruincard (EasyPay), Credit/Debit Card
          </p>
        </div>
      </section>

      <section className="mx-auto w-[90%] pt-5 text-center">
        <IconLegend
          mode="dark"
          color="white"
          font="var(--hall-font-bold)"
          fontSize="18px"
          gap="10px"
          gapItems="20px"
          rowGap="20px"
          imgSize="20px"
          className="mx-auto w-[95%]"
        />
      </section>

      <div className="mt-auto pb-7 text-center text-[14px] leading-tight text-white">
        <h4 className="text-[18px]" style={{ fontFamily: "var(--hall-font)" }}>
          For allergen and nutritional information, visit
          <br />
          menu.dining.ucla.edu/Menus/Cafe1919
        </h4>
      </div>
    </div>
  );
}

interface MenuTitleProps {
  title: string;
}

function MenuTitle({ title }: MenuTitleProps) {
  return (
    <section>
      <div className="flex h-[54px] items-center justify-center border-b-4 border-b-(--hall-border-color) bg-(--hall-bg-color) py-5 text-white">
        <h2
          className="mt-1 text-[40px] uppercase leading-none"
          style={{ fontFamily: "var(--hall-font-bold)" }}
        >
          {title}
        </h2>
      </div>
    </section>
  );
}

interface MenuItemProps {
  item: MenuItemData;
}

function MenuItem({ item }: MenuItemProps) {
  return (
    <article>
      <div className="flex w-full items-start gap-3">
        <h3 className="max-w-[80%] break-words text-[25px] uppercase leading-none">
          {item.title}
        </h3>
        <span className="ml-auto shrink-0 whitespace-nowrap text-[25px] leading-none">
          {item.price}
        </span>
      </div>
      {item.summary && (
        <p className="mt-2 text-[18px] leading-tight text-(--hall-color-2)">{item.summary}</p>
      )}
      <IconRow tags={item.tags} mode="light" gap="10px" size="20px" />
    </article>
  );
}

interface MenuColumnProps {
  stations: string[];
  stationItems: StationItems;
}

function MenuColumn({ stations, stationItems }: MenuColumnProps) {
  return (
    <div
      className="flex h-full flex-col text-(--hall-color-1)"
      style={{ fontFamily: "var(--hall-font-bold)" }}
    >
      {stations.map((station) => {
        const title = displayTitleForStation(station);
        const rawItems = stationItems[station] || [];
        const items =
          station === "DAILY SPECIALS"
            ? rawItems
            : [...rawItems].sort((a, b) => a.title.localeCompare(b.title));

        return (
          <div key={station}>
            <MenuTitle title={title} />
            <div className="mx-auto w-[90%] pt-4">
              {items.length ? (
                items.map((item, index) => <MenuItem key={`${item.id}-${index}`} item={item} />)
              ) : (
                <p className="text-[22px] uppercase text-(--hall-color-2)">No items available</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface Cafe1919DisplayProps {
  displayId: Cafe1919DisplayId;
}

export default function Cafe1919Display({ displayId }: Cafe1919DisplayProps) {
  const [config, setConfig] = useState<StationConfig | null>(null);
  const [stationItems, setStationItems] = useState<StationItems>({});
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.dataset.hall = "cafe1919";
    const themeStyles = document.getElementById("themeStyles") as HTMLLinkElement | null;
    if (themeStyles) themeStyles.href = `${import.meta.env.BASE_URL}themes/default.css`;
    document.title = `Cafe 1919 ${displayId} — Digital Signage`;

    async function load() {
      try {
        const registry = await loadRegistry();
        const display = registry.cafe1919?.displays?.[displayId];
        const { items } = await fetchMenuItems("cafe1919");

        let pageConfig: StationConfig;
        try {
          const sheetData = await getSheetData("cafe1919");
          pageConfig = regionToPage(sheetData)[displayId];
        } catch (sheetErr) {
          console.warn("Using sources.json fallback because sheet load failed:", sheetErr);
          pageConfig = fallbackCafe1919Config(displayId, display?.stations || []);
        }

        const stations = Object.values(pageConfig || {}).flat();
        const filtered = items.filter((item) => matchesAnyStation(item, stations));
        setConfig(pageConfig);
        setStationItems(fillConfig(pageConfig, filtered, displayId));
      } catch (err) {
        console.error(err);
        setError(errorMessage(err, "Unable to load menu."));
      }
    }

    void load();
  }, [displayId]);

  const columns = useMemo(() => Object.entries(config || {}), [config]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-10 text-3xl text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="relative h-[1080px] w-[1920px] overflow-hidden">
        <img
          src={`${import.meta.env.BASE_URL}bgs/cafe1919/Cafe 1919 Background.png`}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-fill"
        />
        <main className="relative grid h-[1080px] w-[1920px] grid-cols-[471px_471px_471px_471px] gap-x-3">
          <SideInfoPanel />
          {columns.map(([column, stations]) => (
            <MenuColumn key={column} stations={stations} stationItems={stationItems} />
          ))}
        </main>
      </div>
    </div>
  );
}
