// Transpile all code following this line with babel and use 'env' (aka ES6) preset.
require('babel-register')({
  "presets": ["es2015", "stage-1"],
  "plugins": ["transform-runtime"]
});

// Import the rest of our application.
module.exports = require('./server.js');
