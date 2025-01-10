import io from 'socket.io-client'

import { Writable } from './store'
import { active_script } from './scripting'

let backend_url = (window.location.hostname === 'localhost')?`http://localhost:5000`:"https://zmanifold.com"

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

const player = new Writable('player', {position:{x:0, y:0}, energy:0, id:0})

const addPermanentEventListener = document.addEventListener.bind(document);

const eventListeners: { type: string; listener: (e: Event) => void }[] = [];

let script_counter = 0;

document.addEventListener = function(type:string, listener:(e:Event)=>void) {
  console.log('adding event listener', type, script_counter);
  eventListeners.push({ type, listener });
  addPermanentEventListener(type, listener);
};

function clearEventListeners() {
  eventListeners.forEach(listenerInfo => {
    const { type, listener } = listenerInfo;
    console.log('removing event listener', type, script_counter);
    document.removeEventListener(type, listener);
  });
  eventListeners.length = 0;
}

function load_script(script:string) {
  clearEventListeners();
  script_counter++;
  console.log('loading script', script_counter);
  // eval(script)
  const customfn = new Function('action', 'state', script)
  customfn(action, state)
}


codebutton.onclick = () => {window.location.href = '/code'}

addPermanentEventListener('keyup', e => {
  if(e.key === 'Escape') codebutton.click()
})

const world_size = 100
const block_size = canvas.width / world_size


function draw_block(x:number, y:number, color:string){
  ctx.fillStyle = color
  ctx.fillRect(x * block_size, y * block_size, block_size, block_size)
}


let world: (string|null)[][] = Array.from({length: world_size}, () => Array.from({length: world_size}, () => 'red'))
const state = {player:player.value, world}

player.subscribe(player => {
  state.player = player
})

function show_world(){
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  state.world.forEach((row, x) => row.forEach((color, y) => {
    if(color !== null){
      draw_block(x, y, color)
      if (player.value.position.x === x && player.value.position.y === y){
        // draw_block(x, y, 'white')
      }
    }
  }))
}

const socket = io(backend_url)
socket.on('game_update', (data:{world:(string|null)[][]}) => {
  state.world = data.world
  show_world()
})
const action_queue = new Map<number, {resolve: (value: Player) => void, reject: (reason: string) => void}>()


active_script.subscribe(load_script)

async function reload_player(){
    socket.emit('new_player', (data:{position:{x:number, y:number}, energy:number, id:number}) => {
    player.set(data)
    load_script(active_script.value)
  })
}

reloadbutton.onclick = reload_player

console.log(JSON.stringify(player.value))
if (player.value.id === 0) reload_player()


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

type Player = {
  position: {
    x: number,
    y: number
  },
  energy: number,
  id: number
}

// @ts-ignore
function action(params:ActionParams, actor = player.value):Promise<Player|string>{
  const action_id = action_queue.size
  return new Promise<Player>((resolve, reject) => {
    action_queue.set(action_id, {resolve, reject})
    socket.emit('action', {action_id, params, id: actor.id})
  })
}

socket.on('action_response', (data: {action_id: number, res: [Player, string|null]}) => {
  
  const action = action_queue.get(data.action_id)
  if (action === undefined) return
  let [res, error] = data.res
  if (error){
    action.reject(error)
  }else{
    console.log(res);
    if (res.id === player.value.id){ player.set(res) }
    action.resolve(res)
  }
})
