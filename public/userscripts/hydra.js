let color = '#000000'

let sent = false
let dt = 0
let running = false
let interval = 1000/20

direction = [0, 0]

async function walk(){
  if (!running)return
  dt = Date.now()
  await step()
  dt = Date.now() - dt
  setTimeout(()=>walk(), interval)
}

async function step(){

  await scan(player)
  const x = player.position.x
  const y = player.position.y

  let speed = 1
  if (player.energy>90) speed = 2
  const endx = x + direction[0] * speed
  const endy = y + direction[1] * speed
  await tryeat(player,endx, endy)//.then(()=>
  await action({action: 'move', x, y, endx, endy}).catch(e=>{console.log("walk error:",e)}).then(e=>{
    if (e.energy>50){
      var color = '#220000'
      action({action:'put', color, x,y}).catch(console.error)
    }
  })
}

async function tryeat(self,x,y){
  if (state.world[x][y] != null && (player.position.x != x || player.position.y != y))
    return await action({action:'delete', x, y}, self).catch(e=>console.error('eat error:',e))
}


async function scan(bullet){
  const range = 5
  for (let dx = -range; dx <= range; dx++){
    for (let dy = -range; dy <= range; dy++){
      nx = bullet.position.x+dx
      ny = bullet.position.y+dy
      if((dx==0 && dy==0) || nx<0 || ny<0 || nx>=state.world.length || ny>=state.world.length) continue
      if (state.world[nx][ny] == '#ff0000' || bullet.energy < 80) await tryeat(bullet, nx, ny)
    }
  }
}

async function shoot(){

  let dir = [...lastdirection]
  if (!dir[0] && !dir[1]) dir= [1,0]
  x = player.position.x+dir[0]
  y = player.position.y+dir[1]
  await tryeat(player, x,y)
  action({action: 'put', color: color, x, y, energy:50}).then(bullet=>{
    async function fly (bullet){
      let endx = bullet.position.x+dir[0]*2
      let endy = bullet.position.y+dir[1]*2
      
      const range = 5
      await scan(bullet)
      await tryeat(bullet, endx, endy)
      action({action: 'move', x: bullet.position.x, y: bullet.position.y, endx, endy}, bullet).catch(e=>console.error('move error',e))
      .then(fly)
      .catch(e=>{})
    }
    fly(bullet )
  })

}

const keymap = new Map(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].map(key=>[key, false]))

function setkeymap(key, active){
  keymap.set(key, active)
  direction = [keymap.get('ArrowRight') - keymap.get('ArrowLeft'), keymap.get('ArrowDown') - keymap.get('ArrowUp')]  
  if (direction[0] || direction[1]){
    lastdirection = [...direction]
    if (!running){
      running = true
      walk()
    }
  }else{
    running = false
  }
}

document.addEventListener('keydown', e => {
  if (e.key.startsWith("Arrow"))e.preventDefault()
  setkeymap(e.key, true)
})

var lastdirection = direction.slice()
document.addEventListener('keyup', e => {
  setkeymap(e.key, false)
  if (e.key == ' ') shoot()
})