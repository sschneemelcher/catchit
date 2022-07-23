import {DataConnection, Peer} from 'peerjs';
import {Player, rand, createColor, move} from './index';
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
    if (players.length > 1) {
        (document.getElementById('readyBtn') as HTMLButtonElement).disabled = false;
        (document.getElementById('disconnectBtn') as HTMLButtonElement).disabled = false;
    } else {
        (document.getElementById('readyBtn') as HTMLButtonElement).disabled = true;
        (document.getElementById('disconnectBtn') as HTMLButtonElement).disabled = true;
    }
}

type message = {
    t: string;
    p: unknown;
}

export function sendCatch(catchID: string) {
    for (let id in table) {
        if (id != myID) {
            table[id][0].send(`{"t": "gotcha", "p": "${catchID}"}`);
        }
    }
}

export function broadcastMove() {
    for (let id in table) {
        if (id != myID) {
            table[id][0].send(`{"t": "pos", "p": ${JSON.stringify([table[myID][1].x, table[myID][1].y])}}`);
        }
    }
    drawBoardTable();
}

export function getReady() {
    table[myID][1].ready = rand(200) + 1;
    for (let id in table) {
        if (id != myID) {
            table[id][0].send(`{"t": "ready", "p": ${table[myID][1].ready}}`);
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
export let stepSize = 6;

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
    setInterval(_ => move(), 25);
    setInterval(_ => {
        table[myID][1].points = Math.min(table[myID][1].points + 1, 100);
    }, 100);
    peer.on('connection', function(conn) {
        table[conn.peer] = [undefined, undefined];
        table[conn.peer][0] = conn;
        setupConnection(conn);
    });
});


function handleMessage(peerID:string, msg_str: string) {
    let msg: message = JSON.parse(msg_str);
    switch (msg.t) {
        case 'name':
            let newPlayer: Player = msg.p as Player;
            table[peerID][1] = newPlayer;
            createPlayers();
            break;
        case 'pos':
            let arr = msg.p as Array<number>;
            table[peerID][1].x = arr[0];
            table[peerID][1].y = arr[1];
            createPlayers();
            break;
        case 'ready':
            table[peerID][1].ready = msg.p as number;
            createPlayers();
            checkReady(players);
            break;
        case 'conns':
            let otherConns: Array<string> = msg.p as Array<string>;
            otherConns.forEach(conn => {
                if (table[conn] == undefined)
                    connect(conn);
            });
            break;
        case 'gotcha':
            table[peerID][1].catcher = false;
            table[msg.p as string][1].catcher = true;
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
        let count = 0
        let int = setInterval(function() {
            conn.send(`{"t": "name", "p": ${JSON.stringify(table[myID][1])}}`);
            let ids = new Array<string>;
            for (let id in table) {
                ids.push(id);
            }
            conn.send(`{"t": "conns", "p": ${JSON.stringify(ids)}}`);
            if (count > 9) {
                clearInterval(int); 
            }
            count += 1;
        }, 200);
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
