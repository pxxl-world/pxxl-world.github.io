import { Writable } from './store'
import { active_script } from './scripting'
import { Action, ActionType, DbConnection, EventContext, GameAction, PutAction, ReducerEventContext, Tile } from './module_bindings';

// let backend_url = (window.location.hostname === 'localhost')?`http://localhost:5000`:"https://zmanifold.com"
let backend_url = (window.location.hostname.includes('zmanifold'))?"https://zmanifold.com":'http://'+window.location.hostname+':5000'
const app = document.querySelector<HTMLDivElement>('#app')!


let dbtoken = new Writable("dbtoken", "")


DbConnection.builder()
.withUri("ws://localhost:3000")
.withModuleName("pixel")
.withToken(dbtoken.value)
.onConnect((connect, id, token )=>{
  console.log("connected.");
  dbtoken.set(token)
  connect.reducers.spawn();
  connect.subscriptionBuilder()
  .onApplied(c=>{
    c.db.tile.onInsert(i => update_world(i))
    c.db.tile.onUpdate((u,o,n) => {
      let [x,y] = int2pos(o.pos);
      state.world[x][y] = null
      update_world(u)
    })
    c.db.tile.onDelete((d, old) => {
      let [x,y] = int2pos(old.pos);
      state.world[x][y] = null
      update_world(d)
    })
  })
  .onError(console.error)
  .subscribe(`SELECT * FROM tile`)

  connect.subscriptionBuilder()
  .onApplied(c=>{
    let player = c.db.person.conn.find(id)!
    let bod = c.db.tile.id.find(player.bodytile)!
    const move = () => {
      bod.pos += 1;
      send_action(
        {
          "player": bod.id,
          "pos": bod.pos,
          "typ": {"tag": "Move"}
        })
      .catch(e=>console.error(e))
      setTimeout(move, 1000/10)
    }
    setTimeout(move, 1000/10)

  })
  .onError(console.error)
  .subscribe(`SELECT * FROM person WHERE conn == '${id.toHexString()}'`)

  connect.reducers.onAction((e, a)=>{
    actionqueue.get(actionkey(a))?.(e)
  })

  let actionqueue = new Map<actionKey, (ctx: ReducerEventContext)=>void> ()

  type actionKey = `${number}:${number}:${string}`

  const actionkey = (g:GameAction):actionKey=>`${g.pos}:${g.player}:${g.typ.tag}`

  const send_action = (action:GameAction)=>{
    return new Promise<void>((resolve, reject)=>{

      actionqueue.set(actionkey(action), ctx=>{
        if (ctx.event.status.tag == "Committed"){
          resolve()
        }else{
          reject(ctx.event.status)
        }
        actionqueue.delete(actionkey(action))
      })
      connect.reducers.action(action)
    })
  }


})

.onConnectError(e=>console.error(e))
.build()


const update_world = (c:EventContext)=>{
  for (let tile of c.db.tile.iter()){
    let [x,y] = int2pos(tile.pos);
    state.world[x][y] = int2color(tile.color)
  }
  show_world()
}

const int2color = (k:number) =>{
  k = k >> 8
  let b = k & 255;
  k = k >> 8
  let g = k & 255;
  k = k >> 8
  let r = k & 255;
  return `rgb(${r}, ${g}, ${b})`
}

const int2pos = (k:number)=>{
  return [k%(world_size), Math.floor(k/(world_size))]
}

export function button(text:string){
  const button = document.createElement('button')
  button.innerText = text
  app.appendChild(button)
  return button
}


// let worldListeners = new Map<number, ((tile:Tile)=>void) []> ()




const codebutton = button('Show Code')
// const reloadbutton = button('Reset Player')
// export const docbutton = button('Documentation')
// docbutton.onclick = () => {
//     window.open('/docs/character_scripting.md', '_blank')
//     docbutton.onkeydown = e=> e.preventDefault()
// }

// app.appendChild(codebutton)
// app.appendChild(reloadbutton)
// app.appendChild(docbutton)

// const pingdisplay = document.createElement('span')
// const energydisplay = document.createElement('span')
// app.appendChild(pingdisplay)
// app.appendChild(energydisplay)

// pingdisplay.textContent = ' ping: 0ms'

const canvas = document.createElement('canvas')
const csize = Math.min(window.innerWidth,window.innerHeight)-codebutton.clientHeight-10
canvas.width = csize
canvas.height = csize
app.appendChild(canvas)
const ctx = canvas.getContext('2d')!
const player = new Writable('player', {position:{x:0, y:0}, energy:0, id:"0"})
const addPermanentEventListener = document.addEventListener.bind(document);
// const eventListeners: { type: string; listener: (e: Event) => void }[] = [];

// let script_counter = 0;

// document.addEventListener = function(type:string, listener:(e:Event)=>void) {
//   console.log('adding event listener', type, script_counter);
//   eventListeners.push({ type, listener });
//   addPermanentEventListener(type, listener);
// };

// function clearEventListeners() {
//   eventListeners.forEach(listenerInfo => {
//     const { type, listener } = listenerInfo;
//     console.log('removing event listener', type, script_counter);
//     document.removeEventListener(type, listener);
//   });

//   eventListeners.length = 0;
//   document.addEventListener("keydown", e=>{
//     if (e.key.startsWith("Arrow")) e.preventDefault()
//     console.log("press",e.key);
//     _keymap.set(e.key, true)
//   })
  
//   document.addEventListener("keyup", e=>{
//     _keymap.delete(e.key)
//   })
// }

// const _keymap = new Map<string, boolean>()


// const keypressed = (key:string) => _keymap.has(key)

