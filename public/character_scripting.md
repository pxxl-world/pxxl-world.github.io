# Character Scripting Documentation

Welcome to the character scripting documentation for the game! This guide will help you create and customize your own character behaviors using JavaScript.

Your Character Script will send requests to the Server that will let you interact with the Game world.

## Quickstart

click on Show Code in the top left, select one of the Available characters, maybe edit its code and click play in the top left again to use the character. If you die you can click Reset Player.

## Available Characters

The game comes with several pre-built character scripts that you can use as examples:
- `snake`: A basic character that moves around
- `pan`: A basic character shooting character
- `snake` : A snake character that spawns a tail
- `eater`: A snake like character that eats all blocks in front
- `hydra`: A faster more dangerous snake that also shoots
- `misterX`: The fastest and most deadly shooter


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


## Action Rules

Each Player has Up to 100 energy, which regenerates over time

actions cost or gain energy:
  - put: costs 10 energy
  - move: costs 0 energy
  - delete: generates 10 energy

BUT: every action costs more energy the further away you are from the action target. So you cannot just delete every block at once.

