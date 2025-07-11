import { Server } from 'socket.io';

interface PlayerMoveData {
  x: number;
  y: number;
  animation?: string;
}

declare global {
  var io: Server | undefined;
}

export async function GET(req: Request) {
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
          socket.broadcast.emit('playerMoved', {
            playerId: socket.id,
            ...data,
          });
        });

        socket.on('error', (error) => {
          console.error('Socket error:', error);
        });

        socket.on('disconnect', (reason) => {
          console.log('Client disconnected:', socket.id, 'Reason:', reason);
          // Notify other players about the disconnection
          socket.broadcast.emit('playerLeft', { playerId: socket.id });
        });
      });

      global.io.engine.on('connection_error', (err) => {
        console.error('Connection error:', err);
      });
    }

    // Get the upgrade header from the request
    const upgradeHeader = req.headers.get('upgrade') || '';

    if (upgradeHeader.toLowerCase() === 'websocket') {
      // Return a WebSocket upgrade response
      return new Response(null, {
        status: 101,
        headers: {
          'Upgrade': 'websocket',
          'Connection': 'Upgrade',
        }
      });
    }

    // For polling requests, return a standard response with CORS headers
    return new Response(null, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Cache-Control': 'no-store',
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const dynamicParams = true; 