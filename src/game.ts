import {Player} from './index';
import {sendCatch} from './peer';


let checkedX = -1;
let checkedY = -1

function hashCode(str: string) {
    var hash = 0, i = 0, len = str.length;
    while ( i < len ) {
        hash  = ((hash << 5) - hash + str.charCodeAt(i++)) << 0;
    }
    return hash;
}

function hashcode(str: string) {
    return hashCode(str) + 2147483647 + 1;
}


export function checkBoard(players: Array<Player>) {
    let me = players[0];
    if (me.x != checkedX || me.y != checkedY) {
        checkedX = me.x;
        checkedY = me.y;
        if (me.catcher) {
            for (let i = 1; i < players.length; i++) {
                if (players[i].x == me.x && players[i].y == me.y) {
                    me.catcher = false;
                    players[i].catcher = true;
                    sendCatch(players[i]);
                }
            }
        }
    }
}

export function checkReady(players: Array<Player>) {
    let ready = true;
    let sum = 0;
    players.forEach(player => {
        if (player.ready == 0)
            ready = false;
        else
            sum += player.ready;
    });
    if (ready) {
        let max = [0, -1];
        let i = 0;
        players.forEach(player => {
            player.catcher = false;
            let hc = hashcode(player.name) % sum;
            if (hc > max[0]) {
                max[0] = hc;
                max[1] = i;
                i++;
            }
        });
    players[max[1]].catcher = true;
    players.forEach(player => {
        player.ready = 0;
    });
    }
}
