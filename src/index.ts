import {drawBoard} from './draw';
import {connect, broadcastMove, getReady} from './peer';
import {checkBoard, checkReady} from './game';
import './style.css';

function clickConnect() {
        let id: HTMLInputElement = <HTMLInputElement> document.getElementById('connectInp');
        if (id.value != '') 
            connect(id.value)
}

document.getElementById('connectBtn').addEventListener('click', clickConnect);

const canvas: HTMLCanvasElement = <HTMLCanvasElement> document.getElementById('game');
export const ctx = canvas.getContext('2d');
export let boardWidth = canvas.width;
export let boardHeight = canvas.height;
export let stepSize = 5;

if (localStorage['username'] == undefined) {
    localStorage['username'] = prompt('Please enter a username');
}


export type Player = {
  name: string;
  x: number;
  y: number;
  color: string;
  points: number;
  catcher: boolean;
  ready: number;
};


export function rand(max: number) {
    return Math.round(Math.random() * max)
}

function setup() {
    let myColor = `#${rand(180).toString(16)}${rand(180).toString(16)}${rand(180).toString(16)}`
    let myX = rand(boardWidth / 4);
    myX = myX - (myX % stepSize);
    let myY = rand(boardWidth / 4);
    myY = myY - (myY % stepSize);
    players[0] = ({name: localStorage['username'], x: myX, y: myY, color: myColor, 
                    points: 0, catcher: false, ready: 0});
    drawBoard(players);
}

export let players = new Array<Player>;
setup();

function changeColor() {
    let myColor = `#${rand(180).toString(16)}${rand(180).toString(16)}${rand(180).toString(16)}`
    players[0].color = myColor;
    drawBoard(players);
}
document.getElementById('colorBtn').addEventListener('click', changeColor);
document.getElementById('readyBtn').addEventListener('click', getReady);

function makeMove(x: number, y: number) {
    if (players[0].x + x >= 0 && players[0].x + x < boardWidth) {
        players[0].x += x;
    }
    if (players[0].y + y >= 0 && players[0].y + y < boardHeight) {
        players[0].y += y;
    }
    if (players.length > 1) {
        broadcastMove();
    }
}

function logkey(e: KeyboardEvent) {
    console.log(e.key);
    switch (e.key) {
        case 'w':
        case 'ArrowUp':
            makeMove(0, -stepSize);
            break;
        case 'a':
        case 'ArrowLeft':
            makeMove(-stepSize, 0);
            break;
        case 's':
        case 'ArrowDown':
            makeMove(0, stepSize);
            break;
        case 'd':
        case 'ArrowRight':
            makeMove(stepSize, 0);
            break;
        default:
            break;
    }
    checkBoard();
    drawBoard(players);
}

document.addEventListener('keydown', logkey);
