import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { App } from "./App";

beforeEach(() => {
  // Mock backend calls made by ModelProvider (/model/info). Keep it deterministic for CI.
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      return new Response(JSON.stringify({ model_a: null, model_b: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    })
  );
});

describe("App", () => {
  it("renders landing page hero content", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    expect(
      await screen.findByText(/Flood intelligence/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Actionable resilience/i)).toBeInTheDocument();
  });
});
