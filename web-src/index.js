import 'babel-polyfill';
import Socket from './socket/index';
import Config from './config';

import ReactDOM from 'react-dom';
import React from 'react';

import App from './app';

let rendered = false;

const init = (config) => {
    const socket = new Socket(`${window.location.protocol}//${window.location.host}`);

    if (!rendered) {
        rendered = true;
        ReactDOM.render(
            <App socket={socket} />,
            document.getElementById('root')
        );
    }
};

Config.getConfig().then(config => {
    init(config);
});

// Hot Module Replacement
if (module.hot) {
    module.hot.accept();
}
