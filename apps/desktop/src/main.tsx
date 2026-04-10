import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./context/theme";
import { ProfileProvider } from "./context/profile";
import { ServerReadyGate } from "./components/ServerReadyGate";
import { router } from "./router";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ServerReadyGate>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ProfileProvider>
            <RouterProvider router={router} />
          </ProfileProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ServerReadyGate>
  </StrictMode>
);
