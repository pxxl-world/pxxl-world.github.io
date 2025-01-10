
let color = '#ff4400'
let tail = []

let direction = [1,0]
let speed = 2
let lock = false

async function walk(){
  if (lock) return
  lock = true
  const x = state.player.position.x
  const y = state.player.position.y
  const endx = x + direction[0] * speed
  const endy = y + direction[1] * speed

  if(state.world[endx][endy] != null) await action({action: 'delete', x:endx, y:endy})
  await action({action: 'move', x, y, endx, endy})
  create(x, y, color)
  lock = false
}

async function create (x, y, color){
  return await action({action: 'put', x:x, y:y, color})
}

document.addEventListener('keydown', e => {
  if (e.key.startsWith("Arrow")){
    e.preventDefault()
    if (e.key === 'ArrowUp') direction = [0, -1]
    else if (e.key === 'ArrowDown') direction = [0, 1]
    else if (e.key === 'ArrowLeft') direction = [-1, 0]
    else if (e.key === 'ArrowRight') direction = [1, 0]
    walk()
  }
})

document.addEventListener('keyup', e => {
  if (e.key.startsWith("Arrow")) direction = [0,0]
})
