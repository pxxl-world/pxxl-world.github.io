
let color = '#ff4400'
let tail = []

let direction = [1,0]
let speed = 1
let lock = true


async function walk(){
  if (lock) return
  const x = state.player.position.x
  const y = state.player.position.y
  const endx = x + direction[0] * speed
  const endy = y + direction[1] * speed
  await action({action: 'move', x, y, endx, endy})
}

async function create (x, y, color){
  return await action({action: 'put', x:x, y:y, color})
}

async function eat (x, y){
  return await action({action: 'delete', x:x, y:y})
}

async function shoot(x,y,dx,dy){
  let bullet = await action({action: 'spawn', x, y, color: '#888888'})
  async function fly (bullet){
    if (!bullet) return
    let nx = bullet.position.x+dx
    let ny = bullet.position.y+dy
    if (state.world[nx][ny] != null){
      await action({action: 'delete', x: nx, y: ny}, bullet)
    }
    bullet = await action({action: 'move', ...bullet.position, endx: nx, endy: ny}, bullet)
    fly(bullet)
  }
  fly(bullet)
}

setInterval(() => {
  walk()
}, 100);


document.addEventListener('keydown', e => {
  if (e.key.startsWith("Arrow")){
    lock = false
    e.preventDefault()
    if (e.key === 'ArrowUp') direction = [0, -1]
    else if (e.key === 'ArrowDown') direction = [0, 1]
    else if (e.key === 'ArrowLeft') direction = [-1, 0]
    else if (e.key === 'ArrowRight') direction = [1, 0]
  }
})


document.addEventListener('keyup', e => {
  if (e.key.startsWith("Arrow")) lock = true
  if (e.key === ' ') {
    let [dx,dy] = direction
    shoot(state.player.position.x+dx, state.player.position.y+dy, dx, dy)
  }
})
