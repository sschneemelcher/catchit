import {connect, disconnect, broadcastMove, getReady, me, drawBoardTable, checkBoardTable} from './peer';
import './style.css';

function clickConnect() {
        let id: HTMLInputElement = <HTMLInputElement> document.getElementById('connectInp');
        let connectBtn: HTMLInputElement = <HTMLInputElement> document.getElementById('connectBtn');
        connectBtn.disabled = true;
        if (id.value != '') 
            connect(id.value)
        setTimeout(_ => connectBtn.disabled = false, 1000);
}

document.getElementById('connectBtn').addEventListener('click', clickConnect);
document.getElementById('disconnectBtn').addEventListener('click', disconnect);

const canvas: HTMLCanvasElement = <HTMLCanvasElement> document.getElementById('game');
export const ctx = canvas.getContext('2d');
export let boardWidth = canvas.width;
export let boardHeight = canvas.height;
export let stepSize = 5;

console.log(boardWidth);

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


export function createColor() {
    let color = '#';
    let budget = 400;
    for (let i = 0; i < 3; i++) {
        let c = Math.max(rand(Math.min(budget, 255)), 16);
        color += c.toString(16);
        budget -= c;
    }
    console.log(color);
    return color;
}

function changeColor() {
    me.color = createColor();
    drawBoardTable();
}
document.getElementById('colorBtn').addEventListener('click', changeColor);
document.getElementById('readyBtn').addEventListener('click', getReady);


function makeMove(x: number, y: number) {
    if (me.x + x >= 0 && me.x + x < boardWidth) {
        me.x += x;
    }
    if (me.y + y >= 0 && me.y + y < boardHeight) {
        me.y += y;
    }
    broadcastMove();
}

function logkey(e: KeyboardEvent) {
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
    checkBoardTable();
    drawBoardTable();
}

document.addEventListener('keydown', logkey);
