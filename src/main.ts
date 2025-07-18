import { Writable } from './store'
import { active_script } from './scripting'
import { ActionResultVariant, ActionType, DbConnection, EventContext, GameAction, Person, PutAction, ReducerEventContext, Tile } from './module_bindings';

// let backend_url = (window.location.hostname === 'localhost')?`http://localhost:5000`:"https://zmanifold.com"
let backend_url = (window.location.hostname.includes('zmanifold'))?"https://zmanifold.com":'http://'+window.location.hostname+':5000'
const app = document.querySelector<HTMLDivElement>('#app')!


let dbtoken = new Writable("dbtoken", "")


const world_size = 1<<7


type Pos = [number, number]
type Color = [number,number,number]


type State = {
  world:{
    pixels:(null|string) [][],
    subscribe: (fn: (focus: Pos|undefined)=>void)=>void,
  }
  input:{
    ispressed:(s:string)=>boolean,
    subscribe: (fn :(s:string) => void) => void
  }
}


// const world_subscriptions = new Map<number, (x:Tile|null)=>void >()


// const world = (()=>{

//   const pixels = (Array.from({length:world_size}, ()=>Array.from({length:world_size}, ()=>null)) as (Color|null)[][])

//   const subscritions = new Map<number, ((x:Tile|null)=>void)[]>()


//   const state = {
//     pixels,
//     subscribe: (focus:Pos|undefined fn: (focus: Pos|undefined)=>void)=>{  

//       subscritions()

//     }
//   }

//   return {
//     set:(pos:Pos, color:Color|null)=>{
//       pixels[pos[0]][pos[1]] = color
//     }



//   }

// })()



state : State = 



DbConnection.builder()
.withUri("ws://localhost:3000")
.withModuleName("pixel")
.withToken(dbtoken.value)
.onConnect((connect, id, token )=>{
  let actionid = 0;
  console.log("connected.");
  dbtoken.set(token)
  connect.reducers.spawn();
  connect.subscriptionBuilder()
  .onApplied(c=>{
    c.db.tile.onInsert(i => update_world(i))
    c.db.tile.onUpdate((u,o,n) => {
      let [x,y] = int2pos(o.pos);
      state.world[x][y] = null
      // update_world(u)
      state.world
    })
    c.db.tile.onDelete((d, old) => {
      let [x,y] = int2pos(old.pos);
      state.world[x][y] = null
    })
  })
  .onError(console.error)
  .subscribe(`SELECT * FROM tile`)


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

  const send_action = (action:GameAction)=>{
    return new Promise<void>((resolve, reject)=>{

      actionqueue.set(action.id, res=>{

        if (res.tag == "Ok"){ resolve() }
        else { reject(res.value) }

      })
      console.log("action request send");
      
      connect.reducers.requestAction(action)
    })
  }

  // connect.reducers.onRequestAction(c=>{})
  // connect.reducers.onInvokeScheduled(c=>{})

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
  k >>= 8
  let b = k & 255;
  k >>= 8
  let g = k & 255;
  k >>= 8
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


