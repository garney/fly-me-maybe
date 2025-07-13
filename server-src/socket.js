
import shortId from 'shortid';
export default class Socket {
  constructor(socket) {
    this.socket = socket;
    // console.log('connection established');
    console.log(socket.id, 'CONNECTED')
    socket.emit(`connected`, shortId.generate());
    this.setup();
    
  }

  roll = (num) => {
      console.log('roll');
      const dice = [];
      for(let i = 0; i < num; i++) {
        dice.push(Math.ceil(Math.random()*6))
      }
      console.log('rolled', dice)
      this.socket.emit('rolled', dice)
  }
  setup = () => {
    console.log('setup');
    this.socket.on('disconnect', this.onDisconnect);
    this.socket.on('reconnect', this.onReconnect);

    //
    this.socket.on('roll', this.roll)
  }
  destroy = () => {
    console.log('destroy');
    this.socket.off('disconnect', this.onDisconnect);
    this.socket.off('reconnect', this.onReconnect);
    this.socket.off('roll', this.roll);
  }

  onDisconnect = () => {
    console.log('disconnect');
    this.destroy();
  }
  onReconnect = () => {
    console.log('reconnect');
    this.setup();
  }

  static init(server) {

    const io = require('socket.io')(server);
    Socket.io = io;
    io.on('connection', (socket) => {
      new Socket(socket);
    });
    return io;
  }

}
