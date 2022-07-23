import {DataConnection, Peer} from 'peerjs';
import {Player, rand, createColor} from './index';
import {drawBoard} from './draw';
import {checkBoard, checkReady} from './game';

const canvas: HTMLCanvasElement = <HTMLCanvasElement> document.getElementById('game');
let peer = new Peer();

type Table = {
    [id: string]: [conn: DataConnection, player: Player],
}

let table: Table = {};

//let conns = new Array<DataConnection>;

type message = {
    type: string;
    payload: unknown;
}

export function sendCatch(player: Player) {
    for (let id in table) {
        if (id != myID) {
            table[id][0].send(`{"type": "gotcha", "payload": ${JSON.stringify(player)}}`);
        }
    }
}

export function broadcastMove() {
    for (let id in table) {
        if (id != myID) {
            table[id][0].send(`{"type": "position", "payload": ${JSON.stringify(table[myID][1])}}`);
        }
    }
    drawBoardTable();
}

export function getReady() {
    table[myID][1].ready = rand(200) + 1;
    for (let id in table) {
        if (id != myID) {
            table[id][0].send(`{"type": "ready", "payload": ${JSON.stringify(table[myID][1])}}`);
        }
    }
    drawBoardTable();
}

export function drawBoardTable() {
    let players: Array<Player> = [];
    for (let id in table) {
        players.push(table[id][1]);
    }
    checkReady(players);
    drawBoard(players);
}

export function checkBoardTable() {
    let players: Array<Player> = [];
    for (let id in table) {
        players.push(table[id][1]);
    }
    checkBoard(players);
}

let boardWidth = canvas.width;
let boardHeight = canvas.height;
let stepSize = 5;

let myX = rand(boardWidth);
myX = myX - (myX % stepSize);
let myY = rand(boardHeight);
myY = myY - (myY % stepSize);

export let me = ({name: localStorage['username'], x: myX, y: myY, color: createColor(), 
                    points: 0, catcher: false, ready: 0});

console.log(me);

let myID = '';
peer.on('open', function(id) {
	console.log('My peer ID is: ' + id);
    myID = id;
    table[myID] = [undefined, undefined];
    table[myID][1] = me;
    drawBoardTable();
    document.getElementById('peerID').innerText += ' ' + id;
    peer.on('connection', function(conn) {
        table[conn.peer] = [undefined, undefined];
        table[conn.peer][0] = conn;
        setupConnection(conn);
    });
});


function handleMessage(peerID:string, msg_str: string) {
    console.log(msg_str);
    let msg: message = JSON.parse(msg_str);
    switch (msg.type) {
        case 'name':
            let newPlayer: Player = msg.payload as Player;
            table[peerID][1] = newPlayer;
            break;
        case 'position':
        case 'ready':
            let updatedPlayer: Player = msg.payload as Player;
            for (let id in table) {
                if (id != myID) {
                    if (table[id][1].name == updatedPlayer.name) {
                        table[id][1] = updatedPlayer;
                    }
                }
            }
            break;
        case 'connections':
            let otherConns: Array<string> = msg.payload as Array<string>;
            otherConns.forEach(conn => {
                if (table[conn] == undefined)
                    connect(conn);
            });
            break;
        case 'gotcha':
            let caughtPlayer: Player = msg.payload as Player;
            for (let id in table) {
                if (id != myID) {
                    if (table[id][1].name == caughtPlayer.name) {
                        table[id][1].catcher = true;
                    } else {
                        table[id][1].catcher = false;
                    }
                }
            }
        default:
            console.log('unknown message type');
            break;
    }
    if (table[myID][1].catcher)
        checkBoardTable();
    drawBoardTable();
}

function setupConnection(conn: DataConnection) {
        conn.on('data', function(data: string){
            handleMessage(conn.peer, data);
        });
        setTimeout(function() {
            conn.send(`{"type": "name", "payload": ${JSON.stringify(table[myID][1])}}`);
            let ids = new Array<string>;
            for (let id in table) {
                ids.push(id);
            }
            conn.send(`{"type": "connections", "payload": ${JSON.stringify(ids)}}`);
        }, 500);
}
export function connect(peerID: string) {
    table[peerID] = [undefined, undefined];
    if (peerID != '') {
        table[peerID][0] = peer.connect(peerID);
        table[peerID][0].on('open', function() {
            setupConnection(table[peerID][0]);
        });
    }
}

