import io from 'socket.io-client';

class Socket {
    constructor(url) {
    // debugger;
        this.connection = io(url);
        this.defineListeners();
        this.listeners = {};
    }

    on(event, callback) {
        const eventHandlers = this.listeners[event] || [];
        eventHandlers.push(callback);
        this.listeners[event] = eventHandlers;
    }

    dispatchEvent(event, ...params) {
        const self = this;
        return new Promise(() => {
            const eventHandlers = this.listeners[event] || [];
            eventHandlers.forEach(callback => {
                callback.apply(null, params);
            })
        })
    }

    defineListeners() {
        // Listen for initial connection
        this.connection.on('connectionSetup', () => {
            this.status = 'connected';
            
            // Initialize player with data from config
            console.log('window.config:', window.config);
            if (window.config && window.config.playerId) {
                this.connection.emit('initializePlayer', {
                    playerId: window.config.playerId
                });
            }
        });

        // Listen for player updates
        this.connection.on('players', (players) => {
            this.dispatchEvent('players', players);
        });
    }
}

export default Socket;