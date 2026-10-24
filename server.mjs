import { createServer as createHttpServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { readFileSync, existsSync } from 'node:fs';
import next from 'next';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import webpush from 'web-push';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();
const prisma = new PrismaClient();

let httpServer;

let pushReady = false;
function initPush() {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subj = process.env.VAPID_SUBJECT || 'mailto:noreply@example.com';
  if (!pub || !priv) return false;
  try {
    webpush.setVapidDetails(subj, pub, priv);
    pushReady = true;
  } catch (e) {
    console.error('[push] init failed:', e.message);
    pushReady = false;
  }
  return pushReady;
}
initPush();

async function pushToUser(userId, payload) {
  if (!pushReady) return;
  try {
    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    const json = JSON.stringify(payload);
    await Promise.allSettled(subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, json);
      } catch (e) {
        if (e?.statusCode === 404 || e?.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        }
      }
    }));
  } catch {}
}

const pendingCalls = new Map();

app.prepare().then(() => {
  httpServer = createServer(handler);
  const io = new Server(httpServer, { cors: { origin: '*' } });
  global.io = io;

  io.on('connection', (socket) => {
    socket.on('join-user', (userId) => { if (userId) socket.join(`user-${userId}`); });
    socket.on('join', (convId) => { if (convId) socket.join(convId); });
    socket.on('leave', (convId) => { if (convId) socket.leave(convId); });

    socket.on('typing', ({ convId, handle }) => {
      if (convId && handle) socket.to(convId).emit('typing', { handle, ts: Date.now() });
    });
    socket.on('read', ({ convId, handle }) => {
      if (convId && handle) socket.to(convId).emit('read', { handle, ts: Date.now() });
    });

    socket.on('call-user', ({ to, from, fromHandle, roomName, video }) => {
      if (!to || !from || !roomName) return;
      pendingCalls.set(roomName, { callerId: from, receiverId: to, video: !!video, startTime: Date.now(), status: 'ringing' });
      io.to(`user-${to}`).emit('incoming-call', { fromHandle, roomName, video: !!video });
      pushToUser(to, { title: 'Incoming call', body: `${fromHandle} is calling`, link: `/app/messages/${fromHandle}`, tag: 'incoming-call' }).catch(() => {});
    });

    socket.on('call-response', ({ roomName, accepted }) => {
      const call = pendingCalls.get(roomName);
      if (!call) return;
      if (accepted) {
        call.status = 'active';
        call.answeredAt = Date.now();
        io.to(`user-${call.callerId}`).emit('call-accepted', { roomName });
      } else {
        pendingCalls.delete(roomName);
        io.to(`user-${call.callerId}`).emit('call-declined', { roomName });
      }
    });

    socket.on('call-end', ({ roomName }) => {
      pendingCalls.delete(roomName);
    });

    socket.on('call-add-participant', ({ roomName, invite }) => {
      const call = pendingCalls.get(roomName);
      if (!call) return;
      io.to(roomName).emit('call-participant-added', { roomName, handle: invite });
      io.to(`user-${invite}`).emit('incoming-call', { fromHandle: call.callerId, fromName: call.callerId, video: !!call.video, roomName });
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.io listening on ws://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error('FATAL Next.js error:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  if (httpServer) httpServer.close(() => process.exit(0));
  else process.exit(0);
});
