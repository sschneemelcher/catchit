import {DataConnection, Peer} from 'peerjs';
import {Player, rand, createColor} from './index';
import {drawBoard} from './draw';
import {checkBoard, checkReady} from './game';

const canvas: HTMLCanvasElement = <HTMLCanvasElement> document.getElementById('game');
let peer = new Peer();

export type Table = {
    [id: string]: [conn: DataConnection, player: Player],
}

let table: Table = {};
let players: Array<Player> = [];

function createPlayers() {
    players = [];
    for (let id in table) {
        if (table[id] != undefined) {
            players.push(table[id][1]);
        }
    }
}

type message = {
    type: string;
    payload: unknown;
}

export function sendCatch(catchID: string) {
    for (let id in table) {
        if (id != myID) {
            table[id][0].send(`{"type": "gotcha", "payload": "${catchID}"}`);
        }
    }
}

export function broadcastMove() {
    for (let id in table) {
        if (id != myID) {
            table[id][0].send(`{"type": "position", "payload": ${JSON.stringify([table[myID][1].x, table[myID][1].y])}}`);
        }
    }
    drawBoardTable();
}

export function getReady() {
    table[myID][1].ready = rand(200) + 1;
    for (let id in table) {
        if (id != myID) {
            table[id][0].send(`{"type": "ready", "payload": ${table[myID][1].ready}}`);
        }
    }
    checkReady(players);
    drawBoardTable();
}

export function drawBoardTable() {
    drawBoard(players);
}

export function checkBoardTable() {
    let players: Array<Player> = [];
    for (let id in table) {
        players.push(table[id][1]);
    }
    checkBoard(table);
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

export let myID = '';
peer.on('open', function(id) {
	console.log('My peer ID is: ' + id);
    myID = id;
    table[myID] = [undefined, undefined];
    table[myID][1] = me;
    createPlayers();
    drawBoardTable();
    document.getElementById('peerID').innerText += ' ' + id;
    peer.on('connection', function(conn) {
        table[conn.peer] = [undefined, undefined];
        table[conn.peer][0] = conn;
        setupConnection(conn);
    });
});


function handleMessage(peerID:string, msg_str: string) {
    let msg: message = JSON.parse(msg_str);
    switch (msg.type) {
        case 'name':
            let newPlayer: Player = msg.payload as Player;
            table[peerID][1] = newPlayer;
            createPlayers();
            break;
        case 'position':
            let arr = msg.payload as Array<number>;
            table[peerID][1].x = arr[0];
            table[peerID][1].y = arr[1];
            createPlayers();
            break;
        case 'ready':
            table[peerID][1].ready = msg.payload as number;
            createPlayers();
            checkReady(players);
            break;
        case 'connections':
            let otherConns: Array<string> = msg.payload as Array<string>;
            otherConns.forEach(conn => {
                if (table[conn] == undefined)
                    connect(conn);
            });
            break;
        case 'gotcha':
            table[peerID][1].catcher = false;
            table[msg.payload as string][1].catcher = true;
            createPlayers();
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
        conn.on('close', function() {
            delete table[conn.peer];
            createPlayers();
            drawBoardTable();
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

export function disconnect() {
    for (let id in table) {
        if (id != myID) {
            table[id][0].close();
            delete table[id];
        }
    }
    createPlayers();
    drawBoardTable();
}

