const fs = require('fs').promises;
const path = require('path');

class PlayerStore {
    constructor() {
        this.storePath = path.join(__dirname, '../data/players.json');
        this.players = {};
        this.ensureStoreExists();
    }

    async ensureStoreExists() {
        try {
            await fs.access(path.dirname(this.storePath));
        } catch (error) {
            console.error('Error ensuring store exists:', error);
            await fs.mkdir(path.dirname(this.storePath));
        }

        try {
            await fs.access(this.storePath);
            const data = await fs.readFile(this.storePath, 'utf8');
            this.players = JSON.parse(data);
        } catch (error) {
            console.error('Error reading player store:', error);
            this.players = {};
            await this.save();
        }
    }

    async save() {
        await fs.writeFile(this.storePath, JSON.stringify(this.players, null, 2));
    }

    async getPlayer(id) {
        await this.ensureStoreExists();
        return this.players[id] || null;
    }

    async createPlayer(id, name) {
        await this.ensureStoreExists();
        if (!this.players[id]) {
            this.players[id] = {
                id,
                name,
                credits: 10000,
                created: Date.now()
            };
            await this.save();
        }
        return this.players[id];
    }

    async updatePlayer(id, data) {
        await this.ensureStoreExists();
        if (this.players[id]) {
            this.players[id] = { ...this.players[id], ...data };
            await this.save();
        }
        return this.players[id];
    }

    async getAllPlayers() {
        await this.ensureStoreExists();
        return Object.values(this.players);
    }
}

module.exports = new PlayerStore(); 