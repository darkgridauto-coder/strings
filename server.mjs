import { createServer } from 'node:http';
import next from 'next';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';
const COOKIE_NAME = 'strings_session';

const pendingCalls = new Map();

function getVerifiedUserId(socket) {
  try {
    const cookie = socket.handshake.headers.cookie || '';
    const match = cookie.match(new RegExp('(?:^|;\\s*)' + COOKIE_NAME + '=([^;]+)'));
    if (!match) return null;
    const token = decodeURIComponent(match[1]);
    const payload = jwt.verify(token, JWT_SECRET);
    return typeof payload === 'object' && payload.userId ? payload.userId : null;
  } catch {
    return null;
  }
}

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer, { cors: { origin: '*' } });
  global.io = io;

  io.on('connection', (socket) => {
    const userId = getVerifiedUserId(socket);
    socket.data.userId = userId;

    socket.on('join-user', () => {
      if (userId) socket.join(`user-${userId}`);
    });
    socket.on('join', (convId) => { if (convId) socket.join(convId); });
    socket.on('leave', (convId) => { if (convId) socket.leave(convId); });
    socket.on('typing', ({ convId, handle }) => {
      if (convId && handle) socket.to(convId).emit('typing', { handle, ts: Date.now() });
    });
    socket.on('read', ({ convId, handle }) => {
      if (convId && handle) socket.to(convId).emit('read', { handle, ts: Date.now() });
    });

    socket.on('call-user', async ({ to, fromHandle, roomName, video }) => {
      if (!userId || !to || !roomName) return;
      if (roomName.startsWith('dm-')) {
        const rest = roomName.slice(3);
        const dash = rest.indexOf('-');
        if (dash < 0) return;
        const a = rest.slice(0, dash);
        const b = rest.slice(dash + 1);
        if (userId !== a && userId !== b) return;
      } else if (roomName.startsWith('group-')) {
        const convId = roomName.slice(6);
        const conv = await prisma.conversation.findUnique({
          where: { id: convId },
          include: { participants: { select: { id: true } } },
        });
        if (!conv || !conv.participants.some((p) => p.id === userId)) return;
      } else {
        return;
      }
      pendingCalls.set(roomName, {
        callerId: userId, receiverId: to, video: !!video, startTime: Date.now(), status: 'ringing',
      });
      io.to(`user-${to}`).emit('incoming-call', { fromHandle, roomName, video: !!video });
    });

    socket.on('call-response', ({ roomName, accepted }) => {
      if (!userId) return;
      const call = pendingCalls.get(roomName);
      if (!call || call.receiverId !== userId) return;
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
      if (!userId) return;
      const call = pendingCalls.get(roomName);
      if (!call) return;
      if (call.callerId !== userId && call.receiverId !== userId) return;
      if (call.status === 'ringing') io.to(`user-${call.receiverId}`).emit('call-cancelled', { roomName });
      else if (call.status === 'active') {
        io.to(`user-${call.receiverId}`).emit('call-ended', { roomName });
        io.to(`user-${call.callerId}`).emit('call-ended', { roomName });
      }
      pendingCalls.delete(roomName);
    });

    socket.on('call-add-participant', ({ roomName, invite }) => {
      if (!userId) return;
      const call = pendingCalls.get(roomName);
      if (!call) return;
      if (call.callerId !== userId && call.receiverId !== userId) return;
      io.to(roomName).emit('call-participant-added', { roomName, handle: invite });
      io.to(`user-${invite}`).emit('incoming-call', { fromHandle: call.callerId, roomName, video: !!call.video });
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.io listening on ws://${hostname}:${port}`);
  });
});
