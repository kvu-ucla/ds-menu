import type { RendezvousRouteConfig } from "../types";

const base = import.meta.env.BASE_URL;
const BG_EAST = `${base}bgs/rende/Rendezvous East Background.png`;
const BG_WEST = `${base}bgs/rende/Rendezvous West Background.png`;

export const RENDEZVOUS_ROUTES: Record<string, RendezvousRouteConfig> = {
  "/rendezvous/east-specials": {
    displayId: "East Specials",
    title: "EAST SPECIALS",
    fallbackPrice: "",
    background: BG_EAST,
  },
  "/rendezvous/east-sushi-bowls": {
    displayId: "East Sushi Bowls",
    title: "DAILY SUSHI BOWLS",
    fallbackPrice: "$10.00",
    background: BG_EAST,
  },
  "/rendezvous/west-specials": {
    displayId: "West Specials",
    title: "WEST SPECIALS",
    fallbackPrice: "",
    background: BG_WEST,
  },
  "/rendezvous/west-byo": {
    displayId: "West BYO",
    title: "BUILD YOUR OWN",
    fallbackPrice: "",
    background: BG_WEST,
  },
  "/rendezvous/boba": {
    displayId: "Boba",
    title: "BOBA DRINKS",
    fallbackPrice: "",
    background: BG_WEST,
  },
};
