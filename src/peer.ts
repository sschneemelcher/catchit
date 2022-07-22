import {DataConnection, Peer} from 'peerjs';
import {Player, players, rand} from './index';
import {drawBoard} from './draw';
import {checkBoard, checkReady} from './game';

let peer = new Peer();
let conns = new Array<DataConnection>;

type message = {
    type: string;
    payload: unknown;
}

export function sendCatch(player: Player) {
    conns.forEach(conn => {
        conn.send(`{"type": "gotcha", "payload": ${JSON.stringify(player)}}`);
    });
}

export function broadcastMove() {
    conns.forEach(conn => {
        conn.send(`{"type": "position", "payload": ${JSON.stringify(players[0])}}`);
    });
}

export function getReady() {
    players[0].ready = rand(200) + 1;
    conns.forEach(conn => {
        conn.send(`{"type": "ready", "payload": ${JSON.stringify(players[0])}}`);
    });
    checkReady();
    drawBoard(players);
}

let myID = '';
peer.on('open', function(id) {
	console.log('My peer ID is: ' + id);
    myID = id;
    document.getElementById('peerID').innerText += ' ' + id;
    peer.on('connection', function(conn) {
        conns.push(conn);
        setupConnection(conn);
    });
});

function handleMessage(msg_str: string) {
    console.log(msg_str);
    let msg: message = JSON.parse(msg_str);
    switch (msg.type) {
        case 'name':
            let newPlayer: Player = msg.payload as Player;
            players.push(newPlayer);
            break;
        case 'position':
        case 'ready':
            let updatedPlayer: Player = msg.payload as Player;
            for (let i = 0; i < players.length; i++) {
                if (players[i].name == updatedPlayer.name) {
                    players[i] = updatedPlayer;
                }
            }
            break;
        case 'connections':
            let myConns = new Set<string>;
            myConns.add(myID);
            conns.forEach(conn => myConns.add(conn.peer));
            let otherConns: Array<string> = msg.payload as Array<string>;
            otherConns.forEach(conn => {
                if (!myConns.has(conn))
                    connect(conn);
            });
            break;
        case 'gotcha':
            let caughtPlayer: Player = msg.payload as Player;
            for (let i = 0; i < players.length; i++) {
                if (players[i].name == caughtPlayer.name) {
                    players[i].catcher = true;
                } else {
                    players[i].catcher = false;
                }
            }


        default:
            console.log('unknown message type');
            break;
    }
    if (players[0].catcher)
        checkBoard();
    checkReady();
    drawBoard(players);

}

function setupConnection(conn: DataConnection) {
        conn.on('data', function(data: string){
            //console.log(data);
            handleMessage(data);
            console.log(conns[conns.length - 1].peer);
        });
        setTimeout(function() {
            conn.send(`{"type": "name", "payload": ${JSON.stringify(players[0])}}`);
            let ids = new Array<string>;
            conns.forEach(conn => ids.push(conn.peer));
            conn.send(`{"type": "connections", "payload": ${JSON.stringify(ids)}}`);
        }, 500);
}
export function connect(peerID: string) {
    if (peerID != '') {
        conns.push(peer.connect(peerID));
        conns[conns.length - 1].on('open', function() {
            setupConnection(conns[conns.length - 1]);
        });
    }
}

