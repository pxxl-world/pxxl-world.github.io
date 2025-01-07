
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
  await action({action: 'move', x, y, endx, endy})
  lock = false
}

async function create (x, y, color){
  return await action({action: 'put', x:x, y:y, color})
}

async function eat (x, y){
  return await action({action: 'delete', x:x, y:y})
}

async function shoot(x,y){
  action({action: 'spawn', x, y, color: '#ffffff'}).then(fly)

  function fly (bullet){
    if (!bullet) return
    console.log(bullet.energy);
    
    action(
      {action: 'move', ...bullet.position, endx: bullet.position.x, endy: bullet.position.y+1}, bullet

    ).then(fly)
  }
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
  if (e.key === ' ') shoot(state.player.position.x, state.player.position.y+1)
})
