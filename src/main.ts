// import io from 'socket.io-client'

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

const player = new Writable('player', {position:{x:0, y:0}, energy:0, id:"0"})

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
  console.log('script', script);
  
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
      }
    }
  }))
}

let websocket = new WebSocket(backend_url.replace('http', 'ws').replace('https', 'wss')+'/ws')
console.log('connecting to', websocket.url);

const action_queue = new Map<number, {resolve: (value: Player) => void, reject: (reason: string) => void}>()
let action_counter = 17


function reload_player(){
  console.log('reloading player');
  action({action: 'put', x: 0, y: 0, player_id : "44"}).then(newplayer=>{
    player.set(newplayer)
    load_script(active_script.value)
    
  }).catch(error => { 
    console.error('error', error);
  })
}

reloadbutton.onclick = reload_player
if (player.value.id === "0") reload_player()


type ActionParams = {
  player_id?:PlayerId,
  action_id?: number,
  action: 'put'| 'move'| 'delete' | 'info',
  x: number,
  y: number,
  endx?: number,
  endy?: number,
  color?: string,
  energy?: number
}
type PlayerId = string

type Player = {
  position: {
    x: number,
    y: number
  },
  energy: number,
  id: PlayerId
}


function sanitize_action_params(params:ActionParams){
  if (typeof params.player_id !== 'string') throw new Error('player_id must be a string')
  if (params.action_id === undefined) params.action_id = action_counter ++
  return params
}

function action(params:ActionParams, actor = player.value):Promise<Player>{

  if (params.player_id === undefined) params.player_id = actor.id
  const action_id = action_counter ++
  params.action_id = action_id

  params = sanitize_action_params(params)
  
  return new Promise<Player>((resolve, reject) => {
    action_queue.set(action_id, {resolve, reject})
    try{
      websocket.send(JSON.stringify(params)) 
    }catch(e){
      websocket.close()
      console.error('error', e);
      websocket = new WebSocket(backend_url.replace('http', 'ws').replace('https', 'wss')+'/ws')
      action_queue.clear()
    }
    if (params.action === 'put' && params.energy){
      action({action:'info', x: 0, y:0, }, actor)
    }
  })
}


type ServerMessage = {
  message_type: 'world_update',
  content:{blocks: (string|null)[][]}
} | {
  message_type: 'action_response',

  content: Player,
  error: string|null,
  action_id: number
}



setInterval(() => {
  if (player.value.energy < 100)player.set({...player.value, energy: Math.min(player.value.energy + 100/20, 100)})
}, 1000/20);

 
websocket.onmessage = (event) => {
  let data: ServerMessage
  try{
    data = JSON.parse(event.data) as ServerMessage
  }catch(e){
    console.error("error parsing", event.data);
    return
  }
  
  if (data.message_type === 'world_update'){
    state.world = data.content.blocks
    show_world()
  }else if (data.message_type === 'action_response'){
    let action_promise = action_queue.get(data.action_id)
    if (!action_promise) {
      console.error(data.error)
      console.error('action not found', data.action_id);
      return
    }
    if (data.content.id === player.value.id) {
      player.set(data.content)
    }
    if (data.error){
      action_promise.reject(data.error)
      console.log('action error', data.content);
    }else{
      action_promise.resolve(data.content)
    }
  }else{
    console.error('unknown message type', data);
  }
}

websocket.onopen = () => {
  try{
    const p = player.value.position
    action({action: 'move', x: p.x, y: p.y, endx: p.x, endy: p.y})
    .catch(error => {
      if (error === 'player not found') reload_player()
      if (error === 'block already exists') return
      console.error('error', error);
    })
    
  }catch (e){
    console.error('error', e);
    reload_player();
  }
  load_script(active_script.value)
}
