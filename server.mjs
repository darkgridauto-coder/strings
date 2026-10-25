import 'dotenv/config';
import { createServer } from 'node:http';
import next from 'next';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const REQUIRED = ['JWT_SECRET', 'DATABASE_URL'];
const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length) {
  console.error('[startup] Missing required env:', missing.join(', '));
  if (process.env.NODE_ENV === 'production') process.exit(1);
}
if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET === 'dev-only-secret-change-me') {
  console.error('[startup] JWT_SECRET is the dev default.');
  process.exit(1);
}
if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_APP_URL) {
  console.error('[startup] NEXT_PUBLIC_APP_URL required in production.');
  process.exit(1);
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';
const COOKIE_NAME = 'strings_session';
const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const pendingCalls = new Map();

function getVerifiedUserId(socket) {
  try {
    const cookie = socket.handshake.headers.cookie || '';
    const m = cookie.match(new RegExp('(?:^|;\\s*)' + COOKIE_NAME + '=([^;]+)'));
    if (!m) return null;
    const p = jwt.verify(decodeURIComponent(m[1]), JWT_SECRET);
    return typeof p === 'object' && p.userId ? p.userId : null;
  } catch { return null; }
}

async function userCanJoinConversation(userId, convId) {
  try {
    const c = await prisma.conversation.findUnique({
      where: { id: convId },
      include: { participants: { select: { id: true } } },
    });
    return !!c && c.participants.some((p) => p.id === userId);
  } catch { return false; }
}

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer, { cors: { origin: ALLOWED_ORIGIN, credentials: true } });
  global.io = io;

  io.on('connection', (socket) => {
    const userId = getVerifiedUserId(socket);
    socket.data.userId = userId;

    socket.on('join-user', () => { if (userId) socket.join('user-' + userId); });

    socket.on('join', async (convId) => {
      if (!userId || !convId || typeof convId !== 'string') return;
      if (await userCanJoinConversation(userId, convId)) socket.join(convId);
    });

    socket.on('leave', (convId) => { if (convId) socket.leave(convId); });

    socket.on('typing', async ({ convId, handle }) => {
      if (!userId || !convId || !handle) return;
      if (!(await userCanJoinConversation(userId, convId))) return;
      socket.to(convId).emit('typing', { handle, ts: Date.now() });
    });

    socket.on('read', async ({ convId, handle }) => {
      if (!userId || !convId || !handle) return;
      if (!(await userCanJoinConversation(userId, convId))) return;
      socket.to(convId).emit('read', { handle, ts: Date.now() });
    });

    socket.on('call-user', async ({ to, fromHandle, roomName, video }) => {
      if (!userId || !to || !roomName) return;
      if (roomName.startsWith('dm-')) {
        const rest = roomName.slice(3);
        const dash = rest.indexOf('-');
        if (dash < 0) return;
        const a = rest.slice(0, dash), b = rest.slice(dash + 1);
        if (userId !== a && userId !== b) return;
      } else if (roomName.startsWith('group-')) {
        if (!(await userCanJoinConversation(userId, roomName.slice(6)))) return;
      } else return;
      pendingCalls.set(roomName, { callerId: userId, receiverId: to, video: !!video, startTime: Date.now(), status: 'ringing' });
      io.to('user-' + to).emit('incoming-call', { fromHandle, roomName, video: !!video });
    });

    socket.on('call-response', ({ roomName, accepted }) => {
      if (!userId) return;
      const call = pendingCalls.get(roomName);
      if (!call || call.receiverId !== userId) return;
      if (accepted) {
        call.status = 'active';
        call.answeredAt = Date.now();
        io.to('user-' + call.callerId).emit('call-accepted', { roomName });
      } else {
        pendingCalls.delete(roomName);
        io.to('user-' + call.callerId).emit('call-declined', { roomName });
      }
    });

    socket.on('call-end', ({ roomName }) => {
      if (!userId) return;
      const call = pendingCalls.get(roomName);
      if (!call) return;
      if (call.callerId !== userId && call.receiverId !== userId) return;
      if (call.status === 'ringing') io.to('user-' + call.receiverId).emit('call-cancelled', { roomName });
      else if (call.status === 'active') {
        io.to('user-' + call.receiverId).emit('call-ended', { roomName });
        io.to('user-' + call.callerId).emit('call-ended', { roomName });
      }
      pendingCalls.delete(roomName);
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log('> Ready on http://' + hostname + ':' + port);
    console.log('> Socket.IO listening (origin: ' + ALLOWED_ORIGIN + ')');
  });
});
