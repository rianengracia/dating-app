/* eslint-disable */
// TrueMatch — custom Node server: Next.js + Socket.IO sharing one HTTP server.
const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());

const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");
const { jwtVerify } = require("jose");
const { PrismaClient } = require("@prisma/client");
const webpush = require("web-push");

const dev = process.env.NODE_ENV !== "production";
// Use HOST (TrueMatch-specific) to avoid clashing with the auto-set HOSTNAME on Windows.
const hostname = process.env.HOST || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const prisma = new PrismaClient();

function parseCookie(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
}

function configurePush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@truematch.local";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

async function maybeSendPush(subscription, payload) {
  if (!subscription) return;
  if (!configurePush()) return;
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (err) {
    if (err && (err.statusCode === 404 || err.statusCode === 410)) {
      // Subscription is dead — caller can clean up if it has the user id.
    }
  }
}

app
  .prepare()
  .then(() => {
    const httpServer = createServer((req, res) => handle(req, res));
    const io = new Server(httpServer, { path: "/socket.io", cors: { origin: false } });

    const secret = process.env.JWT_SECRET
      ? new TextEncoder().encode(process.env.JWT_SECRET)
      : null;

    io.use(async (socket, nextFn) => {
      try {
        if (!secret) return nextFn(new Error("server misconfigured"));
        const cookies = parseCookie(socket.handshake.headers.cookie || "");
        const token = cookies["tm_session"];
        if (!token) return nextFn(new Error("unauthorized"));
        const { payload } = await jwtVerify(token, secret);
        if (typeof payload.sub !== "string") return nextFn(new Error("unauthorized"));
        socket.data.userId = payload.sub;
        nextFn();
      } catch {
        nextFn(new Error("unauthorized"));
      }
    });

    io.on("connection", (socket) => {
      socket.on("match:join", async (matchId, ack) => {
        try {
          if (typeof matchId !== "string" || !matchId) return ack && ack({ ok: false, error: "invalid" });
          const match = await prisma.match.findUnique({
            where: { id: matchId },
            select: { id: true, userAId: true, userBId: true },
          });
          if (!match) return ack && ack({ ok: false, error: "not_found" });
          const userId = socket.data.userId;
          if (match.userAId !== userId && match.userBId !== userId) {
            return ack && ack({ ok: false, error: "forbidden" });
          }
          socket.join(`match:${matchId}`);
          ack && ack({ ok: true });
        } catch (err) {
          console.error("match:join", err);
          ack && ack({ ok: false, error: "server" });
        }
      });

      socket.on("match:leave", (matchId, ack) => {
        if (typeof matchId === "string") socket.leave(`match:${matchId}`);
        ack && ack({ ok: true });
      });

      socket.on("message:send", async (payload, ack) => {
        try {
          const matchId = payload && typeof payload.matchId === "string" ? payload.matchId : "";
          const raw = payload && typeof payload.body === "string" ? payload.body.trim() : "";
          if (!matchId) return ack && ack({ ok: false, error: "invalid" });
          if (raw.length < 1 || raw.length > 2000) return ack && ack({ ok: false, error: "invalid_body" });

          const match = await prisma.match.findUnique({
            where: { id: matchId },
            select: { id: true, userAId: true, userBId: true },
          });
          if (!match) return ack && ack({ ok: false, error: "not_found" });
          const userId = socket.data.userId;
          if (match.userAId !== userId && match.userBId !== userId) {
            return ack && ack({ ok: false, error: "forbidden" });
          }

          const message = await prisma.message.create({
            data: { matchId, senderId: userId, body: raw },
            select: { id: true, senderId: true, body: true, createdAt: true },
          });
          const payloadOut = {
            id: message.id,
            matchId,
            senderId: message.senderId,
            body: message.body,
            createdAt: message.createdAt.toISOString(),
          };

          io.to(`match:${matchId}`).emit("message:new", payloadOut);
          ack && ack({ ok: true, message: payloadOut });

          // Push to the other user if they're not currently in the room.
          const room = io.sockets.adapter.rooms.get(`match:${matchId}`);
          const otherId = match.userAId === userId ? match.userBId : match.userAId;
          let otherInRoom = false;
          if (room) {
            for (const sid of room) {
              const s = io.sockets.sockets.get(sid);
              if (s && s.data.userId === otherId) {
                otherInRoom = true;
                break;
              }
            }
          }
          if (!otherInRoom) {
            const [other, sender] = await Promise.all([
              prisma.user.findUnique({
                where: { id: otherId },
                select: { displayName: true, pushSubscription: true },
              }),
              prisma.user.findUnique({
                where: { id: userId },
                select: { displayName: true },
              }),
            ]);
            if (other && other.pushSubscription && sender) {
              await maybeSendPush(other.pushSubscription, {
                title: `${sender.displayName}`,
                body: raw.length > 80 ? raw.slice(0, 77) + "..." : raw,
                url: `/match/${matchId}`,
                tag: `msg-${matchId}`,
              });
            }
          }
        } catch (err) {
          console.error("message:send", err);
          ack && ack({ ok: false, error: "server" });
        }
      });
    });

    httpServer.listen(port, hostname, () => {
      console.log(`> TrueMatch ready on http://${hostname}:${port}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
