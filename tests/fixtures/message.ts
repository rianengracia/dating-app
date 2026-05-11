export type MessageFixture = {
  id: string;
  matchId?: string;
  senderId: string;
  body: string;
  createdAt: string;
};

let n = 0;

export function makeMessage(over: Partial<MessageFixture> = {}): MessageFixture {
  n += 1;
  return {
    id: `msg-${n}`,
    senderId: "user-1",
    body: `Message body ${n}`,
    createdAt: new Date(2026, 0, 1, 12, n).toISOString(),
    ...over,
  };
}
