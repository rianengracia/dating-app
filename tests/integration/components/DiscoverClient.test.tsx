import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  swipe: vi.fn(),
  routerPush: vi.fn(),
}));

vi.mock("@/services/discoverService", () => ({
  discoverService: { list: mocks.list },
}));
vi.mock("@/services/swipeService", () => ({
  swipeService: { swipe: mocks.swipe },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.routerPush }),
}));

import { DiscoverClient } from "@/app/(app)/discover/DiscoverClient";

beforeEach(() => {
  mocks.list.mockReset();
  mocks.swipe.mockReset();
  mocks.routerPush.mockReset();
});

const C = (over = {}) => ({
  id: "u1",
  displayName: "Sage",
  age: 25,
  bio: "Looking for a duo.",
  photoUrl: "/p.jpg",
  distanceKm: 5,
  ...over,
});

describe("<DiscoverClient />", () => {
  it("renders the first candidate after loading", async () => {
    mocks.list.mockResolvedValueOnce({
      candidates: [C({ id: "u1", displayName: "Sage" }), C({ id: "u2", displayName: "Jett" })],
    });

    render(<DiscoverClient />);
    expect(await screen.findByText(/SAGE/)).toBeInTheDocument();
  });

  it("removes the top candidate after a SKIP, advancing to the next", async () => {
    mocks.list.mockResolvedValueOnce({
      candidates: [C({ id: "u1", displayName: "Sage" }), C({ id: "u2", displayName: "Jett" })],
    });
    mocks.swipe.mockResolvedValueOnce({ matched: false });

    const user = userEvent.setup();
    render(<DiscoverClient />);
    await screen.findByText(/SAGE/);

    await user.click(screen.getByRole("button", { name: /skip/i }));

    expect(mocks.swipe).toHaveBeenCalledWith("u1", "SKIP");
    expect(await screen.findByText(/JETT/)).toBeInTheDocument();
  });

  it("opens the match overlay on a mutual like and navigates on OPEN", async () => {
    mocks.list.mockResolvedValueOnce({ candidates: [C({ id: "u1", displayName: "Sage" })] });
    mocks.swipe.mockResolvedValueOnce({
      matched: true,
      matchId: "m-99",
      partner: { id: "u1", displayName: "Sage", photoUrl: "/p.jpg" },
    });

    const user = userEvent.setup();
    render(<DiscoverClient />);
    await screen.findByText(/SAGE/);

    await user.click(screen.getByRole("button", { name: /like/i }));

    expect(await screen.findByText(/match formed/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /open conversation/i }));
    expect(mocks.routerPush).toHaveBeenCalledWith("/match/m-99");
  });

  it("shows an empty state when no candidates remain", async () => {
    mocks.list.mockResolvedValueOnce({ candidates: [] });

    render(<DiscoverClient />);
    expect(await screen.findByText(/lobby empty/i)).toBeInTheDocument();
  });
});
