require('babel-register');
import Socket from './server-src/socket';
import Routes from './server-src/routes';
import configuration from './configuration';
const express = require('express');

const PORT = process.env.PORT || configuration.PORT;
const app = express();
const server = require('http').createServer(app);

server.listen(PORT);

Routes.init(app);
Socket.init(server);