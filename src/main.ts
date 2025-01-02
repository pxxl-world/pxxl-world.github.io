import io from 'socket.io-client'


const host = window.location.hostname
const backend_url = `http://${host}:5000`
console.log(backend_url);

const app = document.querySelector<HTMLDivElement>('#app')!


const canvas = document.createElement('canvas')
canvas.width = Math.min(window.innerWidth,window.innerHeight)
canvas.height = Math.min(window.innerWidth,window.innerHeight)
app.appendChild(canvas)
const ctx = canvas.getContext('2d')!


import {codeeditor, userscript} from './codeeditor'


let showcode = false
const addEventListener = document.addEventListener

let events = new Map<string, ((e:Event)=>{})[]>()

document.addEventListener = (type:string, listener:(e:any)=>{}) => {
  if (!events.has(type)) {
    events.set(type, [])
    addEventListener(type, e=>events.get(type)!.forEach(listener => listener(e)))
  }
  events.get(type)!.push(listener)
}

eval(userscript)


const codebutton = document.querySelector<HTMLButtonElement>('#codebutton')!
codebutton.onclick = () => {
  showcode = !showcode
  if(!showcode){
    codeeditor.remove()
    app.appendChild(canvas)

    eval(userscript)
  } else {
    events.forEach((_, type) => events.set(type, []))
    canvas.remove()
    app.appendChild(codeeditor)
  }

}

const world_size = 100
const block_size = canvas.width / world_size


function draw_block(x:number, y:number, color:string){
  
  ctx.fillStyle = color
  ctx.fillRect(x * block_size, y * block_size, block_size, block_size)
}

function show_world(world:(string|null)[][]){
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  world.forEach((row, x) => row.forEach((color, y) => {
    if(color !== null) draw_block(x, y, color)
  }))
}


const socket = io(backend_url)
socket.on('game_update', (data:{world:(string|null)[][]}) => {
  console.log(data);
  show_world(data.world)
})

let player = {position:{x:0, y:0}, energy:0, id:0};

fetch(`${backend_url}/new_player`).then(res => res.json()).then(data => {
  player = data
  console.log();
  
})

type ActionParams = {
  action: 'put',
  x: number,
  y: number,
  color: string
} | {
  action: 'move',
  startx: number,
  starty: number,
  endx: number,
  endy: number
} | {
  action: 'delete',
  x: number,
  y: number
}

async function action(params:ActionParams){
  player = await fetch(`${backend_url}/action`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id: player.id, ...params})
  }).then(res => res.json())
}


// @ts-ignore
async function walk(dx:number, dy:number){
  console.log('walk', dx,dy);
  
  const startx = player.position.x
  const starty = player.position.y
  const endx = startx + dx
  const endy = starty + dy
  action({action: 'move', startx, starty, endx, endy})
}

