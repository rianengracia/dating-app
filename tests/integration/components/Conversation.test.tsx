import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  messageSend: vi.fn(),
  subscribePresence: vi.fn(),
}));

vi.mock("@/services/messageService", () => ({
  messageService: {
    send: mocks.messageSend,
    list: vi.fn(),
  },
}));
vi.mock("@/services/realtimeService", () => ({
  realtimeService: {
    subscribePresence: mocks.subscribePresence,
  },
}));

import { Conversation } from "@/app/(app)/match/[matchId]/Conversation";
import { ApiError } from "@/services/http";
import { makeMessage } from "../../fixtures/message";

type Handlers = {
  onSubscribed: () => void;
  onError: (reason?: unknown) => void;
  onMessage: (msg: { id: string; senderId: string; body: string; createdAt: string }) => void;
};

let handlers: Handlers | null = null;

beforeEach(() => {
  mocks.messageSend.mockReset();
  mocks.subscribePresence.mockReset();
  handlers = null;
  mocks.subscribePresence.mockImplementation((_id, h) => {
    handlers = h;
    return vi.fn();
  });
});

const baseProps = {
  matchId: "m-1",
  meId: "me",
  partner: { id: "p-1", displayName: "Sage", photoUrl: "/p.jpg" },
};

describe("<Conversation />", () => {
  it("renders the initial messages and connection status", async () => {
    render(
      <Conversation
        {...baseProps}
        initialMessages={[makeMessage({ id: "a", body: "hello world", senderId: "p-1" })]}
      />
    );

    expect(screen.getByText("hello world")).toBeInTheDocument();
    expect(screen.getByText(/connecting/i)).toBeInTheDocument();

    act(() => handlers!.onSubscribed());
    expect(await screen.findByText(/linked/i)).toBeInTheDocument();
  });

  it("appends an incoming realtime message", async () => {
    render(<Conversation {...baseProps} initialMessages={[]} />);
    act(() => handlers!.onSubscribed());

    act(() => {
      handlers!.onMessage(makeMessage({ id: "rt-1", body: "from partner", senderId: "p-1" }));
    });

    expect(await screen.findByText("from partner")).toBeInTheDocument();
  });

  it("sends a message, appends it to the list, and clears the draft", async () => {
    mocks.messageSend.mockResolvedValueOnce({
      message: makeMessage({ id: "sent-1", body: "yo", senderId: "me" }),
    });

    const user = userEvent.setup();
    render(<Conversation {...baseProps} initialMessages={[]} />);
    act(() => handlers!.onSubscribed());

    const input = screen.getByPlaceholderText(/message sage/i);
    await user.type(input, "yo");
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(await screen.findByText("yo")).toBeInTheDocument();
    expect((input as HTMLInputElement).value).toBe("");
    expect(mocks.messageSend).toHaveBeenCalledWith("m-1", "yo");
  });

  it("surfaces an inline error when send returns 403, leaving the draft restored", async () => {
    mocks.messageSend.mockRejectedValueOnce(
      new ApiError({ status: 403, message: "forbidden" })
    );

    const user = userEvent.setup();
    render(<Conversation {...baseProps} initialMessages={[]} />);
    act(() => handlers!.onSubscribed());

    const input = screen.getByPlaceholderText(/message sage/i);
    await user.type(input, "nope");
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(await screen.findByText(/forbidden/i)).toBeInTheDocument();
    expect((input as HTMLInputElement).value).toBe("nope");
  });
});
