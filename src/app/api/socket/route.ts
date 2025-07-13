import { Server } from 'socket.io';

interface PlayerMoveData {
  x: number;
  y: number;
  animation?: string;
}

declare global {
  var io: Server | undefined;
}

export async function GET() {
  try {
    if (!global.io) {
      console.log('*First use, starting socket.io');
      global.io = new Server({
        cors: {
          origin: '*',
          methods: ['GET', 'POST'],
          credentials: false,
        },
        addTrailingSlash: false,
        path: '/api/socket',
        transports: ['polling', 'websocket'],
        allowEIO3: true,
        connectTimeout: 45000,
      });

      global.io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('playerMove', (data: PlayerMoveData) => {
          // Broadcast the move to all other players
          socket.broadcast.emit('playerMoved', { ...data, id: socket.id });
        });

        socket.on('disconnect', () => {
          console.log('Client disconnected:', socket.id);
          // Notify other players about the disconnection
          socket.broadcast.emit('playerLeft', { id: socket.id });
        });
      });
    }

    // Return a simple 200 OK response for polling requests
    return new Response('ok', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-store',
      },
    });

  } catch (error) {
    console.error('Socket.IO request error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const dynamicParams = true; 