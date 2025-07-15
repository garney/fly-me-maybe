const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const express = require('express');
const shortId = require('shortid');
const queryParser = require('express-query-parser');
const configuration = require('../configuration');
const playerStore = require('./playerStore');

const SOCKET_PORT = configuration.PORT;
const SOCKET_URL = process.env.SOCKET_URL || configuration.SOCKET_URL;

export default class Routes {
  static init(app) {
    app
      .use(
        queryParser({
          parseNull: true,
          parseBoolean: true
        })
      )
      .use(bodyParser.urlencoded({ extended: false }))
      .use(bodyParser.json())
      .use(cookieParser())
      .use(express.static(path.join(__dirname, '../public')))
      .set('views', path.join(__dirname, './views'))
      .set('view engine', 'ejs')
      .get('/', Routes.checkLogin)
      .get('/game', Routes.loadGame)
      .post('/login', Routes.handleLogin)
    ;
  }

  static async checkLogin(req, res) {
    const playerId = req.cookies['player-id'];
    if (playerId) {
      const player = await playerStore.getPlayer(playerId);
      if (player) {
        return res.redirect('/game');
      }
    }
    res.render('pages/login');
  }

  static async handleLogin(req, res) {
    const { name } = req.body;
    if (!name || name.trim().length < 2) {
      return res.render('pages/login', { error: 'Please enter a valid name (at least 2 characters)' });
    }

    const playerId = shortId.generate();
    await playerStore.createPlayer(playerId, name.trim());
    
    res.cookie('player-id', playerId);
    res.redirect('/game');
  }

  static async loadGame(req, res) {
    const playerId = req.cookies['player-id'];
    if (!playerId) {
      return res.redirect('/');
    }

    const player = await playerStore.getPlayer(playerId);
    if (!player) {
      res.clearCookie('player-id');
      return res.redirect('/');
    }

    const players = await playerStore.getAllPlayers();
    
    res.render('pages/index', {
      socketPort: SOCKET_PORT,
      socketUrl: SOCKET_URL,
      player,
      players: players.map(p => ({ id: p.id, name: p.name }))
    });
  }
}