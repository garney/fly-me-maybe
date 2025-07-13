const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const express = require('express');
const shortId = require('shortid');
const queryParser = require('express-query-parser');
const configuration = require('../configuration');

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
      .get('/', Routes.loadIndex)
    ;
  }

  static loadIndex(req, res) {
    const cookies = req.cookies;
    const userId = cookies['user-cookie'] || shortId.generate();
    const userName =  req.query.name || req.query.userName || cookies['user-name'];
    res.cookie('user-cookie', userId);
    if(userName) {
      res.cookie('user-name', userName);
    }
    res.render('pages/index',
      {
        userId,
        socketPort: SOCKET_PORT,
        socketUrl: SOCKET_URL,
        userName: userName || `guest-${userId}`,
        userId
      });
  }

}

Routes.sessions = {};