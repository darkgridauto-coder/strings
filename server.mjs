import { createServer } from 'node:http';
import next from 'next';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || '0.0.0.0'; // Bound to 0.0.0.0 for LAN/HMR
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();
const prisma = new PrismaClient();

const pendingCalls = new Map();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer, { cors: { origin: '*' } });
  global.io = io;

  io.on('connection', (socket) => {
    socket.on('join-user', (userId) => {
      if (userId) socket.join(`user-${userId}`);
    });

    socket.on('join', (convId) => {
      if (convId) socket.join(convId);
    });

    socket.on('leave', (convId) => {
      if (convId) socket.leave(convId);
    });

    socket.on('typing', ({ convId, handle }) => {
      if (convId && handle) socket.to(convId).emit('typing', { handle, ts: Date.now() });
    });

    socket.on('read', ({ convId, handle }) => {
      if (convId && handle) socket.to(convId).emit('read', { handle, ts: Date.now() });
    });

    socket.on('call-user', ({ to, from, fromHandle, roomName, video }) => {
      if (!to || !from || !roomName) return;
      pendingCalls.set(roomName, {
        callerId: from,
        receiverId: to,
        video: !!video,
        startTime: Date.now(),
        status: 'ringing',
      });
      io.to(`user-${to}`).emit('incoming-call', {
        fromHandle,
        roomName,
        video: !!video,
      });
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
      const call = pendingCalls.get(roomName);
      if (!call) return;
      if (call.status === 'ringing') {
        io.to(`user-${call.receiverId}`).emit('call-cancelled', { roomName });
      } else if (call.status === 'active') {
        io.to(`user-${call.receiverId}`).emit('call-ended', { roomName });
        io.to(`user-${call.callerId}`).emit('call-ended', { roomName });
      }
      pendingCalls.delete(roomName);
    });

    socket.on('call-add-participant', ({ roomName, invite }) => {
      const call = pendingCalls.get(roomName);
      if (!call) return;
      io.to(roomName).emit('call-participant-added', { roomName, handle: invite });
      io.to(`user-${invite}`).emit('incoming-call', {
        fromHandle: call.callerId,
        roomName,
        video: !!call.video,
      });
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.io listening on ws://${hostname}:${port}`);
  });
});
