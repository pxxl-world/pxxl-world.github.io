import io from 'socket.io-client'

let backend_url = (window.location.hostname === 'localhost')?`http://localhost:5000`:"https://zmanifold.com"

console.log(backend_url);


const app = document.querySelector<HTMLDivElement>('#app')!

const codebutton = document.createElement('button')
codebutton.innerText = 'Show Code'
app.appendChild(codebutton)



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



codebutton.onclick = () => {
  showcode = !showcode
  if(!showcode){
    codeeditor.remove()
    app.appendChild(canvas);
    load_script(userscript)

  } else {
    events.forEach((_, type) => events.set(type, []))
    canvas.remove()
    app.appendChild(codeeditor)
  }
}

addEventListener('keydown', e => {
  if(e.key === 'Escape') codebutton.click()
}
)

const world_size = 100
const block_size = canvas.width / world_size


function draw_block(x:number, y:number, color:string){
  
  ctx.fillStyle = color
  ctx.fillRect(x * block_size, y * block_size, block_size, block_size)
}


type Player = {
  position: {x:number, y:number},
  energy: number,
  id: number
}

let player:Player = {position:{x:0, y:0}, energy:0, id:0};
let world: (string|null)[][] = Array.from({length: world_size}, () => Array.from({length: world_size}, () => 'red'))

const state = {player, world}

// function energy_color(energy:number){
//   if (energy < 0) throw new Error('energy should be positive')
//   if (energy > 100) throw new Error('energy should be less than 100')
//   // color between red and white depending on energy
//   return 
// }

function show_world(){
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  state.world.forEach((row, x) => row.forEach((color, y) => {
    if(color !== null){
      if (state.player.position.x === x && state.player.position.y === y){
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

fetch(`${backend_url}/new_player`).then(res => res.json()).then(data => {
  player = data;
  state.player = player
  load_script(userscript)
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


// @ts-ignore
async function action(params:ActionParams, player = state.player){
  return await fetch(`${backend_url}/action`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id: player.id, ...params})
  }).then(async resp=>{
    if (resp.status !== 200) return null
    const res = await resp.json() as Player
    if (res.id == state.player.id) state.player = res
    return res
  })
}
