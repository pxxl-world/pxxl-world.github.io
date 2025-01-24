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

function step(){
  const x = player.position.x
  const y = player.position.y
  let speed = 1
  if (player.energy>90) speed = 2
  const endx = x + direction[0] * speed
  const endy = y + direction[1] * speed

  return action({action: 'move', x, y, endx, endy})
  .catch(e=>{console.log("walk error:",e)})
  .then(e=> {
    if (e.energy>50){
      var color = '#ff0000'
      if (e.energy>70) color = '#ff8800'
      if (e.energy>80) color = '#ffff00'
      if (e.energy>85) color = '#88ff00'
      if (e.energy>90) color = '#00ff00'

      action({action:'put', color, x,y}).catch(console.error)
    }
  })
}


function shoot(){

  let dir = [...lastdirection]
  if (!dir[0] && !dir[1]) dir= [1,0]
  action({action: 'put', color: color, x: player.position.x+dir[0], y: player.position.y+dir[1], energy:50}).then(bullet=>{



    async function fly (bullet){
      let endx = bullet.position.x+dir[0]*2
      let endy = bullet.position.y+dir[1]*2
      if (state.world[endx][endy] != null) await action({action: 'delete', x: endx, y: endy}, bullet).catch(console.error)

      const range = 5
      for (let dx = -range; dx <= range; dx++){
        for (let dy = -range; dy <= range; dy++){
          nx = bullet.position.x+dx
          ny = bullet.position.y+dy
          if (nx == player.position.x || ny == player.position.y)continue
          if (state.world[nx][ny] == '#ff0000') await action({action: 'delete', x: nx, y: ny}, bullet).catch(console.error)
          if (state.world[nx][ny] != null && bullet.energy < 50) await action({action: 'delete', x: nx, y: ny}, bullet).catch(console.error)
        }
      }


      action({action: 'move', x: bullet.position.x, y: bullet.position.y, endx, endy}, bullet).catch(console.error)
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