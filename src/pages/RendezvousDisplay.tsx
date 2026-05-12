import { useEffect, useState } from "react";
import IconLegend from "../components/IconLegend";
import IconRow from "../components/IconRow";
import type { MenuItemData, RendezvousRouteConfig } from "../types";
import { errorMessage } from "../lib/helpers";
import { fetchMenuItems } from "../lib/menuData";

interface RendezvousDisplayProps {
  routeConfig: RendezvousRouteConfig;
}

export default function RendezvousDisplay({ routeConfig }: RendezvousDisplayProps) {
  const [item, setItem] = useState<MenuItemData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.dataset.hall = "rende";
    const themeStyles = document.getElementById("themeStyles") as HTMLLinkElement | null;
    if (themeStyles) themeStyles.href = `${import.meta.env.BASE_URL}themes/default.css`;
    document.title = `${routeConfig.title} — Digital Signage`;

    async function load() {
      try {
        const { items } = await fetchMenuItems("rendezvous", routeConfig.displayId);
        setItem(items[0] || null);
      } catch (err) {
        console.error(err);
        setError(errorMessage(err, "Unable to load menu."));
      }
    }

    void load();
  }, [routeConfig]);

  const title = item?.title || (error ? "Unable to load menu" : "Loading…");
  const price = item?.price || routeConfig.fallbackPrice;

  return (
    <div
      className="relative h-[1080px] w-[1920px] overflow-hidden"
      style={{ fontFamily: "var(--hall-font)" }}
    >
      {routeConfig.background && (
        <img
          src={routeConfig.background}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-fill"
        />
      )}

      <h1
        className="absolute left-[100px] top-[35px] m-0 uppercase text-white"
        style={{ fontFamily: "var(--hall-font-bold)", fontSize: "75px" }}
      >
        {routeConfig.title}
      </h1>

      <div className="absolute left-[115px] top-[190px] max-w-[900px]">
        <h2
          className="m-0"
          style={{
            color: "var(--hall-color-1)",
            fontFamily: "var(--hall-font-bold)",
            fontSize: "60px",
            lineHeight: 1,
          }}
        >
          {title}
        </h2>

        <div className="relative -top-[16px] mt-1 flex items-center gap-10">
          {price && (
            <p
              className="m-0 font-semibold text-[#111111]"
              style={{ fontFamily: "var(--hall-font)", fontSize: "50px" }}
            >
              {price}
            </p>
          )}
          <IconRow tags={item?.tags || []} mode="light" gap="2px" size="25px" className="!mt-0 !pb-0" />
        </div>
      </div>

      {error && (
        <p className="absolute left-[115px] top-[340px] max-w-[900px] text-[36px] text-red-700">
          {error}
        </p>
      )}

      <IconLegend
        mode="light"
        color="#111111"
        fontSize="16px"
        gap="6px"
        gapItems="16px"
        rowGap="10px"
        imgSize="25px"
        className="absolute bottom-[35px] left-1/2 w-[calc(100%-80px)] -translate-x-1/2"
      />
    </div>
  );
}
