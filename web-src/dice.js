import React, { useEffect, useState } from 'react';
import Config from './config';
import Socket from './socket/index';

import './app.scss';

import dice1 from './assets/dice/1.svg';
import dice2 from './assets/dice/2.svg';
import dice3 from './assets/dice/3.svg';
import dice4 from './assets/dice/4.svg';
import dice5 from './assets/dice/5.svg';
import dice6 from './assets/dice/6.svg';

function Dice({socket = {}}) {
    const [diceNumbers, setDiceNumbers] = useState([1]);
    const [diceCount, setDiceCount] = useState(1);

    useEffect(() => {
        if (socket.id) {
            socket.connection.on('rolled', (diceNumbers) => {
                setDiceNumbers(diceNumbers)
            });
        }
    }, [socket.id]);
    const dice = (num) => {
        let image;
        switch(num) {
            case(1):
                image = dice1;
                break;
            case(2):
                image = dice2;
                break;
            case(3):
                image = dice3;
                break;
            case(4):
                image = dice4;
                break;
            case(5):
                image = dice5;
                break;
            case(6):
                image = dice6;
                break;
        }
        return (
            <span className="dice">
                <img src={image}/>
            </span>
        )
    };

    return (
        <div>
            <h1>Dice</h1>
            <div>
                {
                    diceNumbers.map((num, idx) => (
                        <span key={`${idx}-${num}`}>{dice(num)}</span>
                    ))
                }
            </div>

               <div>
                   <input
                       placeholder="Number of dice"
                       defaultValue={diceCount}
                       onChange={e => {
                           const count = parseInt(e.currentTarget.value) || 1;
                           setDiceCount(count)
                   }}/>
                   <button onClick={() => {
                       socket.connection.emit('roll', diceCount);
                   }}>Roll</button>
               </div>

        </div>
    )
}

module.exports = Dice;