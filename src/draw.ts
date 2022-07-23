import {ctx, Player, boardWidth, boardHeight} from './index';
import {stepSize} from './peer';


function refreshList(players: Array<Player>) {
    const list = document.getElementById('playerList');
    list.innerHTML = '';
    players.forEach(player => {
        let newItem = document.createElement('li');
        newItem.innerText = player.name;
        document.getElementById('powerUp').innerText = `POWERUP: ${player.points}%`
        if (player.ready > 0) {
            newItem.innerText += '(Ready)';
        }
        if (player.catcher) {
            newItem.innerText += '(Catcher)';
            newItem.style.color = '#FF9090';
        } else {
            newItem.style.color = player.color;
        }
        list.appendChild(newItem);
    });
}

function drawPlayer(x: number, y: number, color: string) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, stepSize, stepSize);
}

export function drawBoard(players: Array<Player>) {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, boardWidth, boardHeight);
    for (let i = players.length - 1; i >= 0; i--){
        if (players[i].catcher)
            drawPlayer(players[i].x, players[i].y, '#FF9090');
        else 
            drawPlayer(players[i].x, players[i].y, players[i].color);
    }
    refreshList(players);
}

