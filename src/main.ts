import { Writable } from './store'
import { ActionResultVariant, ActionType, DbConnection, EventContext, GameAction, Person, PutAction, ReducerEventContext, Tile } from './module_bindings';

import { UserFunction } from './userspace';


const app = document.querySelector<HTMLDivElement>('#app')!


let dbtoken = new Writable("dbtoken", "")

import { int2color, int2pos, makestate, State, world_size } from './world';

DbConnection.builder()
.withUri("ws://localhost:3000")
.withModuleName("pixel")
.withToken(dbtoken.value)
.onConnect((connect, id, token )=>{


  let actionid = 0;
  console.log("connected.");
  dbtoken.set(token)
  let actionqueue = new Map<number, (r:ActionResultVariant)=>void> ()

  const onPersonChange = (p:Person)=>{

    let res = p.result
    if (!res) return
    
    let handle = actionqueue.get(res.id)
    if (!handle) return
    handle(res.result)
  }

  connect.subscriptionBuilder()
  .onApplied(c=>{
    const send_action = (action:GameAction)=>{
      action.player = bod.id
      return new Promise<void>((resolve, reject)=>{
        actionqueue.set(action.id, res=>{
          if (res.tag == "Ok"){ resolve() }
          else { reject(res.value) }
        })
        connect.reducers.requestAction(action)
      })
    }
    let state = makestate(send_action)
    connect.reducers.spawn();
    connect.subscriptionBuilder()
    .onApplied(c=>{
      c.db.tile.onInsert((c,i) => {
        state.world.setPixel(int2pos(i.pos), i)
      })
      c.db.tile.onUpdate((u,o,n) => {
        state.world.setPixel(int2pos(o.pos), null);
        state.world.setPixel(int2pos(n.pos), n)
      })
      c.db.tile.onDelete((d, old) => {
        state.world.setPixel(int2pos(old.pos), null)
      })
    })
    .onError(console.error)
    .subscribe(`SELECT * FROM tile`)
  
  
  

    c.db.person.onInsert((c,p)=>onPersonChange(p))
    c.db.person.onUpdate((c,o,n)=>onPersonChange(n))
    let player = c.db.person.conn.find(id)!
    let bod = c.db.tile.id.find(player.bodytile)!
    const move = () => {
      bod.pos += 1;
      send_action({
        "player": bod.id,
        "pos": bod.pos,
        "typ": {"tag": "Move"},
        "id" : actionid ++,
      })
      .then(move)
      .catch(e=>console.error("action error:",e))
    }
    move()
  })
  .onError(console.error)
  .subscribe(`SELECT * FROM person WHERE conn == '${id.toHexString()}'`)

})

.onConnectError(e=>console.error(e))
.build()


export function button(text:string){
  const button = document.createElement('button')
  button.innerText = text
  app.appendChild(button)
  return button
}



const codebutton = button('Show Code')


const canvas = document.createElement('canvas')
const csize = Math.min(window.innerWidth,window.innerHeight)-codebutton.clientHeight-10
canvas.width = csize
canvas.height = csize
app.appendChild(canvas)
const ctx = canvas.getContext('2d')!
const player = new Writable('player', {position:{x:0, y:0}, energy:0, id:"0"})
const addPermanentEventListener = document.addEventListener.bind(document);


codebutton.onclick = () => {window.location.href = '/code'}

addPermanentEventListener('keyup', e => {
  if(e.key === 'Escape') codebutton.click()
})

const block_size = canvas.width / world_size




function draw_block(x:number, y:number, color:string){
  ctx.fillStyle = color
  ctx.fillRect(x * block_size, y * block_size, block_size, block_size)
}
function draw_world(pixels: (null | string)[][]){
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  pixels.forEach((row, x) => row.forEach((color, y) => {    
    if(color !== null)draw_block(x, y, color)
  }))
}

