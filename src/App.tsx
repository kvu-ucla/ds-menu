import Cafe1919Display from "./pages/Cafe1919Display";
import GeneralFeedApp from "./pages/GeneralFeedApp";
import RendezvousDisplay from "./pages/RendezvousDisplay";
import { CAFE_1919_ROUTES } from "./lib/cafe1919";
import { RENDEZVOUS_ROUTES } from "./lib/rendezvous";

interface NotFoundProps {
  path: string;
}

function NotFound({ path }: NotFoundProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-8 text-white">
      <div className="max-w-xl rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl">
        <h1 className="text-3xl font-bold">Display route not found</h1>
        <p className="mt-4 text-slate-300">
          No React display has been mapped for <code>{path}</code>.
        </p>
        <a
          className="mt-6 inline-block rounded-xl bg-white px-4 py-2 font-semibold text-slate-950"
          href="/"
        >
          Back to feed browser
        </a>
      </div>
    </main>
  );
}

export default function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, ""); // e.g. "/ds-menu"
  const path = window.location.pathname.replace(base, "").replace(/\/$/, "") || "/";

  if (path === "/") return <GeneralFeedApp />;

  const cafe1919DisplayId = CAFE_1919_ROUTES[path];
  if (cafe1919DisplayId) {
    return <Cafe1919Display displayId={cafe1919DisplayId} />;
  }

  const rendezvousRouteConfig = RENDEZVOUS_ROUTES[path];
  if (rendezvousRouteConfig) {
    return <RendezvousDisplay routeConfig={rendezvousRouteConfig} />;
  }

  return <NotFound path={path} />;
}
