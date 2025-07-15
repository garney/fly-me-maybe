import Phaser from 'phaser';
import RocketScene from './RocketScene';

export default class Game {
    constructor(socket) {
        this.config = {
            type: Phaser.AUTO,
            parent: 'game-container',
            width: 800,
            height: 600,
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 },
                    debug: false
                }
            },
            scene: []
        };

        this.game = new Phaser.Game(this.config);
        this.socket = socket;

        // Add scene with socket
        this.game.scene.add('RocketScene', RocketScene, true, { socket });
    }
} 