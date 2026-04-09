import { createRouter, createRoute, createRootRoute } from "@tanstack/react-router";
import { HomePage } from "./pages/Home";
import { ProfileSelectPage } from "./pages/ProfileSelect";
import { useProfile } from "./context/profile";

function RootComponent() {
  const { activeProfile } = useProfile();
  if (!activeProfile) return <ProfileSelectPage />;
  return <HomePage />;
}

const rootRoute = createRootRoute({
  component: RootComponent,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => null,
});

const routeTree = rootRoute.addChildren([homeRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