// function load_script(script:string) {
//   const script_args = {
//     action,
//     state,
//     player: player.value,
//     keypressed,
//   }
//   clearEventListeners();
//   script_counter++;
//   // console.log('loading script', script_counter);
//   // console.log('script', script);
//   const customfn = new Function(...Object.keys(script_args), script)
//   customfn(...Object.values(script_args))
// }

codebutton.onclick = () => {window.location.href = '/code'}

addPermanentEventListener('keyup', e => {
  if(e.key === 'Escape') codebutton.click()
})

const world_size = 1<<7
const block_size = canvas.width / world_size


function draw_block(x:number, y:number, color:string){
  ctx.fillStyle = color
  ctx.fillRect(x * block_size, y * block_size, block_size, block_size)
}


let world: (string|null)[][] = Array.from({length: world_size}, () => Array.from({length: world_size}, () => null))
const state = {player:player.value, world}

// player.subscribe(player => {
//   state.player = player
// })

function show_world(){
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  state.world.forEach((row, x) => row.forEach((color, y) => {    
    if(color !== null)draw_block(x, y, color)
  }))
}

// let websocket = new WebSocket(backend_url.replace('http', 'ws').replace('https', 'wss')+'/ws')
// console.log('connecting to', websocket.url);

// const action_queue = new Map<number, {resolve: (value: Player) => void, reject: (value:Player, reason: string) => void, timestamp:number}>()
// let action_counter = 17


// function reload_player(){
//   console.log('reloading player');
//   action({action: 'put', x: 0, y: 0, player_id : "44"}).then(newplayer=>{
//     player.set(newplayer)
//     load_script(active_script.value)
    
//   }).catch(error => { 
//     console.error('error', error);
//   })
// }

// reloadbutton.onclick = ()=>{
//   reload_player()
//   reloadbutton.onkeydown = (e) => e.preventDefault();
// }
// if (player.value.id === "0") reload_player()


// type ActionType = 'put'| 'move'| 'delete' | 'info'

// type ActionParams = {
//   player_id?:PlayerId,
//   action_id?: number,
//   action: ActionType
//   x?: number,
//   y?: number,
//   endx?: number,
//   endy?: number,
//   color?: string,
//   energy?: number
// }
// type PlayerId = string

// type Player = {
//   position: {
//     x: number,
//     y: number
//   },
//   energy: number,
//   id: PlayerId
// }

// type ServerMessage = {
//   message_type: 'world_update',
//   content:{blocks: (string|null)[][]}
// } | {
//   message_type: 'action_response',
//   content: Player,
//   error: string|null,
//   action_id: number
// } | {
//   message_type: 'ack',
//   action_id:number,
// }

// setInterval(() => {
//   if (player.value.energy < 100) player.value.energy = Math.min(player.value.energy + 100/20, 100)
//   energydisplay.textContent = ' energy: ' + player.value.energy
// }, 1000/20);

// function action(params:ActionParams, actor:Player = player.value) :Promise<Player>{
//   if (params.player_id === undefined) params.player_id = actor.id
//   const action_id = action_counter ++
//   params.action_id = action_id

//   if (typeof params.player_id !== 'string') throw new Error('player_id must be a string')
//   if (params.action_id === undefined) params.action_id = action_counter ++

//   return new Promise<Player>((resolve, reject) => {
//     const pupdate = (p:Player)=>{
//       if (p.id == actor.id) {
//         actor.position = p.position
//         actor.energy = p.energy
//       }
//     }
//     action_queue.set(action_id, {resolve:(p:Player)=>{
//       pupdate(p)
//       resolve(p)
//     }, reject:
//     (p:Player, reason:string)=>{
//       pupdate(p)
//       reject(reason)
//     }, timestamp: Date.now()})
//     try{
//       websocket.send(JSON.stringify(params))
//       if (websocket.readyState !== websocket.OPEN) throw new Error('websocket not open')
//     }catch(e){
//       websocket.close()
//       console.error('error', e);
//       websocket = new WebSocket(backend_url.replace('http', 'ws').replace('https', 'wss')+'/ws')
//       action_queue.clear()
//     }
//     if (params.action === 'put' && params.energy) action({action: 'info'}, actor)
//   })
// }

// websocket.onmessage = (event) => {
//   let data: ServerMessage
//   try{
//     data = JSON.parse(event.data) as ServerMessage
//   }catch(e){
//     console.error("error parsing", event.data);
//     return
//   }
//   if (data.message_type === 'world_update'){
//     state.world = data.content.blocks
//     show_world()
//   }else if (data.message_type === 'action_response'){
//     let action_promise = action_queue.get(data.action_id)
//     if (!action_promise) {
//       console.error('action not found', data.action_id);
//       console.log(data.error);
//     } else{
//       if (data.error) action_promise.reject(data.content, data.error)
//       else action_promise.resolve(data.content)
//     }
//   }else if (data.message_type === 'ack'){
//     const prom =  action_queue.get(data.action_id)
//     if (prom) pingdisplay.textContent = ' ping: ' + (Date.now() - prom.timestamp) + 'ms'
//   }else{
//     console.error('unknown message type', data);
//   }
// }

// websocket.onopen = () => {
//   try{
//     const p = player.value.position
//     action({action: 'move', x: p.x, y: p.y, endx: p.x, endy: p.y})
//     .catch(error => {
//       if (error === 'player not found') reload_player()
//       if (error === 'block already exists') return
//       console.error('error', error);
//     })
    
//   }catch (e){
//     console.error('error', e);
//     reload_player();
//   }
//   load_script(active_script.value)
// }
