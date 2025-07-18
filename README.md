# pixel based full scriptable magic game

try out https://pxxl-world.github.io

code you character, play on server

# Character Scripting Documentation

Welcome to the character scripting documentation for the game! This guide will help you create and customize your own character behaviors using JavaScript.

## Quickstart

click on Show Code in the top left, select one of the Available characters, maybe edit its code and click play in the top left again to use the character. If you die you can click Reset Player.

## Available Characters

The game comes with several pre-built character scripts that you can use as examples:
- `snake`: A basic character that moves around
- `pan`: A gray character with shooting capabilities
- `snake`: A green moving character
- `eater`: A character that eats other blocks
- `hydra`: A black character with shooting abilities
- `misterX`: A red character with shooting capabilities


## Available Functions

### `action(params, actor)`

The main function for performing actions in the game. Parameters include:

- `action`: The type of action to perform ("move", "put", "delete", "info")
- `x`, `y`: Starting coordinates
- `endx`, `endy`: Ending coordinates (for move actions)
- `color`: Color for "put" actions
- `energy`: Energy value for "put" actions

Example usage:
```javascript
// Move character
await action({
    action: 'move',
    x: player.position.x,
    y: player.position.y,
    endx: x + direction[0] * speed,
    endy: y + direction[1] * speed
})

// Place a block
await action({
    action: 'put',
    color: '#ff0000',
    x: player.position.x,
    y: player.position.y,
    energy: 50
})
```


## Player Properties

The `player` object contains the following properties:
- `position`: Object with `x` and `y` coordinates
- `energy`: Current energy level
- `id`: Unique player ID

## State Information

The `state` object provides access to the game world:
- `state.world`: 2D array representing the game world

## Example Script

Here's a complete example of a basic character script:

```javascript
let color = '#00ff00'
let speed = 1
let interval = 1000/20
let direction = [0, 0]

function setkeymap(key, active) {
    keymap.set(key, active)
    direction = [keymap.get('ArrowRight') - keymap.get('ArrowLeft'), 
                keymap.get('ArrowDown') - keymap.get('ArrowUp')]
    if (direction[0] || direction[1]) {
        if (!running) {
            running = true
            walk()
        }
    } else {
        running = false
    }
}

async function step() {
    const x = player.position.x
    const y = player.position.y
    const endx = x + direction[0] * speed
    const endy = y + direction[1] * speed
    
    await action({
        action: 'move',
        x, y, endx, endy
    })
    .then(() => action({
        action: 'put',
        color: color,
        x, y
    }))
    .catch(e => console.log("walk error:", e))
}

async function walk() {
    if (!running) return
    await step()
    setTimeout(walk, interval)
}

const keymap = new Map(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].map(key => [key, false]))

// Event listeners
document.addEventListener('keydown', e => {
    if (e.key.startsWith("Arrow")) e.preventDefault()
    setkeymap(e.key, true)
})

document.addEventListener('keyup', e => {
    setkeymap(e.key, false)
})
```
