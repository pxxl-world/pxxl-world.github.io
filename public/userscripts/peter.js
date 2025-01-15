
let color = '#00ff00'

async function create (x, y, color){
  action({action: 'put', x: state.player.position.x+x, y: state.player.position.y+y, color})
}

create(1,0,color)
create(0,1,color)
create(-1,0,color)
create(0,-1,color)

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
  console.log("step");
  const x = state.player.position.x
  const y = state.player.position.y
  const endx = x + direction[0] * speed
  const endy = y + direction[1] * speed
  return action({action: 'move', x, y, endx, endy})
  .catch(e=>{console.log("walk error:",e)})
}


const keymap = new Map([
  ['ArrowUp', false],
  ['ArrowDown', false],
  ['ArrowLeft', false],
  ['ArrowRight', false]
])

document.addEventListener('keydown', e => {
  if (keymap.has(e.key)){
    e.preventDefault()
    keymap.set(e.key, true)
    direction[0] = (keymap.get('ArrowRight') - keymap.get('ArrowLeft'))
    direction[1] = (keymap.get('ArrowDown') - keymap.get('ArrowUp'))
    if (!running){
      running = true
      walk()
    }
  }
})

document.addEventListener('keyup', e => {
  if (keymap.has(e.key)){
    keymap.set(e.key, false)
    direction[0] = (keymap.get('ArrowRight') - keymap.get('ArrowLeft'))
    direction[1] = (keymap.get('ArrowDown') - keymap.get('ArrowUp'))
    if (!direction[0] && !direction[1]) running = false
  }
})
