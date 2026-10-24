'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from '@/components/UserProvider';

const SocketCtx = createContext<Socket | null>(null);
export function useSocket() { return useContext(SocketCtx); }

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useUser();

  useEffect(() => {
    const s = io({ path: '/socket.io' });
    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  useEffect(() => {
    if (socket && user?.id) {
      socket.emit('join-user', user.id);
    }
  }, [socket, user]);

  return <SocketCtx.Provider value={socket}>{children}</SocketCtx.Provider>;
}
