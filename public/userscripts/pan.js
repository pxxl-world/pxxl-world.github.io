
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
  await action({action: 'move', x, y, endx, endy}).catch(e=>{
    console.error("walk error:",e)
  })
}

async function create (x, y, color){
  return await action({action: 'put', x:x, y:y, color})
}

async function eat (x, y){
  return await action({action: 'delete', x:x, y:y})
}

async function shoot(x,y,dx,dy){
  async function fly(bullet){

    let x = bullet.position.x
    let y = bullet.position.y
    let endx = x+dx
    let endy = y+dy
    action({action: 'move', x, y, endx, endy}, bullet)
    .then(fly)
    .catch(e=>{})
  }
  console.log("shoot",state.player.energy);
  
  let bullet = await action({action: 'put', x, y, color: '#888888', energy: state.player.energy-15})

  fly(bullet)
}

setInterval(() => {
  walk()
}, 100);


document.addEventListener('keydown', e => {
  if (e.key.startsWith("Arrow")){
    e.preventDefault()
    if (e.key === 'ArrowUp') direction = [0, -1]
    else if (e.key === 'ArrowDown') direction = [0, 1]
    else if (e.key === 'ArrowLeft') direction = [-1, 0]
    else if (e.key === 'ArrowRight') direction = [1, 0]
    walk()
    lock = false
  }
})


document.addEventListener('keyup', e => {
  if (e.key.startsWith("Arrow")) lock = true
  if (e.key === ' ') {
    let [dx,dy] = direction
    shoot(state.player.position.x+dx, state.player.position.y+dy, dx, dy)
  }
})
