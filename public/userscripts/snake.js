
let green = '#00ff00'

let tail = []


async function walk(dx, dy){

  const x = state.player.position.x
  const y = state.player.position.y
  const endx = x + dx
  const endy = y + dy
  console.log(await action({action: 'move', x, y, endx, endy}));
  await create(x,y, green)
}

async function create (x, y, color){
  return await action({action: 'put', x:x, y:y, color})
}


let speed = 1

document.addEventListener('keydown', e => {
  console.log(e.key, script_counter);
  if(e.key === 'ArrowUp') walk(0, -speed)
  if(e.key === 'ArrowDown') walk(0, speed)
  if(e.key === 'ArrowLeft') walk(-speed, 0)
  if(e.key === 'ArrowRight') walk(speed, 0)
})
