import React, { useEffect, useState, useRef } from 'react';
import Config from './config';
import Game from './game';

import './app.scss';

function App({socket}) {
    const [connectionDetails, setConnectionDetails] = useState({});
    // const [players, setPlayers] = useState([]);
    // const [player, setPlayer] = useState({});
    const game = useRef(null);

    useEffect(() => {
        if(socket) {
            setConnectionDetails({
                status: socket.status
            });

            // Listen for player updates
            // socket.on('players', (updatedPlayers) => {
            //     setPlayers(updatedPlayers);
            // });
            // socket.on('playerUpdate', (player) => {
            //     console.log('player', player)
            //     // setPlayer(player);
            // });

            if (!game.current) {
                game.current = new Game(socket);
            }
        }
    }, [socket]);

    return (
        <div className="app">
            {/* <div className="connection-info">
                <span className="status">{connectionDetails.status}</span>
                {window.config && window.config.playerName && (
                    <span className="player-name"> - Playing as <strong>{player.playerName}</strong></span>
                )}
            </div>
            <div className="player-info">
                <h3>Your Profile</h3>
                <div>Name: <strong>{player.name}</strong></div>
                <div>Credits: <span className="credits">{player.credits}</span></div>
            </div>
            
            <div className="players-list">
                <h3>Players Online ({players.length})</h3>
                {players.map(player => (
                    <div key={player.id} className="player-item">
                        {player.name}
                    </div>
                ))}
            </div> */}
            
            <div id="game-container"></div>
        </div>
    )
}

module.exports = App;