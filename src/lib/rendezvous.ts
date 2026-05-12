import type { RendezvousRouteConfig } from "../types";

export const RENDEZVOUS_ROUTES: Record<string, RendezvousRouteConfig> = {
  "/rendezvous/east-specials": {
    displayId: "East Specials",
    title: "EAST SPECIALS",
    fallbackPrice: "",
    background: "/bgs/rende/Rendezvous East Background.png",
  },
  "/rendezvous/east-sushi-bowls": {
    displayId: "East Sushi Bowls",
    title: "DAILY SUSHI BOWLS",
    fallbackPrice: "$10.00",
    background: "/bgs/rende/Rendezvous East Background.png",
  },
  "/rendezvous/west-specials": {
    displayId: "West Specials",
    title: "WEST SPECIALS",
    fallbackPrice: "",
    background: "/bgs/rende/Rendezvous West Background.png",
  },
  "/rendezvous/west-byo": {
    displayId: "West BYO",
    title: "BUILD YOUR OWN",
    fallbackPrice: "",
    background: "/bgs/rende/Rendezvous West Background.png",
  },
  "/rendezvous/boba": {
    displayId: "Boba",
    title: "BOBA DRINKS",
    fallbackPrice: "",
    background: "/bgs/rende/Rendezvous West Background.png",
  },
};
