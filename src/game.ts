import {Player} from './index';
import {sendCatch, Table, myID} from './peer';


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


export function checkBoard(table: Table) {
    let me = table[myID][1];
    if (me.x != checkedX || me.y != checkedY) {
        checkedX = me.x;
        checkedY = me.y;
        if (me.catcher) {
            for (let id in table) {
                if (id != myID) {
                    if (table[id][1].x == me.x && table[id][1].y == me.y) {
                        table[myID][1].catcher = false;
                        table[id][1].catcher = true;
                        sendCatch(id);
                    }
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
