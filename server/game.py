import random, time
from dataclasses import dataclass

world_size = 100

secret = random.randint(0, 1e10)
world = [[None for i in range(world_size)] for j in range(world_size)]

@dataclass
class Position:
  x: int
  y: int
  def get(self): return world[self.x][self.y]


@dataclass
class Color:
  r: int
  g: int
  b: int

  def fromhex(hex_str:str):
    hex_str = hex_str.lstrip('#')
    return Color(*[int(hex_str[i:i+2], 16) for i in (0, 2, 4)])
  
  @staticmethod
  def red(): return Color(255, 0, 0)

  def tohex(self): return f'#{self.r:02x}{self.g:02x}{self.b:02x}'

class Block:
  def __init__(self, pos:Position, color:Color):
    self.position = pos
    self.color = color
    world[pos.x][pos.y] = self
  
  def move(self, x, y):
    if world[x][y] is not None: return False
    world[self.position.x][self.position.y] = None
    self.position = Position(x, y)
    world[x][y] = self
    return True
  
  def delete(self): world[self.position.x][self.position.y] = None


class Player:
  def __init__(self):
    cleanup()
    self.id = str(abs(hash((len(players), secret))))
    players[self.id] = self
    position = Position(random.randint(0, world_size), random.randint(0, world_size))
    while position.get() is not None: position = Position(random.randint(0, world_size), random.randint(0, world_size))
    self.body = Block(position, Color.red())
    self.energy = 100
    self.last_update = time.time()

  def get_energy(self):
    self.energy += (time.time() - self.last_update) * 10
    self.last_update = time.time()
    if self.energy > 100: self.energy = 100
    return self.energy
  
  def info(self):
    return {
      'id': self.id,
      'position': self.body.position,
      'energy': self.energy
    }
  
  def action(self, payload):
    actiontype = payload['action']
    cost = {'put': 10, 'move': 1, 'delete': 5}.get(actiontype, 0)
    if self.get_energy() < cost: return 'Not enough energy', 400
    self.energy -= cost
    if actiontype == 'put':
      x, y = payload['x'], payload['y']
      color = payload['color']
      block = Block(Position(x, y), Color.fromhex(color))
    elif actiontype == 'move':
      startx, starty = payload['startx'], payload['starty']
      endx, endy = payload['endx'], payload['endy']
      if world[startx][starty] is None: return 'No block at starting position', 400
      if world[endx][endy] is not None: return 'Block already at ending position', 400
      world[startx][starty].move(endx, endy)
    elif actiontype == 'delete':
      x, y = payload['x'], payload['y']
      if world[x][y] is None: return 'No block at position', 400
      world[x][y].delete()
    return self.info(), 200

def cleanup():
  for player in list(players.values()):
    if player.get_energy() < 0 or player.body.position.get() is not player.body or player.last_update + 3600 < time.time():
      player.body.delete()
      del players[player.id]

players:dict[str, Player] = {}