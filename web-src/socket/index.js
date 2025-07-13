import io from 'socket.io-client';
class Socket {
    constructor(url) {
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
        this.connection.on('connected', (e) => {
            this.status = 'connected';
            this.id = e;
            this.dispatchEvent('connected', e);
            this.connected(e)
        })
    }

    connected(e) {
        console.log('connected');
        console.log(e);
    }
}

export default Socket;