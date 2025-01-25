let color = '#00ff00'
let speed = 1

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
  const endx = x + direction[0] * speed
  const endy = y + direction[1] * speed
  return action({action: 'move', x, y, endx, endy})
  .then(()=>{action({action:'put', color:color, x, y})})
  .catch(e=>{console.log("walk error:",e)})
  if(state)
}

const keymap = new Map(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].map(key=>[key, false]))

function setkeymap(key, active){
  keymap.set(key, active)
  direction = [keymap.get('ArrowRight') - keymap.get('ArrowLeft'), keymap.get('ArrowDown') - keymap.get('ArrowUp')]  
  if (direction[0] || direction[1]){
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

document.addEventListener('keyup', e => {
  setkeymap(e.key, false)
})
