import {connect, disconnect, broadcastMove, getReady, me, incStepSize,
    decStepSize, stepSize, drawBoardTable, checkBoardTable, sendColor, sendPower} from './peer';
import './style.css';

function clickConnect() {
        let id: HTMLInputElement = <HTMLInputElement> document.getElementById('connectInp');
        let connectBtn: HTMLInputElement = <HTMLInputElement> document.getElementById('connectBtn');
        connectBtn.disabled = true;
        if (id.value != '') 
            connect(id.value)
        setTimeout(_ => connectBtn.disabled = false, 1000);
}

export let power = false;
document.getElementById('connectBtn').addEventListener('click', clickConnect);
document.getElementById('disconnectBtn').addEventListener('click', disconnect);

const canvas: HTMLCanvasElement = <HTMLCanvasElement> document.getElementById('game');
export const ctx = canvas.getContext('2d');
export let boardWidth = canvas.width;
export let boardHeight = canvas.height;

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
    return color;
}

function changeColor() {
    me.color = createColor();
    sendColor();
    drawBoardTable();
}
document.getElementById('colorBtn').addEventListener('click', changeColor);
document.getElementById('readyBtn').addEventListener('click', getReady);


function makeMove(x: number, y: number) {
    if (me.x + x >= -(stepSize / 2) && me.x + x < (boardWidth + stepSize / 2)) {
        me.x += x;
        me.x = Math.max(0, Math.min(me.x, boardWidth - stepSize));
    }
    if (me.y + y >= -(stepSize / 2) && me.y + y < (boardHeight + stepSize / 2)) {
        me.y += y;
        me.y = Math.max(0, Math.min(me.y, boardHeight - stepSize));
    }
    broadcastMove();
}

let speed = 1;
let keyList = new Set<string>;
function keyUP(e:KeyboardEvent) {
    keyList.delete(e.key);
}

function logkey(e: KeyboardEvent) {
    keyList.add(e.key as string);
}

export function move() {
    keyList.forEach(key => {
        switch (key) {
            case 'w':
            case 'ArrowUp':
                makeMove(0, -(stepSize / 2) * speed);
                break;
            case 'a':
            case 'ArrowLeft':
                makeMove(-(stepSize / 2) * speed, 0);
                break;
            case 's':
            case 'ArrowDown':
                makeMove(0, (stepSize / 2) * speed);
                break;
            case 'd':
            case 'ArrowRight':
                makeMove((stepSize / 2) * speed, 0);
                break;
            case 'e':
                if (me.points == 100) {
                    var int = setInterval(_ => {
                        me.points -= 1; 
                        if (me.points <= 0) {
                            clearInterval(int);
                            power = false;
                            speed = 1;
                            decStepSize();
                        }
                    }, 50);;
                    if (me.catcher) {
                        incStepSize();
                    } else {
                        speed = 2;
                    }
                    power = true;
                    sendPower();
                }
            default:
                break;
        }
    });
    checkBoardTable();
    drawBoardTable();
}


document.addEventListener('keypress', logkey);
document.addEventListener('keyup', keyUP);
