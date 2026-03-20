'use client';

import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;
let socketToken: string | null = null;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api';

function resolveRealtimeUrl() {
  return API_BASE_URL.replace(/\/api\/?$/, '');
}

export function connectGameSocket(token: string): Socket {
  if (socket && socketToken === token) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socketToken = token;
  socket = io(`${resolveRealtimeUrl()}/game`, {
    transports: ['websocket'],
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
  });

  return socket;
}

export function getGameSocket(): Socket | null {
  return socket;
}

export function disconnectGameSocket() {
  if (socket) {
    socket.disconnect();
  }
  socket = null;
  socketToken = null;
}
