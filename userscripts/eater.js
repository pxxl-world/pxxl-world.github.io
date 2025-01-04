
let green = '#ff4400'
let tail = []

async function walk(dx, dy){
  
  const x = state.player.position.x
  const y = state.player.position.y
  const endx = x + dx
  const endy = y + dy

  if(state.world[endx][endy] != null) await action({action: 'delete', x:endx, y:endy})
  if (!await action({action: 'move', x, y, endx, endy})) return

  await create(x, y, green)
}

async function create (x, y, color){
  return await action({action: 'put', x:x, y:y, color})
}

let speed = 1


let direction = [0,speed]


setInterval(() => {
  if (direction[0] === 0 && direction[1] === 0) return
  walk(...direction)
}, 100);


document.addEventListener('keydown', e => {
  if (e.key === 'ArrowUp') direction = [0, -speed]
  else if (e.key === 'ArrowDown') direction = [0, speed]
  else if (e.key === 'ArrowLeft') direction = [-speed, 0]
  else if (e.key === 'ArrowRight') direction = [speed, 0]
})
document.addEventListener('keyup', e => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) direction = [0,0]
})
