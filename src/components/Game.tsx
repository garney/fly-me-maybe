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

          preload() {
            // No assets to preload
          }

          create() {
            this.initSocket();
            
            // Create current player
            this.currentPlayer = this.add.rectangle(400, 300, 50, 50, 0x00ff00);
            
            // Initialize cursor keys if input is available
            if (this.input && this.input.keyboard) {
              this.cursors = this.input.keyboard.createCursorKeys();
            }

            // Add current player to players map
            if (this.currentPlayer && this.socket) {
              this.players.set(this.socket.id || 'self', this.currentPlayer);
            }
          }

          private initSocket() {
            this.socket = io({
              path: '/api/socket',
              addTrailingSlash: false,
              reconnectionAttempts: 5,
              reconnectionDelay: 1000,
              timeout: 45000,
            });

            if (!this.socket) return;

            this.socket.on('connect', () => {
              console.log('Connected to server');
              this.reconnectAttempts = 0;
            });

            this.socket.on('playerMoved', (data: { id: string; x: number; y: number }) => {
              let player = this.players.get(data.id);
              if (!player) {
                player = this.add.rectangle(data.x, data.y, 50, 50, 0xff0000);
                this.players.set(data.id, player);
              }
              player.setPosition(data.x, data.y);
            });

            this.socket.on('playerLeft', (data: { id: string }) => {
              const player = this.players.get(data.id);
              if (player) {
                player.destroy();
                this.players.delete(data.id);
              }
            });

            this.socket.on('disconnect', (reason) => {
              console.log('Disconnected:', reason);
              if (reason === 'io server disconnect') {
                // Server initiated disconnect, try to reconnect
                this.socket?.connect();
              }
            });

            this.socket.on('connect_error', (error) => {
              console.error('Connection error:', error);
              this.reconnectAttempts++;
              if (this.reconnectAttempts >= 5) {
                console.error('Max reconnection attempts reached');
                this.socket?.disconnect();
              }
            });
          }

          update() {
            if (!this.currentPlayer || !this.cursors || !this.socket) return;

            let moved = false;
            const speed = 5;

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

            if (moved) {
              this.socket.emit('playerMove', {
                x: this.currentPlayer.x,
                y: this.currentPlayer.y,
              });
            }
          }
        }

        if (!gameInstanceRef.current && gameRef.current) {
          gameInstanceRef.current = new Phaser.Game({
            type: Phaser.AUTO,
            parent: gameRef.current,
            width: 800,
            height: 600,
            scene: MainScene,
            physics: {
              default: 'arcade',
              arcade: {
                gravity: { x: 0, y: 0 },
                debug: false,
              },
            },
          });
        }
      };

      initPhaser();
    }

    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
      }
    };
  }, []);

  return <div ref={gameRef} style={{ width: '800px', height: '600px' }} />;
} 