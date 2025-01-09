import io from 'socket.io-client'

let backend_url = (window.location.hostname === 'localhost')?`http://localhost:5000`:"https://zmanifold.com"

console.log(backend_url);


const app = document.querySelector<HTMLDivElement>('#app')!

function button(text:string){
  const button = document.createElement('button')
  button.innerText = text
  app.appendChild(button)
  return button
}

const codebutton = button('Show Code')
const reloadbutton = button('Reset Player')



const canvas = document.createElement('canvas')
canvas.width = Math.min(window.innerWidth,window.innerHeight)
canvas.height = Math.min(window.innerWidth,window.innerHeight)
app.appendChild(canvas)
const ctx = canvas.getContext('2d')!

import { active_script, player } from './store';

const addEventListener = document.addEventListener

let events = new Map<string, ((e:Event)=>{})[]>()

document.addEventListener = (type:string, listener:(e:any)=>{}) => {
  if (!events.has(type)) {
    events.set(type, [])
    addEventListener(type, e=>events.get(type)!.forEach(listener => listener(e)))
  }
  events.get(type)!.push(listener)
}

codebutton.onclick = () => {window.location.href = '/code'}

addEventListener('keyup', e => {
  if(e.key === 'Escape') codebutton.click()
}
)

const world_size = 100
const block_size = canvas.width / world_size


function draw_block(x:number, y:number, color:string){
  ctx.fillStyle = color
  ctx.fillRect(x * block_size, y * block_size, block_size, block_size)
}



let world: (string|null)[][] = Array.from({length: world_size}, () => Array.from({length: world_size}, () => 'red'))

const state = {player:player.value, world}

player.subscribe(player => state.player = player)


function show_world(){
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  state.world.forEach((row, x) => row.forEach((color, y) => {
    if(color !== null){
      if (player.value.position.x === x && player.value.position.y === y){
        draw_block(x, y, 'white')
      }else{
        draw_block(x, y, color)
      }
    }
  }))
}

const socket = io(backend_url)
socket.on('game_update', (data:{world:(string|null)[][]}) => {

  state.world = data.world
  show_world()
})

function load_script(script:string){
  (new Function('state', 'action', script))(state, action, world)
}


async function reload_player(){
  const res = await fetch(`${backend_url}/new_player`);
  const data = await res.json();
  player.set(data);
}

reloadbutton.onclick = reload_player

load_script(active_script.value);
if (player.value.id === 0) await reload_player()

console.log(player.value);


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


async function action(params:ActionParams, actor = player.value){
  return await fetch(`${backend_url}/action`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id: actor.id, ...params})
  }).then(async resp=>{
    if (resp.status !== 200) {
      console.log(await resp.text())
      return null
    }
    const res = await resp.json() as typeof player.value
    if (res.id == player.value.id) player.set(res)
    return res
  })
}
