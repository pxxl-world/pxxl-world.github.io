
// peter script

async function walk(dx, dy){

  const startx = state.player.position.x
  const starty = state.player.position.y
  const endx = startx + dx
  const endy = starty + dy
  action({action: 'move', startx, starty, endx, endy})
}

async function create (x, y, color){
  action({action: 'put', x: state.player.position.x+x, y: state.player.position.y+y, color})
}

let green = '#00ff00'



create(1,0,green)
create(0,1,green)
create(-1,0,green)
create(0,-1,green)

let speed = 2

document.addEventListener('keydown', e => {
  if(e.key === 'ArrowUp') walk(0, -speed)
  if(e.key === 'ArrowDown') walk(0, speed)
  if(e.key === 'ArrowLeft') walk(-speed, 0)
  if(e.key === 'ArrowRight') walk(speed, 0)
})
