'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Game as PhaserGame, Types } from 'phaser';

export default function Game() {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<PhaserGame | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initPhaser = async () => {
        const Phaser = await import('phaser');
        
        class MainScene extends Phaser.Scene {
          private players: Map<string, Phaser.GameObjects.Rectangle>;
          private socket: Socket | null;
          private currentPlayer: Phaser.GameObjects.Rectangle | null;
          private cursors: Types.Input.Keyboard.CursorKeys | null;
          private reconnectAttempts: number;

          constructor() {
            super({ key: 'MainScene' });
            this.players = new Map();
            this.socket = null;
            this.currentPlayer = null;
            this.cursors = null;
            this.reconnectAttempts = 0;
          }

          initSocket() {
            if (this.socket?.connected) return;

            const socket = io({
              path: '/api/socket',
              addTrailingSlash: false,
              autoConnect: true,
              reconnection: true,
              reconnectionAttempts: 10,
              reconnectionDelay: 2000,
              reconnectionDelayMax: 10000,
              randomizationFactor: 0.5,
              timeout: 45000,
              forceNew: true,
              withCredentials: false,
              transports: ['polling', 'websocket'],
            }) as Socket;

            this.socket = socket;

            socket.on('connect', () => {
              console.log('Connected to server');
              this.reconnectAttempts = 0;
              
              // Re-add current player position if reconnecting
              if (this.currentPlayer && this.socket) {
                this.socket.emit('playerMove', {
                  x: this.currentPlayer.x,
                  y: this.currentPlayer.y,
                });
              }
            });

            socket.on('connect_error', (error) => {
              console.error('Connection error:', error);
              this.reconnectAttempts++;
              
              if (this.reconnectAttempts >= 10) {
                console.error('Max reconnection attempts reached');
                socket.disconnect();
              }
            });

            socket.on('playerMoved', (data: { playerId: string; x: number; y: number }) => {
              const otherPlayer = this.players.get(data.playerId);
              if (otherPlayer) {
                otherPlayer.setPosition(data.x, data.y);
              } else {
                // Create new player if doesn't exist
                const newPlayer = this.add.rectangle(data.x, data.y, 50, 50, 0xff0000);
                this.players.set(data.playerId, newPlayer);
              }
            });

            socket.on('playerLeft', (data: { playerId: string }) => {
              const player = this.players.get(data.playerId);
              if (player) {
                player.destroy();
                this.players.delete(data.playerId);
              }
            });

            socket.on('disconnect', (reason) => {
              console.log('Disconnected:', reason);
              
              // Clear other players on disconnect
              this.players.forEach((player) => {
                if (player !== this.currentPlayer) {
                  player.destroy();
                }
              });
              this.players.clear();
              
              if (this.currentPlayer) {
                this.players.set('self', this.currentPlayer);
              }

              if (reason === 'io server disconnect' || reason === 'transport close') {
                // Server initiated disconnect or transport closed, try to reconnect
                setTimeout(() => {
                  if (this.reconnectAttempts < 10) {
                    console.log('Attempting to reconnect...');
                    socket.connect();
                  }
                }, 2000);
              }
            });

            socket.on('error', (error) => {
              console.error('Socket error:', error);
            });

            // Handle browser window focus/blur
            window.addEventListener('focus', () => {
              if (!socket.connected && this.reconnectAttempts < 10) {
                console.log('Window focused, attempting to reconnect...');
                socket.connect();
              }
            });
          }

          preload() {
            this.initSocket();
          }

          create() {
            // Create current player
            this.currentPlayer = this.add.rectangle(400, 300, 50, 50, 0x00ff00);
            this.cursors = this.input.keyboard.createCursorKeys();

            // Add current player to players map
            if (this.currentPlayer && this.socket) {
              this.players.set('self', this.currentPlayer);
              
              // Emit initial position
              this.socket.emit('playerMove', {
                x: this.currentPlayer.x,
                y: this.currentPlayer.y,
              });
            }
          }

          update() {
            if (!this.currentPlayer || !this.cursors || !this.socket?.connected) return;

            const speed = 5;
            let moved = false;

            if (this.cursors.left.isDown) {
              this.currentPlayer.x -= speed;
              moved = true;
            }
            if (this.cursors.right.isDown) {
              this.currentPlayer.x += speed;
              moved = true;
            }
            if (this.cursors.up.isDown) {
              this.currentPlayer.y -= speed;
              moved = true;
            }
            if (this.cursors.down.isDown) {
              this.currentPlayer.y += speed;
              moved = true;
            }

            if (moved && this.socket) {
              this.socket.emit('playerMove', {
                x: this.currentPlayer.x,
                y: this.currentPlayer.y,
              });
            }
          }
        }

        // Initialize Phaser game
        const config: Phaser.Types.Core.GameConfig = {
          type: Phaser.AUTO,
          parent: gameRef.current || undefined,
          width: 800,
          height: 600,
          physics: {
            default: 'arcade',
            arcade: {
              gravity: { x: 0, y: 0 },
              debug: false,
            },
          },
          scene: MainScene,
        };

        gameInstanceRef.current = new Phaser.Game(config);
      };

      initPhaser();
    }

    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
      }
    };
  }, []);

  return <div ref={gameRef} />;
} 