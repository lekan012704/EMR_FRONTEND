import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

it("renders the app provider within the router context", async () => {
  window.history.replaceState(null, "", "/login");
  const { default: App } = await import("./App");
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );

  expect(await screen.findByLabelText(/staff username or email/i)).toBeTruthy();
});
